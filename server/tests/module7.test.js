require('dotenv').config();
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Wallet = require('../src/models/Wallet');

let mongoServer;
let adminToken;
let studentToken;
let targetStudentId;
let pendingTxnId;

before(async () => {
  process.env.NODE_ENV = 'test';
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db7';
    await mongoose.connect(fallbackUri);
  }
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }

  // Setup Admin User
  const admin = await User.create({
    name: 'Super Admin Officer',
    mobile: '9900000000',
    password: 'adminpassword123',
    role: 'ADMIN'
  });

  const adminLogin = await request(app).post('/api/auth/login').send({
    identifier: '9900000000',
    password: 'adminpassword123'
  });
  adminToken = adminLogin.body.data.token;

  // Setup Student User
  const student = await User.create({
    name: 'Karan Learner',
    mobile: '9800000000',
    password: 'studentpassword123',
    role: 'STUDENT'
  });
  targetStudentId = student._id.toString();

  const studentLogin = await request(app).post('/api/auth/login').send({
    identifier: '9800000000',
    password: 'studentpassword123'
  });
  studentToken = studentLogin.body.data.token;
});

after(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Module 7: Super Admin Panel & End-to-End System Integration Suite', () => {

  test('1. GET /api/admin/stats — RBAC Security Guard Check (Student Receives 403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('2. GET /api/admin/stats — Admin Fetches Platform Dashboard Metrics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.stats.totalUsers >= 2);
    assert.equal(res.body.data.stats.totalStudents, 1);
  });

  test('3. GET /api/admin/users — Fetch Paginated User List & Search Filter', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=Karan&page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].name, 'Karan Learner');
  });

  test('4. PUT /api/admin/users/:userId/role-status — Admin Updates User Role to TEACHER', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetStudentId}/role-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'TEACHER' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'TEACHER');
  });

  test('5. POST /api/admin/payouts/:id/approve — Admin Approves Pending Educator Royalty Payout', async () => {
    // Create student wallet & pending payout transaction
    const wallet = await Wallet.create({ user: targetStudentId, balance: 500 });
    const txn = await Transaction.create({
      wallet: wallet._id,
      user: targetStudentId,
      amount: 1500,
      type: 'CREDIT',
      category: 'ROYALTY_PAYOUT',
      status: 'PENDING',
      description: 'Teacher monthly royalty payout share'
    });

    pendingTxnId = txn._id.toString();

    const approveRes = await request(app)
      .post(`/api/admin/payouts/${pendingTxnId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.success, true);
    assert.equal(approveRes.body.data.transaction.status, 'SUCCESS');
    assert.equal(approveRes.body.data.updatedWalletBalance, 2000); // 500 + 1500 = 2000
  });

});
