import { config } from "@/lib/config";

/**
 * Normalize email: lowercase, trim, unicode NFKC, strip plus addressing,
 * remove all internal whitespace.
 */
export function normalizeEmail(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/\+[^@]*@/, "@"); // strip plus addressing: user+tag@domain → user@domain
}

const STRICT_EMAIL_RE = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/**
 * Validate email: format, length, domain, strict ASCII after normalization.
 */
export function validateEmail(email: string): { ok: true; email: string } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);

  if (normalized.length > 254 || normalized.length < 5) {
    return { ok: false, error: "Invalid email address" };
  }
  if (!STRICT_EMAIL_RE.test(normalized)) {
    return { ok: false, error: "Invalid email address" };
  }
  if (!normalized.endsWith(`@${config.allowedEmailDomain}`)) {
    return { ok: false, error: `Must use a @${config.allowedEmailDomain} email` };
  }

  return { ok: true, email: normalized };
}
