import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Small compatibility layer so the former Nitro handlers run unchanged on Vercel functions.
 * `event` is simply the Vercel request.
 */
export type Event = VercelRequest;

export class HttpError extends Error {
  statusCode: number;
  statusMessage: string;

  constructor(opts: { statusCode: number; statusMessage: string }) {
    super(opts.statusMessage);
    this.statusCode = opts.statusCode;
    this.statusMessage = opts.statusMessage;
  }
}

export const createError = (opts: { statusCode: number; statusMessage: string }) => new HttpError(opts);

export async function readBody<T = any>(event: Event): Promise<T> {
  if (event.body && typeof event.body === "object") return event.body as T;
  if (typeof event.body === "string" && event.body) {
    try { return JSON.parse(event.body) as T; } catch { return {} as T; }
  }

  return {} as T;
}

export const getQuery = (event: Event) => event.query as Record<string, string | string[]>;

export function getHeader(event: Event, name: string): string | undefined {
  const v = event.headers[name.toLowerCase()];

  return Array.isArray(v) ? v[0] : v;
}

/** Server-only configuration, read from the function environment. */
export function runtimeConfig() {
  const env = process.env;

  return {
    geminiApiKey: env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY || "",
    squareAccessToken: env.SQUARE_ACCESS_TOKEN || "",
    squareLocationId: env.SQUARE_LOCATION_ID || "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
    googleClientId: env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET || "",
    public: {
      supabaseUrl: env.VITE_SUPABASE_URL || env.SUPABASE_URL || "",
      squareApplicationId: env.SQUARE_APPLICATION_ID || env.VITE_SQUARE_APPLICATION_ID || "",
      squareSandbox: env.SQUARE_SANDBOX === "true",
    },
  };
}

type Handler = (event: Event) => unknown | Promise<unknown>;

/** Wraps a handler: returns its value as JSON and turns thrown errors into `{ statusCode, statusMessage, message }`. */
export const wrap = (handler: Handler) => async (req: VercelRequest, res: VercelResponse) => {
  try {
    const result = await handler(req);

    res.status(200).json(result === undefined ? { ok: true } : result);
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const statusMessage = err?.statusMessage || err?.message || "Server error";

    res.status(statusCode).json({ statusCode, statusMessage, message: statusMessage });
  }
};
