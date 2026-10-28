import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  PlusCircle,
  DollarSign,
  HelpCircle,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  Award,
  Share2,
  Trash2,
  Edit3,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Phone,
  Mail,
  Megaphone,
  Building2,
  Smartphone,
  ArrowUpRight,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  CORE_MODULES_LIST,
  getSubCategoriesForModuleAndState,
} from "../../services/taxonomyTree";
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
  fetchTeacherStats,
  fetchTeacherCourses,
  fetchTeacherMcqs,
  fetchTeacherMcqAttempts,
  createTeacherCourse,
  bulkCreateTeacherCourses,
  updateTeacherCourse,
  deleteTeacherCourse,
  createTeacherMcq,
  deleteTeacherMcq,
  fetchTeacherCourseStudents,
  TeacherStats,
  McqRecord,
  McqAttemptRecord,
  CreateMcqPayload,
} from "../../services/teacherService";
import {
  CourseRecord,
  CourseInclusions,
  CourseCurriculumItem,
  CourseStudyMaterialItem,
  CourseMockTestItem,
  CourseRichContentItem,
} from "../../services/adminService";
import { CourseCreationWizardModal } from "../CourseCreationWizardModal";

const DEFAULT_SUBJECT = "All Subjects (Complete Package)";

export const TeacherPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "MY_COURSES"
    | "CREATE"
    | "MCQ_BUILDER"
    | "MCQ_AUDIT"
    | "ROYALTY_PAYOUT"
    | "MLM_NETWORK"
  >("MY_COURSES");

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

  // Stats & Courses State
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [coursesList, setCoursesList] = useState<CourseRecord[]>([]);
  const [mcqsList, setMcqsList] = useState<McqRecord[]>([]);
  const [attemptsList, setAttemptsList] = useState<McqAttemptRecord[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingMcqs, setIsLoadingMcqs] = useState(false);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] =
    useState<CourseRecord | null>(null);

  const [selectedTeacherCourseRoster, setSelectedTeacherCourseRoster] =
    useState<{
      course: any;
      totalEnrolled: number;
      totalRoyaltyEarned: number;
      enrolledStudents: any[];
    } | null>(null);
  const handleInspectTeacherCourseRoster = async (courseId: string) => {
    const res = await fetchTeacherCourseStudents(courseId);
    if (res.success && res.data) {
      setSelectedTeacherCourseRoster({
        course: res.data.course,
        totalEnrolled:
          res.data.course.totalEnrolled ||
          res.data.enrolledStudents?.length ||
          0,
        totalRoyaltyEarned: res.data.course.totalRoyaltyEarned || 0,
        enrolledStudents: res.data.enrolledStudents || [],
      });
    }
  };

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
      subjects?: string[];
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
        rowObj["subjectname"] ||
        rowObj["subject"] ||
        rowObj["subjects"] ||
        "All Subjects";
      // Multiple subjects supported: separate with ; or | (or comma inside quotes)
      const subjects = subjectName
        .split(/[;|,]/)
        .map((s) => s.trim())
        .filter(Boolean);
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
        subjects,
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
      '"UP Board 12th Mathematics Board Exam Mastery",1999,4999,"UP","SCHOOL_K12","CLASS_12","UP Board Intermediate","Science Stream (Subjects 1–6)","Mathematics|Physics","LIVE_ONLINE","https://zoom.us/j/9900000000","","Live daily classes, model paper solutions, and formula revisions for Class 12 UP Board.",365,"https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800"\n';
    const sampleRow3 =
      '"UPSSSC Lekhpal Complete Competitive Exam Batch",2499,5999,"UP","COMPETITIVE_EXAMS","UPSSSC_LEKHPAL","UPSSSC Lekhpal 2026 Batch","","General Knowledge|Mathematics","HYBRID","https://zoom.us/j/8800000000","https://www.youtube.com/watch?v=dQw4w9WgXcQ","Full syllabus coverage for UPSSSC Lekhpal including rural development, Math, and GK.",180,"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800"\n';
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
      const res = await bulkCreateTeacherCourses(validCoursesToSubmit);
      if (res.success && res.data) {
        setBulkUploadResult({
          successCount: res.data.createdCount,
          failCount: res.data.failedCount,
          errors: res.data.errors || [],
        });
        loadCourses();
        loadStats();
      } else {
        setBulkUploadError(res.message || "Bulk upload failed.");
      }
    } catch (err: any) {
      setBulkUploadError(
        err.message || "Failed to execute bulk course upload.",
      );
    } finally {
      setIsSubmittingBulk(false);
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
  const [editSubjectName, setEditSubjectName] = useState(DEFAULT_SUBJECT);
  const [editSubjects, setEditSubjects] = useState<string[]>([DEFAULT_SUBJECT]);
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
  const [newBoardGrade, setNewBoardGrade] = useState("CBSE Class 10");
  const [newSubjectName, setNewSubjectName] = useState(DEFAULT_SUBJECT);
  const [newSubjects, setNewSubjects] = useState<string[]>([DEFAULT_SUBJECT]);
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
  const [courseCreatedSuccess, setCourseCreatedSuccess] = useState(false);

  const [selectedMcqCourseId, setSelectedMcqCourseId] = useState<string>("");
  const [quizSetTitleInput, setQuizSetTitleInput] = useState<string>(
    "Practice Test Set #1",
  );
  const [mcqQuestionsList, setMcqQuestionsList] = useState<
    Array<{
      id: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOptionIndex: number;
      explanation: string;
    }>
  >([
    {
      id: "q-1",
      questionText: "What is the SI unit of Magnetic Flux Density?",
      optionA: "Weber",
      optionB: "Tesla",
      optionC: "Henry",
      optionD: "Farad",
      correctOptionIndex: 1,
      explanation:
        "The SI unit of magnetic flux density (B) is Tesla (T), named after Nikola Tesla.",
    },
  ]);
  const [mcqSavedSuccess, setMcqSavedSuccess] = useState(false);
  const [mcqSavedCount, setMcqSavedCount] = useState(0);
  const [mcqError, setMcqError] = useState("");
  const [isSavingMcq, setIsSavingMcq] = useState(false);

  const handleAddMcqQuestionItem = () => {
    setMcqQuestionsList((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOptionIndex: 0,
        explanation: "",
      },
    ]);
  };

  const handleRemoveMcqQuestionItem = (id: string) => {
    if (mcqQuestionsList.length <= 1) return;
    setMcqQuestionsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMcqQuestionItem = (
    index: number,
    field: string,
    value: any,
  ) => {
    setMcqQuestionsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Copy Course ID Feedback
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const handleCopyCourseId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedCourseId(id);
    setTimeout(() => setCopiedCourseId(null), 2500);
  };

  // Bulk MCQ Upload State
  const [showBulkMcqModal, setShowBulkMcqModal] = useState(false);
  const [bulkMcqCourseId, setBulkMcqCourseId] = useState<string>("");
  const [bulkMcqQuizSetTitle, setBulkMcqQuizSetTitle] = useState<string>(
    "Practice Test Set #1",
  );
  const [bulkMcqFileName, setBulkMcqFileName] = useState("");
  const [bulkMcqPastedText, setBulkMcqPastedText] = useState("");
  const [bulkMcqInputMode, setBulkMcqInputMode] = useState<"FILE" | "PASTE">(
    "FILE",
  );
  const [parsedBulkMcqs, setParsedBulkMcqs] = useState<
    Array<{
      courseId?: string;
      quizSetTitle?: string;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOptionIndex: number;
      explanation?: string;
      marks?: number;
      isValid: boolean;
      errors: string[];
    }>
  >([]);
  const [isSubmittingBulkMcq, setIsSubmittingBulkMcq] = useState(false);
  const [bulkMcqError, setBulkMcqError] = useState("");
  const [bulkMcqSuccessMsg, setBulkMcqSuccessMsg] = useState("");

  // MCQ Search & Filter State
  const [mcqSearchQuery, setMcqSearchQuery] = useState("");
  const [mcqFilterCourseId, setMcqFilterCourseId] = useState("");
  const [mcqFilterQuizSet, setMcqFilterQuizSet] = useState("");
  const [isDeletingMcqId, setIsDeletingMcqId] = useState<string | null>(null);

  // Student Attempts Search & Filter State
  const [attemptSearchQuery, setAttemptSearchQuery] = useState("");
  const [attemptFilterQuizSet, setAttemptFilterQuizSet] = useState("");
  const [attemptFilterStatus, setAttemptFilterStatus] = useState<
    "ALL" | "PASSED" | "FAILED"
  >("ALL");

  const handleOpenBulkMcqForCourse = (
    courseId: string,
    courseTitle?: string,
  ) => {
    setBulkMcqCourseId(courseId);
    if (courseTitle) {
      setBulkMcqQuizSetTitle(`${courseTitle.slice(0, 30)} - Quiz Set #1`);
    }
    setBulkMcqError("");
    setBulkMcqSuccessMsg("");
    setShowBulkMcqModal(true);
  };

  // Sample CSV Downloader for MCQs (courseId is automatically linked from selected course batch)
  const handleDownloadSampleMcqCsvTemplate = () => {
    const header =
      "quizSetTitle,questionText,optionA,optionB,optionC,optionD,correctOption,explanation,marks\n";
    const r1 = `"Chapter 1 - Chemical Reactions","What is the chemical formula of Rust?","Fe2O3.xH2O","Fe3O4","FeO","Fe(OH)2","A","Rust is hydrated iron(III) oxide with formula Fe2O3.xH2O.",1\n`;
    const r2 = `"Chapter 1 - Chemical Reactions","Which gas is liberated when Zinc granules react with dilute HCl?","Oxygen","Hydrogen","Chlorine","Nitrogen","B","Zn + 2HCl -> ZnCl2 + H2 (Hydrogen gas is released with a pop sound).",1\n`;
    const r3 = `"Chapter 1 - Chemical Reactions","What is the pH value of pure distilled water at 25°C?","5","6","7","8","C","Pure water is neutral on the pH scale and has a value of 7.",1\n`;
    const r4 = `"Chapter 1 - Chemical Reactions","Which of the following processes is exothermic in nature?","Respiration","Photosynthesis","Evaporation","Sublimation","A","Respiration produces energy (ATP) by breaking down glucose.",1\n`;
    const r5 = `"Chapter 1 - Chemical Reactions","What is the oxidation state of Manganese in Potassium Permanganate (KMnO4)?","+2","+4","+6","+7","D","In KMnO4: K(+1) + Mn(x) + 4*O(-2) = 0 => x = +7.",1\n`;

    const blob = new Blob([header + r1 + r2 + r3 + r4 + r5], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mcq_question_bank_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV / TSV Parser for MCQs (supports CSV files and Direct Excel Copy-Paste TSV!)
  const parseCSVToMcqObjects = (
    rawText: string,
    fallbackCourseId: string,
    fallbackQuizSet: string,
  ) => {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const isTabDelimited = lines[0].includes("\t");
    const parseLine = (textLine: string): string[] => {
      if (isTabDelimited) {
        return textLine
          .split("\t")
          .map((col) => col.trim().replace(/^["']|["']$/g, ""));
      }
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

    const headers = parseLine(lines[0]).map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[\s_-]/g, ""),
    );
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, index) => {
        rowObj[h] = values[index] !== undefined ? values[index].trim() : "";
      });

      const rowCourseId =
        rowObj["courseid"] || rowObj["course"] || fallbackCourseId || "";
      const rowQuizSet =
        rowObj["quizsettitle"] ||
        rowObj["quizset"] ||
        rowObj["testset"] ||
        fallbackQuizSet ||
        "Practice Test Set #1";
      const questionText =
        rowObj["questiontext"] ||
        rowObj["question"] ||
        rowObj["q"] ||
        rowObj["statement"] ||
        "";
      const optionA =
        rowObj["optiona"] ||
        rowObj["a"] ||
        rowObj["opt1"] ||
        rowObj["option1"] ||
        "";
      const optionB =
        rowObj["optionb"] ||
        rowObj["b"] ||
        rowObj["opt2"] ||
        rowObj["option2"] ||
        "";
      const optionC =
        rowObj["optionc"] ||
        rowObj["c"] ||
        rowObj["opt3"] ||
        rowObj["option3"] ||
        "";
      const optionD =
        rowObj["optiond"] ||
        rowObj["d"] ||
        rowObj["opt4"] ||
        rowObj["option4"] ||
        "";
      const explanation =
        rowObj["explanation"] ||
        rowObj["solution"] ||
        rowObj["solutionnote"] ||
        rowObj["notes"] ||
        "";
      const marksVal = Number(rowObj["marks"] || rowObj["mark"] || 1);
      const marks = isNaN(marksVal) || marksVal <= 0 ? 1 : marksVal;

      const rawAns = (
        rowObj["correctoption"] ||
        rowObj["correctoptionindex"] ||
        rowObj["answer"] ||
        rowObj["correct"] ||
        ""
      ).toUpperCase();
      let correctOptionIndex = 0;
      let isAnsValid = true;

      if (rawAns === "A" || rawAns === "OPTION A" || rawAns === "0") {
        correctOptionIndex = 0;
      } else if (rawAns === "B" || rawAns === "OPTION B" || rawAns === "1") {
        correctOptionIndex = 1;
      } else if (rawAns === "C" || rawAns === "OPTION C" || rawAns === "2") {
        correctOptionIndex = 2;
      } else if (rawAns === "D" || rawAns === "OPTION D" || rawAns === "3") {
        correctOptionIndex = 3;
      } else if (rawAns === "4") {
        correctOptionIndex = 3;
      } else {
        correctOptionIndex = 0;
        if (rawAns) isAnsValid = false;
      }

      const rowErrors: string[] = [];
      if (!questionText) rowErrors.push("Question statement is missing.");
      if (!optionA) rowErrors.push("Option A is missing.");
      if (!optionB) rowErrors.push("Option B is missing.");
      if (!optionC) rowErrors.push("Option C is missing.");
      if (!optionD) rowErrors.push("Option D is missing.");
      if (!isAnsValid && rawAns)
        rowErrors.push(`Unrecognized answer "${rawAns}". Use A, B, C, or D.`);

      const finalCId =
        rowCourseId && rowCourseId !== "PASTE_COURSE_ID_HERE"
          ? rowCourseId
          : fallbackCourseId;
      if (!finalCId) {
        rowErrors.push(
          "No Course ID specified (select course batch in dropdown or add courseId column).",
        );
      }

      rows.push({
        courseId: finalCId,
        quizSetTitle: rowQuizSet,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOptionIndex,
        explanation,
        marks,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      });
    }

    return rows;
  };

  const handleFileUploadMcqChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkMcqFileName(file.name);
    setBulkMcqError("");
    setBulkMcqSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToMcqObjects(
          text,
          bulkMcqCourseId,
          bulkMcqQuizSetTitle,
        );
        setParsedBulkMcqs(parsed);
        if (parsed.length === 0) {
          setBulkMcqError(
            "No valid data rows found in uploaded file. Please check file format.",
          );
        }
      } catch (err: any) {
        setBulkMcqError("Failed to parse uploaded CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteTextMcqChange = (text: string) => {
    setBulkMcqPastedText(text);
    setBulkMcqError("");
    setBulkMcqSuccessMsg("");
    if (!text.trim()) {
      setParsedBulkMcqs([]);
      return;
    }
    try {
      const parsed = parseCSVToMcqObjects(
        text,
        bulkMcqCourseId,
        bulkMcqQuizSetTitle,
      );
      setParsedBulkMcqs(parsed);
    } catch (err: any) {
      setBulkMcqError("Failed to parse pasted text: " + err.message);
    }
  };

  const handleExecuteBulkMcqUpload = async () => {
    const validQuestions = parsedBulkMcqs.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      setBulkMcqError(
        "No valid questions found to upload. Please correct row errors.",
      );
      return;
    }

    const missingCourse = validQuestions.some(
      (q) => !q.courseId && !bulkMcqCourseId,
    );
    if (missingCourse && !bulkMcqCourseId) {
      setBulkMcqError(
        "Please select a Target Course Batch or specify courseId in the file.",
      );
      return;
    }

    setIsSubmittingBulkMcq(true);
    setBulkMcqError("");
    setBulkMcqSuccessMsg("");

    try {
      const payload: CreateMcqPayload = {
        courseId: bulkMcqCourseId || undefined,
        quizSetTitle: bulkMcqQuizSetTitle.trim() || "Practice Test Set #1",
        questions: validQuestions.map((q) => ({
          courseId: q.courseId || bulkMcqCourseId,
          quizSetTitle: q.quizSetTitle || bulkMcqQuizSetTitle,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation,
          marks: q.marks,
        })),
      };

      const res = await createTeacherMcq(payload);
      if (res.success) {
        const count = res.data?.count || validQuestions.length;
        setBulkMcqSuccessMsg(
          `🎉 Successfully imported and published ${count} MCQ questions to question bank!`,
        );
        loadMcqs();
        setTimeout(() => {
          setShowBulkMcqModal(false);
          setParsedBulkMcqs([]);
          setBulkMcqPastedText("");
          setBulkMcqFileName("");
          setBulkMcqSuccessMsg("");
        }, 1800);
      } else {
        setBulkMcqError(res.message || "Failed to upload questions.");
      }
    } catch (err: any) {
      setBulkMcqError(err.message || "An error occurred during bulk upload.");
    } finally {
      setIsSubmittingBulkMcq(false);
    }
  };

  const handleDeleteMcqItem = async (mcqId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this MCQ question from your bank?",
      )
    ) {
      return;
    }
    setIsDeletingMcqId(mcqId);
    try {
      const res = await deleteTeacherMcq(mcqId);
      if (res.success) {
        setMcqsList((prev) => prev.filter((q) => q._id !== mcqId));
      } else {
        alert(res.message || "Failed to delete question.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting question.");
    } finally {
      setIsDeletingMcqId(null);
    }
  };

  // Payout Request State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState("");
  const [payoutErrorMsg, setPayoutErrorMsg] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Teacher Withdrawal & Payout Profile State
  const [payoutMethod, setPayoutMethod] = useState<"BANK" | "UPI">("BANK");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountConfirm, setBankAccountConfirm] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [upiNameInput, setUpiNameInput] = useState("");
  const [saveAsDefaultPayout, setSaveAsDefaultPayout] = useState(true);
  const [teacherWithdrawalsList, setTeacherWithdrawalsList] = useState<
    WithdrawalRequestRecord[]
  >([]);
  const [isLoadingTeacherWithdrawals, setIsLoadingTeacherWithdrawals] =
    useState(false);
  const [savedPayoutProfile, setSavedPayoutProfile] =
    useState<PayoutProfile | null>(null);

  // Load Teacher Stats
  const loadStats = async () => {
    setIsLoadingStats(true);
    const res = await fetchTeacherStats();
    if (res.success && res.data) {
      setStats(res.data.stats);
    }
    setIsLoadingStats(false);
  };

  // Load Teacher Courses
  const loadCourses = async () => {
    setIsLoadingCourses(true);
    const res = await fetchTeacherCourses();
    if (res.success && res.data) {
      setCoursesList(res.data.courses || []);
    }
    setIsLoadingCourses(false);
  };

  // Load MCQ Questions Bank
  const loadMcqs = async () => {
    setIsLoadingMcqs(true);
    const res = await fetchTeacherMcqs();
    if (res.success && res.data) {
      setMcqsList(res.data.mcqs || []);
    }
    setIsLoadingMcqs(false);
  };

  // Load Student Quiz Attempts
  const loadAttempts = async () => {
    setIsLoadingAttempts(true);
    const res = await fetchTeacherMcqAttempts();
    if (res.success && res.data) {
      setAttemptsList(res.data.attempts || []);
    }
    setIsLoadingAttempts(false);
  };

  useEffect(() => {
    loadStats();
    loadCourses();
    loadMcqs();
    loadAttempts();
    loadTeacherWithdrawalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "ROYALTY_PAYOUT") {
      loadStats();
      loadTeacherWithdrawalData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle Thumbnail File Selection (2MB Validation Limit)
  const handleThumbnailFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCreateCourseError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // STRICT 2MB LIMIT CHECK
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

    const parsedInitialSubjects: string[] =
      Array.isArray(crs.subjects) && crs.subjects.length > 0
        ? crs.subjects
        : crs.subjectName
          ? crs.subjectName
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [DEFAULT_SUBJECT];

    setEditSubjects(parsedInitialSubjects);
    setEditSubjectName(parsedInitialSubjects.join(", "));
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
      const finalSubjects =
        editSubjects.length > 0
          ? editSubjects
          : editSubjectName
            ? editSubjectName
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : ["All Subjects"];
      const finalSubjectName = finalSubjects.join(", ");

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
        subjectName: finalSubjectName,
        subjects: finalSubjects,
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

      const res = await updateTeacherCourse(editingCourse._id, payload);
      if (res.success && res.data?.course) {
        loadCourses();
        if (selectedCourseDetail?._id === editingCourse._id) {
          setSelectedCourseDetail({
            ...selectedCourseDetail,
            ...res.data.course,
          });
        }
        setEditingCourse(null);
      } else {
        setEditErrorMsg(res.message || "Failed to save course edits.");
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
      const res = await deleteTeacherCourse(courseId);
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

  // Create Course Form Submit
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCourseError("");
    setCourseCreatedSuccess(false);

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
    if (
      (newCourseMode === "LIVE_ONLINE" || newCourseMode === "HYBRID") &&
      (!newLiveMeetingUrl.trim() || !newLiveMeetingUrl.includes("http"))
    ) {
      setCreateCourseError(
        "Please enter a valid Live Stream Meeting URL (e.g. Zoom or Google Meet URL).",
      );
      return;
    }
    if (
      (newCourseMode === "RECORDED_VIDEO" || newCourseMode === "HYBRID") &&
      (!newLectureVideoUrl.trim() || !newLectureVideoUrl.includes("http"))
    ) {
      setCreateCourseError(
        "Please enter a valid Video Lecture URL (e.g. YouTube video URL).",
      );
      return;
    }
    if (!newDescription.trim() || newDescription.trim().length < 10) {
      setCreateCourseError(
        "Course description must be at least 10 characters long.",
      );
      return;
    }

    const targetModule = CORE_MODULES_LIST.find(
      (m) => m.code === newCategoryCode,
    );
    const targetSub = targetModule?.subCategories.find(
      (s) => s.code === newSubCategory,
    );

    const finalSubjects =
      newSubjects.length > 0
        ? newSubjects
        : newSubjectName
          ? newSubjectName
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : ["All Subjects"];
    const finalSubjectName = finalSubjects.join(", ");

    setIsCreatingCourse(true);
    const res = await createTeacherCourse(
      {
        title: newTitle.trim(),
        categoryId: newCategoryCode,
        subCategory: newSubCategory,
        subCategoryTitle: targetSub ? targetSub.title : newSubCategory,
        stream: newStream,
        subjectName: finalSubjectName,
        subjects: finalSubjects,
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
        thumbnail: newThumbnailUrl.trim(),
      },
      thumbnailFile,
    );
    setIsCreatingCourse(false);

    if (res.success) {
      setCourseCreatedSuccess(true);
      setNewTitle("");
      setNewDescription("");
      setNewSubjects([DEFAULT_SUBJECT]);
      setNewSubjectName(DEFAULT_SUBJECT);
      setNewStudyMaterials([]);
      setNewMockTests([]);
      setNewRichContents([]);
      setThumbnailFile(null);
      setThumbnailPreview("");
      loadCourses();
      loadStats();
      setTimeout(() => setCourseCreatedSuccess(false), 4000);
    } else {
      setCreateCourseError(res.message || "Failed to publish new course.");
    }
  };

  // Submit MCQ Form (Multi-Question Batch)
  const handleSaveMcqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMcqError("");
    setMcqSavedSuccess(false);

    if (!selectedMcqCourseId) {
      setMcqError("Please select a Target Course Batch for this MCQ test.");
      return;
    }

    for (let i = 0; i < mcqQuestionsList.length; i++) {
      const q = mcqQuestionsList[i];
      if (!q.questionText.trim()) {
        setMcqError(`Question #${i + 1}: Please enter the question statement.`);
        return;
      }
      if (
        !q.optionA.trim() ||
        !q.optionB.trim() ||
        !q.optionC.trim() ||
        !q.optionD.trim()
      ) {
        setMcqError(
          `Question #${i + 1}: Please enter all 4 options (A, B, C, D).`,
        );
        return;
      }
    }

    setIsSavingMcq(true);
    const res = await createTeacherMcq({
      courseId: selectedMcqCourseId,
      quizSetTitle: quizSetTitleInput.trim() || "Practice Test Set #1",
      questions: mcqQuestionsList.map(({ id, ...rest }) => rest),
    });
    setIsSavingMcq(false);

    if (res.success) {
      const addedCount = res.data?.count || mcqQuestionsList.length;
      setMcqSavedCount(addedCount);
      setMcqSavedSuccess(true);
      setMcqQuestionsList([
        {
          id: `q-${Date.now()}-1`,
          questionText: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctOptionIndex: 0,
          explanation: "",
        },
      ]);
      loadMcqs();
      const match = quizSetTitleInput.match(/#(\d+)/);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        setQuizSetTitleInput(
          quizSetTitleInput.replace(`#${currentNum}`, `#${currentNum + 1}`),
        );
      } else {
        setQuizSetTitleInput(
          "Practice Test Set #" + (Math.floor(Math.random() * 90) + 10),
        );
      }
      setTimeout(() => setMcqSavedSuccess(false), 5000);
    } else {
      setMcqError(res.message || "Failed to save MCQ questions.");
    }
  };

  const loadTeacherWithdrawalData = async () => {
    setIsLoadingTeacherWithdrawals(true);
    try {
      const [wRes, pRes] = await Promise.all([
        fetchMyWithdrawals(),
        fetchPayoutProfile(),
      ]);
      if (wRes.success && wRes.data) {
        setTeacherWithdrawalsList(wRes.data.withdrawals || []);
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
      console.error("Error loading teacher withdrawal data:", err);
    }
    setIsLoadingTeacherWithdrawals(false);
  };

  // Submit Payout Request
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutErrorMsg("");
    setPayoutSuccessMsg("");

    const amt = Number(payoutAmount);
    if (isNaN(amt) || amt < 50) {
      setPayoutErrorMsg(
        "Please enter a valid payout withdrawal amount (Minimum ₹50).",
      );
      return;
    }

    const availableBal = stats?.walletBalance || stats?.totalRevenue || 0;
    if (amt > availableBal) {
      setPayoutErrorMsg(
        `Insufficient balance. Maximum available is ₹${availableBal.toLocaleString("en-IN")}.`,
      );
      return;
    }

    if (payoutMethod === "BANK") {
      if (
        !bankAccountHolder.trim() ||
        !bankAccountNumber.trim() ||
        !bankIfscCode.trim()
      ) {
        setPayoutErrorMsg(
          "Please enter Account Holder Name, Account Number, and IFSC Code.",
        );
        return;
      }
      if (bankAccountNumber.trim() !== bankAccountConfirm.trim()) {
        setPayoutErrorMsg("Bank Account Numbers do not match.");
        return;
      }
      if (bankIfscCode.trim().length < 5) {
        setPayoutErrorMsg("Please enter a valid IFSC code (e.g. SBIN0001234).");
        return;
      }
    } else {
      if (!upiIdInput.trim() || !upiIdInput.includes("@")) {
        setPayoutErrorMsg(
          "Please enter a valid UPI ID (e.g. name@bank or mobile@upi).",
        );
        return;
      }
    }

    setIsSubmittingPayout(true);
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
    setIsSubmittingPayout(false);

    if (res.success) {
      setPayoutSuccessMsg(
        `✅ Withdrawal request of ₹${amt.toLocaleString("en-IN")} submitted to Super Admin! Funds will be transferred to your ${payoutMethod === "BANK" ? "Bank Account" : "UPI ID"}.`,
      );
      loadStats();
      loadTeacherWithdrawalData();
    } else {
      setPayoutErrorMsg(res.message || "Payout request failed.");
    }
  };

  const handleCancelTeacherWithdrawal = async (id: string) => {
    if (
      !window.confirm(
        "Cancel this withdrawal request? Your funds will be returned to your balance.",
      )
    )
      return;
    const res = await cancelMyWithdrawal(id);
    if (res.success) {
      loadStats();
      loadTeacherWithdrawalData();
    } else {
      alert(res.message || "Failed to cancel withdrawal.");
    }
  };

  // Derived filtered MCQs
  const uniqueQuizSets = Array.from(
    new Set(mcqsList.map((m) => m.quizSetTitle).filter(Boolean)),
  ) as string[];
  const filteredMcqs = mcqsList.filter((m) => {
    if (mcqSearchQuery.trim()) {
      const q = mcqSearchQuery.toLowerCase();
      const inText = m.questionText?.toLowerCase().includes(q);
      const inOpts = m.options?.some((opt) => opt?.toLowerCase().includes(q));
      const inExp = m.explanation?.toLowerCase().includes(q);
      if (!inText && !inOpts && !inExp) return false;
    }
    if (mcqFilterCourseId) {
      const mCourseId =
        typeof m.course === "object" && m.course?._id
          ? m.course._id
          : typeof m.course === "string"
            ? m.course
            : "";
      if (mCourseId !== mcqFilterCourseId) return false;
    }
    if (mcqFilterQuizSet && m.quizSetTitle !== mcqFilterQuizSet) {
      return false;
    }
    return true;
  });

  // Derived filtered attempts
  const uniqueAttemptQuizSets = Array.from(
    new Set(attemptsList.map((a) => a.quizSetTitle).filter(Boolean)),
  ) as string[];
  const passedAttemptsCount = attemptsList.filter((a) => a.passed).length;
  const needsImprovementCount = attemptsList.filter((a) => !a.passed).length;

  const filteredAttempts = attemptsList.filter((a) => {
    if (attemptSearchQuery.trim()) {
      const q = attemptSearchQuery.toLowerCase();
      const inName = a.user?.name?.toLowerCase().includes(q);
      const inId = a.user?.userId?.toLowerCase().includes(q);
      const inMobile = a.user?.mobile?.toLowerCase().includes(q);
      if (!inName && !inId && !inMobile) return false;
    }
    if (attemptFilterQuizSet && a.quizSetTitle !== attemptFilterQuizSet) {
      return false;
    }
    if (attemptFilterStatus === "PASSED" && !a.passed) return false;
    if (attemptFilterStatus === "FAILED" && a.passed) return false;
    return true;
  });

  return (
    <div>
      {/* Compact Top Banner Header */}
      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          border: "1px solid rgba(16, 185, 129, 0.4)",
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
                className="badge badge-emerald"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
              >
                <GraduationCap size={12} /> TEACHER & EDUCATOR WEB PORTAL
              </span>
              <span
                className="badge badge-primary"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
              >
                INSTRUCTOR SUITE
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
              Welcome Back, {user?.name || "Prof. Educator"}
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.82rem",
                margin: 0,
              }}
            >
              Create Courses, Build Live MCQs, Track Student Quiz Attempts &
              Manage Earnings.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-secondary"
              onClick={() => {
                loadStats();
                loadCourses();
                loadMcqs();
                loadAttempts();
              }}
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <RefreshCw
                size={14}
                className={isLoadingStats ? "animate-spin" : ""}
              />{" "}
              Refresh Data
            </button>
            <button
              className="btn-emerald"
              onClick={() => setActiveTab("CREATE")}
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <PlusCircle size={14} /> Create Course
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
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.12) 100%)",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--badge-emerald-color, #047857)",
              fontWeight: "800",
              marginBottom: "2px",
            }}
          >
            MY TOTAL SALES ROYALTIES (70% SHARE)
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            ₹ {stats ? (stats.totalRevenue || 0).toLocaleString("en-IN") : "0"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            From Course Sales & Royalties
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
            ENROLLED STUDENTS
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            {stats ? (stats.totalStudents || 0).toLocaleString("en-IN") : "0"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Across All Active Batches
          </div>
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
            MY COURSES PUBLISHED
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            {stats ? stats.activeCoursesCount || coursesList.length : "0"}{" "}
            Batches
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Live & Recorded Courses
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "12px 16px", borderRadius: "12px" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "#A855F7",
              fontWeight: "700",
              marginBottom: "2px",
            }}
          >
            MCQ QUESTIONS AUTHORED
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "800" }}>
            {mcqsList.length} Questions
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {attemptsList.length} Student Quiz Attempts
          </div>
        </div>
      </div>

      {/* GLOBAL SYSTEM ANNOUNCEMENT BROADCAST BANNER */}
      {systemAnnouncement && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            background:
              "linear-gradient(90deg, rgba(244,63,94,0.12), rgba(245,158,11,0.12))",
            border: "1px solid rgba(244,63,94,0.3)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.85rem",
          }}
        >
          <Megaphone size={18} style={{ color: "#FB7185", flexShrink: 0 }} />
          <div style={{ flex: 1, color: "var(--text-primary)" }}>
            <strong
              style={{
                color: "#FB7185",
                textTransform: "uppercase",
                marginRight: "6px",
              }}
            >
              📢 Official Admin Notice:
            </strong>
            {systemAnnouncement}
          </div>
        </div>
      )}

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
          onClick={() => setActiveTab("MY_COURSES")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "MY_COURSES"
                ? "var(--emerald-gradient)"
                : "transparent",
            color:
              activeTab === "MY_COURSES" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <BookOpen
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          My Published Batches ({coursesList.length})
        </button>

        <button
          onClick={() => setActiveTab("CREATE")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "CREATE"
                ? "var(--primary-gradient)"
                : "transparent",
            color: activeTab === "CREATE" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <PlusCircle
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Publish New Batch
        </button>

        <button
          onClick={() => setActiveTab("MCQ_BUILDER")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "MCQ_BUILDER"
                ? "var(--amber-gradient)"
                : "transparent",
            color:
              activeTab === "MCQ_BUILDER" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <HelpCircle
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Live MCQ Question Builder
        </button>

        <button
          onClick={() => setActiveTab("MCQ_AUDIT")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "MCQ_AUDIT"
                ? "var(--rose-gradient)"
                : "transparent",
            color: activeTab === "MCQ_AUDIT" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Award size={15} style={{ display: "inline", marginRight: "6px" }} />
          MCQ Bank & Student Attempts ({mcqsList.length})
        </button>

        <button
          onClick={() => setActiveTab("ROYALTY_PAYOUT")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "ROYALTY_PAYOUT"
                ? "var(--secondary-gradient)"
                : "transparent",
            color:
              activeTab === "ROYALTY_PAYOUT" ? "#FFF" : "var(--text-secondary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <DollarSign
            size={15}
            style={{ display: "inline", marginRight: "6px" }}
          />
          Royalty Earnings Withdrawal
        </button>

        

        <button
          onClick={() => setActiveTab("MLM_NETWORK")}
          style={{
            flex: 1,
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            background:
              activeTab === "MLM_NETWORK"
                ? "var(--amber-gradient)"
                : "transparent",
            color: activeTab === "MLM_NETWORK" ? "#FFF" : "#FBBF24",
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <Share2 size={15} style={{ display: "inline", marginRight: "6px" }} />
          🤝 MLM Network & Referrals
        </button>
      </div>

      {/* TAB: MLM BINARY REFERRAL NETWORK */}
      {activeTab === "MLM_NETWORK" && <AffiliateMlmPortal />}

      {/* TAB 1: MY COURSES DIRECTORY */}
      {activeTab === "MY_COURSES" && (
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
              My Published Courses & Batches ({coursesList.length})
            </h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="btn-amber"
                onClick={() => {
                  setShowBulkMcqModal(true);
                  setBulkMcqError("");
                  setBulkMcqSuccessMsg("");
                }}
                style={{
                  fontSize: "0.8rem",
                  padding: "6px 14px",
                  fontWeight: "800",
                }}
              >
                <FileSpreadsheet size={15} style={{ marginRight: "6px" }} />{" "}
                Bulk Upload MCQs (CSV/Excel)
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBulkUploadModal(true);
                  setBulkUploadError("");
                  setBulkUploadResult(null);
                }}
                style={{
                  fontSize: "0.8rem",
                  padding: "6px 14px",
                  fontWeight: "700",
                }}
              >
                <UploadCloud size={15} style={{ marginRight: "6px" }} /> Bulk
                Courses
              </button>
              <button
                className="btn-emerald"
                onClick={() => setActiveTab("CREATE")}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                <PlusCircle size={14} style={{ marginRight: "4px" }} /> Create
                Course
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
                  fontSize: "0.85rem",
                }}
              >
                Loading instructor courses...
              </div>
            ) : coursesList.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No published courses found. Click "Publish New Batch" above to
                start!
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
                        flexWrap: "wrap",
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
                          LIVE BATCH
                        </span>
                      ) : (
                        <span
                          className="badge badge-rose"
                          style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                        >
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Subjects:{" "}
                      <strong style={{ color: "#FBBF24" }}>
                        {crs.subjects && crs.subjects.length > 0
                          ? crs.subjects.join(", ")
                          : crs.subjectName || "All Subjects"}
                      </strong>{" "}
                      • Delivery Mode:{" "}
                      <strong>{crs.courseMode || "RECORDED_VIDEO"}</strong> •
                      Price:{" "}
                      <strong
                        style={{ color: "var(--badge-emerald-color, #047857)" }}
                      >
                        ₹{crs.price}
                      </strong>{" "}
                      (MRP: ₹{crs.originalPrice})
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                  >
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        handleOpenBulkMcqForCourse(crs._id, crs.title)
                      }
                      style={{
                        fontSize: "0.75rem",
                        padding: "5px 10px",
                        color: "#F59E0B",
                        borderColor: "rgba(245,158,11,0.3)",
                      }}
                      title="Upload CSV / Excel questions directly to this course batch"
                    >
                      <FileSpreadsheet
                        size={13}
                        style={{ marginRight: "4px" }}
                      />{" "}
                      Bulk Upload MCQs
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleInspectTeacherCourseRoster(crs._id)}
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
                      <Eye size={13} style={{ marginRight: "4px" }} /> Inspect
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE NEW COURSE FORM - STEP-BY-STEP WIZARD */}
      {activeTab === "CREATE" && (
        <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
          {courseCreatedSuccess && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "var(--badge-emerald-color, #047857)",
                fontSize: "0.86rem",
                fontWeight: "800",
                marginBottom: "16px",
              }}
            >
              🎉 Course batch published successfully! It is now live in your
              course directory.
            </div>
          )}

          <CourseCreationWizardModal
            isOpen={true}
            inline={true}
            onClose={() => {}}
            isEditMode={false}
            portalType="TEACHER"
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
              setNewSubjects([DEFAULT_SUBJECT]);
              setNewSubjectName(DEFAULT_SUBJECT);
            }}
            boardGrade={newBoardGrade}
            onBoardGradeChange={setNewBoardGrade}
            stream={newStream}
            onStreamChange={setNewStream}
            subjectName={newSubjectName}
            onSubjectNameChange={setNewSubjectName}
            subjects={newSubjects}
            onSubjectsChange={(sbjs) => {
              setNewSubjects(sbjs);
              setNewSubjectName(sbjs.join(", "));
            }}
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
        </div>
      )}

      {/* TAB 3: LIVE MCQ QUESTION BUILDER */}
      {activeTab === "MCQ_BUILDER" && (
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
                MCQ QUESTION BANK AUTHORING
              </span>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "800",
                  marginTop: "6px",
                  color: "var(--text-primary)",
                }}
              >
                Build & Publish Live MCQ Test Paper
              </h3>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-amber"
                onClick={() => {
                  if (selectedMcqCourseId) {
                    setBulkMcqCourseId(selectedMcqCourseId);
                  }
                  setShowBulkMcqModal(true);
                  setBulkMcqError("");
                  setBulkMcqSuccessMsg("");
                }}
                style={{
                  fontSize: "0.82rem",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileSpreadsheet size={15} /> 📥 Bulk Upload via CSV / Excel
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddMcqQuestionItem}
                style={{
                  fontSize: "0.82rem",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <PlusCircle size={15} /> ➕ Add Another Question
              </button>
            </div>
          </div>

          {mcqSavedSuccess && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "var(--badge-emerald-color, #047857)",
                fontSize: "0.88rem",
                fontWeight: "800",
                marginBottom: "16px",
              }}
            >
              ✅ Successfully published {mcqSavedCount} MCQ question(s) to
              course test bank!
            </div>
          )}

          {mcqError && (
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
              <span>{mcqError}</span>
            </div>
          )}

          <form
            onSubmit={handleSaveMcqSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <label
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    color: "#818CF8",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  🎯 Select Target Course Batch *
                </label>
                <select
                  className="form-input"
                  value={selectedMcqCourseId}
                  onChange={(e) => setSelectedMcqCourseId(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    fontSize: "0.92rem",
                    fontWeight: "700",
                    borderColor: "#818CF8",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                >
                  <option value="">-- Choose Course Batch --</option>
                  {coursesList.map((c: CourseRecord) => (
                    <option key={c._id} value={c._id}>
                      📚 {c.title} ({c.boardOrGrade || "General"} •{" "}
                      {c.subjects && c.subjects.length > 0
                        ? c.subjects.join(", ")
                        : c.subjectName || "All Subjects"}{" "}
                      • ₹{c.price})
                    </option>
                  ))}
                </select>
                {selectedMcqCourseId && (
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--badge-emerald-color, #047857)",
                      marginTop: "8px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle2 size={13} /> Questions will be linked directly
                    to this selected course batch
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <label
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  📝 Test Paper / Quiz Set Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={quizSetTitleInput}
                  onChange={(e) => setQuizSetTitleInput(e.target.value)}
                  placeholder="e.g. Unit 1 Physics Test, Practice Test Set #2..."
                  style={{
                    padding: "12px 14px",
                    fontSize: "0.92rem",
                    fontWeight: "700",
                    borderColor: "#FBBF24",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Questions List Iteration */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {mcqQuestionsList.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: "20px 22px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        className="badge badge-primary"
                        style={{
                          fontSize: "0.82rem",
                          padding: "4px 10px",
                          fontWeight: "800",
                        }}
                      >
                        Question #{index + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Fill details below
                      </span>
                    </div>

                    {mcqQuestionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMcqQuestionItem(item.id)}
                        style={{
                          background: "rgba(244, 63, 94, 0.12)",
                          border: "1px solid rgba(244, 63, 94, 0.3)",
                          color: "#FB7185",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <X size={14} /> Remove Q#{index + 1}
                      </button>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        color: "var(--text-secondary)",
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      Question Statement *
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={item.questionText}
                      onChange={(e) =>
                        handleUpdateMcqQuestionItem(
                          index,
                          "questionText",
                          e.target.value,
                        )
                      }
                      placeholder={`e.g. Question ${index + 1} statement...`}
                      style={{ padding: "10px 12px", fontSize: "0.88rem" }}
                    />
                  </div>

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
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Option A *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.optionA}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "optionA",
                            e.target.value,
                          )
                        }
                        placeholder="Option A"
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>

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
                        Option B *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.optionB}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "optionB",
                            e.target.value,
                          )
                        }
                        placeholder="Option B"
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>

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
                        Option C *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.optionC}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "optionC",
                            e.target.value,
                          )
                        }
                        placeholder="Option C"
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>

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
                        Option D *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.optionD}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "optionD",
                            e.target.value,
                          )
                        }
                        placeholder="Option D"
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>

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
                          fontWeight: "800",
                          color: "var(--badge-emerald-color, #047857)",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Select Correct Answer Option *
                      </label>
                      <select
                        className="form-input"
                        value={item.correctOptionIndex}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "correctOptionIndex",
                            Number(e.target.value),
                          )
                        }
                        style={{
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                        }}
                      >
                        <option value={0}>
                          Option A: {item.optionA || "Option A"}
                        </option>
                        <option value={1}>
                          Option B: {item.optionB || "Option B"}
                        </option>
                        <option value={2}>
                          Option C: {item.optionC || "Option C"}
                        </option>
                        <option value={3}>
                          Option D: {item.optionD || "Option D"}
                        </option>
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
                        Detailed Solution & Explanation
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.explanation}
                        onChange={(e) =>
                          handleUpdateMcqQuestionItem(
                            index,
                            "explanation",
                            e.target.value,
                          )
                        }
                        placeholder="Step-by-step solution..."
                        style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddMcqQuestionItem}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <PlusCircle size={16} /> ➕ Add Another Question (Q#
                {mcqQuestionsList.length + 1})
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingMcq}
                style={{
                  padding: "12px 24px",
                  fontSize: "0.92rem",
                  fontWeight: "800",
                  borderRadius: "8px",
                }}
              >
                {isSavingMcq
                  ? "Publishing Test Paper..."
                  : `🚀 Publish ${mcqQuestionsList.length} Question(s) to Course Bank`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: MCQ BANK & STUDENT ATTEMPTS INSPECTOR */}
      {activeTab === "MCQ_AUDIT" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Section A: Published MCQ Question List */}
          <div
            className="glass-card"
            style={{ padding: "16px 20px", borderRadius: "14px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "10px",
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
                <h3
                  style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}
                >
                  📝 My Created MCQ Questions Bank ({filteredMcqs.length}/
                  {mcqsList.length})
                </h3>
                <span
                  className="badge badge-amber"
                  style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                >
                  {uniqueQuizSets.length} Test Set(s)
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="btn-amber"
                  onClick={() => {
                    setShowBulkMcqModal(true);
                    setBulkMcqError("");
                    setBulkMcqSuccessMsg("");
                  }}
                  style={{
                    fontSize: "0.78rem",
                    padding: "5px 12px",
                    fontWeight: "800",
                  }}
                >
                  <FileSpreadsheet size={14} style={{ marginRight: "5px" }} />{" "}
                  Bulk Upload (CSV/Excel)
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab("MCQ_BUILDER")}
                  style={{
                    fontSize: "0.78rem",
                    padding: "5px 12px",
                    fontWeight: "700",
                  }}
                >
                  <PlusCircle size={14} style={{ marginRight: "4px" }} /> Single
                  Builder
                </button>
                <button
                  className="btn-secondary"
                  onClick={loadMcqs}
                  style={{ fontSize: "0.78rem", padding: "5px 10px" }}
                >
                  <RefreshCw
                    size={13}
                    className={isLoadingMcqs ? "animate-spin" : ""}
                  />{" "}
                  Refresh
                </button>
              </div>
            </div>

            {/* MCQ Search & Filter Toolbar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                marginBottom: "12px",
                background: "rgba(255,255,255,0.02)",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ position: "relative" }}>
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
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search questions or options..."
                  value={mcqSearchQuery}
                  onChange={(e) => setMcqSearchQuery(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "6px 10px 6px 32px" }}
                />
              </div>

              <select
                className="form-input"
                value={mcqFilterCourseId}
                onChange={(e) => setMcqFilterCourseId(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              >
                <option value="">All Courses ({coursesList.length})</option>
                {coursesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                className="form-input"
                value={mcqFilterQuizSet}
                onChange={(e) => setMcqFilterQuizSet(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              >
                <option value="">
                  All Test Paper Sets ({uniqueQuizSets.length})
                </option>
                {uniqueQuizSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>
            </div>

            {/* Compact Questions List */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {isLoadingMcqs ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Loading questions...
                </div>
              ) : filteredMcqs.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  {mcqsList.length === 0
                    ? 'No MCQ questions created yet. Click "Bulk Upload (CSV/Excel)" or "Single Builder" to add questions!'
                    : "No questions match your current search/filter criteria."}
                </div>
              ) : (
                filteredMcqs.map((mcq, idx) => {
                  const courseTitle =
                    typeof mcq.course === "object" && mcq.course?.title
                      ? mcq.course.title
                      : null;
                  const courseIdStr =
                    typeof mcq.course === "object" && mcq.course?._id
                      ? mcq.course._id
                      : typeof mcq.course === "string"
                        ? mcq.course
                        : null;
                  const correctIdx = Number(
                    (mcq as any).correctOption ??
                      (mcq as any).correctOptionIndex ??
                      -1,
                  );

                  return (
                    <div
                      key={mcq._id}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border-color)",
                        borderLeft: "3px solid #F59E0B",
                      }}
                    >
                      {/* Header Line */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: "800",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#FBBF24",
                              padding: "2px 7px",
                              borderRadius: "4px",
                            }}
                          >
                            Q{idx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: "rgba(99, 102, 241, 0.12)",
                              color: "#818CF8",
                              fontWeight: "700",
                            }}
                          >
                            📁 {mcq.quizSetTitle || "Practice Test Set"}
                          </span>
                          {courseTitle && (
                            <span className="course-tag-badge">
                              📚 {courseTitle}
                            </span>
                          )}
                          {courseIdStr && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                                fontFamily: "monospace",
                              }}
                            >
                              ID: {courseIdStr.slice(-6)}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ⭐ {mcq.marks || 1} M
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteMcqItem(mcq._id)}
                          disabled={isDeletingMcqId === mcq._id}
                          title="Delete question from bank"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#FB7185",
                            cursor: "pointer",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.72rem",
                            opacity: isDeletingMcqId === mcq._id ? 0.4 : 0.8,
                          }}
                        >
                          <Trash2 size={13} style={{ marginRight: "3px" }} />{" "}
                          Delete
                        </button>
                      </div>

                      {/* Question Statement */}
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "0.86rem",
                          color: "var(--text-primary)",
                          marginBottom: "8px",
                          lineHeight: 1.35,
                        }}
                      >
                        {mcq.questionText}
                      </div>

                      {/* 4 Options Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "6px",
                          fontSize: "0.78rem",
                          marginBottom: "6px",
                        }}
                      >
                        {["A", "B", "C", "D"].map((letter, optIdx) => {
                          const isCorrect = correctIdx === optIdx;
                          return (
                            <div
                              key={letter}
                              className={isCorrect ? "mcq-option-correct" : ""}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                background: isCorrect
                                  ? undefined
                                  : "var(--bg-surface)",
                                border: isCorrect
                                  ? undefined
                                  : "1px solid var(--border-color)",
                                color: isCorrect
                                  ? undefined
                                  : "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={mcq.options?.[optIdx] || ""}
                            >
                              <strong
                                style={{
                                  color: isCorrect
                                    ? "inherit"
                                    : "var(--text-muted)",
                                }}
                              >
                                {letter})
                              </strong>
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {mcq.options?.[optIdx] || "-"}
                              </span>
                              {isCorrect && (
                                <span className="mcq-correct-pill">
                                  <CheckCircle2 size={10} /> Correct Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation note */}
                      {mcq.explanation && (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.02)",
                            padding: "4px 8px",
                            borderRadius: "5px",
                            marginTop: "4px",
                          }}
                        >
                          💡 <strong>Solution Note:</strong> {mcq.explanation}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section B: Student Quiz Attempts Log */}
          <div
            className="glass-card"
            style={{ padding: "16px 20px", borderRadius: "14px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "10px",
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
                <h3
                  style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}
                >
                  🎓 Student Quiz Attendance & Marks Log (
                  {filteredAttempts.length}/{attemptsList.length})
                </h3>
              </div>
              <button
                className="btn-secondary"
                onClick={loadAttempts}
                style={{ fontSize: "0.78rem", padding: "5px 10px" }}
              >
                <RefreshCw
                  size={13}
                  className={isLoadingAttempts ? "animate-spin" : ""}
                />{" "}
                Refresh Attempts
              </button>
            </div>

            {/* KPI Metrics Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Total Attempts
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    color: "#818CF8",
                  }}
                >
                  {attemptsList.length}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Passed Tests
                </div>
                <div
                  className="text-score-passed"
                  style={{ fontSize: "1.2rem" }}
                >
                  {passedAttemptsCount}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(244, 63, 94, 0.08)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Needs Improvement
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    color: "#FB7185",
                  }}
                >
                  {needsImprovementCount}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  Avg Pass Rate
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                  }}
                >
                  {attemptsList.length > 0
                    ? Math.round(
                        (passedAttemptsCount / attemptsList.length) * 100,
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* Attempts Search & Filter Toolbar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                marginBottom: "12px",
                background: "rgba(255,255,255,0.02)",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ position: "relative" }}>
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
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search student name, ID or mobile..."
                  value={attemptSearchQuery}
                  onChange={(e) => setAttemptSearchQuery(e.target.value)}
                  style={{ fontSize: "0.8rem", padding: "6px 10px 6px 32px" }}
                />
              </div>

              <select
                className="form-input"
                value={attemptFilterQuizSet}
                onChange={(e) => setAttemptFilterQuizSet(e.target.value)}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              >
                <option value="">
                  All Test Paper Sets ({uniqueAttemptQuizSets.length})
                </option>
                {uniqueAttemptQuizSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>

              <select
                className="form-input"
                value={attemptFilterStatus}
                onChange={(e) => setAttemptFilterStatus(e.target.value as any)}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
              >
                <option value="ALL">All Scores & Status</option>
                <option value="PASSED">Passed (≥50%)</option>
                <option value="FAILED">Needs Improvement (&lt;50%)</option>
              </select>
            </div>

            {/* Compact Attempts List */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {isLoadingAttempts ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Loading student attempts...
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  {attemptsList.length === 0
                    ? "No students have attempted quizzes yet. When students submit quiz responses, their marks will appear here live!"
                    : "No student attempts match your current search/filter criteria."}
                </div>
              ) : (
                filteredAttempts.map((att) => {
                  const dateFormatted = att.createdAt
                    ? new Date(att.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";
                  const courseTitle =
                    typeof att.course === "object" && att.course?.title
                      ? att.course.title
                      : null;

                  return (
                    <div
                      key={att._id}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {/* Student & Test Info */}
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ color: "var(--text-primary)" }}>
                            {att.user?.name || "Student"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "rgba(255,255,255,0.06)",
                              fontFamily: "monospace",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {att.user?.userId || "N/A"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "rgba(99, 102, 241, 0.12)",
                              color: "#818CF8",
                              fontWeight: "700",
                            }}
                          >
                            📁 {att.quizSetTitle || "Practice Test Set"}
                          </span>
                          {courseTitle && (
                            <span className="course-tag-badge">
                              📚 {courseTitle}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>📱 {att.user?.mobile || "N/A"}</span>
                          <span>•</span>
                          <span>
                            Subject: {att.subject?.title || "General Science"}
                          </span>
                          <span>•</span>
                          <span>🕒 {dateFormatted}</span>
                        </div>
                      </div>

                      {/* Score & Status */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            className={
                              att.passed
                                ? "text-score-passed"
                                : "text-score-failed"
                            }
                            style={{ fontSize: "0.88rem" }}
                          >
                            Score: {att.score} / {att.totalMarks} (
                            {att.percentage}%)
                          </div>
                          <span
                            className={`badge ${att.passed ? "badge-emerald" : "badge-rose"}`}
                            style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                          >
                            {att.passed ? "PASSED" : "NEEDS IMPROVEMENT"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ROYALTY PAYOUT WITHDRAWAL */}
      {activeTab === "ROYALTY_PAYOUT" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* Form Card */}
          <div
            className="glass-card"
            style={{ padding: "24px 28px", borderRadius: "18px" }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="badge badge-emerald"
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    fontWeight: "800",
                  }}
                >
                  INSTRUCTOR EARNINGS CASHOUT
                </span>
                {savedPayoutProfile?.isConfigured && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#10B981",
                      fontWeight: 700,
                      background: "rgba(16,185,129,0.12)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(16,185,129,0.25)",
                    }}
                  >
                    ✓ Saved Details Auto-loaded
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "800",
                  marginTop: "4px",
                  color: "var(--text-primary)",
                }}
              >
                Request Royalty & Earnings Withdrawal
              </h3>
            </div>

            {/* DUAL EARNINGS BREAKDOWN */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              {/* CARD 1: Course Sales Royalties */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.05) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
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
                      fontSize: "0.72rem",
                      color: "#60A5FA",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    🎓 COURSE SALES ROYALTIES
                  </span>
                  <span
                    className="badge badge-primary"
                    style={{ fontSize: "0.64rem", padding: "2px 6px" }}
                  >
                    70% GROSS SHARE
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "900",
                    color: "var(--text-primary)",
                    margin: "4px 0",
                  }}
                >
                  ₹{" "}
                  {(stats?.courseRoyaltyEarnings || 0).toLocaleString("en-IN")}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  Earned from {stats?.totalStudents || 0} student enrollments
                  across {stats?.activeCoursesCount || 0} published courses.
                </div>
              </div>

              {/* CARD 2: Refer & Earn MLM Commissions */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.05) 100%)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
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
                      fontSize: "0.72rem",
                      color: "#C084FC",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    🎁 REFER & EARN COMMISSIONS
                  </span>
                  <span
                    className="badge badge-rose"
                    style={{ fontSize: "0.64rem", padding: "2px 6px" }}
                  >
                    AFFILIATE & MLM
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "900",
                    color: "var(--text-primary)",
                    margin: "4px 0",
                  }}
                >
                  ₹ {(stats?.referralEarnings || 0).toLocaleString("en-IN")}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  Earned from onboarding faculty & student referrals and binary
                  matching bonuses.
                </div>
              </div>

              {/* CARD 3: Total Available Withdrawable Balance */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.08) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  gridColumn: "span 1",
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
                      fontSize: "0.72rem",
                      color: "var(--badge-emerald-color, #047857)",
                      fontWeight: "800",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    💰 TOTAL WITHDRAWABLE BALANCE
                  </span>
                  <span
                    className="badge badge-emerald"
                    style={{ fontSize: "0.64rem", padding: "2px 6px" }}
                  >
                    100% CASHOUT READY
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "2.1rem",
                    fontWeight: "900",
                    color: "var(--badge-emerald-color, #047857)",
                    margin: "4px 0",
                  }}
                >
                  ₹ {(stats?.walletBalance || 0).toLocaleString("en-IN")}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Course Royalties + Referrals</span>
                  {(stats?.totalWithdrawn || 0) > 0 && (
                    <span>
                      Settled: ₹
                      {(stats?.totalWithdrawn || 0).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Explanatory Notice */}
            <div
              style={{
                padding: "9px 12px",
                borderRadius: "10px",
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.22)",
                marginBottom: "16px",
                fontSize: "0.76rem",
                color: "#93C5FD",
                lineHeight: 1.45,
              }}
            >
              💡 <strong>Note:</strong> Aap apne <strong>Course Sales</strong>{" "}
              ki royalties aur <strong>Refer & Earn</strong> se kamaya hua
              commission dono ko ek sath ya apni marzi se Bank Account ya UPI ID
              me withdraw kar sakte hain.
            </div>

            {payoutSuccessMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "var(--badge-emerald-color, #047857)",
                  fontSize: "0.84rem",
                  fontWeight: "800",
                  marginBottom: "14px",
                }}
              >
                {payoutSuccessMsg}
              </div>
            )}

            {payoutErrorMsg && (
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
                <span>{payoutErrorMsg}</span>
              </div>
            )}

            <form
              onSubmit={handlePayoutSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
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
                  Enter Payout Withdrawal Amount (₹) *
                </label>
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "6px" }}
                >
                  {["500", "1000", "2500", "5000"].map((amt) => {
                    const disabled = (stats?.walletBalance || 0) < Number(amt);
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayoutAmount(amt)}
                        disabled={disabled}
                        className={
                          payoutAmount === amt ? "btn-emerald" : "btn-secondary"
                        }
                        style={{
                          flex: 1,
                          padding: "5px",
                          fontSize: "0.74rem",
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
                      setPayoutAmount(String(stats?.walletBalance || 0))
                    }
                    disabled={(stats?.walletBalance || 0) < 50}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      padding: "5px",
                      fontSize: "0.74rem",
                      fontWeight: "800",
                      opacity: (stats?.walletBalance || 0) < 50 ? 0.35 : 1,
                    }}
                  >
                    All
                  </button>
                </div>
                <input
                  type="number"
                  className="form-input"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  min="50"
                  max={stats?.walletBalance || 0}
                  style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                />
              </div>

              {/* Payout Destination Selector */}
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
                  Payout Destination Method *
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
                          ? "2px solid var(--badge-emerald-color, #047857)"
                          : "1px solid var(--border-color)",
                      background:
                        payoutMethod === "UPI"
                          ? "rgba(16, 185, 129, 0.12)"
                          : "var(--bg-surface)",
                      color:
                        payoutMethod === "UPI"
                          ? "var(--badge-emerald-color, #047857)"
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

              {/* Bank Inputs */}
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
                      placeholder="teacher@okhdfcbank or mobile@upi"
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
                }}
              >
                <input
                  type="checkbox"
                  checked={saveAsDefaultPayout}
                  onChange={(e) => setSaveAsDefaultPayout(e.target.checked)}
                />
                Save as default withdrawal account for future payouts
              </label>

              <button
                type="submit"
                className="btn-emerald"
                disabled={isSubmittingPayout}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.9rem",
                  fontWeight: "800",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ArrowUpRight size={18} />
                {isSubmittingPayout
                  ? "Submitting Withdrawal Request..."
                  : "Submit Payout Withdrawal Request"}
              </button>
            </form>
          </div>

          {/* Teacher Withdrawal History Card */}
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
                  Royalty Payouts History ({teacherWithdrawalsList.length})
                </h4>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Track your previous payout requests, bank UTR numbers, and
                  approval status.
                </p>
              </div>
              <button
                className="btn-secondary"
                onClick={loadTeacherWithdrawalData}
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
                  className={isLoadingTeacherWithdrawals ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
            </div>

            {isLoadingTeacherWithdrawals ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Loading payout records...
              </div>
            ) : teacherWithdrawalsList.length === 0 ? (
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
                  No Payout Requests Yet
                </div>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  Submit your first royalty withdrawal request using the form on
                  the left.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "550px",
                  overflowY: "auto",
                }}
              >
                {teacherWithdrawalsList.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isApproved = item.status === "APPROVED";
                  const isRejected = item.status === "REJECTED";
                  const isCancelled = item.status === "CANCELLED";

                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
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
                          flexDirection: "column",
                          gap: "3px",
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
                              fontSize: "1.2rem",
                              fontWeight: "900",
                              color: isApproved
                                ? "var(--badge-emerald-color, #047857)"
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
                            style={{ fontSize: "0.7rem", padding: "2px 7px" }}
                          >
                            {isApproved && "✅ APPROVED & PAID"}
                            {isPending && "🟡 PENDING APPROVAL"}
                            {isRejected && "❌ REJECTED"}
                            {isCancelled && "⚪ CANCELLED"}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {item.payoutMethod === "BANK" ? (
                            <span>
                              🏦 <strong>Bank:</strong>{" "}
                              {item.bankDetails?.bankName || "Bank"} • A/C:{" "}
                              {item.bankDetails?.accountNumber} (IFSC:{" "}
                              {item.bankDetails?.ifscCode})
                            </span>
                          ) : (
                            <span>
                              📱 <strong>UPI:</strong> {item.upiDetails?.upiId}{" "}
                              ({item.upiDetails?.accountHolderName})
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          ID:{" "}
                          <code style={{ color: "var(--primary-accent)" }}>
                            {item.withdrawalId}
                          </code>{" "}
                          •{" "}
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
                              fontSize: "0.76rem",
                              color: "var(--badge-emerald-color, #047857)",
                              fontWeight: "700",
                              marginTop: "2px",
                            }}
                          >
                            ✓ Bank UTR: <u>{item.utrNumber}</u>
                          </div>
                        )}

                        {item.rejectionReason && (
                          <div
                            style={{
                              fontSize: "0.76rem",
                              color: "#FB7185",
                              fontWeight: "600",
                              marginTop: "2px",
                            }}
                          >
                            ⚠️ Reason: {item.rejectionReason} (Balance Refunded)
                          </div>
                        )}
                      </div>

                      {isPending && (
                        <button
                          className="btn-rose"
                          onClick={() =>
                            handleCancelTeacherWithdrawal(item._id)
                          }
                          style={{
                            padding: "5px 10px",
                            fontSize: "0.74rem",
                            borderRadius: "6px",
                          }}
                        >
                          Cancel
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                      fontWeight: "600",
                    }}
                  >
                    MongoDB Course _id:
                  </span>
                  <code
                    style={{
                      fontSize: "0.76rem",
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "#818CF8",
                      padding: "2px 8px",
                      borderRadius: "5px",
                      border: "1px solid rgba(99, 102, 241, 0.28)",
                      fontFamily: "monospace",
                      fontWeight: "700",
                    }}
                  >
                    {selectedCourseDetail._id}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyCourseId(selectedCourseDetail._id)}
                    style={{
                      background:
                        copiedCourseId === selectedCourseDetail._id
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(255, 255, 255, 0.08)",
                      border:
                        copiedCourseId === selectedCourseDetail._id
                          ? "1px solid #10B981"
                          : "1px solid var(--border-color)",
                      color:
                        copiedCourseId === selectedCourseDetail._id
                          ? "var(--badge-emerald-color, #047857)"
                          : "var(--text-secondary)",
                      padding: "2px 8px",
                      borderRadius: "5px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Copy Course ID for MCQ CSV / Excel bulk upload"
                  >
                    {copiedCourseId === selectedCourseDetail._id ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy ID
                      </>
                    )}
                  </button>
                </div>
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
                    color: "var(--badge-emerald-color, #047857)",
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
                  LEVEL 5 TARGET SUBJECT(S)
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    marginTop: "4px",
                  }}
                >
                  {selectedCourseDetail.subjects &&
                  selectedCourseDetail.subjects.length > 0 ? (
                    selectedCourseDetail.subjects.map(
                      (sbj: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            borderRadius: "6px",
                            padding: "2px 6px",
                            fontSize: "0.78rem",
                          }}
                        >
                          📚 {sbj}
                        </span>
                      ),
                    )
                  ) : (
                    <span>
                      📚 {selectedCourseDetail.subjectName || "All Subjects"}
                    </span>
                  )}
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
                    color: "var(--badge-emerald-color, #047857)",
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
                onClick={() => {
                  handleOpenEditModal(selectedCourseDetail);
                  setSelectedCourseDetail(null);
                }}
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
          portalType="TEACHER"
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
          subjects={editSubjects}
          onSubjectsChange={(sbjs) => {
            setEditSubjects(sbjs);
            setEditSubjectName(sbjs.join(", "));
          }}
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

      {/* BULK UPLOAD COURSES MODAL STUDIO FOR TEACHER */}
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
                    EXCEL & CSV INSTRUCTOR BATCH IMPORTER
                  </span>
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "800",
                      margin: "2px 0 0 0",
                    }}
                  >
                    Bulk Upload Courses Studio (Instructor)
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
                  "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.08) 100%)",
                border: "1px solid rgba(16,185,129,0.25)",
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
                      color: "var(--badge-emerald-color, #047857)",
                      fontWeight: "800",
                      fontSize: "0.95rem",
                      marginBottom: "8px",
                    }}
                  >
                    <HelpCircle size={18} />
                    <span>
                      Instructor Bulk Upload Guidelines & Specifications
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
                    Upload a CSV (`.csv`) spreadsheet containing multiple
                    courses for your instructor profile. Excel users: save as
                    CSV first.
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
                          color: "var(--badge-emerald-color, #047857)",
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
                          <strong>subjectName</strong> (Multiple: Physics|Math)
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
                    style={{
                      color: "var(--badge-emerald-color, #047857)",
                      marginBottom: "8px",
                    }}
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
                    Download pre-formatted 5-course CSV template compatible with
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
                    Download Sample CSV Template
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
                  color: "var(--badge-emerald-color, #047857)",
                  fontSize: "0.9rem",
                  fontWeight: "800",
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
                    Courses Successfully Published to your Instructor Account.
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
                      .map((er) => `Row ${er.row}: ${er.error}`)
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
                Select CSV File
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "14px",
                }}
              >
                Supports `.csv` and `.txt` files containing course records.
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUploadChange}
                style={{ display: "none" }}
                id="teacher-bulk-file-input"
              />
              <label
                htmlFor="teacher-bulk-file-input"
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
                    <span
                      style={{ color: "var(--badge-emerald-color, #047857)" }}
                    >
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
                        <th style={{ padding: "10px 12px" }}>Subjects</th>
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
                            {row.subjects && row.subjects.length > 0
                              ? row.subjects.join(", ")
                              : row.subjectName || "-"}
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
                              color: "var(--badge-emerald-color, #047857)",
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

      {/* Teacher: Enrolled Students & Royalty Earned Roster Modal */}
      {selectedTeacherCourseRoster && (
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
                  Educator Course Enrollment Roster
                </span>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: "800",
                    marginTop: "6px",
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedTeacherCourseRoster.course.title}
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
                      {selectedTeacherCourseRoster.course.boardOrGrade ||
                        "General Batch"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Subject:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {selectedTeacherCourseRoster.course.subjects &&
                      selectedTeacherCourseRoster.course.subjects.length > 0
                        ? selectedTeacherCourseRoster.course.subjects.join(", ")
                        : selectedTeacherCourseRoster.course.subjectName ||
                          "All Subjects"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Batch Price:{" "}
                    <strong
                      style={{ color: "var(--badge-emerald-color, #047857)" }}
                    >
                      ₹{selectedTeacherCourseRoster.course.price || 0}
                    </strong>
                  </span>
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setSelectedTeacherCourseRoster(null)}
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
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
                  Enrolled Students
                </div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: "#60A5FA",
                    marginTop: "4px",
                  }}
                >
                  {selectedTeacherCourseRoster.totalEnrolled} Students
                </div>
              </div>

              <div
                style={{
                  padding: "16px 18px",
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
                  Educator Royalty Earned (70%)
                </div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "800",
                    color: "#FBBF24",
                    marginTop: "4px",
                  }}
                >
                  ₹
                  {selectedTeacherCourseRoster.totalRoyaltyEarned.toLocaleString()}
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
                <Users size={18} style={{ color: "#60A5FA" }} /> Student Roster
                ({selectedTeacherCourseRoster.enrolledStudents.length})
              </h4>

              {selectedTeacherCourseRoster.enrolledStudents.length === 0 ? (
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
                        <th style={{ padding: "10px 12px" }}>Contact Info</th>
                        <th style={{ padding: "10px 12px" }}>State / Board</th>
                        <th style={{ padding: "10px 12px" }}>Purchase Date</th>
                        <th
                          style={{ padding: "10px 12px", textAlign: "right" }}
                        >
                          Your Royalty (70%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeacherCourseRoster.enrolledStudents.map(
                        (st, idx) => {
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
                                  {studentUser.userId ||
                                    studentUser._id ||
                                    "N/A"}
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
                                  <Mail size={12} />{" "}
                                  {studentUser.email || "N/A"}
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
                                  color: "#FBBF24",
                                }}
                              >
                                ₹
                                {(
                                  st.teacherRoyaltyEarned ||
                                  Math.round((st.amountPaid || 0) * 0.7)
                                ).toLocaleString()}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedTeacherCourseRoster(null)}
                style={{ padding: "8px 24px", fontSize: "0.85rem" }}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MCQ QUESTION BANK UPLOAD MODAL (CSV / EXCEL) */}
      {showBulkMcqModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBulkMcqModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "880px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              borderRadius: "16px",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileSpreadsheet size={22} color="#FBBF24" />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "800",
                      margin: 0,
                    }}
                  >
                    Bulk Upload MCQ Questions (CSV / Excel)
                  </h3>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    Upload complete question banks in seconds instead of
                    creating questions one-by-one.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBulkMcqModal(false)}
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

            {/* Step 1: Template Download & Guidelines */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)",
                border: "1px solid var(--border-color)",
                marginBottom: "18px",
              }}
            >
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
                      fontWeight: "800",
                      fontSize: "0.88rem",
                      color: "var(--text-primary)",
                      marginBottom: "2px",
                    }}
                  >
                    📥 Step 1: Download Standard Sample Template
                  </div>
                  <div
                    style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}
                  >
                    Contains pre-filled sample questions, explanations, and
                    exact column headers required.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleMcqCsvTemplate}
                  className="btn-amber"
                  style={{
                    fontSize: "0.8rem",
                    padding: "6px 14px",
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Download size={14} /> Download Sample CSV Template
                </button>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  background: "rgba(0,0,0,0.15)",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  overflowX: "auto",
                }}
              >
                <strong>Columns:</strong> quizSetTitle, questionText, optionA,
                optionB, optionC, optionD, correctOption (A/B/C/D), explanation,
                marks{" "}
                <span
                  style={{
                    color: "var(--badge-emerald-color, #047857)",
                    fontWeight: "700",
                  }}
                >
                  (courseId is optional — auto-assigned from dropdown)
                </span>
              </div>
            </div>

            {/* Step 2: Target Course & Test Set Setup */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  🎯 Target Course Batch *
                </label>
                <select
                  className="form-input"
                  value={bulkMcqCourseId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setBulkMcqCourseId(cId);
                    if (bulkMcqPastedText.trim()) {
                      const parsed = parseCSVToMcqObjects(
                        bulkMcqPastedText,
                        cId,
                        bulkMcqQuizSetTitle,
                      );
                      setParsedBulkMcqs(parsed);
                    }
                  }}
                  style={{
                    fontSize: "0.85rem",
                    padding: "8px 10px",
                    width: "100%",
                  }}
                >
                  <option value="">-- Select Course Batch --</option>
                  {coursesList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.boardOrGrade || "General"} • ₹{c.price})
                    </option>
                  ))}
                </select>

                {bulkMcqCourseId && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginTop: "6px",
                      fontSize: "0.74rem",
                      color: "var(--badge-emerald-color, #047857)",
                      fontWeight: "700",
                    }}
                  >
                    <CheckCircle2 size={13} /> Questions will be automatically
                    linked to this selected course batch
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  📝 Quiz / Test Paper Set Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={bulkMcqQuizSetTitle}
                  onChange={(e) => {
                    const newSetTitle = e.target.value;
                    setBulkMcqQuizSetTitle(newSetTitle);
                    if (bulkMcqPastedText.trim()) {
                      const parsed = parseCSVToMcqObjects(
                        bulkMcqPastedText,
                        bulkMcqCourseId,
                        newSetTitle,
                      );
                      setParsedBulkMcqs(parsed);
                    }
                  }}
                  placeholder="e.g. Chapter 1 Practice Test Set"
                  style={{
                    fontSize: "0.85rem",
                    padding: "8px 10px",
                    width: "100%",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Used if rows in CSV leave the quizSetTitle column empty.
                </div>
              </div>
            </div>

            {/* Step 3: Input Mode (File Upload vs Paste from Excel) */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <button
                  type="button"
                  onClick={() => setBulkMcqInputMode("FILE")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      bulkMcqInputMode === "FILE"
                        ? "var(--primary-gradient)"
                        : "rgba(255,255,255,0.04)",
                    color:
                      bulkMcqInputMode === "FILE"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  📁 Upload CSV / TSV File
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMcqInputMode("PASTE")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      bulkMcqInputMode === "PASTE"
                        ? "var(--primary-gradient)"
                        : "rgba(255,255,255,0.04)",
                    color:
                      bulkMcqInputMode === "PASTE"
                        ? "#FFF"
                        : "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  📋 Direct Paste from Excel / Google Sheets
                </button>
              </div>

              {bulkMcqInputMode === "FILE" ? (
                <div
                  style={{
                    padding: "24px",
                    borderRadius: "12px",
                    border: "2px dashed var(--border-color)",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    id="mcq-bulk-file-input"
                    onChange={handleFileUploadMcqChange}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="mcq-bulk-file-input"
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(99, 102, 241, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UploadCloud size={24} color="#818CF8" />
                    </div>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                      }}
                    >
                      {bulkMcqFileName
                        ? `Selected: ${bulkMcqFileName}`
                        : "Choose CSV or Text File to Upload"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Supports .csv or tab-delimited files saved from Excel
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <textarea
                    className="form-input"
                    rows={6}
                    value={bulkMcqPastedText}
                    onChange={(e) => handlePasteTextMcqChange(e.target.value)}
                    placeholder={`Paste CSV or copy cells directly from Excel / Google Sheets here...\n\nExample:\nquizSetTitle,questionText,optionA,optionB,optionC,optionD,correctOption,explanation,marks\nUnit 1 Test,What is H2O?,Water,Salt,Acid,Base,A,Chemical formula of water,1`}
                    style={{
                      width: "100%",
                      fontSize: "0.8rem",
                      fontFamily: "monospace",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    💡 Tip: Simply select your question rows in Excel or Google
                    Sheets, press Ctrl+C / Cmd+C, and paste here!
                  </div>
                </div>
              )}
            </div>

            {/* Error or Success Messages */}
            {bulkMcqError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  color: "#FB7185",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={15} />
                <span>{bulkMcqError}</span>
              </div>
            )}

            {bulkMcqSuccessMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "var(--badge-emerald-color, #047857)",
                  fontSize: "0.86rem",
                  fontWeight: "800",
                  marginBottom: "14px",
                }}
              >
                {bulkMcqSuccessMsg}
              </div>
            )}

            {/* Step 4: Live Parse Preview Table */}
            {parsedBulkMcqs.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
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
                    <span style={{ fontWeight: "800", fontSize: "0.88rem" }}>
                      📋 Parsed Preview ({parsedBulkMcqs.length} Rows)
                    </span>
                    <span
                      className="badge badge-emerald"
                      style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                    >
                      {parsedBulkMcqs.filter((q) => q.isValid).length} Valid
                    </span>
                    {parsedBulkMcqs.some((q) => !q.isValid) && (
                      <span
                        className="badge badge-rose"
                        style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                      >
                        {parsedBulkMcqs.filter((q) => !q.isValid).length}{" "}
                        Error(s)
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.76rem",
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
                        <th style={{ padding: "6px 8px", width: "35px" }}>#</th>
                        <th style={{ padding: "6px 8px" }}>Question Text</th>
                        <th style={{ padding: "6px 8px" }}>Options A–D</th>
                        <th style={{ padding: "6px 8px", width: "70px" }}>
                          Answer
                        </th>
                        <th style={{ padding: "6px 8px", width: "80px" }}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkMcqs.slice(0, 50).map((row, rIdx) => {
                        const optLabels = ["A", "B", "C", "D"];
                        const correctLetter =
                          optLabels[row.correctOptionIndex] || "A";
                        return (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                              background: row.isValid
                                ? "transparent"
                                : "rgba(244,63,94,0.05)",
                            }}
                          >
                            <td
                              style={{
                                padding: "6px 8px",
                                color: "var(--text-muted)",
                                fontWeight: "700",
                              }}
                            >
                              {rIdx + 1}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                fontWeight: "600",
                                maxWidth: "240px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.questionText || (
                                <span style={{ color: "#FB7185" }}>
                                  Missing statement
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                color: "var(--text-secondary)",
                                maxWidth: "240px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              A: {row.optionA} | B: {row.optionB} | C:{" "}
                              {row.optionC} | D: {row.optionD}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                fontWeight: "800",
                                color: "var(--badge-emerald-color, #047857)",
                              }}
                            >
                              {correctLetter}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              {row.isValid ? (
                                <span
                                  style={{
                                    color:
                                      "var(--badge-emerald-color, #047857)",
                                    fontWeight: "700",
                                  }}
                                >
                                  ✓ Ready
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#FB7185",
                                    fontWeight: "700",
                                  }}
                                  title={row.errors.join(", ")}
                                >
                                  ⚠️ Error
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowBulkMcqModal(false)}
                style={{ padding: "8px 18px", fontSize: "0.84rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-amber"
                onClick={handleExecuteBulkMcqUpload}
                disabled={
                  isSubmittingBulkMcq ||
                  parsedBulkMcqs.filter((q) => q.isValid).length === 0
                }
                style={{
                  padding: "9px 22px",
                  fontSize: "0.86rem",
                  fontWeight: "800",
                  opacity:
                    parsedBulkMcqs.filter((q) => q.isValid).length === 0
                      ? 0.45
                      : 1,
                }}
              >
                {isSubmittingBulkMcq
                  ? "Importing Questions..."
                  : `🚀 Import & Publish (${parsedBulkMcqs.filter((q) => q.isValid).length}) Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
