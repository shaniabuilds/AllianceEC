/**
 * Master Data Taxonomy for E-Learning Platform (Image 1 & Image 2 Architecture)
 */

const INDIAN_STATES = [
  { code: 'GLOBAL', name: 'GLOBAL (All India)' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'DL', name: 'Delhi' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'TS', name: 'Telangana' },
  { code: 'KL', name: 'Kerala' },
  { code: 'BR', name: 'Bihar' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'PB', name: 'Punjab' },
  { code: 'HR', name: 'Haryana' },
  { code: 'OR', name: 'Odisha' },
  { code: 'AS', name: 'Assam' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'CT', name: 'Chhattisgarh' },
  { code: 'UT', name: 'Uttarakhand' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'GA', name: 'Goa' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'TR', name: 'Tripura' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MN', name: 'Manipur' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'AN', name: 'Andaman & Nicobar Islands' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'PY', name: 'Puducherry' }
];

const CORE_MODULES_TAXONOMY = [
  {
    code: 'SCHOOL_K12',
    title: 'I. School Education (Class 1 to 12)',
    description: 'Classes 1–12 State Boards, CBSE, ICSE & Senior Secondary (+1 & +2 Science, Commerce, Arts)',
    icon: 'GraduationCap',
    subCategories: [
      {
        code: 'STATE_BOARD_MEDIUM',
        title: 'State Board - State Medium / Bilingual (Classes 1–10)',
        hasStreams: false
      },
      {
        code: 'STATE_BOARD_ENGLISH',
        title: 'State Board - English Medium (Classes 1–10)',
        hasStreams: false
      },
      {
        code: 'CBSE_BOARD',
        title: 'CBSE Board (Classes 1–10)',
        hasStreams: false
      },
      {
        code: 'ICSE_BOARD',
        title: 'ICSE Board (Classes 1–10)',
        hasStreams: false
      },
      {
        code: 'PUC_SENIOR_SECONDARY',
        title: 'PUC / Senior Secondary (+1 & +2)',
        hasStreams: true,
        streams: [
          'Arts Stream (Subjects 1–6)',
          'Commerce Stream (Subjects 1–6)',
          'Science Stream (Subjects 1–6)'
        ]
      }
    ]
  },
  {
    code: 'COMPETITIVE_EXAMS',
    title: 'II. School Entrance & Competitive Exams',
    description: 'Navodaya Entrance, NTS, G-MAT, NET, NEET, & JEE Preparation',
    icon: 'Sparkles',
    subCategories: [
      { code: 'NAVODAYA', title: 'Navodaya Entrance Exam', hasStreams: false },
      { code: 'NTS', title: 'NTS (National Talent Search)', hasStreams: false },
      { code: 'GMAT', title: 'G-MAT', hasStreams: false },
      { code: 'NET', title: 'NET', hasStreams: false },
      { code: 'NEET', title: 'NEET (National Eligibility cum Entrance Test)', hasStreams: false },
      { code: 'JEE', title: 'JEE (Joint Entrance Examination)', hasStreams: false }
    ]
  },
  {
    code: 'HIGHER_EDU',
    title: 'III. Higher Education – UG & PG',
    description: 'Master of Arts (M.A), M.Com, M.Sc, MBA & Custom Degrees',
    icon: 'BookOpen',
    subCategories: [
      { code: 'MA', title: 'M.A (Master of Arts)', hasStreams: false },
      { code: 'MCOM', title: 'M.Com (Master of Commerce)', hasStreams: false },
      { code: 'MSC', title: 'M.Sc (Master of Science)', hasStreams: false },
      { code: 'MBA', title: 'MBA (Master of Business Administration)', hasStreams: false },
      { code: 'OTHER_UG_PG', title: 'Custom / Other UG-PG Courses', hasStreams: false }
    ]
  },
  {
    code: 'STATE_GOVT_JOBS',
    title: 'IV. State Government Jobs Preparation',
    description: 'SDA, FDA, GPT, KAS & Other State Public Service Exams',
    icon: 'ShieldCheck',
    subCategories: [
      { code: 'SDA', title: 'SDA (Second Division Assistant)', hasStreams: false },
      { code: 'FDA', title: 'FDA (First Division Assistant)', hasStreams: false },
      { code: 'GPT', title: 'GPT (General Primary Teacher)', hasStreams: false },
      { code: 'KAS', title: 'KAS (Karnataka Administrative Services)', hasStreams: false },
      { code: 'OTHER_STATE_EXAMS', title: 'Other State Exams', hasStreams: false }
    ]
  },
  {
    code: 'CENTRAL_GOVT_JOBS',
    title: 'V. Central Government Jobs Preparation',
    description: 'Banking (IBPS, SBI), Railway Recruitment Board (RRB), IAS / Civil Services',
    icon: 'Landmark',
    subCategories: [
      { code: 'BANKING', title: 'Banking Exams (IBPS, SBI, etc.)', hasStreams: false },
      { code: 'RRB', title: 'Railway Recruitment Board (RRB)', hasStreams: false },
      { code: 'IAS_UPSC', title: 'IAS / Civil Services', hasStreams: false },
      { code: 'OTHER_CENTRAL_EXAMS', title: 'Other Central Exams', hasStreams: false }
    ]
  },
  {
    code: 'TEACHER_PREP',
    title: 'VI. Teacher Preparation & Certifications',
    description: 'B.Ed, M.Ed, TET, CTET & Educator Qualification Examinations',
    icon: 'Award',
    subCategories: [
      { code: 'BED', title: 'B.Ed (Bachelor of Education)', hasStreams: false },
      { code: 'MED', title: 'M.Ed (Master of Education)', hasStreams: false },
      { code: 'TET', title: 'TET (Teacher Eligibility Test)', hasStreams: false },
      { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false },
      { code: 'OTHER_TEACHING', title: 'Other Teaching Certification Exams', hasStreams: false }
    ]
  }
];

module.exports = {
  INDIAN_STATES,
  CORE_MODULES_TAXONOMY
};
