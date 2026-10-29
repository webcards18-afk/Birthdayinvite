import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createRSVP,
  getAllRSVPs,
  deleteRSVP,
  computeRSVPStats,
} from "./db";
import {
  verifyAdminCredentials,
  createSessionToken,
  verifySessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "./auth";

// ── Validation Schemas ──────────────────────────────────────────────────────

const RSVPInputSchema = z.object({
  guestName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  response: z.enum(["attending", "declined"], {
    errorMap: () => ({ message: "Please specify whether you will attend" }),
  }),
  accompanyingGuests: z.number().int().min(0).max(10).optional().default(0),
  contactInfo: z.string().trim().max(100).optional(),
  message: z.string().trim().max(500).optional(),
});

const AdminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// ── 1. Public Guest RSVP Submission ─────────────────────────────────────────

export const submitRSVP = createServerFn({ method: "POST" })
  .validator((data: unknown) => RSVPInputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const record = await createRSVP(data);
      return {
        success: true,
        record,
        message:
          data.response === "attending"
            ? `Thank you, ${record.guestName}! Your RSVP has been confirmed with pleasure.`
            : `Thank you for letting us know, ${record.guestName}. You will be dearly missed!`,
      };
    } catch (err: any) {
      console.error("submitRSVP server error:", err);
      return {
        success: false,
        error: "Unable to save your RSVP at this time. Please try again shortly.",
      };
    }
  });

// ── 2. Admin Authentication Login ───────────────────────────────────────────

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => AdminLoginSchema.parse(data))
  .handler(async ({ data }) => {
    const rateCheck = checkRateLimit(data.username);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many failed attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      };
    }

    const verification = await verifyAdminCredentials(data.username, data.password);
    if (!verification.success) {
      recordFailedAttempt(data.username);
      return {
        success: false,
        error: verification.error || "Invalid admin username or password.",
      };
    }

    const sessionUser = verification.username || data.username;
    resetRateLimit(data.username);
    const token = createSessionToken(sessionUser);

    return {
      success: true,
      token,
      username: sessionUser,
    };
  });

// ── 3. Verify Admin Session ─────────────────────────────────────────────────

export const verifyAdmin = createServerFn({ method: "POST" })
  .validator((token: unknown) => z.string().parse(token))
  .handler(async ({ data: token }) => {
    const session = verifySessionToken(token);
    return {
      authenticated: session.valid,
      username: session.username,
    };
  });

// ── 4. Admin Get RSVPs & Dashboard Stats (Protected) ────────────────────────

export const getAdminRSVPs = createServerFn({ method: "POST" })
  .validator((token: unknown) => z.string().parse(token))
  .handler(async ({ data: token }) => {
    const session = verifySessionToken(token);
    if (!session.valid) {
      return {
        success: false,
        error: "Unauthorized access. Please log in as administrator.",
        rsvps: [],
        stats: { total: 0, accepting: 0, declining: 0, totalConfirmedAttendees: 0 },
      };
    }

    try {
      const rsvps = await getAllRSVPs();
      const stats = computeRSVPStats(rsvps);
      return {
        success: true,
        rsvps,
        stats,
      };
    } catch (err: any) {
      console.error("getAdminRSVPs error:", err);
      return {
        success: false,
        error: "Failed to load RSVP data.",
        rsvps: [],
        stats: { total: 0, accepting: 0, declining: 0, totalConfirmedAttendees: 0 },
      };
    }
  });

// ── 5. Admin Delete RSVP (Protected) ────────────────────────────────────────

export const deleteAdminRSVP = createServerFn({ method: "POST" })
  .validator((payload: unknown) =>
    z.object({ token: z.string(), id: z.string() }).parse(payload)
  )
  .handler(async ({ data: { token, id } }) => {
    const session = verifySessionToken(token);
    if (!session.valid) {
      return { success: false, error: "Unauthorized access." };
    }

    const success = await deleteRSVP(id);
    return { success };
  });
