const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A user-defined folder of saved discussions. Collections only contain posts
// the owner has bookmarked, and are removed when that bookmark is removed.
const CollectionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  // Lowercased shadow of `name` used by the unique index, so "Work" and
  // "work" are the same folder even if two requests race past the pre-check.
  nameKey: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'posts'
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

CollectionSchema.index({ user: 1, nameKey: 1 }, { unique: true });

module.exports = Collection = mongoose.model('collection', CollectionSchema);
