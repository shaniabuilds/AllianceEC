require('dotenv').config();
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;
let studentToken;
let studentUser;
let adminToken;
let adminUser;
let simulatedOtp;
let kycRecordId;

before(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db2';
    await mongoose.connect(fallbackUri);
  }
  // Safeguard: Never drop Atlas database
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }
});

after(async () => {
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Module 2: Authentication, KYC & State Localization API Suite', () => {

  test('1. GET /api/states — Seed & Fetch Indian States', async () => {
    const res = await request(app).get('/api/states');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.states.length > 0);
    assert.equal(res.body.data.states[0].code, 'KA');
  });

  test('2. POST /api/auth/register — Register New Student Account', async () => {
    const payload = {
      name: 'Shamshad Student',
      mobile: '9876543210',
      password: 'password123',
      email: 'shamshad@eduverse.in',
      role: 'STUDENT',
      stateCode: 'KA'
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.userId.startsWith('EDU-'));
    assert.ok(res.body.data.otpSimulated);
    simulatedOtp = res.body.data.otpSimulated;
  });

  test('3. POST /api/auth/verify-otp — Verify OTP & Obtain JWT Token', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      mobile: '9876543210',
      otp: simulatedOtp
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    studentToken = res.body.data.token;
    studentUser = res.body.data.user;
    assert.equal(studentUser.isMobileVerified, true);
  });

  test('4. POST /api/auth/login — Authenticate via Email & Password, Issue JWT Token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'shamshad@eduverse.in',
      password: 'password123'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
  });

  test('5. GET /api/auth/me — Fetch Protected User Profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.mobile, '9876543210');
  });

  test('6. PUT /api/auth/state — Update User State Localization Preference', async () => {
    const res = await request(app)
      .put('/api/auth/state')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ stateCode: 'MH' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.stateCode, 'MH');
  });

  test('7. POST /api/kyc/submit — Upload Aadhaar HD Image Scan (up to 2MB) to Cloudinary', async () => {
    const mockImageBuffer = Buffer.from('fake-hd-aadhaar-image-binary-data');

    const res = await request(app)
      .post('/api/kyc/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('documentType', 'AADHAAR')
      .field('documentNumber', '5421-9876-1234')
      .attach('documentImage', mockImageBuffer, {
        filename: 'aadhaar_hd_scan.jpg',
        contentType: 'image/jpeg'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.kycRecord.status, 'PENDING');
    assert.equal(res.body.data.kycRecord.documentType, 'AADHAAR');
    assert.ok(res.body.data.kycRecord.documentScanUrl.includes('cloudinary.com'));
    kycRecordId = res.body.data.kycRecord._id;
  });

  test('8. GET /api/kyc/status — Check User KYC Verification Status', async () => {
    const res = await request(app)
      .get('/api/kyc/status')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.kycStatus, 'PENDING');
  });

  test('9. Admin Setup & Authorization Guard for KYC Admin Endpoints', async () => {
    // Create Admin User
    const admin = await User.create({
      name: 'Super Admin',
      mobile: '9999999999',
      email: 'admin.test@eduverse.in',
      password: 'adminpassword123',
      role: 'ADMIN'
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      identifier: 'admin.test@eduverse.in',
      password: 'adminpassword123'
    });

    adminToken = loginRes.body.data.token;

    // Student trying to access Admin endpoint should fail (403)
    const forbiddenRes = await request(app)
      .get('/api/kyc/admin/all')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(forbiddenRes.status, 403);

    // Admin accessing Admin endpoint should succeed (200)
    const adminRes = await request(app)
      .get('/api/kyc/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.body.success, true);
    assert.ok(adminRes.body.data.length > 0);
    assert.equal(adminRes.body.pagination.page, 1);
    assert.equal(adminRes.body.pagination.totalRecords, 1);
  });

  test('10. PUT /api/kyc/admin/verify/:id — Admin Approves Student KYC Document', async () => {
    const res = await request(app)
      .put(`/api/kyc/admin/verify/${kycRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'VERIFIED' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.kycRecord.status, 'VERIFIED');

    // Verify User model updated to VERIFIED
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(profileRes.body.data.user.kycStatus, 'VERIFIED');
  });

});
