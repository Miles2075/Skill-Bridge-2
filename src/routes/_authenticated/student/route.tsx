import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Code2,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
  Timer,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { lmsClient } from "@/lib/lms-client";
import { supabase } from "@/integrations/supabase/client";
import { getLocalSession } from "@/lib/local-db";

export const Route = createFileRoute("/_authenticated/student")({
  ssr: false,
  beforeLoad: async () => {
    let user = getLocalSession();
    if (!user) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = getLocalSession();
      }
    }
    if (!user) {
      throw redirect({ to: "/auth" });
    }
    const metaRole = user.user_metadata?.role || "student";
    const isTeacher = metaRole === "teacher";
    const isAdmin = metaRole === "admin";
    if (isTeacher && !isAdmin) {
      throw redirect({ to: "/teach" });
    }
  },
  head: () => ({
    meta: [
      { title: "Student Dashboard | Skillbridge" },
      {
        name: "description",
        content:
          "Your personalized learning dashboard. Access courses, assignments, quizzes, progress, and certificates.",
      },
      { property: "og:title", content: "Student Dashboard | Skillbridge" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: StudentRouteLayout,
});

export type StudentNavView =
  | "dashboard"
  | "courses"
  | "assignments"
  | "assessments"
  | "codelab"
  | "recall"
  | "focus"
  | "progress"
  | "grades"
  | "certificates"
  | "profile"
  | "settings";

function StudentRouteLayout() {
  const { user, isTeacher, isAdmin, loading, signOut } = useAuth();
  const displayName =
    (user?.user_metadata?.["display_name"] as string) || user?.email?.split("@")[0] || "Student";
  const initials = (displayName[0] || "S").toUpperCase();

  const [activeView, setActiveView] = useState<StudentNavView>("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("view") as StudentNavView;
      if (p) setActiveView(p);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const updateStats = async () => {
      if (!user) return;
      try {
        const data = await lmsClient.getStudentDashboard();
        if (mounted) {
          const pending = data.upcomingAssignments.filter(
            (a) => a.submissionStatus === "pending" || a.submissionStatus === "unsubmitted",
          ).length;
          setPendingAssignments(pending);
          setQuizzesCount(data.studentQuizzes.length);
          setEnrolledCoursesCount(data.enrolledCourses.length);
          setCertificatesCount(data.certificates.length);
        }
      } catch {
        // ignore
      }
    };

    updateStats();
    window.addEventListener("lms_data_updated", updateStats);
    return () => {
      mounted = false;
      window.removeEventListener("lms_data_updated", updateStats);
    };
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get("view") as StudentNavView;
      setActiveView(p || "dashboard");
    };
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ view: StudentNavView }>;
      if (custom.detail?.view) {
        setActiveView(custom.detail.view);
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
    setActiveView(v);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("student_view_changed", { detail: { view: v } }));
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-xs text-muted-foreground font-medium">
        Loading learner profile…
      </div>
    );
  }

  if (isTeacher && !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 font-sans text-foreground">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Instructor Portal Active</h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            You are signed in with an Instructor account. The Student management portal is reserved
            for students.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/teach">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                Go to Instructor Studio
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full text-xs text-muted-foreground"
            >
              Sign Out / Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: {
    id: StudentNavView;
    label: string;
    icon: React.ElementType;
    badge?: string | undefined;
    badgeColor?: string | undefined;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: BookOpen, badge: `${enrolledCoursesCount} Active` },
    {
      id: "assignments",
      label: "Assignments",
      icon: ClipboardList,
      badge: pendingAssignments > 0 ? `${pendingAssignments} Due` : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "assessments",
      label: "Assessments / Quizzes",
      icon: Target,
      badge: `${quizzesCount} Ready`,
    },
    {
      id: "codelab",
      label: "Code Lab",
      icon: Code2,
      badge: "Hands-on",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "recall",
      label: "Smart Recall Decks",
      icon: Brain,
      badge: "Spaced Repetition",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      id: "focus",
      label: "Focus & Pomodoro",
      icon: Timer,
      badge: "Deep Work",
      badgeColor: "bg-sky-100 text-sky-800",
    },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "grades", label: "Grades / Results", icon: BarChart3 },
    {
      id: "certificates",
      label: "Certificates",
      icon: Award,
      badge: `${certificatesCount} Earned`,
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Student Portal Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <button
              type="button"
              onClick={() => switchView("dashboard")}
              className="flex items-center gap-2.5 cursor-pointer"
              aria-label="Go to student dashboard"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 font-extrabold text-white shadow-xs">
                S
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">skillbridge</span>
            </button>

            <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              Student Learning Space
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Compass className="size-3.5 text-indigo-600" />
              <span>Explore Catalog</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                onClick={() => switchView("profile")}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                <div className="grid size-8 place-items-center overflow-hidden rounded-full bg-indigo-600 text-xs font-bold uppercase text-white shadow-xs group-hover:ring-2 group-hover:ring-indigo-300 transition-all">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-indigo-600">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Learner</span>
                </div>
              </button>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-400 hover:text-red-600 p-1.5 cursor-pointer ml-1"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Student Sidebar + Content */}
      <div className="mx-auto flex max-w-7xl flex-1 w-full">
        {/* Desktop Student Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
          <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Student Menu
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchView(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.badgeColor ||
                        (isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Encouraging Student Learning Card */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/40 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-indigo-900 mb-1">
                <GraduationCap className="size-4 text-indigo-600" />
                <span>Next Milestone</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Complete React Performance Lecture 3 to earn your verified credential!
              </p>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-indigo-700">
                <span>Streak: 4 Days 🔥</span>
                <button
                  onClick={() => switchView("courses")}
                  className="hover:underline cursor-pointer"
                >
                  Resume →
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Student Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => switchView(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="size-3.5 mr-1.5" /> Sign Out
                </Button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Student Portal Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 Skillbridge Student Workspace — Hands-on Engineering Education</span>
          <div className="flex items-center gap-4">
            <button onClick={() => switchView("courses")} className="hover:text-indigo-600">
              My Courses
            </button>
            <button onClick={() => switchView("assignments")} className="hover:text-indigo-600">
              Assignments
            </button>
            <button onClick={() => switchView("certificates")} className="hover:text-indigo-600">
              Certificates
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
