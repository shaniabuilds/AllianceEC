export interface StateOption {
  id: string;
  name: string;
  code: string;
  popularCourse: string;
  studentsCount: string;
}

export interface MainCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  coursesCount: number;
  gradient: string;
  popularItems: string[];
}

export interface Course {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  level: string;
  price: number;
  originalPrice: number;
  rating: number;
  totalStudents: number;
  subjectsCount: number;
  badge?: string;
}

export interface Subject {
  id: string;
  courseId: string;
  title: string;
  code: string;
  icon: string;
  chaptersCount: number;
  completedLessons: number;
  totalLessons: number;
  color: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  title: string;
  description: string;
  duration: string;
  assets: {
    lessonsCount: number;
    notesCount: number;
    mcqsCount: number;
    videosCount: number;
  };
}

export interface McqQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface EBook {
  id: string;
  title: string;
  author: string;
  category: string;
  coverColor: string;
  price: number;
  originalPrice: number;
  rating: number;
  pages: number;
  format: string;
  purchased: boolean;
  sampleText: string;
}

export interface WalletTransaction {
  id: string;
  type: 'TOPUP' | 'COURSE_PURCHASE' | 'EBOOK_PURCHASE' | 'MLM_COMMISSION';
  title: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  referenceId: string;
}

export interface MlmNode {
  id: string;
  name: string;
  userId: string;
  rank: string;
  joiningDate: string;
  leftVolumePV: number;
  rightVolumePV: number;
  personalPV: number;
  matchingIncome: number;
  directReferrals: number;
  leftLeg?: MlmNode;
  rightLeg?: MlmNode;
}

export interface KycRecord {
  id: string;
  userName: string;
  mobile: string;
  state: string;
  documentType: 'Aadhaar Card' | 'PAN Card' | 'Voter ID';
  documentNumber: string;
  submittedAt: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

// Data Collections

export const INDIAN_STATES: StateOption[] = [
  { id: 'ka', name: 'Karnataka', code: 'KA', popularCourse: 'Karnataka State Board / SSLC / PUC', studentsCount: '1.2 Lakh+' },
  { id: 'dl', name: 'Delhi NCR', code: 'DL', popularCourse: 'CBSE 10th & 12th Board / JEE Mains', studentsCount: '2.5 Lakh+' },
  { id: 'mh', name: 'Maharashtra', code: 'MH', popularCourse: 'MHT-CET / State Board HSC', studentsCount: '1.8 Lakh+' },
  { id: 'up', name: 'Uttar Pradesh', code: 'UP', popularCourse: 'UP Board / State Govt Jobs (UPPCS)', studentsCount: '3.1 Lakh+' },
  { id: 'tn', name: 'Tamil Nadu', code: 'TN', popularCourse: 'TN State Board / NEET Prep', studentsCount: '1.4 Lakh+' },
  { id: 'wb', name: 'West Bengal', code: 'WB', popularCourse: 'WBBSE / WBJEE Entrance', studentsCount: '1.1 Lakh+' },
];

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: 'school',
    title: 'School Education (K-12)',
    subtitle: 'State Boards, CBSE, ICSE & Senior Secondary PUC (+1 & +2)',
    iconName: 'GraduationCap',
    coursesCount: 24,
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    popularItems: ['State Board Class 1-10', 'CBSE Class 10th', 'ICSE Science Stream', 'PUC Science (+1/+2)']
  },
  {
    id: 'competitive',
    title: 'School Entrance & Competitive Exams',
    subtitle: 'NEET, JEE Mains, NET, G-MAT, Navodaya & NTS Entrance',
    iconName: 'Award',
    coursesCount: 18,
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)',
    popularItems: ['NEET UG 2026 Batch', 'JEE Mains & Advanced', 'Navodaya Class 6 Entrance', 'NTS Talent Search']
  },
  {
    id: 'higher_ed',
    title: 'Higher Education (UG & PG)',
    subtitle: 'Degree Courses (M.A, M.Com, M.Sc, MBA & Custom Modules)',
    iconName: 'BookOpen',
    coursesCount: 15,
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    popularItems: ['Master of Arts (M.A)', 'Master of Commerce (M.Com)', 'M.Sc Physics', 'MBA Core Fundamentals']
  },
  {
    id: 'state_jobs',
    title: 'State Government Jobs Prep',
    subtitle: 'State Public Service Commissions (SDA, FDA, GPT, KAS)',
    iconName: 'Building2',
    coursesCount: 22,
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    popularItems: ['KAS Administrative Service', 'FDA / SDA General Studies', 'Primary Teacher (GPT)', 'State Police Exam']
  },
  {
    id: 'central_jobs',
    title: 'Central Government Jobs Prep',
    subtitle: 'Banking (IBPS/SBI), Railways (RRB), SSC & IAS Civil Services',
    iconName: 'Landmark',
    coursesCount: 20,
    gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    popularItems: ['Banking IBPS / SBI PO', 'Railway RRB NTPC', 'SSC CGL Tier 1 & 2', 'IAS GS Paper I & II']
  },
  {
    id: 'teacher_prep',
    title: 'Teacher Preparation & Certifications',
    subtitle: 'B.Ed, M.Ed, State TET, CTET & Educational Pedagogy',
    iconName: 'UserCheck',
    coursesCount: 12,
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    popularItems: ['CTET Paper 1 & 2', 'State TET Exam Pack', 'B.Ed Pedagogy & Methodology', 'M.Ed Leadership']
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'course_cbse10',
    categoryId: 'school',
    title: 'CBSE Class 10 Complete Master Course',
    description: 'Comprehensive coverage of Science, Maths, Social Science & English with Chapter Notes and MCQs.',
    level: 'Class 10th',
    price: 1499,
    originalPrice: 3999,
    rating: 4.9,
    totalStudents: 14200,
    subjectsCount: 5,
    badge: 'BESTSELLER'
  },
  {
    id: 'course_state_sslc',
    categoryId: 'school',
    title: 'State Board Class 10 (SSLC English & Regional Medium)',
    description: 'Full syllabus covered by top State educators with solved paper archives.',
    level: 'Class 10th',
    price: 1299,
    originalPrice: 2999,
    rating: 4.8,
    totalStudents: 18900,
    subjectsCount: 6,
    badge: 'POPULAR'
  },
  {
    id: 'course_neet2026',
    categoryId: 'competitive',
    title: 'NEET UG 2026 Ultimate Crash Course',
    description: 'High-yield Physics, Chemistry, Biology chapter breakdowns, 5000+ MCQs, and Mock Tests.',
    level: 'Entrance',
    price: 2999,
    originalPrice: 7999,
    rating: 4.95,
    totalStudents: 8500,
    subjectsCount: 3,
    badge: 'FEATURED'
  },
  {
    id: 'course_kas_gs',
    categoryId: 'state_jobs',
    title: 'KAS / State Officer Prelims & Mains General Studies',
    description: 'Indian Polity, History, State Geography, Economy, and Current Affairs targeted module.',
    level: 'State Officer',
    price: 2499,
    originalPrice: 5999,
    rating: 4.7,
    totalStudents: 6300,
    subjectsCount: 4,
    badge: 'HIGH DEMAND'
  }
];

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'subj_physics',
    courseId: 'course_cbse10',
    title: 'Physics & Physical Science',
    code: 'PHY-10',
    icon: 'Zap',
    chaptersCount: 6,
    completedLessons: 12,
    totalLessons: 18,
    color: '#6366F1'
  },
  {
    id: 'subj_maths',
    courseId: 'course_cbse10',
    title: 'Mathematics & Algebra',
    code: 'MTH-10',
    icon: 'Calculator',
    chaptersCount: 8,
    completedLessons: 15,
    totalLessons: 24,
    color: '#10B981'
  },
  {
    id: 'subj_chemistry',
    courseId: 'course_cbse10',
    title: 'Chemistry & Reactions',
    code: 'CHM-10',
    icon: 'FlaskConical',
    chaptersCount: 5,
    completedLessons: 8,
    totalLessons: 15,
    color: '#0EA5E9'
  },
  {
    id: 'subj_biology',
    courseId: 'course_cbse10',
    title: 'Biology & Life Processes',
    code: 'BIO-10',
    icon: 'Dna',
    chaptersCount: 6,
    completedLessons: 10,
    totalLessons: 16,
    color: '#EC4899'
  }
];

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'chap_1',
    subjectId: 'subj_physics',
    chapterNumber: 1,
    title: 'Light: Reflection and Refraction',
    description: 'Laws of reflection, spherical mirrors, ray diagrams, refractive index, lens formula, and magnification.',
    duration: '2 hours 45 mins',
    assets: { lessonsCount: 4, notesCount: 2, mcqsCount: 15, videosCount: 3 }
  },
  {
    id: 'chap_2',
    subjectId: 'subj_physics',
    chapterNumber: 2,
    title: 'Electricity & Electric Circuits',
    description: 'Electric potential, Ohm’s Law, resistance factors, series & parallel combinations, heating effect of electric current.',
    duration: '3 hours 10 mins',
    assets: { lessonsCount: 5, notesCount: 3, mcqsCount: 20, videosCount: 4 }
  },
  {
    id: 'chap_3',
    subjectId: 'subj_physics',
    chapterNumber: 3,
    title: 'Magnetic Effects of Electric Current',
    description: 'Magnetic field lines, Fleming’s Left-Hand rule, electromagnetic induction, electric motor, and domestic wiring.',
    duration: '2 hours 15 mins',
    assets: { lessonsCount: 3, notesCount: 2, mcqsCount: 12, videosCount: 2 }
  }
];

export const MOCK_MCQS: McqQuestion[] = [
  {
    id: 1,
    question: 'The focal length of a spherical mirror of radius of curvature 30 cm is:',
    options: ['30 cm', '15 cm', '60 cm', '7.5 cm'],
    correctOptionIndex: 1,
    explanation: 'The focal length (f) of a spherical mirror is equal to half of its radius of curvature (R). Formula: f = R / 2 = 30 / 2 = 15 cm.'
  },
  {
    id: 2,
    question: 'SI unit of electric resistance is:',
    options: ['Ampere', 'Volt', 'Ohm', 'Joule'],
    correctOptionIndex: 2,
    explanation: 'According to Ohm’s Law (V = IR), Resistance R = V/I. The SI unit of electric resistance is Ohm (represented by Ω).'
  },
  {
    id: 3,
    question: 'Which device is used to measure potential difference across two points in a circuit?',
    options: ['Ammeter', 'Voltmeter', 'Galvanometer', 'Rheostat'],
    correctOptionIndex: 1,
    explanation: 'A Voltmeter is connected in parallel across the components to measure potential difference in volts.'
  },
  {
    id: 4,
    question: 'The refractive index of water with respect to air is 4/3. The speed of light in water is approximately:',
    options: ['3 × 10⁸ m/s', '2.25 × 10⁸ m/s', '1.5 × 10⁸ m/s', '2.0 × 10⁸ m/s'],
    correctOptionIndex: 1,
    explanation: 'Speed of light in medium v = c / n = (3 × 10⁸) / (4/3) = (3 × 10⁸ × 3) / 4 = 2.25 × 10⁸ m/s.'
  },
  {
    id: 5,
    question: 'The commercial unit of electrical energy is kilowatt-hour (kWh). 1 kWh is equal to:',
    options: ['3.6 × 10⁵ J', '3.6 × 10⁶ J', '1000 J', '3600 J'],
    correctOptionIndex: 1,
    explanation: '1 kWh = 1 kW × 1 hour = 1000 W × 3600 s = 3.6 × 10⁶ Joules.'
  }
];

export const MOCK_EBOOKS: EBook[] = [
  {
    id: 'eb_1',
    title: 'Mastering Indian Polity & Constitution (Quick Handbook)',
    author: 'Dr. R. K. Sharma',
    category: 'Competitive Exams',
    coverColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    price: 199,
    originalPrice: 499,
    rating: 4.9,
    pages: 280,
    format: 'EPUB / PDF',
    purchased: true,
    sampleText: 'Chapter 1: Preamble to the Constitution of India. The Preamble secures Justice, Liberty, Equality, and Fraternity for all citizens. It embodies the fundamental philosophy and values upon which the Republic is founded...'
  },
  {
    id: 'eb_2',
    title: 'Class 10 Physics Formulas & Concept Mind Maps',
    author: 'Prof. Ananya Sen',
    category: 'School Education',
    coverColor: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    price: 149,
    originalPrice: 299,
    rating: 4.8,
    pages: 120,
    format: 'PDF Reader',
    purchased: false,
    sampleText: 'Key Formulae Summary: 1. Ohm Law: V = IR. 2. Power: P = VI = I²R = V²/R. 3. Lens Formula: 1/f = 1/v - 1/u. 4. Mirror Formula: 1/f = 1/v + 1/u...'
  },
  {
    id: 'eb_3',
    title: '5000+ High-Yield MCQs for State Govt Exams',
    author: 'EduVerse Editorial Board',
    category: 'State Govt Jobs',
    coverColor: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    price: 299,
    originalPrice: 799,
    rating: 4.95,
    pages: 450,
    format: 'Interactive PDF',
    purchased: false,
    sampleText: 'Set 1: General Studies & Karnataka State History. Q1: Who was the founder of the Vijayanagara Empire? Answer: Harihara and Bukka in 1336 AD...'
  }
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'TXN-9021',
    type: 'TOPUP',
    title: 'Wallet Top-Up via Razorpay UPI',
    amount: 2000,
    date: '26 Aug 2026, 10:15 AM',
    status: 'SUCCESS',
    referenceId: 'pay_P89127391'
  },
  {
    id: 'TXN-9022',
    type: 'COURSE_PURCHASE',
    title: 'Course Enrolled: CBSE Class 10 Master Course',
    amount: -1499,
    date: '26 Aug 2026, 10:20 AM',
    status: 'SUCCESS',
    referenceId: 'crs_CBSE10'
  },
  {
    id: 'TXN-9023',
    type: 'MLM_COMMISSION',
    title: 'Binary Leg Matching Volume Commission (Right Leg PV)',
    amount: 1750,
    date: '25 Aug 2026, 06:30 PM',
    status: 'SUCCESS',
    referenceId: 'mlm_COMM_772'
  },
  {
    id: 'TXN-9024',
    type: 'EBOOK_PURCHASE',
    title: 'E-Book Bought: Mastering Indian Polity',
    amount: -199,
    date: '24 Aug 2026, 02:45 PM',
    status: 'SUCCESS',
    referenceId: 'eb_199'
  }
];

export const MOCK_MLM_TREE: MlmNode = {
  id: 'MLM-001',
  name: 'Shamshad (You)',
  userId: 'EDU-99201',
  rank: 'DIAMOND PARTNER',
  joiningDate: '15 Aug 2026',
  leftVolumePV: 4500,
  rightVolumePV: 3800,
  personalPV: 1200,
  matchingIncome: 15200,
  directReferrals: 8,
  leftLeg: {
    id: 'MLM-002',
    name: 'Rahul Sharma',
    userId: 'EDU-99202',
    rank: 'GOLD MEMBER',
    joiningDate: '18 Aug 2026',
    leftVolumePV: 2200,
    rightVolumePV: 2300,
    personalPV: 800,
    matchingIncome: 6400,
    directReferrals: 4,
    leftLeg: {
      id: 'MLM-004',
      name: 'Priya Verma',
      userId: 'EDU-99204',
      rank: 'SILVER MEMBER',
      joiningDate: '20 Aug 2026',
      leftVolumePV: 1000,
      rightVolumePV: 1200,
      personalPV: 500,
      matchingIncome: 2500,
      directReferrals: 2
    },
    rightLeg: {
      id: 'MLM-005',
      name: 'Amit Patel',
      userId: 'EDU-99205',
      rank: 'SILVER MEMBER',
      joiningDate: '21 Aug 2026',
      leftVolumePV: 1100,
      rightVolumePV: 900,
      personalPV: 500,
      matchingIncome: 2100,
      directReferrals: 2
    }
  },
  rightLeg: {
    id: 'MLM-003',
    name: 'Kavita Singh',
    userId: 'EDU-99203',
    rank: 'GOLD MEMBER',
    joiningDate: '19 Aug 2026',
    leftVolumePV: 1900,
    rightVolumePV: 1900,
    personalPV: 750,
    matchingIncome: 5800,
    directReferrals: 3,
    leftLeg: {
      id: 'MLM-006',
      name: 'Sandeep Kumar',
      userId: 'EDU-99206',
      rank: 'BRONZE MEMBER',
      joiningDate: '22 Aug 2026',
      leftVolumePV: 800,
      rightVolumePV: 600,
      personalPV: 300,
      matchingIncome: 1200,
      directReferrals: 1
    },
    rightLeg: {
      id: 'MLM-007',
      name: 'Deepak Joshi',
      userId: 'EDU-99207',
      rank: 'BRONZE MEMBER',
      joiningDate: '23 Aug 2026',
      leftVolumePV: 950,
      rightVolumePV: 950,
      personalPV: 300,
      matchingIncome: 1800,
      directReferrals: 1
    }
  }
};

export const MOCK_KYC_QUEUE: KycRecord[] = [
  {
    id: 'KYC-881',
    userName: 'Rajesh Malhotra',
    mobile: '+91 9876543210',
    state: 'Karnataka',
    documentType: 'Aadhaar Card',
    documentNumber: 'XXXX-XXXX-9012',
    submittedAt: '26 Aug 2026, 09:30 AM',
    status: 'PENDING'
  },
  {
    id: 'KYC-882',
    userName: 'Sneha Reddy',
    mobile: '+91 9812345678',
    state: 'Delhi NCR',
    documentType: 'PAN Card',
    documentNumber: 'ABCDE1234F',
    submittedAt: '25 Aug 2026, 04:15 PM',
    status: 'VERIFIED'
  },
  {
    id: 'KYC-883',
    userName: 'Venkatesh Rao',
    mobile: '+91 9765432109',
    state: 'Maharashtra',
    documentType: 'Aadhaar Card',
    documentNumber: 'XXXX-XXXX-4567',
    submittedAt: '25 Aug 2026, 01:20 PM',
    status: 'PENDING'
  }
];
