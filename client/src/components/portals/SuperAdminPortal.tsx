import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  FileCheck,
  DollarSign,
  Megaphone,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Search,
  X,
  Trash2,
  Edit3,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Share2,
  UploadCloud,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Tv,
  Play,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Save,
  Percent,
  Gift,
  Shield,
  SlidersHorizontal,
  Zap,
  Building2,
  Smartphone,
  Copy,
  Check,
  Trophy,
} from "lucide-react";
import {
  INDIAN_STATES_LIST,
  CORE_MODULES_LIST,
  getSubCategoriesForModuleAndState,
} from "../../services/taxonomyTree";
import {
  fetchAdminWithdrawals,
  approveAdminWithdrawal,
  rejectAdminWithdrawal,
  WithdrawalRequestRecord,
} from "../../services/withdrawalService";
import {
  fetchAdminStats,
  fetchAdminUsers,
  bulkCreateAdminUsers,
  toggleBlockUser,
  fetchAdminCourses,
  createAdminCourse,
  bulkCreateAdminCourses,
  uploadAdminCourseThumbnail,
  toggleCourseActive,
  updateAdminCourse,
  deleteAdminCourse,
  fetchCourseEnrolledStudents,
  EnrolledStudentRecord,
  fetchPendingKYC,
  verifyKYCDocument,
  fetchPendingPayouts,
  AdminStats,
  UserRecord,
  CourseRecord,
  CourseInclusions,
  CourseCurriculumItem,
  CourseStudyMaterialItem,
  CourseMockTestItem,
  CourseRichContentItem,
  KYCRecord,
  PayoutRecord,
} from "../../services/adminService";
import {
  executeBinaryPayoutSettlement,
  fetchMlmConfig,
  updateMlmConfig,
  MlmConfigRecord,
} from "../../services/affiliateService";
import {
  fetchAdminAds,
  createAd,
  updateAd,
  toggleAdActive,
  deleteAd,
  AdRecord,
  AdStats,
} from "../../services/adService";
import { CourseCreationWizardModal } from "../CourseCreationWizardModal";
import { RevenueStatement } from "../RevenueStatement";
import { MlmLeaderboard } from "../MlmLeaderboard";

interface SuperAdminPortalProps {
  onCheckBackendHealth?: () => void;
  backendUptime?: string;
  dbStatus?: string;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  backendUptime = "Online",
  dbStatus = "CONNECTED",
}) => {
  const [activeTab, setActiveTab] = useState<
    | "ANALYTICS"
    | "USERS"
    | "COURSES"
    | "KYC"
    | "PAYOUTS"
    | "REVENUE"
    | "LEADERBOARD"
    | "ANNOUNCEMENTS"
    | "ADS"
  >("ANALYTICS");

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Users Directory State
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userStateFilter, setUserStateFilter] = useState("");
  const [userKycFilter, setUserKycFilter] = useState("");
  const [userBoardFilter, setUserBoardFilter] = useState("");
  const [userSubjectFilter, setUserSubjectFilter] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] =
    useState<UserRecord | null>(null);
  const [userDirectoryPage, setUserDirectoryPage] = useState(1);
  const [userDirectorySortBy, setUserDirectorySortBy] = useState("-createdAt");
  const [userPaginationMeta, setUserPaginationMeta] = useState<{
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Courses Directory State
  const [coursesList, setCoursesList] = useState<CourseRecord[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] =
    useState<CourseRecord | null>(null);
  const [selectedCourseRoster, setSelectedCourseRoster] = useState<{
    course: any;
    enrolledStudents: EnrolledStudentRecord[];
  } | null>(null);

  const handleInspectCourseRoster = async (courseId: string) => {
    const res = await fetchCourseEnrolledStudents(courseId);
    if (res.success && res.data) {
      setSelectedCourseRoster({
        course: res.data.course,
        enrolledStudents: res.data.enrolledStudents || [],
      });
    }
  };
  const [courseDirectoryPage, setCourseDirectoryPage] = useState(1);
  const [courseDirectorySortBy, setCourseDirectorySortBy] =
    useState("-createdAt");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseModeFilter, setCourseModeFilter] = useState("");
  const [coursePaginationMeta, setCoursePaginationMeta] = useState<{
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Bulk Course Upload State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkFileName, setBulkFileName] = useState("");
  const [parsedBulkCourses, setParsedBulkCourses] = useState<
    Array<{
      title: string;
      price: number;
      originalPrice: number;
      stateCode: string;
      categoryCode: string;
      subCategory: string;
      boardOrGrade?: string;
      stream?: string;
      subjectName?: string;
      courseMode: "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID";
      liveMeetingUrl?: string;
      lectureVideoUrl?: string;
      description?: string;
      validityDays?: number;
      thumbnail?: string;
      isValid: boolean;
      errors: string[];
    }>
  >([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    successCount: number;
    failCount: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const [bulkUploadError, setBulkUploadError] = useState("");

  // Bulk User Upload State
  const [showBulkUserUploadModal, setShowBulkUserUploadModal] = useState(false);
  const [bulkUserFileName, setBulkUserFileName] = useState("");
  const [parsedBulkUsers, setParsedBulkUsers] = useState<
    Array<{
      name: string;
      mobile: string;
      role: "STUDENT" | "TEACHER";
      email?: string;
      password?: string;
      stateCode?: string;
      categoryCode?: string;
      subCategory?: string;
      subCategoryTitle?: string;
      stream?: string;
      boardOrGrade?: string;
      subjectName?: string;
      referredBy?: string;
      isValid: boolean;
      errors: string[];
    }>
  >([]);
  const [isSubmittingUserBulk, setIsSubmittingUserBulk] = useState(false);
  const [bulkUserUploadResult, setBulkUserUploadResult] = useState<{
    successCount: number;
    failCount: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const [bulkUserUploadError, setBulkUserUploadError] = useState("");

  // Helper CSV parser & sample downloader
  const parseCSVToCourseObjects = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parseCSVLine = (textLine: string): string[] => {
      const result: string[] = [];
      let startValueIdx = 0;
      let inQuotes = false;
      for (let idx = 0; idx < textLine.length; idx++) {
        const c = textLine[idx];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === "," && !inQuotes) {
          let val = textLine.substring(startValueIdx, idx).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          result.push(val);
          startValueIdx = idx + 1;
        }
      }
      let lastVal = textLine.substring(startValueIdx).trim();
      if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
        lastVal = lastVal.substring(1, lastVal.length - 1).replace(/""/g, '"');
      }
      result.push(lastVal);
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, index) => {
        rowObj[h] = values[index] !== undefined ? values[index] : "";
      });

      const title =
        rowObj["title"] ||
        rowObj["coursetitle"] ||
        rowObj["course title"] ||
        "";
      const price = Number(
        rowObj["price"] || rowObj["offerprice"] || rowObj["offer price"] || 0,
      );
      const originalPrice = Number(
        rowObj["originalprice"] ||
          rowObj["mrp"] ||
          rowObj["original price"] ||
          price,
      );
      const stateCode = (
        rowObj["statecode"] ||
        rowObj["state"] ||
        "GLOBAL"
      ).toUpperCase();
      const categoryCode = (
        rowObj["categorycode"] ||
        rowObj["category"] ||
        "SCHOOL_K12"
      ).toUpperCase();
      const subCategory =
        rowObj["subcategory"] ||
        rowObj["exam"] ||
        rowObj["board"] ||
        "CLASS_10";
      const boardOrGrade = rowObj["boardorgrade"] || rowObj["subtitle"] || "";
      const stream = rowObj["stream"] || "";
      const subjectName =
        rowObj["subjectname"] || rowObj["subject"] || "All Subjects";
      const courseModeStr = (
        rowObj["coursemode"] ||
        rowObj["mode"] ||
        "RECORDED_VIDEO"
      ).toUpperCase();
      const courseMode = (
        ["LIVE_ONLINE", "RECORDED_VIDEO", "HYBRID"].includes(courseModeStr)
          ? courseModeStr
          : "RECORDED_VIDEO"
      ) as "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID";
      const liveMeetingUrl =
        rowObj["livemeetingurl"] ||
        rowObj["liveurl"] ||
        rowObj["zoomurl"] ||
        "";
      const lectureVideoUrl =
        rowObj["lecturevideourl"] ||
        rowObj["videourl"] ||
        rowObj["youtubeurl"] ||
        "";
      const description = rowObj["description"] || "";
      const validityDays = Number(
        rowObj["validitydays"] || rowObj["validity"] || 365,
      );
      const thumbnail = rowObj["thumbnail"] || rowObj["image"] || "";

      const rowErrors: string[] = [];
      if (!title.trim()) rowErrors.push("Title is missing.");
      if (isNaN(price) || price < 0)
        rowErrors.push("Price must be a valid number.");
      if (isNaN(originalPrice) || originalPrice < 0)
        rowErrors.push("Original Price must be a valid number.");

      rows.push({
        title,
        price,
        originalPrice,
        stateCode,
        categoryCode,
        subCategory,
        boardOrGrade,
        stream,
        subjectName,
        courseMode,
        liveMeetingUrl,
        lectureVideoUrl,
        description,
        validityDays,
        thumbnail,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    return rows;
  };

  const handleDownloadSampleCsvTemplate = () => {
    const csvHeader =
      "title,price,originalPrice,stateCode,categoryCode,subCategory,boardOrGrade,stream,subjectName,courseMode,liveMeetingUrl,lectureVideoUrl,description,validityDays,thumbnail\n";
    const sampleRow1 =
      '"CBSE Class 10th Science & Technology Full Course",1499,3999,"GLOBAL","SCHOOL_K12","CLASS_10","CBSE Class 10th","","Science","RECORDED_VIDEO","","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Comprehensive Physics, Chemistry, and Biology NCERT modules with chapter tests.",365,"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"\n';
    const sampleRow2 =
      '"UP Board 12th Mathematics Board Exam Mastery",1999,4999,"UP","SCHOOL_K12","CLASS_12","UP Board Intermediate","Science Stream (Subjects 1–6)","Mathematics","LIVE_ONLINE","https://zoom.us/j/9900000000","","Live daily classes, model paper solutions, and formula revisions for Class 12 UP Board.",365,"https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800"\n';
    const sampleRow3 =
      '"UPSSSC Lekhpal Complete Competitive Exam Batch",2499,5999,"UP","COMPETITIVE_EXAMS","UPSSSC_LEKHPAL","UPSSSC Lekhpal 2026 Batch","","General Knowledge","HYBRID","https://zoom.us/j/8800000000","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Full syllabus coverage for UPSSSC Lekhpal including rural development, Math, and GK.",180,"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800"\n';
    const sampleRow4 =
      '"B.Tech Computer Science Core Engineering Series",3499,7999,"GLOBAL","UNDERGRADUATE_DEGREE","BTECH","B.Tech Computer Science","","Computer Applications","RECORDED_VIDEO","","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Data Structures, Algorithms, DBMS, and Operating Systems for Engineering students.",730,"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800"\n';
    const sampleRow5 =
      '"Spoken English & Professional Communication Masterclass",999,2999,"GLOBAL","LANGUAGE_COMMUNICATION","SPOKEN_ENGLISH","Professional Certification","","English Speaking","RECORDED_VIDEO","","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Learn fluent English speaking, accent training, interview skills, and public speaking in 60 days.",365,"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800"\n';

    const blob = new Blob(
      [
        csvHeader +
          sampleRow1 +
          sampleRow2 +
          sampleRow3 +
          sampleRow4 +
          sampleRow5,
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "courses_bulk_upload_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    setBulkUploadError("");
    setBulkUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToCourseObjects(text);
        setParsedBulkCourses(parsed);
        if (parsed.length === 0) {
          setBulkUploadError(
            "No valid data rows found in the uploaded file. Please check file format.",
          );
        }
      } catch (err: any) {
        setBulkUploadError("Failed to parse uploaded CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    const validCoursesToSubmit = parsedBulkCourses.filter((c) => c.isValid);
    if (validCoursesToSubmit.length === 0) {
      setBulkUploadError(
        "No valid course rows to submit. Please check your uploaded file.",
      );
      return;
    }

    setIsSubmittingBulk(true);
    setBulkUploadError("");
    setBulkUploadResult(null);

    try {
      const res = await bulkCreateAdminCourses(validCoursesToSubmit);
      if (res.success && res.data) {
        setBulkUploadResult({
          successCount: res.data.createdCount,
          failCount: res.data.failedCount,
          errors: res.data.errors || [],
        });
        loadCourses();
      }
    } catch (err: any) {
      setBulkUploadError(
        err.message || "Failed to execute bulk course upload.",
      );
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Helper User CSV parser & sample downloader
  const parseCSVToUserObjects = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parseCSVLine = (textLine: string): string[] => {
      const result: string[] = [];
      let startValueIdx = 0;
      let inQuotes = false;
      for (let idx = 0; idx < textLine.length; idx++) {
        const c = textLine[idx];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === "," && !inQuotes) {
          let val = textLine.substring(startValueIdx, idx).trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          result.push(val);
          startValueIdx = idx + 1;
        }
      }
      let lastVal = textLine.substring(startValueIdx).trim();
      if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
        lastVal = lastVal.substring(1, lastVal.length - 1).replace(/""/g, '"');
      }
      result.push(lastVal);
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, index) => {
        rowObj[h] = values[index] !== undefined ? values[index] : "";
      });

      const name =
        rowObj["name"] || rowObj["fullname"] || rowObj["user name"] || "";
      const mobile = (
        rowObj["mobile"] ||
        rowObj["phone"] ||
        rowObj["mobilenumber"] ||
        ""
      ).replace(/[^0-9]/g, "");
      const roleStr = (
        rowObj["role"] ||
        rowObj["userrole"] ||
        "STUDENT"
      ).toUpperCase();
      const role = (roleStr === "TEACHER" ? "TEACHER" : "STUDENT") as
        | "STUDENT"
        | "TEACHER";
      const email = rowObj["email"] || rowObj["emailaddress"] || "";
      const password = rowObj["password"] || "123456";
      const stateCode = (
        rowObj["statecode"] ||
        rowObj["state"] ||
        "UP"
      ).toUpperCase();
      const categoryCode = (
        rowObj["categorycode"] ||
        rowObj["category"] ||
        "SCHOOL_K12"
      ).toUpperCase();
      const subCategory =
        rowObj["subcategory"] || rowObj["exam"] || rowObj["board"] || "";
      const boardOrGrade = rowObj["boardorgrade"] || rowObj["grade"] || "";
      const stream = rowObj["stream"] || "";
      const subjectName =
        rowObj["subjectname"] || rowObj["subject"] || "All Subjects";
      const referredBy = (
        rowObj["referredby"] ||
        rowObj["sponsor"] ||
        ""
      ).toUpperCase();

      const rowErrors: string[] = [];
      if (!name.trim()) rowErrors.push("Name is required.");
      if (!mobile || mobile.length !== 10)
        rowErrors.push("Mobile must be a valid 10-digit number.");

      rows.push({
        name,
        mobile,
        role,
        email,
        password,
        stateCode,
        categoryCode,
        subCategory,
        boardOrGrade,
        stream,
        subjectName,
        referredBy,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    return rows;
  };

  const handleDownloadSampleUserCsvTemplate = () => {
    const csvHeader =
      "name,mobile,role,email,password,stateCode,categoryCode,subCategory,boardOrGrade,stream,subjectName,referredBy\n";
    const row1 =
      '"Aarav Sharma","9876543210","STUDENT","aarav.sharma@example.com","123456","GLOBAL","SCHOOL_K12","CLASS_10","CBSE Class 10th","","Science",""\n';
    const row2 =
      '"Priya Verma","9876543211","STUDENT","priya.verma@example.com","123456","UP","SCHOOL_K12","CLASS_12","UP Board Intermediate","Science Stream (Subjects 1–6)","Mathematics",""\n';
    const row3 =
      '"Vikram Singh","9876543212","STUDENT","vikram.singh@example.com","123456","UP","COMPETITIVE_EXAMS","UPSSSC_LEKHPAL","UPSSSC Lekhpal 2026","","General Knowledge",""\n';
    const row4 =
      '"Dr. Rajesh Gupta","9876543213","TEACHER","dr.rajesh.gupta@example.com","123456","UP","SCHOOL_K12","CLASS_12","Senior Physics Faculty","Science Stream (Subjects 1–6)","Physics",""\n';
    const row5 =
      '"Prof. Ananya Roy","9876543214","TEACHER","ananya.roy@example.com","123456","GLOBAL","UNDERGRADUATE_DEGREE","BTECH","CS & Engineering Specialist","","Computer Applications",""\n';

    const blob = new Blob([csvHeader + row1 + row2 + row3 + row4 + row5], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users_bulk_upload_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUserFileUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUserFileName(file.name);
    setBulkUserUploadError("");
    setBulkUserUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToUserObjects(text);
        setParsedBulkUsers(parsed);
        if (parsed.length === 0) {
          setBulkUserUploadError(
            "No valid data rows found in the uploaded file.",
          );
        }
      } catch (err: any) {
        setBulkUserUploadError(
          "Failed to parse uploaded user CSV file: " + err.message,
        );
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUserUpload = async () => {
    const validUsersToSubmit = parsedBulkUsers.filter((u) => u.isValid);
    if (validUsersToSubmit.length === 0) {
      setBulkUserUploadError(
        "No valid user rows to submit. Please check your uploaded file.",
      );
      return;
    }

    setIsSubmittingUserBulk(true);
    setBulkUserUploadError("");
    setBulkUserUploadResult(null);

    try {
      const res = await bulkCreateAdminUsers(validUsersToSubmit);
      if (res.success && res.data) {
        setBulkUserUploadResult({
          successCount: res.data.createdCount,
          failCount: res.data.failedCount,
          errors: res.data.errors || [],
        });
        loadUsers();
        loadStats();
      }
    } catch (err: any) {
      setBulkUserUploadError(
        err.message || "Failed to execute bulk user upload.",
      );
    } finally {
      setIsSubmittingUserBulk(false);
    }
  };

  // Edit Course State
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("1499");
  const [editOriginalPrice, setEditOriginalPrice] = useState("3999");
  const [editStateCode, setEditStateCode] = useState("GLOBAL");
  const [editCategoryCode, setEditCategoryCode] = useState("SCHOOL_K12");
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editSubCategoryTitle, setEditSubCategoryTitle] = useState("");
  const [editStream, setEditStream] = useState("");
  const [editBoardGrade, setEditBoardGrade] = useState("");
  const [editSubjectName, setEditSubjectName] = useState(
    "All Subjects (Complete Package)",
  );
  const [editCourseMode, setEditCourseMode] = useState<
    "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID"
  >("LIVE_ONLINE");
  const [editLiveMeetingUrl, setEditLiveMeetingUrl] = useState("");
  const [editLectureVideoUrl, setEditLectureVideoUrl] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editSyllabusTopics, setEditSyllabusTopics] = useState<string[]>([]);
  const [editInclusions, setEditInclusions] = useState<CourseInclusions>({
    totalLectures: 0,
    totalHours: 0,
    totalEbooks: 0,
    totalLiveSessions: 0,
    totalMockTests: 0,
    hasCertificate: true,
    hasDoubtSupport: true,
    hasDownloadableNotes: true,
    hasLifetimeAccess: false,
  });
  const [editCurriculum, setEditCurriculum] = useState<CourseCurriculumItem[]>(
    [],
  );
  const [editDemoVideoUrl, setEditDemoVideoUrl] = useState("");
  const [editLiveSchedule, setEditLiveSchedule] = useState("");
  const [editEbookTitle, setEditEbookTitle] = useState("");
  const [editEbookPdfUrl, setEditEbookPdfUrl] = useState("");
  const [editStudyMaterials, setEditStudyMaterials] = useState<
    CourseStudyMaterialItem[]
  >([]);
  
  const [editMockTests, setEditMockTests] = useState<CourseMockTestItem[]>([]);
  const [editRichContents, setEditRichContents] = useState<
    CourseRichContentItem[]
  >([]);

  // Create Course Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("1499");
  const [newOriginalPrice, setNewOriginalPrice] = useState("3999");
  const [newStateCode, setNewStateCode] = useState("GLOBAL");
  const [newCategoryCode, setNewCategoryCode] = useState("SCHOOL_K12");
  const [newSubCategory, setNewSubCategory] = useState("CBSE_BOARD");
  const [newStream, setNewStream] = useState("");
  const [newBoardGrade, setNewBoardGrade] = useState("CBSE Class 10th");
  const [newSubjectName, setNewSubjectName] = useState(
    "All Subjects (Complete Package)",
  );
  const [newCourseMode, setNewCourseMode] = useState<
    "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID"
  >("LIVE_ONLINE");
  const [newLiveMeetingUrl, setNewLiveMeetingUrl] = useState(
    "https://zoom.us/j/9900000000",
  );
  const [newLectureVideoUrl, setNewLectureVideoUrl] = useState(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  const [newDemoVideoUrl, setNewDemoVideoUrl] = useState("");
  const [newLiveSchedule, setNewLiveSchedule] = useState(
    "Monday, Wednesday & Friday @ 7:00 PM IST",
  );
  const [newEbookTitle, setNewEbookTitle] = useState("");
  const [newEbookPdfUrl, setNewEbookPdfUrl] = useState("");
  const [newSyllabusTopics, setNewSyllabusTopics] = useState<string[]>([]);
  const [newInclusions, setNewInclusions] = useState<CourseInclusions>({
    totalLectures: 40,
    totalHours: 50,
    totalEbooks: 5,
    totalLiveSessions: 15,
    totalMockTests: 5,
    hasCertificate: true,
    hasDoubtSupport: true,
    hasDownloadableNotes: true,
    hasLifetimeAccess: false,
  });
  const [newCurriculum, setNewCurriculum] = useState<CourseCurriculumItem[]>(
    [],
  );
  const [newStudyMaterials, setNewStudyMaterials] = useState<
    CourseStudyMaterialItem[]
  >([]);
  
  const [newMockTests, setNewMockTests] = useState<CourseMockTestItem[]>([]);
  const [newRichContents, setNewRichContents] = useState<
    CourseRichContentItem[]
  >([]);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState(
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [createCourseError, setCreateCourseError] = useState("");
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  // KYC Queue State
  const [kycList, setKycList] = useState<KYCRecord[]>([]);
  const [kycStatusFilter, setKycStatusFilter] = useState<
    "PENDING" | "VERIFIED" | "REJECTED" | "ALL"
  >("PENDING");
  const [previewKycDoc, setPreviewKycDoc] = useState<KYCRecord | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);

  // KYC Rejection Modal Prompt State
  const [rejectingKycDoc, setRejectingKycDoc] = useState<KYCRecord | null>(
    null,
  );
  const [rejectionReasonInput, setRejectionReasonInput] = useState(
    "Aadhaar / PAN document image scan details did not match government database.",
  );
  const [rejectionErrorMsg, setRejectionErrorMsg] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Payouts Queue State
  const [payoutsList, setPayoutsList] = useState<PayoutRecord[]>([]);

  // Admin Withdrawals Management State (Student MLM & Teacher Royalties)
  const [adminWithdrawalsList, setAdminWithdrawalsList] = useState<
    WithdrawalRequestRecord[]
  >([]);
  const [isLoadingAdminWithdrawals, setIsLoadingAdminWithdrawals] =
    useState(false);
  const [withdrawalFilterStatus, setWithdrawalFilterStatus] =
    useState<string>("ALL");
  const [withdrawalFilterRole, setWithdrawalFilterRole] =
    useState<string>("ALL");
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState("");

  // Approve Modal State
  const [approvingWithdrawal, setApprovingWithdrawal] =
    useState<WithdrawalRequestRecord | null>(null);
  const [utrNumberInput, setUtrNumberInput] = useState("");
  const [adminRemarksInput, setAdminRemarksInput] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalErrorMsg, setApprovalErrorMsg] = useState("");

  // Reject Modal State
  const [rejectingWithdrawal, setRejectingWithdrawal] =
    useState<WithdrawalRequestRecord | null>(null);
  const [adminRejectionReason, setAdminRejectionReason] = useState(
    "Invalid bank details or IFSC code.",
  );
  const [isSubmittingAdminRejection, setIsSubmittingAdminRejection] =
    useState(false);
  const [adminRejectErrorMsg, setAdminRejectErrorMsg] = useState("");

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Grouped Student Preferences & Faculty Matrix State (Real-time Backend Aggregations)
  const [granularAnalytics, setGranularAnalytics] = useState<any | null>(null);
  const [selectedGroupModal, setSelectedGroupModal] = useState<any | null>(
    null,
  );
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<any | null>(
    null,
  );

  // Category-Wise Student Breakdown Modal State
  const [showCategoryStudentsModal, setShowCategoryStudentsModal] =
    useState<boolean>(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");

  // Announcement State
  const [announcementText, setAnnouncementText] = useState(() => {
    return (
      localStorage.getItem("eduverse_system_announcement") ||
      "🎉 Special Cashback offer on NEET & K12 Master Pass! Enroll today!"
    );
  });
  const [announcementUpdated, setAnnouncementUpdated] = useState(false);

  // Advertisement & Banners Management State
  const [adsList, setAdsList] = useState<AdRecord[]>([]);
  const [adStats, setAdStats] = useState<AdStats | null>(null);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adTypeFilter, setAdTypeFilter] = useState<"ALL" | "IMAGE" | "VIDEO">(
    "ALL",
  );
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<AdRecord | null>(null);
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);
  const [adFormError, setAdFormError] = useState("");
  const [adFormSuccess, setAdFormSuccess] = useState("");
  const [previewMediaAd, setPreviewMediaAd] = useState<AdRecord | null>(null);

  // Ad Form Fields
  const [adTitle, setAdTitle] = useState("");
  const [adType, setAdType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [adMediaUrl, setAdMediaUrl] = useState("");
  const [adTargetUrl, setAdTargetUrl] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adPlacement, setAdPlacement] = useState<
    "HOME_HERO" | "BANNER" | "POPUP"
  >("HOME_HERO");
  const [adIsActive, setAdIsActive] = useState(true);
  const [adPriority, setAdPriority] = useState(0);

  // Fetch Ads Data
  const loadAds = async () => {
    setIsLoadingAds(true);
    try {
      const res = await fetchAdminAds();
      if (res.success && res.data) {
        setAdsList(res.data.ads || []);
        setAdStats(res.data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load advertisements", err);
    } finally {
      setIsLoadingAds(false);
    }
  };

  const handleOpenCreateAd = () => {
    setEditingAd(null);
    setAdTitle("");
    setAdType("IMAGE");
    setAdMediaUrl("");
    setAdTargetUrl("");
    setAdDescription("");
    setAdPlacement("HOME_HERO");
    setAdIsActive(true);
    setAdPriority(0);
    setAdFormError("");
    setAdFormSuccess("");
    setShowCreateAdModal(true);
  };

  const handleOpenEditAd = (ad: AdRecord) => {
    setEditingAd(ad);
    setAdTitle(ad.title);
    setAdType(ad.type);
    setAdMediaUrl(ad.mediaUrl);
    setAdTargetUrl(ad.targetUrl || "");
    setAdDescription(ad.description || "");
    setAdPlacement(ad.placement);
    setAdIsActive(ad.isActive);
    setAdPriority(ad.priority || 0);
    setAdFormError("");
    setAdFormSuccess("");
    setShowCreateAdModal(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdFormError("");
    setAdFormSuccess("");

    if (!adTitle.trim()) {
      setAdFormError("Ad Title is required");
      return;
    }
    if (!adMediaUrl.trim()) {
      setAdFormError(
        "Media URL is required (Direct image link or MP4/HLS/video streaming link)",
      );
      return;
    }

    setIsSubmittingAd(true);
    try {
      if (editingAd) {
        const res = await updateAd(editingAd._id, {
          title: adTitle.trim(),
          type: adType,
          mediaUrl: adMediaUrl.trim(),
          targetUrl: adTargetUrl.trim(),
          description: adDescription.trim(),
          placement: adPlacement,
          isActive: adIsActive,
          priority: Number(adPriority) || 0,
        });
        if (res.success) {
          setAdFormSuccess("Advertisement updated successfully!");
          setTimeout(() => {
            setShowCreateAdModal(false);
            setEditingAd(null);
          }, 800);
          loadAds();
        } else {
          setAdFormError(res.message || "Failed to update advertisement");
        }
      } else {
        const res = await createAd({
          title: adTitle.trim(),
          type: adType,
          mediaUrl: adMediaUrl.trim(),
          targetUrl: adTargetUrl.trim(),
          description: adDescription.trim(),
          placement: adPlacement,
          isActive: adIsActive,
          priority: Number(adPriority) || 0,
        });
        if (res.success) {
          setAdFormSuccess("Advertisement published successfully!");
          setTimeout(() => {
            setShowCreateAdModal(false);
          }, 800);
          loadAds();
        } else {
          setAdFormError(res.message || "Failed to create advertisement");
        }
      }
    } catch (err: any) {
      setAdFormError(
        err.message || "An error occurred while saving advertisement",
      );
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleToggleAdActive = async (ad: AdRecord) => {
    const res = await toggleAdActive(ad._id);
    if (res.success) {
      loadAds();
    } else {
      alert(res.message || "Failed to update status");
    }
  };

  const handleDeleteAd = async (ad: AdRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete advertisement: "${ad.title}"?`,
      )
    ) {
      return;
    }
    const res = await deleteAd(ad._id);
    if (res.success) {
      loadAds();
    } else {
      alert(res.message || "Failed to delete advertisement");
    }
  };

  // Load Grouped Student Analytics & Faculty Matrix from Backend Aggregations
  const loadGroupedAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/users/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.analytics) {
        setGranularAnalytics(data.data.analytics);
      }
    } catch {
      // Fallback
    }
  };

  // Load Admin Stats
  const loadStats = async () => {
    setIsLoadingStats(true);
    const res = await fetchAdminStats();
    if (res.success && res.data) {
      setStats(res.data.stats);
    }
    setIsLoadingStats(false);
  };

  // Load Users Directory (with roleFilter, userSearch, page, sortBy & filters)
  const loadUsers = async (
    targetPage = userDirectoryPage,
    targetSort = userDirectorySortBy,
    searchVal = userSearch,
    roleVal = roleFilter,
    stateVal = userStateFilter,
    kycVal = userKycFilter,
    boardVal = userBoardFilter,
    subjectVal = userSubjectFilter,
  ) => {
    setIsLoadingUsers(true);
    const res = await fetchAdminUsers(
      targetPage,
      20,
      searchVal,
      roleVal,
      targetSort,
      stateVal,
      kycVal,
      boardVal,
      subjectVal,
    );
    if (res.success && res.data) {
      setUsersList(res.data);
      if (res.pagination) {
        setUserPaginationMeta(res.pagination);
      }
    }
    setIsLoadingUsers(false);
  };

  // Load Courses Directory (with courseModeFilter, courseSearch, page & sortBy)
  const loadCourses = async (
    targetPage = courseDirectoryPage,
    targetSort = courseDirectorySortBy,
    searchVal = courseSearch,
    modeVal = courseModeFilter,
  ) => {
    setIsLoadingCourses(true);
    const res = await fetchAdminCourses(
      targetPage,
      20,
      searchVal,
      modeVal,
      targetSort,
    );
    if (res.success && res.data) {
      setCoursesList(res.data);
      if (res.pagination) {
        setCoursePaginationMeta(res.pagination);
      }
    }
    setIsLoadingCourses(false);
  };

  // Load Pending or Filtered KYC Queue
  const loadPendingKyc = async () => {
    setIsLoadingKyc(true);
    const res = await fetchPendingKYC(kycStatusFilter);
    if (res.success && res.data) {
      const queue = Array.isArray(res.data)
        ? res.data
        : (res.data as any).kycQueue || [];
      setKycList(queue);
    }
    setIsLoadingKyc(false);
  };

  // Load Pending Payouts
  const loadPayouts = async () => {
    const res = await fetchPendingPayouts();
    if (res.success && res.data) {
      setPayoutsList(res.data.payouts || []);
    }
    loadAdminWithdrawals();
  };

  // Load Super Admin Withdrawal Requests (Student MLM & Teacher Royalties)
  const loadAdminWithdrawals = async () => {
    setIsLoadingAdminWithdrawals(true);
    const res = await fetchAdminWithdrawals({
      status: withdrawalFilterStatus,
      role: withdrawalFilterRole,
      search: withdrawalSearchQuery,
    });
    if (res.success && res.data) {
      setAdminWithdrawalsList(res.data.withdrawals || []);
    }
    setIsLoadingAdminWithdrawals(false);
  };

  const handleOpenApproveModal = (w: WithdrawalRequestRecord) => {
    setApprovingWithdrawal(w);
    setUtrNumberInput(`UTR-${Date.now().toString().slice(-8)}`);
    setAdminRemarksInput("Paid successfully via Bank NEFT / IMPS / UPI.");
    setApprovalErrorMsg("");
  };

  const handleConfirmApprove = async () => {
    if (!approvingWithdrawal) return;
    setIsSubmittingApproval(true);
    setApprovalErrorMsg("");
    const res = await approveAdminWithdrawal(approvingWithdrawal._id, {
      utrNumber: utrNumberInput.trim() || `UTR-${Date.now()}`,
      adminRemarks: adminRemarksInput.trim(),
    });
    setIsSubmittingApproval(false);
    if (res.success) {
      setApprovingWithdrawal(null);
      loadAdminWithdrawals();
      loadPayouts();
      loadStats();
    } else {
      setApprovalErrorMsg(res.message || "Failed to approve withdrawal.");
    }
  };

  const handleOpenRejectModal = (w: WithdrawalRequestRecord) => {
    setRejectingWithdrawal(w);
    setAdminRejectionReason("Incorrect account details or invalid IFSC code.");
    setAdminRejectErrorMsg("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingWithdrawal) return;
    if (!adminRejectionReason.trim()) {
      setAdminRejectErrorMsg("Please provide a reason for rejection.");
      return;
    }
    setIsSubmittingAdminRejection(true);
    setAdminRejectErrorMsg("");
    const res = await rejectAdminWithdrawal(rejectingWithdrawal._id, {
      rejectionReason: adminRejectionReason.trim(),
    });
    setIsSubmittingAdminRejection(false);
    if (res.success) {
      setRejectingWithdrawal(null);
      loadAdminWithdrawals();
      loadPayouts();
      loadStats();
    } else {
      setAdminRejectErrorMsg(res.message || "Failed to reject withdrawal.");
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const [isExecutingSettlement, setIsExecutingSettlement] = useState(false);
  const [settlementResultMsg, setSettlementResultMsg] = useState("");

  const handleRunMlmSettlement = async () => {
    setSettlementResultMsg("");
    setIsExecutingSettlement(true);
    const res = await executeBinaryPayoutSettlement();
    setIsExecutingSettlement(false);
    if (res.success && res.data) {
      setSettlementResultMsg(
        `🎉 Binary MLM Settlement Completed! ${res.data.processedCount} partner accounts credited.`,
      );
      loadPayouts();
      loadStats();
    } else {
      setSettlementResultMsg(
        `⛔ ${res.message || "Settlement execution failed."}`,
      );
    }
  };

  // 100% Dynamic MLM & Referral Configuration State
  const [mlmConfig, setMlmConfig] = useState<MlmConfigRecord>({
    perReferralPV: 100,
    directReferralBonus: 0,
    matchingRatePercentage: 10,
    dailyCappingLimit: 25000,
    adminFeePercentage: 5,
    tdsPercentage: 5,
  });
  const [isLoadingMlmConfig, setIsLoadingMlmConfig] = useState(false);
  const [isSavingMlmConfig, setIsSavingMlmConfig] = useState(false);
  const [mlmConfigMsg, setMlmConfigMsg] = useState("");

  const loadMlmConfig = async () => {
    setIsLoadingMlmConfig(true);
    const res = await fetchMlmConfig();
    if (res.success && res.data) {
      setMlmConfig(res.data.config);
    }
    setIsLoadingMlmConfig(false);
  };

  const handleSaveMlmConfig = async () => {
    setIsSavingMlmConfig(true);
    setMlmConfigMsg("");
    const res = await updateMlmConfig(mlmConfig);
    setIsSavingMlmConfig(false);
    if (res.success && res.data) {
      setMlmConfig(res.data.config);
      setMlmConfigMsg(
        "✅ MLM & Referral Rules Updated Successfully! All new referrals and settlements will use these rates.",
      );
      setTimeout(() => setMlmConfigMsg(""), 5000);
    } else {
      setMlmConfigMsg(`❌ ${res.message || "Failed to update MLM settings"}`);
    }
  };

  // Load Initial Core Admin Data & Dynamic Tab Watchers
  useEffect(() => {
    loadStats();
    loadUsers();
    loadCourses();
    loadPendingKyc();
    loadPayouts();
    loadMlmConfig();
    loadGroupedAnalytics();
    loadAds();
  }, []);

  useEffect(() => {
    if (activeTab === "USERS") {
      loadUsers(
        userDirectoryPage,
        userDirectorySortBy,
        userSearch,
        roleFilter,
        userStateFilter,
        userKycFilter,
        userBoardFilter,
        userSubjectFilter,
      );
      loadGroupedAnalytics();
    }
    if (activeTab === "COURSES")
      loadCourses(
        courseDirectoryPage,
        courseDirectorySortBy,
        courseSearch,
        courseModeFilter,
      );
    if (activeTab === "KYC") loadPendingKyc();
    if (activeTab === "PAYOUTS") loadPayouts();
    if (activeTab === "ADS") loadAds();
  }, [
    activeTab,
    kycStatusFilter,
    roleFilter,
    userSearch,
    userDirectoryPage,
    userDirectorySortBy,
    userStateFilter,
    userKycFilter,
    userBoardFilter,
    userSubjectFilter,
    courseDirectoryPage,
    courseDirectorySortBy,
    courseSearch,
    courseModeFilter,
  ]);

  useEffect(() => {
    if (activeTab === "PAYOUTS") {
      loadAdminWithdrawals();
    }
  }, [
    activeTab,
    withdrawalFilterStatus,
    withdrawalFilterRole,
    withdrawalSearchQuery,
  ]);

  // Handle Thumbnail File Selection (2MB Validation Limit)
  const handleThumbnailFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCreateCourseError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setCreateCourseError(
          "⛔ Thumbnail image size must not exceed 2MB! Please select a smaller file.",
        );
        setThumbnailFile(null);
        setThumbnailPreview("");
        e.target.value = "";
        return;
      }

      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setNewThumbnailUrl(previewUrl);
    }
  };

  const handleToggleBlock = async (usr: UserRecord) => {
    const nextBlockedState = !(usr.isBlocked || usr.status === "BLOCKED");
    const res = await toggleBlockUser(usr._id, nextBlockedState);
    if (res.success) {
      loadUsers();
      if (selectedDetailUser && selectedDetailUser._id === usr._id) {
        setSelectedDetailUser({
          ...selectedDetailUser,
          isBlocked: nextBlockedState,
          status: nextBlockedState ? "BLOCKED" : "ACTIVE",
        });
      }
    }
  };

  const handleToggleCourseActive = async (
    courseId: string,
    currentActiveStatus: boolean,
  ) => {
    const res = await toggleCourseActive(courseId, !currentActiveStatus);
    if (res.success) {
      loadCourses();
      loadStats();
      if (selectedCourseDetail && selectedCourseDetail._id === courseId) {
        setSelectedCourseDetail({
          ...selectedCourseDetail,
          active: !currentActiveStatus,
        });
      }
    }
  };

  const handleOpenEditModal = (crs: CourseRecord) => {
    setEditingCourse(crs);
    setEditTitle(crs.title || "");
    setEditDescription(crs.description || "");
    setEditPrice(crs.price ? crs.price.toString() : "0");
    setEditOriginalPrice(
      crs.originalPrice ? crs.originalPrice.toString() : "0",
    );
    setEditStateCode(crs.stateCode || "GLOBAL");
    const catCode =
      typeof crs.category === "object"
        ? crs.category?.code || "SCHOOL_K12"
        : "SCHOOL_K12";
    setEditCategoryCode(catCode);
    setEditSubCategory(crs.subCategory || "");
    setEditSubCategoryTitle(crs.subCategoryTitle || "");
    setEditStream(crs.stream || "");
    setEditBoardGrade(crs.boardOrGrade || "");
    setEditSubjectName(crs.subjectName || "All Subjects (Complete Package)");
    setEditCourseMode(crs.courseMode || "LIVE_ONLINE");
    setEditLiveMeetingUrl(crs.liveMeetingUrl || "");
    setEditLectureVideoUrl(crs.lectureVideoUrl || "");
    setEditDemoVideoUrl(crs.demoVideoUrl || "");
    setEditLiveSchedule(crs.liveSchedule || "");
    setEditEbookTitle(crs.ebookTitle || "");
    setEditEbookPdfUrl(crs.ebookPdfUrl || "");
    setEditSyllabusTopics(crs.syllabusTopics || []);
    setEditInclusions(
      crs.inclusions || {
        totalLectures: 0,
        totalHours: 0,
        totalEbooks: 0,
        totalLiveSessions: 0,
        totalMockTests: 0,
        hasCertificate: true,
        hasDoubtSupport: true,
        hasDownloadableNotes: true,
        hasLifetimeAccess: false,
      },
    );
    setEditCurriculum(crs.curriculum || []);
    setEditStudyMaterials(crs.studyMaterials || []);
    setEditMockTests(crs.mockTests || []);
    setEditMockTests(crs.mockTests || []);
    setEditRichContents(crs.richContents || []);
    setEditThumbnail(crs.thumbnail || "");
    setEditErrorMsg("");
  };

  const handleSaveCourseEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setIsSavingEdit(true);
    setEditErrorMsg("");

    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        price: Number(editPrice),
        originalPrice: Number(editOriginalPrice),
        stateCode: editStateCode,
        categoryId: editCategoryCode,
        subCategory: editSubCategory,
        subCategoryTitle: editSubCategoryTitle,
        stream: editStream,
        boardOrGrade: editBoardGrade,
        subjectName: editSubjectName,
        courseMode: editCourseMode,
        liveMeetingUrl: editLiveMeetingUrl,
        lectureVideoUrl: editLectureVideoUrl,
        demoVideoUrl: editDemoVideoUrl,
        liveSchedule: editLiveSchedule,
        ebookTitle: editEbookTitle,
        ebookPdfUrl: editEbookPdfUrl,
        syllabusTopics: editSyllabusTopics,
        inclusions: editInclusions,
        curriculum: editCurriculum,
        studyMaterials: editStudyMaterials,
        mockTests: editMockTests,
        richContents: editRichContents,
        thumbnail: editThumbnail,
      };

      const res = await updateAdminCourse(editingCourse._id, payload);
      if (res.success && res.data?.course) {
        loadCourses();
        if (selectedCourseDetail?._id === editingCourse._id) {
          setSelectedCourseDetail({
            ...selectedCourseDetail,
            ...res.data.course,
          });
        }
        setEditingCourse(null);
      }
    } catch (err: any) {
      setEditErrorMsg(err.message || "Failed to save course edits.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCourseItem = async (courseId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY DELETE this course batch? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      const res = await deleteAdminCourse(courseId);
      if (res.success) {
        setCoursesList((prev) => prev.filter((c) => c._id !== courseId));
        if (selectedCourseDetail?._id === courseId) {
          setSelectedCourseDetail(null);
        }
        loadStats();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete course batch.");
    }
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCourseError("");

    if (!newTitle.trim() || newTitle.trim().length < 4) {
      setCreateCourseError("Course title must be at least 4 characters long.");
      return;
    }
    const priceNum = Number(newPrice);
    const origPriceNum = Number(newOriginalPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setCreateCourseError(
        "Offer Price must be a valid positive number (> ₹0).",
      );
      return;
    }
    if (isNaN(origPriceNum) || origPriceNum < priceNum) {
      setCreateCourseError(
        "Original MRP Price must be greater than or equal to Offer Price.",
      );
      return;
    }
    if (!newDescription.trim() || newDescription.trim().length < 10) {
      setCreateCourseError(
        "Course description must be at least 10 characters long.",
      );
      return;
    }

    setIsCreatingCourse(true);
    let uploadedThumbnailUrl = newThumbnailUrl;

    if (thumbnailFile) {
      try {
        const uploadRes = await uploadAdminCourseThumbnail(thumbnailFile);
        uploadedThumbnailUrl = uploadRes.thumbnailUrl;
      } catch (err: any) {
        setCreateCourseError(
          err.message || "Image file upload to Cloudinary failed.",
        );
        setIsCreatingCourse(false);
        return;
      }
    }

    const targetModule = CORE_MODULES_LIST.find(
      (m) => m.code === newCategoryCode,
    );
    const targetSub = targetModule?.subCategories.find(
      (s) => s.code === newSubCategory,
    );

    const res = await createAdminCourse({
      title: newTitle.trim(),
      categoryId: newCategoryCode,
      subCategory: newSubCategory,
      subCategoryTitle: targetSub ? targetSub.title : newSubCategory,
      stream: newStream,
      subjectName: newSubjectName,
      description: newDescription.trim(),
      price: priceNum,
      originalPrice: origPriceNum,
      stateCode: newStateCode,
      boardOrGrade: newBoardGrade || (targetSub ? targetSub.title : ""),
      courseMode: newCourseMode,
      liveMeetingUrl: newLiveMeetingUrl.trim(),
      lectureVideoUrl: newLectureVideoUrl.trim(),
      demoVideoUrl: newDemoVideoUrl.trim(),
      liveSchedule: newLiveSchedule.trim(),
      ebookTitle: newEbookTitle.trim(),
      ebookPdfUrl: newEbookPdfUrl.trim(),
      syllabusTopics: newSyllabusTopics,
      inclusions: newInclusions,
      curriculum: newCurriculum,
      studyMaterials: newStudyMaterials,
      mockTests: newMockTests,
      richContents: newRichContents,
      thumbnail: uploadedThumbnailUrl,
    });
    setIsCreatingCourse(false);

    if (res.success) {
      setShowCreateCourseModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewStudyMaterials([]);
      setNewMockTests([]);
      setNewRichContents([]);
      setThumbnailFile(null);
      setThumbnailPreview("");
      loadCourses();
      loadStats();
    } else {
      setCreateCourseError(res.message || "Failed to publish new course.");
    }
  };

  // Approve KYC Handler
  const handleApproveKyc = async (kycId: string) => {
    const res = await verifyKYCDocument(kycId, "APPROVED");
    if (res.success) {
      loadPendingKyc();
      loadStats();
      setPreviewKycDoc(null);
      setRejectingKycDoc(null);
    }
  };

  // Open Reject KYC Modal
  const handleOpenRejectKycModal = (doc: KYCRecord) => {
    setPreviewKycDoc(null);
    setRejectingKycDoc(doc);
    setRejectionReasonInput(
      "Aadhaar / PAN document image scan details did not match government database.",
    );
    setRejectionErrorMsg("");
  };

  // Submit Reject KYC Form
  const handleRejectKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingKycDoc) return;
    setRejectionErrorMsg("");

    if (
      !rejectionReasonInput.trim() ||
      rejectionReasonInput.trim().length < 5
    ) {
      setRejectionErrorMsg(
        "Please enter a valid rejection reason (at least 5 characters).",
      );
      return;
    }

    setIsSubmittingRejection(true);
    const res = await verifyKYCDocument(
      rejectingKycDoc._id,
      "REJECTED",
      rejectionReasonInput.trim(),
    );
    setIsSubmittingRejection(false);

    if (res.success) {
      loadPendingKyc();
      loadStats();
      setRejectingKycDoc(null);
      setPreviewKycDoc(null);
    } else {
      setRejectionErrorMsg(res.message || "Failed to reject KYC document.");
    }
  };

  return (
    <div>
      {/* Top Banner Header */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          borderRadius: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <span
                className="badge badge-rose"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
              >
                <ShieldCheck size={12} /> SUPER ADMIN WEB PORTAL
              </span>
              <span
                className="badge badge-primary"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
              >
                LIVE EXPRESS API CONNECTED
              </span>
            </div>
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: "800",
                margin: "2px 0",
                letterSpacing: "-0.3px",
              }}
            >
              Master Operations & Administration
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.82rem",
                margin: 0,
              }}
            >
              Live Platform Analytics, Courses Directory, KYC Audits & User
              Directory Controls.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-secondary"
              onClick={() => {
                loadStats();
                loadUsers();
                loadCourses();
                loadPendingKyc();
                loadPayouts();
              }}
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <RefreshCw
                size={14}
                className={isLoadingStats ? "animate-spin" : ""}
              />{" "}
              Refresh Stats
            </button>
            <button
              className="btn-rose"
              onClick={() => setShowCreateCourseModal(true)}
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <Plus size={14} /> Create Course
            </button>
          </div>
        </div>
      </div>

      {/* 100% Dynamic Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          className="glass-card"
          style={{ padding: "12px 16px", borderRadius: "12px" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#34D399",
              fontWeight: "700",
              marginBottom: "2px",
            }}
          >
            TOTAL GROSS REVENUE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            ₹ {stats ? (stats.totalRevenue || 0).toLocaleString("en-IN") : "0"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            From Course & E-Book Purchases
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "12px 16px", borderRadius: "12px" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#818CF8",
              fontWeight: "700",
              marginBottom: "2px",
            }}
          >
            TOTAL REGISTERED USERS
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            {stats ? stats.totalUsers || usersList.length : "0"}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            Students: {stats?.totalStudents || 0} • Educators:{" "}
            {stats?.totalTeachers || 0}
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setActiveTab("USERS");
              setShowCategoryStudentsModal(true);
            }}
            style={{
              width: "100%",
              fontSize: "0.72rem",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818CF8",
              fontWeight: "700",
              borderRadius: "6px",
            }}
          >
            📊 Category-Wise Breakdown
          </button>
        </div>

        <div
          className="glass-card"
          style={{ padding: "12px 16px", borderRadius: "12px" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#FBBF24",
              fontWeight: "700",
              marginBottom: "2px",
            }}
          >
            TOTAL PLATFORM COURSES
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            {stats ? stats.totalCourses || coursesList.length : "0"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            NEET, JEE & K12 Batches
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "12px 16px", borderRadius: "12px" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#FB7185",
              fontWeight: "700",
              marginBottom: "2px",
            }}
          >
            EXPRESS SERVER HEALTH
          </div>
          <div
            style={{ fontSize: "1.2rem", fontWeight: "800", color: "#34D399" }}
          >
            ONLINE ({backendUptime})
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            DB: {dbStatus}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "20px",
          background: "rgba(255,255,255,0.03)",
          padding: "4px",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "ANALYTICS"
                ? "var(--rose-gradient)"
                : "transparent",
            color: activeTab === "ANALYTICS" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <ShieldCheck
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Analytics
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "USERS" ? "var(--primary-gradient)" : "transparent",
            color: activeTab === "USERS" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Users size={15} style={{ display: "inline", marginRight: "6px" }} />
          User Directory ({stats?.totalUsers || usersList.length})
        </button>

        <button
          onClick={() => setActiveTab("COURSES")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "COURSES" ? "var(--amber-gradient)" : "transparent",
            color: activeTab === "COURSES" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <BookOpen
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Course Directory ({coursesList.length})
        </button>

        <button
          onClick={() => setActiveTab("KYC")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "KYC" ? "var(--emerald-gradient)" : "transparent",
            color: activeTab === "KYC" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <FileCheck
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          KYC Queue ({kycList.length})
        </button>

        <button
          onClick={() => setActiveTab("PAYOUTS")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "PAYOUTS"
                ? "var(--secondary-gradient)"
                : "transparent",
            color: activeTab === "PAYOUTS" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <DollarSign
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Payouts ({payoutsList.length})
        </button>

                <button
          onClick={() => setActiveTab("REVENUE")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "REVENUE" ? "var(--emerald-gradient)" : "transparent",
            color: activeTab === "REVENUE" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <FileSpreadsheet size={15} style={{ display: "inline", marginRight: "6px" }} />
          Revenue Statement
        </button>

                <button
          onClick={() => setActiveTab("LEADERBOARD")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "LEADERBOARD"
                ? "var(--amber-gradient)"
                : "transparent",
            color: activeTab === "LEADERBOARD" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Trophy size={15} style={{ display: "inline", marginRight: "6px" }} />
          MLM Leaderboard
        </button>

        <button
          onClick={() => setActiveTab("ANNOUNCEMENTS")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "ANNOUNCEMENTS"
                ? "var(--rose-gradient)"
                : "transparent",
            color:
              activeTab === "ANNOUNCEMENTS" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Megaphone
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Announcements
        </button>

        <button
          onClick={() => setActiveTab("ADS")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "ADS"
                ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                : "transparent",
            color: activeTab === "ADS" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Tv size={15} style={{ display: "inline", marginRight: "6px" }} />
          Ads & Banners ({adsList.length})
        </button>
      </div>

      {/* ANALYTICS TAB: DEEP ENTERPRISE PERFORMANCE DASHBOARD */}
      {activeTab === "ANALYTICS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #10B981",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#10B981",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                💰 Total Platform Revenue
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                }}
              >
                ₹ {(stats?.totalRevenue || 0).toLocaleString("en-IN")}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Course Batches & E-Book Purchases
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #6366F1",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#6366F1",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                🎓 Student Learner Reach
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                }}
              >
                {stats?.totalStudents || 0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Across 28 States & UT Regions
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #F59E0B",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#F59E0B",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                👨‍🏫 Educator Faculty Strength
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                }}
              >
                {stats?.totalTeachers || 0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Verified Master Instructors
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #EC4899",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#EC4899",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                🤝 REFERRAL NETWORK USERS
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                }}
              >
                {(stats as any)?.totalMlmNodes ||
                  (stats as any)?.totalAffiliates ||
                  0}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Students & Teachers in Binary Referral Program
              </div>
            </div>
          </div>

          {/* Granular Distribution Breakdown Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              alignItems: "start",
            }}
          >
            {/* 1. Category / Board Distribution */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                height: "fit-content",
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
                <h4
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "var(--primary-accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  📘 Academic Boards
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(99,102,241,0.12)",
                    color: "var(--primary-accent)",
                    fontWeight: "700",
                  }}
                >
                  {((granularAnalytics?.studentsByBoard as any[]) || []).length}{" "}
                  Boards
                </span>
              </div>
              <div
                className="custom-scrollbar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {((granularAnalytics?.studentsByBoard as any[]) || [])
                  .length === 0 ? (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      background: "var(--bg-surface)",
                      borderRadius: "10px",
                    }}
                  >
                    No board distribution recorded yet
                  </div>
                ) : (
                  ((granularAnalytics?.studentsByBoard as any[]) || []).map(
                    (item: any, idx: number) => {
                      const maxCount = Math.max(
                        ...(
                          (granularAnalytics?.studentsByBoard as any[]) || []
                        ).map((b: any) => b.count || 1),
                        1,
                      );
                      const pct = Math.round((item.count / maxCount) * 100);
                      return (
                        <div key={idx} style={{ fontSize: "0.82rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                              fontWeight: "700",
                            }}
                          >
                            <span style={{ color: "var(--text-primary)" }}>
                              {item._id || "General Board"}
                            </span>
                            <span style={{ color: "var(--primary-accent)" }}>
                              {item.count} Students
                            </span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "rgba(99,102,241,0.12)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "var(--primary-gradient)",
                                borderRadius: "3px",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>

            {/* 2. Geographic State Localization Reach */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                height: "fit-content",
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
                <h4
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🗺️ State Reach
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    fontWeight: "700",
                  }}
                >
                  {((granularAnalytics?.studentsByState as any[]) || []).length}{" "}
                  States
                </span>
              </div>
              <div
                className="custom-scrollbar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {((granularAnalytics?.studentsByState as any[]) || [])
                  .length === 0 ? (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      background: "var(--bg-surface)",
                      borderRadius: "10px",
                    }}
                  >
                    No state localization recorded yet
                  </div>
                ) : (
                  ((granularAnalytics?.studentsByState as any[]) || []).map(
                    (item: any, idx: number) => {
                      const maxCount = Math.max(
                        ...(
                          (granularAnalytics?.studentsByState as any[]) || []
                        ).map((s: any) => s.count || 1),
                        1,
                      );
                      const pct = Math.round((item.count / maxCount) * 100);
                      return (
                        <div key={idx} style={{ fontSize: "0.82rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                              fontWeight: "700",
                            }}
                          >
                            <span style={{ color: "var(--text-primary)" }}>
                              State Code:{" "}
                              <strong style={{ color: "#10B981" }}>
                                {item._id || "GLOBAL"}
                              </strong>
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {item.count} Learners
                            </span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "rgba(16,185,129,0.12)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "var(--emerald-gradient)",
                                borderRadius: "3px",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>

            {/* 3. Educator Faculty by Subject */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                height: "fit-content",
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
                <h4
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  👨‍🏫 Faculty Strength
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(245,158,11,0.12)",
                    color: "#F59E0B",
                    fontWeight: "700",
                  }}
                >
                  {
                    ((granularAnalytics?.teachersBySubject as any[]) || [])
                      .length
                  }{" "}
                  Subjects
                </span>
              </div>
              <div
                className="custom-scrollbar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {((granularAnalytics?.teachersBySubject as any[]) || [])
                  .length === 0 ? (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      background: "var(--bg-surface)",
                      borderRadius: "10px",
                    }}
                  >
                    No faculty subject records yet
                  </div>
                ) : (
                  ((granularAnalytics?.teachersBySubject as any[]) || []).map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "var(--bg-surface)",
                          borderRadius: "10px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div
                          style={{ minWidth: 0, flex: 1, marginRight: "8px" }}
                        >
                          <div
                            style={{
                              fontWeight: "800",
                              color: "var(--text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item._id || "General Subject"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.74rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {item.coursesCount} Courses Published
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: "0.72rem", padding: "2px 6px" }}
                          >
                            {item.teachersCount} Teachers
                          </span>
                          <div
                            style={{
                              fontSize: "0.74rem",
                              color: "#10B981",
                              fontWeight: "700",
                              marginTop: "2px",
                            }}
                          >
                            {item.totalEnrolled} Students
                          </div>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            {/* 4. KYC Identity Verification Pipeline */}
            <div
              className="glass-card"
              style={{
                padding: "20px",
                borderRadius: "16px",
                height: "fit-content",
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
                <h4
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: "800",
                    margin: 0,
                    color: "#EC4899",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🛡️ KYC Compliance
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "rgba(236,72,153,0.12)",
                    color: "#EC4899",
                    fontWeight: "700",
                  }}
                >
                  {((granularAnalytics?.studentsByKyc as any[]) || []).length}{" "}
                  Stages
                </span>
              </div>
              <div
                className="custom-scrollbar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {((granularAnalytics?.studentsByKyc as any[]) || []).length ===
                0 ? (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      background: "var(--bg-surface)",
                      borderRadius: "10px",
                    }}
                  >
                    No KYC data recorded yet
                  </div>
                ) : (
                  ((granularAnalytics?.studentsByKyc as any[]) || []).map(
                    (item: any, idx: number) => {
                      const statusLabel =
                        item._id === "VERIFIED" || item._id === "APPROVED"
                          ? "APPROVED & VERIFIED"
                          : item._id === "PENDING"
                            ? "PENDING APPROVAL"
                            : "NOT SUBMITTED";
                      const badgeClass =
                        item._id === "VERIFIED" || item._id === "APPROVED"
                          ? "badge-emerald"
                          : item._id === "PENDING"
                            ? "badge-amber"
                            : "badge-rose";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "9px 12px",
                            background: "var(--bg-surface)",
                            borderRadius: "10px",
                            fontSize: "0.82rem",
                          }}
                        >
                          <span
                            className={`badge ${badgeClass}`}
                            style={{ fontSize: "0.74rem" }}
                          >
                            {statusLabel}
                          </span>
                          <span
                            style={{
                              fontWeight: "800",
                              fontSize: "0.92rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.count} Records
                          </span>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER DIRECTORY TAB */}
      {activeTab === "USERS" && (
        <div
          className="glass-card"
          style={{ padding: "24px", borderRadius: "16px" }}
        >
          {/* Top Header & Overview Banner */}
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
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "800",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Users size={22} style={{ color: "var(--primary-accent)" }} />
                User Management & Directory
                <span
                  className="badge badge-primary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {userPaginationMeta.totalRecords || usersList.length} Total
                  Users
                </span>
              </h3>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                Filter & audit students and teachers by State, Board (CBSE/State
                Board), Subject enrolled or taught, and KYC status.
              </p>
            </div>

            {/* Global Actions */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                value={userDirectorySortBy}
                onChange={(e) => {
                  setUserDirectorySortBy(e.target.value);
                  setUserDirectoryPage(1);
                }}
                className="form-input"
                style={{
                  padding: "6px 10px",
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="-createdAt">Sort: Newest First</option>
                <option value="createdAt">Sort: Oldest First</option>
                <option value="name">Sort: Name (A-Z)</option>
                <option value="-name">Sort: Name (Z-A)</option>
                <option value="role">Sort: Role</option>
                <option value="kycStatus">Sort: KYC Status</option>
              </select>

              <button
                type="button"
                className="btn-amber"
                onClick={() => {
                  setShowBulkUserUploadModal(true);
                  setBulkUserUploadError("");
                  setBulkUserUploadResult(null);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "8px",
                }}
              >
                <UploadCloud size={15} /> Bulk Upload Users (Excel/CSV)
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  loadUsers(
                    userDirectoryPage,
                    userDirectorySortBy,
                    userSearch,
                    roleFilter,
                    userStateFilter,
                    userKycFilter,
                    userBoardFilter,
                    userSubjectFilter,
                  )
                }
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "8px",
                }}
              >
                <RefreshCw size={14} className={isLoadingUsers ? "spin" : ""} />{" "}
                Refresh
              </button>
            </div>
          </div>

          {/* EXECUTIVE VISUAL ANALYTICS & QUICK-FILTER BANNER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {/* 1. Target Board / Goal Card */}
            <div
              className="glass-card"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                borderLeft: "4px solid #4F46E5",
                background: "rgba(79,70,229,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#4F46E5",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>📘 Student Boards & Goals</span>
                <span
                  style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                >
                  Click to filter
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setUserBoardFilter(
                      userBoardFilter === "CBSE" ? "" : "CBSE",
                    );
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "1px solid var(--border-color)",
                    background:
                      userBoardFilter === "CBSE"
                        ? "#4F46E5"
                        : "var(--bg-surface)",
                    color:
                      userBoardFilter === "CBSE"
                        ? "#FFF"
                        : "var(--text-primary)",
                  }}
                >
                  CBSE Board
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserBoardFilter(
                      userBoardFilter === "State" ? "" : "State",
                    );
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "1px solid var(--border-color)",
                    background:
                      userBoardFilter === "State"
                        ? "#4F46E5"
                        : "var(--bg-surface)",
                    color:
                      userBoardFilter === "State"
                        ? "#FFF"
                        : "var(--text-primary)",
                  }}
                >
                  State Boards
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserBoardFilter(
                      userBoardFilter === "ICSE" ? "" : "ICSE",
                    );
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "1px solid var(--border-color)",
                    background:
                      userBoardFilter === "ICSE"
                        ? "#4F46E5"
                        : "var(--bg-surface)",
                    color:
                      userBoardFilter === "ICSE"
                        ? "#FFF"
                        : "var(--text-primary)",
                  }}
                >
                  ICSE Board
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserBoardFilter(
                      userBoardFilter === "Competitive" ? "" : "Competitive",
                    );
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "1px solid var(--border-color)",
                    background:
                      userBoardFilter === "Competitive"
                        ? "#4F46E5"
                        : "var(--bg-surface)",
                    color:
                      userBoardFilter === "Competitive"
                        ? "#FFF"
                        : "var(--text-primary)",
                  }}
                >
                  NEET / JEE / Entrance
                </button>
              </div>
            </div>

            {/* 2. Popular Enrolled / Taught Subjects Card */}
            <div
              className="glass-card"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                borderLeft: "4px solid #10B981",
                background: "rgba(16,185,129,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#10B981",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>📚 Enrolled / Taught Subjects</span>
                <span
                  style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                >
                  Click to filter
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {[
                  "Mathematics",
                  "Physics",
                  "Chemistry",
                  "Biology",
                  "English",
                  "Accounts",
                ].map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setUserSubjectFilter(
                        userSubjectFilter === subj ? "" : subj,
                      );
                      setUserDirectoryPage(1);
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      background:
                        userSubjectFilter === subj
                          ? "#10B981"
                          : "var(--bg-surface)",
                      color:
                        userSubjectFilter === subj
                          ? "#FFF"
                          : "var(--text-primary)",
                    }}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Top Geographic States Chips Card */}
            <div
              className="glass-card"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                borderLeft: "4px solid #F59E0B",
                background: "rgba(245,158,11,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#F59E0B",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>📍 Regional State Distribution</span>
                <span
                  style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                >
                  Quick filter
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {[
                  { code: "BR", name: "Bihar" },
                  { code: "UP", name: "UP" },
                  { code: "MH", name: "Maharashtra" },
                  { code: "DL", name: "Delhi" },
                  { code: "MP", name: "MP" },
                  { code: "KA", name: "Karnataka" },
                  { code: "WB", name: "West Bengal" },
                  { code: "RJ", name: "Rajasthan" },
                ].map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => {
                      setUserStateFilter(
                        userStateFilter === st.code ? "" : st.code,
                      );
                      setUserDirectoryPage(1);
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      border: "1px solid var(--border-color)",
                      background:
                        userStateFilter === st.code
                          ? "#F59E0B"
                          : "var(--bg-surface)",
                      color:
                        userStateFilter === st.code
                          ? "#FFF"
                          : "var(--text-primary)",
                    }}
                  >
                    {st.name} ({st.code})
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Faculty & KYC Pipeline Quick Counter Card */}
            <div
              className="glass-card"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                borderLeft: "4px solid #EC4899",
                background: "rgba(236,72,153,0.03)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#EC4899",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                🛡️ KYC Verification & Role Split
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
                  >
                    Teachers Count
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      color: "#10B981",
                      fontSize: "0.92rem",
                    }}
                  >
                    {stats?.totalTeachers || 0} Faculty
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
                  >
                    Pending KYC
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      color: "#F59E0B",
                      fontSize: "0.92rem",
                    }}
                  >
                    {stats?.totalPendingKyc || 0} Records
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED MULTI-FILTER TOOLBAR */}
          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border-color)",
              marginBottom: "18px",
            }}
          >
            {/* Row 1: Role Selector Tabs & Instant Search Box */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    marginRight: "4px",
                  }}
                >
                  Role Filter:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("");
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background:
                      roleFilter === ""
                        ? "var(--primary-gradient)"
                        : "transparent",
                    color: roleFilter === "" ? "#FFF" : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  All ({stats?.totalUsers || usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("STUDENT");
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background:
                      roleFilter === "STUDENT"
                        ? "var(--primary-gradient)"
                        : "transparent",
                    color:
                      roleFilter === "STUDENT"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  🎓 Students ({stats?.totalStudents || 0})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("TEACHER");
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background:
                      roleFilter === "TEACHER"
                        ? "var(--emerald-gradient)"
                        : "transparent",
                    color:
                      roleFilter === "TEACHER"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  👨‍🏫 Teachers ({stats?.totalTeachers || 0})
                </button>
              </div>

              {/* Instant Search Bar */}
              <div style={{ position: "relative", width: "280px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search Name, Phone, ID, Referral..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserDirectoryPage(1);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    loadUsers(
                      1,
                      userDirectorySortBy,
                      userSearch,
                      roleFilter,
                      userStateFilter,
                      userKycFilter,
                      userBoardFilter,
                      userSubjectFilter,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 30px",
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                  }}
                />
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "9px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            {/* Row 2: Dropdown Filter Inputs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {/* 1. State / Region */}
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  📍 State / Region:
                </label>
                <select
                  value={userStateFilter}
                  onChange={(e) => {
                    setUserStateFilter(e.target.value);
                    setUserDirectoryPage(1);
                  }}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All States / Regions</option>
                  {INDIAN_STATES_LIST.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Board / Goal Target */}
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  🎓 Target Board / Goal:
                </label>
                <select
                  value={userBoardFilter}
                  onChange={(e) => {
                    setUserBoardFilter(e.target.value);
                    setUserDirectoryPage(1);
                  }}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All Target Boards / Goals</option>
                  <option value="CBSE">CBSE Board</option>
                  <option value="ICSE">ICSE / ISC Board</option>
                  <option value="State">
                    State Boards (UP, Bihar, WB, MH, MP, KA)
                  </option>
                  <option value="Competitive">
                    Competitive Exams (NEET / JEE / UPSC)
                  </option>
                  <option value="Undergraduate">Undergraduate & Degrees</option>
                </select>
              </div>

              {/* 3. Subject Focus / Educator Subject */}
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  📚 Subject Focus / Taught:
                </label>
                <select
                  value={userSubjectFilter}
                  onChange={(e) => {
                    setUserSubjectFilter(e.target.value);
                    setUserDirectoryPage(1);
                  }}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="Accounts">Accounts / Commerce</option>
                  <option value="Computer Applications">
                    Computer Science / IT
                  </option>
                  <option value="General Knowledge">
                    General Knowledge / Current Affairs
                  </option>
                </select>
              </div>

              {/* 4. KYC Status */}
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  🛡️ KYC Status:
                </label>
                <select
                  value={userKycFilter}
                  onChange={(e) => {
                    setUserKycFilter(e.target.value);
                    setUserDirectoryPage(1);
                  }}
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">All KYC Statuses</option>
                  <option value="VERIFIED">VERIFIED & APPROVED</option>
                  <option value="PENDING">PENDING APPROVAL</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="NOT_SUBMITTED">NOT SUBMITTED</option>
                </select>
              </div>

              {/* 5. Clear All Filters Button */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setRoleFilter("");
                    setUserStateFilter("");
                    setUserBoardFilter("");
                    setUserSubjectFilter("");
                    setUserKycFilter("");
                    setUserSearch("");
                    setUserDirectoryPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <RefreshCw size={13} /> Clear Filters
                  {(roleFilter ||
                    userStateFilter ||
                    userBoardFilter ||
                    userSubjectFilter ||
                    userKycFilter ||
                    userSearch) && (
                    <span
                      className="badge badge-amber"
                      style={{ fontSize: "0.65rem", padding: "1px 5px" }}
                    >
                      Active
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* HIGH-DENSITY USER DATA TABLE */}
          <div
            style={{
              overflowX: "auto",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-surface)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>User Account</th>
                  <th style={{ padding: "12px 16px" }}>Role & Status</th>
                  <th style={{ padding: "12px 16px" }}>Contact Info</th>
                  <th style={{ padding: "12px 16px" }}>State Region</th>
                  <th style={{ padding: "12px 16px" }}>
                    Academic / Educator Profile
                  </th>
                  <th style={{ padding: "12px 16px" }}>KYC Status</th>
                  <th style={{ padding: "12px 16px" }}>Wallet Balance</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Loading user accounts...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No matching user accounts found for selected filters.
                    </td>
                  </tr>
                ) : (
                  usersList.map((usr) => {
                    const isBlocked = usr.isBlocked || usr.status === "BLOCKED";

                    let roleBadgeClass = "badge-primary";
                    let roleIcon = "🎓";
                    if (usr.role === "TEACHER") {
                      roleBadgeClass = "badge-emerald";
                      roleIcon = "👨‍🏫";
                    } else if (usr.role === "ADMIN") {
                      roleBadgeClass = "badge-rose";
                      roleIcon = "🛡️";
                    }

                    const kycBadge =
                      usr.kycStatus === "VERIFIED" ? (
                        <span
                          className="badge badge-emerald"
                          style={{ fontSize: "0.7rem" }}
                        >
                          ✓ VERIFIED
                        </span>
                      ) : usr.kycStatus === "PENDING" ? (
                        <span
                          className="badge badge-amber"
                          style={{ fontSize: "0.7rem" }}
                        >
                          ⏳ PENDING
                        </span>
                      ) : usr.kycStatus === "REJECTED" ? (
                        <span
                          className="badge badge-rose"
                          style={{ fontSize: "0.7rem" }}
                        >
                          ❌ REJECTED
                        </span>
                      ) : (
                        <span
                          className="badge badge-secondary"
                          style={{ fontSize: "0.7rem", opacity: 0.6 }}
                        >
                          ⚪ NOT SUBMITTED
                        </span>
                      );

                    const stateObj = INDIAN_STATES_LIST.find(
                      (s) => s.code === usr.stateCode,
                    );
                    const stateLabel = stateObj
                      ? `${usr.stateCode} (${stateObj.name})`
                      : usr.stateCode || "GLOBAL";

                    const boardLabel =
                      usr.learningPreference?.boardOrGrade ||
                      usr.learningPreference?.subCategoryTitle ||
                      "General Board";
                    const subjectPref = usr.learningPreference?.subjectName;
                    const enrolledCount =
                      usr.enrolledCount ||
                      (usr.enrolledCourses ? usr.enrolledCourses.length : 0);
                    const taughtSubjects =
                      usr.taughtSubjects && usr.taughtSubjects.length > 0
                        ? usr.taughtSubjects.join(", ")
                        : null;
                    const coursesCount =
                      usr.coursesCount ||
                      (usr.coursesTaught ? usr.coursesTaught.length : 0);

                    return (
                      <tr
                        key={usr._id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          background: isBlocked
                            ? "rgba(244,63,94,0.04)"
                            : "transparent",
                        }}
                      >
                        {/* 1. User Account */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                background:
                                  usr.role === "TEACHER"
                                    ? "var(--emerald-gradient)"
                                    : "var(--primary-gradient)",
                                color: "#FFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                              }}
                            >
                              {usr.name
                                ? usr.name.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: "800",
                                  color: "var(--text-primary)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {usr.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  fontFamily: "monospace",
                                }}
                              >
                                {usr.userId} • Ref: {usr.referralCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role & Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                              alignItems: "flex-start",
                            }}
                          >
                            <span
                              className={`badge ${roleBadgeClass}`}
                              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                            >
                              {roleIcon} {usr.role}
                            </span>
                            {isBlocked ? (
                              <span
                                className="badge badge-rose"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "1px 5px",
                                }}
                              >
                                BLOCKED
                              </span>
                            ) : (
                              <span
                                className="badge badge-emerald"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "1px 5px",
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Contact Info */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "var(--text-primary)",
                              fontSize: "0.8rem",
                            }}
                          >
                            {usr.mobile}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {usr.email || "No email"}
                          </div>
                        </td>

                        {/* 4. State Region */}
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: "0.72rem", fontWeight: "700" }}
                          >
                            📍 {stateLabel}
                          </span>
                        </td>

                        {/* 5. Academic / Educator Profile */}
                        <td style={{ padding: "12px 16px" }}>
                          {usr.role === "STUDENT" ? (
                            <div>
                              <div
                                style={{
                                  fontWeight: "700",
                                  color: "var(--primary-accent)",
                                  fontSize: "0.78rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                🎓 {boardLabel}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                Subject:{" "}
                                <strong
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {subjectPref || "All Subjects"}
                                </strong>
                                {enrolledCount > 0 && (
                                  <span
                                    className="badge badge-primary"
                                    style={{
                                      fontSize: "0.65rem",
                                      marginLeft: "6px",
                                    }}
                                  >
                                    {enrolledCount} Courses Enrolled
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : usr.role === "TEACHER" ? (
                            <div>
                              <div
                                style={{
                                  fontWeight: "700",
                                  color: "#10B981",
                                  fontSize: "0.78rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                👨‍🏫 {taughtSubjects || "All Subjects Specialist"}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                Published Batches:{" "}
                                <strong style={{ color: "#F59E0B" }}>
                                  {coursesCount} Courses
                                </strong>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              Master Admin System Access
                            </div>
                          )}
                        </td>

                        {/* 6. KYC Status */}
                        <td style={{ padding: "12px 16px" }}>{kycBadge}</td>

                        {/* 7. Wallet Balance */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: "#10B981",
                              fontSize: "0.8rem",
                            }}
                          >
                            ₹{(usr.walletBalance || 0).toLocaleString("en-IN")}
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td
                          style={{ padding: "12px 16px", textAlign: "right" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setSelectedDetailUser(usr)}
                              style={{
                                fontSize: "0.75rem",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Inspect Full Profile"
                            >
                              <Eye size={14} /> View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {userPaginationMeta.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "16px",
                flexWrap: "wrap",
                gap: "12px",
                padding: "8px 4px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Showing{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {Math.min(
                    (userPaginationMeta.page - 1) * userPaginationMeta.limit +
                      1,
                    userPaginationMeta.totalRecords,
                  )}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {Math.min(
                    userPaginationMeta.page * userPaginationMeta.limit,
                    userPaginationMeta.totalRecords,
                  )}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {userPaginationMeta.totalRecords}
                </strong>{" "}
                Users
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!userPaginationMeta.hasPrevPage || isLoadingUsers}
                  onClick={() =>
                    setUserDirectoryPage((prev) => Math.max(1, prev - 1))
                  }
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.78rem",
                    borderRadius: "6px",
                    opacity: userPaginationMeta.hasPrevPage ? 1 : 0.5,
                    cursor: userPaginationMeta.hasPrevPage
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  Previous
                </button>

                {Array.from(
                  { length: userPaginationMeta.totalPages },
                  (_, idx) => idx + 1,
                )
                  .filter((p) => {
                    const current = userPaginationMeta.page;
                    return (
                      p === 1 ||
                      p === userPaginationMeta.totalPages ||
                      Math.abs(p - current) <= 2
                    );
                  })
                  .reduce<(number | string)[]>((acc, p, index, arr) => {
                    if (
                      index > 0 &&
                      typeof arr[index - 1] === "number" &&
                      (p as number) - (arr[index - 1] as number) > 1
                    ) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (item === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          style={{
                            padding: "0 4px",
                            color: "var(--text-muted)",
                          }}
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    const isActive = pageNum === userPaginationMeta.page;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserDirectoryPage(pageNum)}
                        disabled={isLoadingUsers}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: isActive
                            ? "var(--primary-gradient)"
                            : "transparent",
                          color: isActive ? "#FFF" : "var(--text-secondary)",
                          fontWeight: isActive ? "800" : "600",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!userPaginationMeta.hasNextPage || isLoadingUsers}
                  onClick={() =>
                    setUserDirectoryPage((prev) =>
                      Math.min(userPaginationMeta.totalPages, prev + 1),
                    )
                  }
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.78rem",
                    borderRadius: "6px",
                    opacity: userPaginationMeta.hasNextPage ? 1 : 0.5,
                    cursor: userPaginationMeta.hasNextPage
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COURSES DIRECTORY TAB */}
      {activeTab === "COURSES" && (
        <div
          className="glass-card"
          style={{ padding: "24px", borderRadius: "16px" }}
        >
          {/* Top Control Bar */}
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <BookOpen
                  size={20}
                  style={{ color: "var(--primary-accent)" }}
                />
                Course Directory
                <span
                  className="badge badge-primary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {coursePaginationMeta.totalRecords || coursesList.length}{" "}
                  Total
                </span>
              </h3>

              {/* Course Mode Quick Switch Buttons */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setCourseModeFilter("");
                    setCourseDirectoryPage(1);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background:
                      courseModeFilter === ""
                        ? "var(--primary-gradient)"
                        : "transparent",
                    color:
                      courseModeFilter === ""
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  All Modes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCourseModeFilter("LIVE_ONLINE");
                    setCourseDirectoryPage(1);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background:
                      courseModeFilter === "LIVE_ONLINE"
                        ? "var(--primary-gradient)"
                        : "transparent",
                    color:
                      courseModeFilter === "LIVE_ONLINE"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  🎥 Live Online
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCourseModeFilter("RECORDED_VIDEO");
                    setCourseDirectoryPage(1);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background:
                      courseModeFilter === "RECORDED_VIDEO"
                        ? "var(--emerald-gradient)"
                        : "transparent",
                    color:
                      courseModeFilter === "RECORDED_VIDEO"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  📹 Recorded
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCourseModeFilter("HYBRID");
                    setCourseDirectoryPage(1);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background:
                      courseModeFilter === "HYBRID"
                        ? "var(--amber-gradient)"
                        : "transparent",
                    color:
                      courseModeFilter === "HYBRID"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  ⚡ Hybrid
                </button>
              </div>
            </div>

            {/* Right Search Input, Sort Selector & Actions */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                value={courseDirectorySortBy}
                onChange={(e) => {
                  setCourseDirectorySortBy(e.target.value);
                  setCourseDirectoryPage(1);
                }}
                className="form-input"
                style={{
                  padding: "6px 10px",
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="-createdAt">Sort: Newest First</option>
                <option value="createdAt">Sort: Oldest First</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="-title">Sort: Title (Z-A)</option>
                <option value="price">Sort: Price (Low to High)</option>
                <option value="-price">Sort: Price (High to Low)</option>
              </select>

              <button
                type="button"
                className="btn-amber"
                onClick={() => {
                  setShowBulkUploadModal(true);
                  setBulkUploadError("");
                  setBulkUploadResult(null);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "8px",
                }}
              >
                <UploadCloud size={15} /> Bulk Upload Courses (Excel/CSV)
              </button>

              <button
                type="button"
                className="btn-rose"
                onClick={() => setShowCreateCourseModal(true)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "8px",
                }}
              >
                <Plus size={14} /> Create Course
              </button>

              <div style={{ position: "relative", width: "220px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search course, grade, subject..."
                  value={courseSearch}
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setCourseDirectoryPage(1);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    loadCourses(
                      1,
                      courseDirectorySortBy,
                      courseSearch,
                      courseModeFilter,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "6px 10px 6px 28px",
                    fontSize: "0.78rem",
                    borderRadius: "8px",
                  }}
                />
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  loadCourses(
                    courseDirectoryPage,
                    courseDirectorySortBy,
                    courseSearch,
                    courseModeFilter,
                  )
                }
                style={{
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "8px",
                }}
              >
                <RefreshCw
                  size={14}
                  className={isLoadingCourses ? "spin" : ""}
                />{" "}
                Refresh
              </button>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {isLoadingCourses ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                Loading courses...
              </div>
            ) : coursesList.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No courses found. Click "Create Course" to add one!
              </div>
            ) : (
              coursesList.map((crs) => (
                <div
                  key={crs._id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: crs.active
                      ? "rgba(16,185,129,0.04)"
                      : "rgba(244,63,94,0.04)",
                    border: "1px solid var(--border-color)",
                    borderLeft: crs.active
                      ? "4px solid #10B981"
                      : "4px solid #F43F5E",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
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
                      <span style={{ fontWeight: "800", fontSize: "0.95rem" }}>
                        {crs.title}
                      </span>
                      <span
                        className="badge badge-emerald"
                        style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                      >
                        {crs.boardOrGrade || "General Batch"}
                      </span>
                      <span
                        className="badge badge-amber"
                        style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                      >
                        State: {crs.stateCode}
                      </span>
                      {crs.active ? (
                        <span
                          className="badge badge-primary"
                          style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                        >
                          PUBLISHED
                        </span>
                      ) : (
                        <span
                          className="badge badge-rose"
                          style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                        >
                          UNPUBLISHED
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Delivery:{" "}
                      <strong>{crs.courseMode || "RECORDED_VIDEO"}</strong> •
                      Price:{" "}
                      <strong style={{ color: "#34D399" }}>₹{crs.price}</strong>{" "}
                      (MRP: ₹{crs.originalPrice}) • Creator:{" "}
                      <strong style={{ color: "#F59E0B" }}>
                        {crs.instructor
                          ? `${crs.instructor.name} (${crs.instructor.role || "TEACHER"})`
                          : "Platform Admin"}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                  >
                    <button
                      className="btn-secondary"
                      onClick={() => handleInspectCourseRoster(crs._id)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "5px 10px",
                        color: "#60A5FA",
                        borderColor: "rgba(96,165,250,0.3)",
                      }}
                    >
                      <Users size={13} style={{ marginRight: "4px" }} />{" "}
                      Enrolled Students ({crs.totalStudents || 0})
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setSelectedCourseDetail(crs)}
                      style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                    >
                      <Eye size={13} style={{ marginRight: "4px" }} /> View
                      Details
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleOpenEditModal(crs)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "5px 10px",
                        color: "#FBBF24",
                        borderColor: "rgba(245,158,11,0.3)",
                      }}
                    >
                      <Edit3 size={13} style={{ marginRight: "4px" }} /> Edit
                    </button>
                    <button
                      className="btn-rose"
                      onClick={() => handleDeleteCourseItem(crs._id)}
                      style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                    >
                      <Trash2 size={13} style={{ marginRight: "4px" }} /> Delete
                    </button>
                    <button
                      className={crs.active ? "btn-secondary" : "btn-emerald"}
                      onClick={() =>
                        handleToggleCourseActive(crs._id, crs.active)
                      }
                      style={{
                        fontSize: "0.75rem",
                        padding: "5px 10px",
                        color: crs.active ? "#FB7185" : "#FFF",
                        borderColor: crs.active
                          ? "rgba(244,63,94,0.3)"
                          : undefined,
                      }}
                    >
                      {crs.active ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls Bar */}
          {coursePaginationMeta.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "16px",
                flexWrap: "wrap",
                gap: "12px",
                padding: "8px 4px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Showing{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {Math.min(
                    (coursePaginationMeta.page - 1) *
                      coursePaginationMeta.limit +
                      1,
                    coursePaginationMeta.totalRecords,
                  )}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {Math.min(
                    coursePaginationMeta.page * coursePaginationMeta.limit,
                    coursePaginationMeta.totalRecords,
                  )}
                </strong>{" "}
                of{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {coursePaginationMeta.totalRecords}
                </strong>{" "}
                Courses
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    !coursePaginationMeta.hasPrevPage || isLoadingCourses
                  }
                  onClick={() =>
                    setCourseDirectoryPage((prev) => Math.max(1, prev - 1))
                  }
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.78rem",
                    borderRadius: "6px",
                    opacity: coursePaginationMeta.hasPrevPage ? 1 : 0.5,
                    cursor: coursePaginationMeta.hasPrevPage
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  Previous
                </button>

                {Array.from(
                  { length: coursePaginationMeta.totalPages },
                  (_, idx) => idx + 1,
                )
                  .filter((p) => {
                    const current = coursePaginationMeta.page;
                    return (
                      p === 1 ||
                      p === coursePaginationMeta.totalPages ||
                      Math.abs(p - current) <= 2
                    );
                  })
                  .reduce<(number | string)[]>((acc, p, index, arr) => {
                    if (
                      index > 0 &&
                      typeof arr[index - 1] === "number" &&
                      (p as number) - (arr[index - 1] as number) > 1
                    ) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (item === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          style={{
                            padding: "0 4px",
                            color: "var(--text-muted)",
                          }}
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    const isActive = pageNum === coursePaginationMeta.page;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCourseDirectoryPage(pageNum)}
                        disabled={isLoadingCourses}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: isActive
                            ? "var(--primary-gradient)"
                            : "transparent",
                          color: isActive ? "#FFF" : "var(--text-secondary)",
                          fontWeight: isActive ? "800" : "600",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    !coursePaginationMeta.hasNextPage || isLoadingCourses
                  }
                  onClick={() =>
                    setCourseDirectoryPage((prev) =>
                      Math.min(coursePaginationMeta.totalPages, prev + 1),
                    )
                  }
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.78rem",
                    borderRadius: "6px",
                    opacity: coursePaginationMeta.hasNextPage ? 1 : 0.5,
                    cursor: coursePaginationMeta.hasNextPage
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KYC QUEUE TAB WITH STATUS FILTERS */}
      {activeTab === "KYC" && (
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
              Student KYC Verification Management Queue ({kycList.length})
            </h3>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setKycStatusFilter("PENDING")}
                className={
                  kycStatusFilter === "PENDING" ? "btn-amber" : "btn-secondary"
                }
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                PENDING REQUESTS
              </button>
              <button
                type="button"
                onClick={() => setKycStatusFilter("VERIFIED")}
                className={
                  kycStatusFilter === "VERIFIED"
                    ? "btn-emerald"
                    : "btn-secondary"
                }
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                APPROVED / VERIFIED
              </button>
              <button
                type="button"
                onClick={() => setKycStatusFilter("REJECTED")}
                className={
                  kycStatusFilter === "REJECTED" ? "btn-rose" : "btn-secondary"
                }
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                REJECTED
              </button>
              <button
                type="button"
                onClick={() => setKycStatusFilter("ALL")}
                className={
                  kycStatusFilter === "ALL" ? "btn-primary" : "btn-secondary"
                }
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                ALL RECORDS
              </button>
            </div>
          </div>

          {isLoadingKyc ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              Loading KYC records...
            </div>
          ) : kycList.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No KYC verification records found in this category.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {kycList.map((item) => {
                const isVerified =
                  (item.status as string) === "APPROVED" ||
                  item.status === "VERIFIED";
                const isRejected = item.status === "REJECTED";

                return (
                  <div
                    key={item._id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderLeft: isVerified
                        ? "4px solid #10B981"
                        : isRejected
                          ? "4px solid #F43F5E"
                          : "4px solid #F59E0B",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
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
                          style={{ fontWeight: "800", fontSize: "0.95rem" }}
                        >
                          {item.user?.name || "Student"}
                        </span>
                        <span
                          className="badge badge-amber"
                          style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                        >
                          ID: {item.user?.userId || "N/A"}
                        </span>
                        <span
                          className={`badge ${isVerified ? "badge-emerald" : isRejected ? "badge-rose" : "badge-amber"}`}
                          style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                        >
                          {isVerified
                            ? "VERIFIED & APPROVED"
                            : isRejected
                              ? "REJECTED"
                              : "PENDING APPROVAL"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Doc Type: <strong>{item.documentType}</strong> • ID
                        Number:{" "}
                        <strong style={{ color: "#34D399" }}>
                          {item.documentNumber || "N/A"}
                        </strong>{" "}
                        • Mobile: {item.user?.mobile || "N/A"}
                      </div>
                      {isRejected && item.rejectionReason && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#FB7185",
                            background: "rgba(244,63,94,0.1)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            marginTop: "6px",
                          }}
                        >
                          ❌ <strong>Rejection Reason:</strong>{" "}
                          {item.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      <button
                        className="btn-secondary"
                        onClick={() => setPreviewKycDoc(item)}
                        style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                      >
                        <Eye size={13} style={{ marginRight: "4px" }} /> Inspect
                        Document
                      </button>

                      {!isVerified && (
                        <button
                          className="btn-emerald"
                          onClick={() => handleApproveKyc(item._id)}
                          style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                        >
                          <CheckCircle2
                            size={13}
                            style={{ marginRight: "4px" }}
                          />{" "}
                          Approve KYC
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          className="btn-rose"
                          onClick={() => handleOpenRejectKycModal(item)}
                          style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                        >
                          <XCircle size={13} style={{ marginRight: "4px" }} />{" "}
                          Reject KYC
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PAYOUTS QUEUE TAB */}
      {activeTab === "PAYOUTS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 100% DYNAMIC MLM REFERRAL & COMMISSION CONFIGURATION PANEL */}
          <div
            className="glass-card"
            style={{
              padding: "28px",
              borderRadius: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-card)",
              position: "relative",
            }}
          >
            {/* Header Section */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--badge-primary-bg)",
                    color: "var(--badge-primary-color)",
                    border: "1px solid var(--badge-primary-border)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  <SlidersHorizontal size={12} /> Dynamic Commission Engine
                </div>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    margin: "2px 0 6px",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  Referral & Commission Control Center
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.84rem",
                    margin: 0,
                    maxWidth: "640px",
                    lineHeight: "1.45",
                  }}
                >
                  Control pair matching rates, referral volumes, safety payout
                  caps, and tax deductions dynamically. Changes apply instantly
                  across the entire platform.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={loadMlmConfig}
                  disabled={isLoadingMlmConfig}
                  style={{
                    padding: "9px 15px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-surface)",
                  }}
                >
                  <RefreshCw
                    size={14}
                    className={isLoadingMlmConfig ? "animate-spin" : ""}
                  />
                  <span>Reload</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveMlmConfig}
                  disabled={isSavingMlmConfig}
                  style={{
                    padding: "9px 20px",
                    fontSize: "0.84rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                    cursor: isSavingMlmConfig ? "not-allowed" : "pointer",
                  }}
                >
                  <Save size={15} />
                  <span>
                    {isSavingMlmConfig
                      ? "Saving Changes..."
                      : "Save & Apply Rules"}
                  </span>
                </button>
              </div>
            </div>

            {mlmConfigMsg && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "11px 16px",
                  borderRadius: "12px",
                  background: mlmConfigMsg.startsWith("✅")
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(244,63,94,0.08)",
                  border: mlmConfigMsg.startsWith("✅")
                    ? "1px solid rgba(16,185,129,0.3)"
                    : "1px solid rgba(244,63,94,0.3)",
                  color: mlmConfigMsg.startsWith("✅") ? "#059669" : "#E11D48",
                  fontSize: "0.84rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {mlmConfigMsg.startsWith("✅") ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{mlmConfigMsg}</span>
              </div>
            )}

            {/* 6 Config Inputs - Symmetrical 3x2 Balanced Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "16px",
                marginBottom: "22px",
              }}
            >
              {/* Card 1: Per Referral PV */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(79, 70, 229, 0.1)",
                        color: "var(--primary-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      Referral Volume (PV)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    PV points credited to sponsor per verified signup
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    value={mlmConfig.perReferralPV}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        perReferralPV: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    PV
                  </span>
                </div>
              </div>

              {/* Card 2: 1:1 Matching Bonus Rate (%) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#D97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Percent size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      Pair Matching Bonus (%)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    Payout percentage on matched left & right volume
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={mlmConfig.matchingRatePercentage}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        matchingRatePercentage: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Card 3: Direct Referral Cash Bonus (₹) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(14, 165, 233, 0.12)",
                        color: "#0284C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Gift size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      Direct Signup Bonus (₹)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    Instant flat cash credited on direct referral (optional)
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={mlmConfig.directReferralBonus}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        directReferralBonus: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    INR
                  </span>
                </div>
              </div>

              {/* Card 4: Daily Capping Limit (₹) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Shield size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      Daily Payout Capping (₹)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    Safety payout ceiling allowed per user / day
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: "800",
                      color: "var(--text-muted)",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={mlmConfig.dailyCappingLimit}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        dailyCappingLimit: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    /day
                  </span>
                </div>
              </div>

              {/* Card 5: Admin Service Charge (%) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Percent size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      Admin Platform Fee (%)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    Platform maintenance deducted automatically on payout
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mlmConfig.adminFeePercentage}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        adminFeePercentage: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Card 6: TDS Tax Deduction (%) */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "rgba(168, 85, 247, 0.1)",
                        color: "#7E22CE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileCheck size={15} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      TDS Statutory Tax (%)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      paddingLeft: "36px",
                    }}
                  >
                    Govt compliance tax withheld on settlement
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mlmConfig.tdsPercentage}
                    onChange={(e) =>
                      setMlmConfig({
                        ...mlmConfig,
                        tdsPercentage: Number(e.target.value),
                      })
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "1.2rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      background: "var(--bg-surface)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Live Calculation Simulation Strip - Fintech Style */}
            {(() => {
              const previewMatched = mlmConfig.perReferralPV || 100;
              const previewGross = Math.round(
                previewMatched *
                  ((mlmConfig.matchingRatePercentage || 10) / 100),
              );
              const previewAdmin = Math.round(
                previewGross * ((mlmConfig.adminFeePercentage || 5) / 100),
              );
              const previewTds = Math.round(
                previewGross * ((mlmConfig.tdsPercentage || 5) / 100),
              );
              const previewNet = previewGross - previewAdmin - previewTds;
              return (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "16px 20px",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
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
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#10B981",
                          display: "inline-block",
                          boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Live Settlement Preview (Per 1 Matched Pair ={" "}
                        {previewMatched} PV)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Auto-updates with parameters
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      background: "var(--bg-card)",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        Gross Pair Bonus
                      </span>
                      <strong
                        style={{
                          fontSize: "1.05rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        ₹{previewGross}
                      </strong>
                    </div>

                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        fontWeight: "700",
                      }}
                    >
                      −
                    </span>

                    <div>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        Admin Fee ({mlmConfig.adminFeePercentage}%)
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#EF4444" }}>
                        ₹{previewAdmin}
                      </strong>
                    </div>

                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        fontWeight: "700",
                      }}
                    >
                      −
                    </span>

                    <div>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        TDS ({mlmConfig.tdsPercentage}%)
                      </span>
                      <strong style={{ fontSize: "1.05rem", color: "#EF4444" }}>
                        ₹{previewTds}
                      </strong>
                    </div>

                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        fontWeight: "700",
                      }}
                    >
                      =
                    </span>

                    <div
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "6px 14px",
                        borderRadius: "10px",
                      }}
                    >
                      <span
                        style={{
                          color: "#059669",
                          fontSize: "0.7rem",
                          fontWeight: "800",
                          display: "block",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Net Wallet Credit
                      </span>
                      <strong
                        style={{
                          fontSize: "1.15rem",
                          color: "#059669",
                          fontWeight: "800",
                        }}
                      >
                        ₹{previewNet}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#059669",
                          marginLeft: "4px",
                          fontWeight: "700",
                        }}
                      >
                        / pair
                      </span>
                    </div>

                    {mlmConfig.directReferralBonus > 0 && (
                      <div
                        style={{
                          marginLeft: "auto",
                          background: "rgba(14, 165, 233, 0.08)",
                          border: "1px solid rgba(14, 165, 233, 0.25)",
                          padding: "6px 14px",
                          borderRadius: "10px",
                        }}
                      >
                        <span
                          style={{
                            color: "#0284C7",
                            fontSize: "0.7rem",
                            fontWeight: "800",
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Direct Signup Cash
                        </span>
                        <strong
                          style={{
                            fontSize: "1.05rem",
                            color: "#0284C7",
                            fontWeight: "800",
                          }}
                        >
                          + ₹{mlmConfig.directReferralBonus}
                        </strong>{" "}
                        <span style={{ fontSize: "0.72rem", color: "#0284C7" }}>
                          instant
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        marginLeft:
                          mlmConfig.directReferralBonus > 0 ? "0" : "auto",
                        textAlign: "right",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        Daily Safety Cap
                      </span>
                      <strong
                        style={{
                          fontSize: "1rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        ₹{mlmConfig.dailyCappingLimit?.toLocaleString("en-IN")}
                        /day
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Binary MLM Payout Settlement Execution Card */}
          <div
            className="glass-card"
            style={{
              padding: "24px 28px",
              borderRadius: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderLeft: "5px solid #F59E0B",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <span
                  className="badge badge-amber"
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 10px",
                    marginBottom: "8px",
                    display: "inline-block",
                  }}
                >
                  AUTOMATED BINARY SETTLEMENT ENGINE
                </span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    margin: "4px 0 6px",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Zap size={20} color="#D97706" /> Run Binary MLM Pair
                  Settlement & Carry-Forward Engine
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    margin: 0,
                    maxWidth: "680px",
                    lineHeight: "1.45",
                  }}
                >
                  Matches 1:1 binary PV volume across all partner legs, flushes
                  matched volume, rolls over carry-forward PV, enforces the ₹
                  {mlmConfig.dailyCappingLimit?.toLocaleString("en-IN")} daily
                  safety cap, applies {mlmConfig.adminFeePercentage}% Admin Fee
                  + {mlmConfig.tdsPercentage}% TDS, and credits Net Payout
                  directly into user wallets.
                </p>
              </div>

              <button
                className="btn-amber"
                onClick={handleRunMlmSettlement}
                disabled={isExecutingSettlement}
                style={{
                  padding: "12px 24px",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)",
                  cursor: isExecutingSettlement ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw
                  size={16}
                  className={isExecutingSettlement ? "animate-spin" : ""}
                />
                <span>
                  {isExecutingSettlement
                    ? "Processing Settlement..."
                    : "Run Payout Settlement Now"}
                </span>
              </button>
            </div>

            {settlementResultMsg && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#059669",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{settlementResultMsg}</span>
              </div>
            )}
          </div>

          {/* COMPREHENSIVE WITHDRAWAL REQUESTS QUEUE */}
          <div
            className="glass-card"
            style={{ padding: "24px 28px", borderRadius: "18px" }}
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
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    fontWeight: "800",
                  }}
                >
                  BANK & UPI DISBURSEMENTS
                </span>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    marginTop: "4px",
                    color: "var(--text-primary)",
                  }}
                >
                  Student (MLM) & Teacher (Royalty) Withdrawal Requests (
                  {adminWithdrawalsList.length})
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Verify requester account details, copy Bank / UPI info for
                  IMPS/NEFT transfers, and confirm with UTR transaction numbers.
                </p>
              </div>

              <button
                className="btn-secondary"
                onClick={loadAdminWithdrawals}
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
                  className={isLoadingAdminWithdrawals ? "animate-spin" : ""}
                />{" "}
                Refresh Queue
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "18px",
                alignItems: "center",
              }}
            >
              {/* Status Tabs */}
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
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setWithdrawalFilterStatus(st)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        withdrawalFilterStatus === st
                          ? "var(--primary-gradient)"
                          : "transparent",
                      color:
                        withdrawalFilterStatus === st
                          ? "#FFF"
                          : "var(--text-secondary)",
                      fontSize: "0.76rem",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    {st === "ALL" && `All (${adminWithdrawalsList.length})`}
                    {st === "PENDING" &&
                      `Pending (${adminWithdrawalsList.filter((w) => w.status === "PENDING").length})`}
                    {st === "APPROVED" &&
                      `Approved (${adminWithdrawalsList.filter((w) => w.status === "APPROVED").length})`}
                    {st === "REJECTED" &&
                      `Rejected (${adminWithdrawalsList.filter((w) => w.status === "REJECTED").length})`}
                  </button>
                ))}
              </div>

              {/* Role Filter */}
              <select
                className="form-input"
                value={withdrawalFilterRole}
                onChange={(e) => setWithdrawalFilterRole(e.target.value)}
                style={{
                  padding: "6px 10px",
                  fontSize: "0.8rem",
                  width: "auto",
                  minWidth: "160px",
                }}
              >
                <option value="ALL">All Roles (Student & Teacher)</option>
                <option value="STUDENT">🎓 Students (MLM Commissions)</option>
                <option value="TEACHER">👨‍🏫 Teachers (Course Royalties)</option>
              </select>

              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search name, mobile, user ID, A/C, UPI, UTR..."
                  value={withdrawalSearchQuery}
                  onChange={(e) => setWithdrawalSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 10px 6px 30px",
                    fontSize: "0.8rem",
                    width: "100%",
                  }}
                />
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            {/* Withdrawals List */}
            {isLoadingAdminWithdrawals ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading withdrawal requests queue...
              </div>
            ) : adminWithdrawalsList.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  background: "var(--bg-surface)",
                  borderRadius: "14px",
                  border: "1px dashed var(--border-color)",
                }}
              >
                <Building2
                  size={36}
                  style={{ margin: "0 auto 10px", opacity: 0.5 }}
                />
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    marginBottom: "4px",
                  }}
                >
                  No Withdrawal Requests Found
                </div>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  No requests matching current filter ({withdrawalFilterStatus}{" "}
                  / {withdrawalFilterRole}).
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {adminWithdrawalsList.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isApproved = item.status === "APPROVED";
                  const isRejected = item.status === "REJECTED";
                  const isStudent = item.userRole === "STUDENT";

                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: "18px 22px",
                        borderRadius: "14px",
                        background: "var(--bg-surface)",
                        border: isPending
                          ? "1px solid rgba(245, 158, 11, 0.4)"
                          : "1px solid var(--border-color)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Card Top Row: Requester Info, Role, Amount & Status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className={
                              isStudent
                                ? "badge badge-primary"
                                : "badge badge-emerald"
                            }
                            style={{
                              fontSize: "0.74rem",
                              padding: "3px 10px",
                              fontWeight: "800",
                            }}
                          >
                            {isStudent
                              ? "🎓 STUDENT (MLM EARNINGS)"
                              : "👨‍🏫 TEACHER (ROYALTIES)"}
                          </span>

                          <span
                            style={{
                              fontWeight: "800",
                              fontSize: "1rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.user?.name || "User"}
                          </span>

                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ID:{" "}
                            <code style={{ color: "var(--primary-accent)" }}>
                              {item.user?.userId || "N/A"}
                            </code>{" "}
                            • Mobile:{" "}
                            <strong>{item.user?.mobile || "N/A"}</strong>
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "1.4rem",
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
                                  : isPending
                                    ? "badge badge-amber"
                                    : "badge badge-slate"
                            }
                            style={{ fontSize: "0.74rem", padding: "3px 10px" }}
                          >
                            {isApproved && "✅ APPROVED & PAID"}
                            {isPending && "🟡 PENDING APPROVAL"}
                            {isRejected && "❌ REJECTED"}
                            {item.status === "CANCELLED" && "⚪ CANCELLED"}
                          </span>
                        </div>
                      </div>

                      {/* Card Middle: Bank / UPI Details Destination Box */}
                      <div
                        style={{
                          padding: "14px 18px",
                          borderRadius: "12px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.07)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        {item.payoutMethod === "BANK" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "20px",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "800",
                                color: "var(--primary-accent)",
                                fontSize: "0.85rem",
                              }}
                            >
                              <Building2 size={18} />
                              <span>
                                {item.bankDetails?.bankName || "Bank Transfer"}
                              </span>
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  display: "block",
                                }}
                              >
                                A/C HOLDER
                              </span>
                              <span
                                style={{
                                  fontSize: "0.84rem",
                                  fontWeight: "700",
                                }}
                              >
                                {item.bankDetails?.accountHolderName}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    display: "block",
                                  }}
                                >
                                  ACCOUNT NUMBER
                                </span>
                                <code
                                  style={{
                                    fontSize: "0.9rem",
                                    fontWeight: "800",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {item.bankDetails?.accountNumber}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    item.bankDetails?.accountNumber || "",
                                    `acc_${item._id}`,
                                  )
                                }
                                className="btn-secondary"
                                style={{
                                  padding: "3px 7px",
                                  fontSize: "0.72rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                                title="Copy Account Number"
                              >
                                {copiedKey === `acc_${item._id}` ? (
                                  <Check size={12} color="#34D399" />
                                ) : (
                                  <Copy size={12} />
                                )}
                                {copiedKey === `acc_${item._id}`
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    display: "block",
                                  }}
                                >
                                  IFSC CODE
                                </span>
                                <code
                                  style={{
                                    fontSize: "0.9rem",
                                    fontWeight: "800",
                                    color: "#F59E0B",
                                  }}
                                >
                                  {item.bankDetails?.ifscCode}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    item.bankDetails?.ifscCode || "",
                                    `ifsc_${item._id}`,
                                  )
                                }
                                className="btn-secondary"
                                style={{
                                  padding: "3px 7px",
                                  fontSize: "0.72rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                                title="Copy IFSC Code"
                              >
                                {copiedKey === `ifsc_${item._id}` ? (
                                  <Check size={12} color="#34D399" />
                                ) : (
                                  <Copy size={12} />
                                )}
                                {copiedKey === `ifsc_${item._id}`
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: "20px",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: "800",
                                color: "#34D399",
                                fontSize: "0.85rem",
                              }}
                            >
                              <Smartphone size={18} />
                              <span>Instant UPI Transfer</span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    display: "block",
                                  }}
                                >
                                  UPI ID (VPA)
                                </span>
                                <code
                                  style={{
                                    fontSize: "0.95rem",
                                    fontWeight: "800",
                                    color: "#34D399",
                                  }}
                                >
                                  {item.upiDetails?.upiId}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    item.upiDetails?.upiId || "",
                                    `upi_${item._id}`,
                                  )
                                }
                                className="btn-secondary"
                                style={{
                                  padding: "3px 7px",
                                  fontSize: "0.72rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                                title="Copy UPI ID"
                              >
                                {copiedKey === `upi_${item._id}` ? (
                                  <Check size={12} color="#34D399" />
                                ) : (
                                  <Copy size={12} />
                                )}
                                {copiedKey === `upi_${item._id}`
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  display: "block",
                                }}
                              >
                                NAME ON UPI
                              </span>
                              <span
                                style={{
                                  fontSize: "0.84rem",
                                  fontWeight: "700",
                                }}
                              >
                                {item.upiDetails?.accountHolderName ||
                                  item.user?.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons when PENDING */}
                        {isPending && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              className="btn-emerald"
                              onClick={() => handleOpenApproveModal(item)}
                              style={{
                                padding: "7px 14px",
                                fontSize: "0.8rem",
                                fontWeight: "800",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCircle2 size={14} /> Mark as Paid / Approve
                            </button>
                            <button
                              type="button"
                              className="btn-rose"
                              onClick={() => handleOpenRejectModal(item)}
                              style={{
                                padding: "7px 14px",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <XCircle size={14} /> Reject & Refund
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Row: Metadata & Proof Status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div>
                          Tracking ID:{" "}
                          <code style={{ color: "var(--primary-accent)" }}>
                            {item.withdrawalId}
                          </code>{" "}
                          • Submitted:{" "}
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
                              color: "#34D399",
                              fontWeight: "800",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Check size={14} /> Bank UTR / Proof Ref:{" "}
                            <u>{item.utrNumber}</u> (
                            {item.adminRemarks || "Paid"})
                          </div>
                        )}

                        {item.rejectionReason && (
                          <div style={{ color: "#FB7185", fontWeight: "700" }}>
                            ⚠️ Rejected Reason: {item.rejectionReason} (Amount
                            Refunded to User Wallet)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

            {activeTab === "REVENUE" && (
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 4px" }}>
            Platform Revenue Statement
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
            Har successful course / e-book sale ki alag entry: date, buyer, amount aur details.
          </p>
          <RevenueStatement apiUrl="/admin/revenue-statement" mode="ADMIN" />
        </div>
      )}

            {activeTab === "LEADERBOARD" && (
        <div className="glass-card" style={{ padding: "20px", borderRadius: "16px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 4px" }}>
            MLM Leaderboard
          </h3>
          
          <MlmLeaderboard />
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === "ANNOUNCEMENTS" && (
        <div
          className="glass-card"
          style={{ padding: "20px", borderRadius: "16px", maxWidth: "600px" }}
        >
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: "800",
              marginBottom: "14px",
            }}
          >
            Broadcasting System Announcements
          </h3>
          {announcementUpdated && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(16,185,129,0.15)",
                color: "#34D399",
                fontSize: "0.8rem",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              Announcement broadcasted to all users successfully!
            </div>
          )}
          <textarea
            className="form-input"
            rows={3}
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          />
          <button
            className="btn-rose"
            onClick={() => {
              localStorage.setItem(
                "eduverse_system_announcement",
                announcementText,
              );
              window.dispatchEvent(new Event("storage"));
              setAnnouncementUpdated(true);
              setTimeout(() => setAnnouncementUpdated(false), 3000);
            }}
            style={{ padding: "8px 16px", fontSize: "0.82rem" }}
          >
            Broadcast Announcement
          </button>
        </div>
      )}

      {/* ADS & BANNERS MANAGEMENT TAB */}
      {activeTab === "ADS" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Metrics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #F59E0B",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#F59E0B",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                📢 Total Advertisements
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "var(--text-primary)",
                }}
              >
                {adStats?.totalAds ?? adsList.length}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Total campaigns published
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #10B981",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#10B981",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                🟢 Active Live Ads
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "#10B981",
                }}
              >
                {adStats?.activeAds ?? adsList.filter((a) => a.isActive).length}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Visible to Students on Web & Mobile
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #3B82F6",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#3B82F6",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                🖼️ Image Banners
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "#3B82F6",
                }}
              >
                {adStats?.imageAds ??
                  adsList.filter((a) => a.type === "IMAGE").length}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Static and animated image ads
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: "16px 20px",
                borderRadius: "14px",
                borderLeft: "4px solid #EC4899",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  color: "#EC4899",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                🎬 Video Advertisements
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "800",
                  color: "#EC4899",
                }}
              >
                {adStats?.videoAds ??
                  adsList.filter((a) => a.type === "VIDEO").length}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                Interactive streaming video ads
              </div>
            </div>
          </div>

          {/* Controls Bar: Search, Filter, Refresh & Create Ad */}
          <div
            className="glass-card"
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
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
                alignItems: "center",
                gap: "10px",
                flex: 1,
                minWidth: "260px",
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search ads by title, description, or target link..."
                  value={adSearchQuery}
                  onChange={(e) => setAdSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "32px",
                    fontSize: "0.82rem",
                    height: "36px",
                  }}
                />
                {adSearchQuery && (
                  <button
                    onClick={() => setAdSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <select
                className="form-input"
                value={adTypeFilter}
                onChange={(e) => setAdTypeFilter(e.target.value as any)}
                style={{ width: "130px", fontSize: "0.8rem", height: "36px" }}
              >
                <option value="ALL">All Media Types</option>
                <option value="IMAGE">🖼️ Image Only</option>
                <option value="VIDEO">🎬 Video Only</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className="btn-secondary"
                onClick={loadAds}
                style={{
                  padding: "7px 12px",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                title="Refresh advertisements"
              >
                <RefreshCw
                  size={14}
                  className={isLoadingAds ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>

              <button
                className="btn-primary"
                onClick={handleOpenCreateAd}
                style={{
                  padding: "7px 16px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  border: "none",
                  color: "#FFFFFF",
                }}
              >
                <Plus size={16} /> + Create Advertisement
              </button>
            </div>
          </div>

          {/* Advertisement List / Grid */}
          {isLoadingAds ? (
            <div
              className="glass-card"
              style={{
                padding: "40px",
                textAlign: "center",
                borderRadius: "14px",
              }}
            >
              <RefreshCw
                size={28}
                className="animate-spin"
                style={{ color: "#F59E0B", margin: "0 auto 10px" }}
              />
              <div
                style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
              >
                Loading advertisements...
              </div>
            </div>
          ) : (
            (() => {
              const filteredAds = adsList.filter((ad) => {
                const matchesType =
                  adTypeFilter === "ALL" || ad.type === adTypeFilter;
                const matchesSearch =
                  !adSearchQuery ||
                  ad.title
                    .toLowerCase()
                    .includes(adSearchQuery.toLowerCase()) ||
                  (ad.description &&
                    ad.description
                      .toLowerCase()
                      .includes(adSearchQuery.toLowerCase())) ||
                  (ad.targetUrl &&
                    ad.targetUrl
                      .toLowerCase()
                      .includes(adSearchQuery.toLowerCase()));
                return matchesType && matchesSearch;
              });

              if (filteredAds.length === 0) {
                return (
                  <div
                    className="glass-card"
                    style={{
                      padding: "50px 20px",
                      textAlign: "center",
                      borderRadius: "16px",
                    }}
                  >
                    <Tv
                      size={48}
                      style={{
                        color: "var(--text-muted)",
                        opacity: 0.5,
                        margin: "0 auto 12px",
                      }}
                    />
                    <h4
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "800",
                        marginBottom: "6px",
                      }}
                    >
                      {adSearchQuery || adTypeFilter !== "ALL"
                        ? "No Matching Advertisements Found"
                        : "No Advertisements Created Yet"}
                    </h4>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.84rem",
                        maxWidth: "440px",
                        margin: "0 auto 16px",
                      }}
                    >
                      Create attractive Image banners or Video advertisements to
                      broadcast promotions, courses, and sponsor offers directly
                      to students across the Web & Mobile app.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={handleOpenCreateAd}
                      style={{
                        padding: "8px 18px",
                        fontSize: "0.85rem",
                        background:
                          "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                      }}
                    >
                      <Plus
                        size={15}
                        style={{ display: "inline", marginRight: "6px" }}
                      />
                      Create First Advertisement
                    </button>
                  </div>
                );
              }

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(330px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {filteredAds.map((ad) => (
                    <div
                      key={ad._id}
                      className="glass-card"
                      style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: ad.isActive
                          ? "1px solid rgba(245, 158, 11, 0.35)"
                          : "1px solid rgba(148, 163, 184, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        boxShadow: ad.isActive
                          ? "0 4px 20px rgba(245, 158, 11, 0.08)"
                          : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Media Preview Thumbnail */}
                      <div
                        style={{
                          position: "relative",
                          height: "170px",
                          backgroundColor: "#0F172A",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewMediaAd(ad)}
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
                                opacity: 0.6,
                              }}
                              muted
                              playsInline
                            />
                            <div
                              style={{
                                position: "absolute",
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                background: "rgba(236, 72, 153, 0.85)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 0 15px rgba(236, 72, 153, 0.6)",
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

                        {/* Badges on Thumbnail */}
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            display: "flex",
                            gap: "6px",
                          }}
                        >
                          <span
                            className={`badge ${ad.type === "IMAGE" ? "badge-primary" : "badge-rose"}`}
                            style={{
                              fontSize: "0.7rem",
                              padding: "3px 8px",
                              fontWeight: "800",
                            }}
                          >
                            {ad.type === "IMAGE" ? (
                              <ImageIcon
                                size={11}
                                style={{
                                  marginRight: "4px",
                                  display: "inline",
                                }}
                              />
                            ) : (
                              <Film
                                size={11}
                                style={{
                                  marginRight: "4px",
                                  display: "inline",
                                }}
                              />
                            )}
                            {ad.type} AD
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: "0.7rem",
                              padding: "3px 8px",
                              fontWeight: "800",
                              backgroundColor: "rgba(0,0,0,0.65)",
                              color: "#F1F5F9",
                            }}
                          >
                            Priority: {ad.priority}
                          </span>
                        </div>

                        {/* Active Status Badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                          }}
                        >
                          <span
                            className={`badge ${ad.isActive ? "badge-emerald" : "badge-amber"}`}
                            style={{
                              fontSize: "0.7rem",
                              padding: "3px 8px",
                              fontWeight: "800",
                            }}
                          >
                            {ad.isActive ? "● LIVE ACTIVE" : "○ PAUSED"}
                          </span>
                        </div>

                        {/* Click-to-preview overlay hint */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "10px",
                            background: "rgba(0,0,0,0.6)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            color: "#FFFFFF",
                            fontSize: "0.68rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Eye size={10} /> Click to Preview
                        </div>
                      </div>

                      {/* Card Body */}
                      <div
                        style={{
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "6px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "1rem",
                              fontWeight: "800",
                              color: "var(--text-primary)",
                              margin: 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {ad.title}
                          </h4>
                        </div>

                        {ad.description && (
                          <p
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              margin: "0 0 10px 0",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {ad.description}
                          </p>
                        )}

                        {/* Placement & Target Link */}
                        <div
                          style={{
                            marginTop: "auto",
                            paddingTop: "10px",
                            borderTop: "1px solid var(--border-color)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span style={{ color: "var(--text-muted)" }}>
                              Placement:
                            </span>
                            <span
                              className="badge badge-secondary"
                              style={{
                                fontSize: "0.68rem",
                                padding: "1px 6px",
                              }}
                            >
                              {ad.placement}
                            </span>
                          </div>

                          {ad.targetUrl ? (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.75rem",
                              }}
                            >
                              <span style={{ color: "var(--text-muted)" }}>
                                Redirect Link:
                              </span>
                              <a
                                href={ad.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#38BDF8",
                                  fontWeight: "700",
                                  textDecoration: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  maxWidth: "180px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={ad.targetUrl}
                              >
                                {ad.targetUrl.replace(/^https?:\/\//, "")}{" "}
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              No target link specified (display only)
                            </div>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "14px",
                            paddingTop: "10px",
                            borderTop: "1px solid var(--border-color)",
                          }}
                        >
                          <button
                            onClick={() => handleToggleAdActive(ad)}
                            className={
                              ad.isActive ? "btn-secondary" : "btn-emerald"
                            }
                            style={{
                              flex: 1,
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              borderRadius: "8px",
                            }}
                          >
                            {ad.isActive ? "⏸️ Pause Ad" : "▶️ Activate"}
                          </button>

                          <button
                            onClick={() => handleOpenEditAd(ad)}
                            className="btn-secondary"
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Edit Advertisement"
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteAd(ad)}
                            className="btn-rose"
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Delete Advertisement"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* REJECT KYC REASON MODAL PROMPT */}
      {rejectingKycDoc && (
        <div
          className="modal-overlay"
          onClick={() => setRejectingKycDoc(null)}
          style={{ zIndex: 10050 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "480px",
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
                  className="badge badge-rose"
                  style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                >
                  REJECT KYC DOCUMENT
                </span>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: "800",
                    marginTop: "2px",
                  }}
                >
                  Reject {rejectingKycDoc.user?.name || "Student"} (
                  {rejectingKycDoc.documentType})
                </h3>
              </div>
              <button
                onClick={() => setRejectingKycDoc(null)}
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

            {rejectionErrorMsg && (
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
                <span>{rejectionErrorMsg}</span>
              </div>
            )}

            <form
              onSubmit={handleRejectKycSubmit}
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
                  Please enter the Rejection Reason for Student *
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Aadhaar image scan blurry / Document ID number mismatch..."
                  style={{ padding: "8px 10px", fontSize: "0.85rem" }}
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
                  onClick={() => setRejectingKycDoc(null)}
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-rose"
                  disabled={isSubmittingRejection}
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                  {isSubmittingRejection ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD USERS MODAL STUDIO FOR SUPER ADMIN */}
      {showBulkUserUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBulkUserUploadModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1060px",
              width: "95%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px 28px",
              borderRadius: "20px",
            }}
          >
            {/* Top Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: "var(--amber-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                  }}
                >
                  <Users size={24} />
                </div>
                <div>
                  <span
                    className="badge badge-amber"
                    style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  >
                    EXCEL & CSV BATCH USER IMPORTER
                  </span>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "800",
                      margin: "2px 0 0 0",
                    }}
                  >
                    Bulk Upload Users Studio (Students & Teachers)
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowBulkUserUploadModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Guidelines & Field Specifications Box */}
            <div
              className="glass-card"
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)",
                border: "1px solid rgba(99,102,241,0.25)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#818CF8",
                      fontWeight: "800",
                      fontSize: "0.95rem",
                      marginBottom: "8px",
                    }}
                  >
                    <HelpCircle size={18} />
                    <span>User Bulk Import Rules & Schema Specifications</span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Upload an Excel (`.xlsx`) or CSV (`.csv`) spreadsheet
                    containing multiple Students & Teachers. Ensure each row has
                    valid mobile & role data.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#34D399",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        ✅ Mandatory Required Columns:
                      </span>
                      <ul
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                          paddingLeft: "16px",
                          lineHeight: 1.4,
                        }}
                      >
                        <li>
                          <strong>name</strong> (Full Name)
                        </li>
                        <li>
                          <strong>mobile</strong> (Unique 10-digit Indian
                          Mobile)
                        </li>
                        <li>
                          <strong>role</strong> (STUDENT or TEACHER)
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#FBBF24",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        ⚙️ Optional Columns:
                      </span>
                      <ul
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                          paddingLeft: "16px",
                          lineHeight: 1.4,
                        }}
                      >
                        <li>
                          <strong>email</strong> (Unique Email Address)
                        </li>
                        <li>
                          <strong>password</strong> (Default 123456)
                        </li>
                        <li>
                          <strong>stateCode</strong> (UP, DL, MP, BH, RJ,
                          GLOBAL)
                        </li>
                        <li>
                          <strong>categoryCode</strong> &{" "}
                          <strong>subCategory</strong>
                        </li>
                        <li>
                          <strong>boardOrGrade</strong> &{" "}
                          <strong>stream</strong>
                        </li>
                        <li>
                          <strong>subjectName</strong> &{" "}
                          <strong>referredBy</strong>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Download Template Action Card */}
                <div
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    padding: "16px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minWidth: "220px",
                  }}
                >
                  <FileSpreadsheet
                    size={32}
                    style={{ color: "#34D399", marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "0.88rem",
                      color: "#FFF",
                      marginBottom: "4px",
                    }}
                  >
                    Need Sample Template?
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "12px",
                    }}
                  >
                    Download pre-formatted 5-user CSV template compatible with
                    Excel & Google Sheets.
                  </p>
                  <button
                    className="btn-emerald"
                    onClick={handleDownloadSampleUserCsvTemplate}
                    style={{
                      fontSize: "0.78rem",
                      padding: "8px 14px",
                      width: "100%",
                      fontWeight: "700",
                    }}
                  >
                    <Download size={14} style={{ marginRight: "6px" }} />{" "}
                    Download Sample CSV / Excel Template
                  </button>
                </div>
              </div>
            </div>

            {/* Error or Success Alert Banners */}
            {bulkUserUploadError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{bulkUserUploadError}</span>
              </div>
            )}

            {bulkUserUploadResult && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    Bulk Import Completed! {bulkUserUploadResult.successCount}{" "}
                    Users Successfully Created & Registered.
                  </span>
                </div>
                {bulkUserUploadResult.failCount > 0 && (
                  <div
                    style={{
                      color: "#FBBF24",
                      fontSize: "0.8rem",
                      marginTop: "6px",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {bulkUserUploadResult.failCount} rows failed import.
                    (Errors:{" "}
                    {bulkUserUploadResult.errors
                      .map((e) => `Row ${e.row}: ${e.error}`)
                      .join(", ")}
                    )
                  </div>
                )}
              </div>
            )}

            {/* File Upload Selector */}
            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "14px",
                padding: "24px",
                textAlign: "center",
                background: "rgba(255,255,255,0.01)",
                marginBottom: "20px",
              }}
            >
              <UploadCloud
                size={36}
                style={{ color: "var(--primary-accent)", marginBottom: "8px" }}
              />
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "800",
                  margin: "0 0 4px 0",
                }}
              >
                Select or Drag & Drop Excel / CSV File
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "14px",
                }}
              >
                Supports `.csv`, `.xlsx`, `.tsv` files containing student &
                teacher records.
              </p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleUserFileUploadChange}
                style={{ display: "none" }}
                id="admin-bulk-users-file-input"
              />
              <label
                htmlFor="admin-bulk-users-file-input"
                className="btn-primary"
                style={{
                  cursor: "pointer",
                  padding: "8px 20px",
                  fontSize: "0.85rem",
                }}
              >
                Browse File from Computer
              </label>

              {bulkUserFileName && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "#FBBF24",
                  }}
                >
                  📄 Loaded File: <span>{bulkUserFileName}</span> (
                  {parsedBulkUsers.length} Total Rows Parsed)
                </div>
              )}
            </div>

            {/* Parsed Preview Table */}
            {parsedBulkUsers.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "800",
                      margin: 0,
                    }}
                  >
                    Parsed User Rows Live Preview ({parsedBulkUsers.length}{" "}
                    Items)
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                    }}
                  >
                    <span style={{ color: "#34D399" }}>
                      ✓ {parsedBulkUsers.filter((u) => u.isValid).length} Valid
                      Ready
                    </span>
                    <span style={{ color: "#FB7185" }}>
                      ✕ {parsedBulkUsers.filter((u) => !u.isValid).length}{" "}
                      Missing/Invalid Fields
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    background: "var(--bg-surface)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.78rem",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          borderBottom: "1px solid var(--border-color)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <th style={{ padding: "10px 12px" }}>Status</th>
                        <th style={{ padding: "10px 12px" }}>Full Name</th>
                        <th style={{ padding: "10px 12px" }}>Mobile Number</th>
                        <th style={{ padding: "10px 12px" }}>Assigned Role</th>
                        <th style={{ padding: "10px 12px" }}>
                          State / Grade Preference
                        </th>
                        <th style={{ padding: "10px 12px" }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkUsers.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            background: row.isValid
                              ? "transparent"
                              : "rgba(244,63,94,0.06)",
                          }}
                        >
                          <td style={{ padding: "8px 12px" }}>
                            {row.isValid ? (
                              <span
                                className="badge badge-emerald"
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                }}
                              >
                                VALID
                              </span>
                            ) : (
                              <span
                                className="badge badge-rose"
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                }}
                                title={row.errors.join(", ")}
                              >
                                INVALID
                              </span>
                            )}
                          </td>
                          <td
                            style={{ padding: "8px 12px", fontWeight: "700" }}
                          >
                            {row.name || (
                              <em style={{ color: "#FB7185" }}>Missing Name</em>
                            )}
                          </td>
                          <td
                            style={{ padding: "8px 12px", fontWeight: "600" }}
                          >
                            {row.mobile || (
                              <em style={{ color: "#FB7185" }}>
                                Invalid Mobile
                              </em>
                            )}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span
                              className={
                                row.role === "TEACHER"
                                  ? "badge badge-emerald"
                                  : "badge badge-primary"
                              }
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                              }}
                            >
                              {row.role}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            {row.stateCode} •{" "}
                            {row.boardOrGrade || "General Grade"}
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {row.email || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBulkUserUploadModal(false);
                  setParsedBulkUsers([]);
                  setBulkUserFileName("");
                  setBulkUserUploadResult(null);
                  setBulkUserUploadError("");
                }}
                style={{ fontSize: "0.82rem", padding: "6px 18px" }}
              >
                Close Studio
              </button>

              <button
                className="btn-emerald"
                onClick={handleExecuteBulkUserUpload}
                disabled={
                  isSubmittingUserBulk ||
                  parsedBulkUsers.filter((u) => u.isValid).length === 0
                }
                style={{
                  fontSize: "0.88rem",
                  padding: "8px 24px",
                  fontWeight: "800",
                }}
              >
                {isSubmittingUserBulk
                  ? "Importing Users..."
                  : `Import ${parsedBulkUsers.filter((u) => u.isValid).length} Parsed Users Now`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK UPLOAD COURSES MODAL STUDIO */}
      {showBulkUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBulkUploadModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1060px",
              width: "95%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px 28px",
              borderRadius: "20px",
            }}
          >
            {/* Top Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: "var(--amber-gradient)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                  }}
                >
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span
                    className="badge badge-amber"
                    style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  >
                    EXCEL & CSV BATCH IMPORTER
                  </span>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "800",
                      margin: "2px 0 0 0",
                    }}
                  >
                    Bulk Upload Courses Studio
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowBulkUploadModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Comprehensive Guidelines & Template Box */}
            <div
              className="glass-card"
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)",
                border: "1px solid rgba(99,102,241,0.25)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#818CF8",
                      fontWeight: "800",
                      fontSize: "0.95rem",
                      marginBottom: "8px",
                    }}
                  >
                    <HelpCircle size={18} />
                    <span>
                      Bulk Upload Rules & Guidelines (Field Specifications)
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Upload an Excel (`.xlsx`) or CSV (`.csv`) spreadsheet
                    containing multiple courses. Ensure every row includes all
                    mandatory fields.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#34D399",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        ✅ Mandatory Required Columns:
                      </span>
                      <ul
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                          paddingLeft: "16px",
                          lineHeight: 1.4,
                        }}
                      >
                        <li>
                          <strong>title</strong> (Course Batch Title)
                        </li>
                        <li>
                          <strong>price</strong> (Offer Price in ₹)
                        </li>
                        <li>
                          <strong>originalPrice</strong> (MRP in ₹)
                        </li>
                        <li>
                          <strong>stateCode</strong> (UP, DL, MP, BH, RJ,
                          GLOBAL)
                        </li>
                        <li>
                          <strong>categoryCode</strong> (SCHOOL_K12,
                          COMPETITIVE_EXAMS, etc.)
                        </li>
                        <li>
                          <strong>subCategory</strong> (CLASS_10,
                          UPSSSC_LEKHPAL, etc.)
                        </li>
                        <li>
                          <strong>courseMode</strong> (LIVE_ONLINE,
                          RECORDED_VIDEO, HYBRID)
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          color: "#FBBF24",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        ⚙️ Optional Columns:
                      </span>
                      <ul
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                          paddingLeft: "16px",
                          lineHeight: 1.4,
                        }}
                      >
                        <li>
                          <strong>boardOrGrade</strong> (Display Subtitle)
                        </li>
                        <li>
                          <strong>stream</strong> (Arts/Commerce/Science)
                        </li>
                        <li>
                          <strong>subjectName</strong> (Physics, Math, etc.)
                        </li>
                        <li>
                          <strong>liveMeetingUrl</strong> (Zoom / Meet link)
                        </li>
                        <li>
                          <strong>lectureVideoUrl</strong> (YouTube / DRM link)
                        </li>
                        <li>
                          <strong>description</strong> (Batch details text)
                        </li>
                        <li>
                          <strong>validityDays</strong> (Default 365)
                        </li>
                        <li>
                          <strong>thumbnail</strong> (Banner Image URL)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Download Template Action Card */}
                <div
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    padding: "16px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minWidth: "220px",
                  }}
                >
                  <FileSpreadsheet
                    size={32}
                    style={{ color: "#34D399", marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "0.88rem",
                      color: "#FFF",
                      marginBottom: "4px",
                    }}
                  >
                    Need Sample Template?
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "12px",
                    }}
                  >
                    Download pre-formatted CSV template directly compatible with
                    Excel & Google Sheets.
                  </p>
                  <button
                    className="btn-emerald"
                    onClick={handleDownloadSampleCsvTemplate}
                    style={{
                      fontSize: "0.78rem",
                      padding: "8px 14px",
                      width: "100%",
                      fontWeight: "700",
                    }}
                  >
                    <Download size={14} style={{ marginRight: "6px" }} />{" "}
                    Download Sample CSV / Excel Template
                  </button>
                </div>
              </div>
            </div>

            {/* Error or Success Alert Banners */}
            {bulkUploadError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{bulkUploadError}</span>
              </div>
            )}

            {bulkUploadResult && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    Bulk Upload Completed! {bulkUploadResult.successCount}{" "}
                    Courses Successfully Created & Published.
                  </span>
                </div>
                {bulkUploadResult.failCount > 0 && (
                  <div
                    style={{
                      color: "#FBBF24",
                      fontSize: "0.8rem",
                      marginTop: "6px",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {bulkUploadResult.failCount} rows failed validation.
                    (Errors:{" "}
                    {bulkUploadResult.errors
                      .map((e) => `Row ${e.row}: ${e.error}`)
                      .join(", ")}
                    )
                  </div>
                )}
              </div>
            )}

            {/* File Upload Selector */}
            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "14px",
                padding: "24px",
                textAlign: "center",
                background: "rgba(255,255,255,0.01)",
                marginBottom: "20px",
              }}
            >
              <UploadCloud
                size={36}
                style={{ color: "var(--primary-accent)", marginBottom: "8px" }}
              />
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "800",
                  margin: "0 0 4px 0",
                }}
              >
                Select or Drag & Drop Excel / CSV File
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "14px",
                }}
              >
                Supports `.csv`, `.xlsx`, `.tsv` files containing course
                records.
              </p>
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileUploadChange}
                style={{ display: "none" }}
                id="bulk-file-input"
              />
              <label
                htmlFor="bulk-file-input"
                className="btn-primary"
                style={{
                  cursor: "pointer",
                  padding: "8px 20px",
                  fontSize: "0.85rem",
                }}
              >
                Browse File from Computer
              </label>

              {bulkFileName && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "#FBBF24",
                  }}
                >
                  📄 Loaded File: <span>{bulkFileName}</span> (
                  {parsedBulkCourses.length} Total Rows Parsed)
                </div>
              )}
            </div>

            {/* Parsed Preview Table */}
            {parsedBulkCourses.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "800",
                      margin: 0,
                    }}
                  >
                    Parsed Rows Live Preview ({parsedBulkCourses.length} Items)
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                    }}
                  >
                    <span style={{ color: "#34D399" }}>
                      ✓ {parsedBulkCourses.filter((c) => c.isValid).length}{" "}
                      Valid Ready
                    </span>
                    <span style={{ color: "#FB7185" }}>
                      ✕ {parsedBulkCourses.filter((c) => !c.isValid).length}{" "}
                      Missing Fields
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "260px",
                    overflowY: "auto",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    background: "var(--bg-surface)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.78rem",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          borderBottom: "1px solid var(--border-color)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <th style={{ padding: "10px 12px" }}>Status</th>
                        <th style={{ padding: "10px 12px" }}>Course Title</th>
                        <th style={{ padding: "10px 12px" }}>
                          State / Category
                        </th>
                        <th style={{ padding: "10px 12px" }}>SubCategory</th>
                        <th style={{ padding: "10px 12px" }}>Mode</th>
                        <th style={{ padding: "10px 12px" }}>Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkCourses.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            background: row.isValid
                              ? "transparent"
                              : "rgba(244,63,94,0.06)",
                          }}
                        >
                          <td style={{ padding: "8px 12px" }}>
                            {row.isValid ? (
                              <span
                                className="badge badge-emerald"
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                }}
                              >
                                VALID
                              </span>
                            ) : (
                              <span
                                className="badge badge-rose"
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                }}
                                title={row.errors.join(", ")}
                              >
                                INVALID
                              </span>
                            )}
                          </td>
                          <td
                            style={{ padding: "8px 12px", fontWeight: "700" }}
                          >
                            {row.title || (
                              <em style={{ color: "#FB7185" }}>
                                Missing Title
                              </em>
                            )}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            {row.stateCode} • {row.categoryCode}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            {row.subCategory}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span
                              className="badge badge-primary"
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                              }}
                            >
                              {row.courseMode}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              fontWeight: "800",
                              color: "#34D399",
                            }}
                          >
                            ₹{row.price}{" "}
                            <span
                              style={{
                                textDecoration: "line-through",
                                color: "var(--text-muted)",
                                fontSize: "0.7rem",
                              }}
                            >
                              ₹{row.originalPrice}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setParsedBulkCourses([]);
                  setBulkFileName("");
                  setBulkUploadResult(null);
                  setBulkUploadError("");
                }}
                style={{ fontSize: "0.82rem", padding: "6px 18px" }}
              >
                Close Studio
              </button>

              <button
                className="btn-emerald"
                onClick={handleExecuteBulkUpload}
                disabled={
                  isSubmittingBulk ||
                  parsedBulkCourses.filter((c) => c.isValid).length === 0
                }
                style={{
                  fontSize: "0.88rem",
                  padding: "8px 24px",
                  fontWeight: "800",
                }}
              >
                {isSubmittingBulk
                  ? "Publishing Courses..."
                  : `Publish ${parsedBulkCourses.filter((c) => c.isValid).length} Parsed Courses Now`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {/* CREATE COURSE WIZARD MODAL */}
      <CourseCreationWizardModal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        isEditMode={false}
        portalType="ADMIN"
        title={newTitle}
        onTitleChange={setNewTitle}
        price={newPrice}
        onPriceChange={setNewPrice}
        originalPrice={newOriginalPrice}
        onOriginalPriceChange={setNewOriginalPrice}
        stateCode={newStateCode}
        onStateCodeChange={setNewStateCode}
        categoryCode={newCategoryCode}
        onCategoryCodeChange={setNewCategoryCode}
        subCategory={newSubCategory}
        onSubCategoryChange={(val) => {
          setNewSubCategory(val);
          const validSubs = getSubCategoriesForModuleAndState(
            newCategoryCode,
            newStateCode,
          );
          const targetSub = validSubs.find((s) => s.code === val);
          if (targetSub) {
            setNewBoardGrade(targetSub.title);
          }
          setNewStream("");
        }}
        boardGrade={newBoardGrade}
        onBoardGradeChange={setNewBoardGrade}
        stream={newStream}
        onStreamChange={setNewStream}
        subjectName={newSubjectName}
        onSubjectNameChange={setNewSubjectName}
        courseMode={newCourseMode}
        onCourseModeChange={setNewCourseMode}
        syllabusTopics={newSyllabusTopics}
        onSyllabusTopicsChange={setNewSyllabusTopics}
        lectureVideoUrl={newLectureVideoUrl}
        onLectureVideoUrlChange={setNewLectureVideoUrl}
        demoVideoUrl={newDemoVideoUrl}
        onDemoVideoUrlChange={setNewDemoVideoUrl}
        liveMeetingUrl={newLiveMeetingUrl}
        onLiveMeetingUrlChange={setNewLiveMeetingUrl}
        liveSchedule={newLiveSchedule}
        onLiveScheduleChange={setNewLiveSchedule}
        ebookTitle={newEbookTitle}
        onEbookTitleChange={setNewEbookTitle}
        ebookPdfUrl={newEbookPdfUrl}
        onEbookPdfUrlChange={setNewEbookPdfUrl}
        studyMaterials={newStudyMaterials}
        onStudyMaterialsChange={setNewStudyMaterials}
        mockTests={newMockTests}
        
        onMockTestsChange={setNewMockTests}
        richContents={newRichContents}
        onRichContentsChange={setNewRichContents}
        inclusions={newInclusions}
        onInclusionsChange={setNewInclusions}
        curriculum={newCurriculum}
        onCurriculumChange={setNewCurriculum}
        description={newDescription}
        onDescriptionChange={setNewDescription}
        thumbnailFile={thumbnailFile}
        thumbnailPreview={thumbnailPreview}
        thumbnailUrl={newThumbnailUrl}
        onThumbnailFileChange={handleThumbnailFileChange}
        onSubmit={handleCreateCourseSubmit}
        isSubmitting={isCreatingCourse}
        errorMessage={createCourseError}
      />

      {/* DOCUMENT PREVIEW MODAL */}
      {previewKycDoc && (
        <div className="modal-overlay" onClick={() => setPreviewKycDoc(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", padding: "24px", borderRadius: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                >
                  KYC DOCUMENT SCAN INSPECTOR
                </span>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    marginTop: "2px",
                  }}
                >
                  {previewKycDoc.user?.name || "User"} (
                  {previewKycDoc.documentType})
                </h3>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#34D399",
                    fontWeight: "800",
                    marginTop: "4px",
                  }}
                >
                  📄 {previewKycDoc.documentType} NUMBER:{" "}
                  {previewKycDoc.documentNumber || "N/A"}
                </div>
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  User ID: {previewKycDoc.user?.userId || "N/A"} • Mobile:{" "}
                  {previewKycDoc.user?.mobile || "N/A"}
                </div>
              </div>
              <button
                onClick={() => setPreviewKycDoc(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Scan Previews (Aadhaar & PAN) from Cloudinary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  previewKycDoc.aadhaarScanUrl && previewKycDoc.panScanUrl
                    ? "1fr 1fr"
                    : "1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {(previewKycDoc.aadhaarScanUrl ||
                previewKycDoc.documentScanUrl) && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "12px",
                    padding: "12px",
                    textAlign: "center",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "#34D399",
                      marginBottom: "6px",
                    }}
                  >
                    🪪 Aadhaar Card:{" "}
                    {previewKycDoc.aadhaarNumber ||
                      previewKycDoc.documentNumber ||
                      "N/A"}
                  </div>
                  <img
                    src={
                      previewKycDoc.aadhaarScanUrl ||
                      previewKycDoc.documentScanUrl
                    }
                    alt="Aadhaar Scan"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}

              {previewKycDoc.panScanUrl && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "12px",
                    padding: "12px",
                    textAlign: "center",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "#818CF8",
                      marginBottom: "6px",
                    }}
                  >
                    💳 PAN Card: {previewKycDoc.panNumber || "N/A"}
                  </div>
                  <img
                    src={previewKycDoc.panScanUrl}
                    alt="PAN Scan"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                className="btn-rose"
                onClick={() => handleOpenRejectKycModal(previewKycDoc)}
                style={{ padding: "8px 14px", fontSize: "0.8rem" }}
              >
                <XCircle size={15} style={{ marginRight: "4px" }} /> Reject
                Document
              </button>

              <button
                className="btn-emerald"
                onClick={() => handleApproveKyc(previewKycDoc._id)}
                style={{ padding: "8px 14px", fontSize: "0.8rem" }}
              >
                <CheckCircle2 size={15} style={{ marginRight: "4px" }} />{" "}
                Confirm Verification Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COURSE DETAILS INSPECTION MODAL */}
      {selectedCourseDetail && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCourseDetail(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", padding: "24px", borderRadius: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{ fontSize: "0.7rem", padding: "2px 6px" }}
                >
                  COURSE BATCH SPECS & METADATA
                </span>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    marginTop: "2px",
                  }}
                >
                  {selectedCourseDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourseDetail(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {selectedCourseDetail.thumbnail && (
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  maxHeight: "240px",
                  marginBottom: "16px",
                  border: "1px solid var(--border-color)",
                  background: "rgba(0,0,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={selectedCourseDetail.thumbnail}
                  alt={selectedCourseDetail.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}

            {/* CREATOR & EDUCATOR AUTHORSHIP CARD */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "#F59E0B",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <GraduationCap size={15} /> Course Author & Faculty Specs
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: "800",
                      color: "var(--text-primary)",
                    }}
                  >
                    {selectedCourseDetail.instructor
                      ? selectedCourseDetail.instructor.name
                      : "Platform Super Admin"}
                    <span
                      className="badge badge-amber"
                      style={{
                        marginLeft: "8px",
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                      }}
                    >
                      {selectedCourseDetail.instructor
                        ? selectedCourseDetail.instructor.role || "TEACHER"
                        : "ADMIN"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {selectedCourseDetail.instructor?.mobile && (
                      <span>📞 {selectedCourseDetail.instructor.mobile}</span>
                    )}
                    {selectedCourseDetail.instructor?.email && (
                      <span>✉️ {selectedCourseDetail.instructor.email}</span>
                    )}
                    {selectedCourseDetail.instructor?.userId && (
                      <span
                        style={{ fontFamily: "monospace", color: "#60A5FA" }}
                      >
                        ID: {selectedCourseDetail.instructor.userId}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => {
                    const cId = selectedCourseDetail._id;
                    setSelectedCourseDetail(null);
                    handleInspectCourseRoster(cId);
                  }}
                  style={{
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    color: "#60A5FA",
                    borderColor: "rgba(96,165,250,0.3)",
                  }}
                >
                  <Users size={13} style={{ marginRight: "4px" }} /> Enrolled
                  Students ({selectedCourseDetail.totalStudents || 0})
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                  }}
                >
                  LEVEL 1 STATE
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#F59E0B",
                  }}
                >
                  📍 {selectedCourseDetail.stateCode || "GLOBAL"}
                </div>
              </div>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                  }}
                >
                  LEVEL 3 TARGET / BOARD
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#34D399",
                  }}
                >
                  🎯{" "}
                  {selectedCourseDetail.subCategoryTitle ||
                    selectedCourseDetail.subCategory ||
                    "General"}
                </div>
              </div>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                  }}
                >
                  LEVEL 5 TARGET SUBJECT
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                  }}
                >
                  📚 {selectedCourseDetail.subjectName || "All Subjects"}
                </div>
              </div>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                  }}
                >
                  BATCH SUBTITLE / GRADE
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#818CF8",
                  }}
                >
                  🏷️ {selectedCourseDetail.boardOrGrade || "N/A"}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                PRICE & DELIVERY MODE
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "900",
                    color: "#34D399",
                  }}
                >
                  ₹{selectedCourseDetail.price}{" "}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{selectedCourseDetail.originalPrice}
                  </span>
                </span>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                >
                  {selectedCourseDetail.courseMode || "RECORDED_VIDEO"}
                </span>
              </div>
            </div>

            {selectedCourseDetail.description && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                  }}
                >
                  SYLLABUS & DESCRIPTION
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    lineHeight: "1.4",
                  }}
                >
                  {selectedCourseDetail.description}
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => handleOpenEditModal(selectedCourseDetail)}
                style={{
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  color: "#FBBF24",
                }}
              >
                <Edit3 size={15} style={{ marginRight: "4px" }} /> Edit Batch
                Details
              </button>
              <button
                className="btn-rose"
                onClick={() => handleDeleteCourseItem(selectedCourseDetail._id)}
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
              >
                <Trash2 size={15} style={{ marginRight: "4px" }} /> Delete
                Course Batch
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedCourseDetail(null)}
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COURSE WIZARD MODAL */}
      {editingCourse && (
        <CourseCreationWizardModal
          isOpen={!!editingCourse}
          onClose={() => setEditingCourse(null)}
          isEditMode={true}
          portalType="ADMIN"
          title={editTitle}
          onTitleChange={setEditTitle}
          price={editPrice}
          onPriceChange={setEditPrice}
          originalPrice={editOriginalPrice}
          onOriginalPriceChange={setEditOriginalPrice}
          stateCode={editStateCode}
          onStateCodeChange={setEditStateCode}
          categoryCode={editCategoryCode}
          onCategoryCodeChange={setEditCategoryCode}
          subCategory={editSubCategory}
          onSubCategoryChange={(val) => {
            setEditSubCategory(val);
            const validSubs = getSubCategoriesForModuleAndState(
              editCategoryCode,
              editStateCode,
            );
            const targetSub = validSubs.find((s) => s.code === val);
            if (targetSub) {
              setEditSubCategoryTitle(targetSub.title);
              setEditBoardGrade(targetSub.title);
            }
            setEditStream("");
          }}
          boardGrade={editBoardGrade}
          onBoardGradeChange={setEditBoardGrade}
          stream={editStream}
          onStreamChange={setEditStream}
          subjectName={editSubjectName}
          onSubjectNameChange={setEditSubjectName}
          courseMode={editCourseMode}
          onCourseModeChange={setEditCourseMode}
          syllabusTopics={editSyllabusTopics}
          onSyllabusTopicsChange={setEditSyllabusTopics}
          lectureVideoUrl={editLectureVideoUrl}
          onLectureVideoUrlChange={setEditLectureVideoUrl}
          demoVideoUrl={editDemoVideoUrl}
          onDemoVideoUrlChange={setEditDemoVideoUrl}
          liveMeetingUrl={editLiveMeetingUrl}
          onLiveMeetingUrlChange={setEditLiveMeetingUrl}
          liveSchedule={editLiveSchedule}
          onLiveScheduleChange={setEditLiveSchedule}
          ebookTitle={editEbookTitle}
          onEbookTitleChange={setEditEbookTitle}
          ebookPdfUrl={editEbookPdfUrl}
          onEbookPdfUrlChange={setEditEbookPdfUrl}
          studyMaterials={editStudyMaterials}
          onStudyMaterialsChange={setEditStudyMaterials}
          mockTests={editMockTests}
          onMockTestsChange={setEditMockTests}
          richContents={editRichContents}
          onRichContentsChange={setEditRichContents}
          inclusions={editInclusions}
          onInclusionsChange={setEditInclusions}
          curriculum={editCurriculum}
          onCurriculumChange={setEditCurriculum}
          description={editDescription}
          onDescriptionChange={setEditDescription}
          thumbnailUrl={editThumbnail}
          onSubmit={handleSaveCourseEdit}
          isSubmitting={isSavingEdit}
          errorMessage={editErrorMsg}
        />
      )}

      {/* MODAL: GROUPED STUDENT PREFERENCES DRILLDOWN MODAL */}
      {selectedGroupModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              borderRadius: "20px",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              background: "var(--bg-card)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <span
                  className="badge badge-primary"
                  style={{ marginBottom: "6px" }}
                >
                  SERVER AGGREGATED STUDENT DRILLDOWN
                </span>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    margin: "2px 0",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedGroupModal.courseTitle
                    ? selectedGroupModal.courseTitle
                    : `${selectedGroupModal._id?.subCategoryTitle || "Stream"} • ${selectedGroupModal._id?.boardOrGrade || "Grade"} • ${selectedGroupModal._id?.subjectName || "Subject"}`}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Total Enrolled Students:{" "}
                  <strong>
                    {selectedGroupModal.count ||
                      selectedGroupModal.students?.length ||
                      0}
                  </strong>
                  {selectedGroupModal.totalGroupRevenue > 0 && (
                    <span
                      style={{
                        marginLeft: "12px",
                        color: "#10B981",
                        fontWeight: "700",
                      }}
                    >
                      Total Group Revenue: ₹
                      {(
                        selectedGroupModal.totalGroupRevenue || 0
                      ).toLocaleString("en-IN")}
                    </span>
                  )}
                </p>
              </div>

              <button
                className="btn-secondary"
                onClick={() => setSelectedGroupModal(null)}
                style={{ padding: "6px", borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Granular Students List in Group */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {(selectedGroupModal.students || []).map(
                (std: any, idx: number) => {
                  const kycClass =
                    std.kycStatus === "VERIFIED" || std.kycStatus === "APPROVED"
                      ? "badge-emerald"
                      : std.kycStatus === "REJECTED"
                        ? "badge-rose"
                        : "badge-amber";

                  return (
                    <div
                      key={std._id || idx}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "800",
                              fontSize: "1rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {std.name}
                          </span>
                          <span
                            className="badge badge-primary"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {std.userId || `EDU-${idx + 1}`}
                          </span>
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: "0.7rem" }}
                          >
                            State: {std.stateCode || "GLOBAL"}
                          </span>
                          {std.isMobileVerified && (
                            <span
                              className="badge badge-emerald"
                              style={{ fontSize: "0.68rem" }}
                            >
                              ✓ Mobile Verified
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            className={`badge ${kycClass}`}
                            style={{ fontSize: "0.72rem" }}
                          >
                            KYC: {std.kycStatus || "NOT_SUBMITTED"}{" "}
                            {std.kycDocType ? `(${std.kycDocType})` : ""}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "14px",
                        }}
                      >
                        <span>
                          📱 Mobile: <strong>{std.mobile}</strong>
                        </span>
                        <span>
                          ✉️ Email: <strong>{std.email || "N/A"}</strong>
                        </span>
                        {std.createdAt && (
                          <span>
                            📅 Registered:{" "}
                            <strong>
                              {new Date(std.createdAt).toLocaleDateString()}
                            </strong>
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.8rem",
                          background: "rgba(99,102,241,0.06)",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(99,102,241,0.15)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--primary-accent)",
                            fontWeight: "700",
                          }}
                        >
                          🎯 Preference:{" "}
                          {std.learningPreference?.boardOrGrade ||
                            selectedGroupModal._id?.boardOrGrade ||
                            "Grade"}{" "}
                          •{" "}
                          {std.learningPreference?.subjectName ||
                            selectedGroupModal._id?.subjectName ||
                            "Subject"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: "600",
                            }}
                          >
                            🛒 Purchases:{" "}
                            <strong>
                              {std.totalPurchasesCount || 0} Batches
                            </strong>
                          </span>
                          <span style={{ color: "#10B981", fontWeight: "700" }}>
                            💰 Spent:{" "}
                            <strong>
                              ₹
                              {(std.totalSpentAmount || 0).toLocaleString(
                                "en-IN",
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {(std.referralCode || std.referredBy) && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            gap: "14px",
                          }}
                        >
                          {std.referralCode && (
                            <span>
                              🔗 Referral Code:{" "}
                              <code style={{ color: "#818CF8" }}>
                                {std.referralCode}
                              </code>
                            </span>
                          )}
                          {std.referredBy && (
                            <span>
                              🤝 Sponsor Code:{" "}
                              <code style={{ color: "#FBBF24" }}>
                                {std.referredBy}
                              </code>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setSelectedGroupModal(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDUCATOR FACULTY DRILLDOWN MODAL */}
      {selectedTeacherModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              borderRadius: "20px",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              background: "var(--bg-card)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{ marginBottom: "6px" }}
                >
                  FACULTY MEMBER PROFILE & COURSES
                </span>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    margin: "2px 0",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedTeacherModal.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    margin: "4px 0 0 0",
                  }}
                >
                  User ID: <strong>{selectedTeacherModal.userId}</strong> •
                  Mobile: <strong>{selectedTeacherModal.mobile}</strong> •
                  Email: <strong>{selectedTeacherModal.email}</strong>
                </p>
              </div>

              <button
                className="btn-secondary"
                onClick={() => setSelectedTeacherModal(null)}
                style={{ padding: "6px", borderRadius: "50%" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Teacher Stats Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(16,185,129,0.06)",
                  borderRadius: "10px",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#10B981",
                    fontWeight: "700",
                  }}
                >
                  PUBLISHED COURSES
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedTeacherModal.coursesCount || 0} Batches
                </div>
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(99,102,241,0.06)",
                  borderRadius: "10px",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#6366F1",
                    fontWeight: "700",
                  }}
                >
                  TOTAL STUDENTS TAUGHT
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedTeacherModal.totalStudentsEnrolled || 0} Students
                </div>
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(245,158,11,0.06)",
                  borderRadius: "10px",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#F59E0B",
                    fontWeight: "700",
                  }}
                >
                  STATE REGION
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedTeacherModal.stateCode || "GLOBAL"}
                </div>
              </div>
            </div>

            {/* Courses List Published by Teacher */}
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: "800",
                marginBottom: "10px",
                color: "var(--text-primary)",
              }}
            >
              📚 Courses Published by {selectedTeacherModal.name} (
              {selectedTeacherModal.courses?.length || 0})
            </h4>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {(selectedTeacherModal.courses || []).length === 0 ? (
                <div
                  style={{
                    padding: "14px",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                  }}
                >
                  No published courses found for this educator yet.
                </div>
              ) : (
                selectedTeacherModal.courses.map((crs: any, idx: number) => (
                  <div
                    key={crs._id || idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "800",
                          fontSize: "0.9rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {crs.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {crs.boardOrGrade} • {crs.subjectName} • Price:{" "}
                        <strong style={{ color: "#10B981" }}>
                          ₹{crs.price}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="badge badge-emerald"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {crs.totalStudents || 0} Enrolled
                      </span>
                      {crs.active ? (
                        <span
                          className="badge badge-primary"
                          style={{ fontSize: "0.7rem" }}
                        >
                          PUBLISHED
                        </span>
                      ) : (
                        <span
                          className="badge badge-rose"
                          style={{ fontSize: "0.7rem" }}
                        >
                          UNPUBLISHED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setSelectedTeacherModal(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 CATEGORY-WISE STUDENT DISTRIBUTION & ROSTER MODAL */}
      {showCategoryStudentsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCategoryStudentsModal(false)}
        >
          <div
            className="glass-card modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1000px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "20px",
              border: "1px solid rgba(99,102,241,0.3)",
              padding: "24px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "14px",
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
                    className="badge badge-rose"
                    style={{ padding: "3px 10px", fontSize: "0.75rem" }}
                  >
                    📊 CATEGORY-WISE STUDENT ROSTER
                  </span>
                  <span
                    className="badge badge-primary"
                    style={{ padding: "3px 10px", fontSize: "0.75rem" }}
                  >
                    6 CORE VERTICALS
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "800",
                    margin: 0,
                    letterSpacing: "-0.3px",
                  }}
                >
                  All Category-Wise Registered Students Breakdown
                </h2>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Category-wise breakdown of student enrollment across School
                  K-12, Entrance Exams, Higher Edu, State/Central Govt Jobs &
                  Teacher Prep.
                </p>
              </div>

              <button
                onClick={() => setShowCategoryStudentsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Category Tabs Bar */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "18px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {(() => {
                const allStudents = usersList.filter(
                  (u) => u.role === "STUDENT",
                );

                const categorizeStudent = (std: any): string => {
                  const catCode = std.learningPreference?.categoryCode;
                  if (
                    catCode &&
                    [
                      "SCHOOL_K12",
                      "COMPETITIVE_EXAMS",
                      "HIGHER_EDU",
                      "STATE_GOVT_JOBS",
                      "CENTRAL_GOVT_JOBS",
                      "TEACHER_PREP",
                    ].includes(catCode)
                  ) {
                    return catCode;
                  }
                  const text =
                    `${std.learningPreference?.boardOrGrade || ""} ${std.learningPreference?.subCategoryTitle || ""} ${std.learningPreference?.subCategory || ""} ${std.learningPreference?.subjectName || ""}`.toUpperCase();

                  if (
                    text.includes("NEET") ||
                    text.includes("JEE") ||
                    text.includes("NAVODAYA") ||
                    text.includes("NTS") ||
                    text.includes("ENTRANCE")
                  ) {
                    return "COMPETITIVE_EXAMS";
                  }
                  if (
                    text.includes("M.A") ||
                    text.includes("M.COM") ||
                    text.includes("M.SC") ||
                    text.includes("MBA") ||
                    text.includes("DEGREE") ||
                    text.includes("UG") ||
                    text.includes("PG")
                  ) {
                    return "HIGHER_EDU";
                  }
                  if (
                    text.includes("KAS") ||
                    text.includes("SDA") ||
                    text.includes("FDA") ||
                    text.includes("STATE") ||
                    text.includes("GPT") ||
                    text.includes("POLICE") ||
                    text.includes("UPPSC") ||
                    text.includes("MPSC")
                  ) {
                    return "STATE_GOVT_JOBS";
                  }
                  if (
                    text.includes("BANK") ||
                    text.includes("RRB") ||
                    text.includes("IAS") ||
                    text.includes("UPSC") ||
                    text.includes("SSC") ||
                    text.includes("CENTRAL")
                  ) {
                    return "CENTRAL_GOVT_JOBS";
                  }
                  if (
                    text.includes("B.ED") ||
                    text.includes("M.ED") ||
                    text.includes("TET") ||
                    text.includes("CTET") ||
                    text.includes("TEACHER")
                  ) {
                    return "TEACHER_PREP";
                  }
                  return "SCHOOL_K12";
                };

                const categoryCounts: Record<string, number> = {
                  ALL: allStudents.length,
                  SCHOOL_K12: 0,
                  COMPETITIVE_EXAMS: 0,
                  HIGHER_EDU: 0,
                  STATE_GOVT_JOBS: 0,
                  CENTRAL_GOVT_JOBS: 0,
                  TEACHER_PREP: 0,
                };

                allStudents.forEach((std) => {
                  const cat = categorizeStudent(std);
                  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                const tabsList = [
                  {
                    code: "ALL",
                    label: "🌟 All Categories",
                    count: categoryCounts.ALL,
                  },
                  {
                    code: "SCHOOL_K12",
                    label: "🏫 School Education (Class 1-12)",
                    count: categoryCounts.SCHOOL_K12,
                  },
                  {
                    code: "COMPETITIVE_EXAMS",
                    label: "🚀 Entrance Exams (NEET/JEE)",
                    count: categoryCounts.COMPETITIVE_EXAMS,
                  },
                  {
                    code: "HIGHER_EDU",
                    label: "🎓 Higher Education (UG/PG)",
                    count: categoryCounts.HIGHER_EDU,
                  },
                  {
                    code: "STATE_GOVT_JOBS",
                    label: "🏛️ State Govt Jobs (KAS/SDA)",
                    count: categoryCounts.STATE_GOVT_JOBS,
                  },
                  {
                    code: "CENTRAL_GOVT_JOBS",
                    label: "🏦 Central Govt Jobs (Banking/IAS)",
                    count: categoryCounts.CENTRAL_GOVT_JOBS,
                  },
                  {
                    code: "TEACHER_PREP",
                    label: "👩‍🏫 Teacher Certifications (B.Ed/TET)",
                    count: categoryCounts.TEACHER_PREP,
                  },
                ];

                return (
                  <>
                    {tabsList.map((tb) => (
                      <button
                        key={tb.code}
                        onClick={() => setSelectedCategoryTab(tb.code)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border:
                            selectedCategoryTab === tb.code
                              ? "none"
                              : "1px solid var(--border-color)",
                          background:
                            selectedCategoryTab === tb.code
                              ? "var(--primary-gradient)"
                              : "var(--bg-surface)",
                          color:
                            selectedCategoryTab === tb.code
                              ? "#FFF"
                              : "var(--text-secondary)",
                          fontWeight: "800",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{tb.label}</span>
                        <span
                          className="badge"
                          style={{
                            padding: "1px 6px",
                            fontSize: "0.7rem",
                            background:
                              selectedCategoryTab === tb.code
                                ? "rgba(255,255,255,0.25)"
                                : "rgba(99,102,241,0.15)",
                            color:
                              selectedCategoryTab === tb.code
                                ? "#FFF"
                                : "var(--primary-accent)",
                          }}
                        >
                          {tb.count}
                        </span>
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* 6 Category Summary Grid Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {CORE_MODULES_LIST.map((mod) => {
                const allStudents = usersList.filter(
                  (u) => u.role === "STUDENT",
                );
                const categorizeStudent = (std: any): string => {
                  const catCode = std.learningPreference?.categoryCode;
                  if (
                    catCode &&
                    [
                      "SCHOOL_K12",
                      "COMPETITIVE_EXAMS",
                      "HIGHER_EDU",
                      "STATE_GOVT_JOBS",
                      "CENTRAL_GOVT_JOBS",
                      "TEACHER_PREP",
                    ].includes(catCode)
                  ) {
                    return catCode;
                  }
                  const text =
                    `${std.learningPreference?.boardOrGrade || ""} ${std.learningPreference?.subCategoryTitle || ""} ${std.learningPreference?.subCategory || ""} ${std.learningPreference?.subjectName || ""}`.toUpperCase();
                  if (
                    text.includes("NEET") ||
                    text.includes("JEE") ||
                    text.includes("NAVODAYA") ||
                    text.includes("NTS") ||
                    text.includes("ENTRANCE")
                  )
                    return "COMPETITIVE_EXAMS";
                  if (
                    text.includes("M.A") ||
                    text.includes("M.COM") ||
                    text.includes("M.SC") ||
                    text.includes("MBA") ||
                    text.includes("DEGREE") ||
                    text.includes("UG") ||
                    text.includes("PG")
                  )
                    return "HIGHER_EDU";
                  if (
                    text.includes("KAS") ||
                    text.includes("SDA") ||
                    text.includes("FDA") ||
                    text.includes("STATE") ||
                    text.includes("GPT") ||
                    text.includes("POLICE") ||
                    text.includes("UPPSC") ||
                    text.includes("MPSC")
                  )
                    return "STATE_GOVT_JOBS";
                  if (
                    text.includes("BANK") ||
                    text.includes("RRB") ||
                    text.includes("IAS") ||
                    text.includes("UPSC") ||
                    text.includes("SSC") ||
                    text.includes("CENTRAL")
                  )
                    return "CENTRAL_GOVT_JOBS";
                  if (
                    text.includes("B.ED") ||
                    text.includes("M.ED") ||
                    text.includes("TET") ||
                    text.includes("CTET") ||
                    text.includes("TEACHER")
                  )
                    return "TEACHER_PREP";
                  return "SCHOOL_K12";
                };

                const catStudents = allStudents.filter(
                  (std) => categorizeStudent(std) === mod.code,
                );
                const isSelected = selectedCategoryTab === mod.code;

                return (
                  <div
                    key={mod.code}
                    onClick={() => setSelectedCategoryTab(mod.code)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: isSelected
                        ? "rgba(99,102,241,0.12)"
                        : "var(--bg-surface)",
                      border: isSelected
                        ? "2px solid #6366F1"
                        : "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        {mod.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {mod.subCategories
                          .map((s) => s.code)
                          .slice(0, 3)
                          .join(", ")}
                        ...
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        className="badge badge-primary"
                        style={{
                          fontSize: "0.85rem",
                          padding: "4px 10px",
                          fontWeight: "800",
                        }}
                      >
                        {catStudents.length} Students
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Search Input inside Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h4
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "800",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Enrolled Student Roster (
                {
                  usersList
                    .filter((u) => u.role === "STUDENT")
                    .filter((std) => {
                      const categorizeStudent = (s: any): string => {
                        const catCode = s.learningPreference?.categoryCode;
                        if (
                          catCode &&
                          [
                            "SCHOOL_K12",
                            "COMPETITIVE_EXAMS",
                            "HIGHER_EDU",
                            "STATE_GOVT_JOBS",
                            "CENTRAL_GOVT_JOBS",
                            "TEACHER_PREP",
                          ].includes(catCode)
                        )
                          return catCode;
                        const text =
                          `${s.learningPreference?.boardOrGrade || ""} ${s.learningPreference?.subCategoryTitle || ""} ${s.learningPreference?.subCategory || ""} ${s.learningPreference?.subjectName || ""}`.toUpperCase();
                        if (
                          text.includes("NEET") ||
                          text.includes("JEE") ||
                          text.includes("NAVODAYA") ||
                          text.includes("NTS") ||
                          text.includes("ENTRANCE")
                        )
                          return "COMPETITIVE_EXAMS";
                        if (
                          text.includes("M.A") ||
                          text.includes("M.COM") ||
                          text.includes("M.SC") ||
                          text.includes("MBA") ||
                          text.includes("DEGREE") ||
                          text.includes("UG") ||
                          text.includes("PG")
                        )
                          return "HIGHER_EDU";
                        if (
                          text.includes("KAS") ||
                          text.includes("SDA") ||
                          text.includes("FDA") ||
                          text.includes("STATE") ||
                          text.includes("GPT") ||
                          text.includes("POLICE") ||
                          text.includes("UPPSC") ||
                          text.includes("MPSC")
                        )
                          return "STATE_GOVT_JOBS";
                        if (
                          text.includes("BANK") ||
                          text.includes("RRB") ||
                          text.includes("IAS") ||
                          text.includes("UPSC") ||
                          text.includes("SSC") ||
                          text.includes("CENTRAL")
                        )
                          return "CENTRAL_GOVT_JOBS";
                        if (
                          text.includes("B.ED") ||
                          text.includes("M.ED") ||
                          text.includes("TET") ||
                          text.includes("CTET") ||
                          text.includes("TEACHER")
                        )
                          return "TEACHER_PREP";
                        return "SCHOOL_K12";
                      };
                      return (
                        selectedCategoryTab === "ALL" ||
                        categorizeStudent(std) === selectedCategoryTab
                      );
                    })
                    .filter((std) => {
                      if (!categorySearchQuery.trim()) return true;
                      const q = categorySearchQuery.trim().toLowerCase();
                      return (
                        std.name.toLowerCase().includes(q) ||
                        std.mobile.toLowerCase().includes(q) ||
                        std.userId.toLowerCase().includes(q) ||
                        (std.email || "").toLowerCase().includes(q) ||
                        (std.stateCode || "").toLowerCase().includes(q) ||
                        (std.learningPreference?.boardOrGrade || "")
                          .toLowerCase()
                          .includes(q)
                      );
                    }).length
                }{" "}
                Accounts)
              </h4>

              <div style={{ position: "relative", width: "280px" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter student name, mobile, state, grade..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  style={{
                    padding: "6px 12px 6px 32px",
                    fontSize: "0.8rem",
                    width: "100%",
                  }}
                />
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
              </div>
            </div>

            {/* Student List Cards */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {(() => {
                const categorizeStudent = (std: any): string => {
                  const catCode = std.learningPreference?.categoryCode;
                  if (
                    catCode &&
                    [
                      "SCHOOL_K12",
                      "COMPETITIVE_EXAMS",
                      "HIGHER_EDU",
                      "STATE_GOVT_JOBS",
                      "CENTRAL_GOVT_JOBS",
                      "TEACHER_PREP",
                    ].includes(catCode)
                  )
                    return catCode;
                  const text =
                    `${std.learningPreference?.boardOrGrade || ""} ${std.learningPreference?.subCategoryTitle || ""} ${std.learningPreference?.subCategory || ""} ${std.learningPreference?.subjectName || ""}`.toUpperCase();
                  if (
                    text.includes("NEET") ||
                    text.includes("JEE") ||
                    text.includes("NAVODAYA") ||
                    text.includes("NTS") ||
                    text.includes("ENTRANCE")
                  )
                    return "COMPETITIVE_EXAMS";
                  if (
                    text.includes("M.A") ||
                    text.includes("M.COM") ||
                    text.includes("M.SC") ||
                    text.includes("MBA") ||
                    text.includes("DEGREE") ||
                    text.includes("UG") ||
                    text.includes("PG")
                  )
                    return "HIGHER_EDU";
                  if (
                    text.includes("KAS") ||
                    text.includes("SDA") ||
                    text.includes("FDA") ||
                    text.includes("STATE") ||
                    text.includes("GPT") ||
                    text.includes("POLICE") ||
                    text.includes("UPPSC") ||
                    text.includes("MPSC")
                  )
                    return "STATE_GOVT_JOBS";
                  if (
                    text.includes("BANK") ||
                    text.includes("RRB") ||
                    text.includes("IAS") ||
                    text.includes("UPSC") ||
                    text.includes("SSC") ||
                    text.includes("CENTRAL")
                  )
                    return "CENTRAL_GOVT_JOBS";
                  if (
                    text.includes("B.ED") ||
                    text.includes("M.ED") ||
                    text.includes("TET") ||
                    text.includes("CTET") ||
                    text.includes("TEACHER")
                  )
                    return "TEACHER_PREP";
                  return "SCHOOL_K12";
                };

                const filteredStudents = usersList
                  .filter((u) => u.role === "STUDENT")
                  .filter(
                    (std) =>
                      selectedCategoryTab === "ALL" ||
                      categorizeStudent(std) === selectedCategoryTab,
                  )
                  .filter((std) => {
                    if (!categorySearchQuery.trim()) return true;
                    const q = categorySearchQuery.trim().toLowerCase();
                    return (
                      std.name.toLowerCase().includes(q) ||
                      std.mobile.toLowerCase().includes(q) ||
                      std.userId.toLowerCase().includes(q) ||
                      (std.email || "").toLowerCase().includes(q) ||
                      (std.stateCode || "").toLowerCase().includes(q) ||
                      (std.learningPreference?.boardOrGrade || "")
                        .toLowerCase()
                        .includes(q)
                    );
                  });

                if (filteredStudents.length === 0) {
                  return (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No student records found matching this category or filter.
                    </div>
                  );
                }

                return filteredStudents.map((std: any) => {
                  const catCode = categorizeStudent(std);
                  const catObj = CORE_MODULES_LIST.find(
                    (m) => m.code === catCode,
                  );
                  const isBlocked = std.isBlocked || std.status === "BLOCKED";

                  return (
                    <div
                      key={std._id}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        borderLeft: "4px solid #6366F1",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
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
                            style={{
                              fontWeight: "800",
                              fontSize: "0.98rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {std.name}
                          </span>
                          <span
                            className="badge badge-primary"
                            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          >
                            {std.userId}
                          </span>
                          <span
                            className="badge badge-amber"
                            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          >
                            State: {std.stateCode || "GLOBAL"}
                          </span>
                          <span
                            className="badge badge-emerald"
                            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          >
                            {catObj ? catObj.title : "School Education"}
                          </span>
                          {std.kycStatus === "VERIFIED" && (
                            <span
                              className="badge badge-emerald"
                              style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                            >
                              KYC VERIFIED
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--primary-accent)",
                            fontWeight: "700",
                          }}
                        >
                          🎯 Preference:{" "}
                          {std.learningPreference?.boardOrGrade ||
                            "General Grade"}{" "}
                          •{" "}
                          {std.learningPreference?.subjectName ||
                            "All Subjects"}
                        </div>

                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          Mobile: <strong>{std.mobile}</strong> • Email:{" "}
                          {std.email || "N/A"} • Ref Code:{" "}
                          <code>{std.referralCode}</code>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className={isBlocked ? "btn-emerald" : "btn-rose"}
                          onClick={() => handleToggleBlock(std)}
                          style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setShowCategoryStudentsModal(false)}
                style={{ padding: "8px 18px", fontSize: "0.82rem" }}
              >
                Close Roster Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENTERPRISE USER PROFILE & AUDIT INSPECTOR MODAL (WIDE 2-COLUMN LAYOUT - ROOT SCOPED) */}
      {selectedDetailUser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDetailUser(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1060px",
              width: "95%",
              maxHeight: "calc(100vh - 60px)",
              overflowY: "auto",
              borderRadius: "20px",
              padding: "24px 28px",
            }}
          >
            {/* Modal Top Header Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "var(--primary-gradient)",
                    color: "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    fontSize: "1.2rem",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  }}
                >
                  {selectedDetailUser.name
                    ? selectedDetailUser.name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "800",
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      {selectedDetailUser.name}
                    </h2>
                    <span
                      className={`badge ${selectedDetailUser.role === "TEACHER" ? "badge-emerald" : selectedDetailUser.role === "ADMIN" ? "badge-rose" : "badge-primary"}`}
                      style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                    >
                      {selectedDetailUser.role === "TEACHER"
                        ? "👨‍🏫 TEACHER"
                        : selectedDetailUser.role === "ADMIN"
                          ? "🛡️ ADMIN"
                          : "🎓 STUDENT"}
                    </span>
                    {selectedDetailUser.isBlocked ||
                    selectedDetailUser.status === "BLOCKED" ? (
                      <span
                        className="badge badge-rose"
                        style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                      >
                        ⛔ ACCOUNT BLOCKED
                      </span>
                    ) : (
                      <span
                        className="badge badge-emerald"
                        style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                      >
                        ✓ ACTIVE ACCOUNT
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      marginTop: "2px",
                    }}
                  >
                    Unique User System ID: {selectedDetailUser.userId} •
                    Registered:{" "}
                    {selectedDetailUser.createdAt
                      ? new Date(
                          selectedDetailUser.createdAt,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </div>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => setSelectedDetailUser(null)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "50px",
                  fontSize: "0.8rem",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 2-Column Modular Audit Inspector */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* Left Column Stack */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Section 1: Contact & Regional Info */}
                <div
                  className="glass-card"
                  style={{ padding: "16px 18px", borderRadius: "14px" }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "var(--primary-accent)",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Phone size={14} /> Contact & Regional Verification
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        Mobile Number
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Phone size={13} color="#4F46E5" />
                        {selectedDetailUser.mobile}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        Email Address
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Mail size={13} color="#8B5CF6" />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedDetailUser.email || "Not Provided"}
                        </span>
                        {selectedDetailUser.email && (
                          <CheckCircle2
                            size={13}
                            color="#34D399"
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        State Region / Region
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <MapPin size={13} color="#10B981" />
                        {INDIAN_STATES_LIST.find(
                          (s) => s.code === selectedDetailUser.stateCode,
                        )?.name ||
                          selectedDetailUser.stateCode ||
                          "GLOBAL (India)"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        KYC Verification Status
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {selectedDetailUser.kycStatus === "VERIFIED" && (
                          <span
                            className="badge badge-emerald"
                            style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                          >
                            ✓ VERIFIED DOCUMENT
                          </span>
                        )}
                        {selectedDetailUser.kycStatus === "PENDING" && (
                          <span
                            className="badge badge-amber"
                            style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                          >
                            ⏳ AUDIT PENDING
                          </span>
                        )}
                        {selectedDetailUser.kycStatus === "REJECTED" && (
                          <span
                            className="badge badge-rose"
                            style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                          >
                            ❌ DOCUMENT REJECTED
                          </span>
                        )}
                        {(!selectedDetailUser.kycStatus ||
                          selectedDetailUser.kycStatus === "NOT_SUBMITTED") && (
                          <span
                            className="badge badge-secondary"
                            style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                          >
                            ⚪ NOT SUBMITTED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Referral & Binary Network Suite */}
                <div
                  className="glass-card"
                  style={{ padding: "16px 18px", borderRadius: "14px" }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "800",
                      color: "#F59E0B",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Share2 size={14} /> Referral & Binary Network Suite
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        Personal Referral Code
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "#FBBF24",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{selectedDetailUser.referralCode}</span>
                        <button
                          className="btn-secondary"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              selectedDetailUser.referralCode,
                            )
                          }
                          style={{
                            padding: "2px 8px",
                            fontSize: "0.7rem",
                            borderRadius: "4px",
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                        }}
                      >
                        Referred By / Sponsor
                      </div>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          marginTop: "2px",
                        }}
                      >
                        {selectedDetailUser.referredBy
                          ? `Sponsor: ${selectedDetailUser.referredBy}`
                          : "Direct Platform Registration"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Stack */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Academic Preference (For Students) */}
                {/* Academic Preference & Enrolled Courses (For Students) */}
                {selectedDetailUser.role === "STUDENT" && (
                  <div
                    className="glass-card"
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        color: "#10B981",
                        marginBottom: "10px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <GraduationCap size={14} /> Academic Preference & Enrolled
                      Courses
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        fontSize: "0.82rem",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-surface)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                          }}
                        >
                          Academic Grade / Board
                        </div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: "#10B981",
                            marginTop: "2px",
                          }}
                        >
                          {selectedDetailUser.learningPreference
                            ?.boardOrGrade ||
                            selectedDetailUser.learningPreference
                              ?.subCategoryTitle ||
                            "General State Board"}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-surface)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                          }}
                        >
                          Subject Specialization
                        </div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: "#10B981",
                            marginTop: "2px",
                          }}
                        >
                          {selectedDetailUser.learningPreference?.subjectName ||
                            "All Subjects (Complete Package)"}
                        </div>
                      </div>
                    </div>

                    {/* Enrolled Courses List */}
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          color: "var(--text-muted)",
                          marginBottom: "6px",
                        }}
                      >
                        📚 Enrolled Courses List (
                        {selectedDetailUser.enrolledCourses?.length || 0}):
                      </div>
                      {selectedDetailUser.enrolledCourses &&
                      selectedDetailUser.enrolledCourses.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxHeight: "140px",
                            overflowY: "auto",
                          }}
                        >
                          {selectedDetailUser.enrolledCourses.map(
                            (crs, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: "6px 10px",
                                  background: "var(--bg-surface)",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  fontSize: "0.78rem",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <strong
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    {crs.title}
                                  </strong>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {crs.subjectName || "General"} •{" "}
                                    {crs.boardOrGrade || "All Grades"}
                                  </div>
                                </div>
                                <span
                                  className="badge badge-emerald"
                                  style={{ fontSize: "0.68rem" }}
                                >
                                  ₹{crs.price || 0}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                            padding: "6px",
                            background: "var(--bg-surface)",
                            borderRadius: "8px",
                          }}
                        >
                          No active course enrollments yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Faculty Specialization & Published Courses (For Teachers) */}
                {selectedDetailUser.role === "TEACHER" && (
                  <div
                    className="glass-card"
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        color: "#F59E0B",
                        marginBottom: "10px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <BookOpen size={14} /> Educator Faculty Strengths &
                      Published Batches
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        fontSize: "0.82rem",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-surface)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                          }}
                        >
                          Courses Published
                        </div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: "#F59E0B",
                            marginTop: "2px",
                          }}
                        >
                          {selectedDetailUser.coursesCount || 0} Batches
                          Published
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "10px 12px",
                          background: "var(--bg-surface)",
                          borderRadius: "10px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                          }}
                        >
                          Taught Subjects
                        </div>
                        <div
                          style={{
                            fontWeight: "800",
                            color: "var(--text-primary)",
                            marginTop: "2px",
                          }}
                        >
                          {selectedDetailUser.taughtSubjects?.join(", ") ||
                            "All Subjects"}
                        </div>
                      </div>
                    </div>

                    {/* Published Courses List */}
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "800",
                          color: "var(--text-muted)",
                          marginBottom: "6px",
                        }}
                      >
                        📖 Created Courses List (
                        {selectedDetailUser.coursesTaught?.length || 0}):
                      </div>
                      {selectedDetailUser.coursesTaught &&
                      selectedDetailUser.coursesTaught.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxHeight: "140px",
                            overflowY: "auto",
                          }}
                        >
                          {selectedDetailUser.coursesTaught.map((crs, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "6px 10px",
                                background: "var(--bg-surface)",
                                borderRadius: "8px",
                                border: "1px solid var(--border-color)",
                                fontSize: "0.78rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <strong
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {crs.title}
                                </strong>
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {crs.subjectName} • {crs.boardOrGrade}
                                </div>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <div>
                                  <span
                                    className="badge badge-amber"
                                    style={{ fontSize: "0.68rem" }}
                                  >
                                    {crs.totalStudents || 0} Students
                                  </span>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#10B981",
                                      fontWeight: "700",
                                    }}
                                  >
                                    ₹{crs.price || 0}
                                  </div>
                                </div>
                                <button
                                  className="btn-secondary"
                                  onClick={() =>
                                    handleInspectCourseRoster(crs._id)
                                  }
                                  style={{
                                    padding: "3px 8px",
                                    fontSize: "0.7rem",
                                    color: "#60A5FA",
                                    borderColor: "rgba(96,165,250,0.3)",
                                  }}
                                  title="View Enrolled Students Roster"
                                >
                                  <Users
                                    size={12}
                                    style={{ marginRight: "2px" }}
                                  />{" "}
                                  Enrolled
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                            padding: "6px",
                            background: "var(--bg-surface)",
                            borderRadius: "8px",
                          }}
                        >
                          No published courses yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin / System Role Info */}
                {selectedDetailUser.role === "ADMIN" && (
                  <div
                    className="glass-card"
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        color: "#FB7185",
                        marginBottom: "10px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ShieldCheck size={14} /> Master Super Admin Privileges
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      Full System Authority: Access to User Directory Control,
                      KYC Verification Queue, Batch Payout Approvals, Course
                      Publishing & Platform Pricing.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Quick Action Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              {/* Quick Block Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                  }}
                >
                  Quick Actions:
                </span>

                <button
                  className={
                    selectedDetailUser.isBlocked ||
                    selectedDetailUser.status === "BLOCKED"
                      ? "btn-emerald"
                      : "btn-rose"
                  }
                  onClick={() => handleToggleBlock(selectedDetailUser)}
                  style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                >
                  {selectedDetailUser.isBlocked ||
                  selectedDetailUser.status === "BLOCKED"
                    ? "Unblock User"
                    : "Block User"}
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={() => setSelectedDetailUser(null)}
                style={{ fontSize: "0.82rem", padding: "6px 20px" }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin: Enrolled Students & Royalty Revenue Roster Modal */}
      {selectedCourseRoster && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "20px",
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div>
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    textTransform: "uppercase",
                  }}
                >
                  Course Enrollment Roster & Sales Breakdown
                </span>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    marginTop: "6px",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedCourseRoster.course.title}
                </h3>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    Board/Grade:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {selectedCourseRoster.course.boardOrGrade ||
                        "General Batch"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Subject:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {selectedCourseRoster.course.subjectName ||
                        "All Subjects"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Educator:{" "}
                    <strong style={{ color: "#F59E0B" }}>
                      {selectedCourseRoster.course.instructorName ||
                        "Platform Admin"}
                    </strong>
                  </span>
                  {selectedCourseRoster.course.instructorMobile && (
                    <span style={{ color: "var(--text-muted)" }}>
                      ({selectedCourseRoster.course.instructorMobile})
                    </span>
                  )}
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setSelectedCourseRoster(null)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(59, 130, 246, 0.08)",
                  borderRadius: "14px",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#60A5FA",
                    textTransform: "uppercase",
                  }}
                >
                  Total Enrolled Students
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: "#60A5FA",
                    marginTop: "4px",
                  }}
                >
                  {selectedCourseRoster.enrolledStudents.length}
                </div>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(16, 185, 129, 0.08)",
                  borderRadius: "14px",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#34D399",
                    textTransform: "uppercase",
                  }}
                >
                  Gross Course Sales
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: "#34D399",
                    marginTop: "4px",
                  }}
                >
                  ₹
                  {selectedCourseRoster.enrolledStudents
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (curr.amountPaid ||
                          selectedCourseRoster.course.price ||
                          0),
                      0,
                    )
                    .toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(245, 158, 11, 0.08)",
                  borderRadius: "14px",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#FBBF24",
                    textTransform: "uppercase",
                  }}
                >
                  Educator Share (70%)
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                    marginTop: "4px",
                  }}
                >
                  ₹
                  {selectedCourseRoster.enrolledStudents
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (curr.amountPaid ||
                          selectedCourseRoster.course.price ||
                          0) *
                          0.7,
                      0,
                    )
                    .toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(168, 85, 247, 0.08)",
                  borderRadius: "14px",
                  border: "1px solid rgba(168, 85, 247, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "#C084FC",
                    textTransform: "uppercase",
                  }}
                >
                  Platform Share (30%)
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: "#C084FC",
                    marginTop: "4px",
                  }}
                >
                  ₹
                  {selectedCourseRoster.enrolledStudents
                    .reduce(
                      (acc, curr) =>
                        acc +
                        (curr.amountPaid ||
                          selectedCourseRoster.course.price ||
                          0) *
                          0.3,
                      0,
                    )
                    .toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Student Roster Table */}
            <div>
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "800",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Users size={18} style={{ color: "#60A5FA" }} /> Enrolled
                Students Directory (
                {selectedCourseRoster.enrolledStudents.length})
              </h4>

              {selectedCourseRoster.enrolledStudents.length === 0 ? (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    background: "var(--bg-surface)",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  No students have enrolled in this batch yet.
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    borderRadius: "14px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.82rem",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "var(--bg-surface)",
                          borderBottom: "1px solid var(--border-color)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <th style={{ padding: "10px 12px" }}>#</th>
                        <th style={{ padding: "10px 12px" }}>
                          Student Name & ID
                        </th>
                        <th style={{ padding: "10px 12px" }}>
                          Contact Details
                        </th>
                        <th style={{ padding: "10px 12px" }}>State / Board</th>
                        <th style={{ padding: "10px 12px" }}>Enrolled Date</th>
                        <th
                          style={{ padding: "10px 12px", textAlign: "right" }}
                        >
                          Amount Paid
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCourseRoster.enrolledStudents.map((st, idx) => {
                        const studentUser = st.student || ({} as any);
                        return (
                          <tr
                            key={st.purchaseId || idx}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 12px",
                                fontWeight: "700",
                                color: "var(--text-muted)",
                              }}
                            >
                              {idx + 1}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div
                                style={{
                                  fontWeight: "800",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {studentUser.name || "Anonymous Student"}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "#60A5FA",
                                  fontFamily: "monospace",
                                }}
                              >
                                ID:{" "}
                                {studentUser.userId || studentUser._id || "N/A"}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Phone
                                  size={12}
                                  style={{ color: "var(--text-muted)" }}
                                />{" "}
                                {studentUser.mobile || "N/A"}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.74rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <Mail size={12} /> {studentUser.email || "N/A"}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span
                                className="badge badge-amber"
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                }}
                              >
                                {studentUser.stateCode || "General"}
                              </span>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                Role: {studentUser.role || "STUDENT"}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {st.enrolledAt
                                ? new Date(st.enrolledAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "N/A"}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                textAlign: "right",
                                fontWeight: "800",
                                color: "#34D399",
                              }}
                            >
                              ₹
                              {st.amountPaid ||
                                selectedCourseRoster.course.price ||
                                0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedCourseRoster(null)}
                style={{ padding: "8px 24px", fontSize: "0.85rem" }}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ADVERTISEMENT MODAL */}
      {showCreateAdModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateAdModal(false)}
          style={{ zIndex: 10060 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "640px", padding: "24px", borderRadius: "18px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  className="badge badge-amber"
                  style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                >
                  {editingAd ? "EDIT ADVERTISEMENT" : "NEW ADVERTISEMENT"}
                </span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    marginTop: "4px",
                  }}
                >
                  {editingAd
                    ? `Edit: ${editingAd.title}`
                    : "Create Promotion / Advertisement"}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateAdModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {adFormError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(244,63,94,0.15)",
                  border: "1px solid rgba(244,63,94,0.4)",
                  color: "#FB7185",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{adFormError}</span>
              </div>
            )}

            {adFormSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34D399",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{adFormSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveAd}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Media Type Selection (IMAGE vs VIDEO) */}
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Select Advertisement Media Type *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAdType("IMAGE")}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border:
                        adType === "IMAGE"
                          ? "2px solid #3B82F6"
                          : "1px solid var(--border-color)",
                      background:
                        adType === "IMAGE"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "var(--card-bg)",
                      color:
                        adType === "IMAGE"
                          ? "#60A5FA"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: "800",
                      fontSize: "0.85rem",
                    }}
                  >
                    <ImageIcon size={18} /> 🖼️ Image Banner / Graphic
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdType("VIDEO")}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border:
                        adType === "VIDEO"
                          ? "2px solid #EC4899"
                          : "1px solid var(--border-color)",
                      background:
                        adType === "VIDEO"
                          ? "rgba(236, 72, 153, 0.15)"
                          : "var(--card-bg)",
                      color:
                        adType === "VIDEO"
                          ? "#F472B6"
                          : "var(--text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: "800",
                      fontSize: "0.85rem",
                    }}
                  >
                    <Film size={18} /> 🎬 Video Advertisement
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Campaign / Ad Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g., 50% Off on NEET Super Batch 2026 / Sponsor Admission Offer"
                  style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                  required
                />
              </div>

              {/* Media URL */}
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Media Direct URL (
                  {adType === "IMAGE"
                    ? "JPG, PNG, WebP image URL"
                    : "MP4, WebM, or HLS video streaming URL"}
                  ) *
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={adMediaUrl}
                  onChange={(e) => setAdMediaUrl(e.target.value)}
                  placeholder={
                    adType === "IMAGE"
                      ? "https://images.unsplash.com/... or https://yourcdn.com/banner.jpg"
                      : "https://commondatastorage.googleapis.com/.../ad.mp4"
                  }
                  style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                  required
                />
              </div>

              {/* Instant Live Media Preview */}
              {adMediaUrl && (
                <div
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    maxHeight: "160px",
                    border: "1px solid var(--border-color)",
                    background: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {adType === "IMAGE" ? (
                    <img
                      src={adMediaUrl}
                      alt="Preview"
                      style={{
                        maxHeight: "160px",
                        width: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <video
                      src={adMediaUrl}
                      controls
                      style={{ maxHeight: "160px", maxWidth: "100%" }}
                    />
                  )}
                </div>
              )}

              {/* Target Destination Link */}
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Target Destination / Redirect Link (Optional)
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={adTargetUrl}
                  onChange={(e) => setAdTargetUrl(e.target.value)}
                  placeholder="https://example.com/promo or https://eduprep.org/courses"
                  style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                />
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    display: "block",
                  }}
                >
                  When a student clicks the ad on web or mobile app, they will
                  be redirected to this link.
                </span>
              </div>

              {/* Placement & Priority */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Placement Location
                  </label>
                  <select
                    className="form-input"
                    value={adPlacement}
                    onChange={(e) => setAdPlacement(e.target.value as any)}
                    style={{ padding: "8px 10px", fontSize: "0.85rem" }}
                  >
                    <option value="HOME_HERO">Home Screen Top Hero</option>
                    <option value="BANNER">Content / Courses Banner</option>
                    <option value="POPUP">Interactive Popup / Spotlight</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    Priority Order (Higher = First)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={adPriority}
                    onChange={(e) =>
                      setAdPriority(parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    style={{ padding: "8px 10px", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "4px",
                    display: "block",
                  }}
                >
                  Ad Description / Caption (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="Brief pitch or explanation about the campaign offer..."
                  style={{ padding: "8px 10px", fontSize: "0.85rem" }}
                />
              </div>

              {/* Active Toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <input
                  type="checkbox"
                  id="adIsActiveCheckbox"
                  checked={adIsActive}
                  onChange={(e) => setAdIsActive(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#10B981",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="adIsActiveCheckbox"
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Make this advertisement active & visible immediately to
                  students
                </label>
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateAdModal(false)}
                  style={{ padding: "9px 18px", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingAd}
                  style={{
                    padding: "9px 24px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    background:
                      "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    border: "none",
                    color: "#FFF",
                  }}
                >
                  {isSubmittingAd
                    ? "Saving Advertisement..."
                    : editingAd
                      ? "Update Advertisement"
                      : "Publish Advertisement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewMediaAd && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewMediaAd(null)}
          style={{ zIndex: 10070 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "720px",
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
                marginBottom: "14px",
              }}
            >
              <div>
                <span
                  className={`badge ${previewMediaAd.type === "IMAGE" ? "badge-primary" : "badge-rose"}`}
                  style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                >
                  {previewMediaAd.type} PREVIEW
                </span>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    marginTop: "2px",
                    color: "#FFF",
                  }}
                >
                  {previewMediaAd.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMediaAd(null)}
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
                maxHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewMediaAd.type === "IMAGE" ? (
                <img
                  src={previewMediaAd.mediaUrl}
                  alt={previewMediaAd.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "420px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <video
                  src={previewMediaAd.mediaUrl}
                  controls
                  autoPlay
                  style={{ width: "100%", maxHeight: "420px" }}
                />
              )}
            </div>

            {previewMediaAd.description && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "0.85rem",
                  color: "#CBD5E1",
                  lineHeight: 1.5,
                }}
              >
                {previewMediaAd.description}
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
                {previewMediaAd.targetUrl && (
                  <a
                    href={previewMediaAd.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#38BDF8",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    Test Target Link <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <button
                className="btn-secondary"
                onClick={() => setPreviewMediaAd(null)}
                style={{ padding: "7px 18px", fontSize: "0.82rem" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payout Request Approval Modal ────────────────────────────── */}
      {approvingWithdrawal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2, 6, 23, 0.82)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setApprovingWithdrawal(null)}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
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
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "100px",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34D399",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    SETTLE CASHOUT
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    #{approvingWithdrawal.withdrawalId}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#F8FAFC",
                    margin: 0,
                  }}
                >
                  Approve Payout Transfer
                </h3>
              </div>
              <button
                onClick={() => setApprovingWithdrawal(null)}
                style={{
                  background: "#1E293B",
                  border: "none",
                  color: "#94A3B8",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Payout Summary Box */}
            <div
              style={{
                background: "#020617",
                borderRadius: "14px",
                border: "1px solid #1E293B",
                padding: "16px 20px",
                marginBottom: "20px",
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
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "#94A3B8",
                    fontWeight: 600,
                  }}
                >
                  Amount to Transfer:
                </span>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: "#10B981",
                  }}
                >
                  ₹{approvingWithdrawal.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.82rem",
                  color: "#CBD5E1",
                  borderTop: "1px solid #1E293B",
                  paddingTop: "10px",
                }}
              >
                <span>
                  Beneficiary:{" "}
                  <strong style={{ color: "#FFF" }}>
                    {approvingWithdrawal.user?.name}
                  </strong>{" "}
                  ({approvingWithdrawal.userRole})
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#1E293B",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#38BDF8",
                  }}
                >
                  {approvingWithdrawal.payoutMethod === "BANK" ? (
                    <Building2 size={12} />
                  ) : (
                    <Smartphone size={12} />
                  )}
                  {approvingWithdrawal.payoutMethod === "BANK"
                    ? "Bank Account"
                    : "UPI ID"}
                </span>
              </div>
            </div>

            {/* Payout Destination Details */}
            <div
              style={{
                background: "#0B132B",
                border: "1px solid #1E293B",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#38BDF8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "10px",
                }}
              >
                {approvingWithdrawal.payoutMethod === "BANK"
                  ? "Bank Account Credentials"
                  : "UPI Credentials"}
              </div>

              {approvingWithdrawal.payoutMethod === "BANK" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#64748B",
                        display: "block",
                        fontSize: "0.72rem",
                      }}
                    >
                      ACCOUNT HOLDER
                    </span>
                    <strong style={{ color: "#F8FAFC" }}>
                      {approvingWithdrawal.bankDetails?.accountHolderName ||
                        "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "#64748B",
                        display: "block",
                        fontSize: "0.72rem",
                      }}
                    >
                      BANK NAME
                    </span>
                    <strong style={{ color: "#F8FAFC" }}>
                      {approvingWithdrawal.bankDetails?.bankName || "N/A"}
                    </strong>
                  </div>
                  <div
                    style={{
                      gridColumn: "span 2",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#020617",
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "#64748B",
                          display: "block",
                          fontSize: "0.72rem",
                        }}
                      >
                        A/C NUMBER
                      </span>
                      <strong
                        style={{
                          color: "#38BDF8",
                          fontFamily: "monospace",
                          fontSize: "0.95rem",
                        }}
                      >
                        {approvingWithdrawal.bankDetails?.accountNumber}
                      </strong>
                    </div>
                    <button
                      onClick={() =>
                        handleCopyText(
                          approvingWithdrawal.bankDetails?.accountNumber || "",
                          `acc-${approvingWithdrawal._id}`,
                        )
                      }
                      style={{
                        background: "#1E293B",
                        border: "none",
                        color:
                          copiedKey === `acc-${approvingWithdrawal._id}`
                            ? "#10B981"
                            : "#94A3B8",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {copiedKey === `acc-${approvingWithdrawal._id}` ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedKey === `acc-${approvingWithdrawal._id}`
                        ? "Copied"
                        : "Copy A/C"}
                    </button>
                  </div>
                  <div
                    style={{
                      gridColumn: "span 2",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#020617",
                      padding: "8px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "#64748B",
                          display: "block",
                          fontSize: "0.72rem",
                        }}
                      >
                        IFSC CODE
                      </span>
                      <strong
                        style={{
                          color: "#F59E0B",
                          fontFamily: "monospace",
                          fontSize: "0.95rem",
                        }}
                      >
                        {approvingWithdrawal.bankDetails?.ifscCode}
                      </strong>
                    </div>
                    <button
                      onClick={() =>
                        handleCopyText(
                          approvingWithdrawal.bankDetails?.ifscCode || "",
                          `ifsc-${approvingWithdrawal._id}`,
                        )
                      }
                      style={{
                        background: "#1E293B",
                        border: "none",
                        color:
                          copiedKey === `ifsc-${approvingWithdrawal._id}`
                            ? "#10B981"
                            : "#94A3B8",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {copiedKey === `ifsc-${approvingWithdrawal._id}` ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedKey === `ifsc-${approvingWithdrawal._id}`
                        ? "Copied"
                        : "Copy IFSC"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#020617",
                    padding: "12px 14px",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#64748B",
                        display: "block",
                        fontSize: "0.72rem",
                      }}
                    >
                      VPA / UPI ADDRESS
                    </span>
                    <strong
                      style={{
                        color: "#38BDF8",
                        fontFamily: "monospace",
                        fontSize: "1rem",
                      }}
                    >
                      {approvingWithdrawal.upiDetails?.upiId}
                    </strong>
                    {approvingWithdrawal.upiDetails?.accountHolderName && (
                      <span
                        style={{
                          color: "#94A3B8",
                          display: "block",
                          fontSize: "0.75rem",
                          marginTop: "2px",
                        }}
                      >
                        Holder:{" "}
                        {approvingWithdrawal.upiDetails.accountHolderName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      handleCopyText(
                        approvingWithdrawal.upiDetails?.upiId || "",
                        `upi-${approvingWithdrawal._id}`,
                      )
                    }
                    style={{
                      background: "#1E293B",
                      border: "none",
                      color:
                        copiedKey === `upi-${approvingWithdrawal._id}`
                          ? "#10B981"
                          : "#94A3B8",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {copiedKey === `upi-${approvingWithdrawal._id}` ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedKey === `upi-${approvingWithdrawal._id}`
                      ? "Copied"
                      : "Copy UPI"}
                  </button>
                </div>
              )}
            </div>

            {/* Inputs: UTR Number & Remarks */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#E2E8F0",
                    marginBottom: "6px",
                  }}
                >
                  Bank UTR / Transaction Reference Number{" "}
                  <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={utrNumberInput}
                  onChange={(e) => setUtrNumberInput(e.target.value)}
                  placeholder="e.g. UTR123456789 or Bank Ref No."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#FFF",
                    fontSize: "0.88rem",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#E2E8F0",
                    marginBottom: "6px",
                  }}
                >
                  Admin Remarks (Visible to Beneficiary)
                </label>
                <input
                  type="text"
                  value={adminRemarksInput}
                  onChange={(e) => setAdminRemarksInput(e.target.value)}
                  placeholder="e.g. Paid successfully via Corporate NEFT"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#FFF",
                    fontSize: "0.88rem",
                  }}
                />
              </div>
            </div>

            {approvalErrorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#F87171",
                  fontSize: "0.82rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                {approvalErrorMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setApprovingWithdrawal(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#1E293B",
                  color: "#CBD5E1",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isSubmittingApproval}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669, #10B981)",
                  color: "#FFF",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: isSubmittingApproval ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isSubmittingApproval ? 0.7 : 1,
                }}
              >
                {isSubmittingApproval ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm & Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payout Request Rejection Modal ────────────────────────────── */}
      {rejectingWithdrawal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(2, 6, 23, 0.82)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setRejectingWithdrawal(null)}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "18px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "100px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#F87171",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  REJECT & REFUND
                </span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#F8FAFC",
                    margin: "6px 0 0",
                  }}
                >
                  Reject Withdrawal Request
                </h3>
              </div>
              <button
                onClick={() => setRejectingWithdrawal(null)}
                style={{
                  background: "#1E293B",
                  border: "none",
                  color: "#94A3B8",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Refund Notice */}
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "18px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.84rem",
                  color: "#FCA5A5",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ Rejecting will{" "}
                <strong>
                  instantly refund ₹
                  {rejectingWithdrawal.amount.toLocaleString("en-IN")}
                </strong>{" "}
                back into <strong>{rejectingWithdrawal.user?.name}</strong>
                &apos;s available wallet balance.
              </p>
            </div>

            {/* Quick Reason Chips */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#94A3B8",
                  marginBottom: "8px",
                }}
              >
                Quick Selection:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  "Invalid IFSC Code",
                  "Incorrect Account Number",
                  "UPI ID Not Valid / Inactive",
                  "Account Holder Name Mismatch",
                  "Requested by User to Cancel",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAdminRejectionReason(reason)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border:
                        adminRejectionReason === reason
                          ? "1px solid #EF4444"
                          : "1px solid #334155",
                      background:
                        adminRejectionReason === reason
                          ? "rgba(239, 68, 68, 0.2)"
                          : "#1E293B",
                      color:
                        adminRejectionReason === reason ? "#FCA5A5" : "#94A3B8",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: "6px",
                }}
              >
                Reason for Rejection (Shown to user){" "}
                <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                rows={3}
                value={adminRejectionReason}
                onChange={(e) => setAdminRejectionReason(e.target.value)}
                placeholder="Enter specific reason why this payout was rejected..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "#FFF",
                  fontSize: "0.86rem",
                  resize: "none",
                }}
              />
            </div>

            {adminRejectErrorMsg && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#F87171",
                  fontSize: "0.82rem",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                {adminRejectErrorMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#1E293B",
                  color: "#CBD5E1",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingAdminRejection}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #DC2626, #EF4444)",
                  color: "#FFF",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: isSubmittingAdminRejection
                    ? "not-allowed"
                    : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isSubmittingAdminRejection ? 0.7 : 1,
                }}
              >
                {isSubmittingAdminRejection ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Confirm Rejection & Refund Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
