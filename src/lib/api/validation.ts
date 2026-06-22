import { NextResponse } from "next/server";
import { z } from "zod";

export { z };

export const uuidSchema = z.string().trim().uuid();
export const adminRoleSchema = z.enum(["user", "driver", "admin", "supervisor"]);
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
    // Strip Postgres internal codes/hints from the message
    const msg = error.message;
    if (msg.includes("violates") || msg.includes("duplicate key")) {
      return "Operation failed due to a data constraint";
    }
    if (msg.includes("relation") || msg.includes("column")) {
      return fallback; // Don't leak table/column names
    }
    return msg.length > 200 ? msg.slice(0, 200) : msg;
  }
  return fallback;
}
