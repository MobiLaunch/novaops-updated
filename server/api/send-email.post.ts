/**
 * POST /api/send-email
 *
 * Sends an email using the best available method:
 *   1. Gmail API — if the user has connected Gmail via OAuth (social_connections)
 *   2. HTTP API — SendGrid / Resend / Mailgun
 *   3. SMTP — via nodemailer
 *   4. Store-only — message saved in Supabase but not delivered
 *
 * Body: { to: string, subject: string, body: string, from?: string, profileId?: string }
 * Env:  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { to, subject, body: emailBody, from, profileId } = body || {}

    if (!to || !emailBody) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields: to, body' })
    }

    const config = useRuntimeConfig()

    // ── Strategy 1: Gmail API via OAuth tokens ──────────────────────────
    if (profileId) {
        try {
            const { createClient } = await import('@supabase/supabase-js')

            const supabaseUrl = (config.public as any).supabaseUrl
            const serviceKey = (config as any).supabaseServiceRoleKey
            if (supabaseUrl && serviceKey) {
                const admin = createClient(supabaseUrl, serviceKey)
                const { data: conn } = await admin
                    .from('social_connections')
                    .select('access_token, refresh_token, token_expires_at, handle')
                    .eq('profile_id', profileId)
                    .eq('platform', 'gmail')
                    .eq('connected', true)
                    .maybeSingle()

                if (conn?.access_token) {
                    let accessToken = conn.access_token

                    // Refresh if expired
                    if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.refresh_token) {
                        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: (config as any).googleClientId,
                                client_secret: (config as any).googleClientSecret,
                                refresh_token: conn.refresh_token,
                                grant_type: 'refresh_token',
                            }),
                        })
                        const refreshData = await refreshRes.json()
                        if (refreshData.access_token) {
                            accessToken = refreshData.access_token
                            // Update stored token
                            await admin.from('social_connections').update({
                                access_token: accessToken,
                                token_expires_at: new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString(),
                            }).eq('profile_id', profileId).eq('platform', 'gmail')
                        }
                    }

                    // Build RFC 2822 email
                    const senderEmail = from || conn.handle || 'me'
                    const rawEmail = [
                        `From: ${senderEmail}`,
                        `To: ${to}`,
                        `Subject: ${subject || '(No subject)'}`,
                        `Content-Type: text/html; charset=utf-8`,
                        `MIME-Version: 1.0`,
                        '',
                        emailBody.replace(/\n/g, '<br>'),
                    ].join('\r\n')

                    // Base64url encode
                    const encoded = Buffer.from(rawEmail)
                        .toString('base64')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '')

                    const gmailRes = await fetch(
                        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ raw: encoded }),
                        }
                    )

                    if (gmailRes.ok) {
                        console.log('[send-email] Sent via Gmail API')
                        return { ok: true, delivered: true, via: 'gmail' }
                    }

                    const gmailErr = await gmailRes.text()
                    console.warn('[send-email] Gmail API error:', gmailRes.status, gmailErr)
                    // Fall through to SMTP
                }
            }
        } catch (gmailErr: any) {
            console.warn('[send-email] Gmail API attempt failed:', gmailErr.message)
            // Fall through to SMTP
        }
    }

    // ── Strategy 2/3: SMTP or HTTP API ──────────────────────────────────
    const smtpHost = process.env.SMTP_HOST || ''
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
    const smtpUser = process.env.SMTP_USER || ''
    const smtpPass = process.env.SMTP_PASS || ''
    const smtpFrom = from || process.env.SMTP_FROM || ''

    if (!smtpHost || !smtpUser) {
        // No email provider configured — store-only mode
        console.log('[send-email] No SMTP configured. Message stored but not delivered.')
        return {
            ok: true,
            delivered: false,
            message: 'Email provider not configured. Message saved but not sent. Connect Gmail in Messages or set SMTP_HOST in .env.',
        }
    }

    try {
        // Try SendGrid-style HTTP API if SMTP_HOST looks like an API endpoint
        if (smtpHost.includes('api.sendgrid.com') || smtpHost.includes('api.resend.com') || smtpHost.includes('api.mailgun.net')) {
            const resp = await fetch(smtpHost, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${smtpPass}`,
                },
                body: JSON.stringify({
                    from: smtpFrom,
                    to,
                    subject: subject || '(No subject)',
                    text: emailBody,
                    html: emailBody.replace(/\n/g, '<br>'),
                }),
            })

            if (!resp.ok) {
                const errBody = await resp.text()
                console.error('[send-email] HTTP API error:', resp.status, errBody)
                return { ok: false, delivered: false, error: `Email API error (${resp.status})` }
            }

            return { ok: true, delivered: true, via: 'http-api' }
        }

        // Fallback: attempt nodemailer if available
        try {
            // @ts-ignore — nodemailer is an optional dependency
            const nodemailer = await import('nodemailer')
            const transporter = (nodemailer as any).createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
            })

            await transporter.sendMail({
                from: smtpFrom || smtpUser,
                to,
                subject: subject || '(No subject)',
                text: emailBody,
                html: emailBody.replace(/\n/g, '<br>'),
            })

            return { ok: true, delivered: true, via: 'smtp' }
        } catch (nmErr: any) {
            if (nmErr.code === 'ERR_MODULE_NOT_FOUND' || nmErr.code === 'MODULE_NOT_FOUND') {
                console.log('[send-email] nodemailer not installed. Run: npm i nodemailer')
                return {
                    ok: true,
                    delivered: false,
                    message: 'SMTP configured but nodemailer not installed. Run: npm i nodemailer',
                }
            }
            throw nmErr
        }
    } catch (err: any) {
        console.error('[send-email] Error:', err.message)
        return { ok: false, delivered: false, error: err.message || 'Email send failed' }
    }
})
