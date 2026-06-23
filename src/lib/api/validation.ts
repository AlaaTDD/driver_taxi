import { NextResponse } from "next/server";
import { z } from "zod";

export { z };

export const uuidSchema = z.string().trim().uuid();
// [P0-07 FIX] Removed "driver" — driver role is managed via drivers_profile table
// (verify/revoke RPCs). Setting role=driver here would orphan the user from
// the drivers_profile lifecycle, causing inconsistent state.
export const adminRoleSchema = z.enum(["user", "admin", "supervisor"]);
export const messageTypeSchema = z.enum(["support", "trip"]);
export const complaintStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export const triggerTypeSchema = z.enum(["daily_trips", "weekly_trips", "rating_threshold", "streak"]);
export const walletTypeSchema = z.enum(["driver", "user"]);
export const walletTxTypeSchema = z.enum(["bonus", "penalty", "adjustment", "top_up"]);

export const nonEmptyString = (max: number) => z.string().trim().min(1).max(max);
export const optionalString = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().trim().max(max).optional(),
  );

export const booleanFromRequest = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return value;
}, z.boolean());

export const moneyAmount = (max: number) =>
  z.coerce
    .number()
    .finite()
    .positive()
    .max(max);

export const integerRange = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (body[key] === undefined) {
      body[key] = value;
      continue;
    }
    body[key] = Array.isArray(body[key])
      ? [...body[key], value]
      : [body[key], value];
  }
  return body;
}

export function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid request",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

export function parseRequest<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): { data: z.infer<T>; response?: never } | { data?: never; response: Response } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { response: validationErrorResponse(parsed.error) };
  }
  return { data: parsed.data };
}

/**
 * Wraps an API route handler with a top-level try-catch.
 * Prevents unhandled exceptions from crashing the server and
 * returns a generic error response without leaking internals.
 */
export function safeHandler(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(`[API] Unhandled error on ${request.method} ${new URL(request.url).pathname}:`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Sanitizes an error for client-facing responses.
 * Prevents leaking internal DB schema or stack trace details.
 */
export function safeErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    const msg = error.message;
    // [P0-09 FIXED] Whitelist approach: only known, user-safe phrases are mapped
    // to fixed strings. The previous blacklist (`violates` / `duplicate key`
    // / `relation` / `column`) let any other Postgres message of <200 chars
    // through verbatim, leaking schema names, internal RPC hints, and
    // constraint text to the browser. We now return `fallback` for anything
    // that isn't explicitly recognized.
    const SAFE_PATTERNS: { match: string; message: string }[] = [
      { match: "insufficient_balance", message: "Insufficient balance" },
      { match: "unauthorized", message: "Unauthorized" },
      { match: "not pending", message: "The request is no longer pending" },
      { match: "wallet_rpc_missing", message: "Wallet operation is unavailable" },
      { match: "duplicate key", message: "Operation failed due to a data constraint" },
      { match: "violates", message: "Operation failed due to a data constraint" },
    ];
    for (const { match, message } of SAFE_PATTERNS) {
      if (msg.includes(match)) return message;
    }
    return fallback;
  }
  return fallback;
}
