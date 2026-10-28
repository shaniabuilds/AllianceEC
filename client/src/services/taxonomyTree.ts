export interface SubCategoryItem {
  code: string;
  title: string;
  hasStreams: boolean;
  streams?: string[];
}

export interface CoreModuleItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  subCategories: SubCategoryItem[];
}

export interface StateItem {
  code: string;
  name: string;
}

export const INDIAN_STATES_LIST: StateItem[] = [
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

export const COMMON_SUBJECTS_LIST: string[] = [
  'All Subjects (Complete Package)',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'General Science',
  'Social Studies & History',
  'English Language & Literature',
  'State Language (Kannada / Hindi / Regional)',
  'Quantitative Aptitude & Reasoning',
  'General Knowledge & Current Affairs',
  'Child Development & Pedagogy',
  'Financial Management & Business Analytics',
  'Computer Science & Programming'
];

export const CORE_MODULES_LIST: CoreModuleItem[] = [
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
    description: 'Navodaya Entrance Exam, NTS, G-MAT, NET, NEET, & JEE Preparation',
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

export const getSubCategoriesForModuleAndState = (moduleCode: string, stateCode: string = 'GLOBAL'): SubCategoryItem[] => {
  const st = (stateCode || 'GLOBAL').toUpperCase();

  if (moduleCode === 'STATE_GOVT_JOBS') {
    switch (st) {
      case 'UP':
        return [
          { code: 'UPPSC', title: 'UPPSC (UP Public Service Commission / PCS)', hasStreams: false },
          { code: 'UPSSSC', title: 'UPSSSC (Subordinate Services & Lekhpal/VDO)', hasStreams: false },
          { code: 'UP_POLICE', title: 'UP Police Constable & Sub-Inspector (SI)', hasStreams: false },
          { code: 'UP_TEACHER', title: 'UP Super TET & Assistant Teacher Recruitment', hasStreams: false },
          { code: 'OTHER_UP_EXAMS', title: 'Other UP State Government Exams', hasStreams: false }
        ];
      case 'KA':
        return [
          { code: 'KAS', title: 'KAS (Karnataka Administrative Services)', hasStreams: false },
          { code: 'SDA', title: 'SDA (Second Division Assistant)', hasStreams: false },
          { code: 'FDA', title: 'FDA (First Division Assistant)', hasStreams: false },
          { code: 'GPT', title: 'GPT (General Primary Teacher)', hasStreams: false },
          { code: 'KEA_EXAMS', title: 'KEA Recruitment & Karnataka Police PSI', hasStreams: false }
        ];
      case 'MH':
        return [
          { code: 'MPSC', title: 'MPSC (Maharashtra Public Service Commission)', hasStreams: false },
          { code: 'MH_TALATHI', title: 'Maharashtra Talathi Bharti', hasStreams: false },
          { code: 'MH_POLICE', title: 'Maharashtra Police Bharti & PSI', hasStreams: false },
          { code: 'OTHER_MH_EXAMS', title: 'Other Maharashtra State Exams', hasStreams: false }
        ];
      case 'BR':
        return [
          { code: 'BPSC', title: 'BPSC (Bihar Public Service Commission)', hasStreams: false },
          { code: 'BSSC', title: 'BSSC (Bihar Staff Selection Commission)', hasStreams: false },
          { code: 'BIHAR_POLICE', title: 'Bihar Police Constable & SI', hasStreams: false },
          { code: 'BIHAR_TRE', title: 'Bihar Teacher Recruitment (BPSC TRE 3.0/4.0)', hasStreams: false }
        ];
      case 'RJ':
        return [
          { code: 'RPSC_RAS', title: 'RPSC RAS (Rajasthan Administrative Services)', hasStreams: false },
          { code: 'REET', title: 'REET (Rajasthan Eligibility Examination for Teachers)', hasStreams: false },
          { code: 'RJ_PATWARI', title: 'Rajasthan Patwari & VDO', hasStreams: false },
          { code: 'RJ_POLICE', title: 'Rajasthan Police Constable & SI', hasStreams: false }
        ];
      case 'DL':
        return [
          { code: 'DSSSB', title: 'DSSSB (Delhi Subordinate Services Selection Board)', hasStreams: false },
          { code: 'DELHI_POLICE', title: 'Delhi Police Executive & Head Constable', hasStreams: false },
          { code: 'DDC_EXAMS', title: 'Delhi District Courts & Govt Exams', hasStreams: false }
        ];
      case 'MP':
        return [
          { code: 'MPPSC', title: 'MPPSC (MP Public Service Commission)', hasStreams: false },
          { code: 'MP_PATWARI', title: 'MP Patwari & Sub Engineer', hasStreams: false },
          { code: 'MP_POLICE', title: 'MP Police Constable & SI', hasStreams: false }
        ];
      case 'TN':
        return [
          { code: 'TNPSC_G1', title: 'TNPSC Group 1 & Group 2', hasStreams: false },
          { code: 'TNPSC_G4', title: 'TNPSC Group 4 & VAO', hasStreams: false },
          { code: 'TN_POLICE', title: 'TNUSRB Tamil Nadu Police Constable/SI', hasStreams: false }
        ];
      case 'WB':
        return [
          { code: 'WBPSC', title: 'WBPSC (West Bengal Public Service Commission)', hasStreams: false },
          { code: 'WB_POLICE', title: 'West Bengal Police Constable & SI', hasStreams: false },
          { code: 'WB_PRIMARY_TET', title: 'WB Primary TET & School Service', hasStreams: false }
        ];
      default:
        return [
          { code: 'STATE_PSC', title: 'State Public Service Commission (PSC / PCS)', hasStreams: false },
          { code: 'STATE_SSSC', title: 'State Staff Selection Commission (SSSC / SSC)', hasStreams: false },
          { code: 'STATE_POLICE', title: 'State Police Constable & Sub-Inspector (SI)', hasStreams: false },
          { code: 'STATE_REVENUE', title: 'State Revenue / Lekhpal / Patwari Exams', hasStreams: false },
          { code: 'OTHER_STATE_EXAMS', title: 'Other State Government Exams', hasStreams: false }
        ];
    }
  }

  if (moduleCode === 'SCHOOL_K12') {
    switch (st) {
      case 'UP':
        return [
          { code: 'UP_BOARD_HINDI', title: 'UP Board - Hindi Medium (Classes 1–10)', hasStreams: false },
          { code: 'UP_BOARD_ENG', title: 'UP Board - English Medium (Classes 1–10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'ICSE_BOARD', title: 'ICSE Board (Classes 1–10)', hasStreams: false },
          { code: 'UP_INTERMEDIATE', title: 'UP Board Intermediate (+1 & +2 Class 11-12)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
      case 'KA':
        return [
          { code: 'STATE_BOARD_MEDIUM', title: 'Karnataka Board - Kannada Medium (Classes 1–10)', hasStreams: false },
          { code: 'STATE_BOARD_ENGLISH', title: 'Karnataka Board - English Medium (Classes 1–10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'ICSE_BOARD', title: 'ICSE Board (Classes 1–10)', hasStreams: false },
          { code: 'PUC_SENIOR_SECONDARY', title: 'Karnataka 1st & 2nd PUC (+1 & +2)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
      case 'MH':
        return [
          { code: 'MH_BOARD_MARATHI', title: 'Maharashtra Board - SSC Marathi Medium (1-10)', hasStreams: false },
          { code: 'MH_BOARD_ENG', title: 'Maharashtra Board - SSC English Medium (1-10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'MH_HSC', title: 'Maharashtra HSC Board (+1 & +2 Class 11-12)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
      case 'BR':
        return [
          { code: 'BSEB_HINDI', title: 'Bihar Board BSEB - Hindi Medium (Classes 1-10)', hasStreams: false },
          { code: 'BSEB_ENG', title: 'Bihar Board BSEB - English Medium (Classes 1-10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'BSEB_INTER', title: 'Bihar Board BSEB Intermediate (+1 & +2)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
      case 'RJ':
        return [
          { code: 'RBSE_HINDI', title: 'Rajasthan Board RBSE (Classes 1-10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'RBSE_SENIOR', title: 'Rajasthan Board Senior Secondary (+1 & +2)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
      default:
        return [
          { code: 'STATE_BOARD_MEDIUM', title: 'State Board - State Medium (Classes 1–10)', hasStreams: false },
          { code: 'STATE_BOARD_ENGLISH', title: 'State Board - English Medium (Classes 1–10)', hasStreams: false },
          { code: 'CBSE_BOARD', title: 'CBSE Board (Classes 1–10)', hasStreams: false },
          { code: 'ICSE_BOARD', title: 'ICSE Board (Classes 1–10)', hasStreams: false },
          { code: 'PUC_SENIOR_SECONDARY', title: 'State Senior Secondary (+1 & +2)', hasStreams: true, streams: ['Arts Stream (Subjects 1–6)', 'Commerce Stream (Subjects 1–6)', 'Science Stream (Subjects 1–6)'] }
        ];
    }
  }

  if (moduleCode === 'TEACHER_PREP') {
    switch (st) {
      case 'UP':
        return [
          { code: 'UPTET_P1', title: 'UPTET Paper 1 (Classes 1-5 Primary Teacher)', hasStreams: false },
          { code: 'UPTET_P2', title: 'UPTET Paper 2 (Classes 6-8 Upper Primary)', hasStreams: false },
          { code: 'UP_SUPER_TET', title: 'UP Super TET (Assistant Teacher Recruitment)', hasStreams: false },
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false }
        ];
      case 'KA':
        return [
          { code: 'KTET_P1', title: 'K-TET Paper 1 (Classes 1-5 Primary Teacher)', hasStreams: false },
          { code: 'KTET_P2', title: 'K-TET Paper 2 (Classes 6-8 Upper Primary)', hasStreams: false },
          { code: 'KA_GPT_RECRUIT', title: 'Karnataka GPT & HPT Teacher Recruitment', hasStreams: false },
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false }
        ];
      case 'MH':
        return [
          { code: 'MAHA_TET_1', title: 'MAHA-TET Paper 1 (Primary Teacher)', hasStreams: false },
          { code: 'MAHA_TET_2', title: 'MAHA-TET Paper 2 (Upper Primary)', hasStreams: false },
          { code: 'MAHA_TAIT', title: 'MAHA-TAIT (Teacher Aptitude Test)', hasStreams: false },
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false }
        ];
      case 'BR':
        return [
          { code: 'BIHAR_STET', title: 'Bihar STET Paper 1 & 2', hasStreams: false },
          { code: 'BPSC_TRE_TEACHER', title: 'BPSC Bihar Teacher TRE 3.0 / 4.0 Recruitment', hasStreams: false },
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false }
        ];
      case 'RJ':
        return [
          { code: 'REET_L1', title: 'REET Level 1 (Classes 1-5 Primary)', hasStreams: false },
          { code: 'REET_L2', title: 'REET Level 2 (Classes 6-8 Upper Primary)', hasStreams: false },
          { code: 'RPSC_GRADE_TEACHER', title: 'RPSC Grade 1 & Grade 2 Teacher Recruitment', hasStreams: false },
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false }
        ];
      default:
        return [
          { code: 'CTET', title: 'CTET (Central Teacher Eligibility Test)', hasStreams: false },
          { code: 'STATE_TET', title: 'State TET (Teacher Eligibility Test)', hasStreams: false },
          { code: 'BED', title: 'B.Ed (Bachelor of Education)', hasStreams: false },
          { code: 'MED', title: 'M.Ed (Master of Education)', hasStreams: false },
          { code: 'OTHER_TEACHING', title: 'Other Teaching Certification Exams', hasStreams: false }
        ];
    }
  }

  const moduleItem = CORE_MODULES_LIST.find((m) => m.code === moduleCode);
  return moduleItem ? moduleItem.subCategories : [];
};

export const getSubjectsForStateAndModule = (stateCode: string = 'GLOBAL'): string[] => {
  const st = (stateCode || 'GLOBAL').toUpperCase();

  if (st === 'UP' || st === 'BR' || st === 'MP' || st === 'RJ') {
    return [
      'All Subjects (Complete Package)',
      'General Hindi (सामान्य हिंदी)',
      'State Special GK & Current Affairs (राज्य विशेष व समसामयिकी)',
      'General Knowledge & Indian History',
      'Quantitative Aptitude & Mathematics',
      'Reasoning & Logical Ability',
      'General Science (Physics, Chemistry, Biology)',
      'Child Development & Pedagogy (बाल विकास व शिक्षाशास्त्र)',
      'English Language & Comprehension'
    ];
  }

  if (st === 'KA') {
    return [
      'All Subjects (Complete Package)',
      'General Kannada (ಸಾಮಾನ್ಯ ಕನ್ನಡ)',
      'Karnataka History, Geography & Economy',
      'General Knowledge & Current Affairs',
      'Quantitative Aptitude & Mental Ability',
      'General Science (Physics, Chemistry, Biology)',
      'Child Development & Pedagogy',
      'English Language & Literature'
    ];
  }

  if (st === 'MH') {
    return [
      'All Subjects (Complete Package)',
      'General Marathi (ಸಾಮಾನ್ಯ ಮರಾಠಿ / मराठी)',
      'Maharashtra History & State Polity',
      'General Knowledge & Current Affairs',
      'Quantitative Aptitude & Reasoning',
      'General Science',
      'English Language'
    ];
  }

  return COMMON_SUBJECTS_LIST;
};

export const getSubCategoriesForModule = (moduleCode: string): SubCategoryItem[] => {
  return getSubCategoriesForModuleAndState(moduleCode, 'GLOBAL');
};

/**
 * Curated, syllabus-aligned granular topics mapped by subject focus.
 * When teacher/admin selects a subject, these detailed topics populate dynamically.
 */
export const SUBJECT_TOPICS_MAP: Record<string, string[]> = {
  'Mathematics': [
    'Arithmetic & Number Systems',
    'Algebra, Polynomials & Linear Equations',
    'Quadratic Equations & Complex Numbers',
    'Trigonometry, Identities & Heights-Distances',
    'Coordinate Geometry & Straight Lines',
    'Differential Calculus & Derivatives',
    'Integral Calculus & Area Under Curves',
    'Differential Equations',
    'Matrices & Determinants',
    'Vector Algebra & 3D Geometry',
    'Probability & Baye\'s Theorem',
    'Statistics, Mean, Median & Standard Deviation',
    'Mensuration, Surface Areas & Volumes',
    'Sequences, Series & Arithmetic-Geometric Progressions',
    'Permutations, Combinations & Binomial Theorem',
    'Mathematical Reasoning & Sets-Relations'
  ],
  'Physics': [
    'Units, Dimensions & Error Analysis',
    'Kinematics (1D & 2D Motion)',
    'Newton\'s Laws of Motion & Friction',
    'Work, Energy, Power & Collisions',
    'Rotational Dynamics & Moment of Inertia',
    'Gravitation & Satellite Motion',
    'Mechanical Properties of Solids & Fluids',
    'Thermodynamics, Heat Transfer & Kinetic Theory',
    'Oscillations, Simple Harmonic Motion (SHM) & Waves',
    'Electrostatics & Electric Fields',
    'Capacitance & Dielectrics',
    'Current Electricity & Kirchhoff\'s Laws',
    'Magnetic Effects of Current & Magnetism',
    'Electromagnetic Induction (EMI) & AC Circuits',
    'Electromagnetic Waves & Ray Optics',
    'Wave Optics, Interference & Diffraction',
    'Dual Nature of Matter & Radiation',
    'Atomic Structure & Nuclear Physics',
    'Semiconductors & Digital Electronics'
  ],
  'Chemistry': [
    'Basic Concepts of Chemistry & Mole Concept',
    'Structure of Atom & Quantum Numbers',
    'Classification of Elements & Periodic Trends',
    'Chemical Bonding & Molecular Orbital Theory',
    'Chemical Thermodynamics & Thermochemistry',
    'Chemical Equilibrium & Le Chatelier\'s Principle',
    'Ionic Equilibrium, pH & Buffer Solutions',
    'Redox Reactions & Electrochemistry',
    'Chemical Kinetics & Rate Laws',
    'Surface Chemistry & Catalysis',
    'General Principles of Metallurgy',
    'p-Block, d-Block & f-Block Elements',
    'Coordination Compounds & IUPAC Nomenclature',
    'Organic Chemistry: Hydrocarbons (Alkanes, Alkenes, Alkynes)',
    'Haloalkanes & Haloarenes',
    'Alcohols, Phenols & Ethers',
    'Aldehydes, Ketones & Carboxylic Acids',
    'Amines & Nitrogen-containing Compounds',
    'Biomolecules, Carbohydrates & Proteins',
    'Polymers & Chemistry in Everyday Life'
  ],
  'Biology': [
    'The Living World & Biological Classification',
    'Plant Kingdom & Morphology of Flowering Plants',
    'Anatomy of Flowering Plants & Plant Tissues',
    'Animal Kingdom & Structural Organisation in Animals',
    'Cell: Structure, Function & Cell Cycle/Division',
    'Biomolecules & Enzymes',
    'Photosynthesis in Higher Plants',
    'Respiration in Plants & Plant Growth Hormones',
    'Digestion, Absorption & Breathing/Gas Exchange',
    'Body Fluids, Circulation & Excretory Products',
    'Locomotion, Movement & Neural Control/Coordination',
    'Chemical Coordination & Endocrine Glands',
    'Reproduction in Organisms & Human Reproduction',
    'Reproductive Health & Contraception',
    'Principles of Inheritance, Variation & Mendelism',
    'Molecular Basis of Inheritance (DNA/RNA & Genetic Code)',
    'Evolution, Darwinism & Speciation',
    'Human Health, Immunity, Diseases & Microbes',
    'Biotechnology: Principles, Processes & Applications',
    'Ecology, Ecosystems, Biodiversity & Conservation'
  ],
  'General Science': [
    'Everyday Physics, Mechanics & Gravity',
    'Heat, Light, Sound & Optical Instruments',
    'Electricity, Magnetism & Domestic Circuits',
    'Acids, Bases, Salts & Everyday Chemical Reactions',
    'Metals, Non-Metals, Carbon & Its Compounds',
    'Human Anatomy, Nutrition, Vitamins & Balanced Diet',
    'Infectious Diseases, Vaccines & Public Health',
    'Plant Structure, Photosynthesis & Agriculture',
    'Ecology, Environment, Global Warming & Pollution Control',
    'Indian Space Research (ISRO), Nuclear Energy & Defence Technology'
  ],
  'Quantitative Aptitude & Reasoning': [
    'Number Series & Missing Number Patterns',
    'Simplification, Fractions & Decimals',
    'Percentages, Ratio, Proportion & Variations',
    'Profit, Loss, Discount & Marked Price',
    'Simple Interest & Compound Interest',
    'Time, Work, Efficiency & Pipes and Cisterns',
    'Speed, Distance, Time, Problems on Trains & Boats',
    'Mixtures, Alligations & Average',
    'Data Interpretation (Bar Graphs, Pie Charts, Tables & Radar)',
    'Coding-Decoding & Analogy',
    'Blood Relations & Family Tree Problems',
    'Direction Sense & Distance Tests',
    'Syllogisms & Logical Venn Diagrams',
    'Seating Arrangements (Linear & Circular)',
    'Puzzles, Order & Ranking',
    'Statement & Assumptions, Arguments & Conclusions',
    'Non-Verbal Reasoning (Paper Folding, Mirror Images, Series)'
  ],
  'Quantitative Aptitude & Mathematics': [
    'Number Systems, HCF & LCM',
    'Algebraic Identities & Linear Equations',
    'Percentages, Profit, Loss & Partnership',
    'Simple & Compound Interest',
    'Time, Work, Speed & Distance',
    'Mensuration 2D & 3D (Area & Volume)',
    'Basic Trigonometry & Height-Distance',
    'Data Interpretation & Probability'
  ],
  'Reasoning & Logical Ability': [
    'Analogies & Classification',
    'Coding & Decoding',
    'Series Completion (Number & Alphabet)',
    'Blood Relations & Direction Sense',
    'Syllogisms & Deductive Logic',
    'Seating Arrangements & Complex Puzzles',
    'Input-Output & Machine Logic',
    'Critical Reasoning & Course of Action'
  ],
  'General Knowledge & Current Affairs': [
    'Indian Constitution, Preamble & Fundamental Rights',
    'Parliament, President, Prime Minister & Judiciary',
    'Ancient, Medieval & Modern Indian History',
    'Indian National Movement & Freedom Struggle (1857-1947)',
    'Physical Geography of India (Rivers, Mountains, Climate, Soils)',
    'World Geography & Major Natural Regions',
    'Indian Economy, Inflation, Banking & Union Budget',
    'Government Welfare Schemes & Digital India Initiatives',
    'National & International Awards, Sports & Summits',
    'Latest National & International Current Affairs (Monthly Wrap)'
  ],
  'General Knowledge & Indian History': [
    'Indus Valley Civilization & Vedic Age',
    'Buddhism, Jainism, Mauryas & Guptas',
    'Delhi Sultanate & Mughal Empire',
    'British Rule & Socio-Religious Reform Movements',
    'Freedom Struggle, Gandhian Era & Independence 1947',
    'Indian Constitution & Democratic System',
    'Geography of India & Natural Resources',
    'Economic Development & Five-Year Plans'
  ],
  'Child Development & Pedagogy': [
    'Concept of Child Growth, Maturation & Development',
    'Principles of Child Development & Heredity vs Environment',
    'Piaget, Kohlberg & Vygotsky Cognitive Theories',
    'Concepts of Child-Centered & Progressive Education',
    'Construct of Intelligence & Multi-Dimensional Intelligence',
    'Language & Thought, Gender as a Social Construct',
    'Addressing Learners from Diverse Backgrounds & Disadvantaged Groups',
    'Addressing the Needs of Gifted, Talented & Specially Abled Children',
    'Learning Processes, Motivation & Emotion',
    'Formative & Summative Assessment, CCE & Rubrics',
    'Pedagogy of Subject Teaching & Remedial Teaching Strategies'
  ],
  'Child Development & Pedagogy (बाल विकास व शिक्षाशास्त्र)': [
    'बाल विकास की अवधारणा एवं अधिगम से संबंध',
    'पियाजे, कोहलबर्ग एवं वायगोत्स्की के सिद्धांत',
    'समावेशी शिक्षा की अवधारणा एवं विशेष आवश्यकता वाले बच्चे',
    'अधिगम और अध्यापन (बालक कैसे सोचते और सीखते हैं)',
    'सतत एवं व्यापक मूल्यांकन (CCE) एवं उपचारात्मक शिक्षण'
  ],
  'English Language & Literature': [
    'Unseen Passage Reading Comprehension',
    'English Grammar: Tenses, Subject-Verb Agreement',
    'Active & Passive Voice Transformation',
    'Direct & Indirect Speech (Narration)',
    'Prepositions, Conjunctions & Articles',
    'Vocabulary: Synonyms, Antonyms & Homonyms',
    'Idioms, Phrases & Phrasal Verbs',
    'One-Word Substitution & Spelling Correction',
    'Error Spotting & Sentence Improvement',
    'Para Jumbles & Sentence Rearrangement',
    'Cloze Test & Fill in the Blanks',
    'Formal Letter, Notice & Essay Writing Skills'
  ],
  'General Hindi (सामान्य हिंदी)': [
    'हिंदी वर्णमाला, विराम चिन्ह एवं वर्तनी शुद्धि',
    'संधि, समास, उपसर्ग एवं प्रत्यय',
    'संज्ञा, सर्वनाम, क्रिया, विशेषण एवं अव्यय',
    'पर्यायवाची, विलोम, अनेकार्थी एवं समरूपी शब्द',
    'मुहावरे, लोकोक्तियाँ एवं कहावतें',
    'रस, छंद, अलंकार एवं काव्य सौंदर्य',
    'वाक्यांश के लिए एक शब्द',
    'अपठित गद्यांश एवं हिंदी साहित्य का संक्षिप्त इतिहास'
  ],
  'General Kannada (ಸಾಮಾನ್ಯ ಕನ್ನಡ)': [
    'ಕನ್ನಡ ವರ್ಣಮಾಲೆ, ಸಂಧಿಗಳು ಮತ್ತು ಸಮಾಸಗಳು',
    'ತತ್ಸಮ-ತದ್ಭವ, ನಾನಾರ್ಥಗಳು ಮತ್ತು ಸಮಾನಾರ್ಥಕ ಪದಗಳು',
    'ವಿಭಕ್ತಿ ಪ್ರತ್ಯಯಗಳು ಮತ್ತು ಕ್ರಿಯಾಪದಗಳು',
    'ಗಾದೆ ಮಾತುಗಳು, ನುಡಿಗಟ್ಟುಗಳು ಮತ್ತು ಒಗಟುಗಳು',
    'ವಾಕ್ಯ ರಚನೆ, ಅನ್ವಯಿಕ ವ್ಯಾಕರಣ ಮತ್ತು ವಾಕ್ಯ ದೋಷ ಶೋಧನೆ',
    'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಚರಿತ್ರೆ, ಕವಿಗಳು ಮತ್ತು ಪ್ರಸಿದ್ಧ ಕೃತಿಗಳು',
    'ಅಪಠಿತ ಗದ್ಯ ಗ್ರಹಣ ಮತ್ತು ಸಾರಾಂಶ ಲೇಖನ'
  ],
  'Computer Science & Programming': [
    'Computer Fundamentals, CPU Architecture & Memory Hierarchy',
    'Operating Systems (Processes, Threads, Memory & Linux Shell)',
    'Programming in Python / C++: Syntax, Loops & Functions',
    'Object-Oriented Programming (OOP): Inheritance, Polymorphism',
    'Data Structures: Arrays, Linked Lists, Stacks & Queues',
    'Trees, Binary Search Trees & Graphs Algorithms',
    'Sorting, Searching & Asymptotic Time Complexity',
    'Database Management Systems (DBMS), ER Diagrams & Normalization',
    'SQL Queries: Joins, Subqueries & Transactions (ACID)',
    'Computer Networks: OSI Model, TCP/IP, DNS, HTTP & Routing',
    'Cybersecurity Essentials: Encryption, Firewalls & Ethical Hacking',
    'Web Development Essentials: HTML5, CSS3, JavaScript & REST APIs'
  ],
  'Financial Management & Business Analytics': [
    'Financial Accounting Principles & Double Entry System',
    'Corporate Finance, Capital Budgeting & Cost of Capital',
    'Working Capital Management & Cash Flow Analysis',
    'Financial Statements Analysis & Ratio Analysis',
    'Marketing Management, Segmentation & 4 Ps',
    'Human Resource Management & Organizational Behaviour',
    'Business Statistics & Hypothesis Testing',
    'Business Analytics & Data-Driven Decision Making'
  ]
};

/**
 * Returns topics for a given subject. If no exact match, performs case-insensitive
 * substring matching or returns a rich universal foundational syllabus list.
 */
export const getTopicsForSubject = (subjectName: string = ''): string[] => {
  const trimmed = (subjectName || '').trim();
  if (!trimmed) {
    return SUBJECT_TOPICS_MAP['Mathematics'];
  }

  if (SUBJECT_TOPICS_MAP[trimmed]) {
    return SUBJECT_TOPICS_MAP[trimmed];
  }

  // Case-insensitive / substring match
  const lower = trimmed.toLowerCase();
  for (const [key, topics] of Object.entries(SUBJECT_TOPICS_MAP)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return topics;
    }
  }

  if (lower.includes('math') || lower.includes('quant') || lower.includes('arithmetic')) {
    return SUBJECT_TOPICS_MAP['Mathematics'];
  }
  if (lower.includes('physic')) {
    return SUBJECT_TOPICS_MAP['Physics'];
  }
  if (lower.includes('chem')) {
    return SUBJECT_TOPICS_MAP['Chemistry'];
  }
  if (lower.includes('bio') || lower.includes('zoology') || lower.includes('botany')) {
    return SUBJECT_TOPICS_MAP['Biology'];
  }
  if (lower.includes('science')) {
    return SUBJECT_TOPICS_MAP['General Science'];
  }
  if (lower.includes('reason') || lower.includes('aptitude') || lower.includes('mental')) {
    return SUBJECT_TOPICS_MAP['Quantitative Aptitude & Reasoning'];
  }
  if (lower.includes('history') || lower.includes('gk') || lower.includes('polity') || lower.includes('geography')) {
    return SUBJECT_TOPICS_MAP['General Knowledge & Current Affairs'];
  }
  if (lower.includes('pedagogy') || lower.includes('child') || lower.includes('tet') || lower.includes('b.ed')) {
    return SUBJECT_TOPICS_MAP['Child Development & Pedagogy'];
  }
  if (lower.includes('english')) {
    return SUBJECT_TOPICS_MAP['English Language & Literature'];
  }
  if (lower.includes('hindi')) {
    return SUBJECT_TOPICS_MAP['General Hindi (सामान्य हिंदी)'];
  }
  if (lower.includes('kannada')) {
    return SUBJECT_TOPICS_MAP['General Kannada (ಸಾಮಾನ್ಯ ಕನ್ನಡ)'];
  }
  if (lower.includes('computer') || lower.includes('program') || lower.includes('code') || lower.includes('it')) {
    return SUBJECT_TOPICS_MAP['Computer Science & Programming'];
  }

  // Fallback comprehensive modular topics
  return [
    'Module 1: Fundamental Concepts & Core Principles',
    'Module 2: In-Depth Subject Mechanics & Key Theories',
    'Module 3: Advanced Problem Solving & Numerical Practice',
    'Module 4: Case Studies, Real-World Applications & Examples',
    'Module 5: Previous Years Question Papers (PYQs) Analysis',
    'Module 6: Quick Revision Notes, Formulas & Mind Maps',
    'Module 7: Full-Length Practice Test Papers & Mock Quizzes'
  ];
};

