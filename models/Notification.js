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
    enum: ['follow', 'like', 'comment', 'comment_like', 'reply'],
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'posts'
  },
  // Comments are embedded subdocuments, so store their id to deep-link
  // notifications straight to the relevant comment/reply.
  comment: {
    type: Schema.Types.ObjectId
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