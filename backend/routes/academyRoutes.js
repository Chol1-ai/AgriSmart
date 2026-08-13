const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listCourses, getCourse, enroll, completeLesson, submitQuiz, listProgress } = require('../controllers/academyController');

router.get('/courses', listCourses);
router.get('/courses/:id', getCourse);

router.post('/enroll/:courseId', auth, enroll);
router.get('/progress/:courseId', auth, listProgress);
router.post('/lesson/:courseId/:lessonId/complete', auth, completeLesson);
router.post('/lesson/:courseId/:lessonId/quiz', auth, submitQuiz);

module.exports = router;
