import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createCourseOrder, verifyCoursePayment, getUserPurchases } from "@/lib/payments.functions";
import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  Info,
  Loader2,
  Lock,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  NotebookPen,
  Play,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UploadCloud,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { lmsClient, type ClientCourse, type StudentDashboardData } from "@/lib/lms-client";
import {
  type AssignmentSubmission,
  type VideoComment,
  getSubmissions,
  saveSubmission,
  getVideoComments,
  addVideoComment,
  syncStudentEnrollment,
} from "@/lib/lms-store";
import { StudentLayout, type StudentView } from "@/components/layouts/StudentLayout";
import { CodeLabView } from "@/components/student/CodeLabView";
import { RecallDecksView } from "@/components/student/RecallDecksView";
import { FocusStudioView } from "@/components/student/FocusStudioView";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tsThumb from "@/assets/course-typescript.jpg";
import reactThumb from "@/assets/course-react.jpg";
import systemThumb from "@/assets/course-system-design.jpg";
import dsaThumb from "@/assets/course-dsa.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Learning | Skillbridge" },
      {
        name: "description",
        content:
          "Browse courses, resume lectures, submit assignments and earn certificates on Skillbridge.",
      },
      { property: "og:title", content: "My Learning | Skillbridge" },
      {
        property: "og:description",
        content: "Online courses in TypeScript, React, system design and algorithms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Skillbridge,
});

type View = StudentView;

type Course = {
  id?: string;
  slug: string;
  title: string;
  instructor: string;
  description: string;
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
  nextLesson: string;
  level: string;
  hours: number;
  rating: number;
  reviews: string;
  learners: string;
  category: string;
  bestseller?: boolean;
  image: string;
  certificateId?: string;
};

const initialCourses: Course[] = [
  {
    slug: "advanced-typescript",
    title: "Advanced TypeScript & Design Patterns",
    instructor: "Sarah Chen",
    description:
      "Master the type system, generics and practical design patterns used in production codebases.",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 3,
    nextLesson: "1. Advanced Type Narrowing",
    level: "Advanced",
    hours: 18,
    rating: 4.8,
    reviews: "12,480",
    learners: "48,210",
    category: "Web Development",
    bestseller: true,
    image: tsThumb,
  },
  {
    slug: "react-performance",
    title: "React Performance & Architecture",
    instructor: "Marcus Webb",
    description:
      "Profile, memoise and structure large React applications that stay fast as they grow.",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 3,
    nextLesson: "1. Profiling Renders with React DevTools",
    level: "Intermediate",
    hours: 16,
    rating: 4.7,
    reviews: "8,932",
    learners: "31,764",
    category: "Web Development",
    image: reactThumb,
  },
  {
    slug: "system-design",
    title: "System Design Fundamentals",
    instructor: "Priya Raman",
    description:
      "Load balancing, caching, queues and databases — design systems that scale with confidence.",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 3,
    nextLesson: "1. High Availability & Load Balancing Strategies",
    level: "Intermediate",
    hours: 20,
    rating: 4.9,
    reviews: "15,207",
    learners: "62,905",
    category: "Software Architecture",
    bestseller: true,
    image: systemThumb,
  },
  {
    slug: "dsa",
    title: "Data Structures & Algorithms",
    instructor: "Daniel Okafor",
    description:
      "Core data structures, algorithmic patterns and complexity analysis for technical interviews.",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 3,
    nextLesson: "1. Arrays & Dynamic Resizing",
    level: "Intermediate",
    hours: 24,
    rating: 4.6,
    reviews: "21,338",
    learners: "84,120",
    category: "Computer Science",
    image: dsaThumb,
  },
];

const courses: Course[] = initialCourses;

const categories = [
  "Web Development",
  "Software Architecture",
  "Computer Science",
  "Data Science",
  "Cloud & DevOps",
];

const assignments = [
  {
    day: "18",
    month: "Sep",
    title: "Build a Redux Store",
    course: "React Performance & Architecture",
    due: "Due tomorrow",
    status: "Not submitted",
    urgent: true,
  },
  {
    day: "19",
    month: "Sep",
    title: "TypeScript Generics Exercise",
    course: "Advanced TypeScript & Design Patterns",
    due: "Due Saturday",
    status: "Not submitted",
    urgent: false,
  },
];

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "My Learning", icon: LayoutDashboard },
  { id: "courses", label: "All Courses", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "assessments", label: "Quizzes", icon: Target },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "analytics", label: "Progress", icon: BarChart3 },
];

const dashboardStats: { icon: LucideIcon; value: string; label: string; detail: string }[] = [
  { icon: GraduationCap, value: "4", label: "Enrolled courses", detail: "2 in progress" },
  { icon: Target, value: "—", label: "Average quiz score", detail: "Take your first quiz" },
  { icon: Award, value: "0", label: "Certificates", detail: "1 almost complete" },
  { icon: Clock3, value: "12.5h", label: "Learned this week", detail: "Goal 15h" },
];

type CourseMeta = { id: string; price: number; preview: number; videoUrl: string };
type Commerce = {
  meta: Record<string, CourseMeta>;
  owned: Set<string>;
  signedIn: boolean;
  user: ReturnType<typeof useAuth>["user"];
  isTeacher: boolean;
  buying: string | null;
  buy: (course: Course) => void;
  signOut: () => void;
  initials: string;
  firstName: string;
  courses: Course[];
  dashboardData: StudentDashboardData | null;
};
const CommerceContext = createContext<Commerce | null>(null);
const useCommerce = () => useContext(CommerceContext)!;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}
function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function useCommerceState(
  notify: (m: string, type?: "success" | "error" | "info") => void,
): Commerce {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<Record<string, CourseMeta>>({});
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<Course[]>(initialCourses);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const loadLmsProgress = useCallback(async () => {
    try {
      const studentDashboard = user
        ? await lmsClient.getStudentDashboard().catch(() => null)
        : null;
      setDashboardData(studentDashboard);

      const enrolledMap = new Map();
      if (studentDashboard?.enrolledCourses) {
        studentDashboard.enrolledCourses.forEach((enr) => {
          enrolledMap.set(enr.slug, enr);
          enrolledMap.set(enr.id, enr);
        });
      }

      setCoursesList((prev) =>
        prev.map((c) => {
          const enr = enrolledMap.get(c.slug) || (c.id ? enrolledMap.get(c.id) : undefined);
          if (enr) {
            return {
              ...c,
              progress: enr.progress,
              lessonsDone: enr.lessonsDone,
              lessonsTotal: enr.lessonsTotal,
              nextLesson: enr.nextLesson,
              certificateId: enr.certificateId || undefined,
            };
          }
          return {
            ...c,
            progress: 0,
            lessonsDone: 0,
            certificateId: undefined,
          };
        }),
      );
    } catch (e) {
      console.error("Failed to load LMS progress:", e);
    }
  }, [user]);

  useEffect(() => {
    loadLmsProgress();
    window.addEventListener("lms_data_updated", loadLmsProgress);
    return () => window.removeEventListener("lms_data_updated", loadLmsProgress);
  }, [loadLmsProgress]);

  const createOrder = useServerFn(createCourseOrder);
  const verify = useServerFn(verifyCoursePayment);
  const fetchPurchases = useServerFn(getUserPurchases);

  useEffect(() => {
    (async () => {
      try {
        const { courses: apiCourses } = await lmsClient.getCourses();
        const publishedCourses = apiCourses.filter((course) => course.status === "published");

        const imageForSlug = (slug: string) => {
          if (slug === "advanced-typescript") return tsThumb;
          if (slug === "react-performance" || slug === "react-perf") return reactThumb;
          if (slug === "system-design") return systemThumb;
          if (slug === "dsa") return dsaThumb;
          return tsThumb;
        };

        const dynamicCourses: Course[] = publishedCourses.map((course: ClientCourse) => ({
          id: course.id,
          slug: course.slug,
          title: course.title,
          instructor: course.instructor || "Lead Instructor",
          description: course.description || "Learn practical skills with Skillbridge.",
          progress: 0,
          lessonsDone: 0,
          lessonsTotal: 0,
          nextLesson: "Start your first lesson",
          level: course.level || "Intermediate",
          hours: course.hours || 10,
          rating: course.rating || 5,
          reviews: course.reviews || "0",
          learners: course.learners || "0",
          category: course.category || "Development",
          image: imageForSlug(course.slug),
          bestseller: course.bestseller,
        }));

        setCoursesList(dynamicCourses.length > 0 ? dynamicCourses : initialCourses);

        const next: Record<string, CourseMeta> = {};
        publishedCourses.forEach((course) => {
          next[course.slug] = {
            id: course.id,
            price: course.price_inr,
            preview: course.preview_minutes,
            videoUrl: course.video_url,
          };
        });

        if (next["react-performance"]) {
          next["react-perf"] = next["react-performance"];
        }
        if (next["react-perf"]) {
          next["react-performance"] = next["react-perf"];
        }

        setMeta(next);
      } catch (error) {
        console.error("Failed to load courses from LMS API:", error);
      }
    })();
  }, []);

  const [profileName, setProfileName] = useState("");
  useEffect(() => {
    if (!user) {
      setProfileName("");
      return;
    }
    (async () => {
      const { data } = (await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()) as unknown as { data: { display_name: string | null } | null };
      setProfileName(data?.display_name ?? "");
    })();
  }, [user]);

  const loadOwned = useCallback(async () => {
    if (!user) return setOwned(new Set());
    const localKey = `skillbridge_purchases_${user.id}`;
    let localIds: string[] = [];
    try {
      localIds = JSON.parse(localStorage.getItem(localKey) ?? "[]");
    } catch {
      // ignore
    }
    try {
      const ids = await fetchPurchases();
      const combined = Array.from(new Set([...ids, ...localIds]));
      setOwned(new Set(combined));
    } catch {
      const { data } = await supabase.from("purchases").select("course_id").eq("user_id", user.id);
      const dbIds = ((data ?? []) as { course_id: string }[]).map((p) => p.course_id);
      const combined = Array.from(new Set([...dbIds, ...localIds]));
      setOwned(new Set(combined));
    }
  }, [user, fetchPurchases]);

  useEffect(() => {
    loadOwned();
  }, [loadOwned]);

  const buy = async (course: Course) => {
    if (buying !== null) return;
    const m = meta[course.slug];
    if (!m) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setBuying(course.slug);
    try {
      const order = await createOrder({ data: { courseId: m.id } });

      if (!(await loadRazorpay()) || !window.Razorpay) {
        throw new Error(
          "Could not connect to payment gateway. Please check your internet connection.",
        );
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Skillbridge",
        description: order.title,
        prefill: { email: user.email },
        theme: { color: "#2563eb" },
        handler: async (r: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verify({
              data: {
                courseId: m.id,
                orderId: r.razorpay_order_id,
                paymentId: r.razorpay_payment_id,
                signature: r.razorpay_signature,
              },
            });

            // A verified payment must also create the LMS enrollment.
            // This is what makes the course appear in My Learning and unlocks its lessons.
            const displayName =
              (user.user_metadata?.["display_name"] as string | undefined) ||
              user.email?.split("@")[0] ||
              "Student Learner";
            await lmsClient.enroll(m.id, displayName, user.email || "");

            // Keep the purchase locally so the paid course remains unlocked after refresh.
            const localKey = `skillbridge_purchases_${user.id}`;
            try {
              const localIds: string[] = JSON.parse(localStorage.getItem(localKey) ?? "[]");
              if (!localIds.includes(m.id)) {
                localIds.push(m.id);
                localStorage.setItem(localKey, JSON.stringify(localIds));
              }
            } catch {
              // ignore localStorage failures; the LMS enrollment is already persisted.
            }

            setOwned((prev) => new Set([...prev, m.id]));
            await loadOwned();
            await loadLmsProgress();
            notify(`Payment confirmed! You now have full access to ${course.title}.`, "success");
          } catch (e) {
            console.error("Payment verification error:", e);
            notify(
              "Payment verification failed. Please contact support if you were debited.",
              "error",
            );
          } finally {
            setBuying(null);
          }
        },
        modal: {
          ondismiss: () => {
            setBuying(null);
          },
        },
      });

      rzp.on("payment.failed", (r: unknown) => {
        const resp = r as { error?: { description?: string } };
        console.warn("Razorpay payment failed:", resp);
        notify(
          resp?.error?.description || "Your payment was not completed. You have not been charged.",
          "error",
        );
        setBuying(null);
      });

      rzp.open();
    } catch (e: unknown) {
      console.error(e);
      let friendlyMsg = "We couldn't start checkout. Please try again in a moment.";
      const raw = e instanceof Error ? e.message : "";
      if (raw.includes("already own")) {
        friendlyMsg = "You already own this course. Enjoy learning!";
      } else if (raw.includes("not switched on")) {
        friendlyMsg = "Checkout is temporarily unavailable. Free previews are still active.";
      } else if (raw.includes("connection") || raw.includes("network")) {
        friendlyMsg = "Network error. Please check your connection and retry.";
      } else if (raw) {
        friendlyMsg = raw;
      }
      notify(friendlyMsg, "error");
      setBuying(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("sb-csjygxumpnonfupobhih-auth-token");
    setOwned(new Set());
    notify("Signed out");
    window.location.href = "/";
  };
  const name =
    profileName ||
    (user?.user_metadata?.["display_name"] as string | undefined) ||
    user?.email ||
    "";
  const initials =
    name
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]!.toUpperCase())
      .join("") || "U";
  const rawFirst = name.split(/[\s@.]/).filter(Boolean)[0] ?? "";
  const firstName = rawFirst ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1) : "";
  return {
    meta,
    owned,
    signedIn: !!user,
    user,
    isTeacher,
    buying,
    buy,
    signOut,
    initials,
    firstName,
    courses: coursesList,
    dashboardData,
  };
}

function PriceTag({ course }: { course: Course }) {
  const { meta, owned } = useCommerce();
  const m = meta[course.slug];
  if (!m) return null;
  if (owned.has(m.id))
    return (
      <span className="rounded bg-teal/15 px-2 py-0.5 text-[11px] font-bold text-teal">
        Purchased
      </span>
    );
  return <span className="text-lg font-extrabold">{rupees(m.price)}</span>;
}

function Stars({ rating, reviews }: { rating: number; reviews?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="font-bold text-orange">{rating.toFixed(1)}</span>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`size-3.5 ${i <= Math.round(rating) ? "fill-orange text-orange" : "text-border"}`}
          />
        ))}
      </span>
      {reviews && <span className="text-muted-foreground">({reviews})</span>}
    </div>
  );
}

function Progress({ value, thin = false }: { value: number; thin?: boolean }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-ink3 ${thin ? "h-1.5" : "h-2"}`}>
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Brand() {
  return (
    <button
      className="flex items-center gap-2"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className="grid size-8 place-items-center rounded bg-primary text-base font-extrabold text-primary-foreground">
        S
      </span>
      <span className="text-lg font-extrabold tracking-tight">skillbridge</span>
    </button>
  );
}

function MyLearning({
  openPlayer,
  onOpenCert,
}: {
  openPlayer: (course: Course) => void;
  onOpenCert: (course: Course) => void;
}) {
  const { meta, owned, courses } = useCommerce();
  const enrolledCourses = courses.filter((c) => {
    const m = meta[c.slug];
    return (m && owned.has(m.id)) || c.progress > 0;
  });

  return (
    <>
      <PageTitle
        title="My Learning & Course Progress"
        detail="Continue your courses, track your lecture completion, and enjoy unlimited lifetime video replay."
      />

      {enrolledCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 text-base font-bold">No active enrollments yet</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore our curriculum to start learning or enroll in a course.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {enrolledCourses.map((course) => {
            const isCompleted = course.progress >= 100;
            return (
              <div
                key={course.slug}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="relative aspect-video w-full overflow-hidden cursor-pointer"
                  onClick={() => openPlayer(course)}
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  {isCompleted && (
                    <div className="absolute top-2 right-2 rounded-full bg-teal/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                      ✓ Completed
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-base">{course.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Instructor: {course.instructor} • {course.hours} hours
                  </p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {course.lessonsDone} of {course.lessonsTotal} lectures
                      </span>
                      <span className="font-bold text-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} thin />
                  </div>

                  <div className="mt-5 flex flex-col gap-2">
                    <Button
                      variant={isCompleted ? "outline" : "chrome"}
                      className="w-full gap-2 text-xs"
                      onClick={() => openPlayer(course)}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="size-3.5" /> Re-watch Course (Lifetime Access)
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" /> Resume Learning
                        </>
                      )}
                    </Button>

                    {isCompleted && (
                      <Button
                        variant="ghost"
                        className="w-full gap-1.5 text-xs text-primary hover:bg-primary/10"
                        onClick={() => onOpenCert(course)}
                      >
                        <Award className="size-3.5 text-orange" /> View Official Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Skillbridge() {
  const [view, setView] = useState<StudentView>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("view");
      if (
        param === "dashboard" ||
        param === "courses" ||
        param === "my-learning" ||
        param === "assignments" ||
        param === "assessments" ||
        param === "notes" ||
        param === "certificates" ||
        param === "analytics" ||
        param === "codelab" ||
        param === "recall" ||
        param === "focus"
      ) {
        setView(param);
      }
    }
  }, []);

  const handleViewChange = (nextView: StudentView) => {
    setView(nextView);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", nextView);
      window.history.pushState({}, "", url.toString());
    }
  };

  const [modal, setModal] = useState<"assignment" | "quiz" | "certificate" | null>(null);
  const [certCourse, setCertCourse] = useState<Course | null>(null);
  const [targetAssignment, setTargetAssignment] = useState<{
    courseTitle: string;
    courseSlug: string;
    assignmentTitle: string;
  } | null>(null);
  const [player, setPlayer] = useState<Course | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const notify = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  };

  const commerce = useCommerceState(notify);

  useEffect(() => {
    if (typeof window !== "undefined" && commerce.courses?.length) {
      const courseParam = new URLSearchParams(window.location.search).get("course");
      if (courseParam) {
        const match = commerce.courses.find((c) => c.slug === courseParam || c.id === courseParam);
        if (match) {
          setPlayer(match);
        }
      }
    }
  }, [commerce.courses]);

  return (
    <CommerceContext.Provider value={commerce}>
      <StudentLayout
        view={view}
        setView={handleViewChange}
        signedIn={commerce.signedIn}
        isTeacher={commerce.isTeacher}
        initials={commerce.initials}
        firstName={commerce.firstName}
        signOut={commerce.signOut}
      >
        {view === "dashboard" && (
          <Dashboard
            setView={handleViewChange}
            setModal={setModal}
            openPlayer={setPlayer}
            onOpenCert={(c) => {
              setCertCourse(c);
              setModal("certificate");
            }}
          />
        )}
        {view === "courses" && <Courses openPlayer={setPlayer} />}
        {view === "my-learning" && (
          <MyLearning
            openPlayer={setPlayer}
            onOpenCert={(c) => {
              setCertCourse(c);
              setModal("certificate");
            }}
          />
        )}
        {view === "assignments" && (
          <Assignments
            open={(asg) => {
              setTargetAssignment(asg ?? null);
              setModal("assignment");
            }}
          />
        )}
        {view === "assessments" && <Assessments open={() => setModal("quiz")} />}
        {view === "codelab" && <CodeLabView />}
        {view === "recall" && <RecallDecksView />}
        {view === "focus" && <FocusStudioView />}
        {view === "notes" && <Notes notify={notify} />}
        {view === "certificates" && (
          <Certificates
            onOpenCert={(c) => {
              setCertCourse(c);
              setModal("certificate");
            }}
          />
        )}
        {view === "analytics" && <Analytics />}
        {modal === "assignment" && (
          <AssignmentModal
            targetAssignment={targetAssignment}
            close={() => {
              setModal(null);
              setTargetAssignment(null);
            }}
            notify={notify}
          />
        )}
        {modal === "quiz" && <QuizModal close={() => setModal(null)} notify={notify} />}
        {modal === "certificate" && certCourse && (
          <CertificateModal
            course={certCourse}
            close={() => {
              setModal(null);
              setCertCourse(null);
            }}
          />
        )}
        {player && (
          <PlayerModal
            course={player}
            close={() => setPlayer(null)}
            notify={notify}
            onOpenCert={(c) => {
              setCertCourse(c);
              setModal("certificate");
            }}
          />
        )}

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === "error"
                ? "border-destructive/40 bg-destructive text-destructive-foreground"
                : toast.type === "info"
                  ? "border-primary/40 bg-primary text-primary-foreground"
                  : "border-border bg-foreground text-background"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="size-4 shrink-0 text-red-300" />
            ) : toast.type === "info" ? (
              <Info className="size-4 shrink-0 text-sky-300" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </StudentLayout>
    </CommerceContext.Provider>
  );
}

function PageTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

function CourseCard({
  course,
  openPlayer,
  compact = false,
}: {
  course: Course;
  openPlayer: (course: Course) => void;
  compact?: boolean;
}) {
  const { meta, owned, buy, buying } = useCommerce();
  const m = meta[course.slug];
  const isOwned = !!m && owned.has(m.id);
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <button
        className="relative aspect-video w-full overflow-hidden"
        onClick={() => openPlayer(course)}
        aria-label={`Play ${course.title}`}
      >
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          width={1088}
          height={608}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 grid place-items-center bg-ink/35 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-card text-primary">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </span>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug">{course.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
        {!compact && <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>}
        <div className="mt-2">
          <Stars rating={course.rating} reviews={course.reviews} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {course.hours} total hours · {course.lessonsTotal} lectures · {course.level}
        </p>
        <div className="mt-2">
          <PriceTag course={course} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {course.bestseller && (
            <span className="rounded bg-orange/15 px-2 py-0.5 text-[11px] font-bold text-orange">
              Bestseller
            </span>
          )}
          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {course.category}
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {course.lessonsDone} of {course.lessonsTotal} lectures
            </span>
            <span className="font-semibold text-foreground">{course.progress}% complete</span>
          </div>
          <Progress value={course.progress} thin />
        </div>
        {isOwned || !m ? (
          <Button
            className="mt-4 w-full gap-2"
            variant={course.progress >= 100 ? "outline" : "chrome"}
            onClick={() => openPlayer(course)}
          >
            {course.progress >= 100 ? (
              <>
                <RotateCcw className="size-4" /> Re-watch Course (100% Done)
              </>
            ) : (
              <>
                <Play className="size-4" />{" "}
                {course.progress > 0 ? "Continue learning" : "Start course"}
              </>
            )}
          </Button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="console" onClick={() => openPlayer(course)}>
              <Play /> {m.preview > 0 ? `Watch ${m.preview} min free` : "Preview"}
            </Button>
            <Button variant="chrome" disabled={buying !== null} onClick={() => buy(course)}>
              {buying === course.slug ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Opening…</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" />
                  <span>Buy now</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function Dashboard({
  setView,
  setModal,
  openPlayer,
  onOpenCert,
}: {
  setView: (view: View) => void;
  setModal: (modal: "assignment" | "quiz") => void;
  openPlayer: (course: Course) => void;
  onOpenCert?: (course: Course) => void;
}) {
  const { firstName, courses, dashboardData } = useCommerce();
  const current = courses.find((c) => c.progress > 0 && c.progress < 100) || courses[0]!;

  const enrolledCount = dashboardData?.enrolledCourses.length ?? 0;
  const inProgressCount = dashboardData?.inProgressCoursesCount ?? 0;
  const certificatesCount = dashboardData?.certificates.length ?? 0;
  const overallProgress = dashboardData?.overallProgress ?? 0;

  const realDashboardStats: { icon: LucideIcon; value: string; label: string; detail: string }[] = [
    {
      icon: GraduationCap,
      value: `${enrolledCount}`,
      label: "Enrolled courses",
      detail: `${inProgressCount} in progress`,
    },
    {
      icon: TrendingUp,
      value: `${overallProgress}%`,
      label: "Overall progress",
      detail: "Across enrolled courses",
    },
    {
      icon: Award,
      value: `${certificatesCount}`,
      label: "Certificates",
      detail: "Verified credentials",
    },
    {
      icon: Clock3,
      value: `${Math.round(courses.reduce((acc, c) => acc + (c.progress > 0 ? c.hours : 0), 0))}h`,
      label: "Hours learned",
      detail: "Course curriculum",
    },
  ];

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-lg bg-violet text-white">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {firstName ? `Welcome back, ${firstName}` : "Welcome to Skillbridge"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Let's keep your learning streak alive
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {current.progress > 0
                ? `${100 - current.progress}% remaining to earn your certificate in ${current.title}.`
                : "Explore our curriculum and complete required lessons to earn official certificates."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="chrome"
              className="bg-white text-violet hover:bg-white/90"
              onClick={() => openPlayer(current)}
            >
              <Play /> {current.progress > 0 ? "Resume lecture" : "Start learning"}
            </Button>
            <Button
              variant="ghost"
              className="border border-white/40 text-white hover:bg-white/10"
              onClick={() => setView("courses")}
            >
              Browse courses
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-8 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col md:flex-row">
          <button
            className="relative aspect-video md:w-2/5"
            onClick={() => openPlayer(current)}
            aria-label="Resume course"
          >
            <img
              src={current.image}
              alt={current.title}
              width={1088}
              height={608}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-ink/30">
              <span className="grid size-14 place-items-center rounded-full bg-card text-primary">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
            </span>
          </button>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {current.progress > 0 ? "Pick up where you left off" : "Featured Course"}
              </p>
              <h2 className="mt-1 text-xl font-bold">{current.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Next lecture · {current.nextLesson}
              </p>
            </div>
            <div className="mt-6">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>
                  {current.lessonsDone} of {current.lessonsTotal} lectures complete
                </span>
                <span className="font-semibold text-foreground">{current.progress}%</span>
              </div>
              <Progress value={current.progress} />
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="chrome" onClick={() => openPlayer(current)}>
                  <Play /> {current.progress > 0 ? "Continue lecture" : "Start course"}
                </Button>
                <Button variant="console" onClick={() => setModal("quiz")}>
                  <Target /> Take quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {realDashboardStats.map(({ icon: Icon, value, label, detail }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Upcoming deadlines</h2>
            <button
              onClick={() => setView("assignments")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              See all
            </button>
          </div>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.title}
                className="flex items-center gap-3 rounded-md border border-border p-3"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary leading-none">
                  <span className="text-sm font-extrabold">{assignment.day}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {assignment.month}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{assignment.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{assignment.course}</p>
                </div>
                <span
                  className={`hidden text-xs font-semibold sm:block ${assignment.urgent ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {assignment.due}
                </span>
                <Button size="sm" variant="amber" onClick={() => setModal("assignment")}>
                  Submit
                </Button>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Practice quiz</h2>
          <div className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">TypeScript knowledge check</span>
              <span className="rounded bg-teal/15 px-2 py-0.5 text-[11px] font-bold text-teal">
                Ready
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              5 randomised questions · about 8 min
            </p>
            <Button className="mt-4 w-full" variant="chrome" onClick={() => setModal("quiz")}>
              Start quiz
            </Button>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Because you're learning TypeScript</h2>
          <button
            onClick={() => setView("courses")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all courses
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.slice(1).map((course) => (
            <CourseCard key={course.title} course={course} openPlayer={openPlayer} compact />
          ))}
        </div>
      </section>
    </>
  );
}

function Courses({ openPlayer }: { openPlayer: (course: Course) => void }) {
  const { courses } = useCommerce();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const shown = useMemo(
    () =>
      courses.filter(
        (course) =>
          `${course.title} ${course.description} ${course.instructor}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (category === "All" || course.category === category),
      ),
    [query, category, courses],
  );
  return (
    <>
      <PageTitle
        title="All courses"
        detail={`${courses.length} courses · taught by practising engineers`}
      />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses or instructors"
            className="bg-card pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${category === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No courses match that search.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((course) => (
            <CourseCard key={course.title} course={course} openPlayer={openPlayer} />
          ))}
        </div>
      )}
    </>
  );
}

function Assignments({
  open,
}: {
  open: (assignment?: { courseTitle: string; courseSlug: string; assignmentTitle: string }) => void;
}) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  useEffect(() => {
    setSubmissions(getSubmissions());
    const handleUpdate = () => setSubmissions(getSubmissions());
    window.addEventListener("lms_submissions_updated", handleUpdate);
    return () => window.removeEventListener("lms_submissions_updated", handleUpdate);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <PageTitle
            title="Assignments & Capstone Projects"
            detail="Submit your code solutions, get evaluated by faculty instructors, and track grading feedback."
          />
        </div>
        <Button
          variant="chrome"
          onClick={() => open()}
          className="self-start gap-2 text-xs font-bold"
        >
          <UploadCloud className="size-4" /> Upload New Assignment
        </Button>
      </div>

      {/* Available Course Projects */}
      <section className="mb-10">
        <h2 className="mb-3 text-base font-bold text-foreground">Available Course Assignments</h2>
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.title}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary leading-none">
                <span className="text-base font-extrabold">{assignment.day}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  {assignment.month}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{assignment.title}</h3>
                  {assignment.urgent && (
                    <span className="rounded bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
                      Due Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{assignment.course}</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Deadline: {assignment.due}
              </span>
              <Button
                variant="chrome"
                size="sm"
                onClick={() =>
                  open({
                    courseTitle: assignment.course,
                    courseSlug: "advanced-typescript",
                    assignmentTitle: assignment.title,
                  })
                }
              >
                Submit Solution
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Student's Submitted Work & Feedback */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">
            My Submissions & Instructor Reviews ({submissions.length})
          </h2>
          <span className="text-xs text-muted-foreground">Synchronized with Instructor Studio</span>
        </div>

        <div className="grid gap-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{sub.assignmentTitle}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                        sub.status === "approved"
                          ? "bg-teal/15 text-teal"
                          : sub.status === "needs_revision"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {sub.status === "approved"
                        ? `✓ Approved (${sub.score}/${sub.maxScore})`
                        : sub.status === "needs_revision"
                          ? "⚠ Needs Revision"
                          : "⏳ Under Instructor Review"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sub.courseTitle} • Submitted on{" "}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3.5 text-xs">
                <span className="font-semibold text-muted-foreground">My Solution Summary: </span>
                <p className="mt-1 text-foreground">{sub.solutionNotes}</p>
                {sub.githubUrl && (
                  <a
                    href={sub.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" /> View Submitted Code / Repository
                  </a>
                )}
              </div>

              {sub.feedback ? (
                <div className="mt-3 rounded-lg border border-teal/20 bg-teal/10 p-3.5 text-xs text-teal">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Faculty Feedback:</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-foreground">{sub.feedback}</p>
                  {sub.gradedBy && (
                    <span className="mt-2 block text-[11px] opacity-80">
                      Evaluated by {sub.gradedBy} on{" "}
                      {sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString() : "recent"}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground italic">
                  Instructor has received your submission and will provide score & feedback shortly.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Assessments({ open }: { open: () => void }) {
  return (
    <>
      <PageTitle
        title="Quizzes & Knowledge Checks"
        detail="Each attempt draws a fresh set of questions from the course bank to evaluate comprehension."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {courses.map((course, index) => (
          <article key={course.title} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                <Target className="size-4" />
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-bold ${index === 0 ? "bg-teal/15 text-teal" : "bg-secondary text-muted-foreground"}`}
              >
                {index === 0 ? "Ready" : "Available"}
              </span>
            </div>
            <h2 className="mt-4 text-base font-bold">{course.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              5 interactive questions · unlimited practice attempts
            </p>
            <Button
              className="mt-4 w-full"
              variant={index === 0 ? "chrome" : "console"}
              onClick={open}
            >
              Start quiz
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}

function Notes({
  notify,
}: {
  notify: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const defaultNoteText =
    "Conditional types distribute over union members. Review the infer keyword before the quiz.";
  const [text, setText] = useState(defaultNoteText);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skillbridge_notes");
      if (saved) setText(saved);
    }
  }, []);

  const saveNote = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("skillbridge_notes", text);
    }
    notify("Note saved to your device", "success");
  };

  return (
    <>
      <PageTitle
        title="Study Notes"
        detail="Your personal notes from video lectures and architecture diagrams."
      />
      <div className="max-w-3xl rounded-lg border border-border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
          Advanced TypeScript · Lecture 3 · Conditional Types
        </p>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-56 bg-background leading-relaxed font-mono text-xs"
        />
        <div className="mt-4 flex justify-end">
          <Button variant="chrome" onClick={saveNote}>
            Save note
          </Button>
        </div>
      </div>
    </>
  );
}

function Certificates({ onOpenCert }: { onOpenCert: (course: Course) => void }) {
  const { courses } = useCommerce();
  const completedCourses = courses.filter((c) => c.progress >= 100);
  const inProgressCourses = courses.filter((c) => c.progress > 0 && c.progress < 100);

  return (
    <>
      <PageTitle
        title="Official Certificates of Completion"
        detail="Verifiable credentials earned upon completing all curriculum lectures and capstone assignments."
      />

      {/* Earned Certificates */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-bold text-foreground">Earned Credentials</h2>
        {completedCourses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {completedCourses.map((c) => (
              <div
                key={c.slug}
                className="relative overflow-hidden rounded-xl border-2 border-amber-500/40 bg-card p-6 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="grid size-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Award className="size-6" />
                  </div>
                  <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal">
                    ✓ Verified & Issued
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-foreground">{c.title}</h3>
                <p className="text-xs text-muted-foreground">Instructor: {c.instructor}</p>

                <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Verification ID: {c.certificateId || "SKILL-VERIFIED"}</span>
                  <span className="font-semibold text-emerald-500">100% Passed</span>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    variant="chrome"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => onOpenCert(c)}
                  >
                    <Sparkles className="size-3.5" /> View Official Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-xs text-muted-foreground">
            <Award className="size-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="font-bold text-foreground">No certificates earned yet</p>
            <p className="mt-1">
              Certificates are earned upon completing 100% of required course lessons.
            </p>
          </div>
        )}
      </section>

      {/* In-Progress Progress Meters */}
      <section>
        <h2 className="mb-4 text-base font-bold text-foreground">Courses in Progress</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {inProgressCourses.map((course) => (
            <div key={course.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">{course.title}</h3>
                <span className="text-xs font-bold text-primary">{course.progress}%</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {course.lessonsDone} of {course.lessonsTotal} lessons completed
              </p>
              <div className="mt-3">
                <Progress value={course.progress} />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Complete all remaining lectures to automatically unlock and receive your official
                verified certificate!
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Analytics() {
  const { courses, dashboardData } = useCommerce();
  const totalLecturesDone = courses.reduce((acc, c) => acc + c.lessonsDone, 0);
  const overallProgress =
    dashboardData?.overallProgress ??
    (courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
      : 0);
  const activeHours = Math.round(
    courses.reduce((acc, c) => acc + (c.progress > 0 ? c.hours : 0), 0),
  );

  return (
    <>
      <PageTitle
        title="Learning Analytics"
        detail="Personal metrics across video lectures, quizzes, and project submissions."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Lectures completed"
          value={`${totalLecturesDone}`}
          detail="Across enrolled courses"
        />
        <Stat label="Curriculum hours" value={`${activeHours}h`} detail="Enrolled syllabus" />
        <Stat
          label="Overall completion"
          value={`${overallProgress}%`}
          detail="Real database records"
        />
      </div>
      <div className="mt-5 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Course completion</h2>
        <div className="mt-5 space-y-5">
          {courses.map((course) => (
            <div key={course.title}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium">{course.title}</span>
                <span className="font-semibold text-primary">{course.progress}%</span>
              </div>
              <Progress value={course.progress} thin />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-overlay p-4"
      onMouseDown={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${wide ? "max-w-4xl" : "max-w-xl"} max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close">
            <X />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PlayerModal({
  course,
  close,
  notify,
  onOpenCert,
}: {
  course: Course;
  close: () => void;
  notify: (message: string, type?: "success" | "error" | "info") => void;
  onOpenCert?: (course: Course) => void;
}) {
  const [dbLessons, setDbLessons] = useState<
    Array<{
      id: string;
      title: string;
      length: string;
      video_url: string;
      description: string;
      completed: boolean;
    }>
  >([]);
  const [active, setActive] = useState(0);
  const [courseVideoUrl, setCourseVideoUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    lmsClient
      .getCourse(course.slug)
      .then((res) => {
        if (!mounted) return;
        setCourseVideoUrl(res.course?.video_url || "");
        const completedIds = new Set(
          (res.lessonProgress || []).filter((p) => p.completed).map((p) => p.lesson_id),
        );
        const mapped = (res.lessons || []).map((l) => ({
          id: l.id,
          title: l.title,
          length: l.duration || "15:00",
          video_url: l.video_url || "",
          description: l.description,
          completed: completedIds.has(l.id),
        }));
        if (mapped.length > 0) {
          setDbLessons(mapped);
          const firstIncomplete = mapped.findIndex((l) => !l.completed);
          if (firstIncomplete >= 0) setActive(firstIncomplete);
        }
      })
      .catch((err) => console.error("Could not fetch real lessons:", err));
    return () => {
      mounted = false;
    };
  }, [course.slug]);

  const defaultLectures = [
    {
      id: "1",
      title: "1. Foundations & Overview",
      length: "15:00",
      video_url: "",
      description: "",
      completed: false,
    },
    {
      id: "2",
      title: "2. Core Implementation",
      length: "20:00",
      video_url: "",
      description: "",
      completed: false,
    },
    {
      id: "3",
      title: "3. Advanced Production Patterns",
      length: "25:00",
      video_url: "",
      description: "",
      completed: false,
    },
  ];

  const lectures = dbLessons.length > 0 ? dbLessons : defaultLectures;
  const [playerTab, setPlayerTab] = useState<"playlist" | "qa" | "notes">("playlist");
  const lecture = lectures[active] || lectures[0]!;
  const { meta, owned, buy, buying, user, isTeacher } = useCommerce();
  const m = meta[course.slug];
  const isOwned = !!m && owned.has(m.id);
  const isCompleted = course.progress >= 100;
  // If course is owned or completed, infinite replay is granted with zero locks!
  const limit = isOwned || isCompleted ? 0 : (m?.preview ?? 0) * 60;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [locked, setLocked] = useState(false);

  // Q&A Comments state
  const [lectureComments, setLectureComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const loadComments = useCallback(() => {
    setLectureComments(getVideoComments(course.slug, active));
  }, [course.slug, active]);

  useEffect(() => {
    loadComments();
    const handleUpdate = () => loadComments();
    window.addEventListener("lms_comments_updated", handleUpdate);
    return () => window.removeEventListener("lms_comments_updated", handleUpdate);
  }, [loadComments]);

  // Video note state
  const noteKey = `skillbridge_lecture_note_${course.slug}_${active}`;
  const [lectureNote, setLectureNote] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLectureNote(localStorage.getItem(noteKey) || "");
    }
  }, [noteKey]);

  const saveLectureNote = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(noteKey, lectureNote);
      notify("Lecture notes saved", "success");
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const currentTimeStr = videoRef.current
      ? `${Math.floor(videoRef.current.currentTime / 60)
          .toString()
          .padStart(2, "0")}:${Math.floor(videoRef.current.currentTime % 60)
          .toString()
          .padStart(2, "0")}`
      : undefined;

    const authorName =
      (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Student";

    addVideoComment({
      courseSlug: course.slug,
      lectureId: active,
      lectureTitle: lecture.title,
      authorId: user?.id || "student-user",
      authorName,
      authorRole: isTeacher ? "teacher" : "student",
      timestamp: includeTimestamp ? currentTimeStr : undefined,
      content: newComment.trim(),
    });
    setNewComment("");
    notify("Question posted to lecture Q&A!", "success");
  };

  const onTime = () => {
    const v = videoRef.current;
    if (!v || isOwned || isCompleted || !m) return;
    if (limit > 0 && v.currentTime >= limit) {
      v.pause();
      v.currentTime = limit;
      setLocked(true);
    }
  };

  const markComplete = async () => {
    const curLesson = lectures[active];
    if (!curLesson) return;
    try {
      const res = await lmsClient.completeLesson(course.slug, curLesson.id, true);
      setDbLessons((prev) => prev.map((l, i) => (i === active ? { ...l, completed: true } : l)));
      window.dispatchEvent(new Event("lms_data_updated"));
      notify(`Lecture "${curLesson.title}" marked complete! Progress: ${res.progress}%`, "success");
      if (active < lectures.length - 1) {
        setActive((prev) => prev + 1);
      }
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to record lesson completion.", "error");
    }
  };

  return (
    <Modal title={course.title} close={close} wide>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {/* Video Container */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-ink shadow-md">
            {m && (isOwned || isCompleted || limit > 0) ? (
              <video
                key={active}
                ref={videoRef}
                src={lecture.video_url || courseVideoUrl || m.videoUrl}
                poster={course.image}
                controls={!locked}
                onTimeUpdate={onTime}
                onSeeking={onTime}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={course.image}
                alt={course.title}
                width={1088}
                height={608}
                className="h-full w-full object-cover opacity-60"
              />
            )}

            {/* Locked Free Preview Overlay */}
            {m && !isOwned && !isCompleted && (locked || limit === 0) && (
              <div className="absolute inset-0 grid place-items-center bg-overlay p-6 text-center backdrop-blur-xs">
                <div>
                  <Lock className="mx-auto size-9 text-white" />
                  <p className="mt-3 text-lg font-bold text-white">
                    {limit === 0
                      ? "This course has no free preview"
                      : "Your free preview has ended"}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Unlock every lecture and earn your certificate for {rupees(m.price)}
                  </p>
                  <Button
                    className="mt-4"
                    variant="chrome"
                    disabled={buying !== null}
                    onClick={() => buy(course)}
                  >
                    {buying === course.slug ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Opening…</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="size-4" />
                        <span>Buy full course · {rupees(m.price)}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Banner for completed courses (Infinite Replay) */}
          {isCompleted && (
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-teal/30 bg-teal/10 px-3.5 py-2 text-xs text-teal">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> Course Completed • Unlimited Lifetime Replay
              </span>
              {onOpenCert && (
                <button
                  onClick={() => onOpenCert(course)}
                  className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Award className="size-3.5" /> View Certificate
                </button>
              )}
            </div>
          )}

          {m && !isOwned && !isCompleted && limit > 0 && !locked && (
            <p className="mt-2 rounded-md bg-orange/15 px-3 py-1.5 text-xs font-semibold text-orange">
              Free preview: first {m.preview} min of the course
            </p>
          )}

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">{lecture.title}</h3>
              <p className="text-xs text-muted-foreground">
                {course.instructor} • Duration: {lecture.length}
              </p>
            </div>

            {isOwned || isCompleted || !m ? (
              <Button variant="chrome" size="sm" onClick={markComplete} className="gap-1.5">
                <Check className="size-4" /> Mark as Complete
              </Button>
            ) : (
              <Button
                variant="chrome"
                size="sm"
                disabled={buying !== null}
                onClick={() => buy(course)}
                className="gap-1.5"
              >
                <ShoppingCart className="size-4" /> Buy for {rupees(m.price)}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Multi-tab interactive syllabus, Q&A, and Notes */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Tab Selector */}
          <div className="flex border-b border-border pb-1 gap-1 text-xs">
            <button
              onClick={() => setPlayerTab("playlist")}
              className={`px-3 py-1.5 font-bold rounded-t-md transition-colors cursor-pointer ${
                playerTab === "playlist"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Curriculum ({lectures.length})
            </button>
            <button
              onClick={() => setPlayerTab("qa")}
              className={`px-3 py-1.5 font-bold rounded-t-md transition-colors cursor-pointer ${
                playerTab === "qa"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Q&A & Discussion ({lectureComments.length})
            </button>
            <button
              onClick={() => setPlayerTab("notes")}
              className={`px-3 py-1.5 font-bold rounded-t-md transition-colors cursor-pointer ${
                playerTab === "notes"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Notes
            </button>
          </div>

          {/* TAB 1: CURRICULUM PLAYLIST */}
          {playerTab === "playlist" && (
            <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[350px]">
              {lectures.map((l, index) => (
                <button
                  key={l.title}
                  onClick={() => {
                    if (isOwned || isCompleted || index === 0 || !m) {
                      setActive(index);
                      setLocked(false);
                    }
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                    index === active
                      ? "bg-primary/10 font-bold text-primary"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-sm border ${
                      l.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {l.completed && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  {m && !isOwned && !isCompleted && index > 0 ? (
                    <Lock className="size-3 text-muted-foreground" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{l.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: LECTURE Q&A AND COMMENTS */}
          {playerTab === "qa" && (
            <div className="mt-3 flex flex-col h-[350px]">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {lectureComments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="rounded-lg border border-border bg-secondary/40 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{cmt.authorName}</span>
                        {cmt.timestamp && (
                          <span className="rounded bg-primary/10 px-1 font-mono text-[10px] text-primary">
                            ⏱ {cmt.timestamp}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(cmt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground leading-relaxed">{cmt.content}</p>

                    {/* Instructor / Peer Replies */}
                    {cmt.replies && cmt.replies.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-l-2 border-primary/40 pl-2.5">
                        {cmt.replies.map((rep) => (
                          <div key={rep.id} className="rounded bg-card p-2 text-[11px]">
                            <div className="font-bold text-primary flex items-center gap-1">
                              <span>{rep.authorName}</span>
                              <span className="rounded bg-primary/10 px-1 text-[9px] uppercase">
                                {rep.authorRole}
                              </span>
                            </div>
                            <p className="mt-0.5 text-foreground">{rep.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {lectureComments.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    No questions on this lecture yet. Be the first to ask!
                  </p>
                )}
              </div>

              {/* Post New Comment Form */}
              <form onSubmit={handlePostComment} className="mt-3 border-t border-border pt-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Ask a question or share a thought</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="size-3"
                    />
                    <span>Attach video time</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button type="submit" variant="chrome" size="sm" className="h-8 px-3">
                    <Send className="size-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PERSONAL LECTURE NOTES */}
          {playerTab === "notes" && (
            <div className="mt-3 flex flex-col h-[350px]">
              <textarea
                value={lectureNote}
                onChange={(e) => setLectureNote(e.target.value)}
                placeholder="Type your personal notes, code snippets, and timestamps for this lecture…"
                className="flex-1 rounded-lg border border-input bg-background p-3 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2.5 flex justify-end">
                <Button variant="chrome" size="sm" onClick={saveLectureNote}>
                  Save Lecture Notes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function AssignmentModal({
  targetAssignment,
  close,
  notify,
}: {
  targetAssignment: { courseTitle: string; courseSlug: string; assignmentTitle: string } | null;
  close: () => void;
  notify: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const { user } = useCommerce();
  const [courseSlug, setCourseSlug] = useState(
    targetAssignment?.courseSlug || "advanced-typescript",
  );
  const [assignmentTitle, setAssignmentTitle] = useState(
    targetAssignment?.assignmentTitle || "Build a Type-Safe Event Bus with Generics",
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [solutionNotes, setSolutionNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solutionNotes.trim()) return;

    const studentName =
      (user?.user_metadata?.display_name as string) ||
      user?.email?.split("@")[0] ||
      "Student Learner";

    saveSubmission({
      courseSlug,
      courseTitle:
        courseSlug === "advanced-typescript"
          ? "Advanced TypeScript & Design Patterns"
          : courseSlug === "system-design"
            ? "System Design Fundamentals"
            : "React Performance & Architecture",
      assignmentId: `asg-${Date.now()}`,
      assignmentTitle,
      studentId: user?.id || "student-user",
      studentName,
      studentEmail: user?.email || "student@skillbridge.dev",
      githubUrl: githubUrl.trim() || undefined,
      solutionNotes: solutionNotes.trim(),
    });

    notify("Assignment submitted successfully for instructor review!", "success");
    close();
  };

  return (
    <Modal title="Submit Project Assignment" close={close}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold">Course & Assignment</label>
          <select
            value={courseSlug}
            onChange={(e) => {
              setCourseSlug(e.target.value);
              if (e.target.value === "advanced-typescript") {
                setAssignmentTitle("Build a Type-Safe Event Bus with Generics");
              } else if (e.target.value === "system-design") {
                setAssignmentTitle("Distributed Rate Limiter & Token Bucket Architecture");
              } else {
                setAssignmentTitle("Virtual List & Memoization Profiler");
              }
            }}
            className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-xs font-medium"
          >
            <option value="advanced-typescript">
              Advanced TypeScript & Design Patterns — Type-Safe Event Bus
            </option>
            <option value="system-design">
              System Design Fundamentals — Distributed Rate Limiter
            </option>
            <option value="react-performance">
              React Performance & Architecture — Virtual List Profiler
            </option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold">Project Repository / Demo Link (Optional)</label>
          <Input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/your-username/my-project"
            className="mt-1.5 text-xs font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold">
            Implementation Writeup & Architecture Notes
          </label>
          <Textarea
            value={solutionNotes}
            onChange={(e) => setSolutionNotes(e.target.value)}
            placeholder="Describe your design choices, trade-offs, algorithms used, and test coverage for the faculty review team…"
            className="mt-1.5 min-h-36 bg-background text-xs leading-relaxed"
            required
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="chrome" size="sm" disabled={!solutionNotes.trim()}>
            Submit for Instructor Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CertificateModal({ course, close }: { course: Course; close: () => void }) {
  const { firstName, dashboardData } = useCommerce();
  const certId =
    course.certificateId ||
    dashboardData?.certificates.find(
      (c) =>
        (c as { course_id?: string }).course_id === course.id || c.course_title === course.title,
    )?.certificate_id ||
    `SKILL-${course.slug.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}-CERT`;

  const studentName = firstName || "Student";
  const issueDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal title="Certificate of Completion" close={close} wide>
      <div className="flex flex-col items-center">
        {/* Certificate Diploma Card */}
        <div className="relative w-full max-w-2xl rounded-2xl border-8 border-double border-amber-500/40 bg-card p-8 sm:p-10 text-center shadow-2xl print:border-amber-600 print:shadow-none">
          <div className="absolute top-4 left-4 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
            ID: {certId}
          </div>
          <div className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-amber-500/10 text-amber-500 shadow-inner">
            <Award className="size-8" />
          </div>

          <p className="text-[11px] uppercase tracking-[0.25em] font-black text-primary">
            Skillbridge Academy
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Certificate of Completion
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">This certifies that</p>

          <p className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl underline decoration-primary decoration-2 underline-offset-8">
            {studentName}
          </p>

          <p className="mt-4 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            has successfully fulfilled all curriculum requirements, passed hands-on coding
            milestones, and achieved mastery in:
          </p>

          <h3 className="mt-2 text-lg font-black text-primary sm:text-xl">{course.title}</h3>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
            <div className="text-left">
              <span className="font-semibold text-foreground">{issueDate}</span>
              <p className="text-[11px]">Issue Date</p>
            </div>
            <div className="text-center">
              <span className="font-bold text-emerald-500">✓ Verified Official</span>
              <p className="text-[11px]">Skillbridge Registry</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-foreground">{course.instructor}</span>
              <p className="text-[11px]">Faculty Instructor</p>
            </div>
          </div>
        </div>

        {/* Print / Close Actions */}
        <div className="mt-6 flex gap-3 print:hidden">
          <Button variant="chrome" onClick={handlePrint} className="gap-2">
            <Printer className="size-4" /> Print / Save PDF
          </Button>
          <Button variant="outline" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const QUIZ_QUESTIONS = [
  {
    question: "Which React hook is used to memoise a callback function between renders?",
    options: ["useMemo", "useCallback", "useRef", "useEffect"],
    correct: "useCallback",
  },
  {
    question:
      "In TypeScript, which keyword is used within conditional types to deduce type variables?",
    options: ["extends", "infer", "keyof", "typeof"],
    correct: "infer",
  },
  {
    question:
      "What is the primary architectural purpose of a reverse proxy in distributed systems?",
    options: [
      "Database normalization",
      "Load balancing & SSL termination",
      "Client-side state caching",
      "Compile-time type checking",
    ],
    correct: "Load balancing & SSL termination",
  },
  {
    question: "What is the average time complexity of key lookup in a Hash Table?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: "O(1)",
  },
  {
    question: "Which CSS property animation trigger avoids main-thread layout reflow?",
    options: ["width", "height", "transform", "margin-top"],
    correct: "transform",
  },
];

function QuizModal({
  close,
  notify,
}: {
  close: () => void;
  notify: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const q = QUIZ_QUESTIONS[current]!;
  const currentAnswer = answers[current];
  const progressPercent = Math.round(((current + 1) / QUIZ_QUESTIONS.length) * 100);

  const calculateScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((question, index) => {
      if (answers[index] === question.correct) score++;
    });
    return score;
  };

  const handleNext = () => {
    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      setSubmitted(true);
      const score = calculateScore();
      notify(`Quiz complete! You scored ${score} of ${QUIZ_QUESTIONS.length}.`, "success");
    }
  };

  if (submitted) {
    const score = calculateScore();
    const percent = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <Modal title="Quiz Results" close={close}>
        <div className="py-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="mt-4 text-xl font-bold">Knowledge Check Complete</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {percent >= 80
              ? "Great job! You have mastered these concepts."
              : "Good effort! Keep reviewing the lectures to master these topics."}
          </p>
          <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Final Score</span>
              <span className="font-extrabold text-foreground">
                {score} / {QUIZ_QUESTIONS.length} ({percent}%)
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setCurrent(0);
                setSubmitted(false);
              }}
            >
              Retake quiz
            </Button>
            <Button variant="chrome" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="TypeScript knowledge check" close={close}>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>
          Question {current + 1} of {QUIZ_QUESTIONS.length}
        </span>
        <span className="text-primary font-bold">{progressPercent}% complete</span>
      </div>
      <Progress value={progressPercent} thin />
      <p className="mt-5 text-base font-bold">{q.question}</p>
      <div className="mt-4 space-y-2">
        {q.options.map((option, index) => (
          <button
            key={option}
            onClick={() => setAnswers((prev) => ({ ...prev, [current]: option }))}
            className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors cursor-pointer ${
              currentAnswer === option
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border hover:bg-secondary"
            }`}
          >
            <span className="grid size-7 place-items-center rounded-full border border-current text-xs font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((prev) => Math.max(0, prev - 1))}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            Exit
          </Button>
          <Button variant="chrome" size="sm" disabled={!currentAnswer} onClick={handleNext}>
            {current < QUIZ_QUESTIONS.length - 1 ? "Next question" : "Submit quiz"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
