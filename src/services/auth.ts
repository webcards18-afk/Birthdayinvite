import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://hygzzcwussugextmmetw.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z3p6Y3d1c3N1Z2V4dG1tZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDQ5OTUsImV4cCI6MjEwODc4MDk5NX0.AbNoQYeaK0YXmhE22Vw3cWUi4__8QeqcEafkeFKvX58";
const DEFAULT_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z3p6Y3d1c3N1Z2V4dG1tZXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIwNDk5NSwiZXhwIjoyMTA4NzgwOTk1fQ.p7hkA2hy_7m3rz8iMOeu9PCOKFZIboQvE-3OiYjgV7Q";

function getSessionSecret(): string {
  return process.env["SESSION_SECRET"] || "bossman-laxman-50-secret-key-2026-super-secure";
}

export function getSupabaseAuthClients(): {
  url: string;
  adminClient: SupabaseClient | null;
  anonClient: SupabaseClient | null;
} {
  let rawUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    DEFAULT_SUPABASE_URL;

  if (rawUrl.endsWith("/rest/v1/") || rawUrl.endsWith("/rest/v1")) {
    rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
  }
  rawUrl = rawUrl.replace(/\/+$/, "");

  const serviceRoleKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    DEFAULT_SERVICE_ROLE_KEY;

  const anonKey =
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    DEFAULT_ANON_KEY;

  let adminClient: SupabaseClient | null = null;
  let anonClient: SupabaseClient | null = null;

  try {
    if (rawUrl && serviceRoleKey) {
      adminClient = createClient(rawUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    }
  } catch (err) {
    console.warn("Could not create Supabase adminClient:", err);
  }

  try {
    if (rawUrl && anonKey) {
      anonClient = createClient(rawUrl, anonKey, {
        auth: { persistSession: false },
      });
    }
  } catch (err) {
    console.warn("Could not create Supabase anonClient:", err);
  }

  return { url: rawUrl, adminClient, anonClient };
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
 * Resolves a username or alias to a registered Supabase Auth email.
 */
async function resolveSupabaseEmail(
  identifier: string,
  adminClient: SupabaseClient | null
): Promise<string> {
  const clean = identifier.trim();
  if (clean.includes("@")) return clean;

  const idLower = clean.toLowerCase();

  // Known quick alias resolution
  if (idLower === "t66340792" || idLower === "admin") {
    return "t66340792@gmail.com";
  }

  if (adminClient) {
    try {
      const { data } = await adminClient.auth.admin.listUsers();
      if (data?.users && data.users.length > 0) {
        const match = data.users.find(
          (u) =>
            (u.email && u.email.toLowerCase().startsWith(idLower)) ||
            (u.user_metadata &&
              (u.user_metadata["username"] === clean ||
                u.user_metadata["name"] === clean))
        );
        if (match?.email) {
          return match.email;
        }
      }
    } catch (err) {
      console.warn("Failed to lookup user in Supabase Auth:", err);
    }
  }

  return clean;
}

/**
 * STRICT SUPABASE AUTHENTICATION:
 * Admin can ONLY log in with valid credentials verified against Supabase.
 */
export async function verifyAdminCredentials(
  identifier: string,
  password: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  const cleanId = identifier.trim();
  const { adminClient, anonClient, url } = getSupabaseAuthClients();

  if (!url || (!anonClient && !adminClient)) {
    return {
      success: false,
      error: "Supabase connection could not be established. Please check server settings.",
    };
  }

  const targetEmail = await resolveSupabaseEmail(cleanId, adminClient);
  const client = anonClient || adminClient;

  // Strategy 1: Supabase Built-in Auth (Email + Password)
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

      if (error) {
        console.warn("Supabase auth signInWithPassword failed:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase auth exception:", err?.message || err);
    }
  }

  // Strategy 2: Supabase custom admin_users table (if created in Supabase DB)
  if (adminClient) {
    try {
      const { data, error } = await adminClient
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
      // Table does not exist
    }
  }

  return {
    success: false,
    error: "Invalid admin credentials. Please enter your Supabase email and password.",
  };
}

export function createSessionToken(username: string): string {
  const secret = getSessionSecret();
  const timestamp = Date.now();
  const expiresAt = timestamp + 7 * 24 * 60 * 60 * 1000;
  const payload = `${username}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifySessionToken(token: string): { valid: boolean; username?: string } {
  if (!token) return { valid: false };

  try {
    const secret = getSessionSecret();
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
      .createHmac("sha256", secret)
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
