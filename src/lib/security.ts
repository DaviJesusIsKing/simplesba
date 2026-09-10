import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_TEXT = 500;

export async function getAdminSession() {
  return getServerSession(authOptions);
}

export function appointmentAccessToken(id: string, phone: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado");
  const normalized = phone.replace(/\D/g, "");
  return createHmac("sha256", secret).update(`${id}:${normalized}`).digest("hex");
}

export function verifyAppointmentAccessToken(
  id: string,
  phone: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  try {
    const expected = appointmentAccessToken(id, phone);
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sanitizeText(value: unknown, max = MAX_TEXT): string {
  return String(value ?? "").trim().slice(0, max);
}

export function parseMoney(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : null;
}

export function parsePositiveInt(value: unknown, min: number, max: number): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export function isValidHexColor(value: unknown): boolean {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function isValidTime(value: unknown): boolean {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidDateISO(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateImageOrPdfDataUrl(value: unknown, maxChars = 1_800_000): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > maxChars) return null;
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  try {
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > 1_400_000) return null;
    const mime = match[1];
    const valid =
      (mime === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
      ((mime === "image/jpeg" || mime === "image/jpg") && bytes.subarray(0, 3).equals(Buffer.from([255,216,255]))) ||
      (mime === "image/gif" && (bytes.subarray(0, 6).toString() === "GIF87a" || bytes.subarray(0, 6).toString() === "GIF89a")) ||
      (mime === "image/webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") ||
      (mime === "application/pdf" && bytes.subarray(0, 5).toString() === "%PDF-");
    return valid ? value : null;
  } catch {
    return null;
  }
}

export function hashForLog(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

