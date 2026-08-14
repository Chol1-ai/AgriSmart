const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../app');
const connectDatabase = require('../config/database');
const User = require('../models/User');

test('admin can create course and user can enroll and complete lesson', async () => {
  await connectDatabase();
  const adminEmail = 'admin@example.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: 'Admin User', email: adminEmail, password: 'Admin@1234', role: 'admin' });
  }
  const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'Admin@1234' });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.token;

  // create course
  const coursePayload = { title: 'Test Course', description: 'Test desc', lessons: [{ title: 'L1', content: 'c1' }, { title: 'L2', content: 'c2' }], xpReward: 20, badgeOnComplete: 'Starter' };
  const createResp = await request(app).post('/api/admin/academy/courses').set('Authorization', `Bearer ${adminToken}`).send(coursePayload);
  assert.equal(createResp.status, 201);
  const course = createResp.body;

  // register student
  const studentEmail = `student${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({ name: 'Student', email: studentEmail, password: 'Student1!', role: 'farmer' });
  assert.equal(reg.status, 201);
  const studentToken = reg.body.token;

  // enroll
  const enroll = await request(app).post(`/api/academy/enroll/${course._id}`).set('Authorization', `Bearer ${studentToken}`);
  assert.equal(enroll.status, 201);

  // complete first lesson
  const lessonId = course.lessons[0]._id;
  const complete = await request(app).post(`/api/academy/lesson/${course._id}/${lessonId}/complete`).set('Authorization', `Bearer ${studentToken}`);
  assert.equal(complete.status, 200);

});
