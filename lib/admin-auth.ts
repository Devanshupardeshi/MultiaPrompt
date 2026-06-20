// Admin auth via a signed (HMAC-SHA256) httpOnly cookie. Uses Web Crypto only, so
// the same helpers run in both the Edge middleware and Node route handlers.
//
// Bootstrap secrets (set once in the host env — see the Setup tab):
//   ADMIN_PANEL_PASSWORD   – the password you type to log in
//   ADMIN_COOKIE_SECRET    – HMAC signing secret (falls back to the password)

export const ADMIN_COOKIE_NAME = "multia_admin";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET || process.env.ADMIN_PANEL_PASSWORD || "";
}

export function isAdminConfigured(): boolean {
  return !!(process.env.ADMIN_PANEL_PASSWORD && process.env.ADMIN_PANEL_PASSWORD.length > 0);
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(input: string): Uint8Array {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += "=".repeat(pad);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createSessionToken(ttlMs = DEFAULT_TTL_MS): Promise<string> {
  const secret = getSecret();
  const exp = Date.now() + ttlMs;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ exp })));
  const sig = b64url(await hmac(payload, secret));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = b64url(await hmac(payload, secret));
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return typeof data.exp === "number" && Date.now() < data.exp;
  } catch {
    return false;
  }
}

export async function verifyPassword(input: unknown): Promise<boolean> {
  const pw = process.env.ADMIN_PANEL_PASSWORD || "";
  if (!pw || typeof input !== "string") return false;
  return timingSafeEqual(input, pw);
}

export const ADMIN_COOKIE_MAX_AGE = Math.floor(DEFAULT_TTL_MS / 1000);

// Per-route re-assert (defense-in-depth on top of middleware).
export async function isRequestAuthed(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<boolean> {
  return verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
