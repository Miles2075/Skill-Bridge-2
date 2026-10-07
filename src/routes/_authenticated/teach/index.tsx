import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FilePlus,
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Save,
  Search,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { lmsClient } from "@/lib/lms-client";
import {
  type AssignmentSubmission,
  type EnrolledStudent,
  type VideoComment,
  type Quiz,
  type QuizAttempt,
  type AssignmentDefinition,
  type CourseLesson,
  getVideoComments,
  replyToComment,
} from "@/lib/lms-store";

export const Route = createFileRoute("/_authenticated/teach/")({
  component: TeachDashboardPage,
});

type InstructorNavView =
  | "dashboard"
  | "courses"
  | "create-course"
  | "content"
  | "assignments"
  | "assessments"
  | "students"
  | "submissions"
  | "analytics"
  | "profile"
  | "settings";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  teacher_id: string | null;
  price_inr: number;
  preview_minutes: number;
  video_url: string;
  hours?: number;
  status?: "published" | "draft" | "review";
};

const DEFAULT_COURSES: CourseRow[] = [
  {
    id: "c-ts",
    slug: "advanced-typescript",
    title: "Advanced TypeScript & Design Patterns",
    teacher_id: null,
    price_inr: 1299,
    preview_minutes: 5,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    hours: 18.5,
    status: "published",
  },
  {
    id: "c-react",
    slug: "react-performance",
    title: "React Performance & Architecture",
    teacher_id: null,
    price_inr: 1499,
    preview_minutes: 5,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    hours: 14.0,
    status: "published",
  },
  {
    id: "c-sys",
    slug: "system-design",
    title: "System Design Fundamentals",
    teacher_id: null,
    price_inr: 999,
    preview_minutes: 5,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    hours: 22.0,
    status: "published",
  },
  {
    id: "c-dsa",
    slug: "dsa",
    title: "Data Structures & Algorithms",
    teacher_id: null,
    price_inr: 799,
    preview_minutes: 5,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    hours: 26.5,
    status: "draft",
  },
];

interface LessonItem {
  id: string;
  courseSlug: string;
  title: string;
  duration: string;
  videoUrl: string;
  isPreview: boolean;
}

const DEFAULT_LESSONS: LessonItem[] = [
  {
    id: "les-1",
    courseSlug: "advanced-typescript",
    title: "Course Overview & Project Setup",
    duration: "12m",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isPreview: true,
  },
  {
    id: "les-2",
    courseSlug: "advanced-typescript",
    title: "Advanced Generic Constraints & Type Mappings",
    duration: "28m",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isPreview: false,
  },
  {
    id: "les-3",
    courseSlug: "advanced-typescript",
    title: "Distributive Conditional Types & Infer",
    duration: "34m",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isPreview: false,
  },
  {
    id: "les-4",
    courseSlug: "system-design",
    title: "Scale from Zero to 10M Users",
    duration: "25m",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isPreview: true,
  },
  {
    id: "les-5",
    courseSlug: "system-design",
    title: "Database Sharding & Consistent Hashing",
    duration: "42m",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isPreview: false,
  },
  {
    id: "les-6",
    courseSlug: "react-performance",
    title: "React Profiler & Flamegraphs Deep Dive",
    duration: "30m",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    isPreview: true,
  },
];

function TeachDashboardPage() {
  const { user, isTeacher, isAdmin } = useAuth();
  const displayName =
    (user?.user_metadata?.["display_name"] as string) ||
    user?.email?.split("@")[0] ||
    "Faculty Lead";

  // URL-synced view state
  const [currentView, setCurrentView] = useState<InstructorNavView>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("view") as InstructorNavView;
      if (p) setCurrentView(p);
    }

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get("view") as InstructorNavView;
      setCurrentView(p || "dashboard");
    };
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ view: InstructorNavView }>;
      if (custom.detail?.view) {
        setCurrentView(custom.detail.view);
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("teach_view_changed", handleCustomChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("teach_view_changed", handleCustomChange);
    };
  }, []);

  const switchView = (v: InstructorNavView) => {
    setCurrentView(v);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("teach_view_changed", { detail: { view: v } }));
    }
  };

  // State
  const [rows, setRows] = useState<CourseRow[]>(DEFAULT_COURSES);
  const [lessons, setLessons] = useState<LessonItem[]>(DEFAULT_LESSONS);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [assignmentDefs, setAssignmentDefs] = useState<AssignmentDefinition[]>([]);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedContentCourse, setSelectedContentCourse] = useState("advanced-typescript");

  // Grading modal state
  const [gradingSub, setGradingSub] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(95);
  const [gradeStatus, setGradeStatus] = useState<"approved" | "needs_revision">("approved");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  // Create Course Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPrice, setNewPrice] = useState(999);
  const [newPreview, setNewPreview] = useState(5);
  const [newHours, setNewHours] = useState(16);
  const [newVideoUrl, setNewVideoUrl] = useState(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  );
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [isUploadingCourseVideo, setIsUploadingCourseVideo] = useState(false);
  const [newStatus, setNewStatus] = useState<"published" | "draft">("published");

  // Create Assignment Form State
  const [newAsgTitle, setNewAsgTitle] = useState("");
  const [newAsgCourse, setNewAsgCourse] = useState("advanced-typescript");
  const [newAsgDue, setNewAsgDue] = useState("2026-11-01");
  const [newAsgMaxScore, setNewAsgMaxScore] = useState(100);
  const [newAsgDesc, setNewAsgDesc] = useState("");

  // Create Quiz Form State
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizCourse, setNewQuizCourse] = useState("advanced-typescript");
  const [newQuizDuration, setNewQuizDuration] = useState(15);
  const [newQuizPass, setNewQuizPass] = useState(80);
  const [newQuizDesc, setNewQuizDesc] = useState("");
  const [newQText, setNewQText] = useState("");
  const [newQOpt1, setNewQOpt1] = useState("");
  const [newQOpt2, setNewQOpt2] = useState("");
  const [newQOpt3, setNewQOpt3] = useState("");
  const [newQOpt4, setNewQOpt4] = useState("");
  const [newQCorrect, setNewQCorrect] = useState(0);

  // Add Lesson State
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("20m");
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState("");
  const [newLessonVideoFile, setNewLessonVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [newLessonOrder, setNewLessonOrder] = useState<number>(0);
  const [newLessonRequired, setNewLessonRequired] = useState(true);
  const [newLessonPreview, setNewLessonPreview] = useState(false);

  // Load Data
  const loadInstructorData = async () => {
    try {
      const data = await lmsClient.getInstructorData();
      if (data.courses?.length > 0) {
        setRows(data.courses as CourseRow[]);
      }
      setStudents(data.students as unknown as EnrolledStudent[]);
      setSubmissions(data.submissions as unknown as AssignmentSubmission[]);
      setQuizzes(data.quizzes as unknown as Quiz[]);
      setAssignmentDefs(data.assignments as unknown as AssignmentDefinition[]);
    } catch (e) {
      console.error("Failed to load instructor data:", e);
    }
  };

  const loadLessons = async (slug: string) => {
    try {
      const { lessons: courseLessons } = await lmsClient.getCourse(slug);
      if (courseLessons?.length > 0) {
        setLessons(
          courseLessons.map((l) => ({
            id: l.id,
            courseSlug: slug,
            title: l.title,
            duration: l.duration,
            videoUrl: l.video_url,
            isPreview: l.is_preview,
          })),
        );
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadInstructorData();
    loadLessons(selectedContentCourse);

    const handleUpdate = () => {
      loadInstructorData();
      loadLessons(selectedContentCourse);
    };
    window.addEventListener("lms_data_updated", handleUpdate);
    return () => {
      window.removeEventListener("lms_data_updated", handleUpdate);
    };
  }, [selectedContentCourse]);

  // Handlers
  const updateRow = (id: string, patch: Partial<CourseRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveCourse = async (row: CourseRow) => {
    setMsg(null);
    try {
      await lmsClient.updateCourse(row.id, {
        price_inr: row.price_inr,
        preview_minutes: row.preview_minutes,
        video_url: row.video_url.trim(),
        hours: row.hours,
        status: row.status,
      });

      // also sync to Supabase courses table
      await supabase
        .from("courses")
        .update({
          price_inr: row.price_inr,
          preview_minutes: row.preview_minutes,
          video_url: row.video_url.trim(),
        })
        .eq("id", row.id)
        .then(undefined, () => {});

      setMsg({ text: `Saved updates for "${row.title}" successfully!` });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to update course",
        isError: true,
      });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      setMsg({ text: "Please enter course title and slug.", isError: true });
      return;
    }

    try {
      setIsUploadingCourseVideo(Boolean(newVideoFile));
      const { course } = await lmsClient.createCourse({
        title: newTitle.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        price_inr: newPrice,
        preview_minutes: newPreview,
        video_url:
          newVideoUrl.trim() ||
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        hours: newHours,
        status: newStatus,
        instructor: displayName,
      });

      let createdCourse = course as unknown as CourseRow;

      if (newVideoFile) {
        const uploaded = await lmsClient.uploadVideo(createdCourse.id, newVideoFile);
        const updated = await lmsClient.updateCourse(createdCourse.id, {
          video_url: uploaded.videoUrl,
        });
        createdCourse = updated.course as unknown as CourseRow;
      }

      setRows((prev) => [createdCourse, ...prev]);
      setNewTitle("");
      setNewSlug("");
      setNewVideoFile(null);
      setMsg({
        text: `Course "${createdCourse.title}" successfully created and saved!`,
      });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      switchView("courses");
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to create course",
        isError: true,
      });
    } finally {
      setIsUploadingCourseVideo(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle.trim() || !newAsgDesc.trim()) {
      setMsg({ text: "Please fill in assignment title and description.", isError: true });
      return;
    }

    try {
      await lmsClient.saveAssignment({
        courseId: newAsgCourse,
        title: newAsgTitle.trim(),
        description: newAsgDesc.trim(),
        dueDate: newAsgDue,
        maxScore: newAsgMaxScore,
      });

      setNewAsgTitle("");
      setNewAsgDesc("");
      setMsg({ text: `Assignment "${newAsgTitle}" created and published to students!` });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      await loadInstructorData();
      switchView("assignments");
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to create assignment",
        isError: true,
      });
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim() || !newQText.trim()) {
      setMsg({ text: "Please fill in quiz title and at least one question.", isError: true });
      return;
    }

    try {
      await lmsClient.saveQuiz({
        courseId: newQuizCourse,
        title: newQuizTitle.trim(),
        description: newQuizDesc.trim() || "Test your understanding of key topics.",
        durationMinutes: newQuizDuration,
        passPercentage: newQuizPass,
        questions: [
          {
            id: 1,
            question: newQText.trim(),
            options: [
              newQOpt1.trim() || "Option A",
              newQOpt2.trim() || "Option B",
              newQOpt3.trim() || "Option C",
              newQOpt4.trim() || "Option D",
            ],
            correct_option: newQCorrect,
            explanation: "Verified by lead faculty author.",
            marks: 100,
          },
        ],
      });

      setNewQuizTitle("");
      setNewQText("");
      setMsg({ text: `Assessment quiz "${newQuizTitle}" created successfully!` });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      await loadInstructorData();
      switchView("assessments");
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to create quiz",
        isError: true,
      });
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    try {
      setIsUploadingVideo(Boolean(newLessonVideoFile));
      let videoUrl = newLessonVideoUrl.trim();

      if (newLessonVideoFile) {
        const uploaded = await lmsClient.uploadVideo(selectedContentCourse, newLessonVideoFile);
        videoUrl = uploaded.videoUrl;
      }

      const { lesson } = await lmsClient.addLesson(selectedContentCourse, {
        title: newLessonTitle.trim(),
        duration: newLessonDuration.trim(),
        videoUrl: videoUrl || undefined,
        lessonOrder: newLessonOrder > 0 ? newLessonOrder : undefined,
        isRequired: newLessonRequired,
        isPreview: newLessonPreview,
      });

      setLessons((prev) => [
        ...prev,
        {
          id: lesson.id,
          courseSlug: selectedContentCourse,
          title: lesson.title,
          duration: lesson.duration,
          videoUrl: lesson.video_url,
          isPreview: lesson.is_preview,
        },
      ]);
      setNewLessonTitle("");
      setNewLessonVideoUrl("");
      setNewLessonVideoFile(null);
      setNewLessonOrder(0);
      setMsg({ text: `Lesson "${lesson.title}" added to syllabus!` });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to add lesson",
        isError: true,
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleOpenGrading = (sub: AssignmentSubmission) => {
    setGradingSub(sub);
    setGradeScore(sub.score ?? 95);
    setGradeStatus(sub.status === "needs_revision" ? "needs_revision" : "approved");
    setGradeFeedback(sub.feedback ?? "Code adheres to architectural standards and passes tests.");
  };

  const handleSaveGrade = async () => {
    if (!gradingSub) return;
    try {
      await lmsClient.gradeSubmission(gradingSub.id, gradeScore, gradeFeedback, gradeStatus);
      setGradingSub(null);
      setMsg({ text: `Recorded score (${gradeScore}/100) for ${gradingSub.studentName}.` });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      await loadInstructorData();
    } catch (err: unknown) {
      setMsg({
        text: err instanceof Error ? err.message : "Failed to save grade",
        isError: true,
      });
    }
  };

  // Metrics
  const totalRevenue = students.reduce((acc, s) => acc + (s.pricePaidInr || 0), 0);
  const totalStudents = new Set(students.map((s) => s.studentId)).size;
  const pendingAssignments = submissions.filter((s) => s.status === "pending").length;
  const publishedCount = rows.filter((r) => r.status !== "draft").length;
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const avgCompletion = students.length
    ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)
    : 0;

  // Filtered lists
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesCourse = selectedCourseFilter === "all" || s.courseSlug === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const filteredSubmissions = submissions.filter((s) => {
    if (submissionFilter === "pending") return s.status === "pending";
    if (submissionFilter === "approved") return s.status === "approved";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {msg && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs font-medium ${
            msg.isError
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-teal-50 text-teal-800 border border-teal-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.isError ? (
              <AlertCircle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-teal-700" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: DASHBOARD (PRIMARY INSTRUCTOR OPERATIONS DESK) */}
      {/* ------------------------------------------------------------- */}
      {currentView === "dashboard" && (
        <div className="space-y-6">
          {/* Executive Header Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Faculty Operations Hub
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Welcome, {displayName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage curriculum assets, evaluate student project submissions, and monitor revenue
                velocity.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchView("create-course")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <PlusCircle className="size-3.5" />
                <span>Create Course</span>
              </button>
              <button
                onClick={() => switchView("assignments")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Layers className="size-3.5 text-teal-700" />
                <span>Create Assignment</span>
              </button>
              <button
                onClick={() => switchView("submissions")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <span>Review Submissions ({pendingAssignments})</span>
              </button>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Courses</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="text-emerald-700 font-semibold">{publishedCount} Published</span>
                <span>·</span>
                <span>{draftCount} Draft</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Enrolled Students</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalStudents}</p>
              <span className="text-[11px] text-teal-700 font-medium">
                {avgCompletion}% avg completion
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Pending Review Queue</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{pendingAssignments}</p>
              <span
                className={`text-[11px] font-bold ${pendingAssignments > 0 ? "text-amber-700" : "text-emerald-700"}`}
              >
                {pendingAssignments > 0 ? "Requires grading" : "All reviews caught up"}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Gross Tuition Revenue</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-emerald-700 font-medium">+18.4% this cycle</span>
            </div>
          </div>

          {/* Review Queue Spotlight & Quick Grading */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-4 text-teal-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Submissions Requiring Faculty Evaluation
                </h3>
              </div>
              <button
                onClick={() => switchView("submissions")}
                className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                Open Full Workbench ({submissions.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {submissions
                .filter((s) => s.status === "pending")
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{sub.studentName}</span>
                        <span className="text-slate-400">({sub.studentEmail})</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-teal-700 font-semibold">{sub.courseTitle}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {sub.assignmentTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.githubUrl && (
                        <a
                          href={sub.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" /> Code Repo
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="rounded-lg bg-teal-700 text-white px-3 py-1 text-xs font-bold hover:bg-teal-800 cursor-pointer"
                      >
                        Grade Now
                      </button>
                    </div>
                  </div>
                ))}
              {submissions.filter((s) => s.status === "pending").length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No submissions currently awaiting review. All student projects are graded.
                </p>
              )}
            </div>
          </div>

          {/* Quick Roster Activity Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-teal-700" />
                <h3 className="font-bold text-sm text-slate-900">Recent Student Cohort Activity</h3>
              </div>
              <button
                onClick={() => switchView("students")}
                className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                View All Students ({students.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-500 font-medium">
                  <tr>
                    <th className="pb-2">Learner</th>
                    <th className="pb-2">Course</th>
                    <th className="pb-2">Progress</th>
                    <th className="pb-2">Last Active</th>
                    <th className="pb-2 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.slice(0, 4).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{s.studentName}</td>
                      <td className="py-2.5 text-teal-700 font-medium">{s.courseTitle}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-700 rounded-full"
                              style={{ width: `${s.progress}%` }}
                            />
                          </div>
                          <span className="font-semibold">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-500">{s.lastActive}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{s.pricePaidInr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: COURSE MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {currentView === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Course Portfolio & Pricing</h1>
              <p className="text-xs text-slate-500">
                Configure pricing in ₹ INR, free preview minutes, total duration hours, and video
                streams.
              </p>
            </div>
            <button
              onClick={() => switchView("create-course")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800 cursor-pointer"
            >
              <PlusCircle className="size-3.5" /> Create Course
            </button>
          </div>

          <div className="grid gap-4">
            {rows.map((row) => (
              <div
                key={row.id || row.slug}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-teal-700 uppercase font-mono">
                        {row.slug}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.status === "draft" ? "Draft Mode" : "Published Live"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{row.title}</h3>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => saveCourse(row)}
                    className="self-start bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Save className="size-3.5" /> Save Changes
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Fee (₹ INR)</label>
                    <Input
                      type="number"
                      min={1}
                      value={row.price_inr}
                      onChange={(e) =>
                        updateRow(row.id, { price_inr: Math.max(1, Number(e.target.value)) })
                      }
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Preview Limit (0–30 min)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={row.preview_minutes}
                      onChange={(e) =>
                        updateRow(row.id, {
                          preview_minutes: Math.min(30, Math.max(0, Number(e.target.value))),
                        })
                      }
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Duration (Hours)
                    </label>
                    <Input
                      type="number"
                      step={0.5}
                      min={1}
                      value={row.hours ?? 18}
                      onChange={(e) =>
                        updateRow(row.id, { hours: Math.max(1, Number(e.target.value)) })
                      }
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Publication Status
                    </label>
                    <select
                      value={row.status || "published"}
                      onChange={(e) =>
                        updateRow(row.id, { status: e.target.value as "published" | "draft" })
                      }
                      className="w-full h-8.5 rounded-md border border-slate-200 bg-white px-2 text-xs"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft Mode</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Video Stream Master Asset URL
                  </label>
                  <Input
                    value={row.video_url}
                    onChange={(e) => updateRow(row.id, { video_url: e.target.value })}
                    className="text-xs font-mono"
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: CREATE COURSE */}
      {/* ------------------------------------------------------------- */}
      {currentView === "create-course" && (
        <div className="space-y-6 max-w-2xl">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Author New Curriculum Course</h1>
            <p className="text-xs text-slate-500">
              Publish a new engineering course with pricing, preview lockouts, and lecture videos.
            </p>
          </div>

          <form
            onSubmit={handleCreateCourse}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4 text-xs"
          >
            <div>
              <label className="font-bold text-slate-700 block mb-1">Course Title</label>
              <Input
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!newSlug)
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
                placeholder="e.g., Cloud Native Microservices Architecture"
                className="text-xs"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                URL Identifier / Course Slug
              </label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g., cloud-native-microservices"
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (₹ INR)</label>
                <Input
                  type="number"
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Preview Limit (Min)</label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={newPreview}
                  onChange={(e) => setNewPreview(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Hours</label>
                <Input
                  type="number"
                  step={0.5}
                  min={1}
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Upload Course Video (Optional)
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700">
                <Upload className="size-4" />
                <span>{newVideoFile ? newVideoFile.name : "Choose video file"}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                  className="hidden"
                  onChange={(e) => setNewVideoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="mt-1 text-[10px] text-slate-400">MP4, WebM, MOV or M4V · max 500 MB</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Or Use Video Stream URL (Optional)
              </label>
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Publication State</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as "published" | "draft")}
                className="w-full h-8.5 rounded-md border border-slate-200 bg-white px-2 text-xs"
              >
                <option value="published">Publish Immediately to Catalog</option>
                <option value="draft">Save as Draft (Private)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => switchView("courses")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUploadingCourseVideo}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer disabled:opacity-60"
              >
                {isUploadingCourseVideo ? "Uploading video…" : "Publish Course"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: COURSE CONTENT & LESSONS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "content" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Manage Course Content & Lessons
              </h1>
              <p className="text-xs text-slate-500">
                Add lecture videos, configure syllabus sequence, and assign free preview status.
              </p>
            </div>

            <select
              value={selectedContentCourse}
              onChange={(e) => setSelectedContentCourse(e.target.value)}
              className="h-8.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
            >
              {rows.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Existing Lessons List */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Curriculum Lesson Sequence</h3>
              {lessons
                .filter((l) => l.courseSlug === selectedContentCourse)
                .map((les, idx) => (
                  <div
                    key={les.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-6 place-items-center rounded bg-slate-100 font-bold text-xs text-slate-600">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{les.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Duration: {les.duration}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        les.isPreview ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {les.isPreview ? "Free Preview" : "Paywalled"}
                    </span>
                  </div>
                ))}
            </div>

            {/* Add Lesson Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs h-fit space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Add New Lesson</h3>
              <form onSubmit={handleAddLesson} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lesson Title</label>
                  <Input
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="e.g., Cache Eviction Algorithms"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Duration (e.g. 25m)
                  </label>
                  <Input
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Upload Video (Optional)
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700">
                    <Upload className="size-4" />
                    <span>
                      {newLessonVideoFile ? newLessonVideoFile.name : "Choose video file"}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                      className="hidden"
                      onChange={(e) => setNewLessonVideoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="mt-1 text-[10px] text-slate-400">
                    MP4, WebM, MOV or M4V · max 500 MB
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Video / Content URL (Optional)
                  </label>
                  <Input
                    value={newLessonVideoUrl}
                    onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/...mp4"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Lesson Order (Leave 0 for automatic)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newLessonOrder || ""}
                    onChange={(e) => setNewLessonOrder(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 1"
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiredCheck"
                    checked={newLessonRequired}
                    onChange={(e) => setNewLessonRequired(e.target.checked)}
                    className="size-4 text-teal-700 rounded"
                  />
                  <label htmlFor="requiredCheck" className="text-slate-700 font-medium">
                    Required for Course Completion
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="previewCheck"
                    checked={newLessonPreview}
                    onChange={(e) => setNewLessonPreview(e.target.checked)}
                    className="size-4 text-teal-700 rounded"
                  />
                  <label htmlFor="previewCheck" className="text-slate-700 font-medium">
                    Mark as Free Preview
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isUploadingVideo}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {isUploadingVideo ? "Uploading video…" : "Add Lesson to Syllabus"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 5: ASSIGNMENTS MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {currentView === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Course Assignments & Milestones
              </h1>
              <p className="text-xs text-slate-500">
                Design coding assignments, specify rubrics, and inspect student submission counts.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Active Assignments */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Published Assignments</h3>
              <div className="space-y-3">
                {assignmentDefs.map((asg) => (
                  <div
                    key={asg.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-700">{asg.courseTitle}</span>
                      <span className="text-slate-500 font-semibold">Due: {asg.dueDate}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{asg.description}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Max Marks: <strong>{asg.maxScore}</strong>
                      </span>
                      <button
                        onClick={() => switchView("submissions")}
                        className="font-bold text-teal-700 hover:underline cursor-pointer"
                      >
                        Grade Submissions →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Assignment Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs h-fit space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Create New Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course</label>
                  <select
                    value={newAsgCourse}
                    onChange={(e) => setNewAsgCourse(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  >
                    {rows.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Assignment Title
                  </label>
                  <Input
                    value={newAsgTitle}
                    onChange={(e) => setNewAsgTitle(e.target.value)}
                    placeholder="e.g., Implement Distributed Locks"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                    <Input
                      type="date"
                      value={newAsgDue}
                      onChange={(e) => setNewAsgDue(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Max Score</label>
                    <Input
                      type="number"
                      value={newAsgMaxScore}
                      onChange={(e) => setNewAsgMaxScore(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Rubric & Instructions
                  </label>
                  <Textarea
                    rows={3}
                    value={newAsgDesc}
                    onChange={(e) => setNewAsgDesc(e.target.value)}
                    placeholder="State requirements, starter repositories, and scoring criteria..."
                    className="text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
                >
                  Publish Assignment
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 6: ASSESSMENTS / QUIZZES */}
      {/* ------------------------------------------------------------- */}
      {currentView === "assessments" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">
              Assessments & Quizzes Management
            </h1>
            <p className="text-xs text-slate-500">
              Construct timed multiple-choice skill assessments and view cohort pass rates.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Existing Quizzes */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Active Course Quizzes</h3>
              <div className="grid gap-4">
                {quizzes.map((q) => {
                  const attempts = quizAttempts.filter((a) => a.quizId === q.id);
                  const passCount = attempts.filter((a) => a.passed).length;
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-700">{q.courseTitle}</span>
                        <span className="text-slate-500 font-semibold">
                          {q.durationMinutes} mins · {q.questions.length} Questions
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{q.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{q.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Attempts: <strong>{attempts.length}</strong> · Pass Rate:{" "}
                          <strong>
                            {attempts.length
                              ? Math.round((passCount / attempts.length) * 100)
                              : 100}
                            %
                          </strong>
                        </span>
                        <span className="font-bold text-emerald-700">
                          Pass Mark: {q.passPercentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create Quiz Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs h-fit space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900">Create New Assessment</h3>
              <form onSubmit={handleCreateQuiz} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Course</label>
                  <select
                    value={newQuizCourse}
                    onChange={(e) => setNewQuizCourse(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  >
                    {rows.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quiz Title</label>
                  <Input
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    placeholder="e.g., Redis Sliding Window Caching Quiz"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Duration (min)
                    </label>
                    <Input
                      type="number"
                      value={newQuizDuration}
                      onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pass %</label>
                    <Input
                      type="number"
                      value={newQuizPass}
                      onChange={(e) => setNewQuizPass(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sample Question</label>
                  <Input
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="What data structure best supports LRU eviction?"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    value={newQOpt1}
                    onChange={(e) => setNewQOpt1(e.target.value)}
                    placeholder="Option A: Hash Map + Doubly Linked List"
                    className="text-xs"
                  />
                  <Input
                    value={newQOpt2}
                    onChange={(e) => setNewQOpt2(e.target.value)}
                    placeholder="Option B: Binary Search Tree"
                    className="text-xs"
                  />
                  <Input
                    value={newQOpt3}
                    onChange={(e) => setNewQOpt3(e.target.value)}
                    placeholder="Option C: Min Heap"
                    className="text-xs"
                  />
                  <Input
                    value={newQOpt4}
                    onChange={(e) => setNewQOpt4(e.target.value)}
                    placeholder="Option D: FIFO Queue"
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
                >
                  Publish Quiz
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 7: STUDENTS ROSTER */}
      {/* ------------------------------------------------------------- */}
      {currentView === "students" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Student Enrollment Ledger</h1>
              <p className="text-xs text-slate-500">
                Track active students, progress percentages, completed lectures, and certificate
                records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Filter student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="h-8.5 pl-8 text-xs w-44"
                />
              </div>

              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="h-8.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
              >
                <option value="all">All Cohorts</option>
                {rows.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Learner</th>
                  <th className="px-4 py-3">Certificates Earned</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Lessons Done</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Completed At</th>
                  <th className="px-4 py-3">Assignments</th>
                  <th className="px-4 py-3">Quizzes</th>
                  <th className="px-4 py-3">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.studentName}</div>
                        <div className="text-[11px] text-slate-500">{s.studentEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          {
                            students.filter(
                              (item) => item.studentId === s.studentId && item.certificateEarned,
                            ).length
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-teal-800">{s.courseTitle}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-700 rounded-full"
                              style={{ width: `${s.progress}%` }}
                            />
                          </div>
                          <span className="font-bold">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {s.completedLessons ?? s.completedLectures ?? 0} /{" "}
                        {s.totalRequiredLessons ?? s.totalLectures ?? 3}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.progress >= 100 || s.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.progress >= 100 || s.status === "completed"
                            ? "Completed"
                            : "In Progress"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {s.assignmentStatus || "No submissions"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {s.quizStatus || "No quizzes"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {s.certificateEarned || s.certificateId ? (
                          <span className="text-amber-700 font-bold">
                            {s.certificateId || "Earned"}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                      No student enrollments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 8: SUBMISSIONS & GRADING WORKBENCH */}
      {/* ------------------------------------------------------------- */}
      {currentView === "submissions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Grading Workbench & Submissions
              </h1>
              <p className="text-xs text-slate-500">
                Evaluate student repositories, assign rubric marks, and publish feedback.
              </p>
            </div>

            <div className="flex gap-1.5">
              {(["all", "pending", "approved"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSubmissionFilter(filter)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer ${
                    submissionFilter === filter
                      ? "bg-teal-700 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{sub.studentName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{sub.studentEmail}</span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`font-bold ${
                          sub.status === "approved"
                            ? "text-emerald-700"
                            : sub.status === "needs_revision"
                              ? "text-red-700"
                              : "text-amber-700"
                        }`}
                      >
                        {sub.status === "approved"
                          ? `Approved (${sub.score}/${sub.maxScore})`
                          : sub.status === "needs_revision"
                            ? "Needs Revision"
                            : "Pending Review"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {sub.assignmentTitle}
                    </h3>
                    <p className="text-xs font-semibold text-teal-800">{sub.courseTitle}</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenGrading(sub)}
                    className="self-start bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer"
                  >
                    {sub.status === "pending" ? "Launch Rubric Grading" : "Edit Grade"}
                  </Button>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Submitted Architecture Summary:
                  </span>
                  <p className="leading-relaxed">{sub.solutionNotes}</p>
                  {sub.githubUrl && (
                    <a
                      href={sub.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"
                    >
                      <ExternalLink className="size-3" /> Inspect Code Repository
                    </a>
                  )}
                </div>

                {sub.feedback && (
                  <div className="mt-3 rounded-xl bg-teal-50/70 border border-teal-200 p-3 text-xs text-teal-900">
                    <span className="font-bold">Faculty Review Notes: </span>
                    <span>{sub.feedback}</span>
                    {sub.gradedBy && (
                      <span className="block mt-1 text-[11px] text-teal-700 font-semibold">
                        Signed: {sub.gradedBy}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 9: ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "analytics" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">
              Financial Ledger & Cohort Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Gross revenue breakdown, enrollment velocity, and completion outputs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Gross Revenue per Curriculum Asset
              </h3>
              <div className="space-y-3 text-xs">
                {rows.map((course) => {
                  const courseStudents = students.filter((s) => s.courseSlug === course.slug);
                  const rev = courseStudents.reduce((acc, s) => acc + s.pricePaidInr, 0);
                  return (
                    <div
                      key={course.slug}
                      className="flex items-center justify-between border-b border-slate-100 pb-2.5"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{course.title}</p>
                        <p className="text-slate-500 text-[11px]">
                          {courseStudents.length} students · ₹{course.price_inr} unit fee
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-teal-800">
                        ₹{rev.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Academic Output Statistics</h3>
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Curriculum Completion Ratio</span>
                  <span className="font-bold text-teal-800">{avgCompletion}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${avgCompletion}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                <div className="rounded-xl border border-slate-200 p-4">
                  <span className="text-slate-500 font-medium">Diplomas Issued</span>
                  <p className="mt-1 text-2xl font-extrabold text-amber-600">
                    {students.filter((s) => s.certificateEarned).length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <span className="text-slate-500 font-medium">Graded Projects</span>
                  <p className="mt-1 text-2xl font-extrabold text-teal-700">
                    {submissions.filter((s) => s.status === "approved").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 10: PROFILE */}
      {/* ------------------------------------------------------------- */}
      {currentView === "profile" && (
        <div className="space-y-6 max-w-3xl">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Faculty Profile</h1>
            <p className="text-xs text-slate-500">
              Change your profile picture and display name. These details appear throughout the
              Instructor Studio.
            </p>
          </div>

          {user && (
            <ProfileEditor
              user={user}
              accent="teal"
              roleLabel="Verified Faculty Lead & Department Chair"
            />
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-slate-500">Faculty Role</span>
              <p className="mt-1 font-bold text-slate-900">
                Senior Systems Architecture Instructor
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-slate-500">Department</span>
              <p className="mt-1 font-bold text-slate-900">
                Software Systems & Distributed Computing
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------- */}
      {/* VIEW 11: SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "settings" && (
        <div className="space-y-6 max-w-2xl">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Faculty Settings</h1>
            <p className="text-xs text-slate-500">
              Configure grading alerts, payouts, and certificate automation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="font-bold text-slate-900">Appearance</p>
                <p className="text-slate-500 mt-0.5">
                  Switch between the light and dark Skillbridge theme.
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Immediate Submission Alerts</p>
                <p className="text-slate-500 mt-0.5">
                  Email whenever a student submits a repository milestone.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="size-4 text-teal-700 rounded" />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Automatic Certificate Generation</p>
                <p className="text-slate-500 mt-0.5">
                  Issue cryptographic diploma IDs when a student reaches 100% completion.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="size-4 text-teal-700 rounded" />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                onClick={() => setMsg({ text: "Faculty preferences updated successfully!" })}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GRADING DIALOG */}
      {/* ------------------------------------------------------------- */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-xs p-4 font-sans text-slate-900">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Evaluate Student Submission</h3>
              <p className="text-xs text-teal-700 mt-0.5">
                {gradingSub.assignmentTitle} · {gradingSub.studentName}
              </p>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Verdict</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGradeStatus("approved")}
                    className={`rounded-lg border p-2.5 font-bold transition-all cursor-pointer ${
                      gradeStatus === "approved"
                        ? "border-teal-700 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Approve Submission
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeStatus("needs_revision")}
                    className={`rounded-lg border p-2.5 font-bold transition-all cursor-pointer ${
                      gradeStatus === "needs_revision"
                        ? "border-red-600 bg-red-50 text-red-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    ⚠ Request Revision
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Assigned Score (0–100)</span>
                  <span className="font-extrabold text-teal-800">{gradeScore} / 100</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeScore}
                  onChange={(e) =>
                    setGradeScore(Math.min(100, Math.max(0, Number(e.target.value))))
                  }
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Faculty Feedback & Architectural Notes
                </label>
                <Textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Detail suggestions, code refactoring advice, and performance observations..."
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3 text-xs">
              <Button variant="outline" size="sm" onClick={() => setGradingSub(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveGrade}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
              >
                Record Grade & Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
