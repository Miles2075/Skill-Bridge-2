import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  FileCheck,
  Flame,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Loader2,
  Play,
  Printer,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { lmsClient, type StudentDashboardData } from "@/lib/lms-client";
import type { StudentNavView } from "./route";

import { CodeLabView } from "@/components/student/CodeLabView";
import { RecallDecksView } from "@/components/student/RecallDecksView";
import { FocusStudioView } from "@/components/student/FocusStudioView";
import { ProfileEditor } from "@/components/ProfileEditor";

import tsThumb from "@/assets/course-typescript.jpg";
import reactThumb from "@/assets/course-react.jpg";
import systemThumb from "@/assets/course-system-design.jpg";
import dsaThumb from "@/assets/course-dsa.jpg";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboardPage,
});

function getCourseImage(slug: string): string {
  if (slug === "advanced-typescript") return tsThumb;
  if (slug === "react-performance") return reactThumb;
  if (slug === "system-design") return systemThumb;
  if (slug === "dsa") return dsaThumb;
  return tsThumb;
}

interface ActiveQuizState {
  id: string;
  title: string;
  courseTitle?: string;
  course_id?: string;
  courseSlug?: string;
  durationMinutes?: number;
  passPercentage?: number;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctIndex?: number;
  }>;
}

interface QuizResultState {
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

function StudentDashboardPage() {
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.["display_name"] as string) || user?.email?.split("@")[0] || "Student";
  const email = user?.email || "student@example.com";

  // Navigation View State
  const [currentView, setCurrentView] = useState<StudentNavView>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("view") as StudentNavView;
      if (p) {
        setCurrentView(p);
      } else {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab === "courses" || tab === "assignments" || tab === "certificates") {
          setCurrentView(tab);
        }
      }
    }

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get("view") as StudentNavView;
      setCurrentView(p || "dashboard");
    };
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ view: StudentNavView }>;
      if (custom.detail?.view) {
        setCurrentView(custom.detail.view);
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("student_view_changed", handleCustomChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("student_view_changed", handleCustomChange);
    };
  }, []);

  const switchView = (v: StudentNavView) => {
    setCurrentView(v);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("student_view_changed", { detail: { view: v } }));
    }
  };

  // Real Database Data State
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Submitting Assignment Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<
    StudentDashboardData["upcomingAssignments"][0] | null
  >(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [solutionNotes, setSolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quiz Attempt Player State
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuizState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResultModal, setQuizResultModal] = useState<QuizResultState | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Certificate Modal State
  const [selectedCert, setSelectedCert] = useState<{
    id?: string;
    certificate_id?: string;
    title?: string;
    course_title?: string;
    instructor?: string;
    completion_date?: string;
  } | null>(null);

  // Course Filter Tab State
  const [courseFilter, setCourseFilter] = useState<"all" | "in_progress" | "completed">("all");

  // Course Player State
  const [playerCourse, setPlayerCourse] = useState<
    StudentDashboardData["enrolledCourses"][0] | null
  >(null);
  const [playerLessons, setPlayerLessons] = useState<
    Array<{
      id: string;
      course_id: string;
      title: string;
      description: string;
      video_url: string;
      duration: string;
      lesson_order: number;
      is_required: boolean;
      is_preview: boolean;
      completed: boolean;
    }>
  >([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [markingLesson, setMarkingLesson] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await lmsClient.getStudentDashboard();
      setData(res);
    } catch (err: unknown) {
      console.error("Failed to load student dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
    const handleUpdate = () => loadDashboard();
    window.addEventListener("lms_data_updated", handleUpdate);
    return () => window.removeEventListener("lms_data_updated", handleUpdate);
  }, [loadDashboard]);

  // Load lessons for playerCourse
  useEffect(() => {
    if (!playerCourse) {
      setPlayerLessons([]);
      setActiveLessonIndex(0);
      return;
    }
    let mounted = true;
    const fetchLessons = async () => {
      setLoadingLessons(true);
      try {
        const { lessons, lessonProgress } = await lmsClient.getCourse(playerCourse.slug);
        if (mounted) {
          const completedIds = new Set(
            (lessonProgress || []).filter((p) => p.completed).map((p) => p.lesson_id),
          );
          const enriched = (lessons || []).map((l) => ({
            ...l,
            completed: completedIds.has(l.id),
          }));
          setPlayerLessons(enriched);
          const firstIncompleteIdx = enriched.findIndex((l) => !l.completed);
          setActiveLessonIndex(firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0);
        }
      } catch (err) {
        console.error("Failed to fetch course lessons:", err);
      } finally {
        if (mounted) setLoadingLessons(false);
      }
    };
    fetchLessons();
    return () => {
      mounted = false;
    };
  }, [playerCourse]);

  // Check URL query param for course
  useEffect(() => {
    if (typeof window !== "undefined" && data?.enrolledCourses?.length) {
      const param = new URLSearchParams(window.location.search).get("course");
      if (param) {
        const match = data.enrolledCourses.find((c) => c.slug === param || c.id === param);
        if (match) {
          setPlayerCourse(match);
        }
      }
    }
  }, [data]);

  const handleMarkLessonComplete = async () => {
    if (!playerCourse) return;
    const activeLesson = playerLessons[activeLessonIndex];
    if (!activeLesson) return;

    setMarkingLesson(true);
    try {
      const res = await lmsClient.completeLesson(playerCourse.slug, activeLesson.id, true);
      setPlayerLessons((prev) =>
        prev.map((l, idx) => (idx === activeLessonIndex ? { ...l, completed: true } : l)),
      );
      setFeedbackMsg({
        text: `Lesson "${activeLesson.title}" marked complete! Progress: ${res.progress}%${
          res.isCompleted ? " — All required lessons completed! Certificate unlocked!" : ""
        }`,
      });
      window.dispatchEvent(new Event("lms_data_updated"));
      await loadDashboard();

      // If there is a next lesson, advance to it
      if (activeLessonIndex < playerLessons.length - 1) {
        setActiveLessonIndex((prev) => prev + 1);
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : "Failed to record lesson completion.",
        error: true,
      });
    } finally {
      setMarkingLesson(false);
    }
  };

  // Handlers
  const handleOpenSubmit = (asg: StudentDashboardData["upcomingAssignments"][0]) => {
    setSelectedAssignment(asg);
    setGithubUrl("");
    setSolutionNotes("");
    setSubmitModalOpen(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !data) return;
    if (!solutionNotes.trim()) {
      setFeedbackMsg({ text: "Please provide a solution summary or notes.", error: true });
      return;
    }

    setSubmitting(true);
    try {
      const courseObj = data.enrolledCourses.find(
        (c) => c.slug === selectedAssignment.courseSlug || c.title === selectedAssignment.course,
      );
      const courseId = courseObj?.id || selectedAssignment.courseSlug;

      await lmsClient.submitAssignment({
        assignmentId: selectedAssignment.id,
        courseId,
        githubUrl: githubUrl.trim(),
        solutionNotes: solutionNotes.trim(),
        maxScore: selectedAssignment.maxScore,
        studentName: displayName,
        studentEmail: email,
      });

      setSubmitModalOpen(false);
      setFeedbackMsg({
        text: `Assignment "${selectedAssignment.title}" submitted successfully for instructor evaluation!`,
      });
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      await loadDashboard();
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : "Failed to submit assignment",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Quiz Handling
  const handleStartQuiz = async (q: StudentDashboardData["studentQuizzes"][0]) => {
    try {
      const res = await lmsClient.getInstructorData().catch(() => null);
      const fullQuiz = res?.quizzes?.find((item) => item.id === q.id);
      if (fullQuiz && fullQuiz.questions?.length > 0) {
        setActiveQuiz(fullQuiz);
      } else {
        // Fallback simple quiz structure
        setActiveQuiz({
          id: q.id,
          title: q.title,
          course_id: q.courseSlug,
          courseTitle: q.course,
          durationMinutes: q.durationMinutes,
          passPercentage: q.passPercentage,
          questions: [
            {
              id: 1,
              question: "What is the primary benefit of compile-time type verification?",
              options: [
                "Catching runtime bugs before shipping to production",
                "Increasing file size",
                "Slowing down the browser",
                "Bypassing CSS rules",
              ],
              correctIndex: 0,
            },
            {
              id: 2,
              question: "Which data structure provides O(1) average lookup time?",
              options: [
                "Hash Table / Map",
                "Linked List",
                "Binary Search Tree",
                "Array Linear Scan",
              ],
              correctIndex: 0,
            },
          ],
        });
      }
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
    } catch {
      setFeedbackMsg({ text: "Could not open quiz.", error: true });
    }
  };

  const handleSelectAnswer = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleFinishQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await lmsClient.submitQuiz(
        activeQuiz.id,
        activeQuiz.course_id || activeQuiz.courseSlug || "",
        selectedAnswers,
        displayName,
        email,
      );
      setActiveQuiz(null);
      setQuizResultModal(
        (res as { attempt?: QuizResultState }).attempt || {
          quizTitle: activeQuiz.title,
          score: 80,
          totalMarks: 100,
          percentage: 80,
          passed: true,
          completedAt: new Date().toISOString(),
        },
      );
      window.dispatchEvent(new CustomEvent("lms_data_updated"));
      await loadDashboard();
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : "Failed to record quiz submission",
        error: true,
      });
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const enrolledCourses = data?.enrolledCourses || [];
  const inProgressCourses = enrolledCourses.filter((c) => c.progress < 100);
  const currentContinueCourse = inProgressCourses[0] || enrolledCourses[0] || null;
  const overallProgress = data?.overallProgress ?? 0;
  const upcomingAssignments = data?.upcomingAssignments || [];
  const studentQuizzes = data?.studentQuizzes || [];
  const grades = data?.grades || [];
  const certificates = data?.certificates || [];

  if (loading && !data) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-xs text-muted-foreground font-medium">
        Syncing student records and curriculum progress…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs font-medium ${
            feedbackMsg.error
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-indigo-50 text-indigo-900 border border-indigo-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.error ? (
              <AlertCircle className="size-4 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-indigo-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: DASHBOARD (PRIMARY LEARNER HUB) */}
      {/* ------------------------------------------------------------- */}
      {currentView === "dashboard" && (
        <div className="space-y-6">
          {/* Welcome Greeting */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md mb-3 border border-white/10">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Verified Learner Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {displayName}!
              </h1>
              <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
                {enrolledCourses.length > 0
                  ? "Track your real course progress, complete required lessons, submit assignments, and earn official certificates."
                  : "You have not enrolled in any courses yet. Browse the catalog to start learning."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {currentContinueCourse ? (
                  <button
                    onClick={() => setPlayerCourse(currentContinueCourse)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50 transition-all shadow-sm cursor-pointer"
                  >
                    <Play className="size-3.5 fill-indigo-900 text-indigo-900" />
                    <span>Resume: {currentContinueCourse.title}</span>
                  </button>
                ) : (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50 transition-all shadow-sm cursor-pointer"
                  >
                    <BookOpen className="size-3.5 text-indigo-900" />
                    <span>Browse Course Catalog</span>
                  </Link>
                )}

                <button
                  onClick={() => switchView("assignments")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer"
                >
                  <Layers className="size-3.5" />
                  <span>Assignments ({upcomingAssignments.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Enrolled Courses</span>
                <div className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{enrolledCourses.length}</span>
                <span className="text-xs text-slate-500 font-medium">
                  {data?.inProgressCoursesCount || 0} in progress
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Overall Progress</span>
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{overallProgress}%</span>
                <span className="text-xs text-slate-500 font-medium">
                  Across all enrolled courses
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Completed Courses</span>
                <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {data?.completedCoursesCount || 0}
                </span>
                <span className="text-xs text-slate-500 font-medium">100% finished</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Certificates Earned</span>
                <div className="grid size-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  <Award className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{certificates.length}</span>
                <span className="text-xs text-slate-500 font-medium">Verified credentials</span>
              </div>
            </div>
          </div>

          {/* Features Coursera & Udemy Lack for Real Retention */}
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-2xs">
                  <Sparkles className="size-3 text-amber-300" />
                  <span>Interactive Engineering Studio</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                  Features Coursera & Udemy Lack for Real Retention
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Break out of passive video consumption and tutorial hell. Write real runnable code
                  with automated unit tests, lock concepts into long-term memory with spaced recall,
                  and work distraction-free.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 justify-items-center gap-4 pt-1">
              {/* Feature 1: Hands-on Code Lab */}
              <div
                onClick={() => switchView("codelab")}
                className="rounded-xl border border-indigo-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="grid size-10 place-items-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Code2 className="size-5" />
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                      Live Sandbox
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Hands-on Code Lab
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Browser-based sandbox with instant code execution, console output, and automated
                    test runners to verify solutions.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Open Playground</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Feature 2: Smart Recall Decks */}
              <div
                onClick={() => switchView("recall")}
                className="rounded-xl border border-purple-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="grid size-10 place-items-center rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Brain className="size-5" />
                    </div>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100 whitespace-nowrap">
                      Spaced Repetition
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                    Smart Recall Decks
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Overcome the forgetting curve using scientifically proven Leitner flashcard
                    review queues and active retrieval practice.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
                  <span>Review Decks</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Feature 3: Focus & Pomodoro Studio */}
              <div
                onClick={() => switchView("focus")}
                className="rounded-xl border border-sky-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-sky-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="grid size-10 place-items-center rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <Timer className="size-5" />
                    </div>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100 whitespace-nowrap">
                      Deep Work
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                    Focus & Pomodoro Studio
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Built-in sprints, objective checklist, and procedural synthesized ambient audio
                    (rainfall, waves, white noise) for zero distractions.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>Start Sprint</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Continue Learning Course Hero */}
          {currentContinueCourse ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="size-4 text-indigo-600 fill-indigo-600" />
                  <h2 className="font-bold text-sm text-slate-900">Continue Learning</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {currentContinueCourse.lessonsDone} of {currentContinueCourse.lessonsTotal}{" "}
                  Lessons Completed
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-5 items-center">
                <img
                  src={getCourseImage(currentContinueCourse.slug)}
                  alt={currentContinueCourse.title}
                  className="w-full md:w-56 h-32 rounded-xl object-cover"
                />

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Next: {currentContinueCourse.nextLesson}
                    </span>
                    <span className="font-bold text-indigo-600">
                      {currentContinueCourse.progress}% Completed
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${currentContinueCourse.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Instructor:{" "}
                      <strong className="text-slate-700">{currentContinueCourse.instructor}</strong>{" "}
                      · {currentContinueCourse.hours} hrs total
                    </span>

                    <button
                      onClick={() => setPlayerCourse(currentContinueCourse)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      <Play className="size-3 fill-white" /> Continue Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <BookOpen className="size-8 mx-auto text-slate-400 mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">No courses enrolled yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Explore our industry-standard courses and enroll to start your learning journey.
              </p>
              <Link to="/">
                <Button
                  size="sm"
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  Browse Catalog
                </Button>
              </Link>
            </div>
          )}

          {/* Two-Column Layout: Upcoming Assignments & Quizzes */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Assignments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Upcoming Assignments</h3>
                </div>
                <button
                  onClick={() => switchView("assignments")}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.slice(0, 3).map((asg) => (
                    <div
                      key={asg.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{asg.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {asg.course} · Due {new Date(asg.due).toLocaleDateString()}
                        </p>
                      </div>

                      {asg.submissionStatus !== "unsubmitted" ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            asg.submissionStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {asg.submissionStatus === "approved" ? "✓ Graded" : "In Review"}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmit(asg)}
                          className="rounded-lg bg-indigo-600 text-white text-[11px] font-semibold px-2.5 py-1 hover:bg-indigo-700 cursor-pointer"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No assignments due at this time.
                  </p>
                )}
              </div>
            </div>

            {/* Assessment Quizzes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Skill Assessments & Quizzes</h3>
                </div>
                <button
                  onClick={() => switchView("assessments")}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  View Quizzes
                </button>
              </div>

              <div className="space-y-3">
                {studentQuizzes.length > 0 ? (
                  studentQuizzes.slice(0, 3).map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{q.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {q.questionsCount} Questions · {q.durationMinutes} min
                        </p>
                      </div>

                      {q.attemptCount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Score: {q.bestScore}/{q.totalMarks} ({q.passed ? "Passed" : "Retake"})
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(q)}
                          className="rounded-lg border border-indigo-200 bg-white text-indigo-600 text-[11px] font-semibold px-2.5 py-1 hover:bg-indigo-50 cursor-pointer"
                        >
                          Attempt Quiz
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No quizzes currently assigned.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: MY COURSES */}
      {/* ------------------------------------------------------------- */}
      {currentView === "courses" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">My Enrolled Courses</h1>
              <p className="text-xs text-slate-500">
                Track real lesson progress, complete modules, and resume video lectures.
              </p>
            </div>

            <div className="flex gap-1.5">
              {(["all", "in_progress", "completed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCourseFilter(filter)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    courseFilter === filter
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter === "all"
                    ? "All Courses"
                    : filter === "in_progress"
                      ? "In Progress"
                      : "Completed"}
                </button>
              ))}
            </div>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {enrolledCourses
                .filter((c) => {
                  if (courseFilter === "in_progress") return c.progress < 100;
                  if (courseFilter === "completed") return c.progress === 100;
                  return true;
                })
                .map((course) => (
                  <div
                    key={course.slug}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col"
                  >
                    <div className="relative h-44 w-full bg-slate-900">
                      <img
                        src={getCourseImage(course.slug)}
                        alt={course.title}
                        className="h-full w-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <span className="text-[10px] font-mono uppercase font-bold text-amber-300">
                          {course.instructor}
                        </span>
                        <h3 className="text-base font-bold text-white leading-tight drop-shadow-xs">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500">
                            Progress ({course.lessonsDone}/{course.lessonsTotal} Lessons)
                          </span>
                          <span className="font-bold text-indigo-600">{course.progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 flex items-center justify-between">
                        <span className="truncate pr-2">{course.nextLesson}</span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {course.hours} hrs
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setPlayerCourse(course)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          <Play className="size-3.5 fill-white" />
                          <span>
                            {course.progress === 100 ? "Review Lectures" : "Resume Course"}
                          </span>
                        </button>

                        {course.progress === 100 && (
                          <button
                            onClick={() =>
                              setSelectedCert({
                                certificate_id: course.certificateId || "CERT-VERIFIED",
                                title: course.title,
                                course_title: course.title,
                                instructor: course.instructor,
                                completion_date: course.completedAt || new Date().toISOString(),
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Award className="size-3.5 text-amber-500" />
                            <span>Certificate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <BookOpen className="size-10 mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-slate-900 text-sm">No courses enrolled yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Join thousands of students learning modern software engineering skills.
              </p>
              <Link to="/">
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  Browse Courses
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: ASSIGNMENTS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Assignments & Milestones</h1>
              <p className="text-xs text-slate-500">
                Submit project repositories for instructor code reviews and grading.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-indigo-700">{asg.course}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">
                          Due: {new Date(asg.due).toLocaleDateString()}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 font-semibold">
                          {asg.maxScore} Max Marks
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">{asg.description}</p>
                    </div>

                    <div className="self-start">
                      {asg.submissionStatus !== "unsubmitted" ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              asg.submissionStatus === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {asg.submissionStatus === "approved" ? "✓ Graded" : "In Review"}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmit(asg)}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Submit Solution
                        </button>
                      )}
                    </div>
                  </div>

                  {asg.score !== null && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        Score: {asg.score} / {asg.maxScore}
                      </span>
                      {asg.feedback && (
                        <span className="italic font-normal">Feedback: "{asg.feedback}"</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white">
                No assignments currently assigned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: ASSESSMENTS / QUIZZES */}
      {/* ------------------------------------------------------------- */}
      {currentView === "assessments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Skill Assessments & Quizzes</h1>
              <p className="text-xs text-slate-500">
                Benchmark your technical understanding with timed multiple-choice assessments.
              </p>
            </div>
          </div>

          {activeQuiz ? (
            /* Interactive Quiz Taker */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-indigo-600">
                    {activeQuiz.courseTitle}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{activeQuiz.title}</h2>
                </div>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Exit Quiz
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Question <strong>{currentQuestionIndex + 1}</strong> of{" "}
                  {activeQuiz.questions.length}
                </span>
                <span>Time Limit: {activeQuiz.durationMinutes || 15} mins</span>
              </div>

              {/* Question Body */}
              {(() => {
                const q = activeQuiz.questions[currentQuestionIndex];
                if (!q) return null;
                return (
                  <div className="space-y-4">
                    <p className="text-base font-semibold text-slate-900">{q.question}</p>

                    <div className="space-y-2.5">
                      {q.options.map((opt: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(q.id, idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            selectedAnswers[q.id] === idx
                              ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="mr-2 inline-block size-5 rounded-full border text-center leading-4 text-[11px]">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="cursor-pointer"
                >
                  Previous
                </Button>

                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={submittingQuiz}
                    onClick={handleFinishQuiz}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    {submittingQuiz ? "Evaluating…" : "Submit Assessment"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Quizzes List */
            <div className="grid gap-4 md:grid-cols-2">
              {studentQuizzes.length > 0 ? (
                studentQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-indigo-600">{q.course}</span>
                        <span className="text-slate-500">{q.durationMinutes} mins</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{q.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        {q.attemptCount > 0
                          ? `Completed (${q.bestScore}/${q.totalMarks})`
                          : `${q.questionsCount} Questions`}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleStartQuiz(q)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer"
                      >
                        {q.attemptCount > 0 ? "Retake Quiz" : "Start Quiz"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 bg-white">
                  No assessments configured yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW: HANDS-ON CODE LAB (SANDBOX & AUTOMATED TEST RUNNER) */}
      {/* ------------------------------------------------------------- */}
      {currentView === "codelab" && <CodeLabView />}

      {/* ------------------------------------------------------------- */}
      {/* VIEW: SMART RECALL DECKS (SPACED REPETITION ENGINE) */}
      {/* ------------------------------------------------------------- */}
      {currentView === "recall" && <RecallDecksView />}

      {/* ------------------------------------------------------------- */}
      {/* VIEW: FOCUS & POMODORO STUDIO (DEEP WORK ANTI-DISTRACTION) */}
      {/* ------------------------------------------------------------- */}
      {currentView === "focus" && <FocusStudioView />}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 5: PROGRESS ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "progress" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Course Progress & Analytics</h1>
            <p className="text-xs text-slate-500">
              Real completion metrics computed directly from recorded lesson completions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase">
                  Cumulative Completion
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  {overallProgress}% Total
                </h3>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Enrolled: {enrolledCourses.length}</p>
                <p>Completed: {data?.completedCoursesCount || 0}</p>
              </div>
            </div>

            <div className="space-y-4">
              {enrolledCourses.map((c) => (
                <div key={c.slug} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{c.title}</span>
                    <span className="font-semibold text-indigo-600">{c.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 6: GRADES / EVALUATION LEDGER */}
      {/* ------------------------------------------------------------- */}
      {currentView === "grades" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">
              Academic Grades & Evaluation Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Verified scores from instructors on submitted assignments and quizzes.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            {grades.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Course / Assessment</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Instructor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {grades.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{g.title}</div>
                        <div className="text-[11px] text-slate-500">{g.course}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">Assignment Project</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {g.score} / {g.maxScore}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{g.percentage}%</td>
                      <td className="px-4 py-3 text-slate-600 italic">
                        {g.feedback || "Good submission."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                <FileCheck className="size-8 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-700">No grades yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Submit course assignments to receive grades and feedback from your instructors.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 7: CERTIFICATES */}
      {/* ------------------------------------------------------------- */}
      {currentView === "certificates" && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Verified Course Certificates</h1>
            <p className="text-xs text-slate-500">
              Official digital credentials earned upon 100% completion of all required lessons.
            </p>
          </div>

          {certificates.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {certificates.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-6 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Award className="size-4 text-amber-500" /> Verified Credential
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {c.certificate_id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{c.course_title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Completed on {new Date(c.completion_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-100">
                    <span className="text-[11px] text-emerald-700 font-bold">
                      ✓ 100% Completion Verified
                    </span>
                    <button
                      onClick={() =>
                        setSelectedCert({
                          certificate_id: c.certificate_id,
                          title: c.course_title,
                          course_title: c.course_title,
                          instructor: "Faculty Board",
                          completion_date: c.completion_date,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      <Printer className="size-3.5" /> View Diploma
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Award className="size-10 mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-slate-900 text-sm">No certificates earned yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Certificates are unlocked when you reach 100% completion on all required lessons of
                a course.
              </p>
              <button
                onClick={() => switchView("courses")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Continue Learning
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 8: PROFILE */}
      {/* ------------------------------------------------------------- */}
      {currentView === "profile" && (
        <div className="space-y-6 max-w-3xl">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Student Profile</h1>
            <p className="text-xs text-slate-500">
              Change your profile picture and name. Your certificate count is shown below.
            </p>
          </div>

          {user && <ProfileEditor user={user} roleLabel="Active Student Scholar" />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-slate-500">Enrolled Courses</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {enrolledCourses.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-slate-500">Completed Courses</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {data?.completedCoursesCount || 0}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-2xs">
              <span className="text-emerald-700">Certificates Earned</span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                {data?.certificates.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 9: SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {currentView === "settings" && (
        <div className="space-y-6 max-w-2xl">
          <div className="border-b border-slate-200 pb-3">
            <h1 className="text-xl font-extrabold text-slate-900">Learning Settings</h1>
            <p className="text-xs text-slate-500">
              Account and notification preferences for your student session.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-900">Appearance</h4>
                <p className="text-slate-500 text-[11px]">
                  Switch between the light and dark Skillbridge theme.
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Assignment Notifications</h4>
                <p className="text-slate-500 text-[11px]">
                  Receive notifications when an instructor grades your submissions.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-600" />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <h4 className="font-bold text-slate-900">Auto-play Next Lesson</h4>
                <p className="text-slate-500 text-[11px]">
                  Advance to the next lecture automatically after completing a video.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {submitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-indigo-600">
                  {selectedAssignment.course}
                </span>
                <h3 className="font-bold text-base text-slate-900">{selectedAssignment.title}</h3>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  GitHub Repository URL
                </label>
                <Input
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Solution Notes & Implementation Summary *
                </label>
                <Textarea
                  placeholder="Describe your design choices, test results, and architecture..."
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  rows={4}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitModalOpen(false)}
                  className="w-1/2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  {submitting ? "Submitting…" : "Confirm Submission"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIZ RESULT MODAL */}
      {quizResultModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl space-y-4">
            <div
              className={`mx-auto grid size-12 place-items-center rounded-full ${
                quizResultModal.passed
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {quizResultModal.passed ? (
                <Award className="size-6" />
              ) : (
                <AlertCircle className="size-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {quizResultModal.passed ? "Assessment Passed!" : "Assessment Result"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You scored {quizResultModal.score} / {quizResultModal.totalMarks} (
                {quizResultModal.percentage}%)
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setQuizResultModal(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* DIPLOMA / CERTIFICATE MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border-4 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 p-8 shadow-2xl relative text-center">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500 text-white shadow-md mb-4">
              <Award className="size-8" />
            </div>

            <span className="text-[11px] font-mono tracking-widest font-extrabold text-amber-800 uppercase">
              Skillbridge Certificate of Completion
            </span>

            <h2 className="text-2xl font-black text-slate-900 mt-3">
              {selectedCert.title || selectedCert.course_title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">This officially certifies that</p>

            <div className="my-4 border-b-2 border-indigo-600 inline-block px-8 pb-1">
              <span className="text-xl font-bold text-indigo-900 font-serif">{displayName}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              has completed 100% of required curriculum lessons, passed all core competencies, and
              satisfied all program requirements.
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-amber-200 pt-4 text-[10px] text-slate-500 font-mono">
              <span>ID: {selectedCert.certificate_id}</span>
              <span>
                Issued: {new Date(selectedCert.completion_date || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT COURSE PLAYER MODAL */}
      {playerCourse && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Course Player
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">{playerCourse.title}</h2>
                <p className="text-xs text-slate-500">
                  {playerCourse.instructor} · {playerCourse.hours} hours · {playerCourse.progress}%
                  Completed
                </p>
              </div>
              <button
                onClick={() => setPlayerCourse(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingLessons ? (
              <div className="py-20 text-center text-xs text-slate-500">
                <Loader2 className="size-8 mx-auto animate-spin text-indigo-600 mb-2" />
                Loading course curriculum and lesson data…
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-5">
                {/* Left: Video Player and Lesson Info */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-md">
                    {playerLessons[activeLessonIndex]?.video_url || playerCourse.videoUrl ? (
                      <video
                        key={playerLessons[activeLessonIndex]?.id || activeLessonIndex}
                        src={playerLessons[activeLessonIndex]?.video_url || playerCourse.videoUrl}
                        poster={playerCourse.thumbnail}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={playerCourse.thumbnail}
                        alt={playerCourse.title}
                        className="h-full w-full object-cover opacity-80"
                      />
                    )}
                  </div>

                  {playerCourse.progress >= 100 && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Course Completed • 100%
                        Mastered
                      </span>
                      <button
                        onClick={() =>
                          setSelectedCert({
                            certificate_id: playerCourse.certificateId || "CERT-VERIFIED",
                            title: playerCourse.title,
                            course_title: playerCourse.title,
                            instructor: playerCourse.instructor,
                            completion_date: playerCourse.completedAt || new Date().toISOString(),
                          })
                        }
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Award className="size-3.5" /> View Certificate
                      </button>
                    </div>
                  )}

                  {playerLessons[activeLessonIndex] && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-indigo-600">
                            Lesson{" "}
                            {playerLessons[activeLessonIndex].lesson_order || activeLessonIndex + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            {playerLessons[activeLessonIndex].title}
                          </h3>
                          <span className="text-xs text-slate-500">
                            Duration: {playerLessons[activeLessonIndex].duration || "20m"}
                            {playerLessons[activeLessonIndex].is_required && " • Required"}
                          </span>
                        </div>

                        <div>
                          {playerLessons[activeLessonIndex].completed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              <Check className="size-3.5" /> Completed
                            </span>
                          ) : (
                            <Button
                              onClick={handleMarkLessonComplete}
                              disabled={markingLesson}
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 cursor-pointer"
                            >
                              {markingLesson ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              <span>Mark as Complete</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {playerLessons[activeLessonIndex].description && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
                          {playerLessons[activeLessonIndex].description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Lesson Syllabus List */}
                <div className="lg:col-span-2 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">
                      Curriculum Syllabus ({playerLessons.length} Lessons)
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {playerLessons.filter((l) => l.completed).length} / {playerLessons.length}{" "}
                      Completed
                    </span>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                    {playerLessons.map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIndex(idx)}
                        className={`flex w-full items-center gap-2.5 rounded-xl p-3 text-left text-xs transition-all cursor-pointer ${
                          idx === activeLessonIndex
                            ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-2xs"
                            : "hover:bg-slate-50 border border-transparent text-slate-700"
                        }`}
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                            lesson.completed
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-slate-500"
                          }`}
                        >
                          {lesson.completed ? <Check className="size-3" /> : idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{lesson.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {lesson.duration || "15m"}
                            {lesson.is_preview && " · Free Preview"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
