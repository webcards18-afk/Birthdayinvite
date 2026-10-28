import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SESSION_SECRET =
  process.env["SESSION_SECRET"] || "bossman-laxman-50-secret-key-2026-super-secure";

// ── Supabase client for authentication ────────────────────────────────
let rawUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
if (rawUrl.endsWith("/rest/v1/") || rawUrl.endsWith("/rest/v1")) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
}
rawUrl = rawUrl.replace(/\/+$/, "");
const supabaseUrl = rawUrl;

const supabaseKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
  process.env["SUPABASE_ANON_KEY"] ||
  process.env["VITE_SUPABASE_ANON_KEY"] ||
  "";

const supabaseAnonKey =
  process.env["SUPABASE_ANON_KEY"] ||
  process.env["VITE_SUPABASE_ANON_KEY"] ||
  supabaseKey;

let supabaseAuth: SupabaseClient | null = null;
let supabaseClientAnon: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    supabaseClientAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Failed to initialize Supabase client for auth:", err);
    supabaseAuth = null;
    supabaseClientAnon = null;
  }
}

interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, RateLimitEntry>();

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

const ADMIN_SALT = "laxman50thbashsalt2026";

export function checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const entry = loginAttempts.get(key.toLowerCase());
  const now = Date.now();

  if (entry && entry.blockedUntil > now) {
    const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const k = key.toLowerCase();
  const entry = loginAttempts.get(k) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 10 * 60 * 1000;
  }

  loginAttempts.set(k, entry);
}

export function resetRateLimit(key: string): void {
  loginAttempts.delete(key.toLowerCase());
}

/**
 * Resolves a username or prefix to a registered Supabase Auth email if needed.
 */
async function resolveSupabaseEmail(identifier: string): Promise<string> {
  if (identifier.includes("@")) return identifier;

  if (supabaseAuth) {
    try {
      const { data } = await supabaseAuth.auth.admin.listUsers();
      if (data?.users && data.users.length > 0) {
        const idLower = identifier.toLowerCase();
        const match = data.users.find(
          (u) =>
            (u.email && u.email.toLowerCase().startsWith(idLower)) ||
            (u.user_metadata &&
              (u.user_metadata["username"] === identifier ||
                u.user_metadata["name"] === identifier))
        );
        if (match?.email) {
          return match.email;
        }
      }
    } catch (err) {
      console.warn("Failed to lookup user in Supabase Auth:", err);
    }
  }

  return identifier;
}

/**
 * STRICT SUPABASE AUTHENTICATION:
 * Admin can ONLY log in with valid credentials verified against Supabase.
 * No hardcoded or local environment fallbacks.
 */
export async function verifyAdminCredentials(
  identifier: string,
  password: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  const cleanId = identifier.trim();

  if (!supabaseUrl || (!supabaseKey && !supabaseAnonKey)) {
    return {
      success: false,
      error: "Supabase credentials are not configured on the server. Please check your .env settings.",
    };
  }

  // ── Strategy 1: Supabase Built-in Auth (Email + Password) ─────────────
  const targetEmail = await resolveSupabaseEmail(cleanId);
  const client = supabaseClientAnon || supabaseAuth;

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!error && data?.user) {
        const userIdentifier = data.user.email || cleanId;
        return { success: true, username: userIdentifier };
      }
    } catch (err) {
      console.warn("Supabase auth signInWithPassword check failed:", err);
    }
  }

  // ── Strategy 2: Supabase custom admin_users table (if created in Supabase DB) ──
  if (supabaseAuth) {
    try {
      const { data, error } = await supabaseAuth
        .from("admin_users")
        .select("username, password")
        .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const expectedPassword = data.password;
        if (
          password === expectedPassword ||
          hashPassword(password, ADMIN_SALT) === expectedPassword
        ) {
          return { success: true, username: data.username || cleanId };
        }
      }
    } catch {
      // Table doesn't exist or query failed
    }
  }

  // Strict failure — no environment variable fallback allowed
  return {
    success: false,
    error: "Invalid Supabase credentials. Please sign in with your registered Supabase email and password.",
  };
}

export function createSessionToken(username: string): string {
  const timestamp = Date.now();
  const expiresAt = timestamp + 7 * 24 * 60 * 60 * 1000;
  const payload = `${username}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifySessionToken(token: string): { valid: boolean; username?: string } {
  if (!token) return { valid: false };

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return { valid: false };

    const [username, expiresAtStr, signature] = parts;
    if (!username || !expiresAtStr || !signature) return { valid: false };

    const expiresAt = Number(expiresAtStr);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(`${username}:${expiresAtStr}`)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: true, username };
    }
  } catch (err) {
    console.error("Session verification failed:", err);
  }

  return { valid: false };
}
