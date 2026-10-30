import type { VercelRequest, VercelResponse } from "@vercel/node";

import { hasValidSession } from "../_lib/nitro.js";

import h0 from "../_handlers/square/connection-test.js";
import h1 from "../_handlers/square/customers.js";
import h2 from "../_handlers/square/device-status.js";
import h3 from "../_handlers/square/orders.js";
import h4 from "../_handlers/square/pair-device.js";
import h5 from "../_handlers/square/payment.js";
import h6 from "../_handlers/square/payment-readiness.js";
import h7 from "../_handlers/square/payments.js";
import h8 from "../_handlers/square/payouts.js";
import h9 from "../_handlers/square/terminal.js";
import h10 from "../_handlers/square/terminal-status.js";

// One function per group keeps the deployment under Vercel's function-count limit.
const handlers: Record<string, (req: VercelRequest, res: VercelResponse) => unknown> = {
  "connection-test": h0,
  "customers": h1,
  "device-status": h2,
  "orders": h3,
  "pair-device": h4,
  "payment": h5,
  "payment-readiness": h6,
  "payments": h7,
  "payouts": h8,
  "terminal": h9,
  "terminal-status": h10,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // These routes can use the shop's server-side payment credentials, so only a signed-in user may call them.
  if (!(await hasValidSession(req.headers.authorization))) return res.status(401).json({ statusCode: 401, statusMessage: "Sign in to use this.", message: "Sign in to use this." });

  const action = String(req.query.action ?? "");
  const fn = handlers[action];

  if (!fn) return res.status(404).json({ statusCode: 404, statusMessage: `Unknown square route: ${action}`, message: "Not found" });

  return fn(req, res);
}
