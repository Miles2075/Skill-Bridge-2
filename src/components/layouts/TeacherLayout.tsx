import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  Database,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Radio,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";

export type TeacherView = "courses" | "students" | "assignments" | "discussions" | "analytics";

interface TeacherLayoutProps {
  currentView: TeacherView;
  onViewChange: (view: TeacherView) => void;
  userEmail?: string;
  displayName?: string;
  totalRevenue: number;
  totalStudents: number;
  avgCompletionRate: number;
  pendingAssignments: number;
  coursesCount: number;
  children: React.ReactNode;
}

export function TeacherLayout({
  currentView,
  onViewChange,
  userEmail,
  displayName,
  totalRevenue,
  totalStudents,
  avgCompletionRate,
  pendingAssignments,
  coursesCount,
  children,
}: TeacherLayoutProps) {
  const teacherInitials = ((displayName || userEmail || "T")[0] || "T").toUpperCase();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Executive Command Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0d1321]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/teach" className="flex items-center gap-2.5 group">
              <span className="grid size-8 place-items-center rounded-lg bg-cyan-500 font-mono text-sm font-black text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-105">
                S
              </span>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  skillbridge{" "}
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                    STUDIO
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Faculty & Admin Operations
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-2 pl-4 border-l border-slate-800 md:flex">
              <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Production Live
              </span>
              <span className="text-xs text-slate-500 font-mono">API v2.4</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-xs"
            >
              <span>Student Learning View</span>
              <ArrowUpRight className="size-3.5 text-slate-400" />
            </Link>

            <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 text-xs font-mono font-bold text-white shadow-xs">
                {teacherInitials}
              </div>
              <div className="hidden flex-col sm:flex text-left">
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  {displayName || "Course Faculty"}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Instructor Account</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="mx-auto max-w-[1500px] flex-1 px-4 py-8 sm:px-6 w-full">
        {/* Metric Telemetry Hub */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <SlidersHorizontal className="size-3.5" />
                Administrative Control Deck
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Curriculum & Student Operations
              </h1>
              <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
                Directly adjust course pricing in ₹, calibrate preview video lockouts, grade student
                capstone code submissions, and moderate lecture discussions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-slate-800 bg-[#0d1321] px-3 py-1.5 text-xs font-mono text-slate-400 flex items-center gap-2">
                <Database className="size-3.5 text-cyan-400" />
                <span>Supabase Live Store</span>
              </div>
            </div>
          </div>

          {/* High-Contrast Technical KPI Strip */}
          <div className="mt-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div
              onClick={() => onViewChange("analytics")}
              className={`group relative overflow-hidden rounded-xl border p-4.5 transition-all cursor-pointer ${
                currentView === "analytics"
                  ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-slate-800 bg-[#0f172a]/70 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Gross Revenue</span>
                <TrendingUp className="size-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-black text-white tracking-tight">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span>+18.4%</span>
                <span className="text-slate-500">vs previous cycle</span>
              </div>
            </div>

            <div
              onClick={() => onViewChange("students")}
              className={`group relative overflow-hidden rounded-xl border p-4.5 transition-all cursor-pointer ${
                currentView === "students"
                  ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-slate-800 bg-[#0f172a]/70 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Active Cohort</span>
                <Users className="size-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-black text-white tracking-tight">
                {totalStudents} Learners
              </p>
              <p className="mt-1 text-[11px] font-mono text-slate-400">
                Across {coursesCount} active courses
              </p>
            </div>

            <div
              onClick={() => onViewChange("students")}
              className="rounded-xl border border-slate-800 bg-[#0f172a]/70 p-4.5"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Avg Completion</span>
                <GraduationCap className="size-4 text-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-black text-white tracking-tight">
                {avgCompletionRate}%
              </p>
              <p className="mt-1 text-[11px] font-mono text-slate-400">
                Cohort lecture progression
              </p>
            </div>

            <div
              onClick={() => onViewChange("assignments")}
              className={`group relative overflow-hidden rounded-xl border p-4.5 transition-all cursor-pointer ${
                currentView === "assignments"
                  ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "border-slate-800 bg-[#0f172a]/70 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Review Queue</span>
                <span className="size-2 rounded-full bg-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-mono font-black text-white tracking-tight">
                {pendingAssignments} Submissions
              </p>
              <p className="mt-1 text-[11px] font-mono text-amber-400">Awaiting faculty grading</p>
            </div>
          </div>
        </div>

        {/* Tabbed Console Selector */}
        <div className="mb-6 flex overflow-x-auto border-b border-slate-800 gap-1">
          <button
            onClick={() => onViewChange("courses")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              currentView === "courses"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <BookOpen className="size-4" /> Course Engine ({coursesCount})
          </button>

          <button
            onClick={() => onViewChange("students")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              currentView === "students"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Users className="size-4" /> Student Roster ({totalStudents})
          </button>

          <button
            onClick={() => onViewChange("assignments")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              currentView === "assignments"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <GraduationCap className="size-4" /> Grading Workbench ({pendingAssignments} pending)
          </button>

          <button
            onClick={() => onViewChange("discussions")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              currentView === "discussions"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <MessageSquare className="size-4" /> Video Q&A Moderation
          </button>

          <button
            onClick={() => onViewChange("analytics")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              currentView === "analytics"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <TrendingUp className="size-4" /> Financial Ledger
          </button>
        </div>

        {/* Content Container */}
        <main className="min-w-0">{children}</main>
      </div>

      {/* Console Status Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0d1321] py-3 text-xs font-mono text-slate-400">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="size-2 rounded-full bg-cyan-400" />
              Skillbridge Enterprise Faculty Cluster
            </span>
            <span className="text-slate-600">|</span>
            <span>Auth Realm: Verified Instructor</span>
          </div>
          <div>
            <span>Encrypted Ledger · Automated Razorpay Webhook Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
