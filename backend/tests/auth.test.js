const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../app');
const { registerValidator } = require('../validators/authValidator');

test('GET /api/health returns ok', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('register validator accepts admin role', () => {
  let nextCalled = false;
  const req = {
    body: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    }
  };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {}
  };

  registerValidator(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});
