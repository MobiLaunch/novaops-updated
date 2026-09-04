import { createClient } from "@supabase/supabase-js";

import { setCors } from "./_squareClient.js";

// GET /api/fetch-emails?profileId=...&maxResults=50
//
// Fetches inbox + sent from Gmail for the given NovaOps profile (whose OAuth
// tokens live in social_connections) and upserts them into the `messages`
// table. Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server-only) plus
// GOOGLE_CLIENT_ID/SECRET for token refresh.
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { profileId, maxResults = "50" } = req.query;

  if (!profileId) return res.status(400).json({ error: "Missing profileId" });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({ ok: false, synced: 0, error: "Supabase service key not configured" });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: conn, error: connErr } = await admin
    .from("social_connections")
    .select("access_token, refresh_token, token_expires_at, handle")
    .eq("profile_id", profileId)
    .eq("platform", "gmail")
    .eq("connected", true)
    .maybeSingle();

  if (connErr || !conn?.access_token) {
    return res.status(200).json({ ok: false, synced: 0, error: "Gmail not connected" });
  }

  let accessToken = conn.access_token;

  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.refresh_token) {
    try {
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
    } catch {
      // Use existing token.
    }
  }

  const gmailHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  async function fetchMessageDetail(msgId) {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, { headers: gmailHeaders });

    if (!r.ok) return null;

    return r.json();
  }

  function decodeBase64(data) {
    try {
      return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    } catch {
      return "";
    }
  }

  function extractBody(payload) {
    if (!payload) return "";
    if (payload.body?.data) return decodeBase64(payload.body.data);
    if (payload.parts) {
      const plain = payload.parts.find((p) => p.mimeType === "text/plain");

      if (plain?.body?.data) return decodeBase64(plain.body.data);
      const html = payload.parts.find((p) => p.mimeType === "text/html");

      if (html?.body?.data) {
        return decodeBase64(html.body.data)
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
      for (const part of payload.parts) {
        const nested = extractBody(part);

        if (nested) return nested;
      }
    }

    return "";
  }

  function getGmailHeader(headers, name) {
    return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  }

  function parseEmail(header) {
    const match = header.match(/^(.+?)\s*<(.+?)>$/);

    if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };

    return { name: header.trim(), email: header.trim() };
  }

  async function syncLabel(label, direction) {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${label}&maxResults=${maxResults}`,
      { headers: gmailHeaders },
    );

    if (!listRes.ok) return 0;

    const listData = await listRes.json();
    const msgList = listData.messages || [];
    let synced = 0;

    for (const { id } of msgList) {
      const msg = await fetchMessageDetail(id);

      if (!msg?.payload) continue;

      const headers = msg.payload.headers || [];
      const subject = getGmailHeader(headers, "subject") || "(No subject)";
      const fromHeader = getGmailHeader(headers, "from");
      const toHeader = getGmailHeader(headers, "to");
      const dateHeader = getGmailHeader(headers, "date");
      const body = extractBody(msg.payload).substring(0, 4000);

      const myEmail = conn.handle || "";
      let customerEmail = "";
      let customerName = "";

      if (direction === "inbound") {
        const parsed = parseEmail(fromHeader);

        customerEmail = parsed.email;
        customerName = parsed.name;
      } else {
        const parsed = parseEmail(toHeader);

        customerEmail = parsed.email;
        customerName = parsed.name;
      }

      if (!customerEmail || customerEmail === myEmail) continue;

      const created_at = dateHeader ? new Date(dateHeader).toISOString() : new Date(parseInt(msg.internalDate || "0", 10)).toISOString();

      const { error } = await admin.from("messages").upsert(
        {
          profile_id: profileId,
          gmail_message_id: id,
          customer_email: customerEmail,
          customer_name: customerName,
          channel: "email",
          direction,
          subject,
          body: body || "(empty)",
          read: direction === "outbound" || !msg.labelIds?.includes("UNREAD"),
          delivered: direction === "outbound",
          created_at,
        },
        { onConflict: "gmail_message_id" },
      );

      if (!error) synced++;
    }

    return synced;
  }

  try {
    const [inboundCount, outboundCount] = await Promise.all([syncLabel("INBOX", "inbound"), syncLabel("SENT", "outbound")]);

    return res.status(200).json({ ok: true, synced: inboundCount + outboundCount, inbound: inboundCount, outbound: outboundCount });
  } catch (err) {
    return res.status(200).json({ ok: false, synced: 0, error: err.message });
  }
}
