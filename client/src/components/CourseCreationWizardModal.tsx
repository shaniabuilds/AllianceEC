import React, { useState } from "react";
import {
  BookOpen,
  Video,
  Radio,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Award,
  Layers,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  INDIAN_STATES_LIST,
  CORE_MODULES_LIST,
  getSubCategoriesForModuleAndState,
  getSubjectsForStateAndModule,
} from "../services/taxonomyTree";
import {
  CourseInclusions,
  CourseCurriculumItem,
  CourseStudyMaterialItem,
  CourseMockTestItem,
  CourseMockTestQuestion,
  uploadStudyMaterialDocument,
  CourseRichContentItem,
} from "../services/adminService";

import DOMPurify from "dompurify";
import { RichContentEditor } from "./RichContentEditor";

export interface CourseCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  portalType?: "ADMIN" | "TEACHER";
  inline?: boolean; // if true, renders inline without modal overlay

  // Form Data & Setters
  title: string;
  onTitleChange: (v: string) => void;
  price: string | number;
  onPriceChange: (v: string) => void;
  originalPrice: string | number;
  onOriginalPriceChange: (v: string) => void;

  stateCode: string;
  onStateCodeChange: (v: string) => void;
  categoryCode: string;
  onCategoryCodeChange: (v: string) => void;
  subCategory: string;
  onSubCategoryChange: (v: string) => void;
  boardGrade: string;
  onBoardGradeChange: (v: string) => void;
  stream: string;
  onStreamChange: (v: string) => void;
  subjectName: string;
  onSubjectNameChange: (v: string) => void;
  subjects?: string[];
  onSubjectsChange?: (v: string[]) => void;

  courseMode: "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID";
  onCourseModeChange: (v: "LIVE_ONLINE" | "RECORDED_VIDEO" | "HYBRID") => void;

  syllabusTopics: string[];
  onSyllabusTopicsChange: (v: string[]) => void;

  lectureVideoUrl: string;
  onLectureVideoUrlChange: (v: string) => void;
  demoVideoUrl: string;
  onDemoVideoUrlChange: (v: string) => void;

  liveMeetingUrl: string;
  onLiveMeetingUrlChange: (v: string) => void;
  liveSchedule: string;
  onLiveScheduleChange: (v: string) => void;

  ebookTitle: string;
  onEbookTitleChange: (v: string) => void;
  ebookPdfUrl: string;
  onEbookPdfUrlChange: (v: string) => void;

  studyMaterials?: CourseStudyMaterialItem[];
  onStudyMaterialsChange?: (v: CourseStudyMaterialItem[]) => void;

  mockTests?: CourseMockTestItem[];
  onMockTestsChange?: (v: CourseMockTestItem[]) => void;

  richContents?: CourseRichContentItem[];
  onRichContentsChange?: (v: CourseRichContentItem[]) => void;

  inclusions: CourseInclusions;
  onInclusionsChange: (v: CourseInclusions) => void;

  curriculum: CourseCurriculumItem[];
  onCurriculumChange: (v: CourseCurriculumItem[]) => void;

  description: string;
  onDescriptionChange: (v: string) => void;

  thumbnailFile?: File | null;
  thumbnailPreview?: string;
  thumbnailUrl?: string;
  onThumbnailFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

interface BulkMcqRow {
  quizSetTitle: string;
  topic: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
  isValid: boolean;
  errors: string[];
}

const splitDelimitedLine = (textLine: string, isTab: boolean): string[] => {
  if (isTab) {
    return textLine
      .split("\t")
      .map((col) => col.trim().replace(/^["']|["']$/g, ""));
  }
  const result: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < textLine.length; i++) {
    const c = textLine[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      let val = textLine.substring(start, i).trim();
      if (val.startsWith('"') && val.endsWith('"'))
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      result.push(val);
      start = i + 1;
    }
  }
  let last = textLine.substring(start).trim();
  if (last.startsWith('"') && last.endsWith('"'))
    last = last.substring(1, last.length - 1).replace(/""/g, '"');
  result.push(last);
  return result;
};

// Same CSV/TSV logic as Live MCQ Builder, adapted for wizard (no courseId needed)
const parseBulkMcqText = (
  rawText: string,
  defaultTopic: string,
  defaultSetTitle: string,
): BulkMcqRow[] => {
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const isTab = lines[0].includes("\t");
  const headers = splitDelimitedLine(lines[0], isTab).map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, ""),
  );
  const rows: BulkMcqRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitDelimitedLine(lines[i], isTab);
    if (values.length === 0 || values.every((v) => !v)) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx].trim() : "";
    });

    const quizSetTitle =
      rowObj["quizsettitle"] ||
      rowObj["quizset"] ||
      rowObj["testset"] ||
      rowObj["testtitle"] ||
      defaultSetTitle ||
      "Imported MCQ Test";
    const topic =
      rowObj["topic"] || rowObj["chapter"] || defaultTopic || "All Topics";
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

    const rawAns = (
      rowObj["correctoption"] ||
      rowObj["correctoptionindex"] ||
      rowObj["answer"] ||
      rowObj["correct"] ||
      ""
    ).toUpperCase();
    const ansMap: Record<string, number> = {
      A: 0,
      "OPTION A": 0,
      "0": 0,
      B: 1,
      "OPTION B": 1,
      "1": 1,
      C: 2,
      "OPTION C": 2,
      "2": 2,
      D: 3,
      "OPTION D": 3,
      "3": 3,
      "4": 3,
    };
    const correctOption = ansMap[rawAns] ?? 0;

    const errors: string[] = [];
    if (!questionText) errors.push("Question statement is missing.");
    if (!optionA) errors.push("Option A is missing.");
    if (!optionB) errors.push("Option B is missing.");
    if (!optionC) errors.push("Option C is missing.");
    if (!optionD) errors.push("Option D is missing.");
    if (!rawAns) errors.push("Correct answer is missing (use A, B, C or D).");
    else if (ansMap[rawAns] === undefined)
      errors.push(`Unrecognized answer "${rawAns}". Use A, B, C, or D.`);

    rows.push({
      quizSetTitle,
      topic,
      questionText,
      options: [optionA, optionB, optionC, optionD],
      correctOption,
      explanation,
      isValid: errors.length === 0,
      errors,
    });
  }
  return rows;
};

const downloadBulkMcqTemplate = () => {
  const header =
    "quizSetTitle,topic,questionText,optionA,optionB,optionC,optionD,correctOption,explanation\n";
  const rows = [
    '"Chemical Reactions Quiz","Chemical Reactions","What is the chemical formula of Rust?","Fe2O3.xH2O","Fe3O4","FeO","Fe(OH)2","A","Rust is hydrated iron(III) oxide."',
    '"Chemical Reactions Quiz","Chemical Reactions","Which gas is liberated when Zinc reacts with dilute HCl?","Oxygen","Hydrogen","Chlorine","Nitrogen","B","Zn + 2HCl -> ZnCl2 + H2."',
    '"Acids Bases Quiz","Acids, Bases and Salts","What is the pH of pure water at 25°C?","5","6","7","8","C","Pure water is neutral."',
    '"Acids Bases Quiz","Acids, Bases and Salts","Which of these is a strong acid?","Acetic acid","Hydrochloric acid","Citric acid","Carbonic acid","B","HCl dissociates completely in water."',
  ];
  const blob = new Blob([header + rows.join("\n") + "\n"], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "topic_wise_mcq_bulk_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const STEPS = [
  { id: 1, title: "Basics & Board", subtitle: "Title & Academic Level" },
  { id: 2, title: "Format & Topics", subtitle: "Live / Video & Syllabus" },
  { id: 3, title: "Materials & Perks", subtitle: "Notes, Tests & Perks" },
  { id: 4, title: "Pricing & Review", subtitle: "Price, Banner & Publish" },
];

export const CourseCreationWizardModal: React.FC<
  CourseCreationWizardModalProps
> = ({
  isOpen,
  onClose,
  isEditMode = false,
  portalType = "ADMIN",
  inline = false,

  title,
  onTitleChange,
  price,
  onPriceChange,
  originalPrice,
  onOriginalPriceChange,

  stateCode,
  onStateCodeChange,
  categoryCode,
  onCategoryCodeChange,
  subCategory,
  onSubCategoryChange,
  boardGrade,
  onBoardGradeChange,
  stream,
  onStreamChange,
  subjectName,
  onSubjectNameChange,
  subjects,
  onSubjectsChange,

  courseMode,
  onCourseModeChange,

  syllabusTopics,
  onSyllabusTopicsChange,

  lectureVideoUrl,
  onLectureVideoUrlChange,
  demoVideoUrl,
  onDemoVideoUrlChange,

  liveMeetingUrl,
  onLiveMeetingUrlChange,
  liveSchedule,
  onLiveScheduleChange,

  ebookTitle,
  onEbookTitleChange,
  ebookPdfUrl,
  onEbookPdfUrlChange,

  studyMaterials = [],
  onStudyMaterialsChange,

  mockTests = [],
  onMockTestsChange,

  richContents = [],
  onRichContentsChange,

  inclusions,
  onInclusionsChange,

  curriculum,
  onCurriculumChange,

  description,
  onDescriptionChange,

  thumbnailFile,
  thumbnailPreview,
  thumbnailUrl,
  onThumbnailFileChange,

  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [thumbnailFit, setThumbnailFit] = useState<"contain" | "cover">(
    "contain",
  );
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [newCurriculumTitle, setNewCurriculumTitle] = useState("");
  const [newCurriculumLectures, setNewCurriculumLectures] = useState("5");
  const [showCurriculumBuilder, setShowCurriculumBuilder] = useState(
    curriculum.length > 0,
  );

  // Step 3 Sub-Navigation Tabs: 'DOCS' | 'TESTS' | 'PERKS'
  const [step3ActiveTab, setStep3ActiveTab] = useState<
    "DOCS" | "TESTS" | "PERKS"
  >("DOCS");

  // Study Materials State (Multi-Document & Direct Cloudinary Upload)
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<
    "PDF" | "DOC" | "NOTES" | "EBOOK"
  >("PDF");
  const [newDocTopic, setNewDocTopic] = useState("");
  const [newDocCustomTopic, setNewDocCustomTopic] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [docSourceMode, setDocSourceMode] = useState<"UPLOAD" | "URL">(
    "UPLOAD",
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadedDocMeta, setUploadedDocMeta] = useState<{
    originalName: string;
    sizeFormatted: string;
    format: string;
    fileUrl: string;
  } | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Topic-Wise MCQ Tests State
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestTopic, setNewTestTopic] = useState("");
  const [newTestCustomTopic, setNewTestCustomTopic] = useState("");
  const [newTestDuration, setNewTestDuration] = useState("30");
  const [newTestTotalQuestions, setNewTestTotalQuestions] = useState("10");
  const [newTestUrl, setNewTestUrl] = useState("");
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<
    CourseMockTestQuestion[]
  >([]);

  // MCQ Question inputs
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState("");

  // Expanded test index for viewing test questions
  const [expandedTestIdx, setExpandedTestIdx] = useState<number | null>(null);

  // Bulk MCQ Upload (Topic-Wise Tests)
  const [showBulkMcqPanel, setShowBulkMcqPanel] = useState(false);
  const [bulkMcqMode, setBulkMcqMode] = useState<"FILE" | "PASTE" | "RICH">(
    "FILE",
  );
  const [bulkMcqFileName, setBulkMcqFileName] = useState("");
  const [bulkMcqRaw, setBulkMcqRaw] = useState("");
  const [bulkMcqError, setBulkMcqError] = useState("");
  const [bulkMcqSuccess, setBulkMcqSuccess] = useState("");
  const [bulkTopic, setBulkTopic] = useState("All Topics");
  const [bulkCustomTopic, setBulkCustomTopic] = useState("");
  const [bulkSetTitle, setBulkSetTitle] = useState("Imported MCQ Test");
  const [bulkDuration, setBulkDuration] = useState("30");
  const [bulkMcqImageFile, setBulkMcqImageFile] = useState<File | null>(null);
  const [bulkMcqImagePreview, setBulkMcqImagePreview] = useState("");
  const [richTitle, setRichTitle] = useState("");
  const [richHtml, setRichHtml] = useState("");
  const [richEditorKey, setRichEditorKey] = useState(0);

  // Active subjects: derived from props.subjects or by splitting props.subjectName
  const activeSubjects: string[] =
    subjects !== undefined
      ? subjects
      : subjectName
        ? subjectName
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  const handleToggleSubject = (subjectToToggle: string) => {
    const trimmed = subjectToToggle.trim();
    if (!trimmed) return;
    let updated: string[];
    if (activeSubjects.includes(trimmed)) {
      // Deselect
      updated = activeSubjects.filter((s) => s !== trimmed);
    } else {
      // Select
      updated = [...activeSubjects, trimmed];
    }
    if (onSubjectsChange) {
      onSubjectsChange(updated);
    }
    onSubjectNameChange(updated.join(", "));
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    const updated = activeSubjects.filter((s) => s !== subjectToRemove.trim());
    if (onSubjectsChange) {
      onSubjectsChange(updated);
    }
    onSubjectNameChange(updated.join(", "));
  };

  const handleSelectAllSubjects = () => {
    const allForState = getSubjectsForStateAndModule(stateCode);
    if (onSubjectsChange) {
      onSubjectsChange(allForState);
    }
    onSubjectNameChange(allForState.join(", "));
  };

  const handleClearAllSubjects = () => {
    if (onSubjectsChange) {
      onSubjectsChange([]);
    }
    onSubjectNameChange("");
  };

  if (!isOpen && !inline) return null;

  // Handle topic addition
  const handleAddTopic = () => {
    const raw = customTopicInput.trim();
    if (!raw) return;

    // Support comma-separated batch topic entry (e.g. "Algebra, Geometry, Trigonometry")
    const parts = raw
      .split(/[,;\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const updated = [...syllabusTopics];

    parts.forEach((part) => {
      if (!updated.includes(part)) {
        updated.push(part);
      }
    });

    onSyllabusTopicsChange(updated);
    setCustomTopicInput("");
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onSyllabusTopicsChange(syllabusTopics.filter((t) => t !== topicToRemove));
  };

  const handleClearAllTopics = () => {
    onSyllabusTopicsChange([]);
  };

  const handleInclusionUpdate = (field: keyof CourseInclusions, value: any) => {
    onInclusionsChange({
      ...inclusions,
      [field]: value,
    });
  };

  // Direct Cloudinary Document Upload Handler
  const handleDocFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert(
        "File size exceeds 25MB limit. Please upload a document up to 25MB.",
      );
      e.target.value = "";
      return;
    }

    setDocUploadError(null);
    setIsUploadingDoc(true);

    // Auto-detect format type based on extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["doc", "docx"].includes(ext)) {
      setNewDocType("DOC");
    } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      setNewDocType("NOTES");
    } else if (["epub", "mobi"].includes(ext)) {
      setNewDocType("EBOOK");
    } else {
      setNewDocType("PDF");
    }

    // Auto-populate document title if not set
    if (!newDocTitle.trim()) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      setNewDocTitle(cleanTitle);
    }

    try {
      const res = await uploadStudyMaterialDocument(file, portalType);
      setNewDocUrl(res.fileUrl);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadedDocMeta({
        originalName: res.originalName || file.name,
        sizeFormatted: `${sizeMb} MB`,
        format: (res.format || ext).toUpperCase(),
        fileUrl: res.fileUrl,
      });
    } catch (err: any) {
      console.error("[Document Upload Error]:", err);
      setDocUploadError(
        err.message || "Failed to upload document to Cloudinary CDN.",
      );
    } finally {
      setIsUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Study Materials Handlers
  const handleAddStudyMaterial = () => {
    if (isUploadingDoc) {
      alert(
        "Please wait for the document to finish uploading to Cloudinary CDN.",
      );
      return;
    }

    if (!newDocTitle.trim()) {
      alert("Please enter a title for the document / notes.");
      return;
    }
    if (!newDocUrl.trim()) {
      alert(
        docSourceMode === "UPLOAD"
          ? "Please select and upload a document file (PDF, Word, or Notes) first."
          : "Please enter a valid document download link (e.g. Google Drive, Dropbox, or AWS S3).",
      );
      return;
    }

    const finalTopic =
      newDocTopic === "__CUSTOM__"
        ? newDocCustomTopic.trim() || "General"
        : newDocTopic.trim() ||
          (syllabusTopics.length > 0 ? syllabusTopics[0] : "General");

    const item: CourseStudyMaterialItem = {
      title: newDocTitle.trim(),
      docType: newDocType,
      topic: finalTopic,
      fileUrl: newDocUrl.trim(),
    };

    const updated = [...studyMaterials, item];
    if (onStudyMaterialsChange) {
      onStudyMaterialsChange(updated);
    }
    handleInclusionUpdate("totalEbooks", updated.length);

    if (!ebookTitle) onEbookTitleChange(item.title);
    if (!ebookPdfUrl) onEbookPdfUrlChange(item.fileUrl);

    setNewDocTitle("");
    setNewDocUrl("");
    setNewDocCustomTopic("");
    setUploadedDocMeta(null);
    setDocUploadError(null);
  };

  const handleRemoveStudyMaterial = (idx: number) => {
    const updated = studyMaterials.filter((_, i) => i !== idx);
    if (onStudyMaterialsChange) {
      onStudyMaterialsChange(updated);
    }
    handleInclusionUpdate("totalEbooks", updated.length);

    if (updated.length > 0) {
      onEbookTitleChange(updated[0].title);
      onEbookPdfUrlChange(updated[0].fileUrl);
    } else {
      onEbookTitleChange("");
      onEbookPdfUrlChange("");
    }
  };

  // Mock Tests & MCQ Handlers
  const handleAddQuestionToDraft = () => {
    if (!qText.trim()) {
      alert("Please enter the question text.");
      return;
    }
    if (!qOptA.trim() || !qOptB.trim()) {
      alert("Please provide at least Option A and Option B.");
      return;
    }

    const options = [
      qOptA.trim(),
      qOptB.trim(),
      qOptC.trim() || "None of the above",
      qOptD.trim() || "All of the above",
    ];

    const newQuestion: CourseMockTestQuestion = {
      questionText: qText.trim(),
      options,
      correctOption: qCorrect,
      explanation: qExplanation.trim(),
    };

    setDraftQuestions((prev) => [...prev, newQuestion]);
    setQText("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrect(0);
    setQExplanation("");
  };

  const handleRemoveQuestionFromDraft = (qIdx: number) => {
    setDraftQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const handleSaveMockTest = () => {
    if (!newTestTitle.trim()) {
      alert("Please enter a mock test or quiz title.");
      return;
    }

    const finalTopic =
      newTestTopic === "__CUSTOM__"
        ? newTestCustomTopic.trim() || "All Topics"
        : newTestTopic.trim() ||
          (syllabusTopics.length > 0 ? syllabusTopics[0] : "All Topics");

    const duration = Number(newTestDuration) || 30;
    const totalQ =
      draftQuestions.length > 0
        ? draftQuestions.length
        : Number(newTestTotalQuestions) || 10;

    const testItem: CourseMockTestItem = {
      title: newTestTitle.trim(),
      topic: finalTopic,
      durationMinutes: duration,
      totalQuestions: totalQ,
      testUrl: newTestUrl.trim(),
      questions: draftQuestions.length > 0 ? [...draftQuestions] : [],
    };

    const updated = [...mockTests, testItem];
    if (onMockTestsChange) {
      onMockTestsChange(updated);
    }
    handleInclusionUpdate("totalMockTests", updated.length);

    setNewTestTitle("");
    setNewTestUrl("");
    setNewTestCustomTopic("");
    setDraftQuestions([]);
    setShowQuestionBuilder(false);
  };

  const handleRemoveMockTest = (idx: number) => {
    const updated = mockTests.filter((_, i) => i !== idx);
    if (onMockTestsChange) {
      onMockTestsChange(updated);
    }
    handleInclusionUpdate("totalMockTests", updated.length);
  };

  // ---- Bulk MCQ (Topic-Wise Tests) ----
  const bulkResolvedTopic =
    bulkTopic === "__CUSTOM__"
      ? bulkCustomTopic.trim() || "All Topics"
      : bulkTopic || "All Topics";
  const handleSaveRichContent = () => {
    if (!richTitle.trim()) {
      setBulkMcqError("Enter the content title.");
      return;
    }
    const clean = DOMPurify.sanitize(richHtml);
    const textOnly = clean.replace(/<[^>]*>/g, "").trim();
    if (!textOnly && !clean.includes("<img") && !clean.includes("<table")) {
      setBulkMcqError("Pehle editor me content paste karein.");
      return;
    }
    if (clean.length > 3 * 1024 * 1024) {
      setBulkMcqError(
        "Content bahut bada hai (3MB+). Bade images alag se upload karke daalein.",
      );
      return;
    }
    onRichContentsChange?.([
      ...richContents,
      { title: richTitle.trim(), topic: bulkResolvedTopic, html: clean },
    ]);
    setRichTitle("");
    setRichHtml("");
    setRichEditorKey((k) => k + 1);
    setBulkMcqError("");
    setBulkMcqSuccess("✅ Content added to the course successfully!");
    setTimeout(() => setBulkMcqSuccess(""), 4000);
  };

  const handleRemoveRichContent = (idx: number) => {
    onRichContentsChange?.(richContents.filter((_, i) => i !== idx));
  };

  const uploadRichImage = async (file: File) => {
    const res = await uploadStudyMaterialDocument(file, portalType);
    return res.fileUrl;
  };
  const parsedBulkMcqs = bulkMcqRaw.trim()
    ? parseBulkMcqText(bulkMcqRaw, bulkResolvedTopic, bulkSetTitle.trim())
    : [];
  const validBulkMcqs = parsedBulkMcqs.filter((r) => r.isValid);
  const bulkGroupCount = new Set(
    validBulkMcqs.map((r) => `${r.quizSetTitle}||${r.topic}`),
  ).size;

  const handleBulkMcqFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkMcqFileName(file.name);
    setBulkMcqError("");
    setBulkMcqSuccess("");

    const isImage =
      file.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

    // Purana image preview clean karo
    if (bulkMcqImagePreview) URL.revokeObjectURL(bulkMcqImagePreview);

    if (isImage) {
      if (file.size > 5 * 1024 * 1024) {
        setBulkMcqError(
          "Image size 5MB se zyada hai. Chhoti image select karein.",
        );
        e.target.value = "";
        return;
      }
      setBulkMcqRaw(""); // image ko text ki tarah parse mat karo
      setBulkMcqImageFile(file);
      setBulkMcqImagePreview(URL.createObjectURL(file));
      e.target.value = "";
      return;
    }

    // CSV / TSV / TXT
    setBulkMcqImageFile(null);
    setBulkMcqImagePreview("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      setBulkMcqRaw(text);
      if (
        !text.trim() ||
        text.split(/\r?\n/).filter((l) => l.trim()).length <= 1
      ) {
        setBulkMcqError("No data rows found in file. Please check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resetBulkMcqPanel = () => {
    setBulkMcqRaw("");
    setBulkMcqFileName("");
    setBulkMcqError("");
    if (bulkMcqImagePreview) URL.revokeObjectURL(bulkMcqImagePreview);
    setBulkMcqImageFile(null);
    setBulkMcqImagePreview("");
  };

  const handleImportBulkAsTests = () => {
    if (validBulkMcqs.length === 0) {
      setBulkMcqError(
        "No valid questions to import. Please fix the row errors.",
      );
      return;
    }
    const groups = new Map<
      string,
      { title: string; topic: string; questions: CourseMockTestQuestion[] }
    >();
    validBulkMcqs.forEach((r) => {
      const key = `${r.quizSetTitle}||${r.topic}`;
      if (!groups.has(key))
        groups.set(key, {
          title: r.quizSetTitle,
          topic: r.topic,
          questions: [],
        });
      groups.get(key)!.questions.push({
        questionText: r.questionText,
        options: r.options,
        correctOption: r.correctOption,
        explanation: r.explanation,
      });
    });

    const duration = Number(bulkDuration) || 30;
    const newTests: CourseMockTestItem[] = Array.from(groups.values()).map(
      (g) => ({
        title: g.title,
        topic: g.topic,
        durationMinutes: duration,
        totalQuestions: g.questions.length,
        testUrl: "",
        questions: g.questions,
      }),
    );

    const updated = [...mockTests, ...newTests];
    if (onMockTestsChange) onMockTestsChange(updated);
    handleInclusionUpdate("totalMockTests", updated.length);

    setBulkMcqSuccess(
      `🎉 Imported ${validBulkMcqs.length} questions into ${newTests.length} mock test(s)!`,
    );
    resetBulkMcqPanel();
    setTimeout(() => setBulkMcqSuccess(""), 4000);
  };

  const handleAddBulkToDraft = () => {
    if (validBulkMcqs.length === 0) {
      setBulkMcqError("No valid questions to add. Please fix the row errors.");
      return;
    }
    const qs: CourseMockTestQuestion[] = validBulkMcqs.map((r) => ({
      questionText: r.questionText,
      options: r.options,
      correctOption: r.correctOption,
      explanation: r.explanation,
    }));
    setDraftQuestions((prev) => [...prev, ...qs]);
    setBulkMcqSuccess(
      `✅ Added ${qs.length} questions to the current test draft. Now set the title and click "Save Mock Test / Quiz to Course".`,
    );
    resetBulkMcqPanel();
    setTimeout(() => setBulkMcqSuccess(""), 5000);
  };

  const handleAddCurriculumModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurriculumTitle.trim()) return;
    const item: CourseCurriculumItem = {
      title: newCurriculumTitle.trim(),
      description: "",
      lectureCount: Number(newCurriculumLectures) || 1,
    };
    onCurriculumChange([...curriculum, item]);
    setNewCurriculumTitle("");
    setNewCurriculumLectures("5");
  };

  const handleRemoveCurriculumModule = (index: number) => {
    onCurriculumChange(curriculum.filter((_, idx) => idx !== index));
  };

  // Step Validation before progressing
  const validateStep = (stepNumber: number): boolean => {
    setStepError("");
    if (stepNumber === 1) {
      if (!title.trim() || title.trim().length < 4) {
        setStepError("Please enter a course title (minimum 4 characters).");
        return false;
      }
      if (!subCategory) {
        setStepError("Please select a target board or course.");
        return false;
      }
      if (activeSubjects.length === 0) {
        setStepError("Please select at least one Target Subject Focus.");
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (courseMode === "LIVE_ONLINE" && !liveSchedule.trim()) {
        // Warning or suggestion, not strictly blocking unless needed
      }
      return true;
    }

    if (stepNumber === 3) {
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setStepError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Dynamic Discount Calculation
  const offerPriceNum = Number(price) || 0;
  const mrpPriceNum = Number(originalPrice) || 0;
  const discountPercent =
    mrpPriceNum > offerPriceNum && mrpPriceNum > 0
      ? Math.round(((mrpPriceNum - offerPriceNum) / mrpPriceNum) * 100)
      : 0;

  // Selected State and Category Titles
  const selectedStateName =
    INDIAN_STATES_LIST.find((s) => s.code === stateCode)?.name || stateCode;
  const selectedCategoryTitle =
    CORE_MODULES_LIST.find((m) => m.code === categoryCode)?.title ||
    categoryCode;
  const validSubCategories = getSubCategoriesForModuleAndState(
    categoryCode,
    stateCode,
  );
  const selectedSubCategoryItem = validSubCategories.find(
    (s) => s.code === subCategory,
  );
  const selectedBoardTitle = selectedSubCategoryItem?.title || subCategory;

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: inline ? "none" : "780px",
        background: "var(--bg-modal, #FFFFFF)",
        borderRadius: inline ? "16px" : "20px",
        overflow: "hidden",
        boxShadow: inline ? "none" : "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* 1. PINNED HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background:
                portalType === "ADMIN"
                  ? "rgba(225, 29, 72, 0.12)"
                  : "rgba(16, 185, 129, 0.12)",
              border:
                portalType === "ADMIN"
                  ? "1px solid rgba(225, 29, 72, 0.3)"
                  : "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: portalType === "ADMIN" ? "#E11D48" : "#10B981",
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className={
                  portalType === "ADMIN"
                    ? "badge badge-rose"
                    : "badge badge-emerald"
                }
                style={{
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                }}
              >
                {portalType === "ADMIN"
                  ? "SUPER ADMIN STUDIO"
                  : "INSTRUCTOR STUDIO"}
              </span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {isEditMode ? "Editing Course Batch" : "Guided Course Wizard"}
              </span>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                margin: "2px 0 0 0",
                color: "var(--text-primary)",
              }}
            >
              {isEditMode
                ? `Edit Course Batch: ${title || "Untitled"}`
                : "Publish New Course Batch"}
            </h3>
          </div>
        </div>

        {!inline && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. PINNED STEPPER NAVIGATION BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-surface)",
          padding: "6px 14px",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {STEPS.map((s) => {
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id < currentStep || validateStep(currentStep)) {
                  setCurrentStep(s.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "10px",
                border: isActive
                  ? "1.5px solid var(--primary-accent)"
                  : isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid transparent",
                background: isActive
                  ? "rgba(99, 102, 241, 0.12)"
                  : isCompleted
                    ? "rgba(16, 185, 129, 0.06)"
                    : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.78rem",
                  fontWeight: "800",
                  flexShrink: 0,
                  background: isActive
                    ? "var(--primary-accent)"
                    : isCompleted
                      ? "#10B981"
                      : "var(--border-color)",
                  color:
                    isActive || isCompleted ? "#FFFFFF" : "var(--text-muted)",
                }}
              >
                {isCompleted ? <Check size={14} /> : s.id}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: isActive ? "800" : "600",
                    color: isActive
                      ? "var(--primary-accent)"
                      : isCompleted
                        ? "#10B981"
                        : "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {s.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ERROR ALERTS */}
      {(stepError || errorMessage) && (
        <div
          style={{
            margin: "12px 24px 0 24px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.35)",
            color: "#FB7185",
            fontSize: "0.82rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <AlertCircle size={16} />
          <span>{stepError || errorMessage}</span>
        </div>
      )}

      {/* 3. STEP CONTENT VIEWPORT (SCROLLABLE & PROTECTED) */}
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* ============================================================== */}
          {/* STEP 1: BASICS & ACADEMIC CLASSIFICATION                       */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
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
                  Course Batch Title *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="e.g. CBSE Class 10th Physics Master Series (2025-26)"
                  style={{
                    padding: "10px 14px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                  }}
                  autoFocus
                />
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Use a clear, descriptive title that includes class, board, and
                  subject.
                </div>
              </div>

              {/* Breadcrumb Path Banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  fontSize: "0.78rem",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                }}
              >
                <span
                  className="badge badge-primary"
                  style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                >
                  🎯 TARGET AUDIENCE
                </span>
                <span>{selectedStateName}</span>
                <ChevronRight
                  size={13}
                  style={{ color: "var(--text-muted)" }}
                />
                <span>{selectedCategoryTitle}</span>
                <ChevronRight
                  size={13}
                  style={{ color: "var(--text-muted)" }}
                />
                <span style={{ color: "#818CF8" }}>{selectedBoardTitle}</span>
                <ChevronRight
                  size={13}
                  style={{ color: "var(--text-muted)" }}
                />
                <span style={{ color: "#FBBF24" }}>
                  {activeSubjects.length > 0
                    ? activeSubjects.length === 1
                      ? activeSubjects[0]
                      : `${activeSubjects.length} Subjects (${activeSubjects.join(", ")})`
                    : subjectName || "All Subjects"}
                </span>
              </div>

              {/* 2x2 Academic Hierarchy Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Target State (Level 1) *
                  </label>
                  <select
                    className="form-input"
                    value={stateCode}
                    onChange={(e) => {
                      const stCode = e.target.value;
                      onStateCodeChange(stCode);
                      const validSubs = getSubCategoriesForModuleAndState(
                        categoryCode,
                        stCode,
                      );
                      if (validSubs.length > 0) {
                        onSubCategoryChange(validSubs[0].code);
                        onBoardGradeChange(validSubs[0].title);
                      }
                      const validSbjs = getSubjectsForStateAndModule(stCode);
                      if (validSbjs.length > 0) {
                        if (onSubjectsChange) {
                          onSubjectsChange([validSbjs[0]]);
                        }
                        onSubjectNameChange(validSbjs[0]);
                      }
                    }}
                    style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                  >
                    {INDIAN_STATES_LIST.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Main Core Category (Level 2) *
                  </label>
                  <select
                    className="form-input"
                    value={categoryCode}
                    onChange={(e) => {
                      const modCode = e.target.value;
                      onCategoryCodeChange(modCode);
                      const validSubs = getSubCategoriesForModuleAndState(
                        modCode,
                        stateCode,
                      );
                      if (validSubs.length > 0) {
                        onSubCategoryChange(validSubs[0].code);
                        onBoardGradeChange(validSubs[0].title);
                      } else {
                        onSubCategoryChange("");
                        onBoardGradeChange("");
                      }
                      onStreamChange("");
                    }}
                    style={{
                      padding: "9px 12px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                    }}
                  >
                    {CORE_MODULES_LIST.map((mod) => (
                      <option key={mod.code} value={mod.code}>
                        {mod.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Course / Board Target (Level 3) *
                  </label>
                  <select
                    className="form-input"
                    value={subCategory}
                    onChange={(e) => {
                      const subCode = e.target.value;
                      onSubCategoryChange(subCode);
                      const validSubs = getSubCategoriesForModuleAndState(
                        categoryCode,
                        stateCode,
                      );
                      const targetSub = validSubs.find(
                        (s) => s.code === subCode,
                      );
                      if (targetSub) {
                        onBoardGradeChange(targetSub.title);
                      }
                      onStreamChange("");
                    }}
                    style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                  >
                    {validSubCategories.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "var(--text-secondary)",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Grade / Display Batch Subtitle
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={boardGrade}
                    onChange={(e) => onBoardGradeChange(e.target.value)}
                    placeholder="e.g. CBSE Class 10th / IIT JEE 2026"
                    style={{ padding: "9px 12px", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Stream Selector (conditionally rendered) */}
              {selectedSubCategoryItem?.hasStreams && (
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.05)",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      color: "#818CF8",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Senior Secondary Stream (+1 & +2) *
                  </label>
                  <select
                    className="form-input"
                    value={stream}
                    onChange={(e) => onStreamChange(e.target.value)}
                    style={{
                      padding: "9px 12px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                    }}
                  >
                    <option value="">-- Select Stream --</option>
                    <option value="Arts Stream (Subjects 1–6)">
                      Arts Stream (Subjects 1–6)
                    </option>
                    <option value="Commerce Stream (Subjects 1–6)">
                      Commerce Stream (Subjects 1–6)
                    </option>
                    <option value="Science Stream (Subjects 1–6)">
                      Science Stream (Subjects 1–6)
                    </option>
                  </select>
                </div>
              )}

              {/* Target Subject Focus (Multiple Subject Selection Supported) */}
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.04)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
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
                    <label
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "800",
                        color: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        margin: 0,
                      }}
                    >
                      <BookOpen size={15} /> Target Subject Focus (Level 5) *
                    </label>
                    <span
                      className="badge badge-amber"
                      style={{
                        fontSize: "0.68rem",
                        padding: "1px 8px",
                        fontWeight: "800",
                      }}
                    >
                      {activeSubjects.length}{" "}
                      {activeSubjects.length === 1
                        ? "Subject Selected"
                        : "Subjects Selected"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleSelectAllSubjects}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#F59E0B",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                      title="Select all subjects for this state/level"
                    >
                      Select All
                    </button>
                    {activeSubjects.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSubjects}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: "0.74rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                        title="Clear all selected subjects"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown to pick or toggle subjects */}
                <select
                  className="form-input"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      handleToggleSubject(val);
                    }
                  }}
                  style={{
                    padding: "9px 12px",
                    fontSize: "0.86rem",
                    fontWeight: "700",
                    color: "#F59E0B",
                    marginBottom: "10px",
                  }}
                >
                  <option value="">
                    + Choose a subject from dropdown to add / remove...
                  </option>
                  {getSubjectsForStateAndModule(stateCode).map((sbj) => {
                    const isSelected = activeSubjects.includes(sbj);
                    return (
                      <option key={sbj} value={sbj}>
                        {isSelected
                          ? `✓ ${sbj} (Selected — click to deselect)`
                          : `+ ${sbj}`}
                      </option>
                    );
                  })}
                </select>

                {/* Clearly Display All Selected Subjects as Badges/Tags with Deselect (X) */}
                {activeSubjects.length > 0 ? (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        color: "#FBBF24",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Selected Subject Focus ({activeSubjects.length}):
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        maxHeight: "110px",
                        overflowY: "auto",
                      }}
                    >
                      {activeSubjects.map((sbj) => (
                        <span
                          key={sbj}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "0.76rem",
                            fontWeight: "700",
                            background: "rgba(245, 158, 11, 0.22)",
                            border: "1px solid rgba(245, 158, 11, 0.55)",
                            color: "#F59E0B",
                          }}
                        >
                          <span>📚 {sbj}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sbj)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#F59E0B",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                            title={`Deselect ${sbj}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#EF4444",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      marginBottom: "10px",
                    }}
                  >
                    ⚠️ No subject selected. Please select at least one subject
                    focus for this batch.
                  </div>
                )}

                {/* Quick Toggle Subject Pills */}
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                    }}
                  >
                    Click pills to quickly select or deselect subjects:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      maxHeight: "120px",
                      overflowY: "auto",
                      padding: "2px",
                    }}
                  >
                    {getSubjectsForStateAndModule(stateCode).map((sbj) => {
                      const isSelected = activeSubjects.includes(sbj);
                      return (
                        <button
                          key={sbj}
                          type="button"
                          onClick={() => handleToggleSubject(sbj)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.73rem",
                            fontWeight: isSelected ? "700" : "500",
                            cursor: "pointer",
                            background: isSelected
                              ? "rgba(245, 158, 11, 0.22)"
                              : "var(--bg-surface)",
                            border: isSelected
                              ? "1px solid #F59E0B"
                              : "1px solid var(--border-color)",
                            color: isSelected
                              ? "#F59E0B"
                              : "var(--text-secondary)",
                            transition: "all 0.15s ease",
                          }}
                          title={
                            isSelected
                              ? `Click to deselect ${sbj}`
                              : `Click to select ${sbj}`
                          }
                        >
                          {isSelected ? (
                            <Check size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          <span>{sbj}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: DELIVERY FORMAT, CUSTOM TOPICS & LINKS                 */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Interactive Delivery Mode Selector Cards */}
              <div>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Select Course Delivery Format *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      mode: "LIVE_ONLINE",
                      label: "Live Online Class",
                      desc: "Real-time interactive live sessions on Zoom or Meet",
                      icon: Radio,
                      color: "#E11D48",
                    },
                    {
                      mode: "RECORDED_VIDEO",
                      label: "Recorded Video Course",
                      desc: "Pre-recorded on-demand video lectures & playlist",
                      icon: Video,
                      color: "#4F46E5",
                    },
                    {
                      mode: "HYBRID",
                      label: "Hybrid (Live + Recorded)",
                      desc: "Full video vault plus scheduled live doubt classes",
                      icon: Sparkles,
                      color: "#10B981",
                    },
                  ].map((fmt) => {
                    const isSelected = courseMode === fmt.mode;
                    const Icon = fmt.icon;

                    return (
                      <div
                        key={fmt.mode}
                        onClick={() => onCourseModeChange(fmt.mode as any)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: isSelected
                            ? `2px solid ${fmt.color}`
                            : "1px solid var(--border-color)",
                          background: isSelected
                            ? "rgba(99, 102, 241, 0.08)"
                            : "var(--bg-surface)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: fmt.color,
                              fontWeight: "800",
                              fontSize: "0.85rem",
                            }}
                          >
                            <Icon size={16} />
                            <span>{fmt.label}</span>
                          </div>
                          {isSelected && (
                            <span
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                background: fmt.color,
                                color: "#FFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.3,
                          }}
                        >
                          {fmt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Infinite Syllabus Topics Builder */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "14px",
                  padding: "14px 16px",
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
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      className="badge badge-primary"
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 8px",
                        fontWeight: "800",
                      }}
                    >
                      <Layers size={11} style={{ marginRight: "4px" }} />{" "}
                      SYLLABUS TOPICS
                    </span>
                    <span
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                      }}
                    >
                      What will students learn in this batch? (
                      {syllabusTopics.length})
                    </span>
                  </div>

                  {syllabusTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllTopics}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "0.74rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Topic Input with Comma-Separated Support */}
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "10px" }}
                >
                  <input
                    type="text"
                    className="form-input"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Type topic name or paste comma-separated (e.g. Algebra, Trigonometry, Optics) & press Enter..."
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.84rem",
                      flex: 1,
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleAddTopic}
                    style={{
                      fontSize: "0.78rem",
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={14} /> Add Topic
                  </button>
                </div>

                {/* Dynamic Topic Chips */}
                {syllabusTopics.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      maxHeight: "110px",
                      overflowY: "auto",
                      padding: "2px",
                    }}
                  >
                    {syllabusTopics.map((topic) => (
                      <span
                        key={topic}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          fontSize: "0.76rem",
                          fontWeight: "600",
                          background: "rgba(99, 102, 241, 0.16)",
                          border: "1px solid rgba(99, 102, 241, 0.35)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span>#{topic}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Remove topic"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    💡 Tip: Add key chapter topics so students and parents can
                    see the complete roadmap.
                  </div>
                )}
              </div>

              {/* Video & Live URL Deliverables in Clean 2-Column Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* 1. Video Vault Details */}
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      color: "#818CF8",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Video size={15} /> Video Lectures & Stream URL
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: "3px",
                        }}
                      >
                        Total Lectures
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={inclusions.totalLectures || ""}
                        onChange={(e) =>
                          handleInclusionUpdate(
                            "totalLectures",
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="e.g. 40"
                        style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: "3px",
                        }}
                      >
                        Total Hours
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={inclusions.totalHours || ""}
                        onChange={(e) =>
                          handleInclusionUpdate(
                            "totalHours",
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="e.g. 50"
                        style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      Playlist / Video URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={lectureVideoUrl}
                      onChange={(e) => onLectureVideoUrlChange(e.target.value)}
                      placeholder="https://youtube.com/playlist?... or private stream"
                      style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        color: "#10B981",
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      Free Demo Video Link (Preview)
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={demoVideoUrl}
                      onChange={(e) => onDemoVideoUrlChange(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... (Free for all)"
                      style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>

                {/* 2. Live Interactive Classroom Details */}
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      color: "#34D399",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Radio size={15} /> Live Classroom (Zoom / Meet)
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        display: "block",
                        marginBottom: "3px",
                      }}
                    >
                      Live Meeting URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      value={liveMeetingUrl}
                      onChange={(e) => onLiveMeetingUrlChange(e.target.value)}
                      placeholder="https://meet.google.com/... or zoom.us/j/..."
                      style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: "3px",
                        }}
                      >
                        Class Schedule Timing
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={liveSchedule}
                        onChange={(e) => onLiveScheduleChange(e.target.value)}
                        placeholder="e.g. Mon, Wed & Fri @ 7 PM"
                        style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: "3px",
                        }}
                      >
                        Live Sessions
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={inclusions.totalLiveSessions || ""}
                        onChange={(e) =>
                          handleInclusionUpdate(
                            "totalLiveSessions",
                            Number(e.target.value) || 0,
                          )
                        }
                        placeholder="e.g. 15"
                        style={{ padding: "6px 8px", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: STUDY MATERIALS, MOCK TESTS & PERKS                    */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Step 3 Sub-Navigation Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "12px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep3ActiveTab("DOCS")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      step3ActiveTab === "DOCS"
                        ? "#F59E0B"
                        : "var(--bg-surface)",
                    color:
                      step3ActiveTab === "DOCS"
                        ? "#FFFFFF"
                        : "var(--text-secondary)",
                    boxShadow:
                      step3ActiveTab === "DOCS"
                        ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <BookOpen size={16} />
                  <span>📚 E-Books & Study Notes</span>
                  <span
                    style={{
                      background:
                        step3ActiveTab === "DOCS"
                          ? "rgba(0,0,0,0.25)"
                          : "var(--bg-card)",
                      color:
                        step3ActiveTab === "DOCS"
                          ? "#FFF"
                          : "var(--text-muted)",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                    }}
                  >
                    {studyMaterials.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep3ActiveTab("TESTS")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      step3ActiveTab === "TESTS"
                        ? "#EC4899"
                        : "var(--bg-surface)",
                    color:
                      step3ActiveTab === "TESTS"
                        ? "#FFFFFF"
                        : "var(--text-secondary)",
                    boxShadow:
                      step3ActiveTab === "TESTS"
                        ? "0 4px 12px rgba(236, 72, 153, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FileText size={16} />
                  <span>📝 Topic-Wise MCQ Tests</span>
                  <span
                    style={{
                      background:
                        step3ActiveTab === "TESTS"
                          ? "rgba(0,0,0,0.25)"
                          : "var(--bg-card)",
                      color:
                        step3ActiveTab === "TESTS"
                          ? "#FFF"
                          : "var(--text-muted)",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                    }}
                  >
                    {mockTests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep3ActiveTab("PERKS")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      step3ActiveTab === "PERKS"
                        ? "#10B981"
                        : "var(--bg-surface)",
                    color:
                      step3ActiveTab === "PERKS"
                        ? "#FFFFFF"
                        : "var(--text-secondary)",
                    boxShadow:
                      step3ActiveTab === "PERKS"
                        ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Award size={16} />
                  <span>⭐ Perks & Curriculum</span>
                </button>
              </div>

              {/* ========================================================== */}
              {/* SUB-TAB 1: MULTI-DOCUMENT STUDY MATERIALS (PDF/DOC)        */}
              {/* ========================================================== */}
              {step3ActiveTab === "DOCS" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {/* Add Document Card */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
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
                        style={{
                          fontSize: "0.84rem",
                          fontWeight: "800",
                          color: "#F59E0B",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Plus size={16} /> Add Study Material / PDF / Document
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Add multiple files topic-wise for students
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      {/* Document Title */}
                      <div style={{ gridColumn: "span 2" }}>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Document / Notes Title *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Chapter 1: Formula Sheet & Derivations, or Complete NCERT Solution PDF"
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        />
                      </div>

                      {/* Document Format */}
                      <div>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Format / Type
                        </label>
                        <select
                          className="form-input"
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as any)}
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        >
                          <option value="PDF">📄 PDF Document</option>
                          <option value="DOC">📝 Word / DOCX</option>
                          <option value="NOTES">✍️ Handwritten Notes</option>
                          <option value="EBOOK">📚 Complete E-Book</option>
                        </select>
                      </div>

                      {/* Topic Association */}
                      <div>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Associated Topic
                        </label>
                        <select
                          className="form-input"
                          value={newDocTopic}
                          onChange={(e) => setNewDocTopic(e.target.value)}
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        >
                          <option value="General">
                            All Topics / Course-Wide
                          </option>
                          {syllabusTopics.map((topic, i) => (
                            <option key={i} value={topic}>
                              #{topic}
                            </option>
                          ))}
                          <option value="__CUSTOM__">✍️ Custom Topic...</option>
                        </select>
                      </div>
                    </div>

                    {newDocTopic === "__CUSTOM__" && (
                      <div style={{ marginBottom: "10px" }}>
                        <label
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Custom Topic Name *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={newDocCustomTopic}
                          onChange={(e) => setNewDocCustomTopic(e.target.value)}
                          placeholder="e.g. Chemical Bonding, Electrostatics..."
                          style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                        />
                      </div>
                    )}

                    {/* Source Mode Toggle: Direct File Upload vs External URL */}
                    <div style={{ marginTop: "12px", marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Document File Source *
                        </label>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            background: "var(--bg-card)",
                            padding: "3px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setDocSourceMode("UPLOAD")}
                            style={{
                              border: "none",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              fontSize: "0.74rem",
                              fontWeight:
                                docSourceMode === "UPLOAD" ? "700" : "500",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background:
                                docSourceMode === "UPLOAD"
                                  ? "#F59E0B"
                                  : "transparent",
                              color:
                                docSourceMode === "UPLOAD"
                                  ? "#FFFFFF"
                                  : "var(--text-secondary)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <UploadCloud size={14} /> Direct File Upload
                            (Cloudinary CDN)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocSourceMode("URL")}
                            style={{
                              border: "none",
                              padding: "5px 12px",
                              borderRadius: "6px",
                              fontSize: "0.74rem",
                              fontWeight:
                                docSourceMode === "URL" ? "700" : "500",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background:
                                docSourceMode === "URL"
                                  ? "#3B82F6"
                                  : "transparent",
                              color:
                                docSourceMode === "URL"
                                  ? "#FFFFFF"
                                  : "var(--text-secondary)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <ExternalLink size={14} /> External Cloud URL (Drive
                            / S3)
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: DIRECT FILE UPLOAD (CLOUDINARY) */}
                      {docSourceMode === "UPLOAD" && (
                        <div>
                          {isUploadingDoc ? (
                            <div
                              style={{
                                padding: "24px 16px",
                                borderRadius: "12px",
                                border: "1px dashed #F59E0B",
                                background: "rgba(245, 158, 11, 0.06)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                textAlign: "center",
                              }}
                            >
                              <Loader2
                                size={26}
                                className="animate-spin"
                                style={{ color: "#F59E0B" }}
                              />
                              <div
                                style={{
                                  fontSize: "0.84rem",
                                  fontWeight: "700",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Uploading document directly to Cloudinary CDN...
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Streaming file securely to cloud storage. Once
                                complete, it will be instantly accessible to
                                students.
                              </div>
                            </div>
                          ) : uploadedDocMeta ? (
                            <div
                              style={{
                                padding: "14px 16px",
                                borderRadius: "12px",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                background: "rgba(16, 185, 129, 0.08)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    background: "#10B981",
                                    color: "#FFF",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <CheckCircle2 size={22} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "0.84rem",
                                      fontWeight: "700",
                                      color: "var(--text-primary)",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {uploadedDocMeta.originalName}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      marginTop: "4px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "#059669",
                                        fontWeight: "800",
                                        background: "rgba(16, 185, 129, 0.18)",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      ☁️ Cloudinary CDN (
                                      {uploadedDocMeta.sizeFormatted})
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "var(--text-muted)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "280px",
                                      }}
                                    >
                                      {newDocUrl}
                                    </span>
                                  </div>
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
                                <a
                                  href={newDocUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: "0.74rem",
                                    color: "#059669",
                                    fontWeight: "700",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    background: "rgba(16, 185, 129, 0.15)",
                                  }}
                                >
                                  <ExternalLink size={13} /> Test Link
                                </a>
                                <label
                                  htmlFor="study-doc-reupload-input"
                                  style={{
                                    fontSize: "0.74rem",
                                    color: "var(--text-secondary)",
                                    cursor: "pointer",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border-color)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  Change File
                                  <input
                                    id="study-doc-reupload-input"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.epub,.txt,image/*"
                                    onChange={handleDocFileUpload}
                                    style={{ display: "none" }}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label
                                htmlFor="study-doc-file-upload-input"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px",
                                  padding: "24px 16px",
                                  borderRadius: "12px",
                                  border: "1px dashed #F59E0B",
                                  background: "rgba(245, 158, 11, 0.03)",
                                  cursor: "pointer",
                                  textAlign: "center",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <div
                                  style={{
                                    background: "rgba(245, 158, 11, 0.12)",
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <UploadCloud
                                    size={24}
                                    style={{ color: "#F59E0B" }}
                                  />
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "0.84rem",
                                      fontWeight: "700",
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    Click to Choose Document or Notes File
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "var(--text-muted)",
                                      marginTop: "2px",
                                    }}
                                  >
                                    Supports PDF, Word (DOC/DOCX), PPT/PPTX,
                                    EPUB, TXT, or Image scans up to 25MB
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "#0284C7",
                                    background: "rgba(56, 189, 248, 0.12)",
                                    padding: "2px 10px",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                  }}
                                >
                                  ☁️ Uploads to Cloudinary CDN (Instant
                                  streaming & student downloads, AWS S3 ready)
                                </div>
                                <input
                                  id="study-doc-file-upload-input"
                                  type="file"
                                  accept=".pdf,.doc,.docx,.ppt,.pptx,.epub,.txt,image/*"
                                  onChange={handleDocFileUpload}
                                  style={{ display: "none" }}
                                />
                              </label>
                            </div>
                          )}

                          {docUploadError && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                fontSize: "0.74rem",
                                color: "#EF4444",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <AlertCircle size={15} /> {docUploadError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* MODE 2: EXTERNAL URL INPUT */}
                      {docSourceMode === "URL" && (
                        <div>
                          <input
                            type="url"
                            className="form-input"
                            value={newDocUrl}
                            onChange={(e) => {
                              setNewDocUrl(e.target.value);
                              setUploadedDocMeta(null);
                            }}
                            placeholder="https://drive.google.com/file/d/... or https://s3.amazonaws.com/..."
                            style={{ padding: "8px 12px", fontSize: "0.82rem" }}
                          />
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            Paste public Google Drive, Dropbox, AWS S3, or
                            direct PDF/DOC download links.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Document Action Bar */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {newDocUrl ? (
                          <span
                            style={{
                              color: "#10B981",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 size={13} /> Ready to attach (
                            {newDocType})
                          </span>
                        ) : (
                          "Upload a file or provide a URL before adding"
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddStudyMaterial}
                        disabled={isUploadingDoc}
                        style={{
                          background: isUploadingDoc ? "#9CA3AF" : "#F59E0B",
                          color: "#FFFFFF",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: "700",
                          cursor: isUploadingDoc ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: isUploadingDoc
                            ? "none"
                            : "0 2px 8px rgba(245, 158, 11, 0.3)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {isUploadingDoc ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />{" "}
                            Uploading to Cloudinary...
                          </>
                        ) : (
                          <>
                            <Plus size={15} /> + Add Document to Course
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Legacy E-Book Helper Banner */}
                  {ebookPdfUrl && studyMaterials.length === 0 && (
                    <div
                      style={{
                        background: "rgba(245, 158, 11, 0.08)",
                        border: "1px dashed #F59E0B",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.78rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#D97706",
                        }}
                      >
                        <AlertCircle size={16} />
                        <span>
                          Existing single E-Book link detected:{" "}
                          <strong>{ebookTitle || "Course E-Book"}</strong> (
                          {ebookPdfUrl})
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const item: CourseStudyMaterialItem = {
                            title: ebookTitle || "Course E-Book",
                            docType: "EBOOK",
                            topic: "General",
                            fileUrl: ebookPdfUrl,
                          };
                          const updated = [...studyMaterials, item];
                          if (onStudyMaterialsChange)
                            onStudyMaterialsChange(updated);
                          handleInclusionUpdate("totalEbooks", updated.length);
                        }}
                        style={{ fontSize: "0.72rem", padding: "4px 10px" }}
                      >
                        + Migrate into Documents List
                      </button>
                    </div>
                  )}

                  {/* Documents List */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
                      padding: "14px 16px",
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
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <BookOpen size={16} style={{ color: "#F59E0B" }} />
                        <span>
                          Attached Study Documents & E-Books (
                          {studyMaterials.length})
                        </span>
                      </div>
                      <span
                        className="badge badge-amber"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        Auto-updates Total PDFs ({studyMaterials.length})
                      </span>
                    </div>

                    {studyMaterials.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "24px 16px",
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          background: "var(--bg-card)",
                          borderRadius: "10px",
                          border: "1px dashed var(--border-color)",
                        }}
                      >
                        <BookOpen
                          size={28}
                          style={{
                            opacity: 0.3,
                            margin: "0 auto 8px auto",
                            display: "block",
                          }}
                        />
                        No documents added yet. Use the form above to add
                        chapter-wise PDFs, revision notes, or reference docs.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {studyMaterials.map((doc, idx) => {
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
                              key={idx}
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
                                      gap: "8px",
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
                                    {doc.fileUrl.includes("cloudinary") ? (
                                      <span
                                        style={{
                                          fontSize: "0.65rem",
                                          color: "#0284C7",
                                          background:
                                            "rgba(56, 189, 248, 0.14)",
                                          border:
                                            "1px solid rgba(56, 189, 248, 0.25)",
                                          padding: "1px 6px",
                                          borderRadius: "4px",
                                          fontWeight: "700",
                                        }}
                                      >
                                        ☁️ Cloudinary CDN
                                      </span>
                                    ) : doc.fileUrl.includes(
                                        "drive.google.com",
                                      ) ? (
                                      <span
                                        style={{
                                          fontSize: "0.65rem",
                                          color: "#D97706",
                                          background:
                                            "rgba(245, 158, 11, 0.14)",
                                          border:
                                            "1px solid rgba(245, 158, 11, 0.25)",
                                          padding: "1px 6px",
                                          borderRadius: "4px",
                                          fontWeight: "700",
                                        }}
                                      >
                                        📁 Google Drive
                                      </span>
                                    ) : doc.fileUrl.includes("s3.") ||
                                      doc.fileUrl.includes("amazonaws") ? (
                                      <span
                                        style={{
                                          fontSize: "0.65rem",
                                          color: "#7C3AED",
                                          background:
                                            "rgba(124, 58, 237, 0.14)",
                                          border:
                                            "1px solid rgba(124, 58, 237, 0.25)",
                                          padding: "1px 6px",
                                          borderRadius: "4px",
                                          fontWeight: "700",
                                        }}
                                      >
                                        🪣 AWS S3
                                      </span>
                                    ) : null}
                                    <span
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "var(--text-muted)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: "200px",
                                      }}
                                    >
                                      {doc.fileUrl}
                                    </span>
                                  </div>
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
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    fontSize: "0.74rem",
                                    color: "#3B82F6",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    textDecoration: "none",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    background: "rgba(59, 130, 246, 0.1)",
                                  }}
                                  title="Test link in new tab"
                                >
                                  <ExternalLink size={13} /> Open
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudyMaterial(idx)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#FB7185",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                  }}
                                  title="Remove Document"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SUB-TAB 2: TOPIC-WISE MCQ TESTS & QUIZZES                  */}
              {/* ========================================================== */}
              {step3ActiveTab === "TESTS" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {/* Create Mock Test Card */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      padding: "16px",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
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
                        style={{
                          fontSize: "0.84rem",
                          fontWeight: "800",
                          color: "#EC4899",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Plus size={16} /> Create Topic Mock Test / MCQ Quiz
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Build questions topic-wise with answer keys
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      {/* Test Title */}
                      <div style={{ gridColumn: "span 2" }}>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Mock Test / Quiz Title *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={newTestTitle}
                          onChange={(e) => setNewTestTitle(e.target.value)}
                          placeholder="e.g. Chapter 1: Chemical Reactions Topic Quiz (MCQ)"
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        />
                      </div>

                      {/* Topic Selector */}
                      <div>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Topic / Chapter
                        </label>
                        <select
                          className="form-input"
                          value={newTestTopic}
                          onChange={(e) => setNewTestTopic(e.target.value)}
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        >
                          <option value="All Topics">
                            All Topics / Full Syllabus
                          </option>
                          {syllabusTopics.map((topic, i) => (
                            <option key={i} value={topic}>
                              #{topic}
                            </option>
                          ))}
                          <option value="__CUSTOM__">✍️ Custom Topic...</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={newTestDuration}
                          onChange={(e) => setNewTestDuration(e.target.value)}
                          placeholder="30"
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        />
                      </div>

                      {/* Questions Count */}
                      <div>
                        <label
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Total Questions Count
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={
                            draftQuestions.length > 0
                              ? draftQuestions.length
                              : newTestTotalQuestions
                          }
                          onChange={(e) =>
                            setNewTestTotalQuestions(e.target.value)
                          }
                          disabled={draftQuestions.length > 0}
                          placeholder="10"
                          style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                        />
                      </div>
                    </div>

                    {newTestTopic === "__CUSTOM__" && (
                      <div style={{ marginBottom: "10px" }}>
                        <label
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Custom Topic Name *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={newTestCustomTopic}
                          onChange={(e) =>
                            setNewTestCustomTopic(e.target.value)
                          }
                          placeholder="e.g. Thermodynamics, Optics..."
                          style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                        />
                      </div>
                    )}

                    {/* Test Online Paper URL (Optional) */}
                    <div style={{ marginBottom: "12px" }}>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-secondary)",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Online Test Portal / Google Form URL (Optional)
                      </label>
                      <input
                        type="url"
                        className="form-input"
                        value={newTestUrl}
                        onChange={(e) => setNewTestUrl(e.target.value)}
                        placeholder="https://forms.gle/... or external exam link (or build MCQ questions below)"
                        style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                      />
                    </div>

                    {/* Inline MCQ Question Builder (Collapsible / Interactive) */}
                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        padding: "12px",
                        marginBottom: "12px",
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
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: "800",
                              color: "#EC4899",
                            }}
                          >
                            ✍️ Built-in MCQ Question Bank Builder
                          </span>
                          <span
                            className="badge badge-rose"
                            style={{ fontSize: "0.66rem", padding: "1px 6px" }}
                          >
                            {draftQuestions.length} Questions Drafted
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-amber"
                            onClick={() =>
                              setShowBulkMcqPanel(!showBulkMcqPanel)
                            }
                            style={{
                              fontSize: "0.72rem",
                              padding: "4px 10px",
                              fontWeight: "800",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FileSpreadsheet size={14} />
                            {showBulkMcqPanel
                              ? "Hide Bulk Upload"
                              : "📥 Bulk Upload MCQs (CSV / Paste)"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              setShowQuestionBuilder(!showQuestionBuilder)
                            }
                            style={{
                              fontSize: "0.72rem",
                              padding: "4px 10px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {showQuestionBuilder ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                            {showQuestionBuilder
                              ? "Hide Question Form"
                              : "+ Add Question (A/B/C/D)"}
                          </button>
                        </div>
                      </div>

                      {bulkMcqSuccess && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#10B981",
                            fontSize: "0.76rem",
                            fontWeight: "700",
                          }}
                        >
                          {bulkMcqSuccess}
                        </div>
                      )}

                      {showBulkMcqPanel && (
                        <div
                          style={{
                            marginTop: "12px",
                            borderTop: "1px solid var(--border-color)",
                            paddingTop: "12px",
                          }}
                        >
                          {/* Template + columns */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  fontWeight: "800",
                                  color: "var(--text-primary)",
                                }}
                              >
                                📥 Step 1: Download sample template
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Columns: quizSetTitle, topic, questionText,
                                optionA–D, correctOption (A/B/C/D), explanation
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-amber"
                              onClick={downloadBulkMcqTemplate}
                              style={{
                                fontSize: "0.72rem",
                                padding: "4px 10px",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Download size={13} /> Sample CSV
                            </button>
                          </div>

                          {/* Defaults (used when CSV rows leave these columns empty) */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(170px, 1fr))",
                              gap: "8px",
                              marginBottom: "10px",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Default Topic
                              </label>
                              <select
                                className="form-input"
                                value={bulkTopic}
                                onChange={(e) => setBulkTopic(e.target.value)}
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.78rem",
                                }}
                              >
                                <option value="All Topics">
                                  All Topics / Full Syllabus
                                </option>
                                {syllabusTopics.map((t, i) => (
                                  <option key={i} value={t}>
                                    #{t}
                                  </option>
                                ))}
                                <option value="__CUSTOM__">
                                  ✍️ Custom Topic...
                                </option>
                              </select>
                              {bulkTopic === "__CUSTOM__" && (
                                <input
                                  type="text"
                                  className="form-input"
                                  value={bulkCustomTopic}
                                  onChange={(e) =>
                                    setBulkCustomTopic(e.target.value)
                                  }
                                  placeholder="Custom topic name"
                                  style={{
                                    padding: "6px 8px",
                                    fontSize: "0.78rem",
                                    marginTop: "4px",
                                  }}
                                />
                              )}
                            </div>
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Default Test Title
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={bulkSetTitle}
                                onChange={(e) =>
                                  setBulkSetTitle(e.target.value)
                                }
                                placeholder="Used if quizSetTitle is empty"
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.78rem",
                                }}
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Duration per Test (Mins)
                              </label>
                              <input
                                type="number"
                                className="form-input"
                                value={bulkDuration}
                                onChange={(e) =>
                                  setBulkDuration(e.target.value)
                                }
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.78rem",
                                }}
                              />
                            </div>
                          </div>

                          {/* Input mode toggle */}
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            {(["FILE", "PASTE", "RICH"] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setBulkMcqMode(m)}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  fontSize: "0.74rem",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  background:
                                    bulkMcqMode === m
                                      ? "#EC4899"
                                      : "var(--bg-surface)",
                                  color:
                                    bulkMcqMode === m
                                      ? "#FFF"
                                      : "var(--text-secondary)",
                                }}
                              >
                                {m === "FILE"
                                  ? "📁 Upload CSV / TSV File"
                                  : m === "PASTE"
                                    ? "📋 Paste from Excel / Sheets"
                                    : "📰 Rich Content"}
                              </button>
                            ))}
                          </div>

                          {bulkMcqMode === "FILE" ? (
                            <>
                            <label
                              htmlFor="wizard-bulk-mcq-file-input"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                                padding: "18px 12px",
                                borderRadius: "10px",
                                border: "1px dashed var(--border-color)",
                                cursor: "pointer",
                                textAlign: "center",
                              }}
                            >
                              <UploadCloud
                                size={22}
                                style={{ color: "#EC4899" }}
                              />
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: "700",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {bulkMcqFileName
                                  ? `Selected: ${bulkMcqFileName}`
                                  : "Choose CSV or Text File"}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Supports .csv / .tsv / .txt (Excel) ya MCQ ki
                                Image (PNG, JPG, WEBP)
                              </span>
                              <input
                                id="wizard-bulk-mcq-file-input"
                                type="file"
                                accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values,image/*"
                                onChange={handleBulkMcqFile}
                                style={{ display: "none" }}
                              />
                              {bulkMcqImagePreview && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-color)",
                                    background: "var(--bg-card)",
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "center",
                                  }}
                                >
                                  <img
                                    src={bulkMcqImagePreview}
                                    alt="Selected MCQ"
                                    style={{
                                      width: "90px",
                                      height: "60px",
                                      objectFit: "cover",
                                      borderRadius: "6px",
                                      border: "1px solid var(--border-color)",
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "0.78rem",
                                        fontWeight: "700",
                                        color: "var(--text-primary)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {bulkMcqImageFile?.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.7rem",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Image select ho gayi hai.
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetBulkMcqPanel}
                                    style={{
                                      fontSize: "0.72rem",
                                      padding: "4px 10px",
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </label>
                            {bulkMcqImagePreview && (
                                <div
                                  style={{
                                    marginTop: "10px",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-color)",
                                    background: "var(--bg-card)",
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "center",
                                  }}
                                >
                                  <img
                                    src={bulkMcqImagePreview}
                                    alt="Selected MCQ"
                                    style={{
                                      width: "90px",
                                      height: "60px",
                                      objectFit: "cover",
                                      borderRadius: "6px",
                                      border: "1px solid var(--border-color)",
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "0.78rem",
                                        fontWeight: "700",
                                        color: "var(--text-primary)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {bulkMcqImageFile?.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.7rem",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      Image select ho gayi hai.
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetBulkMcqPanel}
                                    style={{
                                      fontSize: "0.72rem",
                                      padding: "4px 10px",
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </>
                          ) : bulkMcqMode === "PASTE" ? (
                            <textarea
                              className="form-input"
                              rows={5}
                              value={bulkMcqRaw}
                              onChange={(e) => {
                                setBulkMcqRaw(e.target.value);
                                setBulkMcqError("");
                              }}
                              placeholder={
                                "Paste CSV or copy cells from Excel / Google Sheets...\n\nquizSetTitle,topic,questionText,optionA,optionB,optionC,optionD,correctOption,explanation\nUnit 1 Test,Algebra,What is 2+2?,3,4,5,6,B,Basic addition"
                              }
                              style={{
                                width: "100%",
                                fontSize: "0.76rem",
                                fontFamily: "monospace",
                              }}
                            />
                                                    ) : (
                            <div>
                              <input
                                type="text"
                                className="form-input"
                                value={richTitle}
                                onChange={(e) => setRichTitle(e.target.value)}
                                placeholder="Content / Blog title (e.g. Chemical Reactions: Complete Notes)"
                                style={{ padding: "7px 10px", fontSize: "0.82rem", marginBottom: "8px" }}
                              />
                              <RichContentEditor
                                key={richEditorKey}
                                value={richHtml}
                                onChange={setRichHtml}
                                onUploadImage={uploadRichImage}
                              />
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "6px 0 10px" }}>
                                💡 Web page / Google Docs / Word se copy karke yahan paste karein. Text, tables aur images waise hi aayengi.
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveRichContent}
                                style={{ background: "#EC4899", color: "#FFF", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "800", cursor: "pointer" }}
                              >
                                📰 Add Content to Course
                              </button>

                              {richContents.length > 0 && (
                                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <div style={{ fontSize: "0.78rem", fontWeight: "800" }}>
                                    Added Contents ({richContents.length})
                                  </div>
                                  {richContents.map((rc, idx) => (
                                    <details
                                      key={idx}
                                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px" }}
                                    >
                                      <summary style={{ cursor: "pointer", fontSize: "0.8rem", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>
                                          {rc.title} <span style={{ color: "#EC4899", fontWeight: 600 }}>#{rc.topic}</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); handleRemoveRichContent(idx); }}
                                          style={{ background: "none", border: "none", color: "#FB7185", cursor: "pointer" }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </summary>
                                      <div
                                        className="rich-view"
                                        style={{ marginTop: "8px" }}
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rc.html) }}
                                      />
                                    </details>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {bulkMcqError && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                background: "rgba(244, 63, 94, 0.12)",
                                border: "1px solid rgba(244, 63, 94, 0.35)",
                                color: "#FB7185",
                                fontSize: "0.76rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <AlertCircle size={14} /> {bulkMcqError}
                            </div>
                          )}

                          {/* Live preview */}
                          {parsedBulkMcqs.length > 0 && (
                            <div style={{ marginTop: "10px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "6px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.78rem",
                                    fontWeight: "800",
                                  }}
                                >
                                  📋 Parsed Preview ({parsedBulkMcqs.length}{" "}
                                  rows)
                                </span>
                                <span
                                  className="badge badge-emerald"
                                  style={{
                                    fontSize: "0.66rem",
                                    padding: "1px 7px",
                                  }}
                                >
                                  {validBulkMcqs.length} Valid
                                </span>
                                {parsedBulkMcqs.length >
                                  validBulkMcqs.length && (
                                  <span
                                    className="badge badge-rose"
                                    style={{
                                      fontSize: "0.66rem",
                                      padding: "1px 7px",
                                    }}
                                  >
                                    {parsedBulkMcqs.length -
                                      validBulkMcqs.length}{" "}
                                    Error(s)
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  → will create {bulkGroupCount} test(s)
                                </span>
                              </div>
                              <div
                                style={{
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "8px",
                                }}
                              >
                                <table
                                  style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "0.72rem",
                                    textAlign: "left",
                                  }}
                                >
                                  <thead>
                                    <tr
                                      style={{
                                        background: "var(--bg-surface)",
                                        color: "var(--text-muted)",
                                        borderBottom:
                                          "1px solid var(--border-color)",
                                      }}
                                    >
                                      <th
                                        style={{
                                          padding: "5px 8px",
                                          width: "30px",
                                        }}
                                      >
                                        #
                                      </th>
                                      <th style={{ padding: "5px 8px" }}>
                                        Test / Topic
                                      </th>
                                      <th style={{ padding: "5px 8px" }}>
                                        Question
                                      </th>
                                      <th
                                        style={{
                                          padding: "5px 8px",
                                          width: "55px",
                                        }}
                                      >
                                        Answer
                                      </th>
                                      <th
                                        style={{
                                          padding: "5px 8px",
                                          width: "70px",
                                        }}
                                      >
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsedBulkMcqs
                                      .slice(0, 50)
                                      .map((row, rIdx) => (
                                        <tr
                                          key={rIdx}
                                          style={{
                                            borderBottom:
                                              "1px solid var(--border-color)",
                                            background: row.isValid
                                              ? "transparent"
                                              : "rgba(244,63,94,0.05)",
                                          }}
                                        >
                                          <td
                                            style={{
                                              padding: "5px 8px",
                                              color: "var(--text-muted)",
                                              fontWeight: "700",
                                            }}
                                          >
                                            {rIdx + 1}
                                          </td>
                                          <td
                                            style={{
                                              padding: "5px 8px",
                                              maxWidth: "150px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {row.quizSetTitle}{" "}
                                            <span style={{ color: "#EC4899" }}>
                                              #{row.topic}
                                            </span>
                                          </td>
                                          <td
                                            style={{
                                              padding: "5px 8px",
                                              maxWidth: "220px",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {row.questionText || (
                                              <span
                                                style={{ color: "#FB7185" }}
                                              >
                                                Missing statement
                                              </span>
                                            )}
                                          </td>
                                          <td
                                            style={{
                                              padding: "5px 8px",
                                              fontWeight: "800",
                                              color: "#10B981",
                                            }}
                                          >
                                            {
                                              ["A", "B", "C", "D"][
                                                row.correctOption
                                              ]
                                            }
                                          </td>
                                          <td style={{ padding: "5px 8px" }}>
                                            {row.isValid ? (
                                              <span
                                                style={{
                                                  color: "#10B981",
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
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                              {parsedBulkMcqs.length > 50 && (
                                <div
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "var(--text-muted)",
                                    marginTop: "4px",
                                  }}
                                >
                                  Showing first 50 rows. All{" "}
                                  {validBulkMcqs.length} valid rows will be
                                  imported.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          {bulkMcqMode !== "RICH" && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "8px",
                              marginTop: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={handleAddBulkToDraft}
                              disabled={validBulkMcqs.length === 0}
                              style={{
                                fontSize: "0.76rem",
                                padding: "6px 12px",
                                opacity: validBulkMcqs.length === 0 ? 0.45 : 1,
                              }}
                            >
                              ➕ Add {validBulkMcqs.length} to Current Draft
                            </button>
                            <button
                              type="button"
                              onClick={handleImportBulkAsTests}
                              disabled={validBulkMcqs.length === 0}
                              style={{
                                background: "#EC4899",
                                color: "#FFF",
                                border: "none",
                                padding: "7px 16px",
                                borderRadius: "8px",
                                fontSize: "0.78rem",
                                fontWeight: "800",
                                cursor:
                                  validBulkMcqs.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: validBulkMcqs.length === 0 ? 0.45 : 1,
                              }}
                            >
                              🚀 Import as {bulkGroupCount || 0} Mock Test(s)
                            </button>
                          </div>
                          )}
                        </div>
                      )}

                      {showQuestionBuilder && (
                        <div
                          style={{
                            marginTop: "12px",
                            borderTop: "1px solid var(--border-color)",
                            paddingTop: "12px",
                          }}
                        >
                          {/* Question Text */}
                          <div style={{ marginBottom: "10px" }}>
                            <label
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "3px",
                              }}
                            >
                              Question Text *
                            </label>
                            <textarea
                              rows={2}
                              className="form-input"
                              value={qText}
                              onChange={(e) => setQText(e.target.value)}
                              placeholder="e.g. Which of the following is an endothermic reaction?"
                              style={{
                                padding: "6px 10px",
                                fontSize: "0.82rem",
                              }}
                            />
                          </div>

                          {/* 4 Options Grid */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: "8px",
                              marginBottom: "10px",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Option A *
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={qOptA}
                                onChange={(e) => setQOptA(e.target.value)}
                                placeholder="Option A text..."
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.8rem",
                                }}
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Option B *
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={qOptB}
                                onChange={(e) => setQOptB(e.target.value)}
                                placeholder="Option B text..."
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.8rem",
                                }}
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Option C
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={qOptC}
                                onChange={(e) => setQOptC(e.target.value)}
                                placeholder="Option C text..."
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.8rem",
                                }}
                              />
                            </div>
                            <div>
                              <label
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  color: "var(--text-secondary)",
                                  display: "block",
                                  marginBottom: "2px",
                                }}
                              >
                                Option D
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={qOptD}
                                onChange={(e) => setQOptD(e.target.value)}
                                placeholder="Option D text..."
                                style={{
                                  padding: "6px 8px",
                                  fontSize: "0.8rem",
                                }}
                              />
                            </div>
                          </div>

                          {/* Correct Option Selector */}
                          <div style={{ marginBottom: "10px" }}>
                            <label
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Select Correct Option:
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {[0, 1, 2, 3].map((optIdx) => {
                                const letters = ["A", "B", "C", "D"];
                                const isSelected = qCorrect === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => setQCorrect(optIdx)}
                                    style={{
                                      padding: "5px 12px",
                                      borderRadius: "6px",
                                      border: isSelected
                                        ? "1px solid #10B981"
                                        : "1px solid var(--border-color)",
                                      background: isSelected
                                        ? "#10B981"
                                        : "var(--bg-surface)",
                                      color: isSelected
                                        ? "#FFF"
                                        : "var(--text-secondary)",
                                      fontSize: "0.74rem",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    {isSelected && <Check size={12} />}
                                    Option {letters[optIdx]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Explanation */}
                          <div style={{ marginBottom: "10px" }}>
                            <label
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: "600",
                                color: "var(--text-secondary)",
                                display: "block",
                                marginBottom: "2px",
                              }}
                            >
                              Explanation / Solution Hint (Optional)
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={qExplanation}
                              onChange={(e) => setQExplanation(e.target.value)}
                              placeholder="e.g. Photosynthesis requires sunlight energy, making it endothermic."
                              style={{
                                padding: "6px 8px",
                                fontSize: "0.78rem",
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddQuestionToDraft}
                            style={{
                              background: "#EC4899",
                              color: "#FFF",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Plus size={14} /> Add Question to Test Draft
                          </button>
                        </div>
                      )}

                      {/* Draft Questions List */}
                      {draftQuestions.length > 0 && (
                        <div
                          style={{
                            marginTop: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxHeight: "140px",
                            overflowY: "auto",
                          }}
                        >
                          {draftQuestions.map((q, qIdx) => {
                            const letters = ["A", "B", "C", "D"];
                            return (
                              <div
                                key={qIdx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: "var(--bg-surface)",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "0.74rem",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                <span>
                                  <strong>Q{qIdx + 1}.</strong> {q.questionText}
                                  <span
                                    style={{
                                      color: "#10B981",
                                      marginLeft: "8px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    [Correct: {letters[q.correctOption || 0]}]
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveQuestionFromDraft(qIdx)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#FB7185",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                  title="Delete question"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Save Mock Test Button */}
                    <button
                      type="button"
                      onClick={handleSaveMockTest}
                      style={{
                        background: "#EC4899",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "9px 18px",
                        borderRadius: "8px",
                        fontSize: "0.84rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 10px rgba(236, 72, 153, 0.3)",
                      }}
                    >
                      <Plus size={16} /> Save Mock Test / Quiz to Course
                    </button>
                  </div>

                  {/* Created Mock Tests List */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      borderRadius: "14px",
                      border: "1px solid var(--border-color)",
                      padding: "14px 16px",
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
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FileText size={16} style={{ color: "#EC4899" }} />
                        <span>
                          Created Mock Tests & Assessments ({mockTests.length})
                        </span>
                      </div>
                      <span
                        className="badge badge-rose"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        Auto-updates Total Mock Tests ({mockTests.length})
                      </span>
                    </div>

                    {mockTests.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "24px 16px",
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          background: "var(--bg-card)",
                          borderRadius: "10px",
                          border: "1px dashed var(--border-color)",
                        }}
                      >
                        <FileText
                          size={28}
                          style={{
                            opacity: 0.3,
                            margin: "0 auto 8px auto",
                            display: "block",
                          }}
                        />
                        No mock tests created yet. Use the form above to add
                        topic-wise quizzes or full mock test papers.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {mockTests.map((test, idx) => {
                          const isExpanded = expandedTestIdx === idx;
                          return (
                            <div
                              key={idx}
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
                                      rel="noreferrer"
                                      style={{
                                        fontSize: "0.74rem",
                                        color: "#3B82F6",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        textDecoration: "none",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        background: "rgba(59, 130, 246, 0.1)",
                                      }}
                                    >
                                      <ExternalLink size={13} /> Link
                                    </a>
                                  )}

                                  {test.questions &&
                                    test.questions.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedTestIdx(
                                            isExpanded ? null : idx,
                                          )
                                        }
                                        className="btn-secondary"
                                        style={{
                                          fontSize: "0.72rem",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        {isExpanded
                                          ? "Hide"
                                          : `Questions (${test.questions.length})`}
                                      </button>
                                    )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMockTest(idx)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#FB7185",
                                      cursor: "pointer",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    title="Delete Mock Test"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Questions View */}
                              {isExpanded &&
                                test.questions &&
                                test.questions.length > 0 && (
                                  <div
                                    style={{
                                      borderTop:
                                        "1px solid var(--border-color)",
                                      background: "var(--bg-surface)",
                                      padding: "10px 14px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                    }}
                                  >
                                    {test.questions.map((q, qIndex) => {
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
                                                "repeat(auto-fit, minmax(140px, 1fr))",
                                              gap: "4px",
                                              margin: "4px 0",
                                            }}
                                          >
                                            {q.options.map((opt, optIndex) => {
                                              const isCorrect =
                                                q.correctOption === optIndex;
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
                                          {q.explanation && (
                                            <div
                                              style={{
                                                color: "var(--text-muted)",
                                                fontSize: "0.68rem",
                                                marginTop: "2px",
                                                fontStyle: "italic",
                                              }}
                                            >
                                              💡 Hint: {q.explanation}
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
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SUB-TAB 3: STUDENT PERKS & CURRICULUM BREAKDOWN            */}
              {/* ========================================================== */}
              {step3ActiveTab === "PERKS" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {/* 1. Course Perks & Badges (Interactive 2x2 Toggle Cards) */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        color: "#10B981",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Award size={16} /> Student Perks & Course Badges
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {[
                        {
                          key: "hasCertificate",
                          label: "Completion Certificate",
                          desc: "Verified certificate on batch completion",
                          defaultVal: true,
                        },
                        {
                          key: "hasDoubtSupport",
                          label: "1-on-1 Doubt Support",
                          desc: "Direct chat/call doubt clearing with teacher",
                          defaultVal: true,
                        },
                        {
                          key: "hasDownloadableNotes",
                          label: "Downloadable Summary Sheets",
                          desc: "High-yield PDF cheat sheets & revision maps",
                          defaultVal: true,
                        },
                        {
                          key: "hasLifetimeAccess",
                          label: "Lifetime Validity Access",
                          desc: "Student can re-watch lectures anytime",
                          defaultVal: false,
                        },
                      ].map((perk) => {
                        const isChecked =
                          (inclusions as any)[perk.key] ?? perk.defaultVal;

                        return (
                          <label
                            key={perk.key}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              border: isChecked
                                ? "1px solid rgba(16, 185, 129, 0.4)"
                                : "1px solid var(--border-color)",
                              background: isChecked
                                ? "rgba(16, 185, 129, 0.08)"
                                : "var(--bg-card)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                handleInclusionUpdate(
                                  perk.key as any,
                                  e.target.checked,
                                )
                              }
                              style={{ marginTop: "2px" }}
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  fontWeight: "700",
                                  color: isChecked
                                    ? "var(--text-primary)"
                                    : "var(--text-secondary)",
                                }}
                              >
                                {perk.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                {perk.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Optional Chapter Breakdown (Collapsible) */}
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "12px 14px",
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
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: "800",
                            color: "#F59E0B",
                          }}
                        >
                          📚 Course Chapters / Curriculum Breakdown (
                          {curriculum.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          setShowCurriculumBuilder(!showCurriculumBuilder)
                        }
                        style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                      >
                        {showCurriculumBuilder
                          ? "Hide Chapters"
                          : "+ Add Modules / Chapters"}
                      </button>
                    </div>

                    {showCurriculumBuilder && (
                      <div style={{ marginTop: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <input
                            type="text"
                            className="form-input"
                            value={newCurriculumTitle}
                            onChange={(e) =>
                              setNewCurriculumTitle(e.target.value)
                            }
                            placeholder="Chapter name (e.g. Chapter 1: Chemical Reactions & Equations)..."
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.82rem",
                              flex: 1,
                            }}
                          />
                          <input
                            type="number"
                            className="form-input"
                            value={newCurriculumLectures}
                            onChange={(e) =>
                              setNewCurriculumLectures(e.target.value)
                            }
                            placeholder="Lectures"
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.82rem",
                              width: "90px",
                            }}
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleAddCurriculumModule}
                            style={{
                              fontSize: "0.76rem",
                              padding: "6px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>

                        {curriculum.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              maxHeight: "120px",
                              overflowY: "auto",
                            }}
                          >
                            {curriculum.map((mod, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: "var(--bg-card)",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border-color)",
                                  fontSize: "0.78rem",
                                }}
                              >
                                <span>
                                  <strong>
                                    {idx + 1}. {mod.title}
                                  </strong>
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      marginLeft: "8px",
                                    }}
                                  >
                                    ({mod.lectureCount || 1} Lectures)
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCurriculumModule(idx)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#FB7185",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                  title="Remove"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: PRICING, BANNER & LIVE STUDENT REVIEW                   */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* LEFT COLUMN: Pricing Inputs, Thumbnail & Description */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Pricing Inputs */}
                <div
                  style={{
                    background: "var(--bg-surface)",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      color: "#10B981",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    💰 Course Batch Pricing Tier
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Offer Price (₹) *
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={price}
                        onChange={(e) => onPriceChange(e.target.value)}
                        placeholder="1499"
                        style={{
                          padding: "8px 10px",
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          color: "#10B981",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                          display: "block",
                        }}
                      >
                        Original MRP (₹) *
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={originalPrice}
                        onChange={(e) => onOriginalPriceChange(e.target.value)}
                        placeholder="3999"
                        style={{ padding: "8px 10px", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "0.74rem",
                        color: "#10B981",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="badge badge-emerald"
                        style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                      >
                        {discountPercent}% OFF
                      </span>
                      <span>
                        Students save ₹{mrpPriceNum - offerPriceNum} on this
                        batch!
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload & Fit Options */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "var(--text-secondary)",
                      }}
                    >
                      📸 Course Thumbnail / Banner Image *
                    </label>
                    <span
                      className="badge badge-amber"
                      style={{ fontSize: "0.66rem", padding: "1px 6px" }}
                    >
                      MAX 2MB
                    </span>
                  </div>

                  {thumbnailPreview || thumbnailUrl ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "80px",
                            height: "48px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            background: "#0B0F19",
                            flexShrink: 0,
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          <img
                            src={thumbnailPreview || thumbnailUrl}
                            alt="Selected Banner"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: thumbnailFit,
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: "700",
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {thumbnailFile
                              ? thumbnailFile.name
                              : "Course Banner Attached"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginTop: "2px",
                            }}
                          >
                            {thumbnailFile
                              ? `${(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB • `
                              : ""}
                            <span
                              style={{
                                color:
                                  thumbnailFit === "contain"
                                    ? "#10B981"
                                    : "#3B82F6",
                                fontWeight: "700",
                              }}
                            >
                              {thumbnailFit === "contain"
                                ? "📐 Full Image Fit (No Crop)"
                                : "🖼️ Full Frame Fill (Cover)"}
                            </span>
                          </div>
                        </div>
                        <label
                          htmlFor="change-banner-file-input"
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Change File
                          <input
                            id="change-banner-file-input"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={onThumbnailFileChange}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>

                      {/* Display Fit Toggle */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: "8px",
                          borderTop: "1px solid var(--border-color)",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Display Fit Mode:
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setThumbnailFit("contain")}
                            style={{
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight:
                                thumbnailFit === "contain" ? "700" : "500",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background:
                                thumbnailFit === "contain"
                                  ? "#F59E0B"
                                  : "var(--bg-surface)",
                              color:
                                thumbnailFit === "contain"
                                  ? "#FFFFFF"
                                  : "var(--text-secondary)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            📐 Fit Full Image (No Crop)
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailFit("cover")}
                            style={{
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight:
                                thumbnailFit === "cover" ? "700" : "500",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background:
                                thumbnailFit === "cover"
                                  ? "#3B82F6"
                                  : "var(--bg-surface)",
                              color:
                                thumbnailFit === "cover"
                                  ? "#FFFFFF"
                                  : "var(--text-secondary)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            🖼️ Fill & Crop (Cover)
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        💡 <strong>"Fit Full Image"</strong> ensures all text,
                        dialogs, diagrams, and screenshot content remain 100%
                        visible without being cut off.
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="step4-thumbnail-input"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        border: "1px dashed var(--border-color)",
                        background: "var(--bg-card)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(245, 158, 11, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <UploadCloud size={22} style={{ color: "#F59E0B" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          Click to Select Course Thumbnail / Banner
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          JPG, PNG, WEBP up to 2MB (16:9 ratio recommended)
                        </div>
                      </div>
                      <span
                        className="btn-secondary"
                        style={{
                          fontSize: "0.74rem",
                          padding: "6px 12px",
                          pointerEvents: "none",
                          flexShrink: 0,
                        }}
                      >
                        Browse File
                      </span>
                      <input
                        id="step4-thumbnail-input"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={onThumbnailFileChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  )}
                </div>

                {/* Description */}
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
                    Course Description & Highlights *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Comprehensive batch covering syllabus, revision tests, and live doubt sessions..."
                    style={{
                      padding: "8px 10px",
                      fontSize: "0.82rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: REALISTIC LIVE STUDENT PREVIEW CARD */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "14px",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: "800",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Eye size={14} /> LIVE STUDENT STORE PREVIEW
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  {/* Banner Image Preview */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      maxHeight: "220px",
                      background: "#0B0F19",
                      borderRadius: "12px 12px 0 0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Blurred background layer for contain mode to prevent ugly borders */}
                    {thumbnailFit === "contain" &&
                      (thumbnailPreview || thumbnailUrl) && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${thumbnailPreview || thumbnailUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(20px) brightness(0.35)",
                            opacity: 0.65,
                            transform: "scale(1.2)",
                          }}
                        />
                      )}

                    <img
                      src={
                        thumbnailPreview ||
                        thumbnailUrl ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
                      }
                      alt="Preview"
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        objectFit: thumbnailFit,
                        zIndex: 1,
                        transition: "all 0.2s ease",
                      }}
                    />

                    {/* Translucent floating badges */}
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        display: "flex",
                        gap: "6px",
                        zIndex: 2,
                      }}
                    >
                      <span
                        className={
                          courseMode === "LIVE_ONLINE"
                            ? "badge badge-rose"
                            : "badge badge-primary"
                        }
                        style={{
                          fontSize: "0.64rem",
                          padding: "2px 8px",
                          fontWeight: "800",
                          backdropFilter: "blur(6px)",
                          background:
                            courseMode === "LIVE_ONLINE"
                              ? "rgba(225, 29, 72, 0.85)"
                              : "rgba(79, 70, 229, 0.85)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                      >
                        {courseMode === "LIVE_ONLINE"
                          ? "🔴 LIVE ONLINE"
                          : courseMode === "RECORDED_VIDEO"
                            ? "📹 RECORDED"
                            : "⚡ HYBRID"}
                      </span>
                      <span
                        className="badge badge-amber"
                        style={{
                          fontSize: "0.64rem",
                          padding: "2px 8px",
                          fontWeight: "700",
                          backdropFilter: "blur(6px)",
                          background: "rgba(217, 119, 6, 0.85)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                      >
                        {activeSubjects.length > 0
                          ? activeSubjects.length === 1
                            ? activeSubjects[0]
                            : `${activeSubjects.length} Subjects (${activeSubjects[0]}, +${activeSubjects.length - 1})`
                          : subjectName || "Subject"}
                      </span>
                    </div>

                    {/* Quick Fit Toggle on Preview */}
                    <button
                      type="button"
                      onClick={() =>
                        setThumbnailFit((prev) =>
                          prev === "contain" ? "cover" : "contain",
                        )
                      }
                      title="Click to toggle Full Image Fit vs Cover Fill"
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        zIndex: 2,
                        background: "rgba(0, 0, 0, 0.75)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.66rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backdropFilter: "blur(6px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      }}
                    >
                      {thumbnailFit === "contain" ? "📐 Full Fit" : "🖼️ Cover"}
                    </button>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        fontWeight: "600",
                      }}
                    >
                      {boardGrade || selectedBoardTitle} • {selectedStateName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        margin: "4px 0 6px 0",
                        lineHeight: 1.3,
                      }}
                    >
                      {title || "Course Batch Title Will Appear Here"}
                    </div>

                    {/* Deliverables Pills */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        margin: "8px 0",
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
                        📹 {inclusions.totalLectures || 40} Lectures
                      </span>
                      <span
                        style={{
                          background: "var(--bg-surface)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        📄 {inclusions.totalEbooks || 5} PDFs
                      </span>
                      <span
                        style={{
                          background: "var(--bg-surface)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        📝 {inclusions.totalMockTests || 10} Mock Tests
                      </span>
                    </div>

                    {/* Topics Snapshot */}
                    {syllabusTopics.length > 0 && (
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "#818CF8",
                          marginBottom: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Topics:{" "}
                        {syllabusTopics
                          .slice(0, 3)
                          .map((t) => `#${t}`)
                          .join(" ")}{" "}
                        {syllabusTopics.length > 3
                          ? `+${syllabusTopics.length - 3} more`
                          : ""}
                      </div>
                    )}

                    {/* Price & Mock Enroll Button */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "8px",
                        borderTop: "1px solid var(--border-color)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: "800",
                              color: "#10B981",
                            }}
                          >
                            ₹{offerPriceNum || 1499}
                          </span>
                          {mrpPriceNum > offerPriceNum && (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                textDecoration: "line-through",
                              }}
                            >
                              ₹{mrpPriceNum}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "var(--primary-gradient)",
                          color: "#FFF",
                          fontSize: "0.74rem",
                          fontWeight: "800",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          opacity: 0.95,
                        }}
                      >
                        Enroll Now
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. PINNED STICKY FOOTER (ALWAYS VISIBLE - NEVER CUT OFF!) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            flexShrink: 0,
          }}
        >
          <div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrev}
              disabled={currentStep === 1}
              style={{
                padding: "9px 18px",
                fontSize: "0.84rem",
                opacity: currentStep === 1 ? 0.4 : 1,
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>

          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              fontWeight: "600",
            }}
          >
            Step {currentStep} of 4:{" "}
            <span style={{ color: "var(--text-primary)" }}>
              {STEPS[currentStep - 1].title}
            </span>
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                style={{
                  padding: "9px 22px",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Continue: {STEPS[currentStep].title} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className={portalType === "ADMIN" ? "btn-rose" : "btn-emerald"}
                disabled={isSubmitting}
                style={{
                  padding: "10px 26px",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isSubmitting
                  ? "Publishing Course..."
                  : isEditMode
                    ? "💾 Save Course Changes"
                    : "🚀 Publish Course Live"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "1020px",
          width: "95vw",
          maxHeight: "88vh",
          height: "760px",
          padding: 0,
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {content}
      </div>
    </div>
  );
};
