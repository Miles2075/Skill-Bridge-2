import { useState, useRef, useEffect } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Terminal,
  Code2,
  FileCode,
  Sparkles,
  Zap,
  Info,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestCase {
  id: string;
  name: string;
  inputDescription: string;
  expectedOutput: string;
  testFn: string; // JavaScript code snippet returning boolean or throwing
}

interface LabChallenge {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  estimatedMinutes: number;
  description: string;
  instructions: string[];
  starterCode: string;
  solutionHint?: string;
  testCases: TestCase[];
}

const LAB_CHALLENGES: LabChallenge[] = [
  {
    id: "debounce-fn",
    title: "1. Custom Debounce Utility",
    difficulty: "Intermediate",
    category: "JavaScript / React Performance",
    estimatedMinutes: 15,
    description:
      "Unlike passive video tutorials on Udemy, here you must build a real debounce function that prevents excessive invocations during high-frequency events like search inputs or window resizing.",
    instructions: [
      "Implement a function `debounce(fn, delay)` that takes a callback `fn` and a delay in milliseconds.",
      "It must return a new wrapped function.",
      "Each invocation of the wrapped function should cancel any pending timer and set a new one.",
      "When the timer finishes, it must call the original `fn` with the arguments passed to the latest invocation.",
    ],
    starterCode: `/**
 * Implement a debounce function
 * @param {Function} fn - The callback to execute after delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(fn, delay) {
  let timerId = null;

  return function debounced(...args) {
    // Your code here
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
`,
    solutionHint:
      "Store `let timerId = null;` in closure. In the returned function, call `clearTimeout(timerId)` and reassign `timerId = setTimeout(() => fn(...args), delay)`.",
    testCases: [
      {
        id: "t1",
        name: "Returns a function",
        inputDescription: "typeof debounce(() => {}, 100)",
        expectedOutput: "'function'",
        testFn: `
          const d = debounce(() => {}, 100);
          return typeof d === "function";
        `,
      },
      {
        id: "t2",
        name: "Delays invocation",
        inputDescription: "Call once, wait 50ms (delay 100ms)",
        expectedOutput: "Called 0 times initially, 1 time after delay",
        testFn: `
          let count = 0;
          const fn = debounce(() => { count++; }, 50);
          fn();
          if (count !== 0) return false;
          await new Promise(r => setTimeout(r, 80));
          return count === 1;
        `,
      },
      {
        id: "t3",
        name: "Only executes the latest call when called rapidly",
        inputDescription: "Rapid 4 calls within 30ms window (delay 60ms)",
        expectedOutput: "Invoked exactly once with the last argument value",
        testFn: `
          let lastArg = null;
          let count = 0;
          const fn = debounce((v) => { count++; lastArg = v; }, 60);
          fn(1);
          fn(2);
          fn(3);
          fn(4);
          await new Promise(r => setTimeout(r, 100));
          return count === 1 && lastArg === 4;
        `,
      },
    ],
  },
  {
    id: "two-sum-map",
    title: "2. Fast Two-Sum (O(N) Hash Map)",
    difficulty: "Beginner",
    category: "Data Structures & Algorithms",
    estimatedMinutes: 10,
    description:
      "Find the two indices in an array that sum up to a target value. A classic tech interview problem that demonstrates space-time complexity trade-offs.",
    instructions: [
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      "You may not use the same element twice.",
      "Achieve O(n) runtime complexity using a Map or Object lookup rather than nested loops.",
    ],
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]} - [index1, index2]
 */
function twoSum(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }

  return [];
}
`,
    testCases: [
      {
        id: "t1",
        name: "Standard positive pair",
        inputDescription: "nums = [2, 7, 11, 15], target = 9",
        expectedOutput: "[0, 1]",
        testFn: `
          const res = twoSum([2, 7, 11, 15], 9);
          return Array.isArray(res) && res[0] === 0 && res[1] === 1;
        `,
      },
      {
        id: "t2",
        name: "Elements at end of array",
        inputDescription: "nums = [3, 2, 4], target = 6",
        expectedOutput: "[1, 2]",
        testFn: `
          const res = twoSum([3, 2, 4], 6);
          return Array.isArray(res) && res[0] === 1 && res[1] === 2;
        `,
      },
      {
        id: "t3",
        name: "Duplicate values in array",
        inputDescription: "nums = [3, 3], target = 6",
        expectedOutput: "[0, 1]",
        testFn: `
          const res = twoSum([3, 3], 6);
          return Array.isArray(res) && res[0] === 0 && res[1] === 1;
        `,
      },
      {
        id: "t4",
        name: "Handles negative numbers",
        inputDescription: "nums = [-1, -2, -3, -4, -5], target = -8",
        expectedOutput: "[2, 4]",
        testFn: `
          const res = twoSum([-1, -2, -3, -4, -5], -8);
          return Array.isArray(res) && res[0] === 2 && res[1] === 4;
        `,
      },
    ],
  },
  {
    id: "async-retry",
    title: "3. Async Fetch Retry with Backoff",
    difficulty: "Advanced",
    category: "System Resilience & Cloud APIs",
    estimatedMinutes: 20,
    description:
      "Production distributed systems face transient network failures. Write a resilient asynchronous retry helper that handles temporary hiccups gracefully.",
    instructions: [
      "Implement `retryAsync(asyncFn, maxAttempts, delayMs)`.",
      "Execute `asyncFn()`. If it resolves, immediately return the resolved value.",
      "If it rejects, wait `delayMs` and retry until `maxAttempts` are exhausted.",
      "If all attempts fail, reject with the final error thrown.",
    ],
    starterCode: `/**
 * Retries an asynchronous task up to maxAttempts with delay
 * @param {Function} asyncFn - Function returning a Promise
 * @param {number} maxAttempts - Total number of tries (e.g. 3)
 * @param {number} delayMs - Delay between attempts in ms
 * @returns {Promise<any>}
 */
async function retryAsync(asyncFn, maxAttempts = 3, delayMs = 50) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asyncFn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
`,
    testCases: [
      {
        id: "t1",
        name: "Succeeds on first try without delay",
        inputDescription: "Successful immediate function",
        expectedOutput: "Returns 'success'",
        testFn: `
          const res = await retryAsync(async () => "success", 3, 50);
          return res === "success";
        `,
      },
      {
        id: "t2",
        name: "Recovers after 2 failures on attempt 3",
        inputDescription: "Fails twice then succeeds",
        expectedOutput: "Resolved on attempt 3",
        testFn: `
          let tries = 0;
          const unstable = async () => {
            tries++;
            if (tries < 3) throw new Error("Network transient glitch");
            return "recovered";
          };
          const res = await retryAsync(unstable, 4, 30);
          return res === "recovered" && tries === 3;
        `,
      },
      {
        id: "t3",
        name: "Throws final error if maxAttempts exhausted",
        inputDescription: "Always failing function with 3 attempts",
        expectedOutput: "Throws error after 3 attempts",
        testFn: `
          let tries = 0;
          try {
            await retryAsync(async () => {
              tries++;
              throw new Error("Persistent outage");
            }, 3, 20);
            return false;
          } catch (e) {
            return tries === 3 && e.message === "Persistent outage";
          }
        `,
      },
    ],
  },
  {
    id: "deep-clone",
    title: "4. Deep Object Clone with Circular Support",
    difficulty: "Intermediate",
    category: "JavaScript Core Internals",
    estimatedMinutes: 15,
    description:
      "Deep cloning objects without leaking references or blowing up on nested structures. A fundamental interview challenge for Senior Frontend engineers.",
    instructions: [
      "Implement `deepClone(obj)` that produces an isolated copy of nested objects and arrays.",
      "Primitive values (strings, numbers, booleans, null, undefined) must be preserved directly.",
      "Dates should be cloned as new Date objects.",
      "Nested objects and arrays must not mutate the original object when modified.",
    ],
    starterCode: `/**
 * Recursively deep clones an object or array
 * @param {any} value
 * @returns {any}
 */
function deepClone(value, map = new WeakMap()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (map.has(value)) {
    return map.get(value);
  }

  const copy = Array.isArray(value) ? [] : {};
  map.set(value, copy);

  for (const key of Object.keys(value)) {
    copy[key] = deepClone(value[key], map);
  }

  return copy;
}
`,
    testCases: [
      {
        id: "t1",
        name: "Preserves primitives and dates",
        inputDescription: "deepClone({ a: 1, b: 'hi', d: new Date(2026, 0, 1) })",
        expectedOutput: "Exact matching values and cloned Date object",
        testFn: `
          const orig = { a: 1, b: "hi", d: new Date(2026, 0, 1) };
          const cloned = deepClone(orig);
          return cloned.a === 1 && cloned.b === "hi" && cloned.d instanceof Date && cloned.d.getTime() === orig.d.getTime();
        `,
      },
      {
        id: "t2",
        name: "Nested objects are independent references",
        inputDescription: "Mutating cloned nested object does not mutate original",
        expectedOutput: "Original remains untouched",
        testFn: `
          const orig = { user: { profile: { skills: ["React", "TS"] } } };
          const cloned = deepClone(orig);
          cloned.user.profile.skills.push("GraphQL");
          return orig.user.profile.skills.length === 2 && cloned.user.profile.skills.length === 3;
        `,
      },
      {
        id: "t3",
        name: "Circular reference protection",
        inputDescription: "Self-referencing object `obj.self = obj`",
        expectedOutput: "Clones without call stack overflow",
        testFn: `
          const circular = { name: "loop" };
          circular.self = circular;
          const cloned = deepClone(circular);
          return cloned.name === "loop" && cloned.self === cloned;
        `,
      },
    ],
  },
];

export function CodeLabView() {
  const [selectedLabId, setSelectedLabId] = useState<string>(LAB_CHALLENGES[0].id);
  const currentLab = LAB_CHALLENGES.find((l) => l.id === selectedLabId) || LAB_CHALLENGES[0];

  const [code, setCode] = useState<string>(currentLab.starterCode);
  const [completedLabs, setCompletedLabs] = useState<string[]>([]);

  const [logs, setLogs] = useState<
    Array<{ type: "log" | "warn" | "error" | "info"; message: string }>
  >([]);
  const [testResults, setTestResults] = useState<
    Array<{
      id: string;
      name: string;
      passed: boolean;
      error?: string;
      durationMs: number;
    }>
  >([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tests" | "console">("tests");
  const [allPassed, setAllPassed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync code when changing lab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`skillbridge_lab_code_${currentLab.id}`);
      setCode(saved || currentLab.starterCode);
      const savedCompleted = JSON.parse(localStorage.getItem("skillbridge_completed_labs") || "[]");
      setCompletedLabs(savedCompleted);
    }
    setLogs([]);
    setTestResults([]);
    setAllPassed(false);
  }, [currentLab.id, currentLab.starterCode]);

  // Persist current code
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    localStorage.setItem(`skillbridge_lab_code_${currentLab.id}`, newCode);
  };

  const handleReset = () => {
    if (confirm("Reset code to starter template? Your edits will be replaced.")) {
      setCode(currentLab.starterCode);
      localStorage.removeItem(`skillbridge_lab_code_${currentLab.id}`);
      setTestResults([]);
      setLogs([]);
      setAllPassed(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run student code only (logs output)
  const handleRunCode = async () => {
    setActiveTab("console");
    setLogs([]);
    const interceptedLogs: Array<{ type: "log" | "warn" | "error" | "info"; message: string }> = [];

    const customConsole = {
      log: (...args: unknown[]) => {
        interceptedLogs.push({
          type: "log",
          message: args
            .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
            .join(" "),
        });
      },
      warn: (...args: unknown[]) => {
        interceptedLogs.push({
          type: "warn",
          message: args
            .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
            .join(" "),
        });
      },
      error: (...args: unknown[]) => {
        interceptedLogs.push({
          type: "error",
          message: args
            .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
            .join(" "),
        });
      },
      info: (...args: unknown[]) => {
        interceptedLogs.push({
          type: "info",
          message: args
            .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
            .join(" "),
        });
      },
    };

    try {
      const runner = new Function("console", `"use strict";\n${code}`);
      const t0 = performance.now();
      runner(customConsole);
      const elapsed = (performance.now() - t0).toFixed(2);
      interceptedLogs.push({
        type: "info",
        message: `✓ Execution finished in ${elapsed}ms.`,
      });
    } catch (err: unknown) {
      interceptedLogs.push({
        type: "error",
        message: err instanceof Error ? err.stack || err.message : String(err),
      });
    }

    setLogs(interceptedLogs);
  };

  // Run automated unit tests
  const handleRunTests = async () => {
    setIsRunningTests(true);
    setActiveTab("tests");
    setLogs([]);
    const results: Array<{
      id: string;
      name: string;
      passed: boolean;
      error?: string;
      durationMs: number;
    }> = [];

    let passedCount = 0;

    for (const t of currentLab.testCases) {
      const t0 = performance.now();
      try {
        // Construct sandbox evaluator
        const wrappedTest = `
          "use strict";
          ${code}

          return (async function() {
            ${t.testFn}
          })();
        `;
        const testRunner = new Function(wrappedTest);
        const passed = await testRunner();
        const duration = Math.round(performance.now() - t0);

        if (passed) {
          passedCount++;
          results.push({ id: t.id, name: t.name, passed: true, durationMs: duration });
        } else {
          results.push({
            id: t.id,
            name: t.name,
            passed: false,
            error: `Expected assertion to return true, but received false.`,
            durationMs: duration,
          });
        }
      } catch (err: unknown) {
        const duration = Math.round(performance.now() - t0);
        results.push({
          id: t.id,
          name: t.name,
          passed: false,
          error: err instanceof Error ? err.message : String(err),
          durationMs: duration,
        });
      }
    }

    setTestResults(results);
    setIsRunningTests(false);
    setAllPassed(passedCount === currentLab.testCases.length);

    // Save lab completion badge in localStorage
    if (passedCount === currentLab.testCases.length) {
      const completed = JSON.parse(localStorage.getItem("skillbridge_completed_labs") || "[]");
      if (!completed.includes(currentLab.id)) {
        completed.push(currentLab.id);
        localStorage.setItem("skillbridge_completed_labs", JSON.stringify(completed));
        setCompletedLabs([...completed]);
      }
    }
  };

  // Keyboard shortcut (Cmd+Enter or Ctrl+Enter to run tests)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunTests();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Why this is better than Udemy/Coursera */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 size-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30">
              <Zap className="size-3.5 text-amber-300" />
              <span>Interactive Code Sandbox & Automated Test Runner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hands-on Code Lab
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Coursera and Udemy trap learners in passive video consumption where you forget 80%
              within days. Skillbridge gives you an in-browser code editor with instant test suites,
              execution metrics, and real algorithm challenges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/15 min-w-[120px]">
              <span className="block text-2xl font-black text-amber-300">
                {completedLabs.length} / {LAB_CHALLENGES.length}
              </span>
              <span className="text-[11px] font-medium text-indigo-200">Labs Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Challenge Selector & Problem Spec (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Layers className="size-3.5 text-indigo-600" />
              <span>Available Coding Labs</span>
            </h2>

            <div className="space-y-1.5">
              {LAB_CHALLENGES.map((lab) => {
                const isSelected = lab.id === currentLab.id;
                const isDone = completedLabs.includes(lab.id);
                return (
                  <button
                    key={lab.id}
                    onClick={() => setSelectedLabId(lab.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-2xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{lab.title}</span>
                        {isDone && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 p-0.5 text-emerald-700">
                            <Check className="size-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span
                          className={`font-semibold ${
                            lab.difficulty === "Beginner"
                              ? "text-emerald-600"
                              : lab.difficulty === "Intermediate"
                                ? "text-amber-600"
                                : "text-rose-600"
                          }`}
                        >
                          {lab.difficulty}
                        </span>
                        <span>•</span>
                        <span>{lab.estimatedMinutes}m</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`size-4 mt-1 transition-transform ${isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-400"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem Description Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {currentLab.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="size-3" /> ~{currentLab.estimatedMinutes} mins
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{currentLab.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {currentLab.description}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Requirements
              </h4>
              <ul className="space-y-2">
                {currentLab.instructions.map((inst, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-normal"
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentLab.solutionHint && (
              <details className="group border border-amber-200 bg-amber-50/60 rounded-lg p-3 text-xs text-amber-900">
                <summary className="font-semibold cursor-pointer flex items-center justify-between text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Info className="size-3.5 text-amber-700" />
                    <span>View Architecture Hint</span>
                  </span>
                  <span className="text-[10px] text-amber-800 group-open:hidden">Show</span>
                </summary>
                <p className="mt-2 text-xs text-amber-900 leading-relaxed border-t border-amber-200/60 pt-2 font-mono text-[11px]">
                  {currentLab.solutionHint}
                </p>
              </details>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor + Test Runner & Console (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Editor Container */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden flex flex-col">
            {/* Editor Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <FileCode className="size-4 text-indigo-400" />
                <span className="font-mono text-xs font-semibold text-slate-200">solution.js</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  JavaScript ES2024
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-400 mr-1" />
                  ) : (
                    <Copy className="size-3 mr-1" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunCode}
                  className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <Play className="size-3 mr-1 text-emerald-400 fill-emerald-400" />
                  Run Code
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs"
                >
                  <Sparkles className="size-3 mr-1 text-amber-300" />
                  {isRunningTests ? "Testing..." : "Run Tests (⌘+Enter)"}
                </Button>
              </div>
            </div>

            {/* Code Textarea Area */}
            <div className="relative font-mono text-sm min-h-[340px]">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full h-full min-h-[340px] bg-slate-950 p-4 font-mono text-xs sm:text-sm text-emerald-300 focus:outline-none resize-y leading-relaxed border-0 selection:bg-indigo-700 selection:text-white"
                placeholder="// Write your implementation here..."
              />
            </div>

            {/* Editor Footer Status */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-4 py-1.5 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span>Lines: {code.split("\n").length}</span>
                <span>Characters: {code.length}</span>
              </div>
              <div className="text-slate-500 hidden sm:block">
                Press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">⌘+Enter</kbd>{" "}
                to execute test suite
              </div>
            </div>
          </div>

          {/* Test Results & Console Output Area */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("tests")}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "tests"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Test Results</span>
                  {testResults.length > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        allPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {testResults.filter((r) => r.passed).length}/{testResults.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("console")}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "console"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Terminal className="size-3.5" />
                  <span>Console Logs</span>
                  {logs.length > 0 && (
                    <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 font-semibold">
                      {logs.length}
                    </span>
                  )}
                </button>
              </div>

              {allPassed && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="size-4" />
                  <span>All Tests Passed! 🎉</span>
                </div>
              )}
            </div>

            {/* Tab Body */}
            <div className="p-4 min-h-[160px]">
              {activeTab === "tests" && (
                <div>
                  {testResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      <Code2 className="mx-auto size-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No test runs yet.</p>
                      <p className="mt-1">
                        Click <strong className="text-indigo-600">"Run Tests"</strong> above to
                        verify your solution against {currentLab.testCases.length} unit test
                        assertions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {testResults.map((result, idx) => (
                        <div
                          key={result.id}
                          className={`rounded-lg p-3 text-xs border transition-all ${
                            result.passed
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                              : "bg-rose-50/60 border-rose-200 text-rose-950"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.passed ? (
                                <CheckCircle2 className="size-4 text-emerald-600" />
                              ) : (
                                <XCircle className="size-4 text-rose-600" />
                              )}
                              <span className="font-bold">
                                Case {idx + 1}: {result.name}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500">
                              {result.durationMs}ms
                            </span>
                          </div>

                          {!result.passed && result.error && (
                            <div className="mt-2 rounded bg-rose-900/10 p-2 font-mono text-[11px] text-rose-800 border border-rose-200/60">
                              {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "console" && (
                <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-200 min-h-[120px]">
                  {logs.length === 0 ? (
                    <span className="text-slate-500 italic">
                      // Console is clear. Run your code or use console.log() to view output here.
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`leading-relaxed ${
                            log.type === "error"
                              ? "text-rose-400 font-bold"
                              : log.type === "warn"
                                ? "text-amber-300"
                                : log.type === "info"
                                  ? "text-sky-300"
                                  : "text-slate-200"
                          }`}
                        >
                          {log.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
