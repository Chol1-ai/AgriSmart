const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  region: { type: String, default: '' },
  category: { type: String, enum: ['advice', 'disease', 'marketplace', 'equipment', 'weather'], default: 'advice' },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'published', 'hidden'], default: 'published' },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunityPost', communityPostSchema);
