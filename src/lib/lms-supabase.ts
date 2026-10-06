import { lmsClient, type ClientCourse, type ClientLesson } from "@/lib/lms-client";

export type Course = {
  id: string;
  slug: string;
  title: string;
  teacher_id: string | null;
  price_inr: number;
  preview_minutes: number;
  video_url: string;
  updated_at: string;
  status?: "published" | "draft" | "review";
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  lesson_order: number;
  required: boolean;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completion_percentage: number;
  status: "enrolled" | "in_progress" | "completed";
  completed_at: string | null;
};

export type LessonProgress = {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
};

function toCourse(course: ClientCourse): Course {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    teacher_id: course.teacher_id,
    price_inr: course.price_inr,
    preview_minutes: course.preview_minutes,
    video_url: course.video_url,
    updated_at: new Date().toISOString(),
    status: course.status,
  };
}

function toLesson(lesson: ClientLesson): Lesson {
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    description: lesson.description || null,
    video_url: lesson.video_url || null,
    lesson_order: lesson.lesson_order,
    required: lesson.is_required,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function listPublishedCourses(): Promise<Course[]> {
  const { courses } = await lmsClient.getCourses();
  return courses.filter((course) => course.status === "published").map(toCourse);
}

export async function listLocalCourses(): Promise<Course[]> {
  const { courses } = await lmsClient.getCourses();
  return courses.map(toCourse);
}

export async function saveLocalCourse(course: Course): Promise<Course> {
  const { course: updated } = await lmsClient.updateCourse(course.id, course);
  return toCourse(updated);
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const { course } = await lmsClient.getCourse(courseId);
    return toCourse(course);
  } catch {
    return null;
  }
}

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  const { lessons } = await lmsClient.getCourse(courseId);
  return lessons.map(toLesson).sort((a, b) => a.lesson_order - b.lesson_order);
}

export async function getMyEnrollments(studentId: string): Promise<Enrollment[]> {
  const { enrolledCourses } = await lmsClient.getStudentDashboard();
  return enrolledCourses
    .filter((course) => course.id)
    .map((course) => ({
      id: `enr_${course.id}_${studentId}`,
      student_id: studentId,
      course_id: course.id,
      enrolled_at: course.enrolledAt,
      completion_percentage: course.progress,
      status:
        course.status === "completed"
          ? "completed"
          : course.status === "enrolled"
            ? "enrolled"
            : "in_progress",
      completed_at: course.completedAt,
    }));
}

export async function getMyLessonProgress(
  studentId: string,
  courseId?: string,
): Promise<LessonProgress[]> {
  if (!courseId) return [];
  const { lessonProgress } = await lmsClient.getCourse(courseId);
  return lessonProgress.map((item) => ({
    id: `progress_${studentId}_${item.lesson_id}`,
    student_id: studentId,
    course_id: courseId,
    lesson_id: item.lesson_id,
    completed: item.completed,
    completed_at: item.completed_at,
    updated_at: item.completed_at || new Date().toISOString(),
  }));
}

export async function enrollInCourse(studentId: string, courseId: string): Promise<Enrollment> {
  const { enrollment } = await lmsClient.enroll(courseId);
  return {
    id: enrollment.id,
    student_id: enrollment.student_id || studentId,
    course_id: enrollment.course_id,
    enrolled_at: enrollment.enrolled_at,
    completion_percentage: enrollment.completion_percentage,
    status: enrollment.status,
    completed_at: enrollment.completed_at,
  };
}

export async function completeLesson(lessonId: string): Promise<Enrollment | null> {
  const { enrolledCourses } = await lmsClient.getStudentDashboard();

  for (const course of enrolledCourses) {
    const details = await lmsClient.getCourse(course.id);
    if (details.lessons.some((lesson) => lesson.id === lessonId)) {
      const result = await lmsClient.completeLesson(course.id, lessonId, true);
      return {
        id: `enr_${course.id}`,
        student_id: "",
        course_id: course.id,
        enrolled_at: course.enrolledAt,
        completion_percentage: result.progress,
        status: result.isCompleted ? "completed" : "in_progress",
        completed_at: result.isCompleted ? new Date().toISOString() : null,
      };
    }
  }

  throw new Error("Lesson not found in your enrolled courses.");
}

export async function getInstructorEnrollments(courseIds: string[]): Promise<Enrollment[]> {
  const { students } = await lmsClient.getInstructorData();
  const allowed = new Set(courseIds);
  return students
    .filter((student) => allowed.has(student.courseId))
    .map((student) => ({
      id: student.id,
      student_id: student.studentId,
      course_id: student.courseId,
      enrolled_at: student.enrolledAt,
      completion_percentage: student.progress,
      status:
        student.status === "completed"
          ? "completed"
          : student.status === "enrolled"
            ? "enrolled"
            : "in_progress",
      completed_at: student.completedAt,
    }));
}

export async function getCertificates(studentId: string) {
  const { certificates } = await lmsClient.getStudentDashboard();
  return certificates.map((certificate) => ({
    id: certificate.id,
    student_id: studentId,
    course_id: "",
    certificate_number: certificate.certificate_id,
    issued_at: certificate.completion_date,
  }));
}
