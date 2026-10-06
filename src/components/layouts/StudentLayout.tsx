import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Code2,
  Globe,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Search,
  ShoppingCart,
  Target,
  Timer,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type StudentView =
  | "dashboard"
  | "courses"
  | "my-learning"
  | "assignments"
  | "assessments"
  | "codelab"
  | "recall"
  | "focus"
  | "notes"
  | "certificates"
  | "analytics";

const STUDENT_NAV_ITEMS: { id: StudentView; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "Explore Courses", icon: BookOpen },
  { id: "codelab", label: "Code Lab (Sandbox)", icon: Code2 },
  { id: "recall", label: "Smart Recall Decks", icon: Brain },
  { id: "focus", label: "Focus & Pomodoro", icon: Timer },
  { id: "my-learning", label: "My Learning & Progress", icon: GraduationCap },
  { id: "assignments", label: "Assignments & Projects", icon: ClipboardList },
  { id: "assessments", label: "Quizzes & Practice", icon: Target },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "notes", label: "Study Notes", icon: NotebookPen },
  { id: "analytics", label: "Learning Analytics", icon: BarChart3 },
];

const CATEGORIES = [
  "Web Development",
  "Frontend Architecture",
  "Backend & Cloud",
  "System Design",
  "Algorithms & DSA",
];

interface StudentLayoutProps {
  view: StudentView;
  setView: (view: StudentView) => void;
  signedIn: boolean;
  isTeacher: boolean;
  initials: string;
  firstName: string;
  signOut: () => void;
  children: React.ReactNode;
}

export function StudentLayout({
  view,
  setView,
  signedIn,
  isTeacher,
  initials,
  firstName,
  signOut,
  children,
}: StudentLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  const changeView = (next: StudentView) => {
    setView(next);
    setMobileOpen(false);
    setExploreOpen(false);
    setAccountMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>

          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded bg-primary text-base font-extrabold text-primary-foreground">
              S
            </span>
            <span className="text-lg font-extrabold tracking-tight">skillbridge</span>
          </Link>

          {/* Portal Badge */}
          <span className="hidden items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground sm:inline-flex">
            Student Portal
          </span>

          {/* Explore Dropdown */}
          <div className="relative hidden lg:block">
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => setExploreOpen((open) => !open)}
            >
              Explore{" "}
              <ChevronDown
                className={exploreOpen ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </Button>
            {exploreOpen && (
              <div className="absolute left-0 top-12 w-64 rounded-md border border-border bg-card p-2 shadow-lg z-50">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => changeView("courses")}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                  >
                    {category} <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Trigger */}
          <div className="relative mx-auto hidden w-full max-w-2xl md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <button
              onClick={() => changeView("courses")}
              className="h-10 w-full rounded-full border border-input bg-secondary pl-11 pr-4 text-left text-sm text-muted-foreground hover:bg-background cursor-pointer"
            >
              What do you want to learn today?
            </button>
          </div>

          {/* Header Actions */}
          <div className="ml-auto flex items-center gap-2">
            {isTeacher ? (
              <Link
                to="/teach"
                className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 md:flex"
              >
                <GraduationCap className="size-3.5" /> Instructor Studio →
              </Link>
            ) : (
              <Link
                to="/student"
                className="hidden items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 md:flex border border-indigo-200"
              >
                <GraduationCap className="size-3.5" /> Student Dashboard →
              </Link>
            )}

            <Link
              to="/student"
              className="hidden px-2.5 text-sm font-medium hover:text-primary lg:block cursor-pointer"
            >
              My learning
            </Link>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              onClick={() => changeView("courses")}
            >
              <Heart />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              onClick={() => changeView("courses")}
            >
              <ShoppingCart />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>

            {/* Account Dropdown */}
            {signedIn ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="grid size-9 place-items-center rounded-full bg-violet text-sm font-bold text-white shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  aria-label="Account menu"
                >
                  {initials}
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold">
                        {firstName ? `Hi, ${firstName}` : "Account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isTeacher ? "Instructor Account" : "Student Learner"}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => changeView("dashboard")}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                      >
                        <LayoutDashboard className="size-4 text-muted-foreground" /> Dashboard
                      </button>
                      <button
                        onClick={() => changeView("my-learning")}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                      >
                        <GraduationCap className="size-4 text-muted-foreground" /> My Learning &
                        Progress
                      </button>
                      <button
                        onClick={() => changeView("courses")}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                      >
                        <BookOpen className="size-4 text-muted-foreground" /> Explore Courses
                      </button>
                      <button
                        onClick={() => changeView("assignments")}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                      >
                        <ClipboardList className="size-4 text-muted-foreground" /> Assignments
                      </button>
                      <button
                        onClick={() => changeView("certificates")}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                      >
                        <Award className="size-4 text-muted-foreground" /> Certificates
                      </button>
                      {isTeacher ? (
                        <Link
                          to="/teach"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex w-full items-center gap-2 rounded bg-primary/10 px-3 py-2 text-left text-sm font-bold text-primary hover:bg-primary/20 cursor-pointer"
                        >
                          <GraduationCap className="size-4 text-primary" /> Instructor Studio
                        </Link>
                      ) : (
                        <Link
                          to="/student"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-secondary cursor-pointer"
                        >
                          <GraduationCap className="size-4 text-indigo-600" /> Student Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-border pt-1">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="chrome" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="mx-auto flex max-w-[1400px] flex-1 gap-8 px-4 py-6 sm:px-6 w-full">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="space-y-0.5">
            {STUDENT_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeView(id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                  view === id
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-foreground/80 hover:bg-secondary"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Teacher Mode Invitation Box */}
          {isTeacher ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <GraduationCap className="size-4" /> Instructor Mode Active
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage course prices, review student assignments, and track enrollments.
              </p>
              <Link to="/teach" className="mt-3 block">
                <Button variant="chrome" size="sm" className="w-full">
                  Open Instructor Studio
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="mb-1 text-sm font-semibold">Teach on Skillbridge</div>
              <p className="mb-3 text-xs text-muted-foreground">
                Share your expertise, set course pricing, and mentor students worldwide.
              </p>
              <Link to="/teach">
                <Button variant="violet" className="w-full">
                  <Users className="size-4" /> Instructor area
                </Button>
              </Link>
            </div>
          )}

          {signedIn && (
            <Button
              variant="ghost"
              className="mt-3 w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          )}
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-overlay lg:hidden backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              className="h-full w-72 overflow-y-auto bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded bg-primary font-extrabold text-primary-foreground">
                    S
                  </span>
                  <span className="text-lg font-extrabold tracking-tight">skillbridge</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X />
                </Button>
              </div>

              {isTeacher && (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <GraduationCap className="size-4" /> Instructor Mode
                  </div>
                  <Link to="/teach" className="mt-2 block">
                    <Button variant="chrome" size="sm" className="w-full text-xs">
                      Open Instructor Studio →
                    </Button>
                  </Link>
                </div>
              )}

              <nav className="space-y-1">
                {STUDENT_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => changeView(id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                      view === id
                        ? "bg-primary/10 font-bold text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 Skillbridge — learn software engineering, one lesson at a time.</span>
          <span className="flex items-center gap-2">
            <Globe className="size-4" /> English
          </span>
        </div>
      </footer>
    </div>
  );
}
