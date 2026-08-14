const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../app');
const connectDatabase = require('../config/database');
const User = require('../models/User');

test('user can list rewards and redeem when having enough XP', async () => {
  await connectDatabase();
  // create user
  const email = `redeemer${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({ name: 'Redeemer', email, password: 'Redeem1!', role: 'farmer' });
  assert.equal(reg.status, 201);
  const token = reg.body.token;
  const userId = reg.body.user._id || reg.body._id;

  // award XP via admin
  const admin = await User.findOne({ role: 'admin' }) || await User.create({ name: 'Admin', email: 'admin@example.com', password: 'Admin@1234', role: 'admin' });
  const adminLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Admin@1234' });
  const adminToken = adminLogin.body.token;

  await request(app).post(`/api/admin/users/${reg.body.user._id}/award-xp`).set('Authorization', `Bearer ${adminToken}`).send({ amount: 500 });

  // list rewards
  const rewards = await request(app).get('/api/gamification/rewards');
  assert.equal(rewards.status, 200);
  assert.ok(Array.isArray(rewards.body.rewards));

  // redeem first reward
  const rewardId = rewards.body.rewards[0].id;
  const redeemResp = await request(app).post('/api/gamification/redeem').set('Authorization', `Bearer ${token}`).send({ rewardId });
  assert.equal(redeemResp.status, 200);
  assert.equal(redeemResp.body.reward.id, rewardId);
});
