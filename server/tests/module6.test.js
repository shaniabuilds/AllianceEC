require('dotenv').config();
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;
let sponsorToken;
let sponsorUser;
let userBToken;
let userCToken;

before(async () => {
  process.env.NODE_ENV = 'test';
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db6';
    await mongoose.connect(fallbackUri);
  }
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }

  // Register Sponsor User
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Sponsor Leader',
    mobile: '9555555555',
    password: 'sponsorpassword123',
    role: 'STUDENT'
  });

  const otpRes = await request(app).post('/api/auth/verify-otp').send({
    mobile: '9555555555',
    otp: regRes.body.data.otpSimulated
  });

  sponsorToken = otpRes.body.data.token;
  sponsorUser = otpRes.body.data.user;
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

describe('Module 6: Binary MLM Network & Referral Placement Engine Suite', () => {

  test('1. GET /api/mlm/tree — Fetch Initial Binary Tree for Root Sponsor', async () => {
    const res = await request(app)
      .get('/api/mlm/tree')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.tree.id);
    assert.equal(res.body.data.tree.leftLeg, null);
    assert.equal(res.body.data.tree.rightLeg, null);
  });

  test('2. GET /api/mlm/stats — Fetch Affiliate Dashboard Stats', async () => {
    const res = await request(app)
      .get('/api/mlm/stats')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.stats.rank, 'BRONZE');
    assert.equal(res.body.data.stats.placementPreference, 'AUTO');
    assert.ok(res.body.data.stats.referralLink.includes('ref='));
  });

  test('3. PUT /api/mlm/preference — Update Placement Preference to LEFT', async () => {
    const res = await request(app)
      .put('/api/mlm/preference')
      .set('Authorization', `Bearer ${sponsorToken}`)
      .send({ placementPreference: 'LEFT' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.placementPreference, 'LEFT');
  });

  test('4. Register User B with Referral Code — Verify Placement on LEFT Leg', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'User B Left Leg',
      mobile: '9444444444',
      password: 'userbpassword123',
      referredBy: sponsorUser.referralCode
    });

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);

    const treeRes = await request(app)
      .get('/api/mlm/tree')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(treeRes.status, 200);
    assert.ok(treeRes.body.data.tree.leftLeg !== null);
    assert.equal(treeRes.body.data.tree.leftLeg.name, 'User B Left Leg');
  });

  test('5. PUT /api/mlm/preference — Update Placement Preference to RIGHT', async () => {
    const res = await request(app)
      .put('/api/mlm/preference')
      .set('Authorization', `Bearer ${sponsorToken}`)
      .send({ placementPreference: 'RIGHT' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.placementPreference, 'RIGHT');
  });

  test('6. Register User C with Referral Code — Verify Placement on RIGHT Leg', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'User C Right Leg',
      mobile: '9333333333',
      password: 'usercpassword123',
      referredBy: sponsorUser.referralCode
    });

    assert.equal(regRes.status, 201);

    const treeRes = await request(app)
      .get('/api/mlm/tree')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(treeRes.status, 200);
    assert.ok(treeRes.body.data.tree.rightLeg !== null);
    assert.equal(treeRes.body.data.tree.rightLeg.name, 'User C Right Leg');
  });

  test('7. POST /api/mlm/seed — Seed 7-Node Binary Network Tree', async () => {
    const res = await request(app).post('/api/mlm/seed');
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  test('8. GET /api/mlm/stats — Verify Carry-Forward, 1:1 Matching, Capping & 10% Deductions Math', async () => {
    const res = await request(app)
      .get('/api/mlm/stats')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const stats = res.body.data.stats;
    assert.ok(stats.carriedLeftPV >= 0);
    assert.ok(stats.carriedRightPV >= 0);
    assert.equal(stats.matchedPV, Math.min(stats.carriedLeftPV, stats.carriedRightPV));
    assert.equal(stats.grossMatchingBonus, Math.round(stats.matchedPV * 0.1));
    assert.equal(stats.dailyCappingLimit, 25000);
    assert.equal(stats.adminFee, Math.round(stats.cappedGrossBonus * 0.05));
    assert.equal(stats.tdsDeduction, Math.round(stats.cappedGrossBonus * 0.05));
    assert.equal(stats.netPayableBonus, stats.cappedGrossBonus - stats.adminFee - stats.tdsDeduction);
  });

  test('9. POST /api/mlm/payout/execute — Admin Executes Binary Payout & Credits Wallet', async () => {
    // Register Admin User
    const adminReg = await request(app).post('/api/auth/register').send({
      name: 'System Admin MLMPayout',
      mobile: '9991112223',
      password: 'adminpassword123',
      role: 'ADMIN'
    });

    const adminOtp = await request(app).post('/api/auth/verify-otp').send({
      mobile: '9991112223',
      otp: adminReg.body.data.otpSimulated
    });

    const adminToken = adminOtp.body.data.token;

    const res = await request(app)
      .post('/api/mlm/payout/execute')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.processedCount >= 1);
  });

  test('10. GET /api/mlm/payout/history — Fetch Binary Payout Statement Receipt Log', async () => {
    const res = await request(app)
      .get('/api/mlm/payout/history')
      .set('Authorization', `Bearer ${sponsorToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.history));
  });

});
