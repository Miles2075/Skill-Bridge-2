import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { lmsDB } from "./lms-db.server";

interface UserContext {
  userId: string | null;
  email: string | null;
  name: string | null;
  role: "student" | "teacher" | "admin";
  isAdmin: boolean;
  isTeacher: boolean;
}

function parseUserContext(req: Request): UserContext {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  let userId = req.headers.get("x-user-id");
  let email = req.headers.get("x-user-email");
  let name = req.headers.get("x-user-name");
  let roleStr = req.headers.get("x-user-role");

  if (token) {
    const validated = lmsDB.validateSession(token);
    if (validated) {
      userId = validated.user.id;
      email = validated.user.email ?? null;
      name = String(
        (validated.user.user_metadata?.display_name as string) ||
          (validated.user.email ?? "").split("@")[0],
      );
      const primaryRole = validated.roles.includes("admin")
        ? "admin"
        : validated.roles.includes("teacher")
          ? "teacher"
          : "student";
      roleStr = primaryRole;
    } else if (token.split(".").length === 3) {
      try {
        const payloadStr = Buffer.from(token.split(".")[1]!, "base64url").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        if (payload.sub && !userId) userId = payload.sub;
        if (payload.email && !email) email = payload.email;
        if (payload.user_metadata?.display_name && !name) name = payload.user_metadata.display_name;
        if (payload.user_metadata?.role && !roleStr) roleStr = payload.user_metadata.role;
      } catch {
        // ignore
      }
    }
  }

  const role = (roleStr === "teacher" || roleStr === "admin" ? roleStr : "student") as
    "student" | "teacher" | "admin";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher" || isAdmin;

  return {
    userId,
    email,
    name,
    role,
    isAdmin,
    isTeacher,
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export async function handleLmsApiRequest(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith("/api/lms")) {
    return null;
  }

  const path = url.pathname.replace(/^\/api\/lms\/?/, "");
  const method = req.method.toUpperCase();
  const user = parseUserContext(req);

  try {
    // AUTH: POST /api/lms/auth/login
    if (path === "auth/login" && method === "POST") {
      const body = await req.json();
      const { email, password } = body;
      if (!email || !password) return errorResponse("Email and password are required");

      const res = lmsDB.authenticateUser(email, password);
      if (!res) {
        return errorResponse("Invalid login credentials", 400);
      }
      return jsonResponse({
        user: res.user,
        session: res.session,
        roles: res.roles,
      });
    }

    // AUTH: POST /api/lms/auth/signup
    if (path === "auth/signup" && method === "POST") {
      const body = await req.json();
      const { email, password, metadata } = body;
      if (!email || !password) return errorResponse("Email and password are required");

      if (lmsDB.findUserByEmail(email)) {
        return errorResponse(
          "An account with this email already exists. Please sign in instead.",
          400,
        );
      }

      const res = lmsDB.registerUser({
        email,
        password,
        name: metadata?.display_name || metadata?.name,
        role: metadata?.role,
      });
      return jsonResponse({
        user: res.user,
        session: res.session,
        roles: res.roles,
      });
    }

    // AUTH: PATCH /api/lms/profile
    if (path === "profile" && method === "PATCH") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const body = await req.json();
      const displayName = body.displayName === undefined ? undefined : String(body.displayName);
      const avatarUrl =
        body.avatarUrl === undefined
          ? undefined
          : body.avatarUrl === null
            ? null
            : String(body.avatarUrl);
      if (displayName !== undefined && !displayName.trim())
        return errorResponse("Display name cannot be empty.");
      try {
        const updated = lmsDB.updateUserProfile(user.userId, { displayName, avatarUrl });
        if (!updated) return errorResponse("User not found.", 404);
        return jsonResponse({ user: updated });
      } catch (err) {
        return errorResponse(err instanceof Error ? err.message : "Unable to update profile.");
      }
    }

    // AUTH: POST /api/lms/auth/logout
    if (path === "auth/logout" && method === "POST") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (token) lmsDB.logoutUser(token);
      return jsonResponse({ success: true });
    }

    // AUTH: GET /api/lms/auth/session
    if (path === "auth/session" && method === "GET") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
      const validated = token ? lmsDB.validateSession(token) : null;
      if (!validated) {
        return jsonResponse({ user: null, session: null, roles: [] });
      }
      return jsonResponse({
        user: validated.user,
        session: validated.session,
        roles: validated.roles,
      });
    }

    // AUTH: GET /api/lms/auth/roles
    if (path === "auth/roles" && method === "GET") {
      const roles = user.userId ? lmsDB.getUserRoles(user.userId) : [];
      return jsonResponse({ roles });
    }

    // GENERIC QUERY: POST /api/lms/query
    if (path === "query" && method === "POST") {
      const body = await req.json();
      const result = lmsDB.queryTable(body.table, body);
      return jsonResponse(result);
    }
    // GET /api/lms/courses
    if (path === "courses" && method === "GET") {
      const allCourses = lmsDB.getAllCourses();
      // Students/public catalog must never expose private drafts or review submissions.
      // Instructors need the full catalog so they can manage their own courses.
      const courses = user.isTeacher
        ? allCourses
        : allCourses.filter((course) => course.status === "published");
      return jsonResponse({ courses });
    }

    // GET /api/lms/course?idOrSlug=...
    if (path === "course" && method === "GET") {
      const idOrSlug = url.searchParams.get("idOrSlug") || url.searchParams.get("slug") || "";
      if (!idOrSlug) return errorResponse("Missing course slug or id parameter");
      const course = lmsDB.getCourse(idOrSlug);
      if (!course) return errorResponse("Course not found", 404);
      if (!user.isTeacher && course.status !== "published") {
        return errorResponse("Course is not available in the public catalog.", 404);
      }

      const lessons = lmsDB.getLessonsForCourse(course.id);
      let enrollment = null;
      let progressRecords: unknown[] = [];

      if (user.userId) {
        enrollment = lmsDB.getStudentEnrollment(user.userId, course.id);
        progressRecords = lmsDB.getLessonProgress(user.userId, course.id);
      }

      return jsonResponse({
        course,
        lessons,
        enrollment,
        lessonProgress: progressRecords,
      });
    }

    // POST /api/lms/enroll
    if (path === "enroll" && method === "POST") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const body = await req.json();
      const courseId = body.courseId || body.courseSlug;
      if (!courseId) return errorResponse("Missing courseId");

      const course = lmsDB.getCourse(courseId);
      if (!course) return errorResponse("Course not found", 404);
      if (course.status !== "published") {
        return errorResponse("You can only enroll in published courses.", 400);
      }

      const enrollment = lmsDB.enrollStudent(
        user.userId,
        courseId,
        user.name || body.studentName || "Student",
        user.email || body.studentEmail || "student@example.com",
      );
      return jsonResponse({ enrollment });
    }

    // POST /api/lms/complete-lesson
    if (path === "complete-lesson" && method === "POST") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const body = await req.json();
      const { courseId, lessonId, completed = true } = body;
      if (!courseId || !lessonId) return errorResponse("Missing courseId or lessonId");

      const result = lmsDB.completeLesson({
        studentId: user.userId,
        courseIdOrSlug: courseId,
        lessonId,
        completed: Boolean(completed),
        studentName: user.name || body.studentName,
        studentEmail: user.email || body.studentEmail,
      });

      return jsonResponse(result);
    }

    // GET /api/lms/student-dashboard
    if (path === "student-dashboard" && method === "GET") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const data = lmsDB.getStudentDashboard(user.userId);
      return jsonResponse(data);
    }

    // GET /api/lms/instructor-data
    if (path === "instructor-data" && method === "GET") {
      if (!user.isTeacher) return errorResponse("Forbidden: Instructor role required", 403);
      const data = lmsDB.getInstructorData(user.userId, user.isAdmin);
      return jsonResponse(data);
    }

    // POST /api/lms/course (Create course)
    if (path === "course" && method === "POST") {
      if (!user.isTeacher) return errorResponse("Forbidden: Instructor role required", 403);
      const body = await req.json();
      if (!body.title || !body.slug) return errorResponse("Title and slug are required");

      const created = lmsDB.createCourse({
        title: body.title,
        slug: body.slug,
        description: body.description || "",
        instructor: body.instructor || user.name || "Lead Instructor",
        teacher_id: user.userId,
        thumbnail: body.thumbnail || "/course-typescript.jpg",
        status: body.status || "published",
        price_inr: Number(body.price_inr) || 999,
        preview_minutes: Number(body.preview_minutes) || 3,
        video_url:
          body.video_url ||
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        hours: Number(body.hours) || 10,
        level: body.level || "Intermediate",
        category: body.category || "Development",
        rating: 5.0,
        reviews: "1",
        learners: "0",
      });

      return jsonResponse({ course: created });
    }

    // PUT /api/lms/course (Update course)
    if (path === "course" && method === "PUT") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const courseId = body.id || body.slug;
      if (!courseId) return errorResponse("Course id is required");

      const existing = lmsDB.getCourse(courseId);
      if (!existing) return errorResponse("Course not found", 404);
      if (!user.isAdmin && existing.teacher_id && existing.teacher_id !== user.userId) {
        return errorResponse("Forbidden: You can only edit your own courses", 403);
      }

      const updated = lmsDB.updateCourse(existing.id, body);
      return jsonResponse({ course: updated });
    }

    // DELETE /api/lms/course
    if (path === "course" && method === "DELETE") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const courseId = body.id || body.slug;
      if (!courseId) return errorResponse("Course id is required");

      const existing = lmsDB.getCourse(courseId);
      if (!existing) return errorResponse("Course not found", 404);
      if (!user.isAdmin && existing.teacher_id && existing.teacher_id !== user.userId) {
        return errorResponse("Forbidden: You can only delete your own courses", 403);
      }

      const ok = lmsDB.deleteCourse(existing.id);
      return jsonResponse({ success: ok });
    }

    // POST /api/lms/upload-video
    // The request body is the video file itself, not multipart/form-data.
    if (path === "upload-video" && method === "POST") {
      if (!user.isTeacher || !user.userId)
        return errorResponse("Forbidden: Instructor role required", 403);

      const courseId = url.searchParams.get("courseId") || "";
      if (!courseId) return errorResponse("Course id is required.");

      const course = lmsDB.getCourse(courseId);
      if (!course) return errorResponse("Course not found.", 404);
      if (!user.isAdmin && course.teacher_id && course.teacher_id !== user.userId) {
        return errorResponse("Forbidden: You can only upload videos to your own courses.", 403);
      }

      const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
      const declaredSize = Number(
        req.headers.get("x-file-size") || req.headers.get("content-length") || 0,
      );
      if (declaredSize > MAX_VIDEO_SIZE) {
        return errorResponse("Video is too large. Maximum file size is 500 MB.", 413);
      }
      if (!req.body) return errorResponse("Video file is required.", 400);

      let originalName = "video.mp4";
      const encodedName = req.headers.get("x-file-name");
      if (encodedName) {
        try {
          originalName = decodeURIComponent(encodedName);
        } catch {
          originalName = encodedName;
        }
      }

      const allowedExtensions = new Set([".mp4", ".webm", ".mov", ".m4v"]);
      const dot = originalName.lastIndexOf(".");
      const extension = dot >= 0 ? originalName.slice(dot).toLowerCase() : "";
      if (!allowedExtensions.has(extension)) {
        return errorResponse("Unsupported video format. Use MP4, WebM, MOV, or M4V.", 400);
      }

      const safeBase =
        originalName
          .slice(0, dot >= 0 ? dot : originalName.length)
          .replace(/[^a-zA-Z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80) || "video";
      const uniqueName = `${course.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}${extension}`;

      const uploadDir = path.resolve(process.cwd(), "public", "uploads", "videos");
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueName);

      try {
        await pipeline(
          Readable.fromWeb(req.body as ReadableStream<Uint8Array>),
          fs.createWriteStream(filePath),
        );
      } catch (err) {
        await fs.promises.rm(filePath, { force: true }).catch(() => {});
        if (req.signal.aborted) {
          console.warn("Video upload request was aborted by the client.");
          return errorResponse("Video upload was cancelled before completion.", 499);
        }
        throw err;
      }

      return jsonResponse({
        videoUrl: `/uploads/videos/${uniqueName}`,
        fileName: originalName,
        size: declaredSize,
      });
    }

    // POST /api/lms/lesson (Add lesson)
    if (path === "lesson" && method === "POST") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const {
        courseId,
        title,
        description = "",
        duration = "15:00",
        videoUrl = "",
        isRequired = true,
        isPreview = false,
      } = body;
      if (!courseId || !title) return errorResponse("Missing courseId or title");

      const existingCourse = lmsDB.getCourse(courseId);
      if (!existingCourse) return errorResponse("Course not found", 404);
      if (!user.isAdmin && existingCourse.teacher_id && existingCourse.teacher_id !== user.userId) {
        return errorResponse("Forbidden: You can only manage lessons for your own courses", 403);
      }

      const lesson = lmsDB.addLesson(existingCourse.id, {
        title,
        description,
        duration,
        video_url: videoUrl || existingCourse.video_url,
        is_required: Boolean(isRequired),
        is_preview: Boolean(isPreview),
        lesson_order: body.lessonOrder || 0,
      });

      return jsonResponse({ lesson });
    }

    // PUT /api/lms/lesson (Edit lesson)
    if (path === "lesson" && method === "PUT") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const { lessonId, ...patch } = body;
      if (!lessonId) return errorResponse("Missing lessonId");

      const lesson = lmsDB.updateLesson(lessonId, patch);
      if (!lesson) return errorResponse("Lesson not found", 404);
      return jsonResponse({ lesson });
    }

    // DELETE /api/lms/lesson (Delete lesson)
    if (path === "lesson" && method === "DELETE") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const { lessonId } = body;
      if (!lessonId) return errorResponse("Missing lessonId");

      const ok = lmsDB.deleteLesson(lessonId);
      return jsonResponse({ success: ok });
    }

    // POST /api/lms/submit-assignment
    if (path === "submit-assignment" && method === "POST") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const body = await req.json();
      const { assignmentId, courseId, githubUrl = "", solutionNotes = "" } = body;
      if (!assignmentId || !courseId) return errorResponse("Missing assignmentId or courseId");

      const course = lmsDB.getCourse(courseId);
      if (!course) return errorResponse("Course not found", 404);

      const submission = lmsDB.submitAssignment({
        assignment_id: assignmentId,
        course_id: course.id,
        student_id: user.userId,
        student_name: user.name || body.studentName || "Student",
        student_email: user.email || body.studentEmail || "student@example.com",
        github_url: githubUrl,
        solution_notes: solutionNotes,
        max_score: Number(body.maxScore) || 100,
      });

      return jsonResponse({ submission });
    }

    // POST /api/lms/grade-submission
    if (path === "grade-submission" && method === "POST") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const { submissionId, score, feedback, status } = body;
      if (!submissionId || score === undefined)
        return errorResponse("Missing submissionId or score");

      const graded = lmsDB.gradeSubmission(submissionId, {
        score: Number(score),
        feedback: feedback || "Well done!",
        gradedBy: user.name || "Instructor",
        status: status === "needs_revision" || status === "approved" ? status : undefined,
      });

      if (!graded) return errorResponse("Submission not found", 404);
      return jsonResponse({ submission: graded });
    }

    // POST /api/lms/save-assignment
    if (path === "save-assignment" && method === "POST") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const course = lmsDB.getCourse(body.courseId || body.courseSlug);
      if (!course) return errorResponse("Course not found", 404);

      const asg = lmsDB.saveAssignment({
        id: body.id,
        course_id: course.id,
        course_slug: course.slug,
        course_title: course.title,
        title: body.title,
        description: body.description || "",
        due_date: body.dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
        max_score: Number(body.maxScore) || 100,
        created_by: user.userId,
      });

      return jsonResponse({ assignment: asg });
    }

    // DELETE /api/lms/assignment
    if (path === "assignment" && method === "DELETE") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const { id } = body;
      if (!id) return errorResponse("Missing id");
      const ok = lmsDB.deleteAssignment(id);
      return jsonResponse({ success: ok });
    }

    // POST /api/lms/submit-quiz
    if (path === "submit-quiz" && method === "POST") {
      if (!user.userId) return errorResponse("Unauthorized", 401);
      const body = await req.json();
      const { quizId, courseId, answers = {} } = body;
      if (!quizId || !courseId) return errorResponse("Missing quizId or courseId");

      const db = lmsDB.getAllCourses();
      const course = lmsDB.getCourse(courseId);
      if (!course) return errorResponse("Course not found", 404);

      // Find quiz to score answers
      const quiz = (lmsDB as unknown as { read: () => { quizzes: unknown[] } })
        .read?.()
        ?.quizzes?.find((q: unknown) => (q as { id: string }).id === quizId) as
        | {
            questions: { id: number; correct_option: number; marks: number }[];
            pass_percentage: number;
          }
        | undefined;

      let score = 0;
      let totalMarks = 0;
      if (quiz && quiz.questions) {
        quiz.questions.forEach((q) => {
          totalMarks += q.marks;
          if (answers[q.id] === q.correct_option) {
            score += q.marks;
          }
        });
      } else {
        totalMarks = 100;
        score = 80;
      }

      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const passed = percentage >= (quiz?.pass_percentage || 70);

      const attempt = lmsDB.submitQuizAttempt({
        quiz_id: quizId,
        course_id: course.id,
        student_id: user.userId,
        student_name: user.name || body.studentName || "Student",
        student_email: user.email || body.studentEmail || "student@example.com",
        score,
        total_marks: totalMarks,
        percentage,
        passed,
        answers,
      });

      return jsonResponse({ attempt });
    }

    // POST /api/lms/save-quiz
    if (path === "save-quiz" && method === "POST") {
      if (!user.isTeacher) return errorResponse("Forbidden", 403);
      const body = await req.json();
      const course = lmsDB.getCourse(body.courseId || body.courseSlug);
      if (!course) return errorResponse("Course not found", 404);

      const quiz = lmsDB.saveQuiz({
        id: body.id,
        course_id: course.id,
        course_slug: course.slug,
        course_title: course.title,
        title: body.title,
        description: body.description || "",
        duration_minutes: Number(body.durationMinutes) || 15,
        pass_percentage: Number(body.passPercentage) || 70,
        questions: body.questions || [],
        created_by: user.userId,
      });

      return jsonResponse({ quiz });
    }

    return errorResponse(`Unhandled endpoint: ${method} /api/lms/${path}`, 404);
  } catch (err: unknown) {
    console.error("LMS API Error:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(msg, 500);
  }
}
