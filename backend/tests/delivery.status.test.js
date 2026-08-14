const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../app');
const connectDatabase = require('../config/database');
const User = require('../models/User');

test('delivery agent can update assigned order status through lifecycle', async () => {
  await connectDatabase();

  // ensure admin
  const adminEmail = 'admin@example.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: 'Admin User', email: adminEmail, password: 'Admin@1234', role: 'admin' });
  }

  // login admin
  const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'Admin@1234' });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.token;

  // create delivery agent
  const agentEmail = `agent${Date.now()}@example.com`;
  const createAgent = await request(app).post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Deliverer', email: agentEmail, password: 'AgentPass1!', role: 'delivery', phone: '0712345678' });
  assert.equal(createAgent.status, 201);
  const agent = createAgent.body;

  // login agent
  const agentLogin = await request(app).post('/api/auth/login').send({ email: agentEmail, password: 'AgentPass1!' });
  assert.equal(agentLogin.status, 200);
  const agentToken = agentLogin.body.token;

  // create product as admin
  const productResp = await request(app).post('/api/marketplace/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Delivery Test Item', price: 5.0, category: 'test', description: 'For delivery test' });
  assert.equal(productResp.status, 201);
  const product = productResp.body;

  // create buyer and order
  const buyerEmail = `buyer${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({ name: 'Buyer', email: buyerEmail, password: 'BuyerPass1!', role: 'farmer' });
  assert.equal(reg.status, 201);
  const buyerToken = reg.body.token;

  const orderResp = await request(app).post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ items: [{ productId: product._id, quantity: 1 }], deliveryAddress: 'Testville' });
  assert.equal(orderResp.status, 201);
  const order = orderResp.body;

  // assign agent to order
  const assignResp = await request(app).post(`/api/marketplace/orders/${order._id}/assign`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ agentId: agent._id });
  assert.equal(assignResp.status, 200);
  const assigned = assignResp.body;
  assert.equal(assigned.status, 'assigned');

  // agent updates status to picked -> in_transit -> delivered
  const statuses = ['picked', 'in_transit', 'delivered'];
  for (const s of statuses) {
    const res = await request(app).post(`/api/marketplace/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: s });
    assert.equal(res.status, 200);
    assert.equal(res.body.order.status, s);
  }
});
