const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const {
  JWT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET
} = require('../../config/keys');
const moment = require('moment');
const notify = require('../../util/notify');

// Load Profile and User Models
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Notification = require('../../models/Notification');

// Ensure a user-entered URL always has a protocol so it never turns into a
// broken relative anchor on the profile page.
const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// HTML checkboxes submit strings, and older clients may send "false". Normalize
// so only an actually checked "current" box suppresses the end date.
const isCurrentRole = (value) =>
  value === true ||
  value === 'true' ||
  value === 'on' ||
  value === 1 ||
  value === '1';

// Return a valid moment or null. Missing end dates are expected, while an
// unparseable date should be a 400 rather than a Mongoose cast failure (500).
const parseDate = (value) => {
  if (!value) return null;
  const parsed = new moment.utc(value);
  return parsed.isValid() ? parsed : null;
};

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Free-text match for the developer directory. Run after the user lookup so
// names can be searched alongside status/company/skills/location/bio.
const buildProfileSearchMatch = (search) => {
  const term = (search || '').trim();
  if (!term) return null;

  const rx = new RegExp(escapeRegExp(term), 'i');
  return {
    $or: [
      { 'user.name': rx },
      { status: rx },
      { company: rx },
      { location: rx },
      { skills: rx },
      { bio: rx }
    ]
  };
};

// Resolve the optional viewer from a token so the public directory can mark
// which developers the current user already follows.
const getViewerId = (req) => {
  const token = req.header('x-auth-token');
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET).user.id;
  } catch (err) {
    return null;
  }
};

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({ message: 'Profile works' }));

// @route   GET api/profile/leaderboard
// @desc    Get the top developers by follower count
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const top = await Profile.aggregate([
      { $match: { status: { $exists: true, $ne: '' } } },
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ['$followers', []] } }
        }
      },
      { $sort: { followersCount: -1, date: 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'dev'
        }
      },
      { $unwind: '$dev' },
      {
        $project: {
          // Expose the USER id as _id: clients link to /profile/:id and
          // call /api/profile/follow/:user_id with it, not the profile id.
          _id: '$user',
          name: '$dev.name',
          avatar: '$dev.avatar',
          status: 1,
          followersCount: 1
        }
      }
    ]);

    return res.json(top);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/suggestions
// @desc    Suggest developers the current user isn't following yet
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const me = await Profile.findOne({ user: req.user.id }).select('following');
    const followed = (me && me.following) || [];

    // Aggregation pipelines are not cast by Mongoose, so the exclusion must be
    // a real ObjectId — otherwise $ne always passes and you'd suggest yourself.
    const myId = new mongoose.Types.ObjectId(req.user.id);

    const suggestions = await Profile.aggregate([
      {
        $match: {
          user: { $ne: myId, $nin: followed },
          status: { $exists: true, $ne: '' }
        }
      },
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ['$followers', []] } }
        }
      },
      { $sort: { followersCount: -1, date: 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'dev'
        }
      },
      { $unwind: '$dev' },
      {
        $project: {
          // Expose the USER id as _id (see leaderboard above).
          _id: '$user',
          name: '$dev.name',
          avatar: '$dev.avatar',
          status: 1,
          followersCount: 1
        }
      }
    ]);

    return res.json(suggestions);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

// @route   GET api/profile/popular-skills
// @desc    Get the most common skills across all developer profiles
// @access  Public
router.get('/popular-skills', async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 12, 1),
      30
    );

    const skills = await Profile.aggregate([
      { $unwind: '$skills' },
      { $match: { skills: { $nin: [null, ''] } } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$skills' } } },
          label: { $first: { $trim: { input: '$skills' } } },
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: '' } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
      { $project: { _id: 0, label: 1, count: 1 } }
    ]);

    return res.json(skills);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    Get developers (paginated, searchable, sorted)
// @access  Public (includes viewer-specific follow flags when signed in)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 12, 1),
      50
    );
    const skip = (page - 1) * limit;

    const requested = req.query.sort;
    const sort =
      requested === 'followers' || requested === 'name' ? requested : 'recent';
    const sortSpec =
      sort === 'followers'
        ? { followersCount: -1, date: -1 }
        : sort === 'name'
        ? { 'user.name': 1, _id: 1 }
        : { date: -1 };

    const rawViewerId = getViewerId(req);
    const viewerId =
      rawViewerId && mongoose.Types.ObjectId.isValid(rawViewerId)
        ? new mongoose.Types.ObjectId(rawViewerId)
        : null;
    const searchMatch = buildProfileSearchMatch(req.query.search);

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ];

    if (searchMatch) pipeline.push({ $match: searchMatch });

    pipeline.push(
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ['$followers', []] } },
          followingCount: { $size: { $ifNull: ['$following', []] } },
          isFollowing: viewerId
            ? { $in: [viewerId, { $ifNull: ['$followers', []] }] }
            : false,
          isSelf: viewerId ? { $eq: ['$user._id', viewerId] } : false
        }
      },
      // Never leak credentials through the public directory.
      { $project: { 'user.password': 0, 'user.email': 0, 'user.__v': 0 } },
      {
        $facet: {
          items: [{ $sort: sortSpec }, { $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }]
        }
      }
    );

    const [result] = await Profile.aggregate(pipeline);
    const total =
      result && result.total && result.total[0] ? result.total[0].count : 0;

    res.set({
      'X-Total-Count': String(total),
      'X-Page': String(page),
      'X-Per-Page': String(limit)
    });

    return res.json(result ? result.items : []);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public (includes isFollowing when a valid token is supplied)
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Resolve the viewer once (if signed in): used for both follow state and
    // deciding whether this request counts as a profile view.
    let viewerId = null;
    const token = req.header('x-auth-token');

    if (token) {
      try {
        viewerId = jwt.verify(token, JWT_SECRET).user.id;
      } catch (err) {
        // Missing/invalid token simply means "not following" / anonymous view.
      }
    }

    // Count a view from everyone except the profile's own owner. Use an atomic
    // $inc instead of read-modify-write so simultaneous views can't overwrite
    // each other and lose counts.
    const ownerId = profile.user ? profile.user._id.toString() : null;
    if (viewerId !== ownerId) {
      const updatedProfile = await Profile.findByIdAndUpdate(
        profile._id,
        { $inc: { views: 1 } },
        { new: true }
      );

      if (updatedProfile) profile.views = updatedProfile.views;
    }

    let isFollowing = false;
    let followsYou = false;

    if (viewerId) {
      const followers = (profile.followers || []).map((f) => f.toString());
      const following = (profile.following || []).map((f) => f.toString());
      isFollowing = followers.includes(viewerId);
      followsYou = following.includes(viewerId);
    }

    return res.json({
      profile,
      isFollowing,
      followsYou,
      followersCount: (profile.followers || []).length,
      followingCount: (profile.following || []).length
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    return res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/follow/:user_id
// @desc    Follow or unfollow another user
// @access  Private
router.put('/follow/:user_id', auth, async (req, res) => {
  try {
    if (req.params.user_id === req.user.id) {
      return res.status(400).json({ msg: "You can't follow yourself" });
    }

    // Following is recorded on BOTH profiles, so the follower needs one of
    // their own — otherwise the follow is applied to the target but silently
    // lost from the follower's "following" list.
    const me = await Profile.findOne({ user: req.user.id });

    if (!me) {
      return res
        .status(400)
        .json({ msg: 'Create a profile before following other developers' });
    }

    const target = await Profile.findOne({ user: req.params.user_id });

    if (!target) {
      return res.status(404).json({ msg: 'No profile found' });
    }

    const followerIndex = (target.followers || []).findIndex(
      (f) => f.toString() === req.user.id
    );
    const wasFollowing = followerIndex !== -1;

    if (wasFollowing) {
      target.followers.splice(followerIndex, 1);
    } else {
      target.followers.push(req.user.id);
      notify({ recipient: target.user, from: req.user.id, type: 'follow' });
    }

    // Maintain my own "following" list for the Following page, basing the
    // change on my list (not the target's) so any past desync self-heals.
    const followingIndex = (me.following || []).findIndex(
      (f) => f.toString() === req.params.user_id
    );

    if (wasFollowing) {
      if (followingIndex !== -1) me.following.splice(followingIndex, 1);
    } else if (followingIndex === -1) {
      me.following.push(req.params.user_id);
    }

    await me.save();
    await target.save();

    return res.json({
      following: !wasFollowing,
      followers: (target.followers || []).length
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No profile found' });
    }
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/followers/:user_id
// @desc    Get the followers of any user
// @access  Public
router.get('/followers/:user_id', async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.user_id)) {
      return res.status(404).json({ msg: 'No user found' });
    }

    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('followers', ['name', 'avatar']);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    return res.json(profile.followers || []);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/following/:user_id
// @desc    Get the users a given user follows
// @access  Public
router.get('/following/:user_id', async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.user_id)) {
      return res.status(404).json({ msg: 'No user found' });
    }

    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('following', ['name', 'avatar']);

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    return res.json(profile.following || []);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/followers
// @desc    Get the users who follow the current user (with mutual-follow flag)
// @access  Private
router.get('/followers', auth, async (req, res) => {
  try {
    const me = await Profile.findOne({ user: req.user.id })
      .select('followers following')
      .populate('followers', ['name', 'avatar']);

    if (!me) {
      return res.json([]);
    }

    const followingSet = new Set(
      (me.following || []).map((id) => id.toString())
    );

    return res.json(
      (me.followers || []).map((f) => ({
        _id: f._id,
        name: f.name,
        avatar: f.avatar,
        isFollowing: followingSet.has(f._id.toString())
      }))
    );
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/following
// @desc    Get the users the current user follows
// @access  Private
router.get('/following', auth, async (req, res) => {
  try {
    const me = await Profile.findOne({ user: req.user.id }).populate(
      'following',
      ['name', 'avatar']
    );

    if (!me) {
      return res.json([]);
    }

    return res.json(me.following || []);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   POST api/profile
// @desc    Create/update user's profile
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    // The profile form always submits every field, sending an empty string when
    // the user clears one. Test for presence rather than truthiness so clearing
    // a field actually clears it instead of silently keeping the old value.
    if (req.body.company !== undefined)
      profileFields.company = req.body.company;
    if (req.body.website !== undefined)
      profileFields.website = req.body.website
        ? normalizeUrl(req.body.website)
        : '';
    if (req.body.location !== undefined)
      profileFields.location = req.body.location;
    if (req.body.bio !== undefined) profileFields.bio = req.body.bio;
    if (req.body.status !== undefined) profileFields.status = req.body.status;
    if (req.body.githubusername !== undefined)
      profileFields.githubusername = req.body.githubusername;

    // skills - split csv into array, dropping blanks and case-insensitive
    // duplicates. A value like ",," must not slip past validation only to fail
    // schema validation with an unhelpful 500.
    if (req.body.skills !== undefined) {
      const seenSkills = new Set();
      profileFields.skills = (req.body.skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => {
          if (!skill) return false;
          const key = skill.toLowerCase();
          if (seenSkills.has(key)) return false;
          seenSkills.add(key);
          return true;
        });

      if (profileFields.skills.length === 0) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Skills is required' }] });
      }
    }

    // social links
    profileFields.social = {};
    ['youtube', 'twitter', 'facebook', 'linkedin', 'instagram'].forEach(
      (field) => {
        if (req.body[field] !== undefined) {
          profileFields.social[field] = req.body[field]
            ? normalizeUrl(req.body[field])
            : '';
        }
      }
    );

    // Guard against the old "0" placeholder value being submitted as a real
    // professional status.
    if (!profileFields.status || profileFields.status === '0') {
      return res.status(400).json({ errors: [{ msg: 'Status is required' }] });
    }

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // Create profile
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, description } = req.body;
    const current = isCurrentRole(req.body.current);

    const from = parseDate(req.body.from);
    if (!from) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'From date is invalid' }] });
    }

    // A missing end date must stay null instead of defaulting to "now" (the
    // old code only compared against "", so an omitted field became today).
    const to = current ? null : parseDate(req.body.to);
    if (!current && req.body.to && !to) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'To date is invalid' }] });
    }

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(404)
          .json({ msg: 'No profile found. Create a profile first.' });
      }

      profile.experience.unshift(newExp);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/profile/education
// @desc    Add education to profile
// @access  Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, description } = req.body;
    const current = isCurrentRole(req.body.current);

    const from = parseDate(req.body.from);
    if (!from) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'From date is invalid' }] });
    }

    const to = current ? null : parseDate(req.body.to);
    if (!current && req.body.to && !to) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'To date is invalid' }] });
    }

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(404)
          .json({ msg: 'No profile found. Create a profile first.' });
      }

      profile.education.unshift(newEdu);

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/profile/experience/:exp_id
// @desc    Edit an experience entry
// @access  Private
router.put(
  '/experience/:exp_id',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(404)
          .json({ msg: 'No profile found. Create a profile first.' });
      }

      const targetIndex = profile.experience
        .map((item) => item.id)
        .indexOf(req.params.exp_id);

      if (targetIndex === -1) {
        return res.status(400).json({ msg: 'Experience entry not found' });
      }

      const { title, company, location, description } = req.body;
      const current = isCurrentRole(req.body.current);

      const from = parseDate(req.body.from);
      if (!from) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'From date is invalid' }] });
      }

      const to = current ? null : parseDate(req.body.to);
      if (!current && req.body.to && !to) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'To date is invalid' }] });
      }

      profile.experience[targetIndex] = {
        ...profile.experience[targetIndex].toObject(),
        title,
        company,
        location,
        from,
        to,
        current,
        description
      };

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/profile/education/:edu_id
// @desc    Edit an education entry
// @access  Private
router.put(
  '/education/:edu_id',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(404)
          .json({ msg: 'No profile found. Create a profile first.' });
      }

      const targetIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.edu_id);

      if (targetIndex === -1) {
        return res.status(400).json({ msg: 'Education entry not found' });
      }

      const { school, degree, fieldofstudy, description } = req.body;
      const current = isCurrentRole(req.body.current);

      const from = parseDate(req.body.from);
      if (!from) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'From date is invalid' }] });
      }

      const to = current ? null : parseDate(req.body.to);
      if (!current && req.body.to && !to) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'To date is invalid' }] });
      }

      profile.education[targetIndex] = {
        ...profile.education[targetIndex].toObject(),
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      };

      await profile.save();

      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Remove experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    if (removeIndex === -1) {
      return res.status(400).json({ msg: 'Experience entry not found' });
    }

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/profile/education/:edu_id
// @desc    Remove education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    if (removeIndex === -1) {
      return res.status(400).json({ msg: 'Education entry not found' });
    }

    profile.education.splice(removeIndex, 1);

    await profile.save();

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   DELETE api/profile
// @desc    Delete profile, user, and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user's posts
    await Post.deleteMany({ user: req.user.id });

    // Remove profile
    await Profile.findOneAndDelete({ user: req.user.id });

    // Remove the user from other users' follow/follower lists
    await Profile.updateMany(
      { followers: req.user.id },
      { $pull: { followers: req.user.id } }
    );
    await Profile.updateMany(
      { following: req.user.id },
      { $pull: { following: req.user.id } }
    );

    // Remove the user's likes, saved posts and comments from other people's
    // posts, so the deleted account leaves no un-removable likes, stale saves
    // or orphaned comments behind.
    await Post.updateMany(
      { 'likes.user': req.user.id },
      { $pull: { likes: { user: req.user.id } } }
    );
    await Post.updateMany(
      { savedBy: req.user.id },
      { $pull: { savedBy: req.user.id } }
    );

    // Remove the account's likes from other people's comments as well. The
    // account is gone, so leaving those likes behind would permanently inflate
    // the comment like counts (and nobody could ever remove them).
    const userId = req.user.id.toString();
    const likedCommentPosts = await Post.find({
      'comments.likes.user': req.user.id
    });

    for (const post of likedCommentPosts) {
      let changed = false;

      for (const comment of post.comments) {
        const likes = comment.likes || [];

        if (
          likes.some((like) => like.user && like.user.toString() === userId)
        ) {
          comment.likes = likes.filter(
            (like) => !like.user || like.user.toString() !== userId
          );
          changed = true;
        }
      }

      if (changed) {
        await post.save();
      }
    }

    // Replies to the deleted user's comments belong to other people, so a
    // simple `$pull` of their comments would leave those replies behind as
    // unreachable orphans (they would still inflate the comment count). Work
    // out the full set of comments to drop, including chained replies, first.
    const commentedPosts = await Post.find({ 'comments.user': req.user.id })
      .select('comments')
      .lean();

    const commentIdsToRemove = [];

    for (const post of commentedPosts) {
      const comments = post.comments || [];
      const doomed = new Set(
        comments
          .filter((c) => c.user && c.user.toString() === userId)
          .map((c) => c._id.toString())
      );

      // Add replies to doomed comments (and replies to those replies).
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (const comment of comments) {
          if (
            comment.parent &&
            !doomed.has(comment._id.toString()) &&
            doomed.has(comment.parent.toString())
          ) {
            doomed.add(comment._id.toString());
            foundNew = true;
          }
        }
      }

      doomed.forEach((id) => commentIdsToRemove.push(id));
    }

    if (commentIdsToRemove.length > 0) {
      const objectIds = commentIdsToRemove.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      await Post.updateMany(
        { 'comments._id': { $in: objectIds } },
        { $pull: { comments: { _id: { $in: objectIds } } } }
      );
    }

    // Drop notifications sent by the deleted account
    await Notification.deleteMany({ from: req.user.id });
    // ...and any it received
    await Notification.deleteMany({ recipient: req.user.id });

    // Remove user
    await User.findByIdAndDelete(req.user.id);

    return res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from GitHub
// @access  Public
router.get('/github/:username', async (req, res) => {
  try {
    const uri = `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created&direction=desc`;

    const githubRes = await fetch(uri, {
      headers: {
        'user-agent': 'devconnect',
        Accept: 'application/vnd.github.v3+json'
      },
      // OAuth credentials are optional and only used to raise the rate limit
      ...(GITHUB_CLIENT_ID &&
        GITHUB_CLIENT_SECRET && {
          headers: {
            'user-agent': 'devconnect',
            Accept: 'application/vnd.github.v3+json',
            Authorization:
              'Basic ' +
              Buffer.from(
                `${GITHUB_CLIENT_ID}:${GITHUB_CLIENT_SECRET}`
              ).toString('base64')
          }
        })
    });

    if (!githubRes.ok) {
      return res.status(404).json({ msg: 'No GitHub profile found' });
    }

    const repos = await githubRes.json();
    return res.json(repos);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
