import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface RSVPRecord {
  id: string;
  guestName: string;
  response: "attending" | "declined";
  accompanyingGuests: number;
  contactInfo?: string | undefined;
  message?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface RSVPStats {
  total: number;
  accepting: number;
  declining: number;
  totalConfirmedAttendees: number;
}

// ── Fallback Supabase Configuration for Serverless / Cloudflare ─────────────
const DEFAULT_SUPABASE_URL = "https://hygzzcwussugextmmetw.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z3p6Y3d1c3N1Z2V4dG1tZXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIwNDk5NSwiZXhwIjoyMTA4NzgwOTk1fQ.p7hkA2hy_7m3rz8iMOeu9PCOKFZIboQvE-3OiYjgV7Q";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z3p6Y3d1c3N1Z2V4dG1tZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDQ5OTUsImV4cCI6MjEwODc4MDk5NX0.AbNoQYeaK0YXmhE22Vw3cWUi4__8QeqcEafkeFKvX58";

export function getDbClient(): SupabaseClient | null {
  let rawUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    DEFAULT_SUPABASE_URL;

  if (rawUrl.endsWith("/rest/v1/") || rawUrl.endsWith("/rest/v1")) {
    rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
  }
  rawUrl = rawUrl.replace(/\/+$/, "");

  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    DEFAULT_SERVICE_ROLE_KEY ||
    DEFAULT_ANON_KEY;

  if (!rawUrl || !key) return null;

  try {
    return createClient(rawUrl, key, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Could not create Supabase db client:", err);
    return null;
  }
}

// ── Low-Egress In-Memory Cache (Protects Free Tier Egress) ─────────────────
let rsvpCache: { data: RSVPRecord[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds cache to prevent repeated egress on rapid dashboard reloads

function invalidateCache() {
  rsvpCache = null;
}

// ── Local In-Memory & File Storage Fallback ──────────────────────────────────
let inMemoryRSVPs: RSVPRecord[] = [];

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "rsvps.json");

function ensureDbFile(): void {
  try {
    if (typeof fs !== "undefined" && typeof fs.existsSync === "function") {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf-8");
      }
    }
  } catch {
    // Cloudflare Workers has no writable filesystem
  }
}

function readLocalRecords(): RSVPRecord[] {
  try {
    if (typeof fs !== "undefined" && typeof fs.existsSync === "function" && typeof fs.readFileSync === "function") {
      ensureDbFile();
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn("Local filesystem read error, using in-memory store:", err);
  }
  return inMemoryRSVPs;
}

function writeLocalRecords(records: RSVPRecord[]): void {
  inMemoryRSVPs = records;
  try {
    if (typeof fs !== "undefined" && typeof fs.existsSync === "function" && typeof fs.writeFileSync === "function") {
      ensureDbFile();
      const tmpFile = `${DB_FILE}.${crypto.randomBytes(6).toString("hex")}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), "utf-8");
      fs.renameSync(tmpFile, DB_FILE);
    }
  } catch (err) {
    console.warn("Local filesystem write error, stored in memory:", err);
  }
}

// ── Database Methods ────────────────────────────────────────────────────────

export async function getAllRSVPs(): Promise<RSVPRecord[]> {
  const now = Date.now();
  if (rsvpCache && now - rsvpCache.timestamp < CACHE_TTL_MS) {
    return rsvpCache.data;
  }

  const supabase = getDbClient();
  if (supabase) {
    try {
      // Egress optimization: select only required columns
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, guest_name, response, accompanying_guests, contact_info, message, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase select error:", error.message);
        throw error;
      }

      if (data) {
        const records: RSVPRecord[] = data.map((row: any) => ({
          id: row.id,
          guestName: row.guest_name,
          response: row.response,
          accompanyingGuests: row.accompanying_guests ?? 0,
          contactInfo: row.contact_info ?? undefined,
          message: row.message ?? undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        rsvpCache = { data: records, timestamp: now };
        return records;
      }
    } catch (err) {
      console.warn("Falling back to local storage on Supabase error:", err);
    }
  }

  const local = readLocalRecords();
  const sorted = local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  rsvpCache = { data: sorted, timestamp: now };
  return sorted;
}

export async function getRSVPById(id: string): Promise<RSVPRecord | null> {
  const supabase = getDbClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, guest_name, response, accompanying_guests, contact_info, message, created_at, updated_at")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          guestName: data.guest_name,
          response: data.response,
          accompanyingGuests: data.accompanying_guests ?? 0,
          contactInfo: data.contact_info ?? undefined,
          message: data.message ?? undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("Falling back to local storage for getRSVPById:", err);
    }
  }

  const local = readLocalRecords();
  return local.find((r) => r.id === id) || null;
}

export async function createRSVP(data: {
  guestName: string;
  response: "attending" | "declined";
  accompanyingGuests?: number | undefined;
  contactInfo?: string | undefined;
  message?: string | undefined;
}): Promise<RSVPRecord> {
  const trimmedName = data.guestName.trim();
  const accompanying = Math.max(0, Math.floor(Number(data.accompanyingGuests) || 0));
  const supabase = getDbClient();

  if (supabase) {
    try {
      const now = new Date().toISOString();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Duplicate check: minimal egress query selecting only id
      const { data: existing } = await supabase
        .from("rsvps")
        .select("id, contact_info, message")
        .ilike("guest_name", trimmedName)
        .gte("created_at", fiveMinutesAgo)
        .limit(1);

      if (existing && existing.length > 0 && existing[0]) {
        const targetId = existing[0].id;
        const { data: updated, error } = await supabase
          .from("rsvps")
          .update({
            response: data.response,
            accompanying_guests: accompanying,
            contact_info: data.contactInfo?.trim() || existing[0].contact_info,
            message: data.message?.trim() || existing[0].message,
            updated_at: now,
          })
          .eq("id", targetId)
          .select("id, guest_name, response, accompanying_guests, contact_info, message, created_at, updated_at")
          .single();

        if (!error && updated) {
          invalidateCache();
          return {
            id: updated.id,
            guestName: updated.guest_name,
            response: updated.response,
            accompanyingGuests: updated.accompanying_guests ?? 0,
            contactInfo: updated.contact_info ?? undefined,
            message: updated.message ?? undefined,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
          };
        }
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("rsvps")
        .insert({
          guest_name: trimmedName,
          response: data.response,
          accompanying_guests: accompanying,
          contact_info: data.contactInfo?.trim() || null,
          message: data.message?.trim() || null,
          created_at: now,
          updated_at: now,
        })
        .select("id, guest_name, response, accompanying_guests, contact_info, message, created_at, updated_at")
        .single();

      if (insertErr) {
        console.error("Supabase insert error:", insertErr.message);
        throw insertErr;
      }

      if (inserted) {
        invalidateCache();
        return {
          id: inserted.id,
          guestName: inserted.guest_name,
          response: inserted.response,
          accompanyingGuests: inserted.accompanying_guests ?? 0,
          contactInfo: inserted.contact_info ?? undefined,
          message: inserted.message ?? undefined,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      }
    } catch (err) {
      console.warn("Supabase createRSVP failed, storing in local fallback:", err);
    }
  }

  // Local Storage Fallback
  const records = readLocalRecords();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const duplicate = records.find(
    (r) =>
      r.guestName.toLowerCase() === trimmedName.toLowerCase() &&
      new Date(r.createdAt).getTime() > fiveMinutesAgo
  );

  if (duplicate) {
    duplicate.response = data.response;
    duplicate.accompanyingGuests = accompanying;
    const cleanContact = data.contactInfo?.trim();
    if (cleanContact !== undefined) duplicate.contactInfo = cleanContact;
    const cleanMsg = data.message?.trim();
    if (cleanMsg !== undefined) duplicate.message = cleanMsg;
    duplicate.updatedAt = new Date().toISOString();
    writeLocalRecords(records);
    invalidateCache();
    return duplicate;
  }

  const now = new Date().toISOString();
  const newRecord: RSVPRecord = {
    id: crypto.randomUUID(),
    guestName: trimmedName,
    response: data.response,
    accompanyingGuests: accompanying,
    contactInfo: data.contactInfo?.trim() || undefined,
    message: data.message?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  records.unshift(newRecord);
  writeLocalRecords(records);
  invalidateCache();
  return newRecord;
}

export async function deleteRSVP(id: string): Promise<boolean> {
  const supabase = getDbClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("rsvps").delete().eq("id", id);
      if (!error) {
        invalidateCache();
        return true;
      }
      console.error("Supabase delete error:", error.message);
    } catch (err) {
      console.warn("Supabase delete failed, trying local fallback:", err);
    }
  }

  const records = readLocalRecords();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) return false;
  records.splice(index, 1);
  writeLocalRecords(records);
  invalidateCache();
  return true;
}

export function computeRSVPStats(records: RSVPRecord[]): RSVPStats {
  const total = records.length;
  let accepting = 0;
  let declining = 0;
  let totalConfirmedAttendees = 0;

  for (const r of records) {
    if (r.response === "attending") {
      accepting++;
      totalConfirmedAttendees += 1 + (r.accompanyingGuests || 0);
    } else {
      declining++;
    }
  }

  return {
    total,
    accepting,
    declining,
    totalConfirmedAttendees,
  };
}

export async function getRSVPStats(): Promise<RSVPStats> {
  const all = await getAllRSVPs();
  return computeRSVPStats(all);
}
