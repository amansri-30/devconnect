const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  from: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  type: {
    type: String,
    enum: ['follow', 'like', 'comment', 'comment_like'],
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'posts'
  },
  read: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Notification = mongoose.model(
  'notification',
  NotificationSchema
);