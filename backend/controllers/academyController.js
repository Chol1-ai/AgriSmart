const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const { awardXp, addBadge } = require('../services/gamificationService');

exports.listCourses = async (_req, res) => {
  try {
    const courses = await Course.find().select('-lessons.quiz.answerIndex');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Unable to list courses', error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load course', error: error.message });
  }
};

exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.params;
    const existing = await CourseProgress.findOne({ userId: req.user._id, courseId });
    if (existing) return res.status(200).json({ message: 'Already enrolled', progress: existing });
    const progress = await CourseProgress.create({ userId: req.user._id, courseId });
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Unable to enroll', error: error.message });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const lessonExists = course.lessons.id(lessonId);
    if (!lessonExists) return res.status(404).json({ message: 'Lesson not found' });
    const progress = await CourseProgress.findOne({ userId: req.user._id, courseId });
    if (!progress) return res.status(400).json({ message: 'Not enrolled' });
    // mark lesson completed if not already
    if (!progress.completedLessons.map(String).includes(String(lessonId))) {
      progress.completedLessons.push(lessonId);
      // check completion
      if (progress.completedLessons.length >= course.lessons.length) {
        progress.completedAt = new Date();
        await awardXp(req.user._id, Number(course.xpReward || 0));
        if (course.badgeOnComplete) await addBadge(req.user._id, course.badgeOnComplete);
      }
      await progress.save();
    }
    res.json({ message: 'Lesson marked complete', progress });
  } catch (error) {
    res.status(500).json({ message: 'Unable to complete lesson', error: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const answers = req.body.answers || []; // array of selected indices
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const lesson = course.lessons.id(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];
    let score = 0; let maxScore = 0;
    quiz.forEach((q, idx) => {
      maxScore += Number(q.points || 0);
      if (Number(answers[idx]) === Number(q.answerIndex)) score += Number(q.points || 0);
    });
    // award XP proportional to score for this quiz
    const xpEarned = Math.round((score / Math.max(1, maxScore)) * 20); // up to 20 XP per quiz
    if (xpEarned > 0) await awardXp(req.user._id, xpEarned);
    res.json({ score, maxScore, xpEarned });
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit quiz', error: error.message });
  }
};

exports.listProgress = async (req, res) => {
  try {
    const progress = await CourseProgress.findOne({ userId: req.user._id, courseId: req.params.courseId });
    res.json(progress || {});
  } catch (error) {
    res.status(500).json({ message: 'Unable to load progress', error: error.message });
  }
};
