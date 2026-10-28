require('dotenv').config();
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;
let teacherToken;
let studentToken;
let seededCategoryId;
let seededCourseId;
let createdSubjectId;

before(async () => {
  process.env.NODE_ENV = 'test';
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db3';
    await mongoose.connect(fallbackUri);
  }
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }

  // Setup Teacher & Student Users for Authorization Guard Tests
  const teacher = await User.create({
    name: 'Prof. Ananya Sen',
    mobile: '9888888888',
    password: 'teacherpassword123',
    role: 'TEACHER'
  });

  const teacherLogin = await request(app).post('/api/auth/login').send({
    identifier: '9888888888',
    password: 'teacherpassword123',
    bypassOtp: true
  });
  teacherToken = teacherLogin.body.data.token;

  const student = await User.create({
    name: 'Rahul Learner',
    mobile: '9777777777',
    password: 'studentpassword123',
    role: 'STUDENT'
  });

  const studentLogin = await request(app).post('/api/auth/login').send({
    identifier: '9777777777',
    password: 'studentpassword123',
    bypassOtp: true
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

describe('Module 3: Content Hierarchy (Levels 1–4) API Suite', () => {

  test('1. GET /api/categories — Fetch 6 Core Educational Categories', async () => {
    const res = await request(app).get('/api/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.categories.length, 6);
    assert.equal(res.body.data.categories[0].code, 'SCHOOL_K12');
    seededCategoryId = res.body.data.categories[0]._id;
  });

  test('2. POST /api/courses/seed — Seed Sample Courses & Boards', async () => {
    const res = await request(app).post('/api/courses/seed');
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.sampleCourses.length > 0);
    seededCourseId = res.body.data.sampleCourses[0]._id;
  });

  test('3. GET /api/courses — Fetch Paginated Courses & State Filtering', async () => {
    const res = await request(app).get('/api/courses?stateCode=KA&page=1&limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.pagination.page, 1);
    assert.ok(res.body.pagination.totalRecords >= 1);
  });

  test('4. GET /api/courses/:id — Course Overview Drill-Down', async () => {
    const res = await request(app).get(`/api/courses/${seededCourseId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.course._id, seededCourseId);
    assert.ok(Array.isArray(res.body.data.subjects));
  });

  test('5. POST /api/courses — Educator Protected Course Creation (RBAC Guard)', async () => {
    // Student trying to create course should be rejected (403 Forbidden)
    const forbiddenRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Student Course',
        categoryId: seededCategoryId
      });
    assert.equal(forbiddenRes.status, 403);

    // Educator creating course should succeed (201 Created)
    const coursePayload = {
      title: 'M.Sc Organic Chemistry Reaction Mechanisms',
      categoryId: seededCategoryId,
      stateCode: 'GLOBAL',
      boardOrGrade: 'UG-PG Series',
      description: 'Master organic reaction mechanisms for higher education PG aspirants.',
      price: 1999,
      originalPrice: 3999,
      isFeatured: true
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(coursePayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.course.title, 'M.Sc Organic Chemistry Reaction Mechanisms');
  });

  test('6. POST /api/subjects — Create Level 4 Subject Under Course', async () => {
    const subjectPayload = {
      title: 'Electromagnetism & Wave Physics',
      subjectCode: 'PHY-EM10',
      courseId: seededCourseId,
      colorBadge: '#10B981',
      sequence: 1
    };

    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(subjectPayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.subject.subjectCode, 'PHY-EM10');
    createdSubjectId = res.body.data.subject._id;
  });

  test('7. GET /api/subjects?courseId=xxx — Fetch Subjects by Course ID', async () => {
    const res = await request(app).get(`/api/subjects?courseId=${seededCourseId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.subjects.length >= 1);
    assert.equal(res.body.data.subjects[0]._id, createdSubjectId);
  });

});
