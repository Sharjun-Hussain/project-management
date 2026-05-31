import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import DOMPurify from "isomorphic-dompurify";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sanitizeHtml(html) {
  if (typeof html !== "string") return html;
  return DOMPurify.sanitize(html);
}

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  // Clean backslashes and multiple forward slashes
  const cleanPath = path.replace(/\\/g, "/").replace(/\/+/g, "/");

  // Remove /api/v1 from the base URL and strip any trailing slashes
  let baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/api\/v1\/?$/i, "");
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Ensure the path starts with a slash
  const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  return `${baseUrl}${finalPath}`;
}
