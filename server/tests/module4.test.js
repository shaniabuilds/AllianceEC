require('dotenv').config();
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');
const Course = require('../src/models/Course');
const Category = require('../src/models/Category');

let mongoServer;
let teacherToken;
let studentToken;
let dummySubjectId;
let createdChapterId;
let createdAssetId;
let createdQuestionId;

before(async () => {
  process.env.NODE_ENV = 'test';
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (err) {
    const fallbackUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/elearning_test_db4';
    await mongoose.connect(fallbackUri);
  }
  if (mongoose.connection.db && !mongoose.connection.host.includes('mongodb.net')) {
    await mongoose.connection.db.dropDatabase();
  }

  // Setup Teacher & Student Users
  const teacher = await User.create({
    name: 'Dr. Vikram Sharma',
    mobile: '9811111111',
    password: 'teacherpassword123',
    role: 'TEACHER'
  });

  const teacherLogin = await request(app).post('/api/auth/login').send({
    identifier: '9811111111',
    password: 'teacherpassword123'
  });
  teacherToken = teacherLogin.body.data.token;

  const student = await User.create({
    name: 'Priya Student',
    mobile: '9711111111',
    password: 'studentpassword123',
    role: 'STUDENT'
  });

  const studentLogin = await request(app).post('/api/auth/login').send({
    identifier: '9711111111',
    password: 'studentpassword123'
  });
  studentToken = studentLogin.body.data.token;

  // Setup Category, Course & Subject for Module 4 tests
  const category = await Category.create({
    code: 'SCHOOL_K12',
    title: 'School Education (K-12)'
  });

  const course = await Course.create({
    title: 'Class 10 Physics Mastery',
    category: category._id,
    stateCode: 'GLOBAL'
  });

  const subject = await Subject.create({
    title: 'General Physics',
    subjectCode: 'PHY-10',
    course: course._id
  });

  dummySubjectId = subject._id.toString();
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

describe('Module 4: Chapters, Multimodal Assets, MCQ Engine & User Progress Suite', () => {

  test('1. POST /api/chapters — Educator Creates Level 5 Chapter (RBAC Guard)', async () => {
    // Student trying to create chapter should fail (403)
    const forbiddenRes = await request(app)
      .post('/api/chapters')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Student Chapter',
        subjectId: dummySubjectId
      });
    assert.equal(forbiddenRes.status, 403);

    // Educator creating chapter should succeed (201)
    const res = await request(app)
      .post('/api/chapters')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Chapter 1: Electric Current & Ohm’s Law',
        chapterCode: 'ELEC-01',
        subjectId: dummySubjectId,
        sequence: 1,
        isFreeDemo: true
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.chapter.title, 'Chapter 1: Electric Current & Ohm’s Law');
    createdChapterId = res.body.data.chapter._id;
  });

  test('2. GET /api/chapters — Fetch Chapters under Subject', async () => {
    const res = await request(app).get(`/api/chapters?subjectId=${dummySubjectId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.chapters.length >= 1);
    assert.equal(res.body.data.chapters[0]._id, createdChapterId);
  });

  test('3. POST /api/assets — Educator Publishes Level 6 Multimodal DRM Video Asset', async () => {
    const assetPayload = {
      title: '🎥 HLS DRM Video: Derivation of Ohm’s Law & Resistance Formula',
      assetType: 'VIDEO_DRM',
      chapterId: createdChapterId,
      subjectId: dummySubjectId,
      contentUrl: 'https://stream.eduverse.in/hls/physics_ohms_law/master.m3u8',
      durationSeconds: 1500,
      sequence: 1,
      isFreePreview: true
    };

    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(assetPayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.asset.assetType, 'VIDEO_DRM');
    createdAssetId = res.body.data.asset._id;
  });

  test('4. GET /api/assets — Fetch Learning Assets under Chapter', async () => {
    const res = await request(app).get(`/api/assets?chapterId=${createdChapterId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.assets.length >= 1);
    assert.equal(res.body.data.assets[0]._id, createdAssetId);
  });

  test('5. POST /api/mcq/questions — Educator Creates MCQ Question with Hidden Answer Key', async () => {
    const questionPayload = {
      chapterId: createdChapterId,
      subjectId: dummySubjectId,
      questionText: 'What is the SI unit of Electrical Resistance?',
      options: ['Ampere (A)', 'Volt (V)', 'Ohm (Ω)', 'Watt (W)'],
      correctOption: 2,
      explanation: 'SI unit of resistance is Ohm (Ω), named after Georg Simon Ohm.',
      marks: 1
    };

    const res = await request(app)
      .post('/api/mcq/questions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(questionPayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.question.options[2], 'Ohm (Ω)');
    createdQuestionId = res.body.data.question._id;
  });

  test('6. GET /api/mcq/questions — Fetch Quiz Questions (Verify Hidden correctOption)', async () => {
    const res = await request(app).get(`/api/mcq/questions?chapterId=${createdChapterId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.questions.length >= 1);
    // Student delivery must not leak correctOption index
    assert.equal(res.body.data.questions[0].correctOption, undefined);
  });

  test('7. POST /api/mcq/submit — Student Submits Quiz Attempt & Calculates Score', async () => {
    const quizPayload = {
      chapterId: createdChapterId,
      answers: [
        {
          questionId: createdQuestionId,
          selectedOption: 2 // Correct answer (Ohm)
        }
      ]
    };

    const res = await request(app)
      .post('/api/mcq/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(quizPayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.score, 1);
    assert.equal(res.body.data.percentage, 100);
    assert.equal(res.body.data.passed, true);
  });

  test('8. POST /api/progress/complete-asset — Student Marks Asset Completed & Updates Progress %', async () => {
    const res = await request(app)
      .post('/api/progress/complete-asset')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subjectId: dummySubjectId,
        assetId: createdAssetId
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.progressPercentage, 100);
    assert.equal(res.body.data.completedAssetsCount, 1);
  });

  test('9. GET /api/progress/:subjectId — Fetch Student Progress Record', async () => {
    const res = await request(app)
      .get(`/api/progress/${dummySubjectId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.progress.progressPercentage, 100);
    assert.ok(res.body.data.progress.completedAssets.length >= 1);
  });

});
