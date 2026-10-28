import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Video,
  Radio,
  PlusCircle,
  Target,
  Share2,
  Megaphone,
  Lock,
  CheckCircle,
  ExternalLink,
  Play,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  QrCode,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Building2,
  Smartphone,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StudentPreferenceModal } from "../StudentPreferenceModal";
import { AffiliateMlmPortal } from "./AffiliateMlmPortal";
import {
  fetchPayoutProfile,
  requestWithdrawal,
  fetchMyWithdrawals,
  cancelMyWithdrawal,
  WithdrawalRequestRecord,
  PayoutProfile,
} from "../../services/withdrawalService";
import {
  fetchStudentDashboardStats,
  fetchMyEnrolledCourses,
  fetchBrowseCourses,
  enrollCourse,
  topUpStudentWallet,
  submitStudentQuiz,
  submitStudentKyc,
  fetchStudentPracticeMcqs,
  StudentStats,
  QuizAttemptResult,
  QuizSetGroup,
} from "../../services/studentService";
import { McqRecord } from "../../services/teacherService";
import { CourseRecord } from "../../services/adminService";
import { fetchActiveAds, AdRecord } from "../../services/adService";
import { CourseRichContentViewer } from "../CourseRichContentViewer";
import { RevenueStatement } from "../RevenueStatement";

export interface EnrolledStudyDoc {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  boardOrGrade?: string;
  subjectName?: string;
  title: string;
  fileUrl: string;
  docType: "PDF" | "DOC" | "NOTES" | "EBOOK";
  topic?: string;
  isPrimaryEbook: boolean;
}

// PROMOTIONAL CAROUSEL SLIDES (Muthoot Fincorp ONE Style)
export const PROMO_BANNERS = [
  {
    id: "neet_jee",
    tag: "🎯 SPECIAL ACADEMIC PASS",
    title: "NEET & JEE 2026 Master Pass",
    subTitle: "Flat 50% Early Bird Discount + All-India Live Doubt Vault",
    ctaText: "Enroll Today",
    accentColor: "#6366F1",
    badgeText: "50% OFF",
    actionKey: "FILTER_NEET",
  },
  {
    id: "mlm_refer",
    tag: "🤝 BINARY CASHBACK REWARDS",
    title: "Earn Up to ₹25,000 Daily Matching Bonus!",
    subTitle: "Share your referral code & build your 2-leg binary team",
    ctaText: "Share Link",
    accentColor: "#10B981",
    badgeText: "DAILY CAPPING",
    actionKey: "SHARE_LINK",
  },
  {
    id: "mock_test",
    tag: "⚡ ALL-INDIA MOCK TEST",
    title: "Track Your Performance & Rank Predictor",
    subTitle: "Take chapter-wise practice tests with automated scoring",
    ctaText: "Start Test",
    accentColor: "#F59E0B",
    badgeText: "FREE QUIZ",
    actionKey: "GO_QUIZ",
  },
];

// 6 CORE EDUCATIONAL VERTICALS (Muthoot Fincorp ONE 4-Column Grid Style)
export const CATEGORY_SECTIONS = [
  {
    id: "SCHOOL_K12",
    title: "I. School Education (Class 1–12)",
    icon: "🏫",
    items: [
      {
        id: "state_reg",
        name: "State Board\nMedium",
        icon: "🏫",
        filterKey: "STATE_BOARD_MEDIUM",
        badge: "Regional",
        badgeBg: "#6366F1",
      },
      {
        id: "state_eng",
        name: "State Board\nEnglish",
        icon: "🎒",
        filterKey: "STATE_BOARD_ENGLISH",
      },
      {
        id: "cbse",
        name: "CBSE Board\nClasses 1-10",
        icon: "📘",
        filterKey: "CBSE",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      { id: "icse", name: "ICSE Board\nNCERT", icon: "📗", filterKey: "ICSE" },
      {
        id: "puc_sci",
        name: "PUC Science\n(PCMB +1 & +2)",
        icon: "🔬",
        filterKey: "Science",
        badge: "Hot",
        badgeBg: "#F59E0B",
      },
      {
        id: "puc_com",
        name: "PUC Commerce\n(+1 & +2)",
        icon: "📊",
        filterKey: "Commerce",
      },
      {
        id: "puc_art",
        name: "PUC Arts\n(+1 & +2)",
        icon: "🎨",
        filterKey: "Arts",
      },
      {
        id: "k12_all",
        name: "All Classes\nMaster Pass",
        icon: "📚",
        filterKey: "SCHOOL_K12",
        badge: "New",
        badgeBg: "#06B6D4",
      },
    ],
  },
  {
    id: "COMPETITIVE_EXAMS",
    title: "II. School Entrance & Competitive Exams",
    icon: "🩺",
    items: [
      {
        id: "neet",
        name: "NEET UG\nMedical Prep",
        icon: "🩺",
        filterKey: "NEET",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      {
        id: "jee",
        name: "JEE Mains\n& Advanced",
        icon: "🚀",
        filterKey: "JEE",
        badge: "Hot",
        badgeBg: "#F59E0B",
      },
      {
        id: "navodaya",
        name: "Navodaya\nEntrance Exam",
        icon: "🏛️",
        filterKey: "NAVODAYA",
        badge: "New",
        badgeBg: "#06B6D4",
      },
      {
        id: "nts",
        name: "NTS Talent\nScholarship",
        icon: "💡",
        filterKey: "NTS",
      },
      { id: "gmat", name: "G-MAT\nAptitude", icon: "📈", filterKey: "GMAT" },
      { id: "net", name: "UGC NET\nLectureship", icon: "🎯", filterKey: "NET" },
    ],
  },
  {
    id: "STATE_GOVT_JOBS",
    title: "III. State Government Jobs Preparation",
    icon: "🏛️",
    items: [
      {
        id: "kas",
        name: "KAS / State\nPSC Civil",
        icon: "🏛️",
        filterKey: "KAS",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      { id: "sda", name: "SDA Second\nDivision", icon: "📝", filterKey: "SDA" },
      { id: "fda", name: "FDA First\nDivision", icon: "📋", filterKey: "FDA" },
      {
        id: "gpt",
        name: "GPT Primary\nTeacher",
        icon: "👨‍🏫",
        filterKey: "GPT",
        badge: "Hot",
        badgeBg: "#F59E0B",
      },
      {
        id: "police",
        name: "State Police\nSI / Constable",
        icon: "👮",
        filterKey: "Police",
        badge: "New",
        badgeBg: "#06B6D4",
      },
      {
        id: "state_all",
        name: "Other State\nExams Pass",
        icon: "💼",
        filterKey: "STATE_GOVT_JOBS",
      },
    ],
  },
  {
    id: "CENTRAL_GOVT_JOBS",
    title: "IV. Central Government Jobs Preparation",
    icon: "🏦",
    items: [
      {
        id: "banking",
        name: "Banking Exams\nIBPS & SBI",
        icon: "🏦",
        filterKey: "BANKING",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      {
        id: "rrb",
        name: "Railway Board\nRRB NTPC",
        icon: "🚆",
        filterKey: "RRB",
        badge: "Hot",
        badgeBg: "#F59E0B",
      },
      {
        id: "ias",
        name: "UPSC IAS\nCivil Services",
        icon: "🇮🇳",
        filterKey: "IAS",
        badge: "Top",
        badgeBg: "#8B5CF6",
      },
      { id: "ssc", name: "SSC CGL\n& CHSL", icon: "📑", filterKey: "SSC" },
    ],
  },
  {
    id: "TEACHER_PREP",
    title: "V. Teacher Preparation & Certifications",
    icon: "🎓",
    items: [
      {
        id: "bed",
        name: "B.Ed Bachelor\nof Education",
        icon: "🎓",
        filterKey: "BED",
      },
      {
        id: "med",
        name: "M.Ed Master\nof Education",
        icon: "📜",
        filterKey: "MED",
      },
      {
        id: "tet",
        name: "State TET\nEligibility",
        icon: "✍️",
        filterKey: "TET",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      {
        id: "ctet",
        name: "CTET Central\nEligibility",
        icon: "🏅",
        filterKey: "CTET",
        badge: "National",
        badgeBg: "#10B981",
      },
    ],
  },
  {
    id: "HIGHER_EDU",
    title: "VI. Higher Education – UG & PG Degrees",
    icon: "📚",
    items: [
      {
        id: "mba",
        name: "MBA Business\nAdministration",
        icon: "💼",
        filterKey: "MBA",
        badge: "Popular",
        badgeBg: "#EC4899",
      },
      {
        id: "mcom",
        name: "M.Com Master\nof Commerce",
        icon: "📊",
        filterKey: "MCOM",
      },
      {
        id: "msc",
        name: "M.Sc Master\nof Science",
        icon: "🔬",
        filterKey: "MSC",
      },
      { id: "ma", name: "M.A Master\nof Arts", icon: "📖", filterKey: "MA" },
    ],
  },
];

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "MY_CLASSES"
    | "BROWSE"
    | "EBOOKS"
    | "QUIZ"
    | "WALLET"
    | "PURCHASES"
    | "KYC"
    | "MLM_NETWORK"
  >("BROWSE");
  const [activeBannerIndex, setActiveBannerIndex] = useState<number>(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>(
    "All Platform Courses",
  );
  const [courseSearchQuery, setCourseSearchQuery] = useState("");

  // Broadcast System Announcement State
  const [systemAnnouncement, setSystemAnnouncement] = useState(() => {
    return (
      localStorage.getItem("eduverse_system_announcement") ||
      "🎉 Special Cashback offer on NEET & K12 Master Pass! Enroll today!"
    );
  });

  useEffect(() => {
    const handleStorage = () => {
      const updated = localStorage.getItem("eduverse_system_announcement");
      if (updated) setSystemAnnouncement(updated);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Dynamic Advertisements State
  const [activeAds, setActiveAds] = useState<AdRecord[]>([]);
  const [currentAdIdx, setCurrentAdIdx] = useState<number>(0);
  const [activeVideoAdModal, setActiveVideoAdModal] = useState<AdRecord | null>(
    null,
  );

  const loadActiveAds = async () => {
    try {
      const res = await fetchActiveAds();
      if (res.success && res.data) {
        setActiveAds(res.data.ads || []);
      }
    } catch (err) {
      console.error("Failed to load active ads", err);
    }
  };

  // Auto-rotate promotional carousel banners
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleBannerPress = (banner: (typeof PROMO_BANNERS)[0]) => {
    if (banner.actionKey === "FILTER_NEET") {
      setActiveTab("BROWSE");
      setSelectedCategoryFilter("NEET");
      setSelectedCategoryTitle("NEET UG Medical Prep");
    } else if (banner.actionKey === "SHARE_LINK") {
      setActiveTab("MLM_NETWORK");
    } else if (banner.actionKey === "GO_QUIZ") {
      setActiveTab("QUIZ");
    }
  };

  // Stats & Course Lists State
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseRecord[]>([]);
  const [browseCoursesList, setBrowseCoursesList] = useState<CourseRecord[]>(
    [],
  );
  const [mcqList, setMcqList] = useState<McqRecord[]>([]);
  const [quizSetsList, setQuizSetsList] = useState<QuizSetGroup[]>([]);
  const [selectedQuizSetId, setSelectedQuizSetId] = useState<string>("");

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
  const [contentCourse, setContentCourse] = useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);
  const [isLoadingMcqs, setIsLoadingMcqs] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] =
    useState<CourseRecord | null>(null);
  const [expandedStudentTestIdx, setExpandedStudentTestIdx] = useState<
    number | null
  >(null);

  // Enrollment State
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(
    null,
  );
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState("");
  const [enrollErrorMsg, setEnrollErrorMsg] = useState("");

  // Wallet Top-Up State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmountInput, setTopUpAmountInput] = useState("2500");
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState("");
  const [topUpErrorMsg, setTopUpErrorMsg] = useState("");
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  // Student Withdrawal & Payout Profile State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"BANK" | "UPI">("BANK");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountConfirm, setBankAccountConfirm] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [upiNameInput, setUpiNameInput] = useState("");
  const [saveAsDefaultPayout, setSaveAsDefaultPayout] = useState(true);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");
  const [myWithdrawalsList, setMyWithdrawalsList] = useState<
    WithdrawalRequestRecord[]
  >([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [savedPayoutProfile, setSavedPayoutProfile] =
    useState<PayoutProfile | null>(null);

  // Interactive Quiz Player State
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizErrorMsg, setQuizErrorMsg] = useState("");

  // Student KYC Form State (Dual Aadhaar & PAN Support)
  const [aadhaarNumInput, setAadhaarNumInput] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState("");

  const [panNumInput, setPanNumInput] = useState("");
  const [panFile, setPanFile] = useState<File | null>(null);
  const [panPreview, setPanPreview] = useState("");

  const [kycSuccessMsg, setKycSuccessMsg] = useState("");
  const [kycErrorMsg, setKycErrorMsg] = useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  // Enrolled Courses Study Materials & E-Books Filter States
  const [selectedCourseDocFilter, setSelectedCourseDocFilter] =
    useState<string>("ALL");
  const [docSearchQuery, setDocSearchQuery] = useState("");

  // Computed deduplicated list of all E-Books, PDFs, Notes from student's enrolled courses
  const enrolledStudyDocs: EnrolledStudyDoc[] = React.useMemo(() => {
    const list: EnrolledStudyDoc[] = [];
    const seenKeys = new Set<string>();

    enrolledCourses.forEach((crs) => {
      // 1. Study Materials (PDFs, Notes, Docs)
      if (Array.isArray(crs.studyMaterials)) {
        crs.studyMaterials.forEach((mat, idx) => {
          const url = (mat.fileUrl || "").trim();
          const title = (mat.title || "").trim();
          if (url && title) {
            const key = `${crs._id}__${url.toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              list.push({
                id: `mat_${crs._id}_${idx}`,
                courseId: crs._id,
                courseTitle: crs.title,
                courseThumbnail: crs.thumbnail,
                boardOrGrade: crs.boardOrGrade,
                subjectName: crs.subjectName,
                title: mat.title,
                fileUrl: mat.fileUrl,
                docType: (mat.docType as any) || "PDF",
                topic: mat.topic || "Chapter Notes",
                isPrimaryEbook: false,
              });
            }
          }
        });
      }

      // 2. Primary Course E-Book (if configured and not already added)
      const ebUrl = (crs.ebookPdfUrl || "").trim();
      const ebTitle = (crs.ebookTitle || "").trim();
      if (ebUrl && ebTitle) {
        const key = `${crs._id}__${ebUrl.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: `eb_${crs._id}`,
            courseId: crs._id,
            courseTitle: crs.title,
            courseThumbnail: crs.thumbnail,
            boardOrGrade: crs.boardOrGrade,
            subjectName: crs.subjectName,
            title: ebTitle,
            fileUrl: ebUrl,
            docType: "EBOOK",
            topic: "Course Master E-Book",
            isPrimaryEbook: true,
          });
        }
      }
    });

    return list;
  }, [enrolledCourses]);

  // Distinct courses that have study materials or ebooks
  const coursesWithDocs = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    enrolledStudyDocs.forEach((doc) => {
      if (!map.has(doc.courseId)) {
        map.set(doc.courseId, {
          id: doc.courseId,
          title: doc.courseTitle,
          count: 0,
        });
      }
      map.get(doc.courseId)!.count += 1;
    });
    return Array.from(map.values());
  }, [enrolledStudyDocs]);

  // Filtered study docs based on active course and search query
  const filteredStudyDocs = React.useMemo(() => {
    return enrolledStudyDocs.filter((doc) => {
      if (
        selectedCourseDocFilter !== "ALL" &&
        doc.courseId !== selectedCourseDocFilter
      ) {
        return false;
      }
      if (docSearchQuery.trim()) {
        const q = docSearchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesCourse = doc.courseTitle.toLowerCase().includes(q);
        const matchesTopic = doc.topic?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesCourse || matchesTopic;
      }
      return true;
    });
  }, [enrolledStudyDocs, selectedCourseDocFilter, docSearchQuery]);

  // Load Student Dashboard Stats
  const loadStats = async () => {
    setIsLoadingStats(true);
    const res = await fetchStudentDashboardStats();
    if (res.success && res.data) {
      setStats(res.data.stats);
    }
    setIsLoadingStats(false);
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
      console.error("Error loading student withdrawal data:", err);
    }
    setIsLoadingWithdrawals(false);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg("");
    setWithdrawSuccessMsg("");

    const amt = Number(withdrawAmountInput);
    if (isNaN(amt) || amt < 50) {
      setWithdrawErrorMsg("Minimum withdrawal amount is ₹50.");
      return;
    }
    const withdrawableBal =
      stats?.withdrawableBalance !== undefined
        ? stats.withdrawableBalance
        : stats?.walletBalance || 0;
    if (amt > withdrawableBal) {
      setWithdrawErrorMsg(
        `You can only withdraw earnings from Refer & Earn (Affiliate / MLM) commissions. Your withdrawable referral earnings are ₹${withdrawableBal.toLocaleString("en-IN")}. Top-up balance is non-withdrawable and reserved for course purchases.`,
      );
      return;
    }

    if (payoutMethod === "BANK") {
      if (
        !bankAccountHolder.trim() ||
        !bankAccountNumber.trim() ||
        !bankIfscCode.trim()
      ) {
        setWithdrawErrorMsg(
          "Please fill in Account Holder Name, Account Number, and IFSC Code.",
        );
        return;
      }
      if (bankAccountNumber.trim() !== bankAccountConfirm.trim()) {
        setWithdrawErrorMsg(
          "Bank Account Numbers do not match. Please verify.",
        );
        return;
      }
      if (bankIfscCode.trim().length < 5) {
        setWithdrawErrorMsg(
          "Please enter a valid IFSC Code (e.g. SBIN0001234).",
        );
        return;
      }
    } else {
      if (!upiIdInput.trim() || !upiIdInput.includes("@")) {
        setWithdrawErrorMsg(
          "Please enter a valid UPI ID (e.g. mobile@upi or username@bank).",
        );
        return;
      }
    }

    setIsSubmittingWithdraw(true);
    const res = await requestWithdrawal({
      amount: amt,
      payoutMethod,
      bankDetails:
        payoutMethod === "BANK"
          ? {
              accountHolderName: bankAccountHolder.trim(),
              accountNumber: bankAccountNumber.trim(),
              ifscCode: bankIfscCode.trim().toUpperCase(),
              bankName: bankName.trim() || "Bank Transfer",
            }
          : undefined,
      upiDetails:
        payoutMethod === "UPI"
          ? {
              upiId: upiIdInput.trim().toLowerCase(),
              accountHolderName: upiNameInput.trim() || user?.name || "",
            }
          : undefined,
      saveAsDefault: saveAsDefaultPayout,
    });
    setIsSubmittingWithdraw(false);

    if (res.success && res.data) {
      setWithdrawSuccessMsg(
        `✅ Withdrawal request of ₹${amt.toLocaleString("en-IN")} submitted successfully! Admin will review and transfer funds to your ${payoutMethod === "BANK" ? "Bank Account" : "UPI ID"}.`,
      );
      setWithdrawAmountInput("");
      loadStats();
      loadWithdrawalData();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg("");
      }, 3500);
    } else {
      setWithdrawErrorMsg(res.message || "Withdrawal request failed.");
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (
      !window.confirm(
        "Cancel this withdrawal request? Your money will be refunded back to your wallet instantly.",
      )
    )
      return;
    const res = await cancelMyWithdrawal(withdrawalId);
    if (res.success) {
      loadStats();
      loadWithdrawalData();
    } else {
      alert(res.message || "Failed to cancel withdrawal.");
    }
  };

  // Load My Enrolled Courses
  const loadEnrolled = async () => {
    setIsLoadingEnrolled(true);
    const res = await fetchMyEnrolledCourses();
    if (res.success && res.data) {
      setEnrolledCourses(res.data.courses || []);
    }
    setIsLoadingEnrolled(false);
  };

  // Load Browse Platform Courses — filtered by student preference or all
  const loadBrowse = async (forceShowAll: boolean = false) => {
    setIsLoadingBrowse(true);
    const shouldShowAll =
      forceShowAll ||
      filterMode === "EXPLORE_ALL" ||
      selectedCategoryFilter !== "ALL";
    const params = shouldShowAll ? { showAll: true } : {};
    const res = await fetchBrowseCourses(params);
    if (res.success && res.data) {
      setBrowseCoursesList(res.data.courses || []);
    }
    setIsLoadingBrowse(false);
  };

  // Load Quiz Questions & Sets
  const loadMcqs = async () => {
    setIsLoadingMcqs(true);
    const res = await fetchStudentPracticeMcqs();
    if (res.success && res.data) {
      const sets = res.data.quizSets || [];
      setQuizSetsList(sets);

      let currentSet = sets.find((s) => s.quizSetId === selectedQuizSetId);
      if (!currentSet && sets.length > 0) {
        currentSet = sets[0];
        setSelectedQuizSetId(currentSet.quizSetId);
      }

      if (currentSet) {
        setMcqList(currentSet.mcqs || []);
        if (currentSet.hasAttempted && currentSet.lastAttempt) {
          setQuizResult({
            _id: currentSet.lastAttempt._id,
            score: currentSet.lastAttempt.score,
            totalMarks: currentSet.lastAttempt.totalMarks,
            percentage: currentSet.lastAttempt.percentage,
            passed: currentSet.lastAttempt.passed,
            createdAt: currentSet.lastAttempt.createdAt,
          });
        } else {
          setQuizResult(null);
        }
      } else {
        setMcqList(res.data.mcqs || []);
      }
    }
    setIsLoadingMcqs(false);
  };

  const handleSelectQuizSet = (setObj: QuizSetGroup) => {
    setSelectedQuizSetId(setObj.quizSetId);
    setMcqList(setObj.mcqs || []);
    setSelectedAnswers({});
    setQuizErrorMsg("");
    if (setObj.hasAttempted && setObj.lastAttempt) {
      setQuizResult({
        _id: setObj.lastAttempt._id,
        score: setObj.lastAttempt.score,
        totalMarks: setObj.lastAttempt.totalMarks,
        percentage: setObj.lastAttempt.percentage,
        passed: setObj.lastAttempt.passed,
        createdAt: setObj.lastAttempt.createdAt,
      });
    } else {
      setQuizResult(null);
    }
  };

  // Student Learning Goal Preference State
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [filterMode, setFilterMode] = useState<"GOAL_MATCH" | "EXPLORE_ALL">(
    "GOAL_MATCH",
  );
  const [currentUserObj, setCurrentUserObj] = useState<any>(user);

  useEffect(() => {
    loadStats();
    loadEnrolled();
    loadBrowse();
    loadMcqs();
    loadActiveAds();
    loadWithdrawalData();

    // Auto-launch Preference Selection Modal if student has not set preferences yet!
    if (
      user?.role === "STUDENT" &&
      !user?.learningPreference?.isPreferenceSet
    ) {
      setShowPreferenceModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "WALLET") {
      loadStats();
      loadWithdrawalData();
    }
  }, [activeTab]);

  // Reload courses when filter mode toggles or category filter selected
  useEffect(() => {
    loadBrowse();
  }, [filterMode, selectedCategoryFilter]);

  const handlePreferenceSaved = (updatedUser: any) => {
    setCurrentUserObj(updatedUser);
    loadBrowse();
  };

  // 1-Click Course Enrollment
  const handleEnrollSubmit = async (course: CourseRecord) => {
    setEnrollSuccessMsg("");
    setEnrollErrorMsg("");
    setEnrollingCourseId(course._id);

    const res = await enrollCourse(course._id);
    setEnrollingCourseId(null);

    if (res.success && res.data) {
      setEnrollSuccessMsg(
        `🎉 Successfully enrolled in ${course.title}! Check your My Classroom tab.`,
      );
      loadStats();
      loadEnrolled();
    } else {
      const errMsg = res.message || "Course enrollment failed.";
      setEnrollErrorMsg(errMsg);
      if (
        errMsg.toLowerCase().includes("insufficient") ||
        errMsg.toLowerCase().includes("balance") ||
        errMsg.toLowerCase().includes("top up")
      ) {
        setShowTopUpModal(true);
        setTopUpErrorMsg(
          `Your wallet balance is low for enrolling in "${course.title}". Top-up below to complete enrollment!`,
        );
      }
    }
  };

  // Top-Up Wallet Submit
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpErrorMsg("");
    setTopUpSuccessMsg("");

    const amt = Number(topUpAmountInput);
    if (isNaN(amt) || amt <= 0) {
      setTopUpErrorMsg("Please enter a valid positive top-up amount.");
      return;
    }

    setIsSubmittingTopUp(true);
    const res = await topUpStudentWallet(amt);
    setIsSubmittingTopUp(false);

    if (res.success) {
      setTopUpSuccessMsg(
        `🎉 Wallet credited with ₹${amt.toLocaleString("en-IN")}!`,
      );
      loadStats();
      setTimeout(() => {
        setShowTopUpModal(false);
        setTopUpSuccessMsg("");
      }, 1500);
    } else {
      setTopUpErrorMsg(res.message || "Top-up failed.");
    }
  };

  // Quiz Option Selection
  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Quiz Submission
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizErrorMsg("");
    setQuizResult(null);

    const answerPayload = Object.entries(selectedAnswers).map(
      ([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }),
    );

    if (answerPayload.length === 0) {
      setQuizErrorMsg("Please answer at least 1 question before submitting.");
      return;
    }

    const activeSet = quizSetsList.find(
      (s) => s.quizSetId === selectedQuizSetId,
    );

    setIsSubmittingQuiz(true);
    const res = await submitStudentQuiz(
      answerPayload,
      selectedQuizSetId,
      activeSet?.quizSetTitle,
    );
    setIsSubmittingQuiz(false);

    if (res.success && res.data) {
      setQuizResult(res.data.attempt);
      loadStats();
      loadMcqs();
    } else {
      setQuizErrorMsg(res.message || "Failed to submit quiz.");
    }
  };

  // Aadhaar File Change (2MB Limit Validation)
  const handleAadhaarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKycErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setKycErrorMsg("⛔ Aadhaar Card file size must not exceed 2MB!");
        setAadhaarFile(null);
        setAadhaarPreview("");
        e.target.value = "";
        return;
      }
      setAadhaarFile(file);
      setAadhaarPreview(URL.createObjectURL(file));
    }
  };

  // PAN File Change (2MB Limit Validation)
  const handlePanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKycErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setKycErrorMsg("⛔ PAN Card file size must not exceed 2MB!");
        setPanFile(null);
        setPanPreview("");
        e.target.value = "";
        return;
      }
      setPanFile(file);
      setPanPreview(URL.createObjectURL(file));
    }
  };

  // Dual KYC Submit
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycErrorMsg("");
    setKycSuccessMsg("");

    if (!aadhaarNumInput.trim() && !panNumInput.trim()) {
      setKycErrorMsg("Please enter your Aadhaar Number and/or PAN Number.");
      return;
    }

    setIsSubmittingKyc(true);
    const res = await submitStudentKyc({
      aadhaarNumber: aadhaarNumInput.trim(),
      aadhaarFile,
      panNumber: panNumInput.trim(),
      panFile,
    });
    setIsSubmittingKyc(false);

    if (res.success) {
      setKycSuccessMsg(
        "✅ Both Aadhaar Card & PAN Card documents submitted successfully! Admin verification pending.",
      );
      loadStats();
    } else {
      setKycErrorMsg(res.message || "Failed to submit KYC.");
    }
  };

  return (
    <div>
      {/* PhonePe-Style Profile & Header Suite */}
      <div className="clean-profile-card">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* User Profile Avatar with QR Badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "1.25rem",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            {/* Mini QR Badge */}
            <div
              style={{
                position: "absolute",
                bottom: -3,
                right: -3,
                background: "var(--bg-card)",
                borderRadius: "6px",
                padding: "2px",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              }}
            >
              <QrCode size={11} color="#D97706" />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "3px",
              }}
            >
              <h1
                style={{
                  fontSize: "1.22rem",
                  fontWeight: "800",
                  margin: 0,
                  letterSpacing: "-0.3px",
                  color: "var(--text-primary)",
                  textTransform: "capitalize",
                }}
              >
                {user?.name || "Student Learner"}
              </h1>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#059669",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "0.68rem",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10B981",
                  }}
                />
                ONLINE
              </span>
            </div>
            <div
              style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}
            >
              ID:{" "}
              <strong
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "monospace",
                }}
              >
                {user?.userId || "EDU-STUDENT"}
              </strong>{" "}
              • State: {user?.stateCode || "ALL"}
            </div>
          </div>
        </div>

        {/* Right Header Actions: Refer Pill, Goal Setter, Top-Up, Refresh */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTab("MLM_NETWORK")}
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.28)",
              color: "#D97706",
              padding: "7px 14px",
              borderRadius: "10px",
              fontSize: "0.8rem",
              fontWeight: "700",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span>🤝</span>
            <span>Refer & Earn</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowPreferenceModal(true)}
            style={{
              padding: "7px 13px",
              fontSize: "0.8rem",
              fontWeight: "700",
              borderRadius: "10px",
            }}
          >
            <Target size={14} color="#10B981" /> Set Goal
          </button>

          <button
            className="btn-emerald"
            onClick={() => {
              setShowTopUpModal(true);
              setTopUpErrorMsg("");
            }}
            style={{
              padding: "7px 14px",
              fontSize: "0.8rem",
              fontWeight: "700",
              borderRadius: "10px",
            }}
          >
            <PlusCircle size={14} /> Top-Up Wallet
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              loadStats();
              loadEnrolled();
              loadBrowse();
              loadMcqs();
              loadActiveAds();
            }}
            style={{
              padding: "7px 12px",
              fontSize: "0.8rem",
              fontWeight: "600",
              borderRadius: "10px",
            }}
            title="Refresh data"
          >
            <RefreshCw
              size={14}
              className={isLoadingStats ? "animate-spin" : ""}
            />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* GLOBAL SYSTEM ANNOUNCEMENT BROADCAST BANNER */}
      {systemAnnouncement && (
        <div className="clean-announcement-banner">
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(244, 63, 94, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Megaphone size={15} color="#E11D48" />
          </div>
          <div
            style={{
              flex: 1,
              color: "var(--text-primary)",
              fontSize: "0.85rem",
            }}
          >
            <span
              style={{
                background: "rgba(244, 63, 94, 0.1)",
                color: "#E11D48",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "0.7rem",
                fontWeight: "800",
                textTransform: "uppercase",
                marginRight: "8px",
                letterSpacing: "0.5px",
              }}
            >
              Announcement
            </span>
            {systemAnnouncement}
          </div>
        </div>
      )}

      {/* DYNAMIC SPONSOR / PROMOTIONAL AD BANNER & CAROUSEL */}
      {activeAds.length > 0 &&
        (() => {
          const ad = activeAds[currentAdIdx % activeAds.length];
          if (!ad) return null;

          return (
            <div
              className="glass-card"
              style={{
                padding: "18px 22px",
                marginBottom: "20px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderTop: "3px solid #F59E0B",
                boxShadow: "var(--shadow-card)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      fontWeight: "800",
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#D97706",
                    }}
                  >
                    <Sparkles size={11} /> SPONSORED SPOTLIGHT
                  </span>
                  <span
                    className="badge badge-secondary"
                    style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                  >
                    {ad.type === "IMAGE" ? "🖼️ IMAGE" : "🎬 VIDEO"}
                  </span>
                </div>

                {activeAds.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setCurrentAdIdx(
                          (prev) =>
                            (prev - 1 + activeAds.length) % activeAds.length,
                        )
                      }
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        color: "var(--text-secondary)",
                        padding: "3px 6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Previous Ad"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        fontWeight: "700",
                      }}
                    >
                      {(currentAdIdx % activeAds.length) + 1} /{" "}
                      {activeAds.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentAdIdx((prev) => (prev + 1) % activeAds.length)
                      }
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        color: "var(--text-secondary)",
                        padding: "3px 6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Next Ad"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {/* Media Container */}
                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    height: "180px",
                    position: "relative",
                    backgroundColor: "#0F172A",
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onClick={() => {
                    if (ad.type === "VIDEO") {
                      setActiveVideoAdModal(ad);
                    } else if (ad.targetUrl) {
                      window.open(ad.targetUrl, "_blank");
                    }
                  }}
                >
                  {ad.type === "IMAGE" ? (
                    <img
                      src={ad.mediaUrl}
                      alt={ad.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
                      }}
                    >
                      <video
                        src={ad.mediaUrl}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: 0.65,
                        }}
                        muted
                        playsInline
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          background: "rgba(236, 72, 153, 0.9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 16px rgba(236, 72, 153, 0.6)",
                        }}
                      >
                        <Play
                          size={22}
                          color="#FFFFFF"
                          style={{ marginLeft: "3px" }}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "10px",
                      background: "rgba(0,0,0,0.65)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      color: "#FFFFFF",
                      fontSize: "0.68rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {ad.type === "VIDEO"
                      ? "▶ Play Video Ad"
                      : ad.targetUrl
                        ? "↗ Open Link"
                        : "🖼️ View"}
                  </div>
                </div>

                {/* Text & Action CTA */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p
                      style={{
                        fontSize: "0.84rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {ad.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    {ad.type === "VIDEO" && (
                      <button
                        onClick={() => setActiveVideoAdModal(ad)}
                        className="btn-rose"
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: "800",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "10px",
                        }}
                      >
                        <Play size={15} /> Watch Video Ad
                      </button>
                    )}

                    {ad.targetUrl && (
                      <a
                        href={ad.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: "800",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          background:
                            "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                          border: "none",
                          color: "#FFF",
                        }}
                      >
                        Learn More / Visit <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Student Personalization Goal Banner */}
      <div className="clean-goal-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Target size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: "800",
                color: "#059669",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Current Personalized Learning Goal
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: "800",
                color: "var(--text-primary)",
                marginTop: "2px",
              }}
            >
              {currentUserObj?.learningPreference?.boardOrGrade ||
                currentUserObj?.learningPreference?.subCategoryTitle ||
                "All Courses & Boards"}
              {currentUserObj?.learningPreference?.stream
                ? ` (${currentUserObj.learningPreference.stream})`
                : ""}
              <span
                className="badge badge-amber"
                style={{
                  marginLeft: "8px",
                  padding: "2px 8px",
                  fontSize: "0.7rem",
                }}
              >
                State:{" "}
                {currentUserObj?.learningPreference?.stateCode || "GLOBAL"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "var(--bg-surface)",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => setFilterMode("GOAL_MATCH")}
            style={{
              padding: "6px 12px",
              fontSize: "0.78rem",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                filterMode === "GOAL_MATCH" ? "#10B981" : "transparent",
              color:
                filterMode === "GOAL_MATCH"
                  ? "#FFFFFF"
                  : "var(--text-secondary)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🎯 Filtered for My Goal
          </button>
          <button
            onClick={() => setFilterMode("EXPLORE_ALL")}
            style={{
              padding: "6px 12px",
              fontSize: "0.78rem",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                filterMode === "EXPLORE_ALL"
                  ? "var(--primary-accent)"
                  : "transparent",
              color:
                filterMode === "EXPLORE_ALL"
                  ? "#FFFFFF"
                  : "var(--text-secondary)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🌐 Explore All Courses
          </button>
        </div>
      </div>

      {/* 100% Dynamic Student Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        {/* Card 1: Enrolled Courses */}
        <div className="clean-stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: "800",
                letterSpacing: "0.5px",
              }}
            >
              MY ENROLLED BATCHES
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.1)",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "6px 0 2px 0",
            }}
          >
            {enrolledCourses.length > 0
              ? enrolledCourses.length
              : stats
                ? stats.enrolledCoursesCount
                : 0}{" "}
            Courses
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            Live Classes & Recorded Videos
          </div>
        </div>

        {/* Card 2: Wallet Balance */}
        <div className="clean-stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "#059669",
                fontWeight: "800",
                letterSpacing: "0.5px",
              }}
            >
              STUDENT WALLET BALANCE
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span>💳</span>
            </div>
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "6px 0 2px 0",
            }}
          >
            ₹ {stats ? (stats.walletBalance || 0).toLocaleString("en-IN") : "0"}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "2px",
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              1-Click Enrollments
            </span>
            <button
              className="btn-emerald"
              onClick={() => {
                setShowTopUpModal(true);
                setTopUpErrorMsg("");
              }}
              style={{
                padding: "3px 9px",
                fontSize: "0.72rem",
                fontWeight: "800",
                borderRadius: "6px",
                gap: "3px",
                cursor: "pointer",
              }}
            >
              + Top-Up
            </button>
          </div>
        </div>

        {/* Card 3: Quizzes */}
        <div className="clean-stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: "800",
                letterSpacing: "0.5px",
              }}
            >
              QUIZZES COMPLETED
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(245, 158, 11, 0.1)",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "6px 0 2px 0",
            }}
          >
            {stats ? stats.quizAttemptsCount : 0} Quizzes
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            MCQ Practice Tests
          </div>
        </div>

        {/* Card 4: KYC Verification */}
        <div className="clean-stat-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: "800",
                letterSpacing: "0.5px",
              }}
            >
              KYC VERIFICATION
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(139, 92, 246, 0.1)",
                color: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span>🆔</span>
            </div>
          </div>
          <div style={{ margin: "6px 0 2px 0" }}>
            <span
              className={`badge ${stats?.kycStatus === "APPROVED" || stats?.kycStatus === "VERIFIED" ? "badge-emerald" : stats?.kycStatus === "PENDING" ? "badge-amber" : "badge-rose"}`}
              style={{ fontSize: "0.76rem", padding: "3px 8px" }}
            >
              {stats?.kycStatus || "NOT_SUBMITTED"}
            </span>
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            {stats?.kycStatus === "REJECTED" && stats?.kycRejectionReason ? (
              <span
                style={{ color: "#FB7185", fontWeight: "600" }}
                title={stats.kycRejectionReason}
              >
                ❌ Reason:{" "}
                {stats.kycRejectionReason.length > 22
                  ? `${stats.kycRejectionReason.substring(0, 22)}...`
                  : stats.kycRejectionReason}
              </span>
            ) : (
              "Govt Aadhaar / PAN Scan"
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (PhonePe & Muthoot Style) */}
      <div className="nav-segmented-tabs">
        <button
          onClick={() => setActiveTab("BROWSE")}
          className={`nav-segmented-tab ${activeTab === "BROWSE" ? "active" : ""}`}
        >
          <span>🏠</span>
          <span>Explore & Courses ({browseCoursesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MY_CLASSES")}
          className={`nav-segmented-tab ${activeTab === "MY_CLASSES" ? "active" : ""}`}
        >
          <span>🎓</span>
          <span>My Classroom ({enrolledCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("EBOOKS")}
          className={`nav-segmented-tab ${activeTab === "EBOOKS" ? "active" : ""}`}
        >
          <span>📖</span>
          <span>E-Books & PDFs ({enrolledStudyDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("QUIZ")}
          className={`nav-segmented-tab ${activeTab === "QUIZ" ? "active" : ""}`}
        >
          <span>⚡</span>
          <span>
            Practice Quiz {quizResult ? "(Completed)" : `(${mcqList.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("WALLET")}
          className={`nav-segmented-tab ${activeTab === "WALLET" ? "active" : ""}`}
        >
          <span>💳</span>
          <span>Wallet & Credits (₹{stats?.walletBalance || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("PURCHASES")}
          className={`nav-segmented-tab ${activeTab === "PURCHASES" ? "active" : ""}`}
        >
          <span>🧾</span>
          <span>My Purchases ({enrolledCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("KYC")}
          className={`nav-segmented-tab ${activeTab === "KYC" ? "active" : ""}`}
        >
          <span>🆔</span>
          <span>KYC Verification</span>
        </button>

        <button
          onClick={() => setActiveTab("MLM_NETWORK")}
          className={`nav-segmented-tab ${activeTab === "MLM_NETWORK" ? "active" : ""}`}
          style={
            activeTab !== "MLM_NETWORK"
              ? { color: "#E11D48", fontWeight: "700" }
              : undefined
          }
        >
          <span>🤝</span>
          <span>Refer & Earn</span>
        </button>
      </div>

      {/* SUB-TAB: MLM BINARY REFERRAL NETWORK */}
      {activeTab === "MLM_NETWORK" && <AffiliateMlmPortal />}

      {/* SUB-TAB 1: MY CLASSROOM (ENROLLED COURSES) */}
      {activeTab === "MY_CLASSES" && (
        <div
          className="glass-card"
          style={{ padding: "20px", borderRadius: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>
              My Enrolled Batches & Classroom ({enrolledCourses.length})
            </h3>
            <button
              className="btn-primary"
              onClick={() => setActiveTab("BROWSE")}
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
            >
              <ShoppingBag size={14} /> Enroll in New Course
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {isLoadingEnrolled ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading your classroom batches...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "12px",
                  border: "1px dashed var(--border-color)",
                }}
              >
                <p style={{ fontSize: "0.9rem", margin: "0 0 10px 0" }}>
                  You have not enrolled in any course batches yet.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab("BROWSE")}
                  style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                >
                  <ShoppingBag size={15} /> Browse Available Courses
                </button>
              </div>
            ) : (
              enrolledCourses.map((crs) => {
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
                  <div
                    key={crs._id}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      background: "rgba(99,102,241,0.04)",
                      border: "1px solid var(--border-color)",
                      borderLeft: "4px solid #10B981",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                      }}
                    >
                      {crs.thumbnail && (
                        <img
                          src={crs.thumbnail}
                          alt="Banner"
                          onClick={() => setSelectedCourseDetail(crs)}
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "10px",
                            objectFit: "cover",
                            cursor: "pointer",
                            border: "1px solid var(--border-color)",
                          }}
                        />
                      )}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            onClick={() => setSelectedCourseDetail(crs)}
                            style={{
                              fontWeight: "800",
                              fontSize: "1rem",
                              cursor: "pointer",
                              color: "var(--text-primary)",
                            }}
                          >
                            {crs.title}
                          </span>
                          <span
                            className="badge badge-emerald"
                            style={{
                              padding: "2px 8px",
                              fontSize: "0.7rem",
                              fontWeight: "800",
                            }}
                          >
                            ✅ ACTIVE ACCESS
                          </span>
                          <span
                            className="badge badge-primary"
                            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          >
                            {crs.boardOrGrade || "General Batch"}
                          </span>
                          <span
                            className="badge badge-rose"
                            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          >
                            🎯 {crs.subjectName || "All Subjects"}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Educator:{" "}
                          <strong>
                            {crs.instructor?.name || "Prof. Educator"}
                          </strong>{" "}
                          • State: {crs.stateCode || "GLOBAL"}
                        </div>

                        {/* Deliverables summary pills for enrolled student */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            marginTop: "6px",
                            fontSize: "0.7rem",
                          }}
                        >
                          <span
                            style={{
                              background: "var(--bg-surface)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            📹 {lectCount} Lectures
                          </span>
                          {matCount > 0 && (
                            <span
                              style={{
                                background: "rgba(245, 158, 11, 0.1)",
                                color: "#F59E0B",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                fontWeight: "600",
                              }}
                            >
                              📄 {matCount} Study Docs & Notes
                            </span>
                          )}
                          {testCount > 0 && (
                            <span
                              style={{
                                background: "rgba(236, 72, 153, 0.1)",
                                color: "#EC4899",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(236, 72, 153, 0.25)",
                                fontWeight: "600",
                              }}
                            >
                              📝 {testCount} Topic Tests
                            </span>
                          )}
                          {crs.liveSchedule && (
                            <span
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "#10B981",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                fontWeight: "600",
                              }}
                            >
                              ⏰ {crs.liveSchedule}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      {(crs.courseMode === "LIVE_ONLINE" ||
                        crs.courseMode === "HYBRID" ||
                        crs.liveMeetingUrl ||
                        !crs.lectureVideoUrl) && (
                        <a
                          href={
                            crs.liveMeetingUrl ||
                            "https://meet.google.com/eduverse-live-class"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-emerald"
                          style={{
                            fontSize: "0.78rem",
                            padding: "7px 14px",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: "800",
                            borderRadius: "8px",
                          }}
                        >
                          <Radio size={14} className="animate-pulse" /> Join
                          Live Class
                        </a>
                      )}

                      {(crs.courseMode === "RECORDED_VIDEO" ||
                        crs.lectureVideoUrl ||
                        crs.courseMode === "HYBRID") && (
                        <a
                          href={
                            crs.lectureVideoUrl ||
                            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            fontSize: "0.78rem",
                            padding: "7px 14px",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            borderRadius: "8px",
                          }}
                        >
                          <Video size={14} /> Watch Lectures
                        </a>
                      )}

                      <button
                        className="btn-secondary"
                        onClick={() => setSelectedCourseDetail(crs)}
                        style={{
                          fontSize: "0.75rem",
                          padding: "7px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          borderRadius: "8px",
                        }}
                        title="View Course Materials, Mock Tests & Curriculum"
                      >
                        <Eye size={13} /> View Batch Materials
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          setContentCourse({ _id: crs._id, title: crs.title })
                        }
                        style={{
                          fontSize: "0.75rem",
                          padding: "7px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          borderRadius: "8px",
                          color: "#EC4899",
                          borderColor: "rgba(236, 72, 153, 0.3)",
                        }}
                        title="Open blog-style study notes of this batch"
                      >
                        📰 Study Content
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BROWSE PLATFORM COURSES (PhonePe & Muthoot Fincorp ONE Style) */}
      {activeTab === "BROWSE" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* 1. PhonePe Quick Hub & Classroom Access (6 Circular elevated service buttons) */}
          <div
            className="glass-card"
            style={{
              padding: "20px 24px",
              borderRadius: "18px",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "1.25rem" }}>⚡</span>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Quick Hub & Classroom Access
                </h3>
              </div>
              <span
                className="badge badge-primary"
                style={{
                  padding: "3px 10px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                }}
              >
                6 SERVICES
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Service 1: My Classes */}
              <div
                onClick={() => setActiveTab("MY_CLASSES")}
                className="clean-service-item"
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🎓</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#6366F1" }}
                  >
                    {enrolledCourses.length}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  My Classes
                </span>
              </div>

              {/* Service 2: Mock Tests */}
              <div
                onClick={() => setActiveTab("QUIZ")}
                className="clean-service-item"
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>⚡</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#D97706" }}
                  >
                    FREE
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Mock Tests
                </span>
              </div>

              {/* Service 3: E-Books */}
              <div
                onClick={() => {
                  setActiveTab("EBOOKS");
                  setSelectedCourseDocFilter("ALL");
                }}
                className="clean-service-item"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(6, 182, 212, 0.08)",
                    border: "1px solid rgba(6, 182, 212, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📖</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#0891B2" }}
                  >
                    {enrolledStudyDocs.length > 0
                      ? `${enrolledStudyDocs.length} Docs`
                      : "PDFs"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  E-Books
                </span>
              </div>

              {/* Service 4: Top-Up Wallet */}
              <div
                onClick={() => {
                  setShowTopUpModal(true);
                  setTopUpErrorMsg("");
                }}
                className="clean-service-item"
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>💳</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#059669" }}
                  >
                    ₹{stats?.walletBalance || 0}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Top-Up Wallet
                </span>
              </div>

              {/* Service 5: Refer & Earn */}
              <div
                onClick={() => setActiveTab("MLM_NETWORK")}
                className="clean-service-item"
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(236, 72, 153, 0.08)",
                    border: "1px solid rgba(236, 72, 153, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🤝</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#DB2777" }}
                  >
                    ₹25K
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  Refer & Earn
                </span>
              </div>

              {/* Service 6: KYC Verify */}
              <div
                onClick={() => setActiveTab("KYC")}
                className="clean-service-item"
              >
                <div
                  className="clean-service-icon-wrap"
                  style={{
                    background: "rgba(139, 92, 246, 0.08)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🆔</span>
                  <span
                    className="clean-service-badge"
                    style={{ background: "#7C3AED" }}
                  >
                    {stats?.kycStatus === "APPROVED" ? "VERIFIED" : "KYC"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    marginTop: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  KYC Verify
                </span>
              </div>
            </div>
          </div>

          {/* 2. Hero Promotional Carousel Banner */}
          <div>
            <div
              onClick={() =>
                handleBannerPress(PROMO_BANNERS[activeBannerIndex])
              }
              className="glass-card"
              style={{
                padding: "24px 28px",
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${PROMO_BANNERS[activeBannerIndex].accentColor}06 0%, var(--bg-card) 100%)`,
                border: "1px solid var(--border-color)",
                borderLeft: `5px solid ${PROMO_BANNERS[activeBannerIndex].accentColor}`,
                boxShadow: `0 4px 20px -4px ${PROMO_BANNERS[activeBannerIndex].accentColor}25`,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    background: `${PROMO_BANNERS[activeBannerIndex].accentColor}15`,
                    color: PROMO_BANNERS[activeBannerIndex].accentColor,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "0.74rem",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                  }}
                >
                  {PROMO_BANNERS[activeBannerIndex].tag}
                </span>
                <span
                  style={{
                    background: PROMO_BANNERS[activeBannerIndex].accentColor,
                    color: "#FFF",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.72rem",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                  }}
                >
                  {PROMO_BANNERS[activeBannerIndex].badgeText}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "800",
                  margin: "0 0 6px 0",
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                {PROMO_BANNERS[activeBannerIndex].title}
              </h2>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  margin: "0 0 18px 0",
                  lineHeight: 1.5,
                }}
              >
                {PROMO_BANNERS[activeBannerIndex].subTitle}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerPress(PROMO_BANNERS[activeBannerIndex]);
                  }}
                  style={{
                    background: PROMO_BANNERS[activeBannerIndex].accentColor,
                    color: "#FFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "9px 20px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: `0 4px 12px ${PROMO_BANNERS[activeBannerIndex].accentColor}40`,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{PROMO_BANNERS[activeBannerIndex].ctaText}</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBannerIndex(
                      (prev) => (prev + 1) % PROMO_BANNERS.length,
                    );
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "7px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    borderRadius: "10px",
                  }}
                >
                  Next Promo ❯
                </button>
              </div>
            </div>

            {/* Pagination Dots */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              {PROMO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIndex(idx)}
                  style={{
                    width: activeBannerIndex === idx ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background:
                      activeBannerIndex === idx
                        ? "#6366F1"
                        : "var(--border-color)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s ease",
                  }}
                  title={`Promo ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 3. 6 Core Educational Verticals Grid (Muthoot Fincorp ONE Style) */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {CATEGORY_SECTIONS.map((sec) => (
              <div
                key={sec.id}
                className="glass-card"
                style={{
                  padding: "20px 22px",
                  borderRadius: "18px",
                  border: "1px solid var(--border-color)",
                }}
              >
                {/* Category Header with View All */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>{sec.icon}</span>
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: "800",
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      {sec.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter(sec.id);
                      setSelectedCategoryTitle(sec.title);
                      if (filterMode !== "EXPLORE_ALL") {
                        setFilterMode("EXPLORE_ALL");
                      }
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#6366F1",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                    }}
                  >
                    <span>View All</span>
                    <span>❯</span>
                  </button>
                </div>

                {/* 4-8 Column Grid */}
                <div className="category-vertical-grid">
                  {sec.items.map((item) => {
                    const isSelected =
                      selectedCategoryFilter === item.filterKey;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedCategoryFilter(item.filterKey);
                          setSelectedCategoryTitle(
                            item.name.replace("\n", " "),
                          );
                          if (filterMode !== "EXPLORE_ALL") {
                            setFilterMode("EXPLORE_ALL");
                          }
                        }}
                        className="squircle-cat-item"
                        style={{
                          background: isSelected
                            ? "rgba(99, 102, 241, 0.12)"
                            : "transparent",
                          border: isSelected
                            ? "1px solid #6366F1"
                            : "1px solid transparent",
                        }}
                      >
                        <div
                          className="squircle-icon-box"
                          style={{
                            borderColor: isSelected
                              ? "#6366F1"
                              : "var(--border-color)",
                            background: isSelected
                              ? "rgba(99, 102, 241, 0.2)"
                              : undefined,
                            boxShadow: isSelected
                              ? "0 0 14px rgba(99, 102, 241, 0.4)"
                              : undefined,
                          }}
                        >
                          {item.badge && (
                            <span
                              className="badge-mini-tag"
                              style={{ background: item.badgeBg || "#EC4899" }}
                            >
                              {item.badge}
                            </span>
                          )}
                          <span>{item.icon}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.76rem",
                            fontWeight: isSelected ? "800" : "700",
                            color: isSelected
                              ? "#6366F1"
                              : "var(--text-primary)",
                            marginTop: "6px",
                            lineHeight: 1.3,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 4. Active Filter Status & Course Catalog Header */}
          <div
            className="glass-card"
            style={{
              padding: "22px",
              borderRadius: "18px",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <h3
                    style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}
                  >
                    Available Platform Batches & Courses Directory
                  </h3>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    Filtered by:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {selectedCategoryTitle}
                    </strong>
                  </span>
                  {selectedCategoryFilter !== "ALL" && (
                    <button
                      onClick={() => {
                        setSelectedCategoryFilter("ALL");
                        setSelectedCategoryTitle("All Platform Courses");
                      }}
                      style={{
                        background: "rgba(244, 63, 94, 0.12)",
                        color: "#FB7185",
                        border: "1px solid rgba(244, 63, 94, 0.3)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Clear Filter (Show All)
                    </button>
                  )}
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => loadBrowse()}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                <RefreshCw
                  size={14}
                  className={isLoadingBrowse ? "animate-spin" : ""}
                />{" "}
                Refresh Catalog
              </button>
            </div>

            {/* Course Catalog Search */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <input
                type="text"
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder="Search courses, subjects, boards..."
                aria-label="Search courses"
                style={{
                  width: "100%",
                  padding: "10px 84px 10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--form-input-border)",
                  background: "var(--form-input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {courseSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCourseSearchQuery("")}
                  title="Clear search"
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#FB7185",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    padding: "3px 9px",
                    borderRadius: "6px",
                    fontSize: "0.74rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {enrollSuccessMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  marginBottom: "14px",
                }}
              >
                {enrollSuccessMsg}
              </div>
            )}

            {enrollErrorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={15} />
                <span>{enrollErrorMsg}</span>
              </div>
            )}

            {isLoadingBrowse ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading course catalog...
              </div>
            ) : (
              (() => {
                const categoryFilteredList = browseCoursesList.filter((crs) => {
                  if (selectedCategoryFilter === "ALL") return true;
                  const filterLower = selectedCategoryFilter.toLowerCase();
                  const cleanFilter = filterLower.replace(/[^a-z0-9]/g, "");

                  const crsCatCode = (
                    (crs as any).categoryCode ||
                    (typeof crs.category === "string"
                      ? crs.category
                      : (crs.category as any)?.code) ||
                    ""
                  ).toLowerCase();
                  const cleanCatCode = crsCatCode.replace(/[^a-z0-9]/g, "");
                  const matchCat =
                    crsCatCode === filterLower || cleanCatCode === cleanFilter;

                  const subCat = ((crs as any).subCategory || "").toLowerCase();
                  const cleanSub = subCat.replace(/[^a-z0-9]/g, "");

                  const subCatTitle = (
                    (crs as any).subCategoryTitle || ""
                  ).toLowerCase();
                  const cleanSubTitle = subCatTitle.replace(/[^a-z0-9]/g, "");

                  const title = (crs.title || "").toLowerCase();
                  const cleanTitle = title.replace(/[^a-z0-9]/g, "");

                  const desc = (crs.description || "").toLowerCase();
                  const board = ((crs as any).boardOrGrade || "").toLowerCase();
                  const stream = ((crs as any).stream || "").toLowerCase();
                  const subject = (
                    (crs as any).subjectName || ""
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

                // Search filter: category filter ke result par apply hota hai
                const searchTerm = courseSearchQuery.trim().toLowerCase();
                const filteredList = !searchTerm
                  ? categoryFilteredList
                  : categoryFilteredList.filter((crs) => {
                      const catRaw =
                        (crs as any).categoryCode ||
                        (typeof crs.category === "string"
                          ? crs.category
                          : (crs.category as any)?.code) ||
                        "";
                      const haystack = [
                        crs.title,
                        (crs as any).subjectName,
                        (crs as any).boardOrGrade,
                        (crs as any).stream,
                        catRaw,
                        (crs as any).subCategory,
                        (crs as any).subCategoryTitle,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                      // Har word match hona chahiye, e.g. "cbse maths" dono words dhoondhega
                      return searchTerm
                        .split(/\s+/)
                        .every((word) => haystack.includes(word));
                    });

                if (filteredList.length === 0) {
                  // Search ki wajah se khaali hai
                  if (searchTerm) {
                    return (
                      <div
                        style={{
                          padding: "36px 20px",
                          textAlign: "center",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "14px",
                          border: "1px dashed var(--border-color)",
                        }}
                      >
                        <div
                          style={{ fontSize: "2.5rem", marginBottom: "8px" }}
                        >
                          🔍
                        </div>
                        <h4
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "800",
                            margin: "0 0 6px 0",
                          }}
                        >
                          No matching courses found. Try another search.
                        </h4>
                        <p
                          style={{
                            fontSize: "0.84rem",
                            color: "var(--text-secondary)",
                            margin: "0 0 16px 0",
                          }}
                        >
                          "{courseSearchQuery}" ke liye koi course nahi mila
                          {selectedCategoryFilter !== "ALL"
                            ? ` (${selectedCategoryTitle} mein)`
                            : ""}
                          .
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn-secondary"
                            onClick={() => setCourseSearchQuery("")}
                            style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                          >
                            Clear Search
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              setCourseSearchQuery("");
                              setSelectedCategoryFilter("ALL");
                              setSelectedCategoryTitle("All Platform Courses");
                            }}
                            style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                          >
                            Reset Search & Filter
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Search nahi hai, sirf category mein courses nahi (existing message)
                  return (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "14px",
                        border: "1px dashed var(--border-color)",
                      }}
                    >
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
                        📚
                      </div>
                      <h4
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "800",
                          margin: "0 0 6px 0",
                        }}
                      >
                        No direct batches found for "{selectedCategoryTitle}"
                      </h4>
                      <p
                        style={{
                          fontSize: "0.84rem",
                          color: "var(--text-secondary)",
                          margin: "0 0 16px 0",
                          maxWidth: "480px",
                          marginInline: "auto",
                        }}
                      >
                        Upcoming live online batches are being scheduled for
                        this track. You can view all available batches or
                        explore other categories.
                      </p>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setSelectedCategoryFilter("ALL");
                          setSelectedCategoryTitle("All Platform Courses");
                        }}
                        style={{ fontSize: "0.82rem", padding: "8px 18px" }}
                      >
                        View All Available Batches
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    {filteredList.map((crs) => {
                      const isEnrolled = enrolledCourses.some(
                        (e) => e._id === crs._id,
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
                        <div
                          key={crs._id}
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "12px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div>
                            {crs.thumbnail && (
                              <div
                                onClick={() => setSelectedCourseDetail(crs)}
                                style={{
                                  cursor: "pointer",
                                  overflow: "hidden",
                                  borderRadius: "10px",
                                  marginBottom: "12px",
                                  width: "100%",
                                  aspectRatio: "16 / 9",
                                  background: "rgba(0, 0, 0, 0.03)",
                                  border: "1px solid var(--border-color)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={crs.thumbnail}
                                  alt={crs.title || "Course Banner"}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    transition: "transform 0.2s ease",
                                  }}
                                />
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                marginBottom: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                className="badge badge-primary"
                                style={{
                                  padding: "2px 6px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                {crs.boardOrGrade || "General Batch"}
                              </span>
                              <span
                                className="badge badge-rose"
                                style={{
                                  padding: "2px 6px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                🎯 {crs.subjectName || "All Subjects"}
                              </span>
                              <span
                                className="badge badge-amber"
                                style={{
                                  padding: "2px 6px",
                                  fontSize: "0.7rem",
                                }}
                              >
                                State: {crs.stateCode}
                              </span>
                            </div>

                            <h4
                              onClick={() => setSelectedCourseDetail(crs)}
                              style={{
                                fontSize: "1rem",
                                fontWeight: "800",
                                margin: "4px 0",
                                cursor: "pointer",
                                color: "var(--text-primary)",
                              }}
                            >
                              {crs.title}
                            </h4>

                            <p
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                                margin: "0 0 8px 0",
                                lineClamp: 2,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {crs.description}
                            </p>

                            {/* Deliverable Pills */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                                margin: "6px 0 10px 0",
                                fontSize: "0.7rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <span
                                style={{
                                  background: "var(--bg-surface)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                📹 {lectCount} Lectures
                              </span>
                              {matCount > 0 && (
                                <span
                                  style={{
                                    background: "rgba(245, 158, 11, 0.08)",
                                    color: "#F59E0B",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                  }}
                                >
                                  📄 {matCount} PDFs / Notes
                                </span>
                              )}
                              {testCount > 0 && (
                                <span
                                  style={{
                                    background: "rgba(236, 72, 153, 0.08)",
                                    color: "#EC4899",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    border: "1px solid rgba(236, 72, 153, 0.2)",
                                  }}
                                >
                                  📝 {testCount} Mock Tests
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                fontSize: "0.76rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              Educator:{" "}
                              <strong>
                                {crs.instructor?.name || "Prof. Educator"}
                              </strong>
                            </div>
                          </div>

                          <div
                            style={{
                              borderTop: "1px solid var(--border-color)",
                              paddingTop: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: "1.1rem",
                                  fontWeight: "800",
                                  color: "#34D399",
                                }}
                              >
                                ₹{crs.price}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                  textDecoration: "line-through",
                                  marginLeft: "6px",
                                }}
                              >
                                ₹{crs.originalPrice}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                              }}
                            >
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSelectedCourseDetail(crs)}
                                style={{
                                  fontSize: "0.74rem",
                                  padding: "6px 10px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                title="View Full Course Batch Details"
                              >
                                <Eye size={13} /> Details
                              </button>

                              {isEnrolled ? (
                                <span
                                  className="badge badge-emerald"
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  ✅ ENROLLED
                                </span>
                              ) : (
                                <button
                                  className="btn-primary"
                                  onClick={() => handleEnrollSubmit(crs)}
                                  disabled={enrollingCourseId === crs._id}
                                  style={{
                                    fontSize: "0.78rem",
                                    padding: "6px 12px",
                                  }}
                                >
                                  {enrollingCourseId === crs._id
                                    ? "Enrolling..."
                                    : "1-Click Enroll"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: ENROLLED COURSE STUDY MATERIALS & E-BOOKS */}
      {activeTab === "EBOOKS" && (
        <div
          className="glass-card"
          style={{
            padding: "24px 28px",
            borderRadius: "18px",
            marginTop: "12px",
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  className="badge badge-cyan"
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    fontWeight: "800",
                  }}
                >
                  📚 ENROLLED COURSE STUDY MATERIALS
                </span>
                <span
                  style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                >
                  100% Unlocked • Direct Download & Instant Browser Access
                </span>
              </div>
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                My Classroom E-Books & Study Material Vault
              </h3>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--text-secondary)",
                  marginTop: "4px",
                  margin: 0,
                }}
              >
                Official study documents, PDFs, and notes included with your
                enrolled courses. Click any document to open instantly in your
                browser.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--badge-primary-bg)",
                  border: "1px solid var(--badge-primary-border)",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--primary-accent)",
                    fontWeight: "800",
                    letterSpacing: "0.04em",
                  }}
                >
                  TOTAL UNLOCKED
                </div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                  }}
                >
                  {enrolledStudyDocs.length} Documents
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={loadEnrolled}
                disabled={isLoadingEnrolled}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Refresh Documents"
              >
                <RefreshCw
                  size={14}
                  className={isLoadingEnrolled ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Enrolled Course Selector Pills & Search */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "22px",
              flexWrap: "wrap",
              gap: "14px",
              borderTop: "1px solid var(--border-color)",
              borderBottom: "1px solid var(--border-color)",
              padding: "14px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setSelectedCourseDocFilter("ALL")}
                className={`btn-${selectedCourseDocFilter === "ALL" ? "primary" : "secondary"}`}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                }}
              >
                All Courses ({enrolledStudyDocs.length})
              </button>
              {coursesWithDocs.map((crs) => (
                <button
                  key={crs.id}
                  onClick={() => setSelectedCourseDocFilter(crs.id)}
                  className={`btn-${selectedCourseDocFilter === crs.id ? "primary" : "secondary"}`}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    borderRadius: "8px",
                  }}
                >
                  {crs.title} ({crs.count})
                </button>
              ))}
            </div>

            <div style={{ minWidth: "240px", flex: "1", maxWidth: "320px" }}>
              <input
                type="text"
                placeholder="Search documents or topics..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--form-input-border)",
                  background: "var(--form-input-bg)",
                  color: "var(--text-primary)",
                  fontSize: "0.82rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Cards Grid */}
          {isLoadingEnrolled ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>📖</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                Loading enrolled classroom study materials...
              </div>
            </div>
          ) : enrolledStudyDocs.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                background: "var(--bg-surface)",
                borderRadius: "16px",
                border: "1px dashed var(--border-color)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📚</div>
              <h4
                style={{
                  fontSize: "1.15rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                No Attached Study Materials Yet
              </h4>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--text-muted)",
                  maxWidth: "480px",
                  margin: "0 auto 18px",
                }}
              >
                Your instructors have not attached e-books or PDF documents to
                your enrolled courses yet. When notes are uploaded, they will
                automatically appear here.
              </p>
              <button
                className="btn-primary"
                onClick={() => setActiveTab("MY_CLASSES")}
                style={{ padding: "8px 18px", fontSize: "0.84rem" }}
              >
                Go to My Classroom ({enrolledCourses.length})
              </button>
            </div>
          ) : filteredStudyDocs.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                background: "var(--bg-surface)",
                borderRadius: "16px",
                border: "1px dashed var(--border-color)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                No matching study materials found
              </h4>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  margin: "0 auto 12px",
                }}
              >
                Try adjusting your search query or reset the course filter.
              </p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedCourseDocFilter("ALL");
                  setDocSearchQuery("");
                }}
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
              {filteredStudyDocs.map((doc) => {
                const isPdf = doc.docType === "PDF";
                const isDoc = doc.docType === "DOC";

                return (
                  <div
                    key={doc.id}
                    className="glass-card"
                    style={{
                      borderRadius: "16px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--shadow-card)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      {/* Top Tag Row */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: "800",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              background: isPdf
                                ? "rgba(239, 68, 68, 0.08)"
                                : isDoc
                                  ? "rgba(37, 99, 235, 0.08)"
                                  : "rgba(124, 58, 237, 0.08)",
                              color: isPdf
                                ? "#DC2626"
                                : isDoc
                                  ? "#2563EB"
                                  : "#7C3AED",
                              border: `1px solid ${isPdf ? "rgba(239, 68, 68, 0.2)" : isDoc ? "rgba(37, 99, 235, 0.2)" : "rgba(124, 58, 237, 0.2)"}`,
                            }}
                          >
                            {isPdf
                              ? "📄 PDF Document"
                              : isDoc
                                ? "📝 Google Doc / Word"
                                : "📖 E-Book Reference"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: "#059669",
                            background: "rgba(5, 150, 105, 0.08)",
                            border: "1px solid rgba(5, 150, 105, 0.2)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <CheckCircle size={13} /> Unlocked
                        </span>
                      </div>

                      {/* Document Title */}
                      <h4
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          lineHeight: 1.4,
                          marginBottom: "10px",
                        }}
                      >
                        {doc.title}
                      </h4>

                      {/* Enrolled Course info */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          maxWidth: "100%",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--primary-accent)",
                            fontWeight: "800",
                          }}
                        >
                          🎓 Course:
                        </span>
                        <span
                          style={{
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          {doc.courseTitle}
                        </span>
                      </div>

                      {/* Topic info */}
                      {doc.topic && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>📌 Topic:</span>
                          <span
                            style={{
                              fontWeight: "600",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {doc.topic}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Direct open & download (No slow iframe modal) */}
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid var(--border-color)",
                      }}
                    >
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: "9px 14px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          textDecoration: "none",
                          borderRadius: "8px",
                        }}
                      >
                        <ExternalLink size={14} /> Open in Browser
                      </a>
                      <a
                        href={doc.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{
                          padding: "9px 14px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          textDecoration: "none",
                          borderRadius: "8px",
                        }}
                        title="Download Document"
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: WALLET & CREDITS */}
      {activeTab === "WALLET" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="glass-card"
            style={{ padding: "24px 28px", borderRadius: "18px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    fontWeight: "800",
                  }}
                >
                  STUDENT WALLET & EARNINGS
                </span>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    marginTop: "6px",
                    color: "var(--text-primary)",
                  }}
                >
                  Student Digital Wallet & Payout Center
                </h3>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowTopUpModal(true);
                    setTopUpErrorMsg("");
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <PlusCircle size={15} /> Add Money (Top-Up)
                </button>
                <button
                  className="btn-emerald"
                  onClick={() => {
                    setShowWithdrawModal(true);
                    setWithdrawErrorMsg("");
                    setWithdrawSuccessMsg("");
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ArrowUpRight size={16} /> Withdraw Referrals
                </button>
              </div>
            </div>

            {/* DUAL BALANCE SYSTEM: Course Purchase Balance vs Withdrawable Refer & Earn Commission */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* CARD 1: Course Purchase Top-up Wallet */}
              <div
                style={{
                  padding: "22px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.05) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#60A5FA",
                        fontWeight: "800",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      💳 COURSE PURCHASE WALLET
                    </span>
                    <span
                      className="badge badge-primary"
                      style={{ fontSize: "0.66rem", padding: "2px 6px" }}
                    >
                      NON-WITHDRAWABLE
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "2.1rem",
                      fontWeight: "900",
                      color: "var(--text-primary)",
                      margin: "4px 0 6px",
                    }}
                  >
                    ₹{" "}
                    {stats
                      ? (stats.purchaseBalance || 0).toLocaleString("en-IN")
                      : "0"}
                  </div>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Balance added via Netbanking/UPI/Card. Reserved for
                    enrolling in Courses, Mock Tests & E-Books.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowTopUpModal(true);
                      setTopUpErrorMsg("");
                    }}
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <PlusCircle size={14} /> Add Money to Buy Courses
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab("BROWSE")}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    Browse Courses
                  </button>
                </div>
              </div>

              {/* CARD 2: Refer & Earn Commission (Withdrawable) */}
              <div
                style={{
                  padding: "22px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.06) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#34D399",
                        fontWeight: "800",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      🎁 REFER & EARN COMMISSIONS
                    </span>
                    <span
                      className="badge badge-emerald"
                      style={{ fontSize: "0.66rem", padding: "2px 6px" }}
                    >
                      100% WITHDRAWABLE
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "2.1rem",
                      fontWeight: "900",
                      color: "var(--text-primary)",
                      margin: "4px 0 6px",
                    }}
                  >
                    ₹{" "}
                    {stats
                      ? (stats.withdrawableBalance || 0).toLocaleString("en-IN")
                      : "0"}
                  </div>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Earned from direct student referrals & binary MLM matching
                    bonuses. Cash out anytime to Bank or UPI!
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn-emerald"
                    onClick={() => {
                      setShowWithdrawModal(true);
                      setWithdrawErrorMsg("");
                      setWithdrawSuccessMsg("");
                    }}
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <ArrowUpRight size={14} /> Withdraw to Bank / UPI
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab("MLM_NETWORK")}
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    Refer & Earn Network
                  </button>
                </div>
              </div>

              {/* CARD 3: Saved Payout Profile Card */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "14px",
                  background: "rgba(99, 102, 241, 0.06)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Building2 size={16} color="var(--primary-accent)" />{" "}
                      Saved Withdrawal Destination
                    </div>
                    {savedPayoutProfile?.isConfigured && (
                      <span
                        className="badge badge-primary"
                        style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {savedPayoutProfile?.isConfigured ? (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {savedPayoutProfile.preferredMethod === "BANK" ? (
                        <div>
                          <div>
                            <strong>Bank:</strong>{" "}
                            {savedPayoutProfile.bankAccount?.bankName ||
                              "Direct Bank Transfer"}
                          </div>
                          <div>
                            <strong>A/C:</strong> ••••••••
                            {(
                              savedPayoutProfile.bankAccount?.accountNumber ||
                              ""
                            ).slice(-4)}{" "}
                            ({savedPayoutProfile.bankAccount?.accountHolderName}
                            )
                          </div>
                          <div>
                            <strong>IFSC:</strong>{" "}
                            {savedPayoutProfile.bankAccount?.ifscCode}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>
                            <strong>UPI ID:</strong>{" "}
                            {savedPayoutProfile.upi?.upiId}
                          </div>
                          <div>
                            <strong>Holder:</strong>{" "}
                            {savedPayoutProfile.upi?.accountHolderName ||
                              user?.name}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      No Bank Account or UPI ID saved yet. Set it up when you
                      request your first withdrawal.
                    </p>
                  )}
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowWithdrawModal(true);
                    setWithdrawErrorMsg("");
                  }}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "12px",
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                  }}
                >
                  {savedPayoutProfile?.isConfigured
                    ? "Update Account Details"
                    : "+ Configure Bank / UPI"}
                </button>
              </div>
            </div>

            {/* Total Balance Combined Banner */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "12px",
                border: "1px dashed var(--border-color)",
                padding: "12px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "1.2rem" }}>⚡</span>
                <div>
                  <span
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    Total Usable Balance for Buying Courses: ₹
                    {(stats?.walletBalance || 0).toLocaleString("en-IN")}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    💡 Course khareedne ke liye aap Deposit Balance aur Refer &
                    Earn commission dono use kar sakte hain!
                  </span>
                </div>
              </div>
              <span
                className="badge badge-primary"
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 10px",
                  fontWeight: 700,
                }}
              >
                Course Checkout Ready
              </span>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                onClick={() => setActiveTab("BROWSE")}
                style={{ padding: "8px 16px", fontSize: "0.84rem" }}
              >
                <ShoppingBag size={14} /> Browse Courses to Enroll
              </button>
              <button
                className="btn-secondary"
                onClick={() => setActiveTab("EBOOKS")}
                style={{ padding: "8px 16px", fontSize: "0.84rem" }}
              >
                <BookOpen size={14} /> Browse E-Books & PDFs
              </button>
              <button
                className="btn-secondary"
                onClick={() => setActiveTab("MLM_NETWORK")}
                style={{ padding: "8px 16px", fontSize: "0.84rem" }}
              >
                <Share2 size={14} /> Check MLM Network & Earnings
              </button>
            </div>
          </div>

          {/* WITHDRAWAL REQUESTS & PAYOUT HISTORY CARD */}
          <div
            className="glass-card"
            style={{ padding: "24px 28px", borderRadius: "18px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Bank & UPI Withdrawal History ({myWithdrawalsList.length})
                </h4>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Track your payout status, approval UTR numbers, and cash
                  disbursement history.
                </p>
              </div>
              <button
                className="btn-secondary"
                onClick={loadWithdrawalData}
                style={{
                  fontSize: "0.78rem",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw
                  size={13}
                  className={isLoadingWithdrawals ? "animate-spin" : ""}
                />{" "}
                Refresh Status
              </button>
            </div>

            {isLoadingWithdrawals ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading withdrawal records...
              </div>
            ) : myWithdrawalsList.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  background: "var(--bg-surface)",
                  borderRadius: "14px",
                  border: "1px dashed var(--border-color)",
                }}
              >
                <Building2
                  size={32}
                  style={{ margin: "0 auto 8px", opacity: 0.5 }}
                />
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    marginBottom: "4px",
                  }}
                >
                  No Withdrawal Requests Yet
                </div>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  You have not submitted any withdrawal requests yet. Earn from
                  MLM referrals and cash out anytime!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {myWithdrawalsList.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isApproved = item.status === "APPROVED";
                  const isRejected = item.status === "REJECTED";
                  const isCancelled = item.status === "CANCELLED";

                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "900",
                              color: isApproved
                                ? "#34D399"
                                : isRejected
                                  ? "#FB7185"
                                  : "var(--text-primary)",
                            }}
                          >
                            ₹ {item.amount.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={
                              isApproved
                                ? "badge badge-emerald"
                                : isRejected
                                  ? "badge badge-rose"
                                  : isCancelled
                                    ? "badge badge-slate"
                                    : "badge badge-amber"
                            }
                            style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                          >
                            {isApproved && "✅ APPROVED & PAID"}
                            {isPending && "🟡 PENDING ADMIN APPROVAL"}
                            {isRejected && "❌ REJECTED (REFUNDED)"}
                            {isCancelled && "⚪ CANCELLED"}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {item.payoutMethod === "BANK" ? (
                            <span>
                              🏦 <strong>Bank Transfer:</strong>{" "}
                              {item.bankDetails?.bankName || "Bank"} • A/C:{" "}
                              {item.bankDetails?.accountNumber} (IFSC:{" "}
                              {item.bankDetails?.ifscCode})
                            </span>
                          ) : (
                            <span>
                              📱 <strong>UPI Transfer:</strong>{" "}
                              {item.upiDetails?.upiId} (
                              {item.upiDetails?.accountHolderName})
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          ID:{" "}
                          <code style={{ color: "var(--primary-accent)" }}>
                            {item.withdrawalId}
                          </code>{" "}
                          • Requested on:{" "}
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>

                        {item.utrNumber && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#34D399",
                              fontWeight: "700",
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Check size={14} /> Bank UTR / Proof Ref:{" "}
                            <span style={{ textDecoration: "underline" }}>
                              {item.utrNumber}
                            </span>
                          </div>
                        )}

                        {item.rejectionReason && (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#FB7185",
                              fontWeight: "600",
                              marginTop: "2px",
                            }}
                          >
                            ⚠️ Reason: {item.rejectionReason} (Amount has been
                            refunded to your wallet)
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <button
                          className="btn-rose"
                          onClick={() => handleCancelWithdrawal(item._id)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.76rem",
                            borderRadius: "8px",
                          }}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIVE PRACTICE QUIZ */}
      {activeTab === "QUIZ" && (
        <div
          className="glass-card"
          style={{
            padding: "24px 28px",
            borderRadius: "18px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span
                className="badge badge-amber"
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  fontWeight: "800",
                }}
              >
                INTERACTIVE PRACTICE QUIZ
              </span>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "800",
                  marginTop: "6px",
                  color: "var(--text-primary)",
                }}
              >
                Live MCQ Test & Self-Assessment
              </h3>
            </div>
            <button
              className="btn-secondary"
              onClick={loadMcqs}
              style={{
                fontSize: "0.8rem",
                padding: "8px 14px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw
                size={14}
                className={isLoadingMcqs ? "animate-spin" : ""}
              />{" "}
              Reload Quiz Data
            </button>
          </div>

          {/* Quiz Sets Selection Bar */}
          {quizSetsList.length > 0 && (
            <div style={{ marginBottom: "22px" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  color: "var(--text-secondary)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                📁 Select Test Paper / Quiz Set ({quizSetsList.length}{" "}
                Available)
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                }}
              >
                {quizSetsList.map((setObj) => {
                  const isSelected = setObj.quizSetId === selectedQuizSetId;
                  return (
                    <button
                      key={setObj.quizSetId}
                      type="button"
                      onClick={() => handleSelectQuizSet(setObj)}
                      style={{
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: isSelected
                          ? "2px solid #F59E0B"
                          : "1px solid var(--border-color)",
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)"
                          : "rgba(255, 255, 255, 0.02)",
                        color: "var(--text-primary)",
                        textAlign: "left",
                        cursor: "pointer",
                        minWidth: "220px",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "800",
                            fontSize: "0.9rem",
                            color: isSelected
                              ? "#FBBF24"
                              : "var(--text-primary)",
                          }}
                        >
                          {setObj.quizSetTitle}
                        </span>
                        {setObj.hasAttempted ? (
                          <span
                            className="badge badge-emerald"
                            style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                          >
                            🔒 COMPLETED
                          </span>
                        ) : (
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                          >
                            ✍️ AVAILABLE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {setObj.count} Questions •{" "}
                        {setObj.courseTitle || "Batch Test"}
                      </div>
                      {setObj.hasAttempted && setObj.lastAttempt && (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: setObj.lastAttempt.passed
                              ? "#34D399"
                              : "#FB7185",
                            fontWeight: "800",
                            marginTop: "4px",
                          }}
                        >
                          Score: {setObj.lastAttempt.score}/
                          {setObj.lastAttempt.totalMarks} (
                          {setObj.lastAttempt.percentage}%)
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {quizResult ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Grand Scorecard Banner */}
              <div
                style={{
                  padding: "24px 28px",
                  borderRadius: "16px",
                  background: quizResult.passed
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 100%)"
                    : "linear-gradient(135deg, rgba(244, 63, 94, 0.18) 0%, rgba(225, 29, 72, 0.08) 100%)",
                  border: quizResult.passed
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid rgba(244, 63, 94, 0.4)",
                  boxShadow: quizResult.passed
                    ? "0 10px 30px rgba(16, 185, 129, 0.12)"
                    : "0 10px 30px rgba(244, 63, 94, 0.12)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: quizResult.passed ? "#34D399" : "#FB7185",
                        fontWeight: "800",
                        letterSpacing: "0.8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Lock size={15} /> OFFICIAL PERMANENT TEST SCORECARD
                    </div>
                    <div
                      style={{
                        fontSize: "2.2rem",
                        fontWeight: "900",
                        color: "var(--text-primary)",
                        margin: "6px 0 2px 0",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      Score: {quizResult.score} / {quizResult.totalMarks}{" "}
                      <span
                        style={{
                          fontSize: "1.4rem",
                          color: quizResult.passed ? "#34D399" : "#FB7185",
                        }}
                      >
                        ({quizResult.percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Submitted At:{" "}
                      <strong>
                        {quizResult.createdAt
                          ? new Date(quizResult.createdAt).toLocaleString(
                              "en-IN",
                            )
                          : "Official Record"}
                      </strong>{" "}
                      • Permanently Recorded in Student Profile
                    </div>
                  </div>
                  <span
                    className={`badge ${quizResult.passed ? "badge-emerald" : "badge-rose"}`}
                    style={{
                      fontSize: "1rem",
                      padding: "8px 18px",
                      fontWeight: "900",
                      borderRadius: "10px",
                    }}
                  >
                    {quizResult.passed ? "🎉 PASSED" : "⚠️ NEEDS IMPROVEMENT"}
                  </span>
                </div>

                <div
                  style={{
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle
                    size={16}
                    style={{ color: "#34D399", flexShrink: 0 }}
                  />
                  <span>
                    Official Test Record Submitted. You have already completed
                    this practice assessment test. Your score is permanently
                    saved in your profile and visible to your course instructor.
                    Retakes are not permitted.
                  </span>
                </div>
              </div>

              {/* Questions Review in Locked Mode */}
              {mcqList.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "800",
                      marginBottom: "14px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Assessment Questions Review (Locked)
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {mcqList.map((mcq, idx) => (
                      <div
                        key={mcq._id}
                        style={{
                          padding: "16px 20px",
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "0.92rem",
                            marginBottom: "12px",
                            color: "var(--text-primary)",
                          }}
                        >
                          Q{idx + 1}. {mcq.questionText}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {mcq.options?.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-color)",
                                background: "rgba(255, 255, 255, 0.02)",
                                color: "var(--text-muted)",
                                fontSize: "0.85rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                opacity: 0.85,
                              }}
                            >
                              <span style={{ fontWeight: "700" }}>
                                {String.fromCharCode(65 + optIdx)})
                              </span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {quizErrorMsg && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.4)",
                    color: "#FB7185",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{quizErrorMsg}</span>
                </div>
              )}

              {isLoadingMcqs ? (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                  }}
                >
                  Loading quiz questions...
                </div>
              ) : mcqList.length === 0 ? (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "12px",
                    border: "1px dashed var(--border-color)",
                  }}
                >
                  No MCQ practice questions published for your enrolled courses
                  right now.
                </div>
              ) : (
                <form
                  onSubmit={handleQuizSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  {mcqList.map((mcq, idx) => (
                    <div
                      key={mcq._id}
                      style={{
                        padding: "18px 22px",
                        borderRadius: "14px",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "0.98rem",
                          marginBottom: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        Q{idx + 1}. {mcq.questionText}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {mcq.options?.map((opt, optIdx) => {
                          const isSelected =
                            selectedAnswers[mcq._id] === optIdx;

                          return (
                            <label
                              key={optIdx}
                              onClick={() =>
                                handleSelectQuizOption(mcq._id, optIdx)
                              }
                              style={{
                                padding: "10px 16px",
                                borderRadius: "10px",
                                border: isSelected
                                  ? "1px solid #818CF8"
                                  : "1px solid var(--border-color)",
                                background: isSelected
                                  ? "rgba(99, 102, 241, 0.15)"
                                  : "rgba(255, 255, 255, 0.02)",
                                color: isSelected
                                  ? "#818CF8"
                                  : "var(--text-primary)",
                                fontSize: "0.88rem",
                                fontWeight: isSelected ? "700" : "normal",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <input
                                type="radio"
                                name={`question_${mcq._id}`}
                                checked={isSelected}
                                onChange={() => {}}
                              />
                              <span>
                                {String.fromCharCode(65 + optIdx)}) {opt}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmittingQuiz}
                    style={{
                      padding: "12px 24px",
                      fontSize: "0.92rem",
                      fontWeight: "800",
                      borderRadius: "10px",
                      width: "fit-content",
                    }}
                  >
                    {isSubmittingQuiz
                      ? "Evaluating Answers..."
                      : "Submit Quiz Answers"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SUBMIT DUAL KYC DOCUMENT SCANS (AADHAAR & PAN TOGETHER) */}
      {activeTab === "KYC" && (
        <div
          className="glass-card"
          style={{
            padding: "24px 28px",
            borderRadius: "18px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ marginBottom: "18px" }}>
            <span
              className="badge badge-emerald"
              style={{ fontSize: "0.72rem", padding: "3px 8px" }}
            >
              STUDENT IDENTITY VERIFICATION ENGINE
            </span>
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: "800",
                margin: "4px 0 2px 0",
              }}
            >
              Submit Aadhaar & PAN Card Document Scans
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Upload both government documents together in a single step for
              1-click Admin verification approval.
            </p>
          </div>

          {stats?.kycStatus === "REJECTED" && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: "rgba(244,63,94,0.15)",
                border: "1px solid rgba(244,63,94,0.4)",
                color: "#FB7185",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "0.9rem",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={18} /> ❌ Your Previous KYC Verification Was
                Rejected by Super Admin
              </div>
              <div
                style={{
                  fontSize: "0.84rem",
                  color: "#FFF",
                  fontWeight: "700",
                  background: "rgba(0,0,0,0.2)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #FB7185",
                  marginTop: "6px",
                }}
              >
                Rejection Reason: "
                {stats?.kycRejectionReason ||
                  "Aadhaar / PAN document image scan details did not match government database."}
                "
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginTop: "8px",
                }}
              >
                💡 Please correct the issue noted above and upload clean HD
                scans of your Aadhaar and PAN cards below to re-submit for
                approval.
              </div>
            </div>
          )}

          {kycSuccessMsg && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#34D399",
                fontSize: "0.86rem",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              {kycSuccessMsg}
            </div>
          )}

          {kycErrorMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(244,63,94,0.15)",
                border: "1px solid rgba(244,63,94,0.4)",
                color: "#FB7185",
                fontSize: "0.84rem",
                fontWeight: "600",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={16} />
              <span>{kycErrorMsg}</span>
            </div>
          )}

          <form
            onSubmit={handleKycSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {/* CARD 1: AADHAAR CARD DETAILS */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    color: "#34D399",
                  }}
                >
                  <span>🪪 1. Government Aadhaar Card (12-Digit)</span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Aadhaar ID Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={aadhaarNumInput}
                    onChange={(e) => setAadhaarNumInput(e.target.value)}
                    placeholder="e.g. 9900 1234 5678"
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.85rem",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Upload Aadhaar Card HD Image Scan *
                    </label>
                    <span
                      className="badge badge-amber"
                      style={{ fontSize: "0.65rem", padding: "1px 5px" }}
                    >
                      MAX: 2MB
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAadhaarFileChange}
                    className="form-input"
                    style={{
                      padding: "6px 10px",
                      fontSize: "0.8rem",
                      width: "100%",
                    }}
                  />

                  {aadhaarPreview && (
                    <div
                      style={{
                        marginTop: "10px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        height: "110px",
                        background: "rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={aadhaarPreview}
                        alt="Aadhaar Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: PAN CARD DETAILS */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    color: "#818CF8",
                  }}
                >
                  <span>💳 2. PAN Card (10-Digit Alpha-Numeric)</span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    PAN Card Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={panNumInput}
                    onChange={(e) => setPanNumInput(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.85rem",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Upload PAN Card HD Image Scan *
                    </label>
                    <span
                      className="badge badge-amber"
                      style={{ fontSize: "0.65rem", padding: "1px 5px" }}
                    >
                      MAX: 2MB
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePanFileChange}
                    className="form-input"
                    style={{
                      padding: "6px 10px",
                      fontSize: "0.8rem",
                      width: "100%",
                    }}
                  />

                  {panPreview && (
                    <div
                      style={{
                        marginTop: "10px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                        height: "110px",
                        background: "rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={panPreview}
                        alt="PAN Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-emerald"
              disabled={isSubmittingKyc}
              style={{
                padding: "12px 22px",
                fontSize: "0.92rem",
                fontWeight: "800",
                width: "fit-content",
              }}
            >
              {isSubmittingKyc
                ? "Uploading Documents..."
                : "🚀 Submit Both Aadhaar & PAN Scans for Verification"}
            </button>
          </form>
        </div>
      )}

            {/* SUB-TAB: MY PURCHASES (course statement) */}
      {activeTab === "PURCHASES" && (
        <div
          className="glass-card"
          style={{ padding: "20px", borderRadius: "16px" }}
        >
          <h3
            style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 4px" }}
          >
            My Purchase Statement
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              margin: "0 0 16px",
            }}
          >
            Aapne kaun-kaun se courses kharide, kis teacher se, kab aur kitne
            paise mein.
          </p>
          <RevenueStatement
            apiUrl="/student/purchase-statement"
            mode="STUDENT"
          />
        </div>
      )}

      {/* WALLET TOP-UP MODAL */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
              padding: "20px 24px",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                >
                  STUDENT WALLET RECHARGE
                </span>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    marginTop: "2px",
                  }}
                >
                  Top-Up Student Wallet
                </h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {topUpSuccessMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  marginBottom: "14px",
                }}
              >
                {topUpSuccessMsg}
              </div>
            )}

            {topUpErrorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={15} />
                <span>{topUpErrorMsg}</span>
              </div>
            )}

            <form
              onSubmit={handleTopUpSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Select Preset Amount or Enter Custom Amount (₹) *
                </label>
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "8px" }}
                >
                  {["500", "1000", "2500", "5000"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmountInput(amt)}
                      className={
                        topUpAmountInput === amt
                          ? "btn-emerald"
                          : "btn-secondary"
                      }
                      style={{ flex: 1, padding: "6px", fontSize: "0.78rem" }}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-input"
                  value={topUpAmountInput}
                  onChange={(e) => setTopUpAmountInput(e.target.value)}
                  placeholder="2500"
                  style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTopUpModal(false)}
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-emerald"
                  disabled={isSubmittingTopUp}
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  {isSubmittingTopUp ? "Recharging..." : "Confirm Top-Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT WITHDRAWAL REQUEST MODAL */}
      {showWithdrawModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "490px",
              padding: "22px 24px",
              borderRadius: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    fontWeight: "800",
                  }}
                >
                  REFER & EARN CASHOUT
                </span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: "var(--text-primary)",
                  }}
                >
                  Withdraw Referral Commissions
                </h3>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Withdrawable Referral Balance Card */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.28)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#34D399",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    WITHDRAWABLE REFERRAL EARNINGS
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "900",
                      color: "var(--text-primary)",
                      margin: "2px 0",
                    }}
                  >
                    ₹{" "}
                    {(stats?.withdrawableBalance !== undefined
                      ? stats.withdrawableBalance
                      : 0
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#94A3B8",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  Min Payout: ₹50
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Course Top-up Balance (Non-withdrawable):</span>
                <strong style={{ color: "var(--text-primary)" }}>
                  ₹ {(stats?.purchaseBalance || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {/* Explanatory Financial Notice */}
            <div
              style={{
                padding: "9px 12px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.22)",
                marginBottom: "14px",
                fontSize: "0.76rem",
                color: "#93C5FD",
                lineHeight: 1.45,
              }}
            >
              💡 <strong>Note:</strong> Aap sirf <strong>Refer & Earn</strong>{" "}
              aur MLM network se kamaya hua commission Bank ya UPI me withdraw
              kar sakte hain. Course purchase ke liye add kiya gaya balance
              course buy karne ke liye use hota hai.
            </div>

            {withdrawSuccessMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  marginBottom: "14px",
                }}
              >
                {withdrawSuccessMsg}
              </div>
            )}

            {withdrawErrorMsg && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={15} />
                <span>{withdrawErrorMsg}</span>
              </div>
            )}

            <form
              onSubmit={handleWithdrawSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Withdrawal Amount Input */}
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Enter Referral Amount to Withdraw (₹) *
                </label>
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "6px" }}
                >
                  {["50", "100", "500", "1000"].map((amt) => {
                    const disabled =
                      (stats?.withdrawableBalance || 0) < Number(amt);
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmountInput(amt)}
                        disabled={disabled}
                        className={
                          withdrawAmountInput === amt
                            ? "btn-emerald"
                            : "btn-secondary"
                        }
                        style={{
                          flex: 1,
                          padding: "5px",
                          fontSize: "0.76rem",
                          opacity: disabled ? 0.35 : 1,
                        }}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setWithdrawAmountInput(
                        String(stats?.withdrawableBalance || 0),
                      )
                    }
                    disabled={(stats?.withdrawableBalance || 0) < 50}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "0.76rem",
                      fontWeight: "800",
                      opacity:
                        (stats?.withdrawableBalance || 0) < 50 ? 0.35 : 1,
                    }}
                  >
                    All
                  </button>
                </div>
                <input
                  type="number"
                  className="form-input"
                  value={withdrawAmountInput}
                  onChange={(e) => setWithdrawAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                  min="50"
                  max={
                    stats?.withdrawableBalance !== undefined
                      ? stats.withdrawableBalance
                      : 0
                  }
                  style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                />
              </div>

              {/* Payout Method Toggle */}
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Select Payout Destination *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("BANK")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border:
                        payoutMethod === "BANK"
                          ? "2px solid var(--primary-accent)"
                          : "1px solid var(--border-color)",
                      background:
                        payoutMethod === "BANK"
                          ? "rgba(99, 102, 241, 0.12)"
                          : "var(--bg-surface)",
                      color:
                        payoutMethod === "BANK"
                          ? "var(--primary-accent)"
                          : "var(--text-secondary)",
                      fontWeight: "800",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Building2 size={16} /> Direct Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("UPI")}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border:
                        payoutMethod === "UPI"
                          ? "2px solid #34D399"
                          : "1px solid var(--border-color)",
                      background:
                        payoutMethod === "UPI"
                          ? "rgba(16, 185, 129, 0.12)"
                          : "var(--bg-surface)",
                      color:
                        payoutMethod === "UPI"
                          ? "#34D399"
                          : "var(--text-secondary)",
                      fontWeight: "800",
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <Smartphone size={16} /> Instant UPI ID
                  </button>
                </div>
              </div>

              {/* Bank Transfer Inputs */}
              {payoutMethod === "BANK" && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                          display: "block",
                        }}
                      >
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value)}
                        placeholder="Name on Passbook"
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                          display: "block",
                        }}
                      >
                        Bank Name
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. SBI, HDFC, ICICI"
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                          display: "block",
                        }}
                      >
                        Account Number *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Account Number"
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                          display: "block",
                        }}
                      >
                        Confirm Account Number *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={bankAccountConfirm}
                        onChange={(e) => setBankAccountConfirm(e.target.value)}
                        placeholder="Re-enter Number"
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                        display: "block",
                      }}
                    >
                      IFSC Code * (11 Alphanumeric)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={bankIfscCode}
                      onChange={(e) =>
                        setBankIfscCode(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.82rem",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {payoutMethod === "UPI" && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                        display: "block",
                      }}
                    >
                      UPI ID / VPA *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="username@okhdfcbank or mobile@upi"
                      style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        marginBottom: "2px",
                        display: "block",
                      }}
                    >
                      Registered Name on UPI
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={upiNameInput}
                      onChange={(e) => setUpiNameInput(e.target.value)}
                      placeholder={user?.name || "Your Full Name"}
                      style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  marginTop: "2px",
                }}
              >
                <input
                  type="checkbox"
                  checked={saveAsDefaultPayout}
                  onChange={(e) => setSaveAsDefaultPayout(e.target.checked)}
                />
                Save as default withdrawal method for next time
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-emerald"
                  disabled={isSubmittingWithdraw}
                  style={{
                    padding: "8px 18px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                  }}
                >
                  {isSubmittingWithdraw
                    ? "Submitting..."
                    : "Submit Withdrawal Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE DETAILS INSPECTION MODAL */}
      {selectedCourseDetail &&
        (() => {
          const isDetailEnrolled = enrolledCourses.some(
            (e) => e._id === selectedCourseDetail._id,
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
            <div
              className="modal-overlay"
              onClick={() => setSelectedCourseDetail(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "720px",
                  padding: "24px 28px",
                  borderRadius: "20px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        className="badge badge-primary"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        {selectedCourseDetail.subjectName || "All Subjects"}
                      </span>
                      <span
                        className={
                          selectedCourseDetail.courseMode === "LIVE_ONLINE"
                            ? "badge badge-rose"
                            : "badge badge-emerald"
                        }
                        style={{
                          fontSize: "0.68rem",
                          padding: "2px 8px",
                          fontWeight: "800",
                        }}
                      >
                        {selectedCourseDetail.courseMode === "LIVE_ONLINE"
                          ? "🔴 LIVE ONLINE"
                          : selectedCourseDetail.courseMode === "RECORDED_VIDEO"
                            ? "📹 RECORDED"
                            : "⚡ HYBRID"}
                      </span>
                      <span
                        className="badge badge-amber"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        State: {selectedCourseDetail.stateCode || "GLOBAL"}
                      </span>
                      {isDetailEnrolled && (
                        <span
                          className="badge badge-emerald"
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 8px",
                            fontWeight: "800",
                          }}
                        >
                          ✅ YOU ARE ENROLLED
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: "800",
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      {selectedCourseDetail.title}
                    </h3>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      By{" "}
                      <strong style={{ color: "#F59E0B" }}>
                        {selectedCourseDetail.instructor?.name ||
                          "AllianceECFaculty"}
                      </strong>{" "}
                      •{" "}
                      {selectedCourseDetail.boardOrGrade ||
                        "Comprehensive Batch"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCourseDetail(null)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Banner Image */}
                {selectedCourseDetail.thumbnail && (
                  <div
                    style={{
                      marginBottom: "16px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      background: "rgba(0, 0, 0, 0.04)",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      maxHeight: "260px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={selectedCourseDetail.thumbnail}
                      alt={selectedCourseDetail.title || "Course Banner"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {/* Description */}
                <div
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedCourseDetail.description ||
                    "Interactive live sessions with top faculty, doubt resolution & lecture recordings."}
                </div>

                {/* 1. DELIVERABLES / PACKAGE INCLUSIONS GRID */}
                <div
                  style={{
                    background: "rgba(16,185,129,0.05)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    border: "1px solid rgba(16,185,129,0.2)",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: "800",
                      color: "#34D399",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Sparkles size={14} /> Course Deliverables & Inclusions
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(110px, 1fr))",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#818CF8",
                        }}
                      >
                        {totalLecturesCount}+
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Video Lectures
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#F59E0B",
                        }}
                      >
                        {totalMaterialsCount}+
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        PDFs & Notes
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#EC4899",
                        }}
                      >
                        {totalTestsCount}+
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Mock Tests
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#34D399",
                        }}
                      >
                        {selectedCourseDetail.inclusions?.totalHours || 45}+ hrs
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Total Hours
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "#06B6D4",
                        }}
                      >
                        {selectedCourseDetail.inclusions?.hasLifetimeAccess
                          ? "Lifetime"
                          : "365 Days"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Validity Access
                      </div>
                    </div>
                  </div>

                  {/* Perks Checklist */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      fontSize: "0.72rem",
                    }}
                  >
                    {selectedCourseDetail.inclusions?.hasCertificate !==
                      false && (
                      <span
                        className="badge badge-emerald"
                        style={{ padding: "3px 8px" }}
                      >
                        <CheckCircle size={12} /> Certificate of Completion
                      </span>
                    )}
                    {selectedCourseDetail.inclusions?.hasDoubtSupport !==
                      false && (
                      <span
                        className="badge badge-primary"
                        style={{ padding: "3px 8px" }}
                      >
                        <CheckCircle size={12} /> 1-on-1 Faculty Doubt Support
                      </span>
                    )}
                    {selectedCourseDetail.inclusions?.hasDownloadableNotes !==
                      false && (
                      <span
                        className="badge badge-amber"
                        style={{ padding: "3px 8px" }}
                      >
                        <CheckCircle size={12} /> Downloadable Summary Sheets
                      </span>
                    )}
                    <span
                      className="badge badge-rose"
                      style={{ padding: "3px 8px" }}
                    >
                      <CheckCircle size={12} /> High-Yield Revision Maps
                    </span>
                  </div>
                </div>

                {/* 2. MULTI-DOCUMENT STUDY MATERIALS & E-BOOKS SECTION */}
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        color: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <BookOpen size={16} /> Attached Study Materials & E-Books
                      (
                      {selectedCourseDetail.studyMaterials?.length ||
                        (selectedCourseDetail.ebookPdfUrl ? 1 : 0)}
                      )
                    </div>
                    <span
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {isDetailEnrolled
                        ? "✅ Instant Download Access"
                        : "🔒 Unlocks Upon Enrollment"}
                    </span>
                  </div>

                  {selectedCourseDetail.studyMaterials &&
                  selectedCourseDetail.studyMaterials.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {selectedCourseDetail.studyMaterials.map(
                        (doc, docIdx) => {
                          const typeBadgeBg =
                            doc.docType === "PDF"
                              ? "#EF4444"
                              : doc.docType === "DOC"
                                ? "#3B82F6"
                                : doc.docType === "NOTES"
                                  ? "#F59E0B"
                                  : "#8B5CF6";

                          return (
                            <div
                              key={docIdx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "var(--bg-card)",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                border: "1px solid var(--border-color)",
                                gap: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <span
                                  style={{
                                    background: typeBadgeBg,
                                    color: "#FFF",
                                    fontSize: "0.66rem",
                                    fontWeight: "800",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {doc.docType || "PDF"}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: "700",
                                      color: "var(--text-primary)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {doc.title}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      marginTop: "2px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "#818CF8",
                                        background: "rgba(129, 140, 248, 0.1)",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      #{doc.topic || "General"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                {isDetailEnrolled ? (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary"
                                    style={{
                                      fontSize: "0.74rem",
                                      padding: "5px 12px",
                                      color: "#FBBF24",
                                      textDecoration: "none",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    <Download size={13} /> View / Download{" "}
                                    <ExternalLink size={11} />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEnrollSubmit(selectedCourseDetail)
                                    }
                                    style={{
                                      background: "rgba(245, 158, 11, 0.12)",
                                      color: "#F59E0B",
                                      border:
                                        "1px solid rgba(245, 158, 11, 0.3)",
                                      padding: "5px 10px",
                                      borderRadius: "6px",
                                      fontSize: "0.72rem",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Lock size={12} /> Unlock
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : selectedCourseDetail.ebookTitle ||
                    selectedCourseDetail.ebookPdfUrl ? (
                    <div
                      style={{
                        background: "var(--bg-card)",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          {selectedCourseDetail.ebookTitle ||
                            "Comprehensive Study Notes & Summary Guide"}
                        </div>
                        <span
                          className="badge badge-amber"
                          style={{ fontSize: "0.66rem", marginTop: "3px" }}
                        >
                          PDF Document
                        </span>
                      </div>
                      {isDetailEnrolled && selectedCourseDetail.ebookPdfUrl ? (
                        <a
                          href={selectedCourseDetail.ebookPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{
                            fontSize: "0.74rem",
                            padding: "5px 12px",
                            color: "#FBBF24",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Download size={13} /> Download PDF{" "}
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Available upon Enrollment
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        padding: "12px",
                      }}
                    >
                      Curated class notes and lecture handouts are provided
                      during sessions.
                    </div>
                  )}
                </div>

                {/* 3. TOPIC-WISE MOCK TESTS & QUIZZES SECTION */}
                {selectedCourseDetail.mockTests &&
                  selectedCourseDetail.mockTests.length > 0 && (
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid var(--border-color)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "800",
                            color: "#EC4899",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FileText size={16} /> Topic-Wise Mock Tests & Quizzes
                          ({selectedCourseDetail.mockTests.length})
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Chapter-wise practice & scorecards
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {selectedCourseDetail.mockTests.map((test, tIdx) => {
                          const isExpanded = expandedStudentTestIdx === tIdx;
                          const hasQuestions =
                            test.questions && test.questions.length > 0;

                          return (
                            <div
                              key={tIdx}
                              style={{
                                background: "var(--bg-card)",
                                borderRadius: "10px",
                                border: "1px solid var(--border-color)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 14px",
                                  gap: "10px",
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: "700",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    {test.title}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "6px",
                                      marginTop: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "#EC4899",
                                        background: "rgba(236, 72, 153, 0.1)",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      #{test.topic || "All Topics"}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "var(--text-secondary)",
                                        background: "var(--bg-surface)",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      ⏱️ {test.durationMinutes || 30} Mins
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "var(--text-secondary)",
                                        background: "var(--bg-surface)",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      ❓{" "}
                                      {test.questions &&
                                      test.questions.length > 0
                                        ? test.questions.length
                                        : test.totalQuestions || 10}{" "}
                                      Questions
                                    </span>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {test.testUrl && (
                                    <a
                                      href={test.testUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-secondary"
                                      style={{
                                        fontSize: "0.74rem",
                                        color: "#3B82F6",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        textDecoration: "none",
                                        padding: "4px 10px",
                                      }}
                                    >
                                      <ExternalLink size={12} /> Open Test
                                    </a>
                                  )}

                                  {hasQuestions && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedStudentTestIdx(
                                          isExpanded ? null : tIdx,
                                        )
                                      }
                                      className="btn-secondary"
                                      style={{
                                        fontSize: "0.72rem",
                                        padding: "4px 8px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp size={13} />
                                      ) : (
                                        <ChevronDown size={13} />
                                      )}
                                      {isExpanded
                                        ? "Hide"
                                        : `Preview Questions (${test.questions?.length})`}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Expanded Questions View for Students */}
                              {isExpanded && hasQuestions && (
                                <div
                                  style={{
                                    borderTop: "1px solid var(--border-color)",
                                    background: "var(--bg-surface)",
                                    padding: "10px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  {test.questions!.map((q, qIndex) => {
                                    const letters = ["A", "B", "C", "D"];
                                    return (
                                      <div
                                        key={qIndex}
                                        style={{
                                          background: "var(--bg-card)",
                                          padding: "8px 10px",
                                          borderRadius: "8px",
                                          border:
                                            "1px solid var(--border-color)",
                                          fontSize: "0.74rem",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: "700",
                                            marginBottom: "4px",
                                            color: "var(--text-primary)",
                                          }}
                                        >
                                          Q{qIndex + 1}. {q.questionText}
                                        </div>
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "repeat(auto-fit, minmax(130px, 1fr))",
                                            gap: "4px",
                                            margin: "4px 0",
                                          }}
                                        >
                                          {q.options.map((opt, optIndex) => {
                                            const isCorrect =
                                              isDetailEnrolled &&
                                              (q.correctOption === optIndex ||
                                                Number(q.correctOption) ===
                                                  optIndex);
                                            return (
                                              <span
                                                key={optIndex}
                                                style={{
                                                  padding: "2px 6px",
                                                  borderRadius: "4px",
                                                  background: isCorrect
                                                    ? "rgba(16, 185, 129, 0.15)"
                                                    : "var(--bg-surface)",
                                                  border: isCorrect
                                                    ? "1px solid #10B981"
                                                    : "1px solid var(--border-color)",
                                                  color: isCorrect
                                                    ? "#10B981"
                                                    : "var(--text-secondary)",
                                                  fontWeight: isCorrect
                                                    ? "700"
                                                    : "400",
                                                }}
                                              >
                                                {letters[optIndex]}. {opt}{" "}
                                                {isCorrect ? "✓" : ""}
                                              </span>
                                            );
                                          })}
                                        </div>
                                        {isDetailEnrolled && q.explanation && (
                                          <div
                                            style={{
                                              color: "var(--text-muted)",
                                              fontSize: "0.68rem",
                                              marginTop: "2px",
                                              fontStyle: "italic",
                                            }}
                                          >
                                            💡 Explanation: {q.explanation}
                                          </div>
                                        )}
                                        {!isDetailEnrolled && (
                                          <div
                                            style={{
                                              color: "var(--text-muted)",
                                              fontSize: "0.66rem",
                                              marginTop: "2px",
                                            }}
                                          >
                                            🔒 Enroll to view correct answer
                                            keys & full step-by-step solutions
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 4. SYLLABUS TOPICS COVERED */}
                {selectedCourseDetail.syllabusTopics &&
                  selectedCourseDetail.syllabusTopics.length > 0 && (
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: "800",
                          color: "#818CF8",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Layers size={14} /> Syllabus Topics Covered (
                        {selectedCourseDetail.syllabusTopics.length})
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {selectedCourseDetail.syllabusTopics.map(
                          (topic, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: "4px 9px",
                                borderRadius: "20px",
                                background: "rgba(99, 102, 241, 0.12)",
                                border: "1px solid rgba(99, 102, 241, 0.25)",
                                color: "#A5B4FC",
                                fontSize: "0.73rem",
                                fontWeight: "600",
                              }}
                            >
                              #{topic}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* 5. LIVE SCHEDULE & CLASSROOM ACCESS */}
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: "800",
                      color: "#34D399",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Radio size={14} className="animate-pulse" /> Live Classroom
                    Schedule & Direct Access
                  </div>
                  {selectedCourseDetail.liveSchedule && (
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#34D399",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Calendar size={13} /> <strong>Class Timing:</strong>{" "}
                      {selectedCourseDetail.liveSchedule}
                    </div>
                  )}
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {isDetailEnrolled ? (
                      <>
                        <a
                          href={
                            selectedCourseDetail.liveMeetingUrl ||
                            "https://meet.google.com/eduverse-live-class"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-emerald"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.8rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontWeight: "800",
                            borderRadius: "10px",
                          }}
                        >
                          <Radio size={14} className="animate-pulse" /> 🔴 Join
                          Live Class Now
                        </a>

                        <a
                          href={
                            selectedCourseDetail.lectureVideoUrl ||
                            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.8rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            borderRadius: "10px",
                          }}
                        >
                          <Video size={14} /> 📹 Watch Video Lectures
                        </a>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        🔒 Live meeting link & lecture videos unlock upon
                        enrollment.
                      </span>
                    )}

                    {selectedCourseDetail.demoVideoUrl && (
                      <a
                        href={selectedCourseDetail.demoVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{
                          padding: "8px 14px",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          borderRadius: "10px",
                        }}
                      >
                        <Play size={14} /> Free Demo Preview
                      </a>
                    )}
                  </div>
                </div>

                {/* 6. CURRICULUM MODULES BREAKDOWN */}
                {selectedCourseDetail.curriculum &&
                  selectedCourseDetail.curriculum.length > 0 && (
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: "800",
                          color: "#F59E0B",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Layers size={14} /> Course Curriculum Breakdown (
                        {selectedCourseDetail.curriculum.length} Chapters)
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {selectedCourseDetail.curriculum.map((mod, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid var(--border-color)",
                              fontSize: "0.78rem",
                            }}
                          >
                            <span style={{ fontWeight: "600" }}>
                              {idx + 1}. {mod.title}
                            </span>
                            <span
                              className="badge badge-primary"
                              style={{
                                fontSize: "0.65rem",
                                padding: "1px 6px",
                              }}
                            >
                              {mod.lectureCount || 1} Lectures
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Modal Actions Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "12px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Special Enrollment Fee:
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.35rem",
                          fontWeight: "900",
                          color: "#34D399",
                        }}
                      >
                        ₹{selectedCourseDetail.price}
                      </span>
                      {selectedCourseDetail.originalPrice >
                        selectedCourseDetail.price && (
                        <>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              textDecoration: "line-through",
                            }}
                          >
                            ₹{selectedCourseDetail.originalPrice}
                          </span>
                          <span
                            className="badge badge-emerald"
                            style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                          >
                            {Math.round(
                              ((selectedCourseDetail.originalPrice -
                                selectedCourseDetail.price) /
                                selectedCourseDetail.originalPrice) *
                                100,
                            )}
                            % OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedCourseDetail(null)}
                      style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                    >
                      Close
                    </button>

                    {isDetailEnrolled ? (
                      <button
                        type="button"
                        className="btn-emerald"
                        onClick={() => {
                          setSelectedCourseDetail(null);
                          setActiveTab("MY_CLASSES");
                        }}
                        style={{
                          padding: "8px 18px",
                          fontSize: "0.82rem",
                          fontWeight: "800",
                        }}
                      >
                        Go to My Classroom →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleEnrollSubmit(selectedCourseDetail)}
                        disabled={
                          enrollingCourseId === selectedCourseDetail._id
                        }
                        style={{
                          padding: "8px 18px",
                          fontSize: "0.82rem",
                          fontWeight: "800",
                        }}
                      >
                        {enrollingCourseId === selectedCourseDetail._id
                          ? "Enrolling..."
                          : `1-Click Enroll (₹${selectedCourseDetail.price})`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ENROLLED COURSE: RICH STUDY CONTENT POPUP */}
      {contentCourse && (
        <div className="modal-overlay" onClick={() => setContentCourse(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "900px",
              width: "95%",
              padding: "22px 24px",
              borderRadius: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                gap: "12px",
              }}
            >
              <div>
                <span
                  className="badge badge-rose"
                  style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                >
                  STUDY CONTENT
                </span>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    margin: "4px 0 0 0",
                  }}
                >
                  {contentCourse.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setContentCourse(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <CourseRichContentViewer courseId={contentCourse._id} />
          </div>
        </div>
      )}

      {/* 6-Level Student Goal Preference Modal */}
      <StudentPreferenceModal
        isOpen={showPreferenceModal}
        onClose={() => setShowPreferenceModal(false)}
        onSaved={handlePreferenceSaved}
        initialStateCode={
          currentUserObj?.learningPreference?.stateCode || "GLOBAL"
        }
        initialCategoryCode={
          currentUserObj?.learningPreference?.categoryCode || "SCHOOL_K12"
        }
        initialSubCategory={
          currentUserObj?.learningPreference?.subCategory || ""
        }
      />

      {/* ACTIVE VIDEO AD POPUP MODAL */}
      {activeVideoAdModal && (
        <div
          className="modal-overlay"
          onClick={() => setActiveVideoAdModal(null)}
          style={{ zIndex: 10080 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "680px",
              padding: "20px",
              borderRadius: "18px",
              background: "#0B1120",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  className="badge badge-rose"
                  style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                >
                  SPONSORED VIDEO
                </span>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "#FFF",
                  }}
                >
                  {activeVideoAdModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoAdModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                background: "#020617",
                textAlign: "center",
                maxHeight: "380px",
              }}
            >
              <video
                src={activeVideoAdModal.mediaUrl}
                controls
                autoPlay
                style={{ width: "100%", maxHeight: "380px" }}
              />
            </div>

            {activeVideoAdModal.description && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "0.84rem",
                  color: "#CBD5E1",
                  lineHeight: 1.5,
                }}
              >
                {activeVideoAdModal.description}
              </p>
            )}

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #1E293B",
              }}
            >
              <div>
                {activeVideoAdModal.targetUrl && (
                  <a
                    href={activeVideoAdModal.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                      fontWeight: "800",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      background:
                        "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                      border: "none",
                      color: "#FFF",
                    }}
                  >
                    Visit Offer Page <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <button
                className="btn-secondary"
                onClick={() => setActiveVideoAdModal(null)}
                style={{ padding: "7px 16px", fontSize: "0.82rem" }}
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
