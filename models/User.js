const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const NOTIFICATION_TYPES = require('../util/notificationTypes');

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Categories the user has switched off. `notify()` checks this before
  // writing, so a muted type never reaches the notifications collection.
  mutedNotifications: {
    type: [String],
    enum: NOTIFICATION_TYPES,
    default: []
  },
  // Hashtags the user follows. New posts carrying one of these tags notify
  // them, so they can keep up with a topic without following every author.
  followedTags: {
    type: [String],
    default: [],
    lowercase: true,
    trim: true
  }
});

module.exports = User = mongoose.model('users', UserSchema);
