/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MailResult { delivered: boolean; error?: string; message?: string }

/** Sends one plain-text email over the shop's SMTP account (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). */
export async function sendSmtp(to: string, subject: string, text: string, from?: string): Promise<MailResult> {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host || !user) return { delivered: false, message: "SMTP is not configured (SMTP_HOST and SMTP_USER)." };
  try {
    const nodemailer: any = await import("nodemailer");
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

    await transporter.sendMail({ from: from || process.env.SMTP_FROM || user, to, subject, text, html: text.replace(/\n/g, "<br>") });

    return { delivered: true };
  } catch (e: any) {
    return { delivered: false, error: e?.message || "Email send failed" };
  }
}
