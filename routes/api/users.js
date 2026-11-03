const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { JWT_SECRET } = require('../../config/keys');
const { normalizeEmail, emailMatch } = require('../../util/email');

// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({ message: 'Users works' }));

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').trim().isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    // A whitespace-only name passes the raw `not().isEmpty()` check but would
    // fail schema validation, so reject it with a helpful message instead.
    if (!name) {
      return res.status(400).json({ errors: [{ msg: 'Name is required' }] });
    }

    try {
      // See if user exists. Check the canonical spelling first, then fall back
      // to a case-insensitive match so legacy "User@Example.com" accounts can
      // never be duplicated by a new registration.
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.findOne({ email: emailMatch(email) });
      }

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // Get user's gravatar
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm' // default
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      // A one-hour token logged active users out mid-session. A week matches
      // the client's expectation that "remember me" persists across visits.
      jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) throw err;
        // Include the new user so registration can complete without a second
        // request (which could fail transiently and drop the new session).
        return res.json({
          token,
          user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            date: user.date
          }
        });
      });
    } catch (err) {
      console.error(err.message);

      // Two simultaneous registrations can both pass the existence check; the
      // unique index then rejects one. Report it as a normal duplicate instead
      // of a server error.
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      return res.status(500).send('Server error');
    }
  }
);

module.exports = router;
