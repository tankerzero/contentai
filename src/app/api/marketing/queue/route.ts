import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    twitter: 'Twitter / X',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
  }
  return map[platform.toLowerCase()] ?? platform
}

function formatSchedule(iso: string | null) {
  if (!iso) return 'Unscheduled'
  try {
    return new Date(iso).toLocaleString('en-CA', {
      timeZone: 'America/Toronto',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

function approvalEmailHtml(opts: {
  content: string
  platform: string
  asset_url: string | null
  scheduled_for: string | null
  approveUrl: string
  skipUrl: string
  regenerateUrl: string
  plan?: string
  autoPostsRemaining?: number | null
}) {
  const { content, platform, asset_url, scheduled_for, approveUrl, skipUrl, regenerateUrl, plan, autoPostsRemaining } = opts
  const safeContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  const assetBlock = asset_url
    ? `<div style="margin:20px 0">
        <img src="${asset_url}" alt="Post asset"
             style="width:100%;max-width:520px;border-radius:12px;display:block" />
       </div>`
    : ''

  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free'
  const remainingText = autoPostsRemaining != null
    ? `${autoPostsRemaining} auto-post${autoPostsRemaining !== 1 ? 's' : ''} remaining this month`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Review your ${platformLabel(platform)} post — ContentAI</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="580" cellpadding="0" cellspacing="0"
       style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.10);max-width:580px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0D7377 0%,#026676 100%);padding:28px 36px">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-.3px">✦ ContentAI</span>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75)">Your scheduled post is ready for review</p>
    </td>
  </tr>

  <!-- Body -->
  <tr><td style="padding:32px 36px 24px">

    <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827">Your ${platformLabel(platform)} post is ready</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280">Review before it publishes automatically.</p>

    <!-- Meta badges -->
    <div style="margin-bottom:20px">
      <span style="display:inline-block;background:#f0fdf4;color:#15803d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;margin-right:8px;border:1px solid #bbf7d0">
        ${platformLabel(platform)}
      </span>
      <span style="display:inline-block;background:#fafafa;color:#6b7280;font-size:13px;padding:4px 12px;border-radius:20px;border:1px solid #e5e7eb">
        📅 Scheduled for: ${formatSchedule(scheduled_for)}
      </span>
    </div>

    <!-- Post content preview -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #0D7377;border-radius:8px;padding:18px 20px;margin-bottom:20px;font-size:15px;line-height:1.7;color:#111827;white-space:pre-wrap">
      ${safeContent}
    </div>

    <!-- Asset image -->
    ${assetBlock}

    <!-- Action buttons — 3 options -->
    <table cellpadding="0" cellspacing="0" style="margin-top:24px;width:100%">
      <tr>
        <td style="padding-right:10px;vertical-align:top">
          <a href="${approveUrl}"
             style="display:inline-block;background:#0D7377;color:#ffffff;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;text-decoration:none;white-space:nowrap">
            ✅ Approve &amp; Post
          </a>
        </td>
        <td style="padding-right:10px;vertical-align:top">
          <a href="${regenerateUrl}"
             style="display:inline-block;background:#ffffff;color:#0D7377;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none;border:2px solid #0D7377;white-space:nowrap">
            🔄 Regenerate
          </a>
        </td>
        <td style="vertical-align:top">
          <a href="${skipUrl}"
             style="display:inline-block;background:#ffffff;color:#6b7280;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none;border:2px solid #d1d5db;white-space:nowrap">
            ⏭ Skip
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
      <strong>Approve</strong> — publishes as-is at the scheduled time.<br>
      <strong>Regenerate</strong> — generates a new version (uses 1 credit), sends a new email.<br>
      <strong>Skip</strong> — removes this post only; next scheduled post is unaffected.
    </p>

  </td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #f0f0f0">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        You're on the <strong>${planLabel}</strong> plan${remainingText ? ` · ${remainingText}` : ''} · <a href="${APP_URL}/dashboard" style="color:#9ca3af">Manage at contentai.ca</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  // Server-side only — protected by CRON_SECRET
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    content?: string
    platform?: string
    language?: string
    asset_url?: string
    asset_type?: string
    scheduled_for?: string
    user_id?: string
    topic?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { content, platform, language, asset_url, asset_type, scheduled_for, user_id, topic } = body
  if (!content || !platform) {
    return NextResponse.json({ error: 'content and platform are required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const approvalToken = crypto.randomUUID()

  // Check auto-approve mode: Pro/Agency users can skip the email and post directly
  let autoApprove = false
  if (user_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('auto_approve_mode, plan')
      .eq('id', user_id)
      .single()
    const profPlan = (prof as { plan?: string } | null)?.plan ?? 'free'
    const autoApproveMode = (prof as { auto_approve_mode?: boolean } | null)?.auto_approve_mode ?? false
    if (autoApproveMode && ['pro', 'agency', 'unlimited'].includes(profPlan)) {
      autoApprove = true
    }
  }

  const { data: post, error } = await supabase
    .from('marketing_posts')
    .insert({
      user_id: user_id ?? null,
      content,
      platform: platform.toLowerCase(),
      language: language ?? 'en',
      status: 'draft',
      asset_url: asset_url ?? null,
      asset_type: asset_type ?? null,
      scheduled_for: scheduled_for ?? null,
      approval_token: approvalToken,
      approval_status: autoApprove ? 'approved' : 'pending',
      approval_sent_at: new Date().toISOString(),
      ...(topic ? { topic } : {}),
    })
    .select('id, approval_token')
    .single()

  if (error) {
    console.error('[marketing/queue] Insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch plan info for footer
  let plan: string | undefined
  let autoPostsRemaining: number | null = null
  if (user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, auto_posts_this_month')
      .eq('id', user_id)
      .single()
    plan = (profile as { plan?: string } | null)?.plan ?? 'free'
    const autoPostsThisMonth = (profile as { auto_posts_this_month?: number } | null)?.auto_posts_this_month ?? 0
    if (plan === 'basic') autoPostsRemaining = Math.max(0, 3 - autoPostsThisMonth)
  }

  // Auto-approve mode: no email needed, post goes directly to approved queue
  if (!autoApprove) {
    const approveUrl    = `${APP_URL}/api/marketing/approve?token=${approvalToken}`
    const skipUrl       = `${APP_URL}/api/marketing/skip?token=${approvalToken}`
    const regenerateUrl = `${APP_URL}/api/marketing/regenerate?token=${approvalToken}`

    const html = approvalEmailHtml({
      content,
      platform,
      asset_url: asset_url ?? null,
      scheduled_for: scheduled_for ?? null,
      approveUrl,
      skipUrl,
      regenerateUrl,
      plan,
      autoPostsRemaining,
    })

    const when = formatSchedule(scheduled_for ?? null)
    const { error: emailErr } = await sendEmail({
      from: 'ContentAI <support@contentai.ca>',
      to: 'tanker.zero0@gmail.com',
      subject: `Your ${platformLabel(platform)} post is ready — approve before ${when}`,
      html,
    })

    if (emailErr) {
      console.error('[marketing/queue] Email error:', emailErr.message)
    }
  }

  return NextResponse.json({ ok: true, id: post.id, approval_token: post.approval_token, auto_approved: autoApprove })
}
