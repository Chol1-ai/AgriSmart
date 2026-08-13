const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
const app = require('../app');
const connectDatabase = require('../config/database');
const User = require('../models/User');

test('admin can create delivery agent, list agents, create order and assign agent', async () => {
  // ensure DB is connected for this test
  await connectDatabase();
  // ensure default admin exists in test DB
  const adminEmail = 'admin@example.com';
  let existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({ name: 'Admin User', email: adminEmail, password: 'Admin@1234', role: 'admin' });
  }
  // login as admin
  const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: 'Admin@1234' });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.body.token;

  // create a delivery agent via admin API
  const agentEmail = `agent${Date.now()}@example.com`;
  const createAgent = await request(app).post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Delivery Joe', email: agentEmail, password: 'AgentPass1!', role: 'delivery', phone: '0712345678' });
  assert.equal(createAgent.status, 201);
  const agent = createAgent.body;

  // admin lists delivery agents
  const listAgents = await request(app).get('/api/admin/delivery-agents').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(listAgents.status, 200);
  const found = listAgents.body.find(a => a.email === agentEmail);
  assert.ok(found, 'Created agent should be listed');

  // create a product (admin as seller)
  const productResp = await request(app).post('/api/marketplace/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Seed Bag', price: 12.5, category: 'seeds', description: 'Test product' });
  assert.equal(productResp.status, 201);
  const product = productResp.body;

  // register a buyer (farmer) and create an order
  const buyerEmail = `buyer${Date.now()}@example.com`;
  const reg = await request(app).post('/api/auth/register').send({ name: 'Buyer', email: buyerEmail, password: 'BuyerPass1!', role: 'farmer' });
  assert.equal(reg.status, 201);
  const buyerToken = reg.body.token;

  const orderResp = await request(app).post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ items: [{ productId: product._id, quantity: 2 }], deliveryAddress: 'Testville' });
  assert.equal(orderResp.status, 201);
  const order = orderResp.body;

  // admin assigns agent to order
  const assignResp = await request(app).post(`/api/marketplace/orders/${order._id}/assign`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ agentId: agent._id });
  assert.equal(assignResp.status, 200);
  const updated = assignResp.body;
  assert.equal(updated.deliveryAgent.name, 'Delivery Joe');
  assert.equal(updated.status, 'assigned');

  // admin can fetch order and see deliveryAgent snapshot
  const getOrder = await request(app).get(`/api/marketplace/orders/${order._id}`).set('Authorization', `Bearer ${adminToken}`);
  assert.equal(getOrder.status, 200);
  assert.equal(getOrder.body.deliveryAgent.name, 'Delivery Joe');
});
