import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  completeLesson,
  getCourseLessons,
  getCourseById,
  getMyEnrollments,
  getMyLessonProgress,
  type Course,
  type Enrollment,
  type Lesson,
  type LessonProgress,
} from "@/lib/lms-supabase";

export const Route = createFileRoute("/_authenticated/student/learning")({
  component: MyLearningPage,
});

function MyLearningPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollments = useCallback(async () => {
    if (!user?.id) return;
    const enrollmentData = await getMyEnrollments(user.id);
    setEnrollments(enrollmentData);
    const courseEntries = await Promise.all(
      enrollmentData.map(
        async (enrollment) =>
          [enrollment.course_id, await getCourseById(enrollment.course_id)] as const,
      ),
    );
    setCourses(
      Object.fromEntries(
        courseEntries.filter((entry): entry is [string, Course] => Boolean(entry[1])),
      ),
    );
    if (!selectedCourseId && enrollmentData[0]) setSelectedCourseId(enrollmentData[0].course_id);
  }, [user?.id, selectedCourseId]);

  const loadCourseData = useCallback(
    async (courseId: string) => {
      if (!user?.id) return;
      const [lessonData, progressData] = await Promise.all([
        getCourseLessons(courseId),
        getMyLessonProgress(user.id, courseId),
      ]);
      setLessons(lessonData);
      setProgress(progressData);
      if (lessonData.length > 0) {
        setActiveLessonId((prev) =>
          prev && lessonData.some((l) => l.id === prev) ? prev : lessonData[0]!.id,
        );
      } else {
        setActiveLessonId(null);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    void loadEnrollments()
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your courses."))
      .finally(() => setLoading(false));

    const onLmsUpdated = () => {
      void loadEnrollments();
      if (selectedCourseId) void loadCourseData(selectedCourseId);
    };
    window.addEventListener("lms_data_updated", onLmsUpdated);
    return () => window.removeEventListener("lms_data_updated", onLmsUpdated);
  }, [user?.id, loadEnrollments, loadCourseData, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([]);
      setProgress([]);
      return;
    }
    setError(null);
    void loadCourseData(selectedCourseId).catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load course lessons."),
    );
  }, [selectedCourseId, loadCourseData]);

  async function handleComplete(lessonId: string) {
    setBusyLesson(lessonId);
    setError(null);
    try {
      await completeLesson(lessonId);
      if (selectedCourseId) await loadCourseData(selectedCourseId);
      await loadEnrollments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save lesson progress.");
    } finally {
      setBusyLesson(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-slate-900">No enrolled courses</h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse the catalog and enroll in a course to start learning.
        </p>
      </div>
    );
  }

  const selectedEnrollment = enrollments.find((item) => item.course_id === selectedCourseId);
  const completedLessonIds = new Set(
    progress.filter((item) => item.completed).map((item) => item.lesson_id),
  );
  const selectedCourse = selectedCourseId ? courses[selectedCourseId] : undefined;
  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const activeVideoUrl = activeLesson?.video_url || selectedCourse?.video_url;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Student Learning
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">My Courses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your enrollment and lesson completion are saved to your account.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {enrollments.map((enrollment) => {
            const course = courses[enrollment.course_id];
            const active = enrollment.course_id === selectedCourseId;
            return (
              <button
                key={enrollment.id}
                onClick={() => setSelectedCourseId(enrollment.course_id)}
                className={`w-full rounded-xl border p-4 text-left transition cursor-pointer ${active ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="font-semibold text-slate-900">{course?.title || "Course"}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{enrollment.status === "completed" ? "Completed" : "In progress"}</span>
                  <span>{enrollment.completion_percentage}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${enrollment.completion_percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {selectedCourse?.title || "Course"}
            </h2>
            <div className="mt-2 text-sm text-slate-500">
              {selectedEnrollment?.completion_percentage ?? 0}% complete ·{" "}
              {progress.filter((item) => item.completed).length}/
              {lessons.filter((lesson) => lesson.required).length || lessons.length || 3} required
              lessons
            </div>
          </div>

          {/* Embedded Video Player */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-600 truncate">
                {activeLesson
                  ? `Playing: ${activeLesson.lesson_order}. ${activeLesson.title}`
                  : `Course Lecture: ${selectedCourse?.title || ""}`}
              </span>
              <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                {activeVideoUrl ? "Stream Ready" : "No Video Asset"}
              </span>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-sm">
              {activeVideoUrl ? (
                <video
                  key={activeLesson?.id || selectedCourseId}
                  src={activeVideoUrl}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-slate-400">
                  <PlayCircle className="size-10 mb-2 opacity-60" />
                  <p className="text-sm">
                    Video stream is being uploaded or processed by the instructor.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Curriculum Lessons ({lessons.length})
            </h3>
            {lessons.map((lesson) => {
              const completed = completedLessonIds.has(lesson.id);
              const busy = busyLesson === lesson.id;
              const isCurrent = activeLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition ${isCurrent ? "border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  {completed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-slate-300" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-medium ${completed ? "text-slate-500 line-through" : "text-slate-900"} ${isCurrent ? "text-indigo-900 font-bold" : ""}`}
                      >
                        {lesson.lesson_order}. {lesson.title}
                      </h3>
                      {lesson.video_url && <PlayCircle className="size-4 text-indigo-500" />}
                      {isCurrent && (
                        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Now Playing
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="mt-1 text-xs text-slate-500">{lesson.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={completed ? "outline" : "default"}
                    disabled={completed || busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleComplete(lesson.id);
                    }}
                  >
                    {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                    {completed ? "Completed" : busy ? "Saving..." : "Complete"}
                  </Button>
                </div>
              );
            })}
            {lessons.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No lessons have been added to this course yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
