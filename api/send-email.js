import { createClient } from "@supabase/supabase-js";

import { setCors } from "./_squareClient.js";

// POST /api/send-email — sends via the best available method:
//   1. Gmail API (if the profile has connected Gmail via OAuth)
//   2. HTTP API (SendGrid / Resend / Mailgun, via SMTP_HOST as an endpoint)
//   3. SMTP (nodemailer)
//   4. Store-only — reports undelivered rather than failing
//
// Body: { to, subject, body, from?, profileId? }
// Env:  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, subject, body: emailBody, from, profileId } = req.body || {};

  if (!to || !emailBody) return res.status(400).json({ error: "Missing required fields: to, body" });

  if (profileId) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey);
        const { data: conn } = await admin
          .from("social_connections")
          .select("access_token, refresh_token, token_expires_at, handle")
          .eq("profile_id", profileId)
          .eq("platform", "gmail")
          .eq("connected", true)
          .maybeSingle();

        if (conn?.access_token) {
          let accessToken = conn.access_token;

          if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.refresh_token) {
            const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                refresh_token: conn.refresh_token,
                grant_type: "refresh_token",
              }),
            });
            const refreshData = await refreshRes.json();

            if (refreshData.access_token) {
              accessToken = refreshData.access_token;
              await admin
                .from("social_connections")
                .update({
                  access_token: accessToken,
                  token_expires_at: new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString(),
                })
                .eq("profile_id", profileId)
                .eq("platform", "gmail");
            }
          }

          const senderEmail = from || conn.handle || "me";
          const rawEmail = [
            `From: ${senderEmail}`,
            `To: ${to}`,
            `Subject: ${subject || "(No subject)"}`,
            "Content-Type: text/html; charset=utf-8",
            "MIME-Version: 1.0",
            "",
            emailBody.replace(/\n/g, "<br>"),
          ].join("\r\n");

          const encoded = Buffer.from(rawEmail).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

          const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ raw: encoded }),
          });

          if (gmailRes.ok) return res.status(200).json({ ok: true, delivered: true, via: "gmail" });
          // Fall through to SMTP on failure.
        }
      }
    } catch {
      // Fall through to SMTP.
    }
  }

  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpFrom = from || process.env.SMTP_FROM || "";

  if (!smtpHost || !smtpUser) {
    return res.status(200).json({
      ok: true,
      delivered: false,
      message: "Email provider not configured. Message saved but not sent. Connect Gmail under Settings, or set SMTP_HOST in .env.",
    });
  }

  try {
    if (smtpHost.includes("api.sendgrid.com") || smtpHost.includes("api.resend.com") || smtpHost.includes("api.mailgun.net")) {
      const resp = await fetch(smtpHost, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${smtpPass}` },
        body: JSON.stringify({ from: smtpFrom, to, subject: subject || "(No subject)", text: emailBody, html: emailBody.replace(/\n/g, "<br>") }),
      });

      if (!resp.ok) return res.status(200).json({ ok: false, delivered: false, error: `Email API error (${resp.status})` });

      return res.status(200).json({ ok: true, delivered: true, via: "http-api" });
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({ from: smtpFrom || smtpUser, to, subject: subject || "(No subject)", text: emailBody, html: emailBody.replace(/\n/g, "<br>") });

      return res.status(200).json({ ok: true, delivered: true, via: "smtp" });
    } catch (nmErr) {
      if (nmErr.code === "ERR_MODULE_NOT_FOUND" || nmErr.code === "MODULE_NOT_FOUND") {
        return res.status(200).json({ ok: true, delivered: false, message: "SMTP configured but nodemailer not installed." });
      }
      throw nmErr;
    }
  } catch (err) {
    return res.status(200).json({ ok: false, delivered: false, error: err.message || "Email send failed" });
  }
}
