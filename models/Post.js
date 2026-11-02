const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const PostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  text: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  avatar: {
    type: String
  },
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      }
    }
  ],
  savedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'users'
    }
  ],
  views: {
    type: Number,
    default: 0
  },
  // Hashtags parsed out of the post text on write (lowercase, de-duplicated)
  // so the feed can filter by tag without scanning every post body.
  tags: [
    {
      type: String
    }
  ],
  // Only one post per author may be pinned; pinned posts float to the top of
  // the author's profile activity and are highlighted on their cards.
  pinned: {
    type: Boolean,
    default: false
  },
  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      },
      text: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      likes: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        }
      ],
      parent: {
        type: Schema.Types.ObjectId,
        default: null
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Post = mongoose.model('post', PostSchema);
