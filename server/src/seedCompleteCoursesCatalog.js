const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course');
const Category = require('./models/Category');
const User = require('./models/User');

const seedCompleteCatalog = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // Fetch Super Admin / Instructor
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      admin = await User.findOne({});
    }
    const adminId = admin ? admin._id : null;

    // Fetch all 6 Category IDs
    const categories = await Category.find({}).lean();
    const catMap = {};
    categories.forEach(c => {
      catMap[c.code] = c._id;
    });

    console.log('Loaded Categories:', Object.keys(catMap));

    // Ensure all 6 category IDs exist
    const requiredCodes = ['SCHOOL_K12', 'COMPETITIVE_EXAMS', 'STATE_GOVT_JOBS', 'CENTRAL_GOVT_JOBS', 'TEACHER_PREP', 'HIGHER_EDU'];
    for (const code of requiredCodes) {
      if (!catMap[code]) {
        console.error(`Missing category code: ${code}`);
        process.exit(1);
      }
    }

    // Define all 32 comprehensive, realistic platform courses
    const coursesToSeed = [
      // ==========================================
      // I. SCHOOL EDUCATION (CLASS 1 TO 12)
      // ==========================================
      {
        title: 'State Board Regional / Bilingual Medium Classes 1-10 Foundation Batch',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'STATE_BOARD_MEDIUM',
        subCategoryTitle: 'State Board - State Medium / Bilingual (Classes 1–10)',
        boardOrGrade: 'State Board Classes 1-10',
        subjectName: 'All Subjects (Complete Package)',
        description: 'Complete syllabus coverage for State Board regional medium students from Class 1 to 10 with concept clarity, mother-tongue explanations, animated lectures, and state textbook solutions.',
        price: 1499,
        originalPrice: 2999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'State Board Classes 1-10 Master Formula & Question Bank Guide',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['State Board Mathematics Solutions', 'General Science & Environmental Studies', 'Regional Language & Grammar', 'Social Studies History & Geography'],
        inclusions: { totalLectures: 85, totalHours: 65, totalEbooks: 4, totalLiveSessions: 12, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'State Board English Medium Classes 1-10 Comprehensive Academic Mastery',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'STATE_BOARD_ENGLISH',
        subCategoryTitle: 'State Board - English Medium (Classes 1–10)',
        boardOrGrade: 'State Board English Medium',
        subjectName: 'All Subjects (Complete Package)',
        description: 'Structured English-medium coaching for State Board syllabus covering Class 1 to 10. Includes deep chapter explanations, interactive worksheets, and quarterly exam preparation.',
        price: 1699,
        originalPrice: 3299,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'State Board English Medium Complete Study Notes 2026',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Science & Technology Experiments', 'Mathematics Theorems & Trigonometry', 'English Prose & Functional Grammar', 'Social Science & Civics'],
        inclusions: { totalLectures: 90, totalHours: 70, totalEbooks: 5, totalLiveSessions: 15, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'CBSE Board Class 10th Complete Board Exam Prep (Science & Mathematics)',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'CBSE',
        subCategoryTitle: 'CBSE Board (Classes 1–10)',
        boardOrGrade: 'CBSE Class 10th',
        subjectName: 'Science & Mathematics',
        description: 'NCERT aligned high-scoring preparation for CBSE Class 10 Board Examinations. Master physics derivations, chemical equations, mathematical proofs, and sample question papers.',
        price: 1999,
        originalPrice: 3999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'CBSE Class 10 Science & Math Top Ranker Handbook',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Chemical Reactions & Equations', 'Electricity & Magnetic Effects', 'Real Numbers & Polynomials', 'Quadratic Equations & Statistics'],
        inclusions: { totalLectures: 110, totalHours: 85, totalEbooks: 6, totalLiveSessions: 20, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'ICSE Board Class 10th CISCE Curriculum Excellence Batch 2026',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'ICSE',
        subCategoryTitle: 'ICSE Board (Classes 1–10)',
        boardOrGrade: 'ICSE Class 10th',
        subjectName: 'Physics, Chemistry, Maths & Biology',
        description: 'Comprehensive ICSE Board coaching designed for CISCE standard. Detailed coverage of Selina Publishers syllabus, commercial studies, and advanced problem-solving methodologies.',
        price: 2199,
        originalPrice: 4499,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'ICSE Class 10 Formula Sheets & Previous 10 Years Solved Papers',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Force, Work, Power & Energy', 'Refraction & Current Electricity', 'Periodic Properties & Chemical Bonding', 'Coordinate Geometry & Matrices'],
        inclusions: { totalLectures: 95, totalHours: 75, totalEbooks: 5, totalLiveSessions: 14, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: '12th PUC & Senior Secondary Science Stream (PCMB) Master Batch',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'PUC_SENIOR_SECONDARY',
        stream: 'Science',
        subCategoryTitle: 'PUC / Senior Secondary (+1 & +2) - Science',
        boardOrGrade: '+2 Senior Secondary Science',
        subjectName: 'Physics, Chemistry, Mathematics & Biology',
        description: 'Complete +1 & +2 PUC Science preparation covering Physics, Chemistry, Mathematics, and Biology with high-yield concepts, numerical problem solving, and board exam blueprints.',
        price: 2499,
        originalPrice: 4999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'PCMB 12th Senior Secondary Comprehensive Revision Handbook',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Electrostatics & Current Electricity', 'Coordination Compounds & Organic Reactions', 'Calculus, Integrals & Differential Equations', 'Genetics, Evolution & Biotechnology'],
        inclusions: { totalLectures: 140, totalHours: 110, totalEbooks: 8, totalLiveSessions: 25, totalMockTests: 15, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: '12th PUC & Senior Secondary Commerce Stream (Accountancy & Economics)',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'Commerce',
        stream: 'Commerce',
        subCategoryTitle: 'PUC / Senior Secondary (+1 & +2) - Commerce',
        boardOrGrade: '+2 Senior Secondary Commerce',
        subjectName: 'Accountancy, Business Studies & Economics',
        description: 'Master Class 12 Commerce with practical accounting ledger training, financial statement analysis, macroeconomics policies, and business management case studies.',
        price: 2199,
        originalPrice: 4499,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'Commerce Mastery: Accountancy & Micro-Macro Economics Guide',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Partnership Accounts & Share Capital', 'Principles of Management & Financial Markets', 'National Income Accounting & Banking', 'Indian Economic Development'],
        inclusions: { totalLectures: 85, totalHours: 65, totalEbooks: 4, totalLiveSessions: 12, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: '12th PUC & Senior Secondary Arts Stream (History, Pol Science & Sociology)',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'Arts',
        stream: 'Arts',
        subCategoryTitle: 'PUC / Senior Secondary (+1 & +2) - Arts',
        boardOrGrade: '+2 Senior Secondary Arts',
        subjectName: 'History, Political Science & Sociology',
        description: 'In-depth humanities batch covering Indian & world history, political theories, international relations, and Indian social structure for Board exams and civil service foundation.',
        price: 1999,
        originalPrice: 3999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'Humanities & Social Sciences Comprehensive Board Review',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Themes in Indian History Part I, II & III', 'Contemporary World Politics & Constitution', 'Structure of Indian Society & Social Change', 'Human Geography Fundamentals'],
        inclusions: { totalLectures: 80, totalHours: 60, totalEbooks: 4, totalLiveSessions: 10, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'K-12 School Education All Classes & State Boards All-Access Master Pass',
        category: catMap['SCHOOL_K12'],
        stateCode: 'GLOBAL',
        subCategory: 'SCHOOL_K12',
        subCategoryTitle: 'All Classes Master Pass (Class 1–12)',
        boardOrGrade: 'All Boards K-12',
        subjectName: 'All Subjects (Complete Package)',
        description: 'The definitive all-access academic pass unlocking all grades (1 to 12), all streams (Science, Commerce, Arts), and all state/CBSE/ICSE boards for complete school mastery.',
        price: 3499,
        originalPrice: 6999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'K-12 Complete Educational Encyclopedia & Formula Compendium',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Primary & Middle School Foundation Modules', 'High School Secondary Boards Accelerator', 'Senior Secondary Stream Specializations', 'Olympiad & NTSE Talent Tracks'],
        inclusions: { totalLectures: 250, totalHours: 200, totalEbooks: 15, totalLiveSessions: 40, totalMockTests: 30, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },

      // ==========================================
      // II. SCHOOL ENTRANCE & COMPETITIVE EXAMS
      // ==========================================
      {
        title: 'NEET UG 2026 Medical Entrance Physics, Chemistry & Biology Intensive Batch',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'NEET',
        subCategoryTitle: 'NEET (National Eligibility cum Entrance Test)',
        boardOrGrade: 'NEET Medical Entrance',
        subjectName: 'Physics, Chemistry & Biology',
        description: 'Full syllabus NCERT line-by-line decoding, AIIMS & NEET previous years papers analysis, speed solving tricks for physics numericals, and organic chemistry mechanisms.',
        price: 2999,
        originalPrice: 5999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'NEET UG 10,000 High-Yield MCQs & Mind Maps Handbook',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Human Physiology & Plant Diversity', 'Genetics, Molecular Biology & Ecology', 'Mechanics, Electrodynamics & Optics', 'Physical & Organic Chemistry Reaction Modules'],
        inclusions: { totalLectures: 160, totalHours: 130, totalEbooks: 10, totalLiveSessions: 30, totalMockTests: 20, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'JEE Main & Advanced 2026 Engineering Entrance Math, Physics & Chemistry',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'JEE',
        subCategoryTitle: 'JEE (Joint Entrance Examination)',
        boardOrGrade: 'JEE Engineering Entrance',
        subjectName: 'Mathematics, Physics & Chemistry',
        description: 'Elite preparation program for IIT JEE Main & Advanced. Advanced level problem solving, shortcuts, multi-concept questions, and mock tests with national ranking analytics.',
        price: 2999,
        originalPrice: 5999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'JEE Advanced Concept Buster & 40-Year Solved Papers',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Coordinate Geometry, Vectors & 3D', 'Integral Calculus & Complex Numbers', 'Thermodynamics & Modern Physics', 'Chemical Kinetics & Coordination Chemistry'],
        inclusions: { totalLectures: 170, totalHours: 140, totalEbooks: 10, totalLiveSessions: 35, totalMockTests: 22, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'Jawahar Navodaya Vidyalaya Selection Test (JNVST) Class 6 & 9 Entrance Prep',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'NAVODAYA',
        subCategoryTitle: 'Navodaya Entrance Exam',
        boardOrGrade: 'Navodaya JNVST Entrance',
        subjectName: 'Mental Ability, Arithmetic & Language',
        description: 'Comprehensive entrance coaching for Navodaya Vidyalaya selection. Step-by-step mental ability figure patterns, arithmetic calculations, and language comprehension.',
        price: 1299,
        originalPrice: 2599,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'Navodaya Entrance Exam Practice Workbook & Solved Model Tests',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Mental Ability Test (Figure Matching, Analogies)', 'Arithmetic Test (Decimals, Fractions, LCM-HCF)', 'Language Comprehension & Vocabulary', 'Navodaya Model Test Series'],
        inclusions: { totalLectures: 65, totalHours: 50, totalEbooks: 3, totalLiveSessions: 8, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'NTS (National Talent Search Examination) Stage 1 & 2 Scholarship Prep',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'NTS',
        subCategoryTitle: 'NTS (National Talent Search)',
        boardOrGrade: 'NTSE National Scholarship',
        subjectName: 'Mental Ability (MAT) & Scholastic Aptitude (SAT)',
        description: 'Targeted preparation for India prestigious NTSE scholarship exam. Master MAT reasoning puzzles and SAT modules in Science, Social Studies, and Mathematics.',
        price: 1499,
        originalPrice: 2999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'NTSE Scholarship Master Guide: MAT Puzzles & SAT Questions',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['MAT Coding-Decoding & Direction Sense', 'SAT Physics, Chemistry & Biology Modules', 'SAT Social Studies Indian National Movement', 'NTSE Stage 1 & 2 Previous Year Papers'],
        inclusions: { totalLectures: 75, totalHours: 55, totalEbooks: 4, totalLiveSessions: 10, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'G-MAT General Mental Ability & Quantitative Aptitude Intensive Course',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'GMAT',
        subCategoryTitle: 'G-MAT Aptitude',
        boardOrGrade: 'G-MAT Aptitude',
        subjectName: 'Quantitative Aptitude & Logical Reasoning',
        description: 'Master quantitative aptitude, data sufficiency, logical deduction, and verbal reasoning required for G-MAT aptitude entrance and campus placement exams.',
        price: 1699,
        originalPrice: 3499,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'General Mental Ability & Data Sufficiency Accelerator Guide',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Arithmetic, Number Systems & Percentages', 'Data Sufficiency & Graphical Interpretation', 'Critical Reasoning & Logical Syllogisms', 'Time Management & Speed Math Tricks'],
        inclusions: { totalLectures: 70, totalHours: 55, totalEbooks: 4, totalLiveSessions: 10, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'NTA UGC NET / JRF Paper 1 & Paper 2 Teaching & Research Aptitude Batch',
        category: catMap['COMPETITIVE_EXAMS'],
        stateCode: 'GLOBAL',
        subCategory: 'NET',
        subCategoryTitle: 'UGC NET / JRF',
        boardOrGrade: 'UGC NET Lectureship',
        subjectName: 'Teaching & Research Aptitude',
        description: 'Comprehensive preparation for UGC NET Assistant Professor & JRF. In-depth mastery of teaching methods, research methodology, ICT in education, and higher education governance.',
        price: 2499,
        originalPrice: 4999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'UGC NET Paper 1 Teaching & Research Aptitude Master Notes',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Teaching Aptitude & Learner Characteristics', 'Research Methodology & Thesis Writing', 'Communication & ICT in Higher Education', 'People, Development & Environment'],
        inclusions: { totalLectures: 110, totalHours: 85, totalEbooks: 6, totalLiveSessions: 18, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },

      // ==========================================
      // III. STATE GOVERNMENT JOBS PREPARATION
      // ==========================================
      {
        title: 'KAS (State Administrative Services) Prelims & Mains General Studies Complete Batch',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'KAS',
        subCategoryTitle: 'KAS / State Public Service Commission',
        boardOrGrade: 'State PSC Civil Services',
        subjectName: 'General Studies & State Administration',
        description: 'Comprehensive foundation for State Public Service Commission civil examinations. Detailed state history, geography, governance policies, rural development, and mains answer writing.',
        price: 3499,
        originalPrice: 6999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'KAS / State PSC General Studies Comprehensive Compendium',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['State History, Culture & Heritage', 'State Geography & Natural Resources', 'Indian Constitution & Public Administration', 'State Economic Surveys & Budget Analysis'],
        inclusions: { totalLectures: 150, totalHours: 120, totalEbooks: 8, totalLiveSessions: 30, totalMockTests: 18, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'SDA (Second Division Assistant) State Secretariat Recruitment Exam Prep',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'SDA',
        subCategoryTitle: 'SDA (Second Division Assistant)',
        boardOrGrade: 'State Secretariat Jobs',
        subjectName: 'General Knowledge, State Language & Arithmetic',
        description: 'Targeted preparation for Second Division Assistant government recruitment examinations. Covers General Kannada/Hindi, General Knowledge, Constitution, and basic numerical aptitude.',
        price: 1499,
        originalPrice: 2999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'SDA Recruitment 5,000 Solved MCQs & Grammar Handbook',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['General Knowledge & Current Affairs', 'General Regional Language Paper 1', 'Basic Arithmetic & Reasoning', 'State Government Schemes & Office Procedure'],
        inclusions: { totalLectures: 75, totalHours: 55, totalEbooks: 4, totalLiveSessions: 10, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'FDA (First Division Assistant) State Administration & Revenue Complete Batch',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'FDA',
        subCategoryTitle: 'FDA (First Division Assistant)',
        boardOrGrade: 'State Revenue & Admin Jobs',
        subjectName: 'General Studies, Ethics & State Affairs',
        description: 'Complete coaching for First Division Assistant civil posts. High scoring focus on General Studies, state administrative law, mental ability, and regional literature.',
        price: 1699,
        originalPrice: 3499,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'FDA Exam Complete Study Material & Past 10 Years Question Bank',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Indian Polity, Governance & RTI', 'Indian History & National Movement', 'Everyday Science & Environmental Issues', 'General Regional Language Comprehension'],
        inclusions: { totalLectures: 85, totalHours: 65, totalEbooks: 5, totalLiveSessions: 12, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'GPT (General Primary Teacher) State Government School Recruitment Batch',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'GPT',
        subCategoryTitle: 'GPT (General Primary Teacher)',
        boardOrGrade: 'Primary School Teacher Recruitment',
        subjectName: 'Educational Psychology, Pedagogy & Core Subjects',
        description: 'Specialized preparation for government Primary School Teacher recruitment exams. Covers child pedagogy, teaching methodology, mathematics, science, and language teaching.',
        price: 1899,
        originalPrice: 3799,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'GPT Teacher Recruitment Pedagogy & Subject Mastery Notes',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Educational Psychology & Child Development', 'Language 1 & Language 2 Pedagogy', 'Mathematics & Environmental Studies Pedagogy', 'Teaching Learning Materials & Evaluation'],
        inclusions: { totalLectures: 95, totalHours: 75, totalEbooks: 5, totalLiveSessions: 15, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'State Police SI & Constable Recruitment Complete Exam & Physical Training Prep',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'Police',
        subCategoryTitle: 'State Police SI / Constable',
        boardOrGrade: 'Police Sub-Inspector & Constable Exam',
        subjectName: 'General Studies, Law & Aptitude',
        description: 'Complete coaching for Sub-Inspector (PSI) and Civil/Armed Police Constable examinations. Comprehensive coverage of law basics, Indian Penal Code introduction, mental ability, and general awareness.',
        price: 1799,
        originalPrice: 3599,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'State Police SI & Constable All-in-One Crack Exam Guide',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['General Awareness & Current National Affairs', 'Constitution, Police Act & Basic Legal Terms', 'Numerical Ability & Logical Reasoning Puzzles', 'Descriptive Essay & Translation Paper (For SI)'],
        inclusions: { totalLectures: 90, totalHours: 70, totalEbooks: 5, totalLiveSessions: 14, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'State Government Exams All-in-One Comprehensive Career Foundation Pass',
        category: catMap['STATE_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'STATE_GOVT_JOBS',
        subCategoryTitle: 'Other State Exams Pass',
        boardOrGrade: 'State Government Services',
        subjectName: 'General Studies & Mental Ability',
        description: 'Single master pass covering all state exams (Lekhpal, VDO, Forest Guard, Revenue Inspector, District Courts & Public Service Commission tests).',
        price: 2999,
        originalPrice: 5999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'State Competitive Exams 15,000 Questions Comprehensive Vault',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['State General Knowledge Mega Capsule', 'Indian History, Geography & Economy Modules', 'Quantitative Aptitude & Logical Reasoning', 'State Language Grammar & Writing Skills'],
        inclusions: { totalLectures: 180, totalHours: 140, totalEbooks: 12, totalLiveSessions: 30, totalMockTests: 25, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },

      // ==========================================
      // IV. CENTRAL GOVERNMENT JOBS PREPARATION
      // ==========================================
      {
        title: 'Banking Exams 2026 (IBPS PO, Clerk & SBI PO) Complete Quantitative & Reasoning Prep',
        category: catMap['CENTRAL_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'BANKING',
        subCategoryTitle: 'Banking Exams (IBPS, SBI, etc.)',
        boardOrGrade: 'Banking Sector Exams',
        subjectName: 'Quantitative Aptitude, Reasoning & English',
        description: 'Complete high-speed training for IBPS PO/Clerk, SBI PO/Clerk, and RRB banking exams. Master high-level seating arrangements, DI sets, syllogisms, and banking awareness.',
        price: 2299,
        originalPrice: 4599,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'Banking Speed Math & High-Level Reasoning Puzzle Book',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Speed Math, Quadratic Equations & Number Series', 'Data Interpretation & Caselet Sets', 'Seating Arrangement & Floor Puzzles', 'Financial & Banking Awareness 2026'],
        inclusions: { totalLectures: 120, totalHours: 95, totalEbooks: 6, totalLiveSessions: 22, totalMockTests: 15, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'Railway Recruitment Board (RRB NTPC & Group D) Complete CBT 1 & 2 Batch',
        category: catMap['CENTRAL_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'RRB',
        subCategoryTitle: 'Railway Recruitment Board (RRB)',
        boardOrGrade: 'RRB Railway Recruitment',
        subjectName: 'General Science, Math & General Awareness',
        description: 'Structured preparation for Indian Railways RRB NTPC, Group D, and ALP examinations. Deep coverage of NCERT science, elementary mathematics, and reasoning.',
        price: 1899,
        originalPrice: 3799,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'Railway RRB NTPC Science & General Awareness Booster',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['General Science (Physics, Chemistry & Biology)', 'Mathematics (Time & Work, SI-CI, Geometry)', 'General Intelligence & Reasoning', 'General Awareness (Current Affairs & History)'],
        inclusions: { totalLectures: 95, totalHours: 75, totalEbooks: 5, totalLiveSessions: 14, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'UPSC Civil Services (IAS / IPS / IFS) Prelims GS & CSAT Foundation 2026',
        category: catMap['CENTRAL_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'IAS',
        subCategoryTitle: 'UPSC IAS Civil Services',
        boardOrGrade: 'UPSC Civil Services Exam',
        subjectName: 'General Studies, Indian Polity, History & CSAT',
        description: 'Premier civil services foundation covering Indian Polity (M. Laxmikanth), Modern Indian History (Spectrum), Geography, Economy, Ecology, and CSAT logical reasoning.',
        price: 4499,
        originalPrice: 8999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'UPSC IAS Prelims Mega Compendium & CSAT Practice Toolkit',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Indian Polity & Governance In-Depth', 'Modern History & Art & Culture', 'Macroeconomics & Indian Budget Analysis', 'CSAT Quantitative & Reading Comprehension'],
        inclusions: { totalLectures: 200, totalHours: 160, totalEbooks: 12, totalLiveSessions: 40, totalMockTests: 25, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'SSC CGL & CHSL (Staff Selection Commission) Tier 1 & Tier 2 Master Package',
        category: catMap['CENTRAL_GOVT_JOBS'],
        stateCode: 'GLOBAL',
        subCategory: 'SSC',
        subCategoryTitle: 'SSC CGL & CHSL',
        boardOrGrade: 'SSC Central Govt Recruitment',
        subjectName: 'Quantitative Abilities, English, Reasoning & GK',
        description: 'Comprehensive Tier 1 & Tier 2 preparation for SSC Combined Graduate Level & Higher Secondary Level examinations. Covers advanced mathematics, English grammar, and computer awareness.',
        price: 2199,
        originalPrice: 4399,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'SSC CGL Tier 1 & Tier 2 Master Formula Sheets & Previous Years Papers',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Advanced Math (Trigonometry, Algebra & Geometry)', 'English Language Comprehension & Vocab', 'General Intelligence & Reasoning', 'Computer Proficiency & General Knowledge'],
        inclusions: { totalLectures: 115, totalHours: 90, totalEbooks: 6, totalLiveSessions: 20, totalMockTests: 15, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },

      // ==========================================
      // V. TEACHER PREPARATION & CERTIFICATIONS
      // ==========================================
      {
        title: 'B.Ed (Bachelor of Education) 1st & 2nd Year Core Pedagogy & Teaching Methodology',
        category: catMap['TEACHER_PREP'],
        stateCode: 'GLOBAL',
        subCategory: 'BED',
        subCategoryTitle: 'B.Ed (Bachelor of Education)',
        boardOrGrade: 'B.Ed Degree Curriculum',
        subjectName: 'Child Development, Learning Psychology & Pedagogy',
        description: 'Complete university curriculum preparation for B.Ed 1st and 2nd year students. Covers childhood and growing up, learning and teaching, assessment for learning, and micro-teaching skills.',
        price: 2499,
        originalPrice: 4999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'B.Ed Core Syllabus Handbook: Child Psychology & Teaching Methodology',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Childhood & Growing Up Theories', 'Contemporary India & Education Policies', 'Learning & Teaching Psychological Perspectives', 'Pedagogy of School Subjects (Math, Science, Social)'],
        inclusions: { totalLectures: 95, totalHours: 75, totalEbooks: 5, totalLiveSessions: 14, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'M.Ed (Master of Education) Advanced Educational Technology & Curriculum Research',
        category: catMap['TEACHER_PREP'],
        stateCode: 'GLOBAL',
        subCategory: 'MED',
        subCategoryTitle: 'M.Ed (Master of Education)',
        boardOrGrade: 'M.Ed Post Graduate Degree',
        subjectName: 'Advanced Educational Philosophy & Research Methodology',
        description: 'Post-graduate level educational course for aspiring teacher educators and principals. Detailed modules on philosophical foundations of education, educational statistics, and teacher education models.',
        price: 2799,
        originalPrice: 5599,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'M.Ed Advanced Research Methodologies & Educational Leadership Compendium',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Historical & Political Perspectives of Education', 'Educational Research & Statistical Inferences', 'Curriculum Design & Pedagogical Innovations', 'Teacher Education In-Service & Pre-Service Paradigms'],
        inclusions: { totalLectures: 90, totalHours: 70, totalEbooks: 5, totalLiveSessions: 12, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'State Teacher Eligibility Test (TET) Paper 1 & Paper 2 Complete Preparation',
        category: catMap['TEACHER_PREP'],
        stateCode: 'GLOBAL',
        subCategory: 'TET',
        subCategoryTitle: 'State TET Eligibility',
        boardOrGrade: 'State TET Certification',
        subjectName: 'Child Development, Pedagogy, Language & Math',
        description: 'High-scoring preparation for State Teacher Eligibility Test (Paper 1 for Classes 1–5 and Paper 2 for Classes 6–8). Covers CDP, language grammar, environmental studies, and mathematics.',
        price: 1899,
        originalPrice: 3799,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'State TET 3,000 Pedagogy Questions & Model Paper Series',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Child Development & Pedagogical Theories (Piaget, Vygotsky)', 'Language 1 & Language 2 Grammar & Comprehension', 'Environmental Studies (EVS) Content & Pedagogy', 'Mathematics & Science Pedagogy Modules'],
        inclusions: { totalLectures: 105, totalHours: 80, totalEbooks: 6, totalLiveSessions: 18, totalMockTests: 14, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'CTET (Central Teacher Eligibility Test) 2026 Paper 1 & 2 Scoring Mastery Batch',
        category: catMap['TEACHER_PREP'],
        stateCode: 'GLOBAL',
        subCategory: 'CTET',
        subCategoryTitle: 'CTET Central Teacher Eligibility',
        boardOrGrade: 'CTET National Certification',
        subjectName: 'Child Pedagogy, Environmental Studies & Mathematics',
        description: 'Target 130+ marks in CBSE CTET Paper 1 & Paper 2 with previous year question breakdowns, pedagogy concept clarity, Hindi/English language tricks, and full-length simulated CBT mock tests.',
        price: 1999,
        originalPrice: 3999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'CTET National Certification 130+ Score Blueprint & Question Vault',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Child Development Concept of Inclusive Education', 'Language Pedagogy & Reading Passages', 'Mathematics Pedagogy & Problem Solving', 'Social Studies & Science Pedagogical Issues'],
        inclusions: { totalLectures: 110, totalHours: 85, totalEbooks: 6, totalLiveSessions: 20, totalMockTests: 15, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },

      // ==========================================
      // VI. HIGHER EDUCATION – UG & PG DEGREES
      // ==========================================
      {
        title: 'MBA (Master of Business Administration) Financial Analytics & Strategic Management',
        category: catMap['HIGHER_EDU'],
        stateCode: 'GLOBAL',
        subCategory: 'MBA',
        subCategoryTitle: 'MBA (Master of Business Administration)',
        boardOrGrade: 'MBA Degree Program',
        subjectName: 'Corporate Finance, Marketing Management & Leadership',
        description: 'Executive grade MBA master series covering managerial economics, corporate financial modeling, brand strategy, digital transformation, and organizational behavior.',
        price: 3499,
        originalPrice: 6999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'MBA Executive Strategy: Corporate Finance & Market Analysis Toolkit',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Financial Statement Analysis & Capital Budgeting', 'Marketing Management & Consumer Psychology', 'Operations Research & Supply Chain Logistics', 'Strategic Management & Business Analytics'],
        inclusions: { totalLectures: 125, totalHours: 100, totalEbooks: 7, totalLiveSessions: 20, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'M.Com (Master of Commerce) Advanced Accounting, Taxation & Corporate Law',
        category: catMap['HIGHER_EDU'],
        stateCode: 'GLOBAL',
        subCategory: 'MCOM',
        subCategoryTitle: 'M.Com (Master of Commerce)',
        boardOrGrade: 'M.Com Post Graduate Degree',
        subjectName: 'Advanced Financial Accounting & Corporate Taxation',
        description: 'Postgraduate commerce program covering corporate accounting standards (Ind AS), GST compliance, direct and indirect taxation, financial management, and auditing practices.',
        price: 2699,
        originalPrice: 5399,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'M.Com Advanced Corporate Accounting & GST Taxation Handbook',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['Corporate Financial Accounting & Ind AS', 'Direct Taxes Law & Practice', 'Goods & Services Tax (GST) Framework', 'Financial Markets & Investment Management'],
        inclusions: { totalLectures: 95, totalHours: 75, totalEbooks: 5, totalLiveSessions: 14, totalMockTests: 10, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'M.Sc (Master of Science) Computer Science, Applied Mathematics & Data Modeling',
        category: catMap['HIGHER_EDU'],
        stateCode: 'GLOBAL',
        subCategory: 'MSC',
        subCategoryTitle: 'M.Sc (Master of Science)',
        boardOrGrade: 'M.Sc Post Graduate Degree',
        subjectName: 'Computer Science, Discrete Math & Data Analytics',
        description: 'Comprehensive M.Sc degree course covering advanced data structures, machine learning algorithms, discrete mathematical modeling, cloud infrastructure, and computational theory.',
        price: 2999,
        originalPrice: 5999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800',
        courseMode: 'HYBRID',
        ebookTitle: 'M.Sc Computer Science & Data Modeling Theory & Coding Blueprint',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: true,
        syllabusTopics: ['Advanced Algorithms & Computational Complexity', 'Mathematical Statistics & Probability Models', 'Artificial Intelligence & Machine Learning Foundations', 'Distributed Cloud Architecture & Database Engineering'],
        inclusions: { totalLectures: 130, totalHours: 105, totalEbooks: 8, totalLiveSessions: 22, totalMockTests: 12, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      },
      {
        title: 'M.A (Master of Arts) English Literature, Public Administration & Modern History',
        category: catMap['HIGHER_EDU'],
        stateCode: 'GLOBAL',
        subCategory: 'MA',
        subCategoryTitle: 'M.A (Master of Arts)',
        boardOrGrade: 'M.A Post Graduate Degree',
        subjectName: 'English Literature, History & Political Science',
        description: 'Postgraduate arts curriculum covering literary theory, Shakespearean drama, Indian writing in English, public administration theories, and post-colonial global history.',
        price: 2499,
        originalPrice: 4999,
        validityDays: 365,
        instructor: adminId,
        thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800',
        courseMode: 'RECORDED_VIDEO',
        ebookTitle: 'M.A Literary Theory, Cultural Studies & Critical Analysis Reader',
        ebookPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFeatured: false,
        syllabusTopics: ['British Literature & Modernism', 'Literary Criticism & Contemporary Theory', 'Public Policy & Administrative Thought', 'Research Writing & Qualitative Methodology'],
        inclusions: { totalLectures: 90, totalHours: 70, totalEbooks: 5, totalLiveSessions: 12, totalMockTests: 8, hasCertificate: true, hasDoubtSupport: true, hasDownloadableNotes: true }
      }
    ];

    console.log(`Starting to insert/upsert ${coursesToSeed.length} complete catalog courses...`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const cData of coursesToSeed) {
      // Find by subCategory and title to prevent duplicates
      const existing = await Course.findOne({
        $or: [
          { subCategory: cData.subCategory, category: cData.category },
          { title: cData.title }
        ]
      });

      if (existing) {
        // Update existing with rich data
        Object.assign(existing, cData);
        existing.active = true;
        await existing.save();
        updatedCount++;
        console.log(`✓ Updated course: [${cData.subCategory}] ${cData.title}`);
      } else {
        // Create new
        const newCourse = new Course({
          ...cData,
          active: true
        });
        await newCourse.save();
        createdCount++;
        console.log(`+ Created new course: [${cData.subCategory}] ${cData.title}`);
      }
    }

    const totalNow = await Course.countDocuments({ active: true });
    console.log(`\n🎉 CATALOG SEED COMPLETE!`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Total Active Courses in Database: ${totalNow}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding complete catalog:', err);
    process.exit(1);
  }
};

seedCompleteCatalog();
