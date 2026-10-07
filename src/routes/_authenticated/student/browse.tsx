import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { createCourseOrder, verifyCoursePayment } from "@/lib/payments.functions";
import {
  enrollInCourse,
  getMyEnrollments,
  listPublishedCourses,
  type Course,
  type Enrollment,
} from "@/lib/lms-supabase";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}

export const Route = createFileRoute("/_authenticated/student/browse")({
  component: BrowseCoursesPage,
});

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BrowseCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCourse, setBusyCourse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const enrollmentByCourse = useMemo(
    () => new Map(enrollments.map((e) => [e.course_id, e])),
    [enrollments],
  );

  useEffect(() => {
    const studentId = user?.id;
    if (!studentId) return;
    let cancelled = false;
    async function load(currentStudentId: string) {
      setLoading(true);
      setError(null);
      try {
        const [courseData, enrollmentData] = await Promise.all([
          listPublishedCourses(),
          getMyEnrollments(currentStudentId),
        ]);
        if (!cancelled) {
          setCourses(courseData);
          setEnrollments(enrollmentData);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(studentId);
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function enrollFreeCourse(course: Course) {
    if (!user?.id) return;
    const enrollment = await enrollInCourse(user.id, course.id);
    setEnrollments((current) => [
      enrollment,
      ...current.filter((item) => item.id !== enrollment.id),
    ]);
    setMessage(`You're enrolled in ${course.title}.`);
    window.dispatchEvent(new CustomEvent("lms_data_updated"));
  }

  async function handleEnroll(course: Course) {
    if (!user?.id) return;
    setBusyCourse(course.id);
    setError(null);
    setMessage(null);
    try {
      if (course.price_inr <= 0) {
        await enrollFreeCourse(course);
        return;
      }

      const order = await createCourseOrder({ data: { courseId: course.id } });

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay)
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection and try again.",
        );

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Skillbridge",
          description: order.title,
          order_id: order.orderId,
          theme: { color: "#4f46e5" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyCoursePayment({
                data: {
                  courseId: course.id,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
              });
              await enrollFreeCourse(course);
              setMessage(`Payment successful. You're enrolled in ${course.title}.`);
              resolve();
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Payment verification failed."));
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        });
        checkout.open();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete payment.");
    } finally {
      setBusyCourse(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <BookOpen className="size-4" /> Course Catalog
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Browse Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Explore published courses and enroll in the ones you want to learn.
          </p>
        </div>
        <Link to="/student/learning">
          <Button variant="outline">My Courses</Button>
        </Link>
      </div>
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="size-6 animate-spin text-indigo-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BookOpen className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-3 font-semibold text-slate-900">No courses available yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Published courses will appear here when instructors make them available.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const enrollment = enrollmentByCourse.get(course.id);
            const isCompleted = enrollment?.status === "completed";
            const isBusy = busyCourse === course.id;
            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
                  <BookOpen className="size-12 opacity-80" />
                </div>
                <div className="p-5">
                  <h2 className="font-semibold leading-snug text-slate-900">{course.title}</h2>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {course.price_inr > 0 ? `₹${course.price_inr}` : "Free"}
                    </span>
                    <span>{course.preview_minutes} min preview</span>
                  </div>
                  {enrollment && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>{isCompleted ? "Completed" : "Your progress"}</span>
                        <span>{enrollment.completion_percentage}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${enrollment.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-5">
                    {enrollment ? (
                      <Link to="/student/learning" className="block">
                        <Button className="w-full">
                          {isCompleted ? "View Completed Course" : "Continue Learning"}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => void handleEnroll(course)}
                        disabled={isBusy}
                      >
                        {isBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        {isBusy
                          ? "Processing..."
                          : course.price_inr > 0
                            ? `Pay ₹${course.price_inr}`
                            : "Enroll Now"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
