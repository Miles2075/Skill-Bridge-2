import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FilePlus,
  FolderKanban,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Settings,
  ShieldAlert,
  Target,
  TrendingUp,
  User,
  Users,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { lmsClient } from "@/lib/lms-client";
import { supabase } from "@/integrations/supabase/client";
import { getLocalSession } from "@/lib/local-db";

export const Route = createFileRoute("/_authenticated/teach")({
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
    const isTeacher = metaRole === "teacher" || metaRole === "admin";
    if (!isTeacher) {
      throw redirect({ to: "/student" });
    }
  },
  head: () => ({
    meta: [
      { title: "Instructor Studio | Skillbridge" },
      {
        name: "description",
        content:
          "Professional faculty console for course management, content authoring, student tracking, and grading.",
      },
      { property: "og:title", content: "Instructor Studio | Skillbridge" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TeachLayoutRoute,
});

export type InstructorNavView =
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

function TeachLayoutRoute() {
  const { user, isTeacher, loading, signOut } = useAuth();
  const displayName =
    (user?.user_metadata?.["display_name"] as string) ||
    user?.email?.split("@")[0] ||
    "Faculty Lead";
  const initials = (displayName[0] || "T").toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const [activeView, setActiveView] = useState<InstructorNavView>("dashboard");

  const [pendingReviews, setPendingReviews] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(5);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("view") as InstructorNavView;
      if (p) setActiveView(p);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const updateStats = async () => {
      try {
        const data = await lmsClient.getInstructorData();
        if (mounted) {
          const subs = data.submissions || [];
          setPendingReviews(subs.filter((s) => s.status === "pending").length);
          const studs = data.students || [];
          setStudentCount(new Set(studs.map((s) => s.studentId)).size);
          const crs = (data.courses || []).filter((c) => c.status === "published" || !c.status);
          setCoursesCount(crs.length || data.courses?.length || 5);
        }
      } catch {
        // ignore if not loaded yet
      }
    };

    updateStats();
    window.addEventListener("lms_submissions_updated", updateStats);
    window.addEventListener("lms_students_updated", updateStats);
    window.addEventListener("lms_data_updated", updateStats);
    return () => {
      mounted = false;
      window.removeEventListener("lms_submissions_updated", updateStats);
      window.removeEventListener("lms_students_updated", updateStats);
      window.removeEventListener("lms_data_updated", updateStats);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get("view") as InstructorNavView;
      setActiveView(p || "dashboard");
    };
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ view: InstructorNavView }>;
      if (custom.detail?.view) {
        setActiveView(custom.detail.view);
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
    setActiveView(v);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("teach_view_changed", { detail: { view: v } }));
    }
  };

  // Strict Role Guard
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-xs text-slate-500 font-medium">
        Verifying faculty credentials…
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Access Restricted</h1>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            The Instructor Studio is reserved exclusively for verified faculty members. Your account
            does not have teacher permissions.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/">
              <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs">
                Return to Home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full text-xs text-slate-600"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: {
    id: InstructorNavView;
    label: string;
    icon: React.ElementType;
    badge?: string | undefined;
    badgeColor?: string | undefined;
    section?: string | undefined;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: BookOpen, badge: `${coursesCount} Active` },
    { id: "create-course", label: "Create Course", icon: PlusCircle },
    { id: "content", label: "Course Content", icon: FolderKanban },
    { id: "assignments", label: "Assignments", icon: Layers },
    { id: "assessments", label: "Assessments", icon: Target },
    { id: "students", label: "Students", icon: Users, badge: `${studentCount}` },
    {
      id: "submissions",
      label: "Submissions / Grading",
      icon: ClipboardCheck,
      badge: pendingReviews > 0 ? `${pendingReviews} Due` : undefined,
      badgeColor: "bg-amber-100 text-amber-800 font-bold",
    },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Executive Instructor Management Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <Link to="/teach" className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded bg-teal-700 font-extrabold text-white text-sm">
                S
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">skillbridge</span>
            </Link>

            <span className="text-slate-300">/</span>
            <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800 border border-teal-200">
              Instructor Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => switchView("create-course")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="size-3.5" />
              <span>New Course</span>
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                onClick={() => switchView("profile")}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                <div className="grid size-8 place-items-center overflow-hidden rounded-full bg-teal-100 text-xs font-bold text-teal-800 group-hover:ring-2 group-hover:ring-teal-300">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-teal-700">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Faculty Lead</span>
                </div>
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Instructor Container: Sidebar + Content */}
      <div className="mx-auto flex max-w-7xl flex-1 w-full">
        {/* Desktop Instructor Management Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-3">
            Instructor Operations
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchView(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-teal-50 text-teal-800 font-semibold border border-teal-200 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.badgeColor ||
                        (isActive ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Review Status Widget */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs">
              <div className="flex items-center justify-between font-bold text-teal-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck className="size-4 text-teal-700" />
                  Review Queue
                </span>
                <span className="text-[11px] font-mono text-teal-800">
                  {pendingReviews} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Student submissions awaiting evaluation and rubric scoring.
              </p>
              <button
                onClick={() => switchView("submissions")}
                className="mt-2 block w-full rounded bg-teal-700 py-1 text-center font-bold text-[11px] text-white hover:bg-teal-800 transition-colors cursor-pointer"
              >
                Open Review Queue →
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Faculty Navigation</span>
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
                          ? "bg-teal-50 text-teal-800 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 ${isActive ? "text-teal-700" : "text-slate-400"}`}
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

      {/* Instructor Console Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © 2026 Skillbridge Instructor Studio — Faculty Curriculum & Student Management
          </span>
          <div className="flex items-center gap-4">
            <button onClick={() => switchView("courses")} className="hover:text-teal-700">
              Course Engine
            </button>
            <button onClick={() => switchView("submissions")} className="hover:text-teal-700">
              Grading Workbench
            </button>
            <button onClick={() => switchView("analytics")} className="hover:text-teal-700">
              Financial Ledger
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
