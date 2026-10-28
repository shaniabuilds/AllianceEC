import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import {
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  fetchStudentDashboardStats,
  fetchMyEnrolledCourses,
  fetchBrowseCourses,
  enrollCourse,
  topUpStudentWallet,
  fetchPracticeMcqs,
  submitStudentQuiz,
  submitStudentKyc,
  fetchEbooks,
  purchaseEbook,
  fetchAffiliateStats,
  updateLegPreference,
  fetchBinaryTree,
  fetchActiveAds,
  fetchPayoutProfile,
  savePayoutProfile,
  requestWithdrawal,
  fetchMyWithdrawals,
  cancelMyWithdrawal,
  StudentStats,
  CourseRecord,
  McqRecord,
  QuizAttemptResult,
  QuizSetGroup,
  EbookRecord,
  AdRecord,
  PayoutProfile,
  WithdrawalRequestRecord,
} from '../services/studentService';

const DEFAULT_COURSE_BANNER =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';

export interface IndianStateItem {
  code: string;
  name: string;
  popular: string;
  icon: string;
}

export const INDIAN_STATES_DATA: IndianStateItem[] = [
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    popular: 'UP Board, UPPCS, UP Police, RO/ARO',
    icon: '📍',
  },
  {
    code: 'BR',
    name: 'Bihar',
    popular: 'Bihar Board, BPSC, Bihar SI, Teacher (TRE)',
    icon: '📍',
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    popular: 'RBSE Board, RAS, REET, Rajasthan Police',
    icon: '📍',
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    popular: 'MP Board, MPPSC, Vyapam/PEB, Patwari',
    icon: '📍',
  },
  {
    code: 'DL',
    name: 'Delhi NCR',
    popular: 'DSSSB, Delhi Police, DSEU, CET',
    icon: '📍',
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    popular: 'Maharashtra Board, MPSC, Police Bharti',
    icon: '📍',
  },
  {
    code: 'HR',
    name: 'Haryana',
    popular: 'HBSE Board, HPSC, HSSC, CET',
    icon: '📍',
  },
  {
    code: 'PB',
    name: 'Punjab',
    popular: 'PSEB Board, PPSC, PSSSB, Punjab Police',
    icon: '📍',
  },
  {
    code: 'WB',
    name: 'West Bengal',
    popular: 'WBBSE Board, WBCS, WB Police',
    icon: '📍',
  },
  {
    code: 'KA',
    name: 'Karnataka',
    popular: 'KSEEB, KPSC, KCET, Karnataka Police',
    icon: '📍',
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    popular: 'GSEB Board, GPSC, Talati, Constable',
    icon: '📍',
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    popular: 'JAC Board, JPSC, JSSC CGL',
    icon: '📍',
  },
  {
    code: 'CH',
    name: 'Chhattisgarh',
    popular: 'CGBSE Board, CGPSC, Vyapam',
    icon: '📍',
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    popular: 'UBSE Board, UKPSC, UKSSSC',
    icon: '📍',
  },
  {
    code: 'TS',
    name: 'Telangana',
    popular: 'TSBIE, TSPSC, TS Police',
    icon: '📍',
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    popular: 'BIEAP, APPSC, AP Police',
    icon: '📍',
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    popular: 'TN State Board, TNPSC',
    icon: '📍',
  },
  {
    code: 'KL',
    name: 'Kerala',
    popular: 'Kerala DHSE, Kerala PSC',
    icon: '📍',
  },
  {
    code: 'OD',
    name: 'Odisha',
    popular: 'CHSE Odisha, OPSC, OSSSC',
    icon: '📍',
  },
  {
    code: 'AS',
    name: 'Assam',
    popular: 'AHSEC, APSC, Assam Police',
    icon: '📍',
  },
];

const MobileTreeNodeItem: React.FC<{
  node?: any | null;
  positionLabel: string;
  depth: number;
  maxDepth: number;
  displayRootId?: string;
  onNodeClick: (node: any) => void;
  isDarkMode: boolean;
  colors: any;
}> = ({
  node,
  positionLabel,
  depth,
  maxDepth,
  displayRootId,
  onNodeClick,
  isDarkMode,
  colors,
}) => {
  if (!node || node.userId === 'VACANT') {
    return (
      <View
        style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.cardBorder,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 6,
          alignItems: 'center',
          minWidth: 100,
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
        }}
      >
        <Text
          style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}
        >
          Empty Spot ({positionLabel})
        </Text>
      </View>
    );
  }

  const isFocused =
    displayRootId &&
    (node.id === displayRootId || node.userId === displayRootId);
  const hasChildren = Boolean(node.leftLeg || node.rightLeg);

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onNodeClick(node)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused
            ? '#6366F1'
            : depth === 1
              ? '#818CF8'
              : colors.cardBorder,
          backgroundColor: isFocused
            ? isDarkMode
              ? 'rgba(99,102,241,0.35)'
              : 'rgba(99,102,241,0.18)'
            : depth === 1
              ? isDarkMode
                ? 'rgba(99,102,241,0.2)'
                : 'rgba(99,102,241,0.08)'
              : colors.itemSubCard,
          alignItems: 'center',
          minWidth: 120,
          shadowColor: isFocused ? '#6366F1' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isFocused ? 0.3 : 0.05,
          shadowRadius: 4,
          elevation: isFocused ? 4 : 1,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginBottom: 2,
          }}
        >
          <View
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
              {node.rank || 'BRONZE'}
            </Text>
          </View>
          {hasChildren && (
            <Text style={{ fontSize: 9, color: '#6366F1', fontWeight: '800' }}>
              🔍 Zoom
            </Text>
          )}
        </View>

        <Text
          style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '800' }}
        >
          {node.name || node.user?.name || node.userId}
        </Text>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 9,
            marginTop: 1,
            fontFamily: 'monospace',
          }}
        >
          ID: {node.userId}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
          <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700' }}>
            L: {node.leftVolume || node.carriedLeftPV || 0} PV
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 9 }}>•</Text>
          <Text style={{ color: '#6366F1', fontSize: 9, fontWeight: '700' }}>
            R: {node.rightVolume || node.carriedRightPV || 0} PV
          </Text>
        </View>
      </TouchableOpacity>

      {depth < maxDepth && (node.leftLeg || node.rightLeg) && (
        <View style={{ alignItems: 'center', width: '100%', marginTop: 4 }}>
          <View style={{ width: 2, height: 12, backgroundColor: '#6366F1' }} />
          <View
            style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}
          >
            <MobileTreeNodeItem
              node={node.leftLeg}
              positionLabel="L"
              depth={depth + 1}
              maxDepth={maxDepth}
              displayRootId={displayRootId}
              onNodeClick={onNodeClick}
              isDarkMode={isDarkMode}
              colors={colors}
            />
            <MobileTreeNodeItem
              node={node.rightLeg}
              positionLabel="R"
              depth={depth + 1}
              maxDepth={maxDepth}
              displayRootId={displayRootId}
              onNodeClick={onNodeClick}
              isDarkMode={isDarkMode}
              colors={colors}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export const StudentHomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  // DEFAULT TO BROWSE / COURSE HUB LANDING PAGE
  const [activeTab, setActiveTab] = useState<
    'MY_CLASSES' | 'BROWSE' | 'QUIZ' | 'WALLET' | 'KYC' | 'MLM_NETWORK'
  >('BROWSE');

  // DUAL THEME SYSTEM: Default Light Mode (false)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Theme Colors
  const colors = {
    bgCanvas: isDarkMode ? '#0B0F19' : '#F8FAFC',
    cardBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    cardBorder: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#E2E8F0',
    textPrimary: isDarkMode ? '#FFFFFF' : '#0F172A',
    textSecondary: isDarkMode ? '#94A3B8' : '#475569',
    textMuted: isDarkMode ? '#64748B' : '#64748B',
    inputBg: isDarkMode ? '#0F172A' : '#F1F5F9',
    itemSubCard: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
    iconBoxBg: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    iconBoxBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
  };

  // Active Category Filter State (PhonePe & Muthoot ONE style grid)
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('ALL');
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>(
    'All Platform Courses',
  );
  const [activeBannerIndex, setActiveBannerIndex] = useState<number>(0);

  // Dynamic Advertisements from Admin Backend
  const [dynamicAds, setDynamicAds] = useState<AdRecord[]>([]);
  const [activeAdIndex, setActiveAdIndex] = useState<number>(0);
  const [activeVideoModalAd, setActiveVideoModalAd] = useState<AdRecord | null>(
    null,
  );

  const loadDynamicAds = async () => {
    try {
      const res = await fetchActiveAds();
      if (res.success && res.data) {
        setDynamicAds(res.data.ads || []);
      }
    } catch (err) {
      console.log('Error loading dynamic ads:', err);
    }
  };

  // PROMOTIONAL CAROUSEL SLIDES (Muthoot Fincorp ONE Style)
  const PROMO_BANNERS = [
    {
      id: 'neet_jee',
      tag: '🎯 SPECIAL ACADEMIC PASS',
      title: 'NEET & JEE 2026 Master Pass',
      subTitle: 'Flat 50% Early Bird Discount + All-India Live Doubt Vault',
      ctaText: 'Enroll Today',
      accentColor: '#6366F1',
      badgeText: '50% OFF',
      actionKey: 'FILTER_NEET',
    },
    {
      id: 'mlm_refer',
      tag: '🤝 BINARY CASHBACK REWARDS',
      title: 'Earn Up to ₹25,000 Daily Matching Bonus!',
      subTitle: 'Share your referral code & build your 2-leg binary team',
      ctaText: 'Share Link',
      accentColor: '#10B981',
      badgeText: 'DAILY CAPPING',
      actionKey: 'SHARE_LINK',
    },
    {
      id: 'mock_test',
      tag: '⚡ ALL-INDIA MOCK TEST',
      title: 'Track Your Performance & Rank Predictor',
      subTitle: 'Take chapter-wise practice tests with automated scoring',
      ctaText: 'Start Test',
      accentColor: '#F59E0B',
      badgeText: 'FREE QUIZ',
      actionKey: 'GO_QUIZ',
    },
  ];

  // 6 CORE EDUCATIONAL VERTICALS (Muthoot Fincorp ONE 4-Column Grid Style)
  const CATEGORY_SECTIONS = [
    {
      id: 'SCHOOL_K12',
      title: 'I. School Education (Class 1–12)',
      icon: '🏫',
      items: [
        {
          id: 'state_reg',
          name: 'State Board\nMedium',
          icon: '🏫',
          filterKey: 'STATE_BOARD_MEDIUM',
          badge: 'Regional',
          badgeBg: '#6366F1',
        },
        {
          id: 'state_eng',
          name: 'State Board\nEnglish',
          icon: '🎒',
          filterKey: 'STATE_BOARD_ENGLISH',
        },
        {
          id: 'cbse',
          name: 'CBSE Board\nClasses 1-10',
          icon: '📘',
          filterKey: 'CBSE',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'icse',
          name: 'ICSE Board\nNCERT',
          icon: '📗',
          filterKey: 'ICSE',
        },
        {
          id: 'puc_sci',
          name: 'PUC Science\n(PCMB +1 & +2)',
          icon: '🔬',
          filterKey: 'Science',
          badge: 'Hot',
          badgeBg: '#F59E0B',
        },
        {
          id: 'puc_com',
          name: 'PUC Commerce\n(+1 & +2)',
          icon: '📊',
          filterKey: 'Commerce',
        },
        {
          id: 'puc_art',
          name: 'PUC Arts\n(+1 & +2)',
          icon: '🎨',
          filterKey: 'Arts',
        },
        {
          id: 'k12_all',
          name: 'All Classes\nMaster Pass',
          icon: '📚',
          filterKey: 'SCHOOL_K12',
          badge: 'New',
          badgeBg: '#06B6D4',
        },
      ],
    },
    {
      id: 'COMPETITIVE_EXAMS',
      title: 'II. School Entrance & Competitive Exams',
      icon: '🩺',
      items: [
        {
          id: 'neet',
          name: 'NEET UG\nMedical Prep',
          icon: '🩺',
          filterKey: 'NEET',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'jee',
          name: 'JEE Mains\n& Advanced',
          icon: '🚀',
          filterKey: 'JEE',
          badge: 'Hot',
          badgeBg: '#F59E0B',
        },
        {
          id: 'navodaya',
          name: 'Navodaya\nEntrance Exam',
          icon: '🏛️',
          filterKey: 'NAVODAYA',
          badge: 'New',
          badgeBg: '#06B6D4',
        },
        {
          id: 'nts',
          name: 'NTS Talent\nScholarship',
          icon: '💡',
          filterKey: 'NTS',
        },
        { id: 'gmat', name: 'G-MAT\nAptitude', icon: '📈', filterKey: 'GMAT' },
        {
          id: 'net',
          name: 'UGC NET\nLectureship',
          icon: '🎯',
          filterKey: 'NET',
        },
      ],
    },
    {
      id: 'STATE_GOVT_JOBS',
      title: 'III. State Government Jobs Preparation',
      icon: '🏛️',
      items: [
        {
          id: 'kas',
          name: 'KAS / State\nPSC Civil',
          icon: '🏛️',
          filterKey: 'KAS',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'sda',
          name: 'SDA Second\nDivision',
          icon: '📝',
          filterKey: 'SDA',
        },
        {
          id: 'fda',
          name: 'FDA First\nDivision',
          icon: '📋',
          filterKey: 'FDA',
        },
        {
          id: 'gpt',
          name: 'GPT Primary\nTeacher',
          icon: '👨‍🏫',
          filterKey: 'GPT',
          badge: 'Hot',
          badgeBg: '#F59E0B',
        },
        {
          id: 'police',
          name: 'State Police\nSI / Constable',
          icon: '👮',
          filterKey: 'Police',
          badge: 'New',
          badgeBg: '#06B6D4',
        },
        {
          id: 'state_all',
          name: 'Other State\nExams Pass',
          icon: '💼',
          filterKey: 'STATE_GOVT_JOBS',
        },
      ],
    },
    {
      id: 'CENTRAL_GOVT_JOBS',
      title: 'IV. Central Government Jobs Preparation',
      icon: '🏦',
      items: [
        {
          id: 'banking',
          name: 'Banking Exams\nIBPS & SBI',
          icon: '🏦',
          filterKey: 'BANKING',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'rrb',
          name: 'Railway Board\nRRB NTPC',
          icon: '🚆',
          filterKey: 'RRB',
          badge: 'Hot',
          badgeBg: '#F59E0B',
        },
        {
          id: 'ias',
          name: 'UPSC IAS\nCivil Services',
          icon: '🇮🇳',
          filterKey: 'IAS',
          badge: 'Top',
          badgeBg: '#8B5CF6',
        },
        { id: 'ssc', name: 'SSC CGL\n& CHSL', icon: '📑', filterKey: 'SSC' },
      ],
    },
    {
      id: 'TEACHER_PREP',
      title: 'V. Teacher Preparation & Certifications',
      icon: '🎓',
      items: [
        {
          id: 'bed',
          name: 'B.Ed Bachelor\nof Education',
          icon: '🎓',
          filterKey: 'BED',
        },
        {
          id: 'med',
          name: 'M.Ed Master\nof Education',
          icon: '📜',
          filterKey: 'MED',
        },
        {
          id: 'tet',
          name: 'State TET\nEligibility',
          icon: '✍️',
          filterKey: 'TET',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'ctet',
          name: 'CTET Central\nEligibility',
          icon: '🏅',
          filterKey: 'CTET',
          badge: 'National',
          badgeBg: '#10B981',
        },
      ],
    },
    {
      id: 'HIGHER_EDU',
      title: 'VI. Higher Education – UG & PG Degrees',
      icon: '📚',
      items: [
        {
          id: 'mba',
          name: 'MBA Business\nAdministration',
          icon: '💼',
          filterKey: 'MBA',
          badge: 'Popular',
          badgeBg: '#EC4899',
        },
        {
          id: 'mcom',
          name: 'M.Com Master\nof Commerce',
          icon: '📊',
          filterKey: 'MCOM',
        },
        {
          id: 'msc',
          name: 'M.Sc Master\nof Science',
          icon: '🔬',
          filterKey: 'MSC',
        },
        { id: 'ma', name: 'M.A Master\nof Arts', icon: '📖', filterKey: 'MA' },
      ],
    },
  ];

  // Dashboard Data State
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseRecord[]>([]);
  const [browseCoursesList, setBrowseCoursesList] = useState<CourseRecord[]>(
    [],
  );
  const [mcqList, setMcqList] = useState<McqRecord[]>([]);
  const [quizSetsList, setQuizSetsList] = useState<QuizSetGroup[]>([]);
  const [selectedQuizSetId, setSelectedQuizSetId] = useState<string>('');
  const [ebookList, setEbookList] = useState<EbookRecord[]>([]);

  // Selected Course Details Inspection Modal State
  const [selectedCourseDetail, setSelectedCourseDetail] =
    useState<CourseRecord | null>(null);
  const [expandedMobileTestIdx, setExpandedMobileTestIdx] = useState<
    number | null
  >(null);

  // System Broadcast Announcement State
  const [systemAnnouncement, setSystemAnnouncement] = useState(
    '🎉 Special Cashback offer on NEET & K12 Master Pass! Enroll today!',
  );

  // Loading States
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);
  const [isLoadingMcqs, setIsLoadingMcqs] = useState(false);
  const [isLoadingEbooks, setIsLoadingEbooks] = useState(false);

  // Course Enrollment State
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(
    null,
  );
  const [enrollMsg, setEnrollMsg] = useState('');

  // Wallet Top-Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('2500');
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);
  const [topUpMsg, setTopUpMsg] = useState('');

  // Withdrawal Request & Payout State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'BANK' | 'UPI'>('BANK');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountConfirm, setBankAccountConfirm] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiNameInput, setUpiNameInput] = useState('');
  const [saveAsDefaultPayout, setSaveAsDefaultPayout] = useState(true);
  const [savedPayoutProfile, setSavedPayoutProfile] =
    useState<PayoutProfile | null>(null);
  const [myWithdrawalsList, setMyWithdrawalsList] = useState<
    WithdrawalRequestRecord[]
  >([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState('');

  // Central Level vs State Level Exam Scope Filter State
  const [showLevelModal, setShowLevelModal] = useState(true); // Auto-launches upon student screen load
  const [levelModalTab, setLevelModalTab] = useState<
    'CHOOSE_LEVEL' | 'CHOOSE_STATE'
  >('CHOOSE_LEVEL');
  const [selectedExamLevel, setSelectedExamLevel] = useState<
    'ALL' | 'CENTRAL' | 'STATE'
  >('ALL');
  const [selectedState, setSelectedState] = useState<IndianStateItem | null>(
    null,
  );
  const [stateSearchQuery, setStateSearchQuery] = useState('');

  // Interactive MCQ Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizMsg, setQuizMsg] = useState('');

  // KYC Document Form State with Image File Upload Picker
  const [docType, setDocType] = useState<'AADHAAR' | 'PAN'>('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [kycImageUri, setKycImageUri] = useState<string | null>(null);
  const [kycFileName, setKycFileName] = useState<string>('');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  // Ebook Purchase State
  const [purchasingEbookId, setPurchasingEbookId] = useState<string | null>(
    null,
  );
  const [ebookMsg, setEbookMsg] = useState('');

  // MLM Affiliate Network State
  const [mlmStats, setMlmStats] = useState<any | null>(null);
  const [isUpdatingLeg, setIsUpdatingLeg] = useState(false);
  const [mlmMsg, setMlmMsg] = useState('');
  const [binaryTree, setBinaryTree] = useState<any | null>(null);
  const [focusedNode, setFocusedNode] = useState<any | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);

  // Loaders
  const loadDashboardStats = async () => {
    setIsLoadingStats(true);
    const res = await fetchStudentDashboardStats();
    if (res.success && res.data) {
      setStats(res.data.stats);
    }
    setIsLoadingStats(false);
  };

  const loadMlmStats = async () => {
    const res = await fetchAffiliateStats();
    if (res.success && res.data) {
      setMlmStats(res.data.stats);
    }
  };

  const loadBinaryTreeData = async () => {
    setIsLoadingTree(true);
    const res = await fetchBinaryTree();
    if (res.success && res.data) {
      setBinaryTree(res.data.tree || null);
    }
    setIsLoadingTree(false);
  };

  const handleLegPlacementChange = async (leg: 'AUTO' | 'LEFT' | 'RIGHT') => {
    setMlmMsg('');
    setIsUpdatingLeg(true);
    const res = await updateLegPreference(leg);
    setIsUpdatingLeg(false);
    if (res.success) {
      setMlmMsg(`✅ Leg preference updated to ${leg}`);
      loadMlmStats();
      loadBinaryTreeData();
    } else {
      setMlmMsg(`⛔ ${res.message || 'Failed to update leg'}`);
    }
  };

  const getMobileShareUrl = () => {
    const code =
      mlmStats?.referralCode ||
      user?.referralCode ||
      user?.userId ||
      'REF-STUDENT';
    return `http://localhost:3000/register?ref=${code}`;
  };

  const handleCopyMobileLink = () => {
    const link = getMobileShareUrl();
    Clipboard.setString(link);
    Alert.alert(
      'Link Copied! 📋',
      `Referral link copied to clipboard:\n${link}`,
    );
  };

  const handleShareMobileLink = async () => {
    const link = getMobileShareUrl();
    const message = `Hey! Join AllianceECfor state-wise study courses & competitive exams! Register using my referral link:\n${link}`;
    try {
      await Share.share({
        message,
        url: link,
        title: 'AllianceECReferral Link',
      });
    } catch {
      // Fallback
    }
  };

  const handleBannerPress = (banner: (typeof PROMO_BANNERS)[0]) => {
    if (banner.actionKey === 'FILTER_NEET') {
      setSelectedCategoryFilter('NEET');
      setSelectedCategoryTitle('NEET & JEE Entrance Preparation');
    } else if (banner.actionKey === 'SHARE_LINK') {
      handleShareMobileLink();
    } else if (banner.actionKey === 'GO_QUIZ') {
      setActiveTab('QUIZ');
    }
  };

  const loadEnrolled = async () => {
    setIsLoadingEnrolled(true);
    const res = await fetchMyEnrolledCourses();
    if (res.success && res.data) {
      setEnrolledCourses(res.data.courses || []);
    }
    setIsLoadingEnrolled(false);
  };

  // Course Filtering Preference Mode
  const [filterMode, setFilterMode] = useState<'GOAL_MATCH' | 'EXPLORE_ALL'>(
    'GOAL_MATCH',
  );

  const loadBrowse = async (
    overrideMode?: 'GOAL_MATCH' | 'EXPLORE_ALL',
    forceShowAll: boolean = false,
  ) => {
    setIsLoadingBrowse(true);
    const targetMode = overrideMode || filterMode;
    const shouldShowAll =
      forceShowAll ||
      targetMode === 'EXPLORE_ALL' ||
      selectedCategoryFilter !== 'ALL';
    const params = shouldShowAll ? { showAll: true } : {};
    const res = await fetchBrowseCourses(params);
    if (res.success && res.data) {
      setBrowseCoursesList(res.data.courses || []);
    }
    setIsLoadingBrowse(false);
  };

  // Load Student Withdrawals History & Saved Payout Profile
  const loadWithdrawalData = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const [wRes, pRes] = await Promise.all([
        fetchMyWithdrawals(),
        fetchPayoutProfile(),
      ]);
      if (wRes.success && wRes.data) {
        setMyWithdrawalsList(wRes.data.withdrawals || []);
      }
      if (pRes.success && pRes.data?.payoutProfile) {
        const prof = pRes.data.payoutProfile;
        setSavedPayoutProfile(prof);
        if (prof.preferredMethod) setPayoutMethod(prof.preferredMethod);
        if (prof.bankAccount?.accountHolderName && !bankAccountHolder)
          setBankAccountHolder(prof.bankAccount.accountHolderName);
        if (prof.bankAccount?.accountNumber && !bankAccountNumber) {
          setBankAccountNumber(prof.bankAccount.accountNumber);
          setBankAccountConfirm(prof.bankAccount.accountNumber);
        }
        if (prof.bankAccount?.ifscCode && !bankIfscCode)
          setBankIfscCode(prof.bankAccount.ifscCode);
        if (prof.bankAccount?.bankName && !bankName)
          setBankName(prof.bankAccount.bankName);
        if (prof.upi?.upiId && !upiIdInput) setUpiIdInput(prof.upi.upiId);
        if (prof.upi?.accountHolderName && !upiNameInput)
          setUpiNameInput(prof.upi.accountHolderName);
      }
    } catch (err) {
      console.error('Error loading student withdrawal data:', err);
    }
    setIsLoadingWithdrawals(false);
  };

  const handleWithdrawSubmit = async () => {
    setWithdrawErrorMsg('');
    setWithdrawSuccessMsg('');

    const amt = Number(withdrawAmountInput);
    if (isNaN(amt) || amt < 50) {
      setWithdrawErrorMsg('Minimum withdrawal amount is ₹50.');
      return;
    }
    const withdrawableBal =
      stats?.withdrawableBalance !== undefined
        ? stats.withdrawableBalance
        : stats?.walletBalance || 0;
    if (amt > withdrawableBal) {
      setWithdrawErrorMsg(
        `You can only withdraw earnings from Refer & Earn commissions. Your withdrawable referral earnings are ₹${withdrawableBal.toLocaleString('en-IN')}. Top-up balance is non-withdrawable and reserved for course purchases.`,
      );
      return;
    }

    if (payoutMethod === 'BANK') {
      if (
        !bankAccountHolder.trim() ||
        !bankAccountNumber.trim() ||
        !bankIfscCode.trim()
      ) {
        setWithdrawErrorMsg(
          'Please fill in Account Holder Name, Account Number, and IFSC Code.',
        );
        return;
      }
      if (bankAccountNumber.trim() !== bankAccountConfirm.trim()) {
        setWithdrawErrorMsg(
          'Bank Account Numbers do not match. Please verify.',
        );
        return;
      }
      if (bankIfscCode.trim().length < 5) {
        setWithdrawErrorMsg(
          'Please enter a valid IFSC Code (e.g. SBIN0001234).',
        );
        return;
      }
    } else {
      if (!upiIdInput.trim() || !upiIdInput.includes('@')) {
        setWithdrawErrorMsg(
          'Please enter a valid UPI ID (e.g. mobile@upi or username@bank).',
        );
        return;
      }
    }

    setIsSubmittingWithdraw(true);
    const res = await requestWithdrawal({
      amount: amt,
      payoutMethod,
      bankDetails:
        payoutMethod === 'BANK'
          ? {
              accountHolderName: bankAccountHolder.trim(),
              accountNumber: bankAccountNumber.trim(),
              ifscCode: bankIfscCode.trim().toUpperCase(),
              bankName: bankName.trim() || 'Bank Transfer',
            }
          : undefined,
      upiDetails:
        payoutMethod === 'UPI'
          ? {
              upiId: upiIdInput.trim().toLowerCase(),
              accountHolderName: upiNameInput.trim() || user?.name || '',
            }
          : undefined,
      saveAsDefault: saveAsDefaultPayout,
    });
    setIsSubmittingWithdraw(false);

    if (res.success && res.data) {
      setWithdrawSuccessMsg(
        `✅ Withdrawal request of ₹${amt.toLocaleString('en-IN')} submitted successfully! Admin will review and transfer funds to your ${payoutMethod === 'BANK' ? 'Bank Account' : 'UPI ID'}.`,
      );
      setWithdrawAmountInput('');
      loadDashboardStats();
      loadWithdrawalData();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg('');
      }, 3000);
    } else {
      setWithdrawErrorMsg(res.message || 'Withdrawal request failed.');
    }
  };

  const handleCancelWithdrawal = (withdrawalId: string) => {
    Alert.alert(
      'Cancel Withdrawal',
      'Cancel this withdrawal request? Your money will be refunded back to your wallet instantly.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            const res = await cancelMyWithdrawal(withdrawalId);
            if (res.success) {
              loadDashboardStats();
              loadWithdrawalData();
              Alert.alert(
                'Cancelled',
                'Withdrawal request has been cancelled and refunded to your wallet.',
              );
            } else {
              Alert.alert(
                'Error',
                res.message || 'Failed to cancel withdrawal.',
              );
            }
          },
        },
      ],
    );
  };

  const loadMcqs = async () => {
    setIsLoadingMcqs(true);
    const res = await fetchPracticeMcqs();
    if (res.success && res.data) {
      const sets = res.data.quizSets || [];
      setQuizSetsList(sets);

      if (sets.length > 0) {
        const initialSet = sets[0];
        setSelectedQuizSetId(initialSet.quizSetId);
        setMcqList(initialSet.mcqs || []);
        if (initialSet.hasAttempted && initialSet.lastAttempt) {
          setQuizResult(initialSet.lastAttempt);
        } else {
          setQuizResult(null);
        }
      } else {
        setMcqList(res.data.mcqs || []);
        if (res.data.hasAttempted && res.data.lastAttempt) {
          setQuizResult(res.data.lastAttempt);
        } else {
          setQuizResult(null);
        }
      }
    }
    setIsLoadingMcqs(false);
  };

  const handleSelectQuizSet = (quizSetId: string) => {
    setSelectedQuizSetId(quizSetId);
    setQuizMsg('');
    setSelectedAnswers({});
    const foundSet = quizSetsList.find(s => s.quizSetId === quizSetId);
    if (foundSet) {
      setMcqList(foundSet.mcqs || []);
      if (foundSet.hasAttempted && foundSet.lastAttempt) {
        setQuizResult(foundSet.lastAttempt);
      } else {
        setQuizResult(null);
      }
    }
  };

  const loadEbooksData = async () => {
    setIsLoadingEbooks(true);
    const res = await fetchEbooks();
    if (res.success && res.data) {
      setEbookList(res.data.ebooks || []);
    }
    setIsLoadingEbooks(false);
  };

  useEffect(() => {
    loadDashboardStats();
    loadEnrolled();
    loadBrowse();
    loadMcqs();
    loadEbooksData();
    loadMlmStats();
    loadBinaryTreeData();
    loadDynamicAds();
    loadWithdrawalData();
  }, []);

  // Reload courses when filter mode toggles or category filter selected
  useEffect(() => {
    loadBrowse();
  }, [filterMode, selectedCategoryFilter]);

  // Synchronize dynamic tab-specific data when user switches tabs
  useEffect(() => {
    if (activeTab === 'WALLET') {
      loadWithdrawalData();
      loadEbooksData();
      loadDashboardStats();
    } else if (activeTab === 'BROWSE') {
      loadBrowse();
    } else if (activeTab === 'MY_CLASSES') {
      loadEnrolled();
    } else if (activeTab === 'MLM_NETWORK') {
      loadMlmStats();
      loadBinaryTreeData();
    }
  }, [activeTab]);

  // Handlers
  const handleEnrollCourse = async (course: CourseRecord) => {
    setEnrollMsg('');
    setEnrollingCourseId(course._id);
    const res = await enrollCourse(course._id);
    setEnrollingCourseId(null);

    if (res.success && res.data) {
      setEnrollMsg(`🎉 Enrolled in ${course.title}! Check My Classroom tab.`);
      loadDashboardStats();
      loadEnrolled();
    } else {
      setEnrollMsg(`⛔ ${res.message || 'Enrollment failed.'}`);
    }
  };

  const handleTopUpSubmit = async () => {
    setTopUpMsg('');
    const amt = Number(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      setTopUpMsg('Please enter a valid amount.');
      return;
    }

    setIsSubmittingTopUp(true);
    const res = await topUpStudentWallet(amt);
    setIsSubmittingTopUp(false);

    if (res.success) {
      setTopUpMsg(`🎉 Wallet recharged with ₹${amt.toLocaleString('en-IN')}!`);
      loadDashboardStats();
      setTimeout(() => {
        setShowTopUpModal(false);
        setTopUpMsg('');
      }, 1200);
    } else {
      setTopUpMsg(`⛔ ${res.message || 'Top-up failed.'}`);
    }
  };

  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleQuizSubmit = async () => {
    setQuizMsg('');
    setQuizResult(null);

    const answersPayload = Object.entries(selectedAnswers).map(
      ([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }),
    );

    if (answersPayload.length === 0) {
      setQuizMsg('Select at least 1 answer before submitting.');
      return;
    }

    const activeSet = quizSetsList.find(s => s.quizSetId === selectedQuizSetId);
    const quizSetTitle = activeSet?.quizSetTitle || undefined;

    setIsSubmittingQuiz(true);
    const res = await submitStudentQuiz(
      answersPayload,
      selectedQuizSetId || undefined,
      quizSetTitle,
    );
    setIsSubmittingQuiz(false);

    if (res.success && res.data) {
      const newAttempt = res.data.attempt;
      setQuizResult(newAttempt);
      setQuizSetsList(prevSets =>
        prevSets.map(s =>
          s.quizSetId === selectedQuizSetId
            ? { ...s, hasAttempted: true, lastAttempt: newAttempt }
            : s,
        ),
      );
      loadDashboardStats();
    } else {
      setQuizMsg(`⛔ ${res.message || 'Failed to submit quiz.'}`);
    }
  };

  // KYC Image Picker Launch
  const handlePickKycImage = async () => {
    setKycMsg('');
    try {
      const response: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        setKycMsg(
          `⛔ Image Picker Error: ${response.errorMessage || 'Failed to select image'}`,
        );
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
          setKycMsg(
            '⛔ Document image size must not exceed 2MB! Please select a smaller photo.',
          );
          return;
        }
        if (asset.uri) {
          setKycImageUri(asset.uri);
          setKycFileName(asset.fileName || 'kyc_document.jpg');
        }
      }
    } catch (err: any) {
      setKycMsg(`⛔ Error launching gallery: ${err.message || 'Failed'}`);
    }
  };

  // KYC Submit Handler
  const handleKycSubmit = async () => {
    setKycMsg('');
    const cleanDocNum = docNumber.replace(/\s+/g, '').toUpperCase();

    if (!cleanDocNum) {
      setKycMsg('⛔ Please enter your Government Document ID Number.');
      return;
    }

    if (docType === 'AADHAAR') {
      const aadhaarRegex = /^\d{12}$/;
      if (!aadhaarRegex.test(cleanDocNum)) {
        setKycMsg(
          '⛔ Invalid Aadhaar Card Number! Must be exactly 12 numeric digits (e.g. 9900 1234 5678).',
        );
        return;
      }
    } else if (docType === 'PAN') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanDocNum)) {
        setKycMsg(
          '⛔ Invalid PAN Card Number! Format must be 5 Letters + 4 Digits + 1 Letter (e.g. ABCDE1234F).',
        );
        return;
      }
    }

    setIsSubmittingKyc(true);
    const res = await submitStudentKyc(
      docType,
      cleanDocNum,
      kycImageUri
        ? { uri: kycImageUri, name: kycFileName, type: 'image/jpeg' }
        : null,
    );
    setIsSubmittingKyc(false);

    if (res.success) {
      setKycMsg(
        '✅ Document scan submitted successfully! Pending Admin verification.',
      );
      loadDashboardStats();
    } else {
      setKycMsg(`⛔ ${res.message || 'Failed to submit KYC.'}`);
    }
  };

  const handlePurchaseEbook = async (ebookId: string) => {
    setEbookMsg('');
    setPurchasingEbookId(ebookId);
    const res = await purchaseEbook(ebookId);
    setPurchasingEbookId(null);

    if (res.success) {
      setEbookMsg('🎉 E-Book purchased successfully! Full PDF unlocked.');
      loadDashboardStats();
      loadEbooksData();
    } else {
      setEbookMsg(`⛔ ${res.message || 'Purchase failed.'}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCanvas }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 84 }}
      >
        {/* TOP BRANDING, PROFILE & THEME TOGGLE HEADER (PhonePe Style) */}
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.2 : 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* AllianceECTOP BRAND HEADER */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 12,
              marginBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: '#F59E0B',
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={require('../assets/images/logo.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '800',
                    letterSpacing: 0.3,
                  }}
                >
                  AllianceEC
                </Text>
                <Text
                  style={{ color: '#F59E0B', fontSize: 10, fontWeight: '700' }}
                >
                  Official E-Learning Platform
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* User Avatar Circle with QR Indicator (PhonePe Style) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                flex: 1,
              }}
            >
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#F59E0B',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: isDarkMode ? '#FFFFFF' : '#0F172A',
                  }}
                >
                  <Text
                    style={{
                      color: '#0F172A',
                      fontSize: 20,
                      fontWeight: '900',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                {/* Mini QR Scanner Overlay Icon Badge */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    backgroundColor: '#0F172A',
                    borderRadius: 8,
                    padding: 2,
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                  }}
                >
                  <Text style={{ fontSize: 9 }}>🔲</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                    numberOfLines={1}
                  >
                    {user?.name || 'Student Learner'}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#6366F1',
                        fontSize: 9,
                        fontWeight: '800',
                      }}
                    >
                      ONLINE
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    marginTop: 1,
                  }}
                >
                  ID: {user?.userId || 'EDU-STUDENT'} • State:{' '}
                  {user?.stateCode || 'ALL'}
                </Text>
              </View>
            </View>

            {/* Right Header Actions: PhonePe Refer Pill, Theme Toggle, Logout */}
            <View
              style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}
            >
              {/* PhonePe "Refer -> ₹25,000" Pill Badge */}
              <TouchableOpacity
                onPress={() => setActiveTab('MLM_NETWORK')}
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(234, 88, 12, 0.2)'
                    : '#FFEDD5',
                  borderWidth: 1,
                  borderColor: '#F97316',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: 10 }}>🤝</Text>
                <Text
                  style={{ color: '#EA580C', fontSize: 10, fontWeight: '800' }}
                >
                  Refer → ₹25k
                </Text>
              </TouchableOpacity>

              {/* DUAL THEME TOGGLE BUTTON */}
              <TouchableOpacity
                onPress={() => setIsDarkMode(!isDarkMode)}
                style={{
                  backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: isDarkMode ? '#FBBF24' : '#0F172A',
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {isDarkMode ? '🌙' : '☀️'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={logout}
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ color: '#F43F5E', fontSize: 10, fontWeight: '700' }}
                >
                  Exit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Bar */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setShowTopUpModal(true)}
              style={{
                flex: 1,
                backgroundColor: '#10B981',
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}
              >
                + Top-Up Wallet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                loadDashboardStats();
                loadEnrolled();
                loadBrowse();
                loadMcqs();
                loadDynamicAds();
              }}
              style={{
                backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GLOBAL SYSTEM ANNOUNCEMENT BROADCAST BANNER */}
        {!!systemAnnouncement && (
          <View
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(244, 63, 94, 0.3)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#F43F5E', fontSize: 11, fontWeight: '800' }}>
              📢 OFFICIAL ADMIN ANNOUNCEMENT:
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 12,
                marginTop: 3,
                fontWeight: '600',
                lineHeight: 16,
              }}
            >
              {systemAnnouncement}
            </Text>
          </View>
        )}

        {/* DYNAMIC METRIC CARDS GRID */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: isDarkMode
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.08)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(99, 102, 241, 0.3)',
            }}
          >
            <Text style={{ color: '#6366F1', fontSize: 10, fontWeight: '700' }}>
              ENROLLED BATCHES
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontWeight: '800',
                marginTop: 4,
              }}
            >
              {enrolledCourses.length > 0
                ? enrolledCourses.length
                : stats
                  ? stats.enrolledCoursesCount
                  : 0}{' '}
              Courses
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                marginTop: 2,
              }}
            >
              Live & Recorded Classes
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: isDarkMode
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(16, 185, 129, 0.08)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>
              WALLET BALANCE
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontWeight: '800',
                marginTop: 4,
              }}
            >
              ₹{' '}
              {stats ? (stats.walletBalance || 0).toLocaleString('en-IN') : '0'}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                marginTop: 2,
              }}
            >
              Dep: ₹{stats?.purchaseBalance || 0} • Ref: ₹
              {stats?.withdrawableBalance || 0}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: isDarkMode
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(245, 158, 11, 0.08)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '700' }}>
              QUIZZES COMPLETED
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 20,
                fontWeight: '800',
                marginTop: 4,
              }}
            >
              {stats ? stats.quizAttemptsCount : 0} Tests
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                marginTop: 2,
              }}
            >
              Self-Assessment Score
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 140,
              backgroundColor: isDarkMode
                ? 'rgba(168, 85, 247, 0.15)'
                : 'rgba(168, 85, 247, 0.08)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.3)',
            }}
          >
            <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '700' }}>
              KYC STATUS
            </Text>
            <View style={{ marginTop: 6 }}>
              <Text
                style={{
                  color:
                    stats?.kycStatus === 'APPROVED' ||
                    stats?.kycStatus === 'VERIFIED'
                      ? '#10B981'
                      : stats?.kycStatus === 'PENDING'
                        ? '#D97706'
                        : '#F43F5E',
                  fontSize: 13,
                  fontWeight: '800',
                }}
              >
                {stats?.kycStatus || 'NOT_SUBMITTED'}
              </Text>
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 10,
                marginTop: 2,
              }}
            >
              Aadhaar / PAN Verification
            </Text>
          </View>
        </View>

        {/* NAVIGATION TAB STRIP (PhonePe / Muthoot Style) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              backgroundColor: colors.cardBg,
              padding: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('BROWSE')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'BROWSE' ? '#6366F1' : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'BROWSE' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                🏠 Explore & Courses ({browseCoursesList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('MY_CLASSES')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'MY_CLASSES' ? '#6366F1' : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'MY_CLASSES'
                      ? '#FFFFFF'
                      : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                🎓 My Classroom ({enrolledCourses.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('QUIZ')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'QUIZ' ? '#F59E0B' : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'QUIZ' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                ⚡ Practice Quiz ({mcqList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('WALLET')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'WALLET' ? '#10B981' : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'WALLET' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                💳 Wallet & E-Books
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('KYC')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'KYC' ? '#8B5CF6' : 'transparent',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'KYC' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                🆔 KYC Verification
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('MLM_NETWORK')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'MLM_NETWORK' ? '#EC4899' : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'MLM_NETWORK'
                      ? '#FFFFFF'
                      : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                🤝 Refer & Earn (₹25k)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* SUB-TAB: MLM BINARY REFERRAL NETWORK */}
        {activeTab === 'MLM_NETWORK' && (
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '800',
                marginBottom: 4,
              }}
            >
              🤝 Binary MLM Referral Partner Suite
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              Share your referral link to build your binary team network & earn
              matching bonuses.
            </Text>

            {!!mlmMsg && (
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}
                >
                  {mlmMsg}
                </Text>
              </View>
            )}

            {/* Referral Code & Action Share Suite */}
            <View
              style={{
                backgroundColor: colors.itemSubCard,
                borderRadius: 14,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                MY UNIQUE REFERRAL CODE
              </Text>
              <Text
                style={{
                  color: '#F59E0B',
                  fontSize: 22,
                  fontWeight: '900',
                  marginTop: 4,
                  letterSpacing: 1,
                }}
              >
                {mlmStats?.referralCode ||
                  user?.referralCode ||
                  user?.userId ||
                  'REF-STUDENT'}
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                Share Link: {getMobileShareUrl()}
              </Text>

              {/* 1-Click Mobile Share Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={handleCopyMobileLink}
                  style={{
                    flex: 1,
                    backgroundColor: '#6366F1',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    📋 Copy Link
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareMobileLink}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    📲 Share Link
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Leg Placement Preference Control */}
            <View
              style={{
                backgroundColor: colors.itemSubCard,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 13,
                  fontWeight: '800',
                  marginBottom: 8,
                }}
              >
                Downline Placement Leg Preference:
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => handleLegPlacementChange('AUTO')}
                  disabled={isUpdatingLeg}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      (mlmStats?.placementPreference || 'AUTO') === 'AUTO'
                        ? '#6366F1'
                        : colors.cardBg,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        (mlmStats?.placementPreference || 'AUTO') === 'AUTO'
                          ? '#FFF'
                          : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    ⚖️ Auto
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleLegPlacementChange('LEFT')}
                  disabled={isUpdatingLeg}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      mlmStats?.placementPreference === 'LEFT'
                        ? '#10B981'
                        : colors.cardBg,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        mlmStats?.placementPreference === 'LEFT'
                          ? '#FFF'
                          : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    👈 Left Leg
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleLegPlacementChange('RIGHT')}
                  disabled={isUpdatingLeg}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      mlmStats?.placementPreference === 'RIGHT'
                        ? '#8B5CF6'
                        : colors.cardBg,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        mlmStats?.placementPreference === 'RIGHT'
                          ? '#FFF'
                          : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    👉 Right Leg
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Network Volume Stats & Carry Forward Grid */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}
              >
                <Text
                  style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}
                >
                  CARRIED LEFT PV
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: '900',
                    marginTop: 2,
                  }}
                >
                  {mlmStats?.carriedLeftPV !== undefined
                    ? mlmStats.carriedLeftPV
                    : mlmStats?.leftVolume || 0}{' '}
                  PV
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 9 }}>
                  Total: {mlmStats?.leftVolume || 0} PV
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                }}
              >
                <Text
                  style={{ color: '#6366F1', fontSize: 10, fontWeight: '800' }}
                >
                  CARRIED RIGHT PV
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: '900',
                    marginTop: 2,
                  }}
                >
                  {mlmStats?.carriedRightPV !== undefined
                    ? mlmStats.carriedRightPV
                    : mlmStats?.rightVolume || 0}{' '}
                  PV
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 9 }}>
                  Total: {mlmStats?.rightVolume || 0} PV
                </Text>
              </View>
            </View>

            {/* Pair Matching & Net Payout Breakdown Card */}
            <View
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(245, 158, 11, 0.3)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{ color: '#D97706', fontSize: 11, fontWeight: '800' }}
                >
                  NET RECEIVABLE BINARY PAYOUT
                </Text>
                <Text
                  style={{ color: '#10B981', fontSize: 16, fontWeight: '900' }}
                >
                  ₹
                  {mlmStats?.netPayableBonus !== undefined
                    ? mlmStats.netPayableBonus
                    : mlmStats?.estimatedMatchingBonus || 0}
                </Text>
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  lineHeight: 14,
                }}
              >
                • 1:1 Matched Pairs:{' '}
                <Text style={{ color: '#F59E0B', fontWeight: '700' }}>
                  {mlmStats?.matchedPV || 0} PV
                </Text>{' '}
                (Gross: ₹{mlmStats?.grossMatchingBonus || 0}){'\n'}• Daily
                Capping Guard:{' '}
                <Text style={{ color: '#10B981', fontWeight: '700' }}>
                  ₹25,000 / day
                </Text>
                {'\n'}• Deductions (10%):{' '}
                <Text style={{ color: '#EF4444', fontWeight: '700' }}>
                  -₹{(mlmStats?.adminFee || 0) + (mlmStats?.tdsDeduction || 0)}
                </Text>{' '}
                (5% Admin + 5% TDS)
              </Text>
            </View>

            {/* Interactive Binary Tree Visualizer Section */}
            <View
              style={{
                backgroundColor: colors.itemSubCard,
                borderRadius: 14,
                padding: 14,
                marginTop: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: '800',
                    }}
                  >
                    🌳 Downline Tree & Leg Structure
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    Tap any node to drill down into its personal downline tree
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {focusedNode && (
                    <TouchableOpacity
                      onPress={() => setFocusedNode(null)}
                      style={{
                        backgroundColor: '#F59E0B',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: '800',
                        }}
                      >
                        ↺ Reset Root
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={loadBinaryTreeData}
                    style={{
                      backgroundColor: colors.cardBg,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      🔄 Reload
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {focusedNode && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isDarkMode
                      ? 'rgba(99,102,241,0.25)'
                      : 'rgba(99,102,241,0.12)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#6366F1',
                      flex: 1,
                    }}
                  >
                    🔍 Focused on: {focusedNode.name || focusedNode.userId} (ID:{' '}
                    {focusedNode.userId})
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFocusedNode(null)}
                    style={{
                      backgroundColor: colors.cardBg,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      Show Top Root
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isLoadingTree ? (
                <ActivityIndicator
                  color="#6366F1"
                  style={{ marginVertical: 20 }}
                />
              ) : binaryTree ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{
                    paddingVertical: 10,
                    alignItems: 'center',
                    minWidth: '100%',
                  }}
                >
                  <MobileTreeNodeItem
                    node={focusedNode || binaryTree}
                    positionLabel="ROOT"
                    depth={1}
                    maxDepth={3}
                    displayRootId={
                      (focusedNode || binaryTree)?.id ||
                      (focusedNode || binaryTree)?.userId
                    }
                    onNodeClick={clickedNode => {
                      if (clickedNode && clickedNode.userId !== 'VACANT') {
                        setFocusedNode(clickedNode);
                      }
                    }}
                    isDarkMode={isDarkMode}
                    colors={colors}
                  />
                </ScrollView>
              ) : (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    No downline members joined yet. Share your referral link to
                    build your binary team!
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* SUB-TAB 1: MY CLASSROOM */}
        {activeTab === 'MY_CLASSES' && (
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '800',
                marginBottom: 12,
              }}
            >
              My Enrolled Classroom Batches ({enrolledCourses.length})
            </Text>

            {isLoadingEnrolled ? (
              <ActivityIndicator
                color="#6366F1"
                style={{ marginVertical: 20 }}
              />
            ) : enrolledCourses.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  You have not enrolled in any course batches yet.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('BROWSE')}
                  style={{
                    backgroundColor: '#6366F1',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    Browse Available Courses
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              enrolledCourses.map(crs => {
                const matCount =
                  crs.studyMaterials?.length ||
                  (crs.ebookPdfUrl ? 1 : 0) ||
                  crs.inclusions?.totalEbooks ||
                  0;
                const testCount =
                  crs.mockTests?.length || crs.inclusions?.totalMockTests || 0;
                const lectCount =
                  crs.curriculum?.length || crs.inclusions?.totalLectures || 40;

                return (
                  <View
                    key={crs._id}
                    style={{
                      backgroundColor: colors.itemSubCard,
                      borderRadius: 14,
                      padding: 14,
                      borderLeftWidth: 4,
                      borderLeftColor: '#10B981',
                      marginBottom: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedCourseDetail(crs)}
                    >
                      {/* COURSE THUMBNAIL BANNER */}
                      <Image
                        source={{ uri: crs.thumbnail || DEFAULT_COURSE_BANNER }}
                        style={{
                          width: '100%',
                          height: 130,
                          borderRadius: 10,
                          marginBottom: 10,
                          backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                        }}
                        resizeMode="contain"
                      />

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: '#10B981',
                              fontSize: 10,
                              fontWeight: '800',
                            }}
                          >
                            ✅ ACTIVE ACCESS
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: '#6366F1',
                              fontSize: 10,
                              fontWeight: '800',
                            }}
                          >
                            {crs.boardOrGrade || 'General Batch'}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: '800',
                        }}
                      >
                        {crs.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        Educator: {crs.instructor?.name || 'Prof. Educator'} •
                        State: {crs.stateCode || 'GLOBAL'}
                      </Text>

                      {/* Deliverables summary pills */}
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 8,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: colors.inputBg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 10,
                              fontWeight: '600',
                            }}
                          >
                            📹 {lectCount} Lectures
                          </Text>
                        </View>
                        {matCount > 0 && (
                          <View
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: 'rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#F59E0B',
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              📄 {matCount} Study Docs & PDFs
                            </Text>
                          </View>
                        )}
                        {testCount > 0 && (
                          <View
                            style={{
                              backgroundColor: 'rgba(236, 72, 153, 0.12)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: 'rgba(236, 72, 153, 0.3)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#EC4899',
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              📝 {testCount} Topic Tests
                            </Text>
                          </View>
                        )}
                        {crs.liveSchedule && (
                          <View
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#10B981',
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              ⏰ {crs.liveSchedule}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 8,
                        marginTop: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      {(crs.courseMode === 'LIVE_ONLINE' ||
                        crs.courseMode === 'HYBRID' ||
                        crs.liveMeetingUrl ||
                        !crs.lectureVideoUrl) && (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              crs.liveMeetingUrl ||
                                'https://meet.google.com/eduverse-live-class',
                            )
                          }
                          style={{
                            backgroundColor: '#10B981',
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: '800',
                            }}
                          >
                            🔴 Join Live Class
                          </Text>
                        </TouchableOpacity>
                      )}

                      {(crs.courseMode === 'RECORDED_VIDEO' ||
                        crs.lectureVideoUrl ||
                        crs.courseMode === 'HYBRID') && (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              crs.lectureVideoUrl ||
                                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            )
                          }
                          style={{
                            backgroundColor: '#6366F1',
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: '700',
                            }}
                          >
                            📹 Watch Video
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => setSelectedCourseDetail(crs)}
                        style={{
                          backgroundColor: colors.inputBg,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          👁️ View Batch Materials
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* SUB-TAB 2: BROWSE COURSES DIRECTORY (PhonePe & Muthoot Fincorp ONE Style) */}
        {activeTab === 'BROWSE' && (
          <View>
            {/* 1. PHONEPE QUICK ACTIONS HUB (6 Circular elevated buttons with badges) */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    fontWeight: '800',
                  }}
                >
                  Quick Hub & Classroom Access
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#6366F1',
                      fontSize: 10,
                      fontWeight: '800',
                    }}
                  >
                    6 SERVICES
                  </Text>
                </View>
              </View>

              {/* Circular Quick Action Row */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                {/* Service 1: My Classes */}
                <TouchableOpacity
                  onPress={() => setActiveTab('MY_CLASSES')}
                  style={{
                    width: '31%',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#6366F1',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🎓</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#6366F1',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        {enrolledCourses.length}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    My Classes
                  </Text>
                </TouchableOpacity>

                {/* Service 2: Practice Quizzes */}
                <TouchableOpacity
                  onPress={() => setActiveTab('QUIZ')}
                  style={{
                    width: '31%',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#F59E0B',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>⚡</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#F59E0B',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#0F172A',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        FREE
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    Mock Tests
                  </Text>
                </TouchableOpacity>

                {/* Service 3: E-Book Store */}
                <TouchableOpacity
                  onPress={() => setActiveTab('WALLET')}
                  style={{
                    width: '31%',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#06B6D4',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>📖</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#06B6D4',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        PDFs
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    E-Books
                  </Text>
                </TouchableOpacity>

                {/* Service 4: Wallet Credits */}
                <TouchableOpacity
                  onPress={() => setShowTopUpModal(true)}
                  style={{ width: '31%', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#10B981',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>💳</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#10B981',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        ₹{stats?.walletBalance || 0}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    Top-Up Wallet
                  </Text>
                </TouchableOpacity>

                {/* Service 5: Refer & Earn */}
                <TouchableOpacity
                  onPress={() => setActiveTab('MLM_NETWORK')}
                  style={{ width: '31%', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(236, 72, 153, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#EC4899',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🤝</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#EC4899',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        ₹25K
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    Refer & Earn
                  </Text>
                </TouchableOpacity>

                {/* Service 6: KYC Status */}
                <TouchableOpacity
                  onPress={() => setActiveTab('KYC')}
                  style={{ width: '31%', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      borderWidth: 1.5,
                      borderColor: '#8B5CF6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🆔</Text>
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: '#8B5CF6',
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 9,
                          fontWeight: '900',
                        }}
                      >
                        KYC
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    KYC Verify
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DYNAMIC SPONSOR / ADMIN ADVERTISEMENT SPOTLIGHT (Image or Video) */}
            {dynamicAds.length > 0 &&
              (() => {
                const currentAd = dynamicAds[activeAdIndex % dynamicAds.length];
                if (!currentAd) return null;

                return (
                  <View
                    style={{
                      marginBottom: 18,
                      borderRadius: 18,
                      overflow: 'hidden',
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor:
                        currentAd.type === 'VIDEO' ? '#EC4899' : '#F59E0B',
                      shadowColor:
                        currentAd.type === 'VIDEO' ? '#EC4899' : '#F59E0B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDarkMode ? 0.3 : 0.12,
                      shadowRadius: 10,
                      elevation: 4,
                    }}
                  >
                    {/* Media Container */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        if (currentAd.type === 'VIDEO') {
                          setActiveVideoModalAd(currentAd);
                        } else if (currentAd.targetUrl) {
                          Linking.openURL(currentAd.targetUrl).catch(() => {
                            Alert.alert(
                              'Link Error',
                              'Unable to open target URL',
                            );
                          });
                        }
                      }}
                      style={{
                        height: 160,
                        width: '100%',
                        backgroundColor: '#0F172A',
                        position: 'relative',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: currentAd.mediaUrl }}
                        style={{
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                        }}
                      />

                      {/* If video ad, render play button overlay */}
                      {currentAd.type === 'VIDEO' && (
                        <View
                          style={{
                            position: 'absolute',
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: 'rgba(236, 72, 153, 0.9)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#EC4899',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.6,
                            shadowRadius: 8,
                            elevation: 5,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 20,
                              marginLeft: 3,
                            }}
                          >
                            ▶
                          </Text>
                        </View>
                      )}

                      {/* Badges on Media */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          flexDirection: 'row',
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor:
                              currentAd.type === 'VIDEO'
                                ? '#EC4899'
                                : '#F59E0B',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 10,
                              fontWeight: '900',
                            }}
                          >
                            {currentAd.type === 'VIDEO'
                              ? '🎬 VIDEO AD'
                              : '✨ SPONSORED'}
                          </Text>
                        </View>
                      </View>

                      {/* Click action pill */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 10,
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 10,
                            fontWeight: '700',
                          }}
                        >
                          {currentAd.type === 'VIDEO'
                            ? '▶ Tap to Watch'
                            : currentAd.targetUrl
                              ? '↗ Tap to Visit'
                              : 'View Ad'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Ad Content Details */}
                    <View style={{ padding: 14 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 15,
                          fontWeight: '800',
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {currentAd.title}
                      </Text>

                      {currentAd.description ? (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginBottom: 10,
                            lineHeight: 16,
                          }}
                          numberOfLines={2}
                        >
                          {currentAd.description}
                        </Text>
                      ) : null}

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        {/* Action Button */}
                        <TouchableOpacity
                          onPress={() => {
                            if (currentAd.type === 'VIDEO') {
                              setActiveVideoModalAd(currentAd);
                            } else if (currentAd.targetUrl) {
                              Linking.openURL(currentAd.targetUrl).catch(() => {
                                Alert.alert(
                                  'Link Error',
                                  'Unable to open target URL',
                                );
                              });
                            }
                          }}
                          style={{
                            backgroundColor:
                              currentAd.type === 'VIDEO'
                                ? '#EC4899'
                                : '#F59E0B',
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: '800',
                            }}
                          >
                            {currentAd.type === 'VIDEO'
                              ? 'Watch Video ▶'
                              : 'Explore Offer →'}
                          </Text>
                        </TouchableOpacity>

                        {/* Next Ad Toggle (if multiple) */}
                        {dynamicAds.length > 1 && (
                          <TouchableOpacity
                            onPress={() =>
                              setActiveAdIndex(
                                prev => (prev + 1) % dynamicAds.length,
                              )
                            }
                            style={{
                              backgroundColor: colors.inputBg,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.textPrimary,
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              Next Ad ❯
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Dots for Dynamic Ads */}
                      {dynamicAds.length > 1 && (
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 5,
                            marginTop: 10,
                          }}
                        >
                          {dynamicAds.map((_, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => setActiveAdIndex(idx)}
                              style={{
                                width: activeAdIndex === idx ? 18 : 5,
                                height: 5,
                                borderRadius: 3,
                                backgroundColor:
                                  activeAdIndex === idx
                                    ? currentAd.type === 'VIDEO'
                                      ? '#EC4899'
                                      : '#F59E0B'
                                    : isDarkMode
                                      ? '#334155'
                                      : '#CBD5E1',
                              }}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })()}

            {/* 2. MUTHOOT FINCORP ONE STYLE HERO PROMOTIONAL CAROUSEL BANNER */}
            <View style={{ marginBottom: 18 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  handleBannerPress(PROMO_BANNERS[activeBannerIndex])
                }
                style={{
                  borderRadius: 18,
                  padding: 16,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: PROMO_BANNERS[activeBannerIndex].accentColor,
                  shadowColor: PROMO_BANNERS[activeBannerIndex].accentColor,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDarkMode ? 0.25 : 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: PROMO_BANNERS[activeBannerIndex].accentColor,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {PROMO_BANNERS[activeBannerIndex].tag}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor:
                        PROMO_BANNERS[activeBannerIndex].accentColor,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      {PROMO_BANNERS[activeBannerIndex].badgeText}
                    </Text>
                  </View>
                </View>

                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '800',
                    marginBottom: 4,
                  }}
                >
                  {PROMO_BANNERS[activeBannerIndex].title}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    marginBottom: 12,
                    lineHeight: 16,
                  }}
                >
                  {PROMO_BANNERS[activeBannerIndex].subTitle}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleBannerPress(PROMO_BANNERS[activeBannerIndex])
                    }
                    style={{
                      backgroundColor:
                        PROMO_BANNERS[activeBannerIndex].accentColor,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '800',
                      }}
                    >
                      {PROMO_BANNERS[activeBannerIndex].ctaText} →
                    </Text>
                  </TouchableOpacity>

                  {/* Next Slide Arrow Button */}
                  <TouchableOpacity
                    onPress={() =>
                      setActiveBannerIndex(
                        prev => (prev + 1) % PROMO_BANNERS.length,
                      )
                    }
                    style={{
                      backgroundColor: colors.inputBg,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      Next Promo ❯
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Pagination Dots */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {PROMO_BANNERS.map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveBannerIndex(idx)}
                    style={{
                      width: activeBannerIndex === idx ? 22 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        activeBannerIndex === idx
                          ? '#6366F1'
                          : isDarkMode
                            ? '#334155'
                            : '#CBD5E1',
                    }}
                  />
                ))}
              </View>
            </View>

            {/* 2.5 UPPER MASTER LEVEL FILTER BAR (CENTRAL vs STATE) */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.2 : 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: colors.textPrimary,
                    }}
                  >
                    🎯 Curriculum Scope:
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        selectedExamLevel === 'CENTRAL'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : selectedExamLevel === 'STATE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color:
                          selectedExamLevel === 'CENTRAL'
                            ? '#6366F1'
                            : selectedExamLevel === 'STATE'
                              ? '#10B981'
                              : '#D97706',
                      }}
                    >
                      {selectedExamLevel === 'CENTRAL'
                        ? '🏛️ Central Level (All India)'
                        : selectedExamLevel === 'STATE'
                          ? `🗺️ State: ${selectedState?.name || 'Selected State'}`
                          : '🌐 All Platform Courses'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setLevelModalTab('CHOOSE_LEVEL');
                    setShowLevelModal(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: isDarkMode
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(99,102,241,0.1)',
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(99,102,241,0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: '#6366F1',
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    Change
                  </Text>
                  <Text style={{ color: '#6366F1', fontSize: 10 }}>▾</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Master Level Switcher Buttons */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedExamLevel('CENTRAL');
                    setSelectedState(null);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      selectedExamLevel === 'CENTRAL'
                        ? '#6366F1'
                        : colors.itemSubCard,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor:
                      selectedExamLevel === 'CENTRAL'
                        ? '#6366F1'
                        : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedExamLevel === 'CENTRAL'
                          ? '#FFFFFF'
                          : colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    🏛️ Central (NEET/JEE)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (selectedState) {
                      setSelectedExamLevel('STATE');
                    } else {
                      setLevelModalTab('CHOOSE_STATE');
                      setShowLevelModal(true);
                    }
                  }}
                  style={{
                    flex: 1.2,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      selectedExamLevel === 'STATE'
                        ? '#10B981'
                        : colors.itemSubCard,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor:
                      selectedExamLevel === 'STATE'
                        ? '#10B981'
                        : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedExamLevel === 'STATE'
                          ? '#FFFFFF'
                          : colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                    numberOfLines={1}
                  >
                    🗺️ {selectedState ? selectedState.name : 'Choose State ▾'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedExamLevel('ALL');
                    setSelectedState(null);
                  }}
                  style={{
                    flex: 0.8,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      selectedExamLevel === 'ALL'
                        ? '#F59E0B'
                        : colors.itemSubCard,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor:
                      selectedExamLevel === 'ALL'
                        ? '#F59E0B'
                        : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedExamLevel === 'ALL'
                          ? '#FFFFFF'
                          : colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    🌐 All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. 6 CATEGORIZED 4-COLUMN ICON GRIDS (Muthoot Fincorp ONE Style) */}
            {CATEGORY_SECTIONS.map(sec => (
              <View
                key={sec.id}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Category Header with "View All >" */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{sec.icon}</Text>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '800',
                      }}
                      numberOfLines={1}
                    >
                      {sec.title}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategoryFilter(sec.id);
                      setSelectedCategoryTitle(sec.title);
                      if (filterMode !== 'EXPLORE_ALL') {
                        setFilterMode('EXPLORE_ALL');
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: '#6366F1',
                        fontSize: 12,
                        fontWeight: '800',
                      }}
                    >
                      View All
                    </Text>
                    <Text
                      style={{
                        color: '#6366F1',
                        fontSize: 12,
                        fontWeight: '800',
                      }}
                    >
                      ❯
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4-Column Icon Grid */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}
                >
                  {sec.items.map(item => {
                    const isSelected =
                      selectedCategoryFilter === item.filterKey;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedCategoryFilter(item.filterKey);
                          setSelectedCategoryTitle(
                            item.name.replace('\n', ' '),
                          );
                          if (filterMode !== 'EXPLORE_ALL') {
                            setFilterMode('EXPLORE_ALL');
                          }
                        }}
                        style={{
                          width: '23%',
                          alignItems: 'center',
                          marginBottom: 16,
                        }}
                      >
                        {/* Icon Squircle Box */}
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 16,
                            backgroundColor: isSelected
                              ? 'rgba(99, 102, 241, 0.25)'
                              : colors.iconBoxBg,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected
                              ? '#6366F1'
                              : colors.iconBoxBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: isDarkMode ? 0.3 : 0.05,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        >
                          {/* Status Badge (Popular, Hot, New, Regional) */}
                          {item.badge && (
                            <View
                              style={{
                                position: 'absolute',
                                top: -6,
                                backgroundColor: item.badgeBg || '#EC4899',
                                paddingHorizontal: 4,
                                paddingVertical: 1,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: '#FFFFFF',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#FFFFFF',
                                  fontSize: 7,
                                  fontWeight: '900',
                                  letterSpacing: 0.2,
                                }}
                              >
                                {item.badge.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                        </View>

                        {/* 2-Line Title Label */}
                        <Text
                          style={{
                            color: isSelected ? '#6366F1' : colors.textPrimary,
                            fontSize: 10,
                            fontWeight: isSelected ? '800' : '700',
                            textAlign: 'center',
                            marginTop: 6,
                            lineHeight: 13,
                          }}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* 4. ACTIVE FILTER STATUS & COURSE CATALOG HEADER */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: '800',
                    }}
                  >
                    Available Batches & Courses
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Filter: {selectedCategoryTitle}
                  </Text>
                </View>

                {selectedCategoryFilter !== 'ALL' && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategoryFilter('ALL');
                      setSelectedCategoryTitle('All Platform Courses');
                    }}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: '#EF4444',
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      ✕ Show All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Goal Match vs Explore All Toggle Buttons */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => {
                    setFilterMode('GOAL_MATCH');
                    loadBrowse('GOAL_MATCH');
                  }}
                  style={{
                    backgroundColor:
                      filterMode === 'GOAL_MATCH' ? '#10B981' : colors.inputBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color:
                        filterMode === 'GOAL_MATCH'
                          ? '#FFF'
                          : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    🎯 My Target Goal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setFilterMode('EXPLORE_ALL');
                    loadBrowse('EXPLORE_ALL');
                  }}
                  style={{
                    backgroundColor:
                      filterMode === 'EXPLORE_ALL' ? '#6366F1' : colors.inputBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color:
                        filterMode === 'EXPLORE_ALL'
                          ? '#FFF'
                          : colors.textSecondary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    🌐 Explore All ({browseCoursesList.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {!!enrollMsg && (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#10B981',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {enrollMsg}
                  </Text>
                </View>
              )}

              {/* Course Cards Rendering */}
              {isLoadingBrowse ? (
                <ActivityIndicator
                  color="#6366F1"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                (() => {
                  const filteredList = browseCoursesList.filter(crs => {
                    // 1. UPPER MASTER LEVEL FILTER (Central vs State)
                    if (selectedExamLevel === 'CENTRAL') {
                      const isCentral =
                        !crs.stateCode ||
                        crs.stateCode === 'GLOBAL' ||
                        crs.stateCode === 'CENTRAL' ||
                        crs.stateCode === 'ALL_INDIA';
                      if (!isCentral) return false;
                    } else if (selectedExamLevel === 'STATE') {
                      if (selectedState) {
                        const stCode = (crs.stateCode || '').toUpperCase();
                        const targetCode = selectedState.code.toUpperCase();
                        const targetName = selectedState.name.toLowerCase();
                        const crsTitle = (crs.title || '').toLowerCase();
                        const crsDesc = (crs.description || '').toLowerCase();
                        const crsBoard = (
                          (crs as any).boardOrGrade || ''
                        ).toLowerCase();
                        const crsSub = (
                          (crs as any).subCategory || ''
                        ).toLowerCase();

                        const matchState =
                          stCode === targetCode ||
                          crsTitle.includes(targetName) ||
                          crsDesc.includes(targetName) ||
                          crsBoard.includes(targetName) ||
                          crsSub.includes(targetName);

                        if (!matchState) return false;
                      }
                    }

                    // 2. CATEGORY & KEYWORD FILTER
                    if (selectedCategoryFilter === 'ALL') return true;
                    const filterLower = selectedCategoryFilter.toLowerCase();
                    const cleanFilter = filterLower.replace(/[^a-z0-9]/g, '');

                    const crsCatCode = (
                      (crs as any).categoryCode ||
                      (typeof crs.category === 'string'
                        ? crs.category
                        : (crs.category as any)?.code) ||
                      ''
                    ).toLowerCase();
                    const cleanCatCode = crsCatCode.replace(/[^a-z0-9]/g, '');
                    const matchCat =
                      crsCatCode === filterLower ||
                      cleanCatCode === cleanFilter;

                    const subCat = (
                      (crs as any).subCategory || ''
                    ).toLowerCase();
                    const cleanSub = subCat.replace(/[^a-z0-9]/g, '');

                    const subCatTitle = (
                      (crs as any).subCategoryTitle || ''
                    ).toLowerCase();
                    const cleanSubTitle = subCatTitle.replace(/[^a-z0-9]/g, '');

                    const title = (crs.title || '').toLowerCase();
                    const cleanTitle = title.replace(/[^a-z0-9]/g, '');

                    const desc = (crs.description || '').toLowerCase();
                    const board = (
                      (crs as any).boardOrGrade || ''
                    ).toLowerCase();
                    const stream = ((crs as any).stream || '').toLowerCase();
                    const subject = (
                      (crs as any).subjectName || ''
                    ).toLowerCase();

                    const matchSub =
                      subCat.includes(filterLower) ||
                      cleanSub.includes(cleanFilter) ||
                      subCatTitle.includes(filterLower) ||
                      cleanSubTitle.includes(cleanFilter) ||
                      title.includes(filterLower) ||
                      cleanTitle.includes(cleanFilter) ||
                      desc.includes(filterLower) ||
                      board.includes(filterLower) ||
                      stream.includes(filterLower) ||
                      subject.includes(filterLower);

                    return matchCat || matchSub;
                  });

                  if (filteredList.length === 0) {
                    const scopeLabel =
                      selectedExamLevel === 'CENTRAL'
                        ? 'Central Level'
                        : selectedExamLevel === 'STATE'
                          ? selectedState?.name || 'Selected State'
                          : '';
                    return (
                      <View
                        style={{
                          alignItems: 'center',
                          padding: 24,
                          backgroundColor: colors.itemSubCard,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 32, marginBottom: 8 }}>
                          📚
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 14,
                            fontWeight: '800',
                            textAlign: 'center',
                          }}
                        >
                          No direct batches found{' '}
                          {scopeLabel ? `for "${scopeLabel}"` : ''}{' '}
                          {selectedCategoryFilter !== 'ALL'
                            ? `in "${selectedCategoryTitle}"`
                            : ''}
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            textAlign: 'center',
                            marginTop: 4,
                            marginBottom: 14,
                          }}
                        >
                          Upcoming live online batches are being scheduled.
                          Check out all available batches or switch scope below!
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 8,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedCategoryFilter('ALL');
                              setSelectedCategoryTitle('All Platform Courses');
                              setSelectedExamLevel('ALL');
                            }}
                            style={{
                              backgroundColor: '#6366F1',
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontWeight: '700',
                                fontSize: 12,
                              }}
                            >
                              View All Available Batches
                            </Text>
                          </TouchableOpacity>
                          {selectedExamLevel !== 'CENTRAL' && (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedExamLevel('CENTRAL');
                                setSelectedCategoryFilter('ALL');
                              }}
                              style={{
                                backgroundColor: '#10B981',
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#FFFFFF',
                                  fontWeight: '700',
                                  fontSize: 12,
                                }}
                              >
                                Explore Central Exams (NEET/JEE/UPSC)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  }

                  return filteredList.map(crs => {
                    const isEnrolled = enrolledCourses.some(
                      e => e._id === crs._id,
                    );
                    const matCount =
                      crs.studyMaterials?.length ||
                      (crs.ebookPdfUrl ? 1 : 0) ||
                      crs.inclusions?.totalEbooks ||
                      0;
                    const testCount =
                      crs.mockTests?.length ||
                      crs.inclusions?.totalMockTests ||
                      0;
                    const lectCount =
                      crs.curriculum?.length ||
                      crs.inclusions?.totalLectures ||
                      40;

                    return (
                      <View
                        key={crs._id}
                        style={{
                          backgroundColor: colors.itemSubCard,
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 14,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        {/* Clickable banner & title */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setSelectedCourseDetail(crs)}
                        >
                          <Image
                            source={{
                              uri: crs.thumbnail || DEFAULT_COURSE_BANNER,
                            }}
                            style={{
                              width: '100%',
                              height: 130,
                              borderRadius: 10,
                              marginBottom: 10,
                              backgroundColor: isDarkMode
                                ? '#1E293B'
                                : '#F1F5F9',
                            }}
                            resizeMode="contain"
                          />

                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 4,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                gap: 4,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                              }}
                            >
                              <View
                                style={{
                                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#06B6D4',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  State: {crs.stateCode || 'GLOBAL'}
                                </Text>
                              </View>
                              <View
                                style={{
                                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#F43F5E',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  🎯{' '}
                                  {(crs as any).subjectName || 'All Subjects'}
                                </Text>
                              </View>
                              <View
                                style={{
                                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#6366F1',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  {crs.boardOrGrade || 'Comprehensive'}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'baseline',
                                gap: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#10B981',
                                  fontSize: 17,
                                  fontWeight: '800',
                                }}
                              >
                                ₹{crs.price}
                              </Text>
                              {crs.originalPrice &&
                                crs.originalPrice > crs.price && (
                                  <Text
                                    style={{
                                      color: colors.textMuted,
                                      fontSize: 11,
                                      textDecorationLine: 'line-through',
                                    }}
                                  >
                                    ₹{crs.originalPrice}
                                  </Text>
                                )}
                            </View>
                          </View>

                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 15,
                              fontWeight: '800',
                              marginTop: 6,
                            }}
                          >
                            {crs.title}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                              marginTop: 4,
                            }}
                            numberOfLines={2}
                          >
                            {crs.description}
                          </Text>

                          {/* Deliverable Micro-Pills */}
                          <View
                            style={{
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              gap: 6,
                              marginTop: 8,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: colors.inputBg,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.cardBorder,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 10,
                                  fontWeight: '600',
                                }}
                              >
                                📹 {lectCount} Lectures
                              </Text>
                            </View>
                            {matCount > 0 && (
                              <View
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  borderColor: 'rgba(245, 158, 11, 0.3)',
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#F59E0B',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  📄 {matCount} PDFs/Notes
                                </Text>
                              </View>
                            )}
                            {testCount > 0 && (
                              <View
                                style={{
                                  backgroundColor: 'rgba(236, 72, 153, 0.12)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  borderColor: 'rgba(236, 72, 153, 0.3)',
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#EC4899',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  📝 {testCount} Mock Tests
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text
                            style={{
                              color: colors.textMuted,
                              fontSize: 11,
                              marginTop: 6,
                            }}
                          >
                            Educator:{' '}
                            <Text
                              style={{
                                fontWeight: '700',
                                color: colors.textSecondary,
                              }}
                            >
                              {crs.instructor?.name || 'Prof. Educator'}
                            </Text>
                          </Text>
                        </TouchableOpacity>

                        {/* Action Footer */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: colors.cardBorder,
                            paddingTop: 10,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => setSelectedCourseDetail(crs)}
                            style={{
                              backgroundColor: colors.inputBg,
                              paddingHorizontal: 12,
                              paddingVertical: 7,
                              borderRadius: 7,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.textPrimary,
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              👁️ Details
                            </Text>
                          </TouchableOpacity>

                          {isEnrolled ? (
                            <View
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: 7,
                                borderWidth: 1,
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              <Text
                                style={{
                                  color: '#10B981',
                                  fontSize: 11,
                                  fontWeight: '800',
                                }}
                              >
                                ✅ ALREADY ENROLLED
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleEnrollCourse(crs)}
                              disabled={enrollingCourseId === crs._id}
                              style={{
                                backgroundColor: '#6366F1',
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 8,
                              }}
                            >
                              {enrollingCourseId === crs._id ? (
                                <ActivityIndicator
                                  color="#FFFFFF"
                                  size="small"
                                />
                              ) : (
                                <Text
                                  style={{
                                    color: '#FFFFFF',
                                    fontSize: 12,
                                    fontWeight: '800',
                                  }}
                                >
                                  1-Click Enroll
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  });
                })()
              )}
            </View>
          </View>
        )}

        {/* SUB-TAB 3: LIVE PRACTICE QUIZ */}
        {activeTab === 'QUIZ' && (
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '800',
                marginBottom: 4,
              }}
            >
              Interactive Practice Quiz Engine
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              Test your knowledge with live MCQ questions
            </Text>

            {quizSetsList.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  📁 Select Test Paper / Quiz Set ({quizSetsList.length}{' '}
                  Available)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexDirection: 'row' }}
                >
                  {quizSetsList.map(setObj => {
                    const isSelected = setObj.quizSetId === selectedQuizSetId;
                    return (
                      <TouchableOpacity
                        key={setObj.quizSetId}
                        onPress={() => handleSelectQuizSet(setObj.quizSetId)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 10,
                          marginRight: 8,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected
                            ? '#6366F1'
                            : colors.cardBorder,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? 'rgba(99, 102, 241, 0.3)'
                              : 'rgba(99, 102, 241, 0.1)'
                            : colors.itemSubCard,
                          minWidth: 150,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected
                                ? '#6366F1'
                                : colors.textPrimary,
                              fontWeight: '700',
                              fontSize: 12,
                            }}
                          >
                            {setObj.quizSetTitle || 'Practice Set'}
                          </Text>
                          {setObj.hasAttempted && (
                            <Text
                              style={{
                                color: '#10B981',
                                fontWeight: '800',
                                fontSize: 10,
                              }}
                            >
                              🔒 Attempted
                            </Text>
                          )}
                        </View>
                        <Text
                          style={{ color: colors.textSecondary, fontSize: 11 }}
                        >
                          {setObj.count} Questions{' '}
                          {setObj.subjectName ? `• ${setObj.subjectName}` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {quizResult && (
              <View
                style={{
                  backgroundColor: quizResult.passed
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: quizResult.passed ? '#10B981' : '#F43F5E',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: quizResult.passed ? '#10B981' : '#F43F5E',
                        fontWeight: '800',
                        fontSize: 14,
                      }}
                    >
                      Official Permanent Scorecard: {quizResult.score} /{' '}
                      {quizResult.totalMarks} ({quizResult.percentage}%)
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      Status:{' '}
                      {quizResult.passed ? 'PASSED 🎉' : 'NEEDS IMPROVEMENT ⚠️'}{' '}
                      • 🔒 Retakes Disabled (Permanent Record)
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: quizResult.passed
                        ? '#10B981'
                        : '#F43F5E',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      RECORDED
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {!!quizMsg && (
              <View
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: '#F43F5E', fontSize: 12, fontWeight: '600' }}
                >
                  {quizMsg}
                </Text>
              </View>
            )}

            {isLoadingMcqs ? (
              <ActivityIndicator
                color="#F59E0B"
                style={{ marginVertical: 20 }}
              />
            ) : (
              mcqList.map((mcq, idx) => (
                <View
                  key={mcq._id}
                  style={{
                    backgroundColor: colors.itemSubCard,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: '700',
                      marginBottom: 8,
                    }}
                  >
                    Q{idx + 1}. {mcq.questionText}
                  </Text>

                  {mcq.options?.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[mcq._id] === optIdx;
                    return (
                      <TouchableOpacity
                        key={optIdx}
                        onPress={() => {
                          if (!quizResult) {
                            handleSelectQuizOption(mcq._id, optIdx);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(99, 102, 241, 0.15)'
                            : colors.cardBg,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? '#6366F1'
                            : colors.cardBorder,
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 6,
                          opacity: quizResult ? 0.8 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? '#6366F1' : colors.textPrimary,
                            fontSize: 13,
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}) {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}

            {mcqList.length > 0 &&
              (quizResult ? (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: '#10B981',
                  }}
                >
                  <Text
                    style={{
                      color: '#10B981',
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    🔒 Test Completed — Official Scorecard Recorded Permanently
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleQuizSubmit}
                  disabled={isSubmittingQuiz}
                  style={{
                    backgroundColor: '#F59E0B',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  {isSubmittingQuiz ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: 14,
                      }}
                    >
                      Submit Quiz Answers
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* SUB-TAB 4: WALLET & EARNINGS & PAYOUTS */}
        {activeTab === 'WALLET' && (
          <View style={{ gap: 16 }}>
            {/* MAIN WALLET CARD */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              {/* Header with Title and Action Buttons */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: '#10B981',
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      STUDENT WALLET & EARNINGS
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '800',
                  }}
                >
                  Student Digital Wallet & Payout Center
                </Text>
              </View>

              {/* Quick Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowTopUpModal(true);
                    setTopUpMsg('');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#6366F1',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    + Add Money (Top-Up)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowWithdrawModal(true);
                    setWithdrawErrorMsg('');
                    setWithdrawSuccessMsg('');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 13,
                    }}
                  >
                    ↗ Withdraw Referrals
                  </Text>
                </TouchableOpacity>
              </View>

              {/* DUAL BALANCE SYSTEM */}
              <View style={{ gap: 12, marginBottom: 16 }}>
                {/* CARD 1: Course Purchase Top-up Wallet */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: isDarkMode
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#60A5FA',
                        fontWeight: '800',
                        letterSpacing: 0.5,
                      }}
                    >
                      💳 COURSE PURCHASE WALLET
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          color: '#93C5FD',
                          fontWeight: '800',
                        }}
                      >
                        NON-WITHDRAWABLE
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: '900',
                      color: colors.textPrimary,
                      marginVertical: 4,
                    }}
                  >
                    ₹{' '}
                    {stats
                      ? (stats.purchaseBalance || 0).toLocaleString('en-IN')
                      : '0'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      lineHeight: 16,
                    }}
                  >
                    Balance added via Netbanking/UPI/Card. Reserved for
                    enrolling in Courses, Mock Tests & E-Books.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowTopUpModal(true);
                        setTopUpMsg('');
                      }}
                      style={{
                        backgroundColor: '#6366F1',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '700',
                        }}
                      >
                        + Add Money
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('BROWSE')}
                      style={{
                        backgroundColor: colors.itemSubCard,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        Browse Courses
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD 2: Refer & Earn Commission (Withdrawable) */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: isDarkMode
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: '#34D399',
                        fontWeight: '800',
                        letterSpacing: 0.5,
                      }}
                    >
                      🎁 REFER & EARN COMMISSIONS
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          color: '#10B981',
                          fontWeight: '800',
                        }}
                      >
                        100% WITHDRAWABLE
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: '900',
                      color: colors.textPrimary,
                      marginVertical: 4,
                    }}
                  >
                    ₹{' '}
                    {stats
                      ? (stats.withdrawableBalance !== undefined
                          ? stats.withdrawableBalance
                          : 0
                        ).toLocaleString('en-IN')
                      : '0'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      lineHeight: 16,
                    }}
                  >
                    Earned from direct student referrals & binary MLM matching
                    bonuses. Cash out anytime to Bank or UPI!
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowWithdrawModal(true);
                        setWithdrawErrorMsg('');
                        setWithdrawSuccessMsg('');
                      }}
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '700',
                        }}
                      >
                        ↗ Withdraw to Bank / UPI
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('MLM_NETWORK')}
                      style={{
                        backgroundColor: colors.itemSubCard,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        MLM Network
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD 3: Saved Payout Profile Card */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: colors.itemSubCard,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: colors.textPrimary,
                      }}
                    >
                      🏦 Saved Withdrawal Destination
                    </Text>
                    {savedPayoutProfile?.isConfigured && (
                      <View
                        style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            color: '#818CF8',
                            fontWeight: '800',
                          }}
                        >
                          ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>

                  {savedPayoutProfile?.isConfigured ? (
                    <View style={{ marginTop: 2 }}>
                      {savedPayoutProfile.preferredMethod === 'BANK' ? (
                        <View>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 11,
                            }}
                          >
                            <Text style={{ fontWeight: '700' }}>Bank:</Text>{' '}
                            {savedPayoutProfile.bankAccount?.bankName ||
                              'Direct Bank Transfer'}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            <Text style={{ fontWeight: '700' }}>A/C:</Text>{' '}
                            ••••••••
                            {(
                              savedPayoutProfile.bankAccount?.accountNumber ||
                              ''
                            ).slice(-4)}{' '}
                            ({savedPayoutProfile.bankAccount?.accountHolderName}
                            )
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            <Text style={{ fontWeight: '700' }}>IFSC:</Text>{' '}
                            {savedPayoutProfile.bankAccount?.ifscCode}
                          </Text>
                        </View>
                      ) : (
                        <View>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 11,
                            }}
                          >
                            <Text style={{ fontWeight: '700' }}>UPI ID:</Text>{' '}
                            {savedPayoutProfile.upi?.upiId}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            <Text style={{ fontWeight: '700' }}>Holder:</Text>{' '}
                            {savedPayoutProfile.upi?.accountHolderName ||
                              user?.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      No Bank Account or UPI ID saved yet. Configure it when
                      requesting a withdrawal.
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setShowWithdrawModal(true);
                      setWithdrawErrorMsg('');
                    }}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: colors.cardBg,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: '#6366F1',
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {savedPayoutProfile?.isConfigured
                        ? 'Update Account Details'
                        : '+ Configure Bank / UPI'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total Balance Combined Banner */}
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.04)'
                    : '#F8FAFC',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.cardBorder,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: colors.textPrimary,
                  }}
                >
                  ⚡ Total Usable Balance for Buying Courses: ₹
                  {(stats?.walletBalance || 0).toLocaleString('en-IN')}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.textMuted,
                    marginTop: 3,
                  }}
                >
                  💡 Course khareedne ke liye aap Deposit Balance aur Refer &
                  Earn commission dono use kar sakte hain!
                </Text>
              </View>
            </View>

            {/* WITHDRAWAL REQUESTS & PAYOUT HISTORY CARD */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '800',
                    }}
                  >
                    Bank & UPI Withdrawal History ({myWithdrawalsList.length})
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Track your payout status, approval UTR numbers & cash
                    disbursement
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={loadWithdrawalData}
                  style={{
                    backgroundColor: colors.itemSubCard,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {isLoadingWithdrawals ? '⏳' : '🔄 Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoadingWithdrawals ? (
                <ActivityIndicator
                  color="#10B981"
                  style={{ marginVertical: 18 }}
                />
              ) : myWithdrawalsList.length === 0 ? (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                    backgroundColor: colors.itemSubCard,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>🏦</Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    No Withdrawal Requests Yet
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 11,
                      textAlign: 'center',
                    }}
                  >
                    You have not submitted any withdrawal requests yet. Earn
                    from MLM referrals and cash out anytime!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {myWithdrawalsList.map(item => {
                    const isPending = item.status === 'PENDING';
                    const isApproved = item.status === 'APPROVED';
                    const isRejected = item.status === 'REJECTED';
                    const isCancelled = item.status === 'CANCELLED';

                    return (
                      <View
                        key={item._id}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          backgroundColor: colors.itemSubCard,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: '900',
                              color: isApproved
                                ? '#10B981'
                                : isRejected
                                  ? '#F43F5E'
                                  : colors.textPrimary,
                            }}
                          >
                            ₹ {item.amount.toLocaleString('en-IN')}
                          </Text>
                          <View
                            style={{
                              backgroundColor: isApproved
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isRejected
                                  ? 'rgba(244, 63, 94, 0.15)'
                                  : isCancelled
                                    ? 'rgba(148, 163, 184, 0.15)'
                                    : 'rgba(245, 158, 11, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '800',
                                color: isApproved
                                  ? '#10B981'
                                  : isRejected
                                    ? '#F43F5E'
                                    : isCancelled
                                      ? '#94A3B8'
                                      : '#D97706',
                              }}
                            >
                              {isApproved && '✅ APPROVED & PAID'}
                              {isPending && '🟡 PENDING APPROVAL'}
                              {isRejected && '❌ REJECTED'}
                              {isCancelled && '⚪ CANCELLED'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          {item.payoutMethod === 'BANK'
                            ? `🏦 Bank: ${item.bankDetails?.bankName || 'Bank'} • A/C: ${item.bankDetails?.accountNumber} (IFSC: ${item.bankDetails?.ifscCode})`
                            : `📱 UPI: ${item.upiDetails?.upiId} (${item.upiDetails?.accountHolderName || ''})`}
                        </Text>

                        <Text style={{ fontSize: 10, color: colors.textMuted }}>
                          ID: {item.withdrawalId} •{' '}
                          {new Date(item.createdAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </Text>

                        {!!item.utrNumber && (
                          <View
                            style={{
                              marginTop: 6,
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              padding: 6,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#10B981',
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              ✓ UTR / Ref: {item.utrNumber}
                            </Text>
                          </View>
                        )}

                        {!!item.rejectionReason && (
                          <View
                            style={{
                              marginTop: 6,
                              backgroundColor: 'rgba(244, 63, 94, 0.1)',
                              padding: 6,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#F43F5E',
                                fontSize: 11,
                                fontWeight: '600',
                              }}
                            >
                              ⚠️ Reason: {item.rejectionReason} (Refunded to
                              wallet)
                            </Text>
                          </View>
                        )}

                        {isPending && (
                          <TouchableOpacity
                            onPress={() => handleCancelWithdrawal(item._id)}
                            style={{
                              alignSelf: 'flex-start',
                              marginTop: 10,
                              backgroundColor: 'rgba(244, 63, 94, 0.15)',
                              paddingHorizontal: 12,
                              paddingVertical: 5,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: 'rgba(244, 63, 94, 0.3)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#F43F5E',
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              Cancel Request
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* DIGITAL E-BOOK STORE & LIBRARY */}
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '800',
                  marginBottom: 12,
                }}
              >
                Digital E-Book Store & Library ({ebookList.length})
              </Text>

              {!!ebookMsg && (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#10B981',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {ebookMsg}
                  </Text>
                </View>
              )}

              {isLoadingEbooks ? (
                <ActivityIndicator
                  color="#10B981"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                ebookList.map(eb => (
                  <View
                    key={eb._id}
                    style={{
                      backgroundColor: colors.itemSubCard,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 15,
                          fontWeight: '800',
                        }}
                      >
                        {eb.title}
                      </Text>
                      <Text
                        style={{
                          color: '#10B981',
                          fontSize: 15,
                          fontWeight: '800',
                        }}
                      >
                        ₹{eb.price}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Author: {eb.author}
                    </Text>

                    <View
                      style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}
                    >
                      <TouchableOpacity
                        onPress={() => handlePurchaseEbook(eb._id)}
                        disabled={purchasingEbookId === eb._id}
                        style={{
                          backgroundColor: '#10B981',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          {purchasingEbookId === eb._id
                            ? 'Buying...'
                            : 'Buy E-Book'}
                        </Text>
                      </TouchableOpacity>

                      {eb.fullPdfUrl && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(eb.fullPdfUrl!)}
                          style={{
                            backgroundColor: '#6366F1',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: '700',
                            }}
                          >
                            📖 Open PDF
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* SUB-TAB 5: KYC VERIFICATION WITH DOCUMENT SCAN IMAGE UPLOAD */}
        {activeTab === 'KYC' && (
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '800',
                marginBottom: 4,
              }}
            >
              Submit Identity KYC Scan
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              Government ID Verification (Aadhaar / PAN HD Document Scan)
            </Text>

            {!!kycMsg && (
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}
                >
                  {kycMsg}
                </Text>
              </View>
            )}

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Select Document Type *
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setDocType('AADHAAR')}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor:
                    docType === 'AADHAAR' ? '#8B5CF6' : colors.inputBg,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color:
                      docType === 'AADHAAR' ? '#FFFFFF' : colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  Aadhaar Card (12-Digit)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDocType('PAN')}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor:
                    docType === 'PAN' ? '#8B5CF6' : colors.inputBg,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: docType === 'PAN' ? '#FFFFFF' : colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  PAN Card (10-Digit)
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Document ID Number *
            </Text>
            <TextInput
              value={docNumber}
              onChangeText={setDocNumber}
              placeholder={
                docType === 'AADHAAR'
                  ? 'e.g. 9900 1234 5678'
                  : 'e.g. ABCDE1234F'
              }
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                borderRadius: 8,
                padding: 10,
                color: colors.textPrimary,
                fontSize: 14,
                marginBottom: 14,
              }}
            />

            {/* KYC DOCUMENT SCAN FILE PICKER FIELD */}
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Upload Document HD Image Scan (Max 2MB) *
            </Text>

            <TouchableOpacity
              onPress={handlePickKycImage}
              style={{
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.cardBorder,
                borderRadius: 10,
                padding: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: '#8B5CF6', fontWeight: '700', fontSize: 13 }}
              >
                📷{' '}
                {kycImageUri
                  ? 'Change Document Photo'
                  : 'Pick Document Scan Photo from Phone Gallery'}
              </Text>
            </TouchableOpacity>

            {/* LIVE IMAGE PREVIEW CARD */}
            {!!kycImageUri && (
              <View style={{ marginBottom: 14, alignItems: 'center' }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    marginBottom: 6,
                  }}
                >
                  Scan Preview ({kycFileName || 'Selected Document'}):
                </Text>
                <View
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    width: '100%',
                    height: 150,
                  }}
                >
                  <Image
                    source={{ uri: kycImageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setKycImageUri(null)}
                  style={{ marginTop: 6 }}
                >
                  <Text
                    style={{
                      color: '#F43F5E',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Remove Scan Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={handleKycSubmit}
              disabled={isSubmittingKyc}
              style={{
                backgroundColor: '#8B5CF6',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              {isSubmittingKyc ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}
                >
                  Submit Document Scan
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* WALLET TOP-UP MODAL */}
        <Modal visible={showTopUpModal} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '800',
                  marginBottom: 4,
                }}
              >
                Top-Up Student Wallet
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                Enter amount to credit your student wallet balance
              </Text>

              {!!topUpMsg && (
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#10B981',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {topUpMsg}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['500', '1000', '2500', '5000'].map(amt => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setTopUpAmount(amt)}
                    style={{
                      flex: 1,
                      backgroundColor:
                        topUpAmount === amt ? '#10B981' : colors.inputBg,
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          topUpAmount === amt ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="number-pad"
                placeholder="Enter Custom Amount"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  padding: 10,
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 16,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowTopUpModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.inputBg,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTopUpSubmit}
                  disabled={isSubmittingTopUp}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  {isSubmittingTopUp ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: 13,
                      }}
                    >
                      Confirm Top-Up
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* STUDENT WITHDRAWAL REQUEST MODAL */}
        <Modal visible={showWithdrawModal} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                maxHeight: '90%',
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: '#10B981',
                          fontSize: 10,
                          fontWeight: '800',
                        }}
                      >
                        REFER & EARN CASHOUT
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 17,
                        fontWeight: '800',
                      }}
                    >
                      Withdraw Referral Commissions
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowWithdrawModal(false)}
                    style={{ padding: 4 }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Withdrawable Referral Balance Card */}
                <View
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: isDarkMode
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#34D399',
                        fontWeight: '800',
                        letterSpacing: 0.5,
                      }}
                    >
                      WITHDRAWABLE REFERRAL EARNINGS
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.textMuted,
                        fontWeight: '600',
                      }}
                    >
                      Min Payout: ₹50
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '900',
                      color: colors.textPrimary,
                      marginVertical: 4,
                    }}
                  >
                    ₹{' '}
                    {(stats?.withdrawableBalance !== undefined
                      ? stats.withdrawableBalance
                      : 0
                    ).toLocaleString('en-IN')}
                  </Text>
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: isDarkMode
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                      paddingTop: 6,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>
                      Course Top-up Balance (Non-withdrawable):
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.textPrimary,
                      }}
                    >
                      ₹ {(stats?.purchaseBalance || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Explanatory Financial Notice */}
                <View
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: isDarkMode
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 11, color: '#60A5FA', lineHeight: 15 }}
                  >
                    💡 <Text style={{ fontWeight: '700' }}>Note:</Text> Aap sirf{' '}
                    <Text style={{ fontWeight: '700' }}>Refer & Earn</Text> aur
                    MLM network se kamaya hua commission Bank ya UPI me withdraw
                    kar sakte hain. Course purchase ke liye add kiya gaya
                    balance course buy karne ke liye use hota hai.
                  </Text>
                </View>

                {!!withdrawSuccessMsg && (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#10B981',
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {withdrawSuccessMsg}
                    </Text>
                  </View>
                )}

                {!!withdrawErrorMsg && (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#F43F5E',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      ⚠️ {withdrawErrorMsg}
                    </Text>
                  </View>
                )}

                {/* Amount Input */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.textSecondary,
                      marginBottom: 6,
                    }}
                  >
                    Enter Referral Amount to Withdraw (₹) *
                  </Text>

                  <View
                    style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}
                  >
                    {['50', '100', '500', '1000'].map(amt => {
                      const disabled =
                        (stats?.withdrawableBalance || 0) < Number(amt);
                      const isSelected = withdrawAmountInput === amt;
                      return (
                        <TouchableOpacity
                          key={amt}
                          onPress={() => setWithdrawAmountInput(amt)}
                          disabled={disabled}
                          style={{
                            flex: 1,
                            backgroundColor: isSelected
                              ? '#10B981'
                              : colors.inputBg,
                            paddingVertical: 7,
                            borderRadius: 6,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: isSelected
                              ? '#10B981'
                              : colors.cardBorder,
                            opacity: disabled ? 0.35 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected
                                ? '#FFFFFF'
                                : colors.textPrimary,
                              fontWeight: '700',
                              fontSize: 11,
                            }}
                          >
                            ₹{amt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      onPress={() =>
                        setWithdrawAmountInput(
                          String(stats?.withdrawableBalance || 0),
                        )
                      }
                      disabled={(stats?.withdrawableBalance || 0) < 50}
                      style={{
                        flex: 1,
                        backgroundColor: colors.inputBg,
                        paddingVertical: 7,
                        borderRadius: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        opacity:
                          (stats?.withdrawableBalance || 0) < 50 ? 0.35 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontWeight: '800',
                          fontSize: 11,
                        }}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    value={withdrawAmountInput}
                    onChangeText={setWithdrawAmountInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 500"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 8,
                      padding: 10,
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                  />
                </View>

                {/* Payout Destination Selector */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.textSecondary,
                      marginBottom: 6,
                    }}
                  >
                    Select Payout Destination *
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setPayoutMethod('BANK')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        backgroundColor:
                          payoutMethod === 'BANK'
                            ? isDarkMode
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'rgba(99, 102, 241, 0.12)'
                            : colors.inputBg,
                        borderWidth: payoutMethod === 'BANK' ? 2 : 1,
                        borderColor:
                          payoutMethod === 'BANK'
                            ? '#6366F1'
                            : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            payoutMethod === 'BANK'
                              ? '#6366F1'
                              : colors.textSecondary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        🏦 Bank Transfer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPayoutMethod('UPI')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        backgroundColor:
                          payoutMethod === 'UPI'
                            ? isDarkMode
                              ? 'rgba(16, 185, 129, 0.25)'
                              : 'rgba(16, 185, 129, 0.12)'
                            : colors.inputBg,
                        borderWidth: payoutMethod === 'UPI' ? 2 : 1,
                        borderColor:
                          payoutMethod === 'UPI'
                            ? '#10B981'
                            : colors.cardBorder,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            payoutMethod === 'UPI'
                              ? '#10B981'
                              : colors.textSecondary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        📱 Instant UPI ID
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bank Inputs */}
                {payoutMethod === 'BANK' && (
                  <View
                    style={{
                      backgroundColor: colors.itemSubCard,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        Account Holder Name *
                      </Text>
                      <TextInput
                        value={bankAccountHolder}
                        onChangeText={setBankAccountHolder}
                        placeholder="Name on Passbook"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        Bank Name
                      </Text>
                      <TextInput
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="e.g. SBI, HDFC, ICICI"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        Account Number *
                      </Text>
                      <TextInput
                        value={bankAccountNumber}
                        onChangeText={setBankAccountNumber}
                        keyboardType="number-pad"
                        placeholder="Enter Account Number"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        Confirm Account Number *
                      </Text>
                      <TextInput
                        value={bankAccountConfirm}
                        onChangeText={setBankAccountConfirm}
                        keyboardType="number-pad"
                        placeholder="Re-enter Account Number"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        IFSC Code * (11 Alphanumeric)
                      </Text>
                      <TextInput
                        value={bankIfscCode}
                        onChangeText={t => setBankIfscCode(t.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={11}
                        placeholder="e.g. HDFC0001234"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                          letterSpacing: 1,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* UPI Inputs */}
                {payoutMethod === 'UPI' && (
                  <View
                    style={{
                      backgroundColor: colors.itemSubCard,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        UPI ID / VPA *
                      </Text>
                      <TextInput
                        value={upiIdInput}
                        onChangeText={setUpiIdInput}
                        autoCapitalize="none"
                        placeholder="username@okhdfcbank or mobile@upi"
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>

                    <View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: colors.textMuted,
                          marginBottom: 2,
                        }}
                      >
                        Registered Name on UPI
                      </Text>
                      <TextInput
                        value={upiNameInput}
                        onChangeText={setUpiNameInput}
                        placeholder={user?.name || 'Your Full Name'}
                        placeholderTextColor="#94A3B8"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 6,
                          padding: 8,
                          fontSize: 12,
                          color: colors.textPrimary,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Save As Default Checkbox */}
                <TouchableOpacity
                  onPress={() => setSaveAsDefaultPayout(!saveAsDefaultPayout)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: saveAsDefaultPayout
                        ? '#10B981'
                        : colors.cardBorder,
                      backgroundColor: saveAsDefaultPayout
                        ? '#10B981'
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {saveAsDefaultPayout && (
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '900',
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Save as default withdrawal method for next time
                  </Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowWithdrawModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.inputBg,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWithdrawSubmit}
                    disabled={isSubmittingWithdraw}
                    style={{
                      flex: 1.5,
                      backgroundColor: '#10B981',
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    {isSubmittingWithdraw ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontWeight: '800',
                          fontSize: 13,
                        }}
                      >
                        Submit Request
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* POPUP SCREEN: CENTRAL LEVEL VS STATE LEVEL ONBOARDING / SCOPE MODAL */}
        <Modal visible={showLevelModal} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                maxHeight: '90%',
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Top Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: '#6366F1',
                          fontSize: 10,
                          fontWeight: '800',
                        }}
                      >
                        {levelModalTab === 'CHOOSE_STATE'
                          ? 'STEP 2 OF 2: STATE SELECTION'
                          : 'EXAM SCOPE & CURRICULUM'}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 18,
                        fontWeight: '900',
                      }}
                    >
                      {levelModalTab === 'CHOOSE_STATE'
                        ? 'Select Your Target State'
                        : 'Choose Your Learning Level'}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {levelModalTab === 'CHOOSE_STATE'
                        ? 'Pick your state to view state education boards & civil exam batches'
                        : 'Explore All India national exams or your state-specific syllabus'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowLevelModal(false)}
                    style={{ padding: 4 }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 18,
                        fontWeight: '800',
                      }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                {levelModalTab === 'CHOOSE_LEVEL' ? (
                  <View style={{ gap: 14 }}>
                    {/* OPTION 1: CENTRAL LEVEL (All India Exams) */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedExamLevel('CENTRAL');
                        setSelectedState(null);
                        setShowLevelModal(false);
                        setFilterMode('EXPLORE_ALL');
                      }}
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        backgroundColor: isDarkMode
                          ? 'rgba(99, 102, 241, 0.12)'
                          : 'rgba(99, 102, 241, 0.08)',
                        borderWidth: 1.5,
                        borderColor: '#6366F1',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text style={{ fontSize: 24 }}>🏛️</Text>
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 16,
                              fontWeight: '800',
                            }}
                          >
                            Central Level (All India)
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: '#6366F1',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 9,
                              fontWeight: '800',
                            }}
                          >
                            PAN INDIA
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          lineHeight: 16,
                          marginBottom: 10,
                        }}
                      >
                        National entrance exams, central civil services, defense
                        and banking curricula.
                      </Text>

                      <View
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.04)'
                            : '#F8FAFC',
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: '#6366F1',
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          Popular Batches Included:
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 11,
                            marginTop: 4,
                            lineHeight: 16,
                          }}
                        >
                          • NEET UG/PG, IIT JEE (Main & Adv), CUET{'\n'}• UPSC
                          CSE, SSC (CGL/CHSL), Banking (IBPS/SBI){'\n'}• Defence
                          (NDA/CDS/AFCAT), Railways (RRB), GATE
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: '#6366F1',
                          borderRadius: 8,
                          paddingVertical: 9,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: '800',
                          }}
                        >
                          Explore Central Courses →
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* OPTION 2: STATE LEVEL (State Boards & State Exams) */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setLevelModalTab('CHOOSE_STATE')}
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        backgroundColor: isDarkMode
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(16, 185, 129, 0.08)',
                        borderWidth: 1.5,
                        borderColor: '#10B981',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Text style={{ fontSize: 24 }}>🗺️</Text>
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 16,
                              fontWeight: '800',
                            }}
                          >
                            State Level (State Exams)
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: '#10B981',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 9,
                              fontWeight: '800',
                            }}
                          >
                            STATE SPECIFIC
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          lineHeight: 16,
                          marginBottom: 10,
                        }}
                      >
                        State secondary boards, state civil services (PSC),
                        police recruitment & teacher eligibility.
                      </Text>

                      <View
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255,255,255,0.04)'
                            : '#F8FAFC',
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: '#10B981',
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          Select From Indian States:
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 11,
                            marginTop: 4,
                            lineHeight: 16,
                          }}
                        >
                          • Uttar Pradesh (UP Board, UPPCS, Police){'\n'}• Bihar
                          (BSEB, BPSC, Bihar SI, Teacher){'\n'}• Rajasthan, MP,
                          Maharashtra, Delhi NCR & More
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: '#10B981',
                          borderRadius: 8,
                          paddingVertical: 9,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: '800',
                          }}
                        >
                          Select Your State (UP, Bihar, etc.) ❯
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* OPTION 3: EXPLORE ALL */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedExamLevel('ALL');
                        setSelectedState(null);
                        setShowLevelModal(false);
                      }}
                      style={{
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderRadius: 10,
                        backgroundColor: colors.itemSubCard,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        🌐 Skip & View All Platform Batches
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* STATE SELECTION SCREEN */
                  <View>
                    <TouchableOpacity
                      onPress={() => setLevelModalTab('CHOOSE_LEVEL')}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 12,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text
                        style={{
                          color: '#6366F1',
                          fontSize: 13,
                          fontWeight: '800',
                        }}
                      >
                        ← Back to Level Choice
                      </Text>
                    </TouchableOpacity>

                    {/* Search State Input */}
                    <TextInput
                      value={stateSearchQuery}
                      onChangeText={setStateSearchQuery}
                      placeholder="Search state (e.g. Bihar, UP, Rajasthan)..."
                      placeholderTextColor="#94A3B8"
                      style={{
                        backgroundColor: colors.inputBg,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        color: colors.textPrimary,
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    />

                    {/* States List */}
                    <View style={{ gap: 8 }}>
                      {INDIAN_STATES_DATA.filter(
                        st =>
                          st.name
                            .toLowerCase()
                            .includes(stateSearchQuery.toLowerCase()) ||
                          st.code
                            .toLowerCase()
                            .includes(stateSearchQuery.toLowerCase()) ||
                          st.popular
                            .toLowerCase()
                            .includes(stateSearchQuery.toLowerCase()),
                      ).map(st => {
                        const isSelected = selectedState?.code === st.code;
                        return (
                          <TouchableOpacity
                            key={st.code}
                            activeOpacity={0.75}
                            onPress={() => {
                              setSelectedState(st);
                              setSelectedExamLevel('STATE');
                              setShowLevelModal(false);
                              setFilterMode('EXPLORE_ALL');
                            }}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              backgroundColor: isSelected
                                ? isDarkMode
                                  ? 'rgba(16, 185, 129, 0.25)'
                                  : 'rgba(16, 185, 129, 0.12)'
                                : colors.itemSubCard,
                              borderWidth: 1.5,
                              borderColor: isSelected
                                ? '#10B981'
                                : colors.cardBorder,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Text style={{ fontSize: 14 }}>{st.icon}</Text>
                                <Text
                                  style={{
                                    color: colors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: '800',
                                  }}
                                >
                                  {st.name}
                                </Text>
                                <View
                                  style={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                    paddingHorizontal: 6,
                                    paddingVertical: 1,
                                    borderRadius: 4,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: '#6366F1',
                                      fontSize: 9,
                                      fontWeight: '800',
                                    }}
                                  >
                                    {st.code}
                                  </Text>
                                </View>
                              </View>
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                {st.popular}
                              </Text>
                            </View>

                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: isSelected
                                  ? '#10B981'
                                  : colors.inputBg,
                                borderWidth: 1,
                                borderColor: isSelected
                                  ? '#10B981'
                                  : colors.cardBorder,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : colors.textMuted,
                                  fontSize: 11,
                                  fontWeight: '900',
                                }}
                              >
                                {isSelected ? '✓' : '›'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* COURSE INSPECTION DETAILS MODAL (FULL RICH MOBILE SPECIFICATION) */}
        <Modal
          visible={!!selectedCourseDetail}
          transparent
          animationType="fade"
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              padding: 14,
            }}
          >
            {selectedCourseDetail &&
              (() => {
                const isDetailEnrolled = enrolledCourses.some(
                  e => e._id === selectedCourseDetail._id,
                );
                const totalMaterialsCount =
                  selectedCourseDetail.studyMaterials?.length ||
                  (selectedCourseDetail.ebookPdfUrl ? 1 : 0) ||
                  selectedCourseDetail.inclusions?.totalEbooks ||
                  0;
                const totalTestsCount =
                  selectedCourseDetail.mockTests?.length ||
                  selectedCourseDetail.inclusions?.totalMockTests ||
                  0;
                const totalLecturesCount =
                  selectedCourseDetail.curriculum?.length ||
                  selectedCourseDetail.inclusions?.totalLectures ||
                  40;

                return (
                  <View
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: 20,
                      padding: 18,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      maxHeight: '92%',
                    }}
                  >
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {/* Top Bar with Badges and Close button */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#818CF8',
                                fontSize: 10,
                                fontWeight: '800',
                              }}
                            >
                              🎯{' '}
                              {selectedCourseDetail.subjectName ||
                                'All Subjects'}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor:
                                selectedCourseDetail.courseMode ===
                                'LIVE_ONLINE'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(16, 185, 129, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  selectedCourseDetail.courseMode ===
                                  'LIVE_ONLINE'
                                    ? '#EF4444'
                                    : '#10B981',
                                fontSize: 10,
                                fontWeight: '800',
                              }}
                            >
                              {selectedCourseDetail.courseMode === 'LIVE_ONLINE'
                                ? '🔴 LIVE ONLINE'
                                : selectedCourseDetail.courseMode ===
                                    'RECORDED_VIDEO'
                                  ? '📹 RECORDED'
                                  : '⚡ HYBRID'}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#F59E0B',
                                fontSize: 10,
                                fontWeight: '800',
                              }}
                            >
                              State:{' '}
                              {selectedCourseDetail.stateCode || 'GLOBAL'}
                            </Text>
                          </View>
                          {isDetailEnrolled && (
                            <View
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#10B981',
                                  fontSize: 10,
                                  fontWeight: '800',
                                }}
                              >
                                ✅ ENROLLED
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => setSelectedCourseDetail(null)}
                          style={{
                            padding: 6,
                            backgroundColor: colors.inputBg,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.textMuted,
                              fontSize: 16,
                              fontWeight: '800',
                            }}
                          >
                            ✕
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Thumbnail */}
                      {selectedCourseDetail.thumbnail && (
                        <Image
                          source={{ uri: selectedCourseDetail.thumbnail }}
                          style={{
                            width: '100%',
                            height: 160,
                            borderRadius: 12,
                            marginBottom: 12,
                            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                          }}
                          resizeMode="contain"
                        />
                      )}

                      {/* Course Title & Instructor */}
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 18,
                          fontWeight: '800',
                          marginBottom: 4,
                        }}
                      >
                        {selectedCourseDetail.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 12,
                          marginBottom: 12,
                        }}
                      >
                        By{' '}
                        <Text style={{ color: '#F59E0B', fontWeight: '700' }}>
                          {selectedCourseDetail.instructor?.name ||
                            'AllianceECFaculty'}
                        </Text>{' '}
                        •{' '}
                        {selectedCourseDetail.boardOrGrade ||
                          'Comprehensive Batch'}
                      </Text>

                      {/* Description */}
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          lineHeight: 18,
                          marginBottom: 14,
                        }}
                      >
                        {selectedCourseDetail.description ||
                          'Interactive live sessions with top faculty, doubt resolution & lecture recordings.'}
                      </Text>

                      {/* 1. DELIVERABLES / PACKAGE INCLUSIONS GRID */}
                      <View
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.06)',
                          borderRadius: 14,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.2)',
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: '#10B981',
                            fontSize: 11,
                            fontWeight: '800',
                            marginBottom: 10,
                          }}
                        >
                          ✨ COURSE DELIVERABLES & INCLUSIONS
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              padding: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              minWidth: '30%',
                              flex: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#818CF8',
                                fontSize: 15,
                                fontWeight: '800',
                              }}
                            >
                              {totalLecturesCount}+
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: 9,
                                marginTop: 2,
                              }}
                            >
                              Video Lectures
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              padding: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              minWidth: '30%',
                              flex: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#F59E0B',
                                fontSize: 15,
                                fontWeight: '800',
                              }}
                            >
                              {totalMaterialsCount}+
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: 9,
                                marginTop: 2,
                              }}
                            >
                              PDFs & Notes
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              padding: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              minWidth: '30%',
                              flex: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#EC4899',
                                fontSize: 15,
                                fontWeight: '800',
                              }}
                            >
                              {totalTestsCount}+
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: 9,
                                marginTop: 2,
                              }}
                            >
                              Mock Tests
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              padding: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              minWidth: '45%',
                              flex: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#10B981',
                                fontSize: 15,
                                fontWeight: '800',
                              }}
                            >
                              {selectedCourseDetail.inclusions?.totalHours ||
                                45}
                              + hrs
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: 9,
                                marginTop: 2,
                              }}
                            >
                              Total Hours
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              padding: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              minWidth: '45%',
                              flex: 1,
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: '#06B6D4',
                                fontSize: 15,
                                fontWeight: '800',
                              }}
                            >
                              {selectedCourseDetail.inclusions
                                ?.hasLifetimeAccess
                                ? 'Lifetime'
                                : '365 Days'}
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: 9,
                                marginTop: 2,
                              }}
                            >
                              Access Validity
                            </Text>
                          </View>
                        </View>

                        {/* Perks Checklist Chips */}
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          {selectedCourseDetail.inclusions?.hasCertificate !==
                            false && (
                            <View
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#10B981',
                                  fontSize: 10,
                                  fontWeight: '700',
                                }}
                              >
                                🎓 Certificate of Completion
                              </Text>
                            </View>
                          )}
                          {selectedCourseDetail.inclusions?.hasDoubtSupport !==
                            false && (
                            <View
                              style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#818CF8',
                                  fontSize: 10,
                                  fontWeight: '700',
                                }}
                              >
                                💬 1-on-1 Faculty Doubt Support
                              </Text>
                            </View>
                          )}
                          {selectedCourseDetail.inclusions
                            ?.hasDownloadableNotes !== false && (
                            <View
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#F59E0B',
                                  fontSize: 10,
                                  fontWeight: '700',
                                }}
                              >
                                📥 Downloadable Summary Sheets
                              </Text>
                            </View>
                          )}
                          <View
                            style={{
                              backgroundColor: 'rgba(244, 63, 94, 0.12)',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#F43F5E',
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              🗺️ High-Yield Revision Maps
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 2. MULTI-DOCUMENT STUDY MATERIALS & E-BOOKS SECTION */}
                      <View
                        style={{
                          backgroundColor: colors.itemSubCard,
                          borderRadius: 14,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          marginBottom: 14,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                          }}
                        >
                          <Text
                            style={{
                              color: '#F59E0B',
                              fontSize: 12,
                              fontWeight: '800',
                            }}
                          >
                            📖 Attached Study Materials & E-Books (
                            {totalMaterialsCount})
                          </Text>
                          <Text
                            style={{ color: colors.textMuted, fontSize: 10 }}
                          >
                            {isDetailEnrolled
                              ? '✅ Instant Access'
                              : '🔒 Unlocks on Enrollment'}
                          </Text>
                        </View>

                        {selectedCourseDetail.studyMaterials &&
                        selectedCourseDetail.studyMaterials.length > 0 ? (
                          <View style={{ gap: 8 }}>
                            {selectedCourseDetail.studyMaterials.map(
                              (doc, docIdx) => {
                                const typeBadgeBg =
                                  doc.docType === 'PDF'
                                    ? '#EF4444'
                                    : doc.docType === 'DOC'
                                      ? '#3B82F6'
                                      : doc.docType === 'NOTES'
                                        ? '#F59E0B'
                                        : '#8B5CF6';

                                return (
                                  <View
                                    key={docIdx}
                                    style={{
                                      backgroundColor: colors.inputBg,
                                      borderRadius: 10,
                                      padding: 10,
                                      borderWidth: 1,
                                      borderColor: colors.cardBorder,
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 8,
                                    }}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          gap: 6,
                                          marginBottom: 4,
                                        }}
                                      >
                                        <View
                                          style={{
                                            backgroundColor: typeBadgeBg,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 4,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: '#FFFFFF',
                                              fontSize: 9,
                                              fontWeight: '800',
                                            }}
                                          >
                                            {doc.docType || 'PDF'}
                                          </Text>
                                        </View>
                                        <Text
                                          style={{
                                            color: '#818CF8',
                                            fontSize: 10,
                                            fontWeight: '700',
                                          }}
                                        >
                                          #{doc.topic || 'General'}
                                        </Text>
                                      </View>
                                      <Text
                                        style={{
                                          color: colors.textPrimary,
                                          fontSize: 12,
                                          fontWeight: '700',
                                        }}
                                      >
                                        {doc.title}
                                      </Text>
                                    </View>

                                    {isDetailEnrolled ? (
                                      <TouchableOpacity
                                        onPress={() =>
                                          Linking.openURL(doc.fileUrl)
                                        }
                                        style={{
                                          backgroundColor:
                                            'rgba(245, 158, 11, 0.15)',
                                          borderWidth: 1,
                                          borderColor: '#F59E0B',
                                          paddingHorizontal: 10,
                                          paddingVertical: 6,
                                          borderRadius: 6,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: '#F59E0B',
                                            fontSize: 11,
                                            fontWeight: '700',
                                          }}
                                        >
                                          📥 Open
                                        </Text>
                                      </TouchableOpacity>
                                    ) : (
                                      <TouchableOpacity
                                        onPress={() =>
                                          handleEnrollCourse(
                                            selectedCourseDetail,
                                          )
                                        }
                                        style={{
                                          backgroundColor: colors.itemSubCard,
                                          borderWidth: 1,
                                          borderColor: colors.cardBorder,
                                          paddingHorizontal: 10,
                                          paddingVertical: 6,
                                          borderRadius: 6,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: colors.textMuted,
                                            fontSize: 10,
                                            fontWeight: '700',
                                          }}
                                        >
                                          🔒 Unlock
                                        </Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                );
                              },
                            )}
                          </View>
                        ) : selectedCourseDetail.ebookTitle ||
                          selectedCourseDetail.ebookPdfUrl ? (
                          <View
                            style={{
                              backgroundColor: colors.inputBg,
                              borderRadius: 10,
                              padding: 10,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: colors.textPrimary,
                                  fontSize: 12,
                                  fontWeight: '700',
                                }}
                              >
                                {selectedCourseDetail.ebookTitle ||
                                  'Comprehensive Study Notes & Summary Guide'}
                              </Text>
                              <Text
                                style={{
                                  color: '#F59E0B',
                                  fontSize: 10,
                                  marginTop: 2,
                                }}
                              >
                                PDF E-Book
                              </Text>
                            </View>
                            {isDetailEnrolled &&
                            selectedCourseDetail.ebookPdfUrl ? (
                              <TouchableOpacity
                                onPress={() =>
                                  Linking.openURL(
                                    selectedCourseDetail.ebookPdfUrl!,
                                  )
                                }
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  borderWidth: 1,
                                  borderColor: '#F59E0B',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#F59E0B',
                                    fontSize: 11,
                                    fontWeight: '700',
                                  }}
                                >
                                  📥 Open PDF
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <Text
                                style={{
                                  color: colors.textMuted,
                                  fontSize: 10,
                                }}
                              >
                                🔒 Enrolled only
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text
                            style={{
                              color: colors.textMuted,
                              fontSize: 11,
                              textAlign: 'center',
                              paddingVertical: 8,
                            }}
                          >
                            Curated class notes and lecture handouts are
                            provided during sessions.
                          </Text>
                        )}
                      </View>

                      {/* 3. TOPIC-WISE MOCK TESTS & QUIZZES SECTION */}
                      {selectedCourseDetail.mockTests &&
                        selectedCourseDetail.mockTests.length > 0 && (
                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              borderRadius: 14,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              marginBottom: 14,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#EC4899',
                                  fontSize: 12,
                                  fontWeight: '800',
                                }}
                              >
                                📝 Topic-Wise Mock Tests (
                                {selectedCourseDetail.mockTests.length})
                              </Text>
                              <Text
                                style={{
                                  color: colors.textMuted,
                                  fontSize: 10,
                                }}
                              >
                                Chapter practice papers
                              </Text>
                            </View>

                            <View style={{ gap: 8 }}>
                              {selectedCourseDetail.mockTests.map(
                                (test, tIdx) => {
                                  const isExpanded =
                                    expandedMobileTestIdx === tIdx;
                                  const hasQuestions =
                                    test.questions && test.questions.length > 0;

                                  return (
                                    <View
                                      key={tIdx}
                                      style={{
                                        backgroundColor: colors.inputBg,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: colors.cardBorder,
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <View
                                        style={{
                                          padding: 10,
                                          flexDirection: 'row',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: 8,
                                        }}
                                      >
                                        <View style={{ flex: 1 }}>
                                          <Text
                                            style={{
                                              color: colors.textPrimary,
                                              fontSize: 12,
                                              fontWeight: '700',
                                            }}
                                          >
                                            {test.title}
                                          </Text>
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              flexWrap: 'wrap',
                                              gap: 6,
                                              marginTop: 4,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: '#EC4899',
                                                fontSize: 10,
                                                fontWeight: '700',
                                              }}
                                            >
                                              #{test.topic || 'General'}
                                            </Text>
                                            <Text
                                              style={{
                                                color: colors.textMuted,
                                                fontSize: 10,
                                              }}
                                            >
                                              ⏱️ {test.durationMinutes || 30}m
                                            </Text>
                                            <Text
                                              style={{
                                                color: colors.textMuted,
                                                fontSize: 10,
                                              }}
                                            >
                                              ❓{' '}
                                              {test.questions &&
                                              test.questions.length > 0
                                                ? test.questions.length
                                                : test.totalQuestions ||
                                                  10}{' '}
                                              Qs
                                            </Text>
                                          </View>
                                        </View>

                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            gap: 6,
                                            alignItems: 'center',
                                          }}
                                        >
                                          {test.testUrl && (
                                            <TouchableOpacity
                                              onPress={() =>
                                                Linking.openURL(test.testUrl!)
                                              }
                                              style={{
                                                backgroundColor:
                                                  'rgba(59, 130, 246, 0.15)',
                                                borderWidth: 1,
                                                borderColor: '#3B82F6',
                                                paddingHorizontal: 8,
                                                paddingVertical: 5,
                                                borderRadius: 6,
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  color: '#3B82F6',
                                                  fontSize: 10,
                                                  fontWeight: '700',
                                                }}
                                              >
                                                🌐 Test
                                              </Text>
                                            </TouchableOpacity>
                                          )}

                                          {hasQuestions && (
                                            <TouchableOpacity
                                              onPress={() =>
                                                setExpandedMobileTestIdx(
                                                  isExpanded ? null : tIdx,
                                                )
                                              }
                                              style={{
                                                backgroundColor:
                                                  colors.itemSubCard,
                                                borderWidth: 1,
                                                borderColor: colors.cardBorder,
                                                paddingHorizontal: 8,
                                                paddingVertical: 5,
                                                borderRadius: 6,
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  color: colors.textPrimary,
                                                  fontSize: 10,
                                                  fontWeight: '700',
                                                }}
                                              >
                                                {isExpanded
                                                  ? '▲ Hide'
                                                  : `▼ Qs (${test.questions?.length})`}
                                              </Text>
                                            </TouchableOpacity>
                                          )}
                                        </View>
                                      </View>

                                      {/* Expandable Questions Preview */}
                                      {isExpanded && hasQuestions && (
                                        <View
                                          style={{
                                            borderTopWidth: 1,
                                            borderTopColor: colors.cardBorder,
                                            padding: 10,
                                            backgroundColor: colors.itemSubCard,
                                            gap: 8,
                                          }}
                                        >
                                          {test.questions!.map((q, qIdx) => {
                                            const letters = [
                                              'A',
                                              'B',
                                              'C',
                                              'D',
                                            ];
                                            return (
                                              <View
                                                key={qIdx}
                                                style={{
                                                  backgroundColor:
                                                    colors.inputBg,
                                                  borderRadius: 8,
                                                  padding: 8,
                                                  borderWidth: 1,
                                                  borderColor:
                                                    colors.cardBorder,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: colors.textPrimary,
                                                    fontSize: 11,
                                                    fontWeight: '700',
                                                    marginBottom: 4,
                                                  }}
                                                >
                                                  Q{qIdx + 1}. {q.questionText}
                                                </Text>
                                                <View style={{ gap: 4 }}>
                                                  {q.options.map(
                                                    (opt, optIdx) => {
                                                      const isCorrect =
                                                        isDetailEnrolled &&
                                                        (q.correctOption ===
                                                          optIdx ||
                                                          Number(
                                                            q.correctOption,
                                                          ) === optIdx);
                                                      return (
                                                        <View
                                                          key={optIdx}
                                                          style={{
                                                            backgroundColor:
                                                              isCorrect
                                                                ? 'rgba(16, 185, 129, 0.15)'
                                                                : colors.itemSubCard,
                                                            borderWidth: 1,
                                                            borderColor:
                                                              isCorrect
                                                                ? '#10B981'
                                                                : colors.cardBorder,
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 3,
                                                            borderRadius: 4,
                                                          }}
                                                        >
                                                          <Text
                                                            style={{
                                                              color: isCorrect
                                                                ? '#10B981'
                                                                : colors.textSecondary,
                                                              fontSize: 10,
                                                              fontWeight:
                                                                isCorrect
                                                                  ? '700'
                                                                  : '400',
                                                            }}
                                                          >
                                                            {letters[optIdx]}.{' '}
                                                            {opt}{' '}
                                                            {isCorrect
                                                              ? '✓'
                                                              : ''}
                                                          </Text>
                                                        </View>
                                                      );
                                                    },
                                                  )}
                                                </View>
                                                {isDetailEnrolled &&
                                                  q.explanation && (
                                                    <Text
                                                      style={{
                                                        color: colors.textMuted,
                                                        fontSize: 9,
                                                        marginTop: 4,
                                                        fontStyle: 'italic',
                                                      }}
                                                    >
                                                      💡 {q.explanation}
                                                    </Text>
                                                  )}
                                                {!isDetailEnrolled && (
                                                  <Text
                                                    style={{
                                                      color: colors.textMuted,
                                                      fontSize: 9,
                                                      marginTop: 4,
                                                    }}
                                                  >
                                                    🔒 Enroll to view answer
                                                    keys & solutions
                                                  </Text>
                                                )}
                                              </View>
                                            );
                                          })}
                                        </View>
                                      )}
                                    </View>
                                  );
                                },
                              )}
                            </View>
                          </View>
                        )}

                      {/* 4. SYLLABUS TOPICS COVERED */}
                      {selectedCourseDetail.syllabusTopics &&
                        selectedCourseDetail.syllabusTopics.length > 0 && (
                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              borderRadius: 14,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              marginBottom: 14,
                            }}
                          >
                            <Text
                              style={{
                                color: '#818CF8',
                                fontSize: 11,
                                fontWeight: '800',
                                marginBottom: 8,
                              }}
                            >
                              📚 Syllabus Topics Covered (
                              {selectedCourseDetail.syllabusTopics.length})
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              {selectedCourseDetail.syllabusTopics.map(
                                (topic, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor:
                                        'rgba(99, 102, 241, 0.12)',
                                      borderWidth: 1,
                                      borderColor: 'rgba(99, 102, 241, 0.25)',
                                      paddingHorizontal: 8,
                                      paddingVertical: 3,
                                      borderRadius: 20,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: '#A5B4FC',
                                        fontSize: 10,
                                        fontWeight: '600',
                                      }}
                                    >
                                      #{topic}
                                    </Text>
                                  </View>
                                ),
                              )}
                            </View>
                          </View>
                        )}

                      {/* 5. LIVE SCHEDULE & CLASSROOM ACCESS */}
                      <View
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: 'rgba(16, 185, 129, 0.2)',
                          marginBottom: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: '#10B981',
                            fontSize: 11,
                            fontWeight: '800',
                            marginBottom: 6,
                          }}
                        >
                          🔴 LIVE CLASSROOM & VIDEO VAULT
                        </Text>
                        {selectedCourseDetail.liveSchedule && (
                          <Text
                            style={{
                              color: '#10B981',
                              fontSize: 11,
                              fontWeight: '700',
                              marginBottom: 8,
                            }}
                          >
                            ⏰ Class Timing: {selectedCourseDetail.liveSchedule}
                          </Text>
                        )}

                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          {isDetailEnrolled ? (
                            <>
                              <TouchableOpacity
                                onPress={() =>
                                  Linking.openURL(
                                    selectedCourseDetail.liveMeetingUrl ||
                                      'https://meet.google.com/eduverse-live-class',
                                  )
                                }
                                style={{
                                  backgroundColor: '#10B981',
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flex: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#FFFFFF',
                                    fontSize: 12,
                                    fontWeight: '800',
                                  }}
                                >
                                  🔴 Join Live Class
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() =>
                                  Linking.openURL(
                                    selectedCourseDetail.lectureVideoUrl ||
                                      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                  )
                                }
                                style={{
                                  backgroundColor: '#6366F1',
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flex: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    color: '#FFFFFF',
                                    fontSize: 12,
                                    fontWeight: '700',
                                  }}
                                >
                                  📹 Recorded Videos
                                </Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <Text
                              style={{ color: colors.textMuted, fontSize: 11 }}
                            >
                              🔒 Live meeting link & lecture recordings unlock
                              upon course enrollment.
                            </Text>
                          )}

                          {selectedCourseDetail.demoVideoUrl && (
                            <TouchableOpacity
                              onPress={() =>
                                Linking.openURL(
                                  selectedCourseDetail.demoVideoUrl!,
                                )
                              }
                              style={{
                                backgroundColor: colors.inputBg,
                                borderWidth: 1,
                                borderColor: colors.cardBorder,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                width: '100%',
                                alignItems: 'center',
                                marginTop: 4,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.textPrimary,
                                  fontSize: 11,
                                  fontWeight: '700',
                                }}
                              >
                                🎬 Watch Demo Video
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* 6. CURRICULUM BREAKDOWN */}
                      {selectedCourseDetail.curriculum &&
                        selectedCourseDetail.curriculum.length > 0 && (
                          <View
                            style={{
                              backgroundColor: colors.itemSubCard,
                              borderRadius: 14,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: colors.cardBorder,
                              marginBottom: 14,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.textPrimary,
                                fontSize: 11,
                                fontWeight: '800',
                                marginBottom: 8,
                              }}
                            >
                              📑 Course Curriculum Breakdown (
                              {selectedCourseDetail.curriculum.length} Chapters)
                            </Text>
                            <View style={{ gap: 6 }}>
                              {selectedCourseDetail.curriculum.map(
                                (mod, idx) => (
                                  <View
                                    key={idx}
                                    style={{
                                      backgroundColor: colors.inputBg,
                                      padding: 8,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: colors.cardBorder,
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={{
                                          color: colors.textPrimary,
                                          fontSize: 11,
                                          fontWeight: '700',
                                        }}
                                      >
                                        Chapter {idx + 1}: {mod.title}
                                      </Text>
                                      {mod.description && (
                                        <Text
                                          style={{
                                            color: colors.textMuted,
                                            fontSize: 10,
                                            marginTop: 2,
                                          }}
                                        >
                                          {mod.description}
                                        </Text>
                                      )}
                                    </View>
                                    <Text
                                      style={{
                                        color: '#818CF8',
                                        fontSize: 10,
                                        fontWeight: '700',
                                        marginLeft: 6,
                                      }}
                                    >
                                      {mod.lectureCount || 1} Lecs •{' '}
                                      {mod.durationMinutes || 45}m
                                    </Text>
                                  </View>
                                ),
                              )}
                            </View>
                          </View>
                        )}

                      {/* 7. BOTTOM PRICING & ACTION BAR */}
                      <View
                        style={{
                          backgroundColor: colors.inputBg,
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          marginBottom: 10,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View>
                          <Text
                            style={{ color: colors.textMuted, fontSize: 10 }}
                          >
                            Total Batch Fee
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'baseline',
                              gap: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: '#10B981',
                                fontSize: 20,
                                fontWeight: '800',
                              }}
                            >
                              ₹{selectedCourseDetail.price}
                            </Text>
                            {selectedCourseDetail.originalPrice &&
                              selectedCourseDetail.originalPrice >
                                selectedCourseDetail.price && (
                                <Text
                                  style={{
                                    color: colors.textMuted,
                                    fontSize: 12,
                                    textDecorationLine: 'line-through',
                                  }}
                                >
                                  ₹{selectedCourseDetail.originalPrice}
                                </Text>
                              )}
                          </View>
                        </View>

                        {isDetailEnrolled ? (
                          <View
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <Text
                              style={{
                                color: '#10B981',
                                fontSize: 11,
                                fontWeight: '800',
                              }}
                            >
                              ✅ ALREADY ENROLLED
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              handleEnrollCourse(selectedCourseDetail);
                              setSelectedCourseDetail(null);
                            }}
                            style={{
                              backgroundColor: '#6366F1',
                              paddingHorizontal: 18,
                              paddingVertical: 10,
                              borderRadius: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontWeight: '800',
                              }}
                            >
                              1-Click Enroll
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => setSelectedCourseDetail(null)}
                        style={{
                          backgroundColor: colors.itemSubCard,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontWeight: '800',
                            fontSize: 13,
                          }}
                        >
                          Close Details
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                );
              })()}
          </View>
        </Modal>
      </ScrollView>

      {/* ACTIVE VIDEO AD POPUP MODAL */}
      <Modal visible={!!activeVideoModalAd} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          {activeVideoModalAd && (
            <View
              style={{
                width: '100%',
                maxWidth: 420,
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.cardBorder,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: '#EC4899',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      🎬 SPONSORED VIDEO
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: '800',
                      maxWidth: 180,
                    }}
                    numberOfLines={1}
                  >
                    {activeVideoModalAd.title}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setActiveVideoModalAd(null)}
                  style={{
                    backgroundColor: colors.inputBg,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      fontWeight: '800',
                    }}
                  >
                    ✕ Close
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Video Media Banner & Play Area */}
              <View
                style={{
                  height: 200,
                  backgroundColor: '#0F172A',
                  position: 'relative',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{ uri: activeVideoModalAd.mediaUrl }}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                    opacity: 0.7,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Linking.openURL(activeVideoModalAd.mediaUrl).catch(() => {
                      Alert.alert(
                        'Video Link',
                        'Opening video stream: ' + activeVideoModalAd.mediaUrl,
                      );
                    });
                  }}
                  style={{
                    position: 'absolute',
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#EC4899',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#EC4899',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{ color: '#FFFFFF', fontSize: 24, marginLeft: 4 }}
                  >
                    ▶
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content & Action Buttons */}
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '800',
                    marginBottom: 6,
                  }}
                >
                  {activeVideoModalAd.title}
                </Text>

                {activeVideoModalAd.description ? (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 18,
                      marginBottom: 16,
                    }}
                  >
                    {activeVideoModalAd.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL(activeVideoModalAd.mediaUrl).catch(() => {
                        Alert.alert(
                          'Video Stream',
                          'Cannot open video stream.',
                        );
                      });
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#EC4899',
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '800',
                      }}
                    >
                      ▶ Play Full Video
                    </Text>
                  </TouchableOpacity>

                  {activeVideoModalAd.targetUrl ? (
                    <TouchableOpacity
                      onPress={() => {
                        Linking.openURL(activeVideoModalAd.targetUrl!).catch(
                          () => {
                            Alert.alert(
                              'Link Error',
                              'Cannot open target URL.',
                            );
                          },
                        );
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#6366F1',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: '800',
                        }}
                      >
                        Visit Link ↗
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* PHONEPE-STYLE FIXED BOTTOM NAVIGATION BAR */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.cardBg,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDarkMode ? 0.35 : 0.08,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        {/* 1. Home / Explore */}
        <TouchableOpacity
          onPress={() => setActiveTab('BROWSE')}
          style={{ alignItems: 'center', minWidth: 50 }}
        >
          <Text style={{ fontSize: 20 }}>🏠</Text>
          <Text
            style={{
              color: activeTab === 'BROWSE' ? '#6366F1' : colors.textSecondary,
              fontSize: 10,
              fontWeight: activeTab === 'BROWSE' ? '800' : '600',
              marginTop: 2,
            }}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. My Classroom */}
        <TouchableOpacity
          onPress={() => setActiveTab('MY_CLASSES')}
          style={{ alignItems: 'center', minWidth: 50 }}
        >
          <Text style={{ fontSize: 20 }}>🎓</Text>
          <Text
            style={{
              color:
                activeTab === 'MY_CLASSES' ? '#6366F1' : colors.textSecondary,
              fontSize: 10,
              fontWeight: activeTab === 'MY_CLASSES' ? '800' : '600',
              marginTop: 2,
            }}
          >
            Classes
          </Text>
        </TouchableOpacity>

        {/* 3. Center Elevated PhonePe Glow Button: MLM Referrals */}
        <TouchableOpacity
          onPress={() => setActiveTab('MLM_NETWORK')}
          activeOpacity={0.85}
          style={{
            marginTop: -24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#6366F1',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3.5,
            borderColor: colors.cardBg,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 24 }}>🤝</Text>
        </TouchableOpacity>

        {/* 4. Quizzes */}
        <TouchableOpacity
          onPress={() => setActiveTab('QUIZ')}
          style={{ alignItems: 'center', minWidth: 50 }}
        >
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text
            style={{
              color: activeTab === 'QUIZ' ? '#F59E0B' : colors.textSecondary,
              fontSize: 10,
              fontWeight: activeTab === 'QUIZ' ? '800' : '600',
              marginTop: 2,
            }}
          >
            Tests
          </Text>
        </TouchableOpacity>

        {/* 5. Wallet */}
        <TouchableOpacity
          onPress={() => setActiveTab('WALLET')}
          style={{ alignItems: 'center', minWidth: 50 }}
        >
          <Text style={{ fontSize: 20 }}>💳</Text>
          <Text
            style={{
              color: activeTab === 'WALLET' ? '#10B981' : colors.textSecondary,
              fontSize: 10,
              fontWeight: activeTab === 'WALLET' ? '800' : '600',
              marginTop: 2,
            }}
          >
            Wallet
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
