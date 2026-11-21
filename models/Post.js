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
  // People following this discussion. They get a notification for new
  // comments/replies without having to take part in the thread themselves.
  subscribers: [
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
  // The comment the post author has marked as the accepted answer to their
  // discussion. Null when nothing has been accepted yet.
  acceptedComment: {
    type: Schema.Types.ObjectId,
    default: null
  },
  // Optional community poll attached to a discussion. Voter ids stay on the
  // server; API responses expose only counts and the viewer's own choice.
  poll: {
    question: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100
        },
        votes: [
          {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        ]
      }
    ],
    closed: {
      type: Boolean,
      default: false
    }
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
      },
      // Set the first time the comment's text is edited, so readers can tell
      // the discussion has been revised.
      editedAt: {
        type: Date,
        default: null
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  },
  editedAt: {
    type: Date,
    default: null
  }
});

module.exports = Post = mongoose.model('post', PostSchema);
