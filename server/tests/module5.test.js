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
let courseToBuyId;
let expensiveCourseId;
let ebookToBuyId;
let orderIdGenerated;

before(async () => {
  process.env.NODE_ENV = 'test';
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db5';
    await mongoose.connect(fallbackUri);
  }
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }

  // Setup Student User
  const student = await User.create({
    name: 'Karan Buyer',
    mobile: '9666666666',
    password: 'karanpassword123',
    role: 'STUDENT'
  });

  const studentLogin = await request(app).post('/api/auth/login').send({
    identifier: '9666666666',
    password: 'karanpassword123'
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

describe('Module 5: Digital Wallet, Razorpay Top-Up & Course/E-Book Purchases Suite', () => {

  test('1. GET /api/wallet/balance — Fetch Initial Wallet Balance (Auto-Initialize)', async () => {
    const res = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.balance, 0);
  });

  test('2. POST /api/wallet/topup/order — Generate Razorpay Order ID for ₹2,000 Top-up', async () => {
    const res = await request(app)
      .post('/api/wallet/topup/order')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ amount: 2000 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.orderId.startsWith('order_'));
    orderIdGenerated = res.body.data.orderId;
  });

  test('3. POST /api/wallet/topup/verify — Verify Razorpay Payment Signature & Credit Wallet', async () => {
    const res = await request(app)
      .post('/api/wallet/topup/verify')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        razorpayOrderId: orderIdGenerated,
        razorpayPaymentId: 'pay_mock_payment_12345',
        razorpaySignature: 'mock_valid_signature_12345',
        amount: 2000
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.newBalance, 2000);
  });

  test('4. GET /api/wallet/transactions — Fetch Paginated Transaction Log', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions?page=1&limit=5')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].type, 'CREDIT');
  });

  test('5. Seed Courses & Purchase Course via Wallet Balance', async () => {
    // Seed Courses
    const seedRes = await request(app).post('/api/courses/seed');
    courseToBuyId = seedRes.body.data.sampleCourses[0]._id; // Price ₹1499
    expensiveCourseId = seedRes.body.data.sampleCourses[2]._id; // Price ₹2499

    const buyRes = await request(app)
      .post('/api/purchases/course')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: courseToBuyId });

    assert.equal(buyRes.status, 200);
    assert.equal(buyRes.body.success, true);
    assert.equal(buyRes.body.data.newBalance, 501); // 2000 - 1499 = 501
  });

  test('6. GET /api/purchases/my-courses — Fetch Enrolled Courses', async () => {
    const res = await request(app)
      .get('/api/purchases/my-courses')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.count, 1);
    assert.equal(res.body.data.courses[0]._id, courseToBuyId);
  });

  test('7. Insufficient Wallet Balance Guard Check (Reject 400 Bad Request)', async () => {
    // Current balance is ₹501, trying to buy ₹2,499 course
    const res = await request(app)
      .post('/api/purchases/course')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: expensiveCourseId });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Insufficient wallet balance'));
  });

  test('8. Seed E-Books & Purchase Digital E-Book via Wallet Balance', async () => {
    // Seed Ebooks
    const seedEbookRes = await request(app).post('/api/ebooks/seed');
    ebookToBuyId = seedEbookRes.body.data.sampleEbooks[0]._id; // Price ₹199

    const buyEbookRes = await request(app)
      .post('/api/purchases/ebook')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ebookId: ebookToBuyId });

    assert.equal(buyEbookRes.status, 200);
    assert.equal(buyEbookRes.body.success, true);
    assert.equal(buyEbookRes.body.data.newBalance, 302); // 501 - 199 = 302
    assert.ok(buyEbookRes.body.data.fullPdfUrl.includes('.pdf'));
  });

  test('9. GET /api/purchases/my-ebooks — Fetch Purchased E-Books with Unlocked PDF Access', async () => {
    const res = await request(app)
      .get('/api/purchases/my-ebooks')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.count, 1);
    assert.ok(res.body.data.ebooks[0].fullPdfUrl.includes('.pdf'));
  });

});
