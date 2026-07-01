// TEMPORARY — remove after Canada Day approval emails are confirmed sent
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'

const SEED_KEY = 'f888d954-156f-4fec-a111-c70432c4a800'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

function platformLabel(p: string) {
  return ({ twitter: 'Twitter / X', linkedin: 'LinkedIn', facebook: 'Facebook' } as Record<string, string>)[p] ?? p
}

function approvalEmailHtml(opts: {
  content: string; platform: string; asset_url: string | null; approveUrl: string; skipUrl: string
}) {
  const safe = opts.content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  const imgBlock = opts.asset_url
    ? `<div style="margin:20px 0"><img src="${opts.asset_url}" alt="Post asset" style="width:100%;max-width:520px;border-radius:12px;display:block" /></div>`
    : ''
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Review post — ContentAI</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.10);max-width:580px;width:100%">
<tr><td style="background:linear-gradient(135deg,#0D7377 0%,#026676 100%);padding:28px 36px">
  <span style="font-size:22px;font-weight:700;color:#fff">✦ ContentAI</span>
</td></tr>
<tr><td style="padding:32px 36px 24px">
  <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827">Review scheduled post</h1>
  <p style="margin:0 0 20px;font-size:14px;color:#6b7280">Approve or skip before it publishes.</p>
  <div style="margin-bottom:20px">
    <span style="display:inline-block;background:#f0fdf4;color:#15803d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0">
      ${platformLabel(opts.platform)}
    </span>
    <span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid #fcd34d;margin-left:8px">
      📅 Jul 1, 2026 · 9:00 AM EDT
    </span>
  </div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #0D7377;border-radius:8px;padding:18px 20px;margin-bottom:20px;font-size:15px;line-height:1.7;color:#111827">
    ${safe}
  </div>
  ${imgBlock}
  <table cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>
    <td style="padding-right:12px">
      <a href="${opts.approveUrl}" style="display:inline-block;background:#0D7377;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none">✅ Approve</a>
    </td>
    <td>
      <a href="${opts.skipUrl}" style="display:inline-block;background:#fff;color:#374151;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;text-decoration:none;border:2px solid #d1d5db">⏭ Skip</a>
    </td>
  </tr></table>
  <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">Approving queues this post for automatic publishing via Buffer.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #f0f0f0">
  <p style="margin:0;font-size:12px;color:#9ca3af">ContentAI · <a href="${APP_URL}" style="color:#9ca3af">contentai.ca</a></p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== SEED_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  const { data: posts, error } = await supabase
    .from('marketing_posts')
    .select('id, content, platform, asset_url, approval_token, approval_status')
    .eq('approval_status', 'pending')
    .eq('scheduled_for', '2026-07-01T13:00:00+00:00')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts?.length) {
    return NextResponse.json({ ok: true, message: 'No pending posts found for that schedule', sent: [] })
  }

  const results = []

  for (const post of posts) {
    if (!post.approval_token) {
      results.push({ id: post.id, platform: post.platform, error: 'No approval_token on this row' })
      continue
    }

    const approveUrl = `${APP_URL}/api/marketing/approve?token=${post.approval_token}`
    const skipUrl    = `${APP_URL}/api/marketing/skip?token=${post.approval_token}`

    const { error: emailError } = await sendEmail({
      from: 'ContentAI <support@contentai.ca>',
      to: 'tanker.zero0@gmail.com',
      subject: `[ContentAI] Review post: ${platformLabel(post.platform)} · Jul 1, 2026 · 9:00 AM EDT`,
      html: approvalEmailHtml({
        content: post.content,
        platform: post.platform,
        asset_url: post.asset_url ?? null,
        approveUrl,
        skipUrl,
      }),
    }).then(() => ({ error: null })).catch(err => ({ error: String(err) }))

    await supabase
      .from('marketing_posts')
      .update({ approval_sent_at: new Date().toISOString() })
      .eq('id', post.id)

    results.push({
      id: post.id,
      platform: post.platform,
      approval_token: post.approval_token,
      email_sent: !emailError,
      ...(emailError ? { email_error: emailError } : {}),
    })
  }

  return NextResponse.json({ ok: true, sent: results })
}
