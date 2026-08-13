const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  answerIndex: { type: Number, default: 0 },
  points: { type: Number, default: 10 }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  quiz: { type: [quizQuestionSchema], default: [] }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  lessons: { type: [lessonSchema], default: [] },
  xpReward: { type: Number, default: 100 },
  badgeOnComplete: { type: String, default: 'Knowledge Farmer' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
