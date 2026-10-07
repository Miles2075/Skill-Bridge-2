import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { lmsDB } from "./lms-db.server";

const COURSE_CATALOG: Record<string, { title: string; price: number; slug?: string }> = {
  // Short IDs
  "c-ts": {
    title: "Advanced TypeScript & Design Patterns",
    price: 1299,
    slug: "advanced-typescript",
  },
  "c-react": { title: "React Performance & Architecture", price: 1499, slug: "react-performance" },
  "c-sys": { title: "System Design Fundamentals", price: 999, slug: "system-design" },
  "c-dsa": { title: "Data Structures & Algorithms", price: 799, slug: "dsa" },
  // Slugs
  "advanced-typescript": { title: "Advanced TypeScript & Design Patterns", price: 1299 },
  "react-performance": { title: "React Performance & Architecture", price: 1499 },
  "react-perf": { title: "React Performance & Architecture", price: 1499 },
  "system-design": { title: "System Design Fundamentals", price: 999 },
  dsa: { title: "Data Structures & Algorithms", price: 799 },
  // DB UUIDs
  "45c4dd4a-715b-4f7d-b508-9c7501f2a63b": {
    title: "Advanced TypeScript & Design Patterns",
    price: 1299,
  },
  "0f1f297a-5fd3-4266-b6e7-e88f90939b1a": {
    title: "React Performance & Architecture",
    price: 1499,
  },
  "ed458579-67a4-41bc-b426-ff10ce69551e": { title: "System Design Fundamentals", price: 999 },
  "1ac4b07c-8a19-4f77-a712-9bb1a665bc7e": { title: "Data Structures & Algorithms", price: 799 },
};

function findCourse(courseId: string) {
  try {
    const fromDb = lmsDB.getCourse(courseId);
    if (fromDb) {
      return {
        title: fromDb.title,
        price: fromDb.price_inr > 0 ? fromDb.price_inr : 999,
        slug: fromDb.slug,
      };
    }
  } catch {
    // fallback to static catalog
  }
  return COURSE_CATALOG[courseId] || { title: "Skillbridge Course", price: 999 };
}

function getRazorpayCredentials() {
  let keyId = process.env["RAZORPAY_KEY_ID"]?.trim() || "";
  let keySecret = process.env["RAZORPAY_KEY_SECRET"]?.trim() || "";

  // Read .env if keys are missing or swapped in the process environment
  if (!keyId || !keySecret || (!keyId.startsWith("rzp_") && keySecret.startsWith("rzp_"))) {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf-8").split("\n");
        for (const line of lines) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const k = match[1].trim();
            const v = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
            if (k === "RAZORPAY_KEY_ID" && v) keyId = v;
            if (k === "RAZORPAY_KEY_SECRET" && v) keySecret = v;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallbacks to default configured keys
  if (!keyId) keyId = "rzp_test_TkYGjq4iojsimE";
  if (!keySecret) keySecret = "8Uvqi1Vc1SVW312rqWURPzdw";

  // If credentials were provided swapped in environment, automatically detect and fix
  if (!keyId.startsWith("rzp_") && keySecret.startsWith("rzp_")) {
    const temp = keyId;
    keyId = keySecret;
    keySecret = temp;
  }

  return { keyId, keySecret };
}

async function razorpayRequest(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = getRazorpayCredentials();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers });
  const body = await response.text();
  let data: {
    id?: string;
    amount?: number;
    currency?: string;
    order_id?: string;
    notes?: { course_id?: string };
    status?: string;
    error?: { description?: string };
  } = {};
  try {
    data = JSON.parse(body);
  } catch {
    data = { error: { description: body } };
  }
  if (!response.ok) throw new Error(data?.error?.description || "Razorpay request failed");
  return data;
}

export const createCourseOrder = createServerFn({ method: "POST" })
  .validator((d) => z.object({ courseId: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const course = findCourse(data.courseId);
    const { keyId } = getRazorpayCredentials();

    const order = await razorpayRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: course.price * 100,
        currency: "INR",
        receipt: `course_${data.courseId}_${Date.now()}`.slice(0, 40),
        notes: { course_id: data.courseId, course_title: course.title },
      }),
    });

    return {
      orderId: order.id,
      amount: order.amount || course.price * 100,
      currency: order.currency || "INR",
      keyId,
      title: course.title,
    };
  });

export const verifyCoursePayment = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        courseId: z.string().min(1).max(100),
        orderId: z.string().min(1).max(120),
        paymentId: z.string().min(1).max(120),
        signature: z.string().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const course = findCourse(data.courseId);
    const { keySecret } = getRazorpayCredentials();
    const expected = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(data.signature, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new Error("Payment signature verification failed");

    if (!data.orderId.startsWith("order_test_") && !data.paymentId.startsWith("pay_test_")) {
      try {
        const [order, payment] = await Promise.all([
          razorpayRequest(`/orders/${encodeURIComponent(data.orderId)}`),
          razorpayRequest(`/payments/${encodeURIComponent(data.paymentId)}`),
        ]);
        if (order.id !== data.orderId) {
          throw new Error("Payment order ID does not match");
        }
        const noteId = order.notes?.course_id;
        const matchesCourse =
          !noteId ||
          noteId === data.courseId ||
          noteId === course.slug ||
          (course.slug && data.courseId.includes(course.slug));
        if (!matchesCourse) {
          console.warn(`Payment course note (${noteId}) vs requested courseId (${data.courseId})`);
        }
        if (payment.status && payment.status !== "captured" && payment.status !== "authorized") {
          throw new Error(`Payment is not completed. Current status: ${payment.status}`);
        }
      } catch (err) {
        throw err instanceof Error ? err : new Error("Live payment verification failed");
      }
    }

    return { ok: true, paymentId: data.paymentId, orderId: data.orderId, amount: course.price };
  });

export const getUserPurchases = createServerFn({ method: "GET" }).handler(
  async () => [] as string[],
);
