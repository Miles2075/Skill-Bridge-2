import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor: string;
  teacher_id: string | null;
  thumbnail: string;
  status: "published" | "draft" | "review";
  price_inr: number;
  preview_minutes: number;
  video_url: string;
  hours: number;
  level: string;
  category: string;
  rating: number;
  reviews: string;
  learners: string;
  bestseller?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  lesson_order: number;
  is_required: boolean;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  enrolled_at: string;
  completion_percentage: number;
  completed_at: string | null;
  status: "enrolled" | "in_progress" | "completed";
}

export interface LessonProgress {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  github_url: string;
  solution_notes: string;
  submitted_at: string;
  status: "pending" | "approved" | "resubmission_required";
  score: number | null;
  max_score: number;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
  marks: number;
}

export interface Quiz {
  id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  title: string;
  description: string;
  duration_minutes: number;
  pass_percentage: number;
  questions: QuizQuestion[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  answers: Record<string, number>;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  completion_date: string;
  created_at: string;
}

export interface LocalUser {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
  updated_at: string;
  user_metadata: {
    display_name?: string;
    role?: "student" | "teacher" | "admin";
    avatar_url?: string;
    sub?: string;
    email?: string;
    [key: string]: unknown;
  };
}

export interface LocalUserRole {
  id: string;
  user_id: string;
  role: "student" | "teacher" | "admin";
  created_at: string;
}

export interface LocalSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface LocalPurchase {
  id: string;
  user_id: string;
  course_id: string;
  amount_inr: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface LocalProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

export interface LMSDatabase {
  courses: Course[];
  lessons: CourseLesson[];
  enrollments: Enrollment[];
  lesson_progress: LessonProgress[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  quizzes: Quiz[];
  quiz_attempts: QuizAttempt[];
  certificates: Certificate[];
  users: LocalUser[];
  user_roles: LocalUserRole[];
  sessions: LocalSession[];
  purchases: LocalPurchase[];
  profiles: LocalProfile[];
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DB_DIR, "lms-db.json");

const INITIAL_COURSES: Course[] = [
  {
    id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    slug: "react-performance",
    title: "React Performance & Architecture",
    description:
      "Profile, memoise and structure large React applications that stay fast as they grow.",
    instructor: "Marcus Webb",
    teacher_id: null,
    thumbnail: "/course-react.jpg",
    status: "published",
    price_inr: 999,
    preview_minutes: 3,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    hours: 16,
    level: "Intermediate",
    category: "Web Development",
    rating: 4.7,
    reviews: "8,932",
    learners: "31,764",
    bestseller: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-29T06:03:15.734Z",
  },
  {
    id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    slug: "advanced-typescript",
    title: "Advanced TypeScript & Design Patterns",
    description:
      "Master the type system, generics and practical design patterns used in production codebases.",
    instructor: "Sarah Chen",
    teacher_id: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    thumbnail: "/course-typescript.jpg",
    status: "published",
    price_inr: 1299,
    preview_minutes: 3,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    hours: 18,
    level: "Advanced",
    category: "Web Development",
    rating: 4.8,
    reviews: "12,480",
    learners: "48,210",
    bestseller: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-29T06:03:15.734Z",
  },
  {
    id: "ed458579-67a4-41bc-b426-ff10ce69551e",
    slug: "system-design",
    title: "System Design Fundamentals",
    description:
      "Load balancing, caching, queues and databases — design systems that scale with confidence.",
    instructor: "Priya Raman",
    teacher_id: null,
    thumbnail: "/course-system-design.jpg",
    status: "published",
    price_inr: 1499,
    preview_minutes: 2,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    hours: 20,
    level: "Intermediate",
    category: "Software Architecture",
    rating: 4.9,
    reviews: "15,207",
    learners: "62,905",
    bestseller: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-29T06:03:15.734Z",
  },
  {
    id: "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e",
    slug: "dsa",
    title: "Data Structures & Algorithms",
    description:
      "Core data structures, algorithmic patterns and complexity analysis for technical interviews.",
    instructor: "Daniel Okafor",
    teacher_id: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    thumbnail: "/course-dsa.jpg",
    status: "published",
    price_inr: 799,
    preview_minutes: 3,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    hours: 24,
    level: "Intermediate",
    category: "Computer Science",
    rating: 4.6,
    reviews: "21,338",
    learners: "84,120",
    bestseller: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-29T06:03:15.734Z",
  },
];

const INITIAL_LESSONS: CourseLesson[] = [
  // React Performance Lessons
  {
    id: "les-react-1",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    title: "1. Profiling Renders with React DevTools",
    description: "Understand commit phase, flame graphs, and identify unnecessary re-renders.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: "18:40",
    lesson_order: 1,
    is_required: true,
    is_preview: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-react-2",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    title: "2. Strategic Memoization (useMemo, useCallback & React.memo)",
    description: "When memoization saves CPU cycles and when it costs more than re-running.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: "24:15",
    lesson_order: 2,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-react-3",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    title: "3. Virtualization & DOM Pruning at Scale",
    description: "Building 100,000+ item infinite scrolls with dynamic windowing and zero lag.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: "28:50",
    lesson_order: 3,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },

  // Advanced TypeScript Lessons
  {
    id: "les-ts-1",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    title: "1. Advanced Type Narrowing & Discriminated Unions",
    description: "Master pattern matching and compile-time exhaustiveness checking.",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "15:20",
    lesson_order: 1,
    is_required: true,
    is_preview: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-ts-2",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    title: "2. Template Literal Types & Key Remapping",
    description: "Create type-safe event buses and DSLs directly in TypeScript's type system.",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "21:30",
    lesson_order: 2,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-ts-3",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    title: "3. Conditional Types & Distributive Inference (infer keyword)",
    description: "Unwrap nested promises, function arguments, and build recursive utility types.",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "26:45",
    lesson_order: 3,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },

  // System Design Lessons
  {
    id: "les-sys-1",
    course_id: "ed458579-67a4-41bc-b426-ff10ce69551e",
    title: "1. High Availability & Load Balancing Strategies",
    description: "L4 vs L7 routing, consistent hashing, and failover topologies.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "22:10",
    lesson_order: 1,
    is_required: true,
    is_preview: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-sys-2",
    course_id: "ed458579-67a4-41bc-b426-ff10ce69551e",
    title: "2. Distributed Caching & Cache Eviction (Redis / Memcached)",
    description: "Cache-aside, write-through, stampede prevention, and Redis clustering.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "27:40",
    lesson_order: 2,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-sys-3",
    course_id: "ed458579-67a4-41bc-b426-ff10ce69551e",
    title: "3. Database Sharding & Leaderless Replication",
    description: "Handling multi-terabyte writes with partitioning keys and quorum reads.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "31:00",
    lesson_order: 3,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },

  // DSA Lessons
  {
    id: "les-dsa-1",
    course_id: "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e",
    title: "1. Asymptotic Complexity & Two-Pointer Patterns",
    description: "Sliding window, fast & slow pointers, and rigorous Big-O space/time proofs.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: "19:30",
    lesson_order: 1,
    is_required: true,
    is_preview: true,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-dsa-2",
    course_id: "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e",
    title: "2. Graph Traversal: BFS, DFS & Topological Sorting",
    description: "Cycle detection, shortest paths with Dijkstra, and dependency resolution.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: "25:15",
    lesson_order: 2,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "les-dsa-3",
    course_id: "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e",
    title: "3. Dynamic Programming: State Transitions & Memoization",
    description: "Knapsack variants, longest common subsequence, and space-optimized DP tables.",
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: "34:00",
    lesson_order: 3,
    is_required: true,
    is_preview: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-ts-1",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    course_slug: "advanced-typescript",
    course_title: "Advanced TypeScript & Design Patterns",
    title: "Build a Type-Safe Event Bus with Generics",
    description:
      "Implement a typed EventEmitter in TypeScript with subscribe, unsubscribe, and emit methods. Must handle strongly-typed payloads and prevent unregistered events.",
    due_date: "2026-10-15T23:59:59.000Z",
    max_score: 100,
    created_by: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    created_at: "2026-09-15T00:00:00.000Z",
    updated_at: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "asg-sd-1",
    course_id: "ed458579-67a4-41bc-b426-ff10ce69551e",
    course_slug: "system-design",
    course_title: "System Design Fundamentals",
    title: "Distributed Rate Limiter & Token Bucket Architecture",
    description:
      "Design a sliding window counter or token bucket rate limiter for a public API handling 50,000 req/sec across 3 geographic regions.",
    due_date: "2026-10-18T23:59:59.000Z",
    max_score: 100,
    created_by: null,
    created_at: "2026-09-16T00:00:00.000Z",
    updated_at: "2026-09-16T00:00:00.000Z",
  },
  {
    id: "asg-react-1",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    course_slug: "react-performance",
    course_title: "React Performance & Architecture",
    title: "Virtual List & Memoization Profiler",
    description:
      "Build a custom virtualized grid component in React 19 capable of smoothly rendering 200,000 tabular items with dynamic row heights.",
    due_date: "2026-10-22T23:59:59.000Z",
    max_score: 100,
    created_by: null,
    created_at: "2026-09-17T00:00:00.000Z",
    updated_at: "2026-09-17T00:00:00.000Z",
  },
  {
    id: "asg-dsa-1",
    course_id: "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e",
    course_slug: "dsa",
    course_title: "Data Structures & Algorithms",
    title: "LRU Cache & Trie Autocomplete Engine",
    description:
      "Implement an O(1) Least Recently Used (LRU) Cache using a doubly linked list and hash map, combined with a prefix Trie for typeahead autocomplete.",
    due_date: "2026-10-30T23:59:59.000Z",
    max_score: 100,
    created_by: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    created_at: "2026-09-18T00:00:00.000Z",
    updated_at: "2026-09-18T00:00:00.000Z",
  },
];

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: "quiz-ts-1",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    course_slug: "advanced-typescript",
    course_title: "Advanced TypeScript & Design Patterns",
    title: "TypeScript Type System Assessment",
    description: "Evaluate your mastery of conditional types, mapped types, and variance.",
    duration_minutes: 15,
    pass_percentage: 70,
    questions: [
      {
        id: 1,
        question: "Which keyword is used inside conditional types to deduce a type variable?",
        options: ["deduce", "infer", "extract", "typeof"],
        correct_option: 1,
        explanation:
          "The 'infer' keyword introduces a type variable in the true branch of a conditional type.",
        marks: 25,
      },
      {
        id: 2,
        question: "What does the 'never' type represent in TypeScript?",
        options: [
          "A value that can be null or undefined",
          "An empty object",
          "Values that never occur or an empty set",
          "Any primitive value",
        ],
        correct_option: 2,
        explanation:
          "The 'never' type represents the type of values that never occur, often used in exhaustive checks.",
        marks: 25,
      },
      {
        id: 3,
        question: "How do you make all properties of type T readonly in TypeScript?",
        options: ["Readonly<T>", "Immutable<T>", "const T", "Freeze<T>"],
        correct_option: 0,
        explanation: "The built-in utility type Readonly<T> marks all properties of T as readonly.",
        marks: 25,
      },
      {
        id: 4,
        question: "What is the result of 'type X = string & number'?",
        options: ["string", "number", "any", "never"],
        correct_option: 3,
        explanation:
          "No value can be both a string and a number simultaneously, so the intersection evaluates to 'never'.",
        marks: 25,
      },
    ],
    created_by: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    created_at: "2026-09-15T00:00:00.000Z",
    updated_at: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "quiz-react-1",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    course_slug: "react-performance",
    course_title: "React Performance & Architecture",
    title: "React Profiling & Re-render Diagnostics",
    description: "Validate your ability to identify and fix React performance bottlenecks.",
    duration_minutes: 10,
    pass_percentage: 75,
    questions: [
      {
        id: 1,
        question: "When does React.memo prevent a re-render of a component?",
        options: [
          "Whenever state inside the component changes",
          "When props are shallowly equal to previous props (and state hasn't changed)",
          "On every initial page load",
          "Only when using class components",
        ],
        correct_option: 1,
        explanation:
          "React.memo does a shallow comparison of props; if unchanged and state is intact, re-render is skipped.",
        marks: 35,
      },
      {
        id: 2,
        question:
          "What is the primary danger of using inline function declarations in JSX props passed to memoized children?",
        options: [
          "It throws a syntax error",
          "A new function reference is created on every render, invalidating shallow prop equality",
          "It crashes the V8 engine",
          "It prevents CSS transitions",
        ],
        correct_option: 1,
        explanation:
          "Inline arrow functions create fresh references each render, bypassing React.memo optimizations.",
        marks: 35,
      },
      {
        id: 3,
        question: "What hook helps preserve expensive computation results across renders?",
        options: ["useEffect", "useMemo", "useContext", "useId"],
        correct_option: 1,
        explanation:
          "useMemo caches the result of an expensive calculation until dependencies change.",
        marks: 30,
      },
    ],
    created_by: null,
    created_at: "2026-09-15T00:00:00.000Z",
    updated_at: "2026-09-15T00:00:00.000Z",
  },
];

const INITIAL_USERS: LocalUser[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    email: "student@skillbridge.edu",
    password_hash: hashPassword("password123", "salt_student_01"),
    salt: "salt_student_01",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    user_metadata: {
      display_name: "Alex Learner",
      role: "student",
      sub: "00000000-0000-4000-a000-000000000001",
      email: "student@skillbridge.edu",
    },
  },
  {
    id: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    email: "instructor@skillbridge.edu",
    password_hash: hashPassword("password123", "salt_teacher_01"),
    salt: "salt_teacher_01",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    user_metadata: {
      display_name: "Sarah Chen",
      role: "teacher",
      sub: "8d95e694-3d47-422e-a017-86a1a0ee1251",
      email: "instructor@skillbridge.edu",
    },
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    email: "admin@skillbridge.edu",
    password_hash: hashPassword("password123", "salt_admin_01"),
    salt: "salt_admin_01",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    user_metadata: {
      display_name: "Skillbridge Admin",
      role: "admin",
      sub: "00000000-0000-4000-a000-000000000003",
      email: "admin@skillbridge.edu",
    },
  },
  {
    id: "00000000-0000-4000-a000-000000000004",
    email: "student@skillbridge.dev",
    password_hash: hashPassword("password123", "salt_student_dev"),
    salt: "salt_student_dev",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    user_metadata: {
      display_name: "Alex Learner",
      role: "student",
      sub: "00000000-0000-4000-a000-000000000004",
      email: "student@skillbridge.dev",
    },
  },
  {
    id: "00000000-0000-4000-a000-000000000005",
    email: "teacher@skillbridge.dev",
    password_hash: hashPassword("password123", "salt_teacher_dev"),
    salt: "salt_teacher_dev",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    user_metadata: {
      display_name: "Sarah Chen",
      role: "teacher",
      sub: "00000000-0000-4000-a000-000000000005",
      email: "teacher@skillbridge.dev",
    },
  },
];

const INITIAL_USER_ROLES: LocalUserRole[] = [
  {
    id: "ur-1",
    user_id: "00000000-0000-4000-a000-000000000001",
    role: "student",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ur-2",
    user_id: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    role: "teacher",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ur-3",
    user_id: "00000000-0000-4000-a000-000000000003",
    role: "admin",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ur-4",
    user_id: "00000000-0000-4000-a000-000000000004",
    role: "student",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ur-5",
    user_id: "00000000-0000-4000-a000-000000000005",
    role: "teacher",
    created_at: "2026-09-01T00:00:00.000Z",
  },
];

const INITIAL_PROFILES: LocalProfile[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    display_name: "Alex Learner",
    email: "student@skillbridge.edu",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "8d95e694-3d47-422e-a017-86a1a0ee1251",
    display_name: "Sarah Chen",
    email: "instructor@skillbridge.edu",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    display_name: "Skillbridge Admin",
    email: "admin@skillbridge.edu",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-a000-000000000004",
    display_name: "Alex Learner",
    email: "student@skillbridge.dev",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-a000-000000000005",
    display_name: "Sarah Chen",
    email: "teacher@skillbridge.dev",
    created_at: "2026-09-01T00:00:00.000Z",
  },
];

const INITIAL_ENROLLMENTS: Enrollment[] = [
  {
    id: "enr_student_01",
    student_id: "00000000-0000-4000-a000-000000000001",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    student_name: "Alex Learner",
    student_email: "student@skillbridge.edu",
    enrolled_at: "2026-09-10T00:00:00.000Z",
    completion_percentage: 33,
    completed_at: null,
    status: "in_progress",
  },
  {
    id: "enr_student_02",
    student_id: "00000000-0000-4000-a000-000000000001",
    course_id: "45c4dd4a-715b-4f7d-b508-9c7501f2a63b",
    student_name: "Alex Learner",
    student_email: "student@skillbridge.edu",
    enrolled_at: "2026-09-12T00:00:00.000Z",
    completion_percentage: 0,
    completed_at: null,
    status: "in_progress",
  },
];

const INITIAL_LESSON_PROGRESS: LessonProgress[] = [
  {
    id: "lp_student_01",
    student_id: "00000000-0000-4000-a000-000000000001",
    course_id: "0f1f297a-5fd3-4266-b6e7-e88f90939b1a",
    lesson_id: "lesson-react-1",
    completed: true,
    completed_at: "2026-09-11T10:00:00.000Z",
    updated_at: "2026-09-11T10:00:00.000Z",
  },
];

class DatabaseManager {
  private db: LMSDatabase | null = null;

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private read(): LMSDatabase {
    if (this.db) {
      this.ensureSchemaIntegrity(this.db);
      return this.db;
    }

    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.db = JSON.parse(raw);
        if (this.db) {
          this.ensureSchemaIntegrity(this.db);
          return this.db;
        }
      } catch (err) {
        console.error("Failed to parse LMS database file, resetting to defaults:", err);
      }
    }

    this.db = {
      courses: INITIAL_COURSES,
      lessons: INITIAL_LESSONS,
      enrollments: INITIAL_ENROLLMENTS,
      lesson_progress: INITIAL_LESSON_PROGRESS,
      assignments: INITIAL_ASSIGNMENTS,
      submissions: [],
      quizzes: INITIAL_QUIZZES,
      quiz_attempts: [],
      certificates: [],
      users: INITIAL_USERS,
      user_roles: INITIAL_USER_ROLES,
      sessions: [],
      purchases: [],
      profiles: INITIAL_PROFILES,
    };
    this.write();
    return this.db;
  }

  private ensureSchemaIntegrity(db: LMSDatabase) {
    let changed = false;
    if (!db.users || db.users.length === 0) {
      db.users = [...INITIAL_USERS];
      changed = true;
    }
    if (!db.user_roles || db.user_roles.length === 0) {
      db.user_roles = [...INITIAL_USER_ROLES];
      changed = true;
    }
    if (!db.sessions) {
      db.sessions = [];
      changed = true;
    }
    if (!db.purchases) {
      db.purchases = [];
      changed = true;
    }
    if (!db.profiles || db.profiles.length === 0) {
      db.profiles = [...INITIAL_PROFILES];
      changed = true;
    }
    if (!db.enrollments) {
      db.enrollments = [...INITIAL_ENROLLMENTS];
      changed = true;
    }
    if (!db.lesson_progress) {
      db.lesson_progress = [...INITIAL_LESSON_PROGRESS];
      changed = true;
    }
    if (changed) {
      this.write();
    }
  }

  private write() {
    if (!this.db) return;
    this.ensureDirectory();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.db, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  }

  // COURSES
  getAllCourses(): Course[] {
    const db = this.read();
    return [...db.courses];
  }

  getCourse(idOrSlug: string): Course | null {
    const db = this.read();
    return db.courses.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null;
  }

  createCourse(course: Omit<Course, "id" | "created_at" | "updated_at">): Course {
    const db = this.read();
    const newCourse: Course = {
      ...course,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.courses.push(newCourse);
    this.write();
    return newCourse;
  }

  updateCourse(id: string, patch: Partial<Course>): Course | null {
    const db = this.read();
    const idx = db.courses.findIndex((c) => c.id === id || c.slug === id);
    if (idx === -1) return null;
    db.courses[idx] = {
      ...db.courses[idx]!,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.write();
    return db.courses[idx]!;
  }

  deleteCourse(id: string): boolean {
    const db = this.read();
    const initialLen = db.courses.length;
    db.courses = db.courses.filter((c) => c.id !== id && c.slug !== id);
    if (db.courses.length !== initialLen) {
      db.lessons = db.lessons.filter((l) => l.course_id !== id);
      this.write();
      return true;
    }
    return false;
  }

  // LESSONS
  getLessonsForCourse(courseIdOrSlug: string): CourseLesson[] {
    const db = this.read();
    const course = this.getCourse(courseIdOrSlug);
    if (!course) return [];
    return db.lessons
      .filter((l) => l.course_id === course.id)
      .sort((a, b) => a.lesson_order - b.lesson_order);
  }

  addLesson(
    courseId: string,
    lesson: Omit<CourseLesson, "id" | "course_id" | "created_at" | "updated_at">,
  ): CourseLesson {
    const db = this.read();
    const course = this.getCourse(courseId);
    if (!course) throw new Error("Course not found");

    const existingLessons = db.lessons.filter((l) => l.course_id === course.id);
    const newLesson: CourseLesson = {
      ...lesson,
      id: `les_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      course_id: course.id,
      lesson_order: lesson.lesson_order || existingLessons.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.lessons.push(newLesson);
    this.write();
    return newLesson;
  }

  updateLesson(lessonId: string, patch: Partial<CourseLesson>): CourseLesson | null {
    const db = this.read();
    const idx = db.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return null;
    db.lessons[idx] = {
      ...db.lessons[idx]!,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.write();
    return db.lessons[idx]!;
  }

  deleteLesson(lessonId: string): boolean {
    const db = this.read();
    const initialLen = db.lessons.length;
    db.lessons = db.lessons.filter((l) => l.id !== lessonId);
    if (db.lessons.length !== initialLen) {
      db.lesson_progress = db.lesson_progress.filter((p) => p.lesson_id !== lessonId);
      this.write();
      return true;
    }
    return false;
  }

  // ENROLLMENTS & PROGRESS
  enrollStudent(
    studentId: string,
    courseIdOrSlug: string,
    studentName: string,
    studentEmail: string,
  ): Enrollment {
    const db = this.read();
    const course = this.getCourse(courseIdOrSlug);
    if (!course) throw new Error("Course not found");

    const existing = db.enrollments.find(
      (e) => e.student_id === studentId && e.course_id === course.id,
    );
    if (existing) return existing;

    const newEnrollment: Enrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      student_id: studentId,
      course_id: course.id,
      student_name: studentName,
      student_email: studentEmail,
      enrolled_at: new Date().toISOString(),
      completion_percentage: 0,
      completed_at: null,
      status: "enrolled",
    };
    db.enrollments.push(newEnrollment);
    this.write();
    return newEnrollment;
  }

  getStudentEnrollment(studentId: string, courseIdOrSlug: string): Enrollment | null {
    const db = this.read();
    const course = this.getCourse(courseIdOrSlug);
    if (!course) return null;
    return (
      db.enrollments.find((e) => e.student_id === studentId && e.course_id === course.id) || null
    );
  }

  getStudentEnrollments(studentId: string): Enrollment[] {
    const db = this.read();
    return db.enrollments.filter((e) => e.student_id === studentId);
  }

  getLessonProgress(studentId: string, courseId: string): LessonProgress[] {
    const db = this.read();
    return db.lesson_progress.filter((p) => p.student_id === studentId && p.course_id === courseId);
  }

  completeLesson(params: {
    studentId: string;
    courseIdOrSlug: string;
    lessonId: string;
    completed: boolean;
    studentName?: string;
    studentEmail?: string;
  }): {
    progress: number;
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
    certificateId?: string;
  } {
    const db = this.read();
    const course = this.getCourse(params.courseIdOrSlug);
    if (!course) throw new Error("Course not found");

    const lesson = db.lessons.find((l) => l.id === params.lessonId && l.course_id === course.id);
    if (!lesson) throw new Error("Lesson not found in course");

    // Upsert lesson progress (Unique student_id + lesson_id constraint)
    const existingProgIdx = db.lesson_progress.findIndex(
      (p) => p.student_id === params.studentId && p.lesson_id === params.lessonId,
    );

    const now = new Date().toISOString();
    if (existingProgIdx >= 0) {
      db.lesson_progress[existingProgIdx] = {
        ...db.lesson_progress[existingProgIdx]!,
        completed: params.completed,
        completed_at: params.completed ? now : null,
        updated_at: now,
      };
    } else {
      db.lesson_progress.push({
        id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        student_id: params.studentId,
        course_id: course.id,
        lesson_id: params.lessonId,
        completed: params.completed,
        completed_at: params.completed ? now : null,
        updated_at: now,
      });
    }

    // Ensure student is enrolled
    let enrollment = db.enrollments.find(
      (e) => e.student_id === params.studentId && e.course_id === course.id,
    );
    if (!enrollment) {
      enrollment = {
        id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        student_id: params.studentId,
        course_id: course.id,
        student_name: params.studentName || "Student",
        student_email: params.studentEmail || "student@example.com",
        enrolled_at: now,
        completion_percentage: 0,
        completed_at: null,
        status: "in_progress",
      };
      db.enrollments.push(enrollment);
    }

    // Recalculate progress: completed required lessons / total required lessons * 100
    const courseLessons = db.lessons.filter((l) => l.course_id === course.id);
    const requiredLessons = courseLessons.filter((l) => l.is_required);
    const totalRequired = requiredLessons.length || courseLessons.length || 1;

    const completedLessonIds = new Set(
      db.lesson_progress
        .filter(
          (p) => p.student_id === params.studentId && p.course_id === course.id && p.completed,
        )
        .map((p) => p.lesson_id),
    );

    const completedRequired = requiredLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progressPercentage = Math.min(100, Math.round((completedRequired / totalRequired) * 100));
    const isCompleted = progressPercentage >= 100;

    enrollment.completion_percentage = progressPercentage;
    enrollment.status = isCompleted
      ? "completed"
      : progressPercentage > 0
        ? "in_progress"
        : "enrolled";
    if (isCompleted && !enrollment.completed_at) {
      enrollment.completed_at = now;
    }

    // Issue certificate if completed and does not already exist
    let certId: string | undefined;
    if (isCompleted) {
      let cert = db.certificates.find(
        (c) => c.student_id === params.studentId && c.course_id === course.id,
      );
      if (!cert) {
        const generatedCertId = `SKILL-${course.slug.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        cert = {
          id: `cert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          certificate_id: generatedCertId,
          student_id: params.studentId,
          student_name: enrollment.student_name,
          student_email: enrollment.student_email,
          course_id: course.id,
          course_title: course.title,
          completion_date: now,
          created_at: now,
        };
        db.certificates.push(cert);
      }
      certId = cert.certificate_id;
    }

    this.write();
    return {
      progress: progressPercentage,
      completedCount: completedRequired,
      totalCount: totalRequired,
      isCompleted,
      ...(certId ? { certificateId: certId } : {}),
    };
  }

  // STUDENT DASHBOARD AGGREGATE
  getStudentDashboard(studentId: string) {
    const db = this.read();
    const enrollments = db.enrollments.filter((e) => e.student_id === studentId);

    const enrolledCourses = enrollments.map((enr) => {
      const course = db.courses.find((c) => c.id === enr.course_id)!;
      const lessons = db.lessons
        .filter((l) => l.course_id === enr.course_id)
        .sort((a, b) => a.lesson_order - b.lesson_order);
      const progressRecords = db.lesson_progress.filter(
        (p) => p.student_id === studentId && p.course_id === enr.course_id && p.completed,
      );
      const completedLessonIds = new Set(progressRecords.map((p) => p.lesson_id));

      const nextLessonObj = lessons.find((l) => !completedLessonIds.has(l.id));
      const nextLesson = nextLessonObj
        ? `${nextLessonObj.lesson_order}. ${nextLessonObj.title}`
        : "Course Completed — Ready for Certification";

      const cert = db.certificates.find(
        (c) => c.student_id === studentId && c.course_id === enr.course_id,
      );

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        instructor: course.instructor,
        description: course.description,
        thumbnail: course.thumbnail,
        hours: course.hours,
        progress: enr.completion_percentage,
        lessonsDone: completedLessonIds.size,
        lessonsTotal: lessons.length,
        nextLesson,
        status: enr.status,
        enrolledAt: enr.enrolled_at,
        completedAt: enr.completed_at,
        certificateId: cert?.certificate_id || null,
        videoUrl: course.video_url,
      };
    });

    const enrolledCourseIds = new Set(enrolledCourses.map((c) => c.id));
    const enrolledCourseSlugs = new Set(enrolledCourses.map((c) => c.slug));

    const studentSubmissions = db.submissions.filter((s) => s.student_id === studentId);
    const submissionMap = new Map<string, AssignmentSubmission>();
    studentSubmissions.forEach((s) => submissionMap.set(s.assignment_id, s));

    const upcomingAssignments = db.assignments
      .filter((a) => enrolledCourseIds.has(a.course_id) || enrolledCourseSlugs.has(a.course_slug))
      .map((a) => {
        const sub = submissionMap.get(a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          course: a.course_title,
          courseSlug: a.course_slug,
          due: a.due_date,
          maxScore: a.max_score,
          submissionStatus: sub ? sub.status : "unsubmitted",
          score: sub?.score ?? null,
          feedback: sub?.feedback ?? null,
          submittedAt: sub?.submitted_at ?? null,
        };
      });

    const studentQuizzes = db.quizzes
      .filter((q) => enrolledCourseIds.has(q.course_id) || enrolledCourseSlugs.has(q.course_slug))
      .map((q) => {
        const attempts = db.quiz_attempts.filter(
          (a) => a.quiz_id === q.id && a.student_id === studentId,
        );
        const bestAttempt = attempts.sort((a, b) => b.score - a.score)[0] || null;
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          course: q.course_title,
          courseSlug: q.course_slug,
          durationMinutes: q.duration_minutes,
          passPercentage: q.pass_percentage,
          questionsCount: q.questions.length,
          bestScore: bestAttempt ? bestAttempt.score : null,
          totalMarks: bestAttempt ? bestAttempt.total_marks : null,
          passed: bestAttempt ? bestAttempt.passed : false,
          attemptCount: attempts.length,
        };
      });

    const gradedSubmissions = studentSubmissions.filter(
      (s) => s.score !== null && s.score !== undefined,
    );
    const grades = gradedSubmissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignment_id,
      title: db.assignments.find((a) => a.id === s.assignment_id)?.title || "Assignment",
      course: db.courses.find((c) => c.id === s.course_id)?.title || "Course",
      score: s.score!,
      maxScore: s.max_score,
      percentage: Math.round((s.score! / s.max_score) * 100),
      feedback: s.feedback,
      gradedAt: s.graded_at,
    }));

    const certificates = db.certificates.filter((c) => c.student_id === studentId);

    const completedCoursesCount = enrolledCourses.filter((c) => c.progress >= 100).length;
    const inProgressCoursesCount = enrolledCourses.filter(
      (c) => c.progress > 0 && c.progress < 100,
    ).length;
    const totalProgress = enrolledCourses.reduce((acc, c) => acc + c.progress, 0);
    const overallProgress =
      enrolledCourses.length > 0 ? Math.round(totalProgress / enrolledCourses.length) : 0;

    return {
      enrolledCourses,
      inProgressCoursesCount,
      completedCoursesCount,
      overallProgress,
      upcomingAssignments,
      studentQuizzes,
      grades,
      certificates,
    };
  }

  // INSTRUCTOR DASHBOARD AGGREGATE
  getInstructorData(teacherId: string | null, isAdmin: boolean) {
    const db = this.read();
    const authorizedCourses = db.courses.filter(
      (c) => isAdmin || c.teacher_id === teacherId || c.teacher_id === null,
    );
    const authorizedCourseIds = new Set(authorizedCourses.map((c) => c.id));

    // Enrolled students in instructor courses
    const studentRecords = db.enrollments
      .filter((e) => authorizedCourseIds.has(e.course_id))
      .map((e) => {
        const course = db.courses.find((c) => c.id === e.course_id)!;
        const lessons = db.lessons.filter((l) => l.course_id === e.course_id);
        const requiredLessons = lessons.filter((l) => l.is_required);
        const totalRequired = requiredLessons.length || lessons.length || 1;

        const progressRecords = db.lesson_progress.filter(
          (p) => p.student_id === e.student_id && p.course_id === e.course_id && p.completed,
        );
        const completedRequired = requiredLessons.filter((l) =>
          progressRecords.some((p) => p.lesson_id === l.id),
        ).length;

        // Assignments submitted by this student in this course
        const studentCourseSubs = db.submissions.filter(
          (s) => s.student_id === e.student_id && s.course_id === e.course_id,
        );
        const pendingCount = studentCourseSubs.filter((s) => s.status === "pending").length;
        const gradedCount = studentCourseSubs.filter((s) => s.status === "approved").length;

        // Quiz attempts
        const studentAttempts = db.quiz_attempts.filter(
          (a) => a.student_id === e.student_id && a.course_id === e.course_id,
        );

        const cert = db.certificates.find(
          (c) => c.student_id === e.student_id && c.course_id === e.course_id,
        );

        return {
          id: e.id,
          studentId: e.student_id,
          studentName: e.student_name,
          studentEmail: e.student_email,
          courseId: course.id,
          courseSlug: course.slug,
          courseTitle: course.title,
          progress: e.completion_percentage,
          completedLessons: completedRequired,
          totalRequiredLessons: totalRequired,
          status: e.status,
          enrolledAt: e.enrolled_at,
          completedAt: e.completed_at,
          certificateEarned: !!cert,
          certificateId: cert?.certificate_id || null,
          assignmentStatus:
            pendingCount > 0
              ? `${pendingCount} pending review`
              : gradedCount > 0
                ? `${gradedCount} graded`
                : "No submissions yet",
          quizStatus:
            studentAttempts.length > 0
              ? `${studentAttempts.length} quizzes taken`
              : "No quiz taken yet",
        };
      });

    // Submissions for authorized courses
    const submissions = db.submissions
      .filter((s) => authorizedCourseIds.has(s.course_id))
      .map((s) => {
        const asg = db.assignments.find((a) => a.id === s.assignment_id);
        const course = db.courses.find((c) => c.id === s.course_id);
        return {
          ...s,
          assignmentTitle: asg?.title || "Assignment",
          courseTitle: course?.title || "Course",
          courseSlug: course?.slug || "",
        };
      });

    // Assignments for authorized courses
    const assignments = db.assignments.filter((a) => authorizedCourseIds.has(a.course_id));

    // Quizzes for authorized courses
    const quizzes = db.quizzes.filter((q) => authorizedCourseIds.has(q.course_id));

    return {
      courses: authorizedCourses,
      students: studentRecords,
      submissions,
      assignments,
      quizzes,
    };
  }

  // SUBMISSIONS & GRADING
  submitAssignment(
    data: Omit<
      AssignmentSubmission,
      "id" | "submitted_at" | "status" | "score" | "feedback" | "graded_at" | "graded_by"
    >,
  ): AssignmentSubmission {
    const db = this.read();
    const existingIdx = db.submissions.findIndex(
      (s) => s.assignment_id === data.assignment_id && s.student_id === data.student_id,
    );

    const now = new Date().toISOString();
    const submission: AssignmentSubmission = {
      ...data,
      id:
        existingIdx >= 0
          ? db.submissions[existingIdx]!.id
          : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      submitted_at: now,
      status: "pending",
      score: null,
      feedback: null,
      graded_at: null,
      graded_by: null,
    };

    if (existingIdx >= 0) {
      db.submissions[existingIdx] = submission;
    } else {
      db.submissions.push(submission);
    }
    this.write();
    return submission;
  }

  gradeSubmission(
    submissionId: string,
    grade: {
      score: number;
      feedback?: string;
      gradedBy: string;
      status?: "approved" | "needs_revision";
    },
  ): AssignmentSubmission | null {
    const db = this.read();
    const idx = db.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return null;

    db.submissions[idx] = {
      ...db.submissions[idx]!,
      score: grade.score,
      feedback: grade.feedback || "Good work!",
      graded_by: grade.gradedBy,
      graded_at: new Date().toISOString(),
      status:
        (grade.status === "needs_revision" ? "resubmission_required" : grade.status) ||
        (grade.score >= 60 ? "approved" : "resubmission_required"),
    };
    this.write();
    return db.submissions[idx]!;
  }

  // QUIZZES
  submitQuizAttempt(data: Omit<QuizAttempt, "id" | "completed_at">): QuizAttempt {
    const db = this.read();
    const attempt: QuizAttempt = {
      ...data,
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      completed_at: new Date().toISOString(),
    };
    db.quiz_attempts.push(attempt);
    this.write();
    return attempt;
  }

  saveAssignment(
    asg: Omit<Assignment, "id" | "created_at" | "updated_at"> & { id?: string },
  ): Assignment {
    const db = this.read();
    const now = new Date().toISOString();
    if (asg.id) {
      const idx = db.assignments.findIndex((a) => a.id === asg.id);
      if (idx >= 0) {
        db.assignments[idx] = {
          ...db.assignments[idx]!,
          ...asg,
          updated_at: now,
        };
        this.write();
        return db.assignments[idx]!;
      }
    }

    const newAsg: Assignment = {
      ...asg,
      id: asg.id || `asg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    db.assignments.push(newAsg);
    this.write();
    return newAsg;
  }

  deleteAssignment(id: string): boolean {
    const db = this.read();
    const initialLen = db.assignments.length;
    db.assignments = db.assignments.filter((a) => a.id !== id);
    if (db.assignments.length !== initialLen) {
      db.submissions = db.submissions.filter((s) => s.assignment_id !== id);
      this.write();
      return true;
    }
    return false;
  }

  saveQuiz(quiz: Omit<Quiz, "id" | "created_at" | "updated_at"> & { id?: string }): Quiz {
    const db = this.read();
    const now = new Date().toISOString();
    if (quiz.id) {
      const idx = db.quizzes.findIndex((q) => q.id === quiz.id);
      if (idx >= 0) {
        db.quizzes[idx] = {
          ...db.quizzes[idx]!,
          ...quiz,
          updated_at: now,
        };
        this.write();
        return db.quizzes[idx]!;
      }
    }

    const newQuiz: Quiz = {
      ...quiz,
      id: quiz.id || `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    db.quizzes.push(newQuiz);
    this.write();
    return newQuiz;
  }

  // USERS & AUTH
  findUserByEmail(email: string): LocalUser | null {
    const db = this.read();
    const clean = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  findUserById(id: string): LocalUser | null {
    const db = this.read();
    return db.users.find((u) => u.id === id) || null;
  }

  registerUser(params: {
    email: string;
    password: string;
    name?: string;
    role?: "student" | "teacher" | "admin";
  }): { user: LocalUser; session: LocalSession; roles: string[] } {
    const db = this.read();
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = hashPassword(params.password, salt);
    const userId = crypto.randomUUID();
    const role = params.role || "student";
    const displayName = params.name?.trim() || cleanEmail.split("@")[0] || "Learner";

    const newUser: LocalUser = {
      id: userId,
      email: cleanEmail,
      password_hash,
      salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_metadata: {
        display_name: displayName,
        role,
        sub: userId,
        email: cleanEmail,
      },
    };

    db.users.push(newUser);
    db.user_roles.push({
      id: crypto.randomUUID(),
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
    });
    db.profiles.push({
      id: userId,
      display_name: displayName,
      email: cleanEmail,
      created_at: new Date().toISOString(),
    });

    this.write();
    const session = this.createSession(userId);
    return { user: newUser, session, roles: [role] };
  }

  updateUserProfile(
    userId: string,
    params: { displayName?: string; avatarUrl?: string | null },
  ): LocalUser | null {
    const db = this.read();
    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) return null;

    if (params.displayName !== undefined) {
      const displayName = params.displayName.trim();
      if (!displayName) throw new Error("Display name cannot be empty.");
      if (displayName.length > 80) throw new Error("Display name must be 80 characters or fewer.");
      user.user_metadata.display_name = displayName;
    }

    if (params.avatarUrl !== undefined) {
      if (params.avatarUrl !== null && params.avatarUrl.length > 2_000_000) {
        throw new Error("Profile picture is too large. Please choose a smaller image.");
      }
      if (params.avatarUrl === null) delete user.user_metadata.avatar_url;
      else user.user_metadata.avatar_url = params.avatarUrl;
    }

    user.updated_at = new Date().toISOString();
    const profile = db.profiles.find((item) => item.id === userId);
    if (profile && params.displayName !== undefined)
      profile.display_name = user.user_metadata.display_name;
    this.write();
    return user;
  }

  authenticateUser(
    email: string,
    password: string,
  ): { user: LocalUser; session: LocalSession; roles: string[] } | null {
    const db = this.read();
    const cleanEmail = email.trim().toLowerCase();
    const user = this.findUserByEmail(cleanEmail);
    if (!user) return null;

    const hash = hashPassword(password, user.salt);
    if (hash !== user.password_hash) {
      return null;
    }

    const session = this.createSession(user.id);
    const roles = this.getUserRoles(user.id);
    return { user, session, roles };
  }

  createSession(userId: string): LocalSession {
    const db = this.read();
    const token = `sb_local_${Date.now()}_${crypto.randomBytes(24).toString("hex")}`;
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const session: LocalSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      token,
      expires_at,
      created_at: new Date().toISOString(),
    };
    db.sessions.push(session);
    this.write();
    return session;
  }

  validateSession(
    token: string,
  ): { user: LocalUser; session: LocalSession; roles: string[] } | null {
    if (!token) return null;
    const db = this.read();

    if (token.startsWith("eyJ") && token.split(".").length === 3) {
      try {
        const payloadStr = Buffer.from(token.split(".")[1]!, "base64url").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        if (payload.sub) {
          const user = this.findUserById(payload.sub) || this.findUserByEmail(payload.email || "");
          if (user) {
            return {
              user,
              session: {
                id: payload.session_id || "sess_jwt",
                user_id: user.id,
                token,
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                created_at: new Date().toISOString(),
              },
              roles: this.getUserRoles(user.id),
            };
          }
        }
      } catch {
        // ignore
      }
    }

    const session = db.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return null;
    }
    const user = this.findUserById(session.user_id);
    if (!user) return null;
    return { user, session, roles: this.getUserRoles(user.id) };
  }

  logoutUser(token: string): boolean {
    const db = this.read();
    const initialLen = db.sessions.length;
    db.sessions = db.sessions.filter((s) => s.token !== token);
    if (db.sessions.length !== initialLen) {
      this.write();
      return true;
    }
    return false;
  }

  getUserRoles(userId: string): Array<"student" | "teacher" | "admin"> {
    const db = this.read();
    const user = this.findUserById(userId);
    const roles = db.user_roles.filter((r) => r.user_id === userId).map((r) => r.role);
    if (roles.length > 0) return roles;
    if (user?.user_metadata?.role) {
      return [user.user_metadata.role as "student" | "teacher" | "admin"];
    }
    return ["student"];
  }

  // QUERY TABLE - Generic local table operations
  queryTable(
    table: string,
    query: {
      action: "select" | "insert" | "update" | "upsert" | "delete";
      columns?: string;
      filters?: Record<string, unknown>;
      values?: unknown;
      onConflict?: string;
    },
  ): { data: unknown; error: null | { message: string } } {
    const db = this.read();
    const items = (db as unknown as Record<string, Record<string, unknown>[]>)[table];
    if (!Array.isArray(items)) {
      return { data: null, error: { message: `Table "${table}" not found in local database` } };
    }

    if (query.action === "select") {
      let filtered = [...items];
      if (query.filters) {
        filtered = filtered.filter((row: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(query.filters!)) {
            if (row[k] !== v) return false;
          }
          return true;
        });
      }
      return { data: filtered, error: null };
    }

    if (query.action === "update") {
      let updatedCount = 0;
      const patch = (query.values || {}) as Record<string, unknown>;
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Record<string, unknown>;
        let match = true;
        if (query.filters) {
          for (const [k, v] of Object.entries(query.filters)) {
            if (item[k] !== v) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          items[i] = { ...item, ...patch, updated_at: new Date().toISOString() };
          updatedCount++;
        }
      }
      if (updatedCount > 0) this.write();
      return { data: { updated: updatedCount }, error: null };
    }

    if (query.action === "insert" || query.action === "upsert") {
      const val = query.values;
      const records = (Array.isArray(val) ? val : [val]) as Record<string, unknown>[];
      for (const rec of records) {
        const id = (rec["id"] as string) || crypto.randomUUID();
        let existingIdx = -1;
        if (query.onConflict && rec[query.onConflict]) {
          existingIdx = items.findIndex(
            (it: Record<string, unknown>) => it[query.onConflict!] === rec[query.onConflict!],
          );
        } else if (rec["user_id"] && rec["course_id"] && table === "purchases") {
          existingIdx = items.findIndex(
            (it: Record<string, unknown>) =>
              it["user_id"] === rec["user_id"] && it["course_id"] === rec["course_id"],
          );
        } else if (rec["id"]) {
          existingIdx = items.findIndex((it: Record<string, unknown>) => it["id"] === rec["id"]);
        }

        const existingItem = (existingIdx >= 0 ? items[existingIdx] : null) as Record<
          string,
          unknown
        > | null;
        const newRec = {
          ...rec,
          id: existingItem ? existingItem["id"] : id,
          created_at: existingItem ? existingItem["created_at"] : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          items[existingIdx] = newRec;
        } else {
          items.push(newRec);
        }
      }
      this.write();
      return { data: records, error: null };
    }

    if (query.action === "delete") {
      const initial = items.length;
      (db as unknown as Record<string, unknown[]>)[table] = items.filter(
        (row: Record<string, unknown>) => {
          if (query.filters) {
            for (const [k, v] of Object.entries(query.filters)) {
              if (row[k] === v) return false;
            }
          }
          return true;
        },
      );
      if ((db as unknown as Record<string, unknown[]>)[table]!.length !== initial) {
        this.write();
      }
      return {
        data: { deleted: initial - (db as unknown as Record<string, unknown[]>)[table]!.length },
        error: null,
      };
    }

    return { data: null, error: { message: "Unsupported action" } };
  }
}

export const lmsDB = new DatabaseManager();
