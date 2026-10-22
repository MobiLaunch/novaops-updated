import type { VercelRequest, VercelResponse } from "@vercel/node";

import h0 from "../_handlers/afterpay/checkout.js";
import h1 from "../_handlers/afterpay/process.js";

// One function per group keeps the deployment under Vercel's function-count limit.
const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => unknown> = {
  "checkout": h0,
  "process": h1,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action ?? "");
  const fn = handlers[action];

  if (!fn) return res.status(404).json({ statusCode: 404, statusMessage: `Unknown afterpay route: ${action}`, message: "Not found" });

  return fn(req, res);
}
