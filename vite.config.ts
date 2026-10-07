import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  optimizeDeps: {
    exclude: ["@tanstack/react-router", "@tanstack/react-store"],
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    tailwindcss(),
    react(),
    tsconfigPaths(),
    {
      name: "lms-video-static-middleware",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/uploads/videos/")) return next();

          const relativeName = decodeURIComponent(
            req.url.split("?")[0].replace(/^\/uploads\/videos\//, ""),
          );
          if (
            !relativeName ||
            relativeName.includes("..") ||
            relativeName.includes("\\") ||
            relativeName.includes("/")
          ) {
            res.statusCode = 400;
            res.end("Invalid video path");
            return;
          }

          const filePath = path.resolve(process.cwd(), "public", "uploads", "videos", relativeName);
          const uploadRoot = path.resolve(process.cwd(), "public", "uploads", "videos");
          if (!filePath.startsWith(uploadRoot + path.sep)) {
            res.statusCode = 400;
            res.end("Invalid video path");
            return;
          }

          try {
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) {
              res.statusCode = 404;
              res.end("Video not found");
              return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentTypes: Record<string, string> = {
              ".mp4": "video/mp4",
              ".webm": "video/webm",
              ".mov": "video/quicktime",
              ".m4v": "video/x-m4v",
            };
            const contentType = contentTypes[ext] || "application/octet-stream";
            const range = req.headers.range;

            res.setHeader("Content-Type", contentType);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Cache-Control", "no-store");

            if (req.method === "HEAD") {
              res.setHeader("Content-Length", String(stat.size));
              res.statusCode = 200;
              res.end();
              return;
            }

            if (range) {
              const match = /^bytes=(\d*)-(\d*)$/.exec(range);
              if (!match) {
                res.statusCode = 416;
                res.setHeader("Content-Range", `bytes */${stat.size}`);
                res.end();
                return;
              }

              const start = match[1]
                ? Number(match[1])
                : Math.max(0, stat.size - Number(match[2] || 0));
              const end = match[2] ? Number(match[2]) : stat.size - 1;

              if (start < 0 || end < start || start >= stat.size) {
                res.statusCode = 416;
                res.setHeader("Content-Range", `bytes */${stat.size}`);
                res.end();
                return;
              }

              const safeEnd = Math.min(end, stat.size - 1);
              res.statusCode = 206;
              res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${stat.size}`);
              res.setHeader("Content-Length", String(safeEnd - start + 1));
              fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Length", String(stat.size));
            fs.createReadStream(filePath).pipe(res);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              res.statusCode = 404;
              res.end("Video not found");
              return;
            }
            next(error);
          }
        });
      },
    },
    {
      name: "lms-dev-api-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Handle raw video uploads directly on Node's IncomingMessage stream.
          // This avoids converting the upload through the Web Request adapter.
          if (req.url?.startsWith("/api/lms/upload-video") && req.method === "POST") {
            try {
              const { lmsDB } = await import("./src/lib/lms-db.server");
              const crypto = await import("node:crypto");
              const fs = await import("node:fs");
              const path = await import("node:path");

              const uploadUrl = new URL(req.url, `http://${req.headers.host || "localhost:3000"}`);
              const courseId = uploadUrl.searchParams.get("courseId") || "";
              const token = String(req.headers.authorization || "")
                .replace(/^Bearer\s+/i, "")
                .trim();
              const localSession = token ? lmsDB.validateSession(token) : null;
              const headerUserId = String(req.headers["x-user-id"] || "").trim();
              const headerRole = String(req.headers["x-user-role"] || "")
                .trim()
                .toLowerCase();
              const userId = localSession?.user.id || headerUserId || null;
              const role = localSession?.roles?.includes("admin")
                ? "admin"
                : localSession?.roles?.includes("teacher")
                  ? "teacher"
                  : headerRole === "admin"
                    ? "admin"
                    : headerRole === "teacher"
                      ? "teacher"
                      : "student";

              if (!userId || (role !== "teacher" && role !== "admin")) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Forbidden: Instructor role required" }));
                return;
              }

              const course = lmsDB.getCourse(courseId);
              if (!course) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Course not found." }));
                return;
              }
              if (role !== "admin" && course.teacher_id && course.teacher_id !== userId) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: "Forbidden: You can only upload videos to your own courses.",
                  }),
                );
                return;
              }

              const maxSize = 500 * 1024 * 1024;
              const contentLength = Number(req.headers["content-length"] || 0);
              if (contentLength > maxSize) {
                res.statusCode = 413;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: "Video is too large. Maximum file size is 500 MB.",
                  }),
                );
                return;
              }

              const encodedName = String(req.headers["x-file-name"] || "video.mp4");
              let originalName = "video.mp4";
              try {
                originalName = decodeURIComponent(encodedName);
              } catch {
                originalName = encodedName;
              }

              const dot = originalName.lastIndexOf(".");
              const extension = dot >= 0 ? originalName.slice(dot).toLowerCase() : "";
              const allowed = new Set([".mp4", ".webm", ".mov", ".m4v"]);
              if (!allowed.has(extension)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: "Unsupported video format. Use MP4, WebM, MOV, or M4V.",
                  }),
                );
                return;
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

              let bytes = 0;
              const output = fs.createWriteStream(filePath);
              const cleanup = async () => {
                output.destroy();
                await fs.promises.rm(filePath, { force: true }).catch(() => {});
              };

              req.on("data", (chunk) => {
                bytes += chunk.length;
                if (bytes > maxSize) {
                  req.destroy(new Error("VIDEO_TOO_LARGE"));
                }
              });

              req.on("aborted", () => {
                void cleanup();
              });

              req.on("error", async (error) => {
                await cleanup();
                if (!res.headersSent) {
                  res.statusCode =
                    error instanceof Error && error.message === "VIDEO_TOO_LARGE" ? 413 : 499;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      error:
                        error instanceof Error && error.message === "VIDEO_TOO_LARGE"
                          ? "Video is too large. Maximum file size is 500 MB."
                          : "Video upload was aborted.",
                    }),
                  );
                }
              });

              output.on("error", async (error) => {
                await cleanup();
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  res.end(
                    JSON.stringify({
                      error: error instanceof Error ? error.message : "Failed to save video.",
                    }),
                  );
                }
              });

              output.on("finish", async () => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Cache-Control", "no-store");
                res.end(
                  JSON.stringify({
                    videoUrl: `/uploads/videos/${uniqueName}`,
                    fileName: originalName,
                    size: bytes,
                  }),
                );
              });

              req.pipe(output);
              return;
            } catch (error) {
              console.error("Direct video upload error:", error);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: error instanceof Error ? error.message : "Video upload failed.",
                  }),
                );
              }
              return;
            }
          }

          if (!req.url?.startsWith("/api/lms")) return next();
          try {
            const { handleLmsApiRequest } = await import("./src/lib/lms-api.server");
            const protocol = req.headers["x-forwarded-proto"] || "http";
            const host = req.headers.host || "localhost:3000";
            const url = new URL(req.url, `${protocol}://${host}`);
            const headers = new Headers();
            for (const [k, v] of Object.entries(req.headers)) {
              if (v !== undefined) {
                if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
                else headers.set(k, v);
              }
            }
            const hasBody = req.method !== "GET" && req.method !== "HEAD";
            const webReq = new Request(url.href, {
              method: req.method,
              headers,
              body: hasBody ? Readable.toWeb(req) : undefined,
              duplex: "half",
            });
            const webRes = await handleLmsApiRequest(webReq);
            if (!webRes) return next();
            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => res.setHeader(key, val));
            const arrayBuf = await webRes.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
          } catch (err) {
            console.error("LMS Dev API Error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal LMS server error" }));
          }
        });
      },
    },
  ],
});
