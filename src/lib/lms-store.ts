// Shared LMS data store for student submissions, video comments, and instructor management

export interface AssignmentSubmission {
  id: string;
  courseSlug: string;
  courseTitle: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  githubUrl?: string | undefined;
  solutionNotes: string;
  submittedAt: string;
  status: "pending" | "reviewed" | "approved" | "needs_revision";
  score?: number | undefined;
  maxScore: number;
  feedback?: string | undefined;
  gradedAt?: string | undefined;
  gradedBy?: string | undefined;
}

export interface VideoComment {
  id: string;
  courseSlug: string;
  lectureId: number;
  lectureTitle: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
  timestamp?: string | undefined; // e.g. "02:15"
  content: string;
  createdAt: string;
  replies?:
    | {
        id: string;
        authorName: string;
        authorRole: "student" | "teacher" | "admin";
        content: string;
        createdAt: string;
      }[]
    | undefined;
}

export interface EnrolledStudent {
  completedLessons?: number;
  totalRequiredLessons?: number;
  completedAt?: string;
  assignmentStatus?: string;
  quizStatus?: string;
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseSlug: string;
  courseTitle: string;
  enrolledAt: string;
  pricePaidInr: number;
  progress: number; // percentage 0 - 100
  completedLectures: number;
  totalLectures: number;
  status: "in_progress" | "completed";
  certificateEarned: boolean;
  certificateId?: string | undefined;
  lastActive: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  marks: number;
}

export interface Quiz {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  passPercentage: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseSlug: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  answers: Record<number, number>;
}

export interface AssignmentDefinition {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionCount?: number;
}

export interface CourseLesson {
  id: string;
  courseSlug: string;
  title: string;
  duration: string;
  videoUrl: string;
  isPreview: boolean;
  order: number;
}

const DEFAULT_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: "sub-101",
    courseSlug: "advanced-typescript",
    courseTitle: "Advanced TypeScript & Design Patterns",
    assignmentId: "asg-ts-1",
    assignmentTitle: "Build a Type-Safe Event Bus with Generics",
    studentId: "std-sarah-1",
    studentName: "Alex Rivera",
    studentEmail: "alex.rivera@example.com",
    githubUrl: "https://github.com/alexrivera/type-safe-event-bus",
    solutionNotes:
      "Implemented a strictly typed publish/subscribe bus with mapped types, conditional return values, and full test suite covering edge cases.",
    submittedAt: "2026-09-28T14:32:00Z",
    status: "approved",
    score: 96,
    maxScore: 100,
    feedback:
      "Excellent use of distributive conditional types and unregister subscriptions. Well documented!",
    gradedAt: "2026-09-29T10:15:00Z",
    gradedBy: "Sarah Chen (Lead Instructor)",
  },
  {
    id: "sub-102",
    courseSlug: "system-design",
    courseTitle: "System Design Fundamentals",
    assignmentId: "asg-sd-1",
    assignmentTitle: "Distributed Rate Limiter & Token Bucket Architecture",
    studentId: "std-marcus-2",
    studentName: "Marcus Vance",
    studentEmail: "marcus.vance@example.com",
    githubUrl: "https://github.com/marcusvance/distributed-rate-limiter",
    solutionNotes:
      "Designed high-throughput rate limiter using Redis sliding-window log with Lua scripting to eliminate race conditions.",
    submittedAt: "2026-09-29T18:45:00Z",
    status: "pending",
    maxScore: 100,
  },
  {
    id: "sub-103",
    courseSlug: "react-performance",
    courseTitle: "React Performance & Architecture",
    assignmentId: "asg-react-1",
    assignmentTitle: "Virtual List & Memoization Profiler",
    studentId: "std-priya-3",
    studentName: "Priya Sharma",
    studentEmail: "priya.sharma@example.com",
    githubUrl: "https://github.com/priyasharma/react-virtual-grid",
    solutionNotes:
      "Built dynamic row-height virtualization engine reducing DOM node count from 10,000 to 24 with 60 FPS scrolling.",
    submittedAt: "2026-09-30T03:10:00Z",
    status: "pending",
    maxScore: 100,
  },
];

const DEFAULT_COMMENTS: VideoComment[] = [
  {
    id: "cmt-1",
    courseSlug: "advanced-typescript",
    lectureId: 0,
    lectureTitle: "Course Overview & Setup",
    authorId: "std-alex-1",
    authorName: "Alex Rivera",
    authorRole: "student",
    timestamp: "01:45",
    content:
      "Is TypeScript 5.8 decorative metadata supported natively with this project structure?",
    createdAt: "2026-09-28T16:20:00Z",
    replies: [
      {
        id: "rep-1",
        authorName: "Sarah Chen",
        authorRole: "teacher",
        content:
          "Yes! The tsconfig is configured with standard experimentalDecorators and standard decorators enabled.",
        createdAt: "2026-09-28T17:05:00Z",
      },
    ],
  },
  {
    id: "cmt-2",
    courseSlug: "advanced-typescript",
    lectureId: 1,
    lectureTitle: "Advanced Generic Constraints",
    authorId: "std-marcus-2",
    authorName: "Marcus Vance",
    authorRole: "student",
    timestamp: "02:30",
    content:
      "Could you clarify when to use `extends keyof` vs a generic parameter with indexed access?",
    createdAt: "2026-09-29T11:10:00Z",
    replies: [
      {
        id: "rep-2",
        authorName: "Sarah Chen",
        authorRole: "teacher",
        content:
          "Great question! Use `K extends keyof T` when you want TypeScript to enforce that the key strictly exists on the object, preserving autocomplete for callers.",
        createdAt: "2026-09-29T12:00:00Z",
      },
    ],
  },
  {
    id: "cmt-3",
    courseSlug: "system-design",
    lectureId: 0,
    lectureTitle: "Scale from Zero to Millions",
    authorId: "std-priya-3",
    authorName: "Priya Sharma",
    authorRole: "student",
    timestamp: "01:15",
    content:
      "At what QPS threshold do you recommend introducing an async message broker like Kafka instead of RabbitMQ?",
    createdAt: "2026-09-29T19:22:00Z",
  },
];

const DEFAULT_ENROLLED_STUDENTS: EnrolledStudent[] = [
  {
    id: "enr-1",
    studentId: "std-sarah-1",
    studentName: "Alex Rivera",
    studentEmail: "alex.rivera@example.com",
    courseSlug: "advanced-typescript",
    courseTitle: "Advanced TypeScript & Design Patterns",
    enrolledAt: "2026-09-25T10:00:00Z",
    pricePaidInr: 1299,
    progress: 100,
    completedLectures: 3,
    totalLectures: 3,
    status: "completed",
    certificateEarned: true,
    certificateId: "SKILL-TS-2026-8819",
    lastActive: "Today at 02:40 PM",
  },
  {
    id: "enr-2",
    studentId: "std-marcus-2",
    studentName: "Marcus Vance",
    studentEmail: "marcus.vance@example.com",
    courseSlug: "system-design",
    courseTitle: "System Design Fundamentals",
    enrolledAt: "2026-09-26T14:30:00Z",
    pricePaidInr: 1499,
    progress: 67,
    completedLectures: 2,
    totalLectures: 3,
    status: "in_progress",
    certificateEarned: false,
    lastActive: "Yesterday",
  },
  {
    id: "enr-3",
    studentId: "std-priya-3",
    studentName: "Priya Sharma",
    studentEmail: "priya.sharma@example.com",
    courseSlug: "react-performance",
    courseTitle: "React Performance & Architecture",
    enrolledAt: "2026-09-27T09:15:00Z",
    pricePaidInr: 999,
    progress: 100,
    completedLectures: 3,
    totalLectures: 3,
    status: "completed",
    certificateEarned: true,
    certificateId: "SKILL-REACT-2026-4421",
    lastActive: "3 hours ago",
  },
  {
    id: "enr-4",
    studentId: "std-david-4",
    studentName: "David Kim",
    studentEmail: "david.kim@example.com",
    courseSlug: "dsa",
    courseTitle: "Data Structures & Algorithms",
    enrolledAt: "2026-09-28T16:00:00Z",
    pricePaidInr: 799,
    progress: 33,
    completedLectures: 1,
    totalLectures: 3,
    status: "in_progress",
    certificateEarned: false,
    lastActive: "2 days ago",
  },
];

const SUBMISSIONS_KEY = "skillbridge_lms_submissions";
const COMMENTS_KEY = "skillbridge_lms_comments";
const STUDENTS_KEY = "skillbridge_lms_students";

// Submissions helpers
export function getSubmissions(): AssignmentSubmission[] {
  if (typeof window === "undefined") return DEFAULT_SUBMISSIONS;
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
}

export function saveSubmission(
  submission: Omit<AssignmentSubmission, "id" | "submittedAt" | "status" | "maxScore">,
): AssignmentSubmission {
  const all = getSubmissions();
  const created: AssignmentSubmission = {
    ...submission,
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    submittedAt: new Date().toISOString(),
    status: "pending",
    maxScore: 100,
  };
  const updated = [created, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_submissions_updated"));
  }
  return created;
}

export function gradeSubmission(
  submissionId: string,
  grade: {
    status: "approved" | "needs_revision" | "reviewed";
    score: number;
    feedback: string;
    gradedBy: string;
  },
): AssignmentSubmission | null {
  const all = getSubmissions();
  let found: AssignmentSubmission | null = null;
  const updated = all.map((sub) => {
    if (sub.id === submissionId) {
      found = {
        ...sub,
        status: grade.status,
        score: grade.score,
        feedback: grade.feedback,
        gradedBy: grade.gradedBy,
        gradedAt: new Date().toISOString(),
      };
      return found;
    }
    return sub;
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_submissions_updated"));
  }
  return found;
}

// Video Comments helpers
export function getVideoComments(courseSlug?: string, lectureId?: number): VideoComment[] {
  if (typeof window === "undefined") return DEFAULT_COMMENTS;
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    let comments: VideoComment[] = DEFAULT_COMMENTS;
    if (raw) {
      comments = JSON.parse(raw);
    } else {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(DEFAULT_COMMENTS));
    }
    if (courseSlug !== undefined && lectureId !== undefined) {
      return comments.filter((c) => c.courseSlug === courseSlug && c.lectureId === lectureId);
    }
    if (courseSlug !== undefined) {
      return comments.filter((c) => c.courseSlug === courseSlug);
    }
    return comments;
  } catch {
    return DEFAULT_COMMENTS;
  }
}

export function addVideoComment(
  comment: Omit<VideoComment, "id" | "createdAt" | "replies">,
): VideoComment {
  const all = getVideoComments();
  const created: VideoComment = {
    ...comment,
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  const updated = [created, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_comments_updated"));
  }
  return created;
}

export function replyToComment(
  commentId: string,
  reply: {
    authorName: string;
    authorRole: "student" | "teacher" | "admin";
    content: string;
  },
): boolean {
  const all = getVideoComments();
  const updated = all.map((c) => {
    if (c.id === commentId) {
      const replies = c.replies ?? [];
      return {
        ...c,
        replies: [
          ...replies,
          {
            id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            authorName: reply.authorName,
            authorRole: reply.authorRole,
            content: reply.content,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
    return c;
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_comments_updated"));
  }
  return true;
}

// Enrolled Students helpers
export function getEnrolledStudents(courseSlug?: string): EnrolledStudent[] {
  if (typeof window === "undefined") return DEFAULT_ENROLLED_STUDENTS;
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    let students: EnrolledStudent[] = DEFAULT_ENROLLED_STUDENTS;
    if (raw) {
      students = JSON.parse(raw);
    } else {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_ENROLLED_STUDENTS));
    }
    if (courseSlug) {
      return students.filter((s) => s.courseSlug === courseSlug);
    }
    return students;
  } catch {
    return DEFAULT_ENROLLED_STUDENTS;
  }
}

export function syncStudentEnrollment(student: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseSlug: string;
  courseTitle: string;
  pricePaidInr: number;
  completedLectures: number;
  totalLectures: number;
}) {
  const all = getEnrolledStudents();
  const progress = Math.min(
    100,
    Math.round((student.completedLectures / Math.max(1, student.totalLectures)) * 100),
  );
  const isCompleted = progress >= 100;

  const existingIdx = all.findIndex(
    (s) => s.studentId === student.studentId && s.courseSlug === student.courseSlug,
  );
  let updated: EnrolledStudent[];

  if (existingIdx >= 0) {
    const existing = all[existingIdx]!;
    all[existingIdx] = {
      ...existing,
      studentName: student.studentName || existing.studentName,
      completedLectures: student.completedLectures,
      progress,
      status: isCompleted ? "completed" : "in_progress",
      certificateEarned: isCompleted || existing.certificateEarned,
      certificateId:
        existing.certificateId ||
        (isCompleted
          ? `SKILL-${student.courseSlug.toUpperCase().slice(0, 4)}-2026-${Math.floor(1000 + Math.random() * 9000)}`
          : undefined),
      lastActive: "Just now",
    };
    updated = [...all];
  } else {
    const newRecord: EnrolledStudent = {
      id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
      courseSlug: student.courseSlug,
      courseTitle: student.courseTitle,
      enrolledAt: new Date().toISOString(),
      pricePaidInr: student.pricePaidInr,
      progress,
      completedLectures: student.completedLectures,
      totalLectures: student.totalLectures,
      status: isCompleted ? "completed" : "in_progress",
      certificateEarned: isCompleted,
      certificateId: isCompleted
        ? `SKILL-${student.courseSlug.toUpperCase().slice(0, 4)}-2026-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined,
      lastActive: "Just now",
    };
    updated = [newRecord, ...all];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_students_updated"));
  }
}

// -------------------------------------------------------------
// QUIZZES & ASSESSMENTS
// -------------------------------------------------------------
const QUIZZES_KEY = "skillbridge_lms_quizzes";
const QUIZ_ATTEMPTS_KEY = "skillbridge_lms_quiz_attempts";
const ASSIGNMENT_DEFS_KEY = "skillbridge_lms_assignment_defs";
const LESSONS_KEY = "skillbridge_lms_lessons";

const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: "quiz-ts-1",
    courseSlug: "advanced-typescript",
    courseTitle: "Advanced TypeScript & Design Patterns",
    title: "TypeScript Generics & Utility Types Assessment",
    description:
      "Validate your comprehension of distributive conditional types, mapped types, and const assertions.",
    durationMinutes: 15,
    passPercentage: 80,
    questions: [
      {
        id: 1,
        question: "What does the `infer` keyword accomplish when used inside a conditional type?",
        options: [
          "It forces runtime type casting of unknown values",
          "It introduces a type variable to be deduced from the type being checked",
          "It prevents union distribution across conditional branches",
          "It guarantees nullability validation at compile-time",
        ],
        correctOption: 1,
        explanation:
          "`infer` introduces a type variable within the `extends` clause of a conditional type to extract inner types.",
        marks: 25,
      },
      {
        id: 2,
        question: "When applying `[T] extends [any]` instead of `T extends any`, what occurs?",
        options: [
          "Union distribution is disabled",
          "The type becomes strictly mutable",
          "A runtime type check is generated",
          "The condition automatically evaluates to false",
        ],
        correctOption: 0,
        explanation:
          "Wrapping the checked type in a tuple prevents distributive conditional behavior over union types.",
        marks: 25,
      },
      {
        id: 3,
        question:
          "Which utility type converts all properties of type T into deeply immutable fields?",
        options: [
          "Partial<T>",
          "Readonly<T> (shallow only)",
          "DeepReadonly<T> (custom recursive mapped type)",
          "Record<keyof T, never>",
        ],
        correctOption: 2,
        explanation:
          "Built-in `Readonly<T>` is shallow; deep immutability requires a recursive mapped type like `DeepReadonly<T>`.",
        marks: 25,
      },
      {
        id: 4,
        question: "What happens when you apply `as const` on an array literal `[1, 2, 3]`?",
        options: [
          "It becomes a mutable number array `number[]`",
          "It becomes a readonly tuple `readonly [1, 2, 3]` with literal element types",
          "It gets compiled into an ES6 Set",
          "It throws a syntax error in strict mode",
        ],
        correctOption: 1,
        explanation:
          "`as const` preserves exact literal types and assigns readonly tuple semantics.",
        marks: 25,
      },
    ],
  },
  {
    id: "quiz-sd-1",
    courseSlug: "system-design",
    courseTitle: "System Design Fundamentals",
    title: "Distributed Systems & Scalability Assessment",
    description:
      "Test architectural knowledge of CAP theorem, database sharding, caching strategies, and consensus.",
    durationMinutes: 20,
    passPercentage: 75,
    questions: [
      {
        id: 1,
        question:
          "In the CAP theorem, what trade-off must a distributed database make in the presence of a network partition (P)?",
        options: [
          "Choose between Cost and Latency",
          "Choose between Consistency (C) and Availability (A)",
          "Choose between Throughput and Encryption",
          "Choose between CPU utilization and Memory capacity",
        ],
        correctOption: 1,
        explanation:
          "During network partitions, systems must choose whether to reject requests (Consistency) or return stale data (Availability).",
        marks: 25,
      },
      {
        id: 2,
        question:
          "Which cache invalidation strategy writes directly to cache and asynchronously flushes to storage?",
        options: ["Write-through", "Write-behind (Write-back)", "Cache-aside", "Read-through"],
        correctOption: 1,
        explanation:
          "Write-behind acknowledges the write after caching and flushes asynchronously to persistent storage.",
        marks: 25,
      },
      {
        id: 3,
        question:
          "What primary problem does Consistent Hashing solve in distributed caching clusters?",
        options: [
          "Minimizes key redistribution when nodes are added or removed",
          "Guarantees ACID transactions across partitions",
          "Encrypts network traffic using hash chains",
          "Compresses payload size by 90%",
        ],
        correctOption: 0,
        explanation:
          "Consistent hashing maps nodes and keys to a ring, only remapping k/n keys when a node leaves or joins.",
        marks: 25,
      },
      {
        id: 4,
        question:
          "What is the primary drawback of using two-phase commit (2PC) for distributed transactions?",
        options: [
          "It cannot support relational SQL queries",
          "It is a blocking protocol vulnerable to coordinator failure",
          "It violates row-level security policies",
          "It only operates over UDP connections",
        ],
        correctOption: 1,
        explanation:
          "2PC blocks resource locks while waiting for the coordinator, creating potential system halts if nodes disconnect.",
        marks: 25,
      },
    ],
  },
  {
    id: "quiz-react-1",
    courseSlug: "react-performance",
    courseTitle: "React Performance & Architecture",
    title: "React Concurrent Mode & Reconciliation Quiz",
    description:
      "Benchmark your understanding of fiber architecture, memoization, and selective hydration.",
    durationMinutes: 15,
    passPercentage: 80,
    questions: [
      {
        id: 1,
        question: "What is the primary purpose of the `useTransition` hook in React 18+?",
        options: [
          "To animate CSS transitions between pages",
          "To mark state updates as non-urgent transitions that yield to user inputs",
          "To automatically debounce input fields by 300ms",
          "To enforce synchronous rendering during server-side hydration",
        ],
        correctOption: 1,
        explanation:
          "`useTransition` marks state updates as non-blocking transitions so the browser remains responsive.",
        marks: 33,
      },
      {
        id: 2,
        question:
          "Why can excessive use of `useCallback` and `useMemo` sometimes degrade performance?",
        options: [
          "They introduce garbage collection and dependency comparison overhead without sufficient computation savings",
          "They cause immediate component unmounting",
          "They disable React Developer Tools",
          "They force synchronous DOM reflows",
        ],
        correctOption: 0,
        explanation:
          "Allocating dependency arrays and closures on every render often costs more than recalculating cheap values.",
        marks: 33,
      },
      {
        id: 3,
        question:
          "What optimization technique renders only the visible subset of rows in large datasets?",
        options: [
          "Tree shaking",
          "DOM Virtualization / Windowing",
          "Code splitting",
          "Prefetching",
        ],
        correctOption: 1,
        explanation:
          "Virtualization renders only items currently within the viewport, reducing DOM node counts dramatically.",
        marks: 34,
      },
    ],
  },
];

const DEFAULT_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: "att-1",
    quizId: "quiz-ts-1",
    quizTitle: "TypeScript Generics & Utility Types Assessment",
    courseSlug: "advanced-typescript",
    studentId: "std-sarah-1",
    studentName: "Alex Rivera",
    score: 100,
    totalMarks: 100,
    percentage: 100,
    passed: true,
    completedAt: "2026-09-27T15:30:00Z",
    answers: { 1: 1, 2: 0, 3: 2, 4: 1 },
  },
  {
    id: "att-2",
    quizId: "quiz-sd-1",
    quizTitle: "Distributed Systems & Scalability Assessment",
    courseSlug: "system-design",
    studentId: "std-marcus-2",
    studentName: "Marcus Vance",
    score: 75,
    totalMarks: 100,
    percentage: 75,
    passed: true,
    completedAt: "2026-09-28T18:00:00Z",
    answers: { 1: 1, 2: 1, 3: 0, 4: 0 },
  },
];

const DEFAULT_ASSIGNMENT_DEFS: AssignmentDefinition[] = [
  {
    id: "asg-ts-1",
    courseSlug: "advanced-typescript",
    courseTitle: "Advanced TypeScript & Design Patterns",
    title: "Build a Type-Safe Event Bus with Generics",
    description:
      "Design a strictly-typed EventBus class capable of subscribing to event payloads, inferring parameter signatures, and providing unsubscribe teardowns.",
    dueDate: "2026-10-15",
    maxScore: 100,
    submissionCount: 4,
  },
  {
    id: "asg-sd-1",
    courseSlug: "system-design",
    courseTitle: "System Design Fundamentals",
    title: "Distributed Rate Limiter & Token Bucket Architecture",
    description:
      "Architect a production-grade token bucket rate limiter supporting 50,000 req/sec across multiple nodes using Redis Lua scripts.",
    dueDate: "2026-10-20",
    maxScore: 100,
    submissionCount: 3,
  },
  {
    id: "asg-react-1",
    courseSlug: "react-performance",
    courseTitle: "React Performance & Architecture",
    title: "Virtual List & Memoization Profiler",
    description:
      "Construct a customized virtualized grid handling 50,000 tabular items without dropping below 60fps on low-end hardware.",
    dueDate: "2026-10-25",
    maxScore: 100,
    submissionCount: 2,
  },
  {
    id: "asg-dsa-1",
    courseSlug: "dsa",
    courseTitle: "Data Structures & Algorithms",
    title: "LRU Cache & Trie Autocomplete Engine",
    description:
      "Implement an O(1) Least Recently Used cache combined with a prefix tree supporting top-K autocomplete queries.",
    dueDate: "2026-10-30",
    maxScore: 100,
    submissionCount: 1,
  },
];

export function getQuizzes(): Quiz[] {
  if (typeof window === "undefined") return DEFAULT_QUIZZES;
  try {
    const raw = localStorage.getItem(QUIZZES_KEY);
    if (!raw) {
      localStorage.setItem(QUIZZES_KEY, JSON.stringify(DEFAULT_QUIZZES));
      return DEFAULT_QUIZZES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_QUIZZES;
  }
}

export function saveQuiz(quiz: Omit<Quiz, "id">): Quiz {
  const all = getQuizzes();
  const created: Quiz = {
    ...quiz,
    id: `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
  const updated = [created, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_quizzes_updated"));
  }
  return created;
}

export function getQuizAttempts(studentId?: string): QuizAttempt[] {
  if (typeof window === "undefined") return DEFAULT_QUIZ_ATTEMPTS;
  try {
    const raw = localStorage.getItem(QUIZ_ATTEMPTS_KEY);
    let attempts: QuizAttempt[] = DEFAULT_QUIZ_ATTEMPTS;
    if (raw) {
      attempts = JSON.parse(raw);
    } else {
      localStorage.setItem(QUIZ_ATTEMPTS_KEY, JSON.stringify(DEFAULT_QUIZ_ATTEMPTS));
    }
    if (studentId) {
      return attempts.filter((a) => a.studentId === studentId);
    }
    return attempts;
  } catch {
    return DEFAULT_QUIZ_ATTEMPTS;
  }
}

export function recordQuizAttempt(attempt: Omit<QuizAttempt, "id" | "completedAt">): QuizAttempt {
  const all = getQuizAttempts();
  const created: QuizAttempt = {
    ...attempt,
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    completedAt: new Date().toISOString(),
  };
  const updated = [created, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(QUIZ_ATTEMPTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_quiz_attempts_updated"));
  }
  return created;
}

export function getAssignmentDefinitions(): AssignmentDefinition[] {
  if (typeof window === "undefined") return DEFAULT_ASSIGNMENT_DEFS;
  try {
    const raw = localStorage.getItem(ASSIGNMENT_DEFS_KEY);
    if (!raw) {
      localStorage.setItem(ASSIGNMENT_DEFS_KEY, JSON.stringify(DEFAULT_ASSIGNMENT_DEFS));
      return DEFAULT_ASSIGNMENT_DEFS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ASSIGNMENT_DEFS;
  }
}

export function saveAssignmentDefinition(
  def: Omit<AssignmentDefinition, "id">,
): AssignmentDefinition {
  const all = getAssignmentDefinitions();
  const created: AssignmentDefinition = {
    ...def,
    id: `asg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    submissionCount: 0,
  };
  const updated = [created, ...all];
  if (typeof window !== "undefined") {
    localStorage.setItem(ASSIGNMENT_DEFS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("lms_assignment_defs_updated"));
  }
  return created;
}
