import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { sendEmail } from '@/lib/resend'
import { PLANS, type PlanId } from '@/lib/plans'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

function page(title: string, icon: string, heading: string, body: string, ctaHref: string, ctaLabel: string) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — ContentAI</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}
  .card{background:#fff;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,.10);padding:48px 40px;max-width:460px;width:100%;text-align:center}
  .icon{font-size:52px;margin-bottom:20px}
  h1{font-size:24px;font-weight:700;color:#111827;margin-bottom:12px}
  p{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:28px}
  a.btn{display:inline-block;background:#0D7377;color:#fff;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;text-decoration:none}
  a.btn:hover{background:#0a5d61}
  .brand{margin-top:28px;font-size:13px;color:#d1d5db}
</style>
</head>
<body>
<div class="card">
  <div class="icon">${icon}</div>
  <h1>${heading}</h1>
  <p>${body}</p>
  <a class="btn" href="${ctaHref}">${ctaLabel}</a>
  <div class="brand">✦ ContentAI</div>
</div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    twitter: 'Twitter / X', linkedin: 'LinkedIn', facebook: 'Facebook', instagram: 'Instagram',
  }
  return map[platform.toLowerCase()] ?? platform
}

function formatSchedule(iso: string | null) {
  if (!iso) return 'Unscheduled'
  try {
    return new Date(iso).toLocaleString('en-CA', {
      timeZone: 'America/Toronto', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
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
}) {
  const { content, platform, asset_url, scheduled_for, approveUrl, skipUrl, regenerateUrl, plan } = opts
  const safeContent = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  const assetBlock = asset_url
    ? `<div style="margin:20px 0"><img src="${asset_url}" alt="Post asset" style="width:100%;max-width:520px;border-radius:12px;display:block" /></div>`
    : ''
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free'
  const isTwitter = platform.toLowerCase() === 'twitter'
  const reviewNote = isTwitter
    ? 'A new version was generated. Approve and it publishes automatically to Twitter/X.'
    : `A new version was generated. Approve to save it, then copy and paste on ${platformLabel(platform)} to publish.`
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>New version ready — ContentAI</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.10);max-width:580px;width:100%">
<tr><td style="background:linear-gradient(135deg,#0D7377 0%,#026676 100%);padding:28px 36px">
  <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.3px">✦ ContentAI</span>
  <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.75)">New version ready — previous one invalidated</p>
</td></tr>
<tr><td style="padding:32px 36px 24px">
  <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827">🔄 Here's your new ${platformLabel(platform)} post</h1>
  <p style="margin:0 0 20px;font-size:14px;color:#6b7280">${reviewNote}</p>
  <div style="margin-bottom:20px">
    <span style="display:inline-block;background:#f0fdf4;color:#15803d;font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;margin-right:8px;border:1px solid #bbf7d0">${platformLabel(platform)}</span>
    <span style="display:inline-block;background:#fafafa;color:#6b7280;font-size:13px;padding:4px 12px;border-radius:20px;border:1px solid #e5e7eb">📅 Scheduled: ${formatSchedule(scheduled_for)}</span>
  </div>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #0D7377;border-radius:8px;padding:18px 20px;margin-bottom:20px;font-size:15px;line-height:1.7;color:#111827;white-space:pre-wrap">${safeContent}</div>
  ${assetBlock}
  <table cellpadding="0" cellspacing="0" style="margin-top:24px;width:100%"><tr>
    <td style="padding-right:10px;vertical-align:top">
      <a href="${approveUrl}" style="display:inline-block;background:#0D7377;color:#fff;font-size:14px;font-weight:700;padding:13px 22px;border-radius:10px;text-decoration:none;white-space:nowrap">✅ Approve &amp; Post</a>
    </td>
    <td style="padding-right:10px;vertical-align:top">
      <a href="${regenerateUrl}" style="display:inline-block;background:#fff;color:#0D7377;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none;border:2px solid #0D7377;white-space:nowrap">🔄 Regenerate again</a>
    </td>
    <td style="vertical-align:top">
      <a href="${skipUrl}" style="display:inline-block;background:#fff;color:#6b7280;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;text-decoration:none;border:2px solid #d1d5db;white-space:nowrap">⏭ Skip</a>
    </td>
  </tr></table>
  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">1 generation credit was used for this regeneration.</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #f0f0f0">
  <p style="margin:0;font-size:12px;color:#9ca3af">You're on the <strong>${planLabel}</strong> plan · <a href="${APP_URL}/dashboard" style="color:#9ca3af">Manage at contentai.ca</a></p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return page('Invalid link', '⚠️', 'Invalid link', 'No regeneration token was provided.', APP_URL, 'Go to ContentAI')
  }

  let supabase: ReturnType<typeof getServiceClient>
  try {
    supabase = getServiceClient()
  } catch {
    return page('Error', '❌', 'Configuration error', 'The server is not configured correctly.', APP_URL, 'Go to ContentAI')
  }

  // Load the post by token
  const { data: post, error } = await supabase
    .from('marketing_posts')
    .select('id, approval_status, platform, content, language, asset_url, asset_type, scheduled_for, user_id, topic')
    .eq('approval_token', token)
    .single()

  if (error || !post) {
    return page('Not found', '🔍', 'Post not found', 'This link is invalid or has expired.', APP_URL, 'Go to ContentAI')
  }

  if (post.approval_status === 'approved') {
    return page('Already approved', '✅', 'Post already approved', 'This post was already approved. It cannot be regenerated.', APP_URL, 'Go to ContentAI')
  }

  const userId = (post as { user_id?: string | null }).user_id
  const planId = 'free'
  let userPlan = planId

  // Deduct 1 generation credit
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, extra_credits')
      .eq('id', userId)
      .single()

    const pId = ((profile as { plan?: string } | null)?.plan ?? 'free') as PlanId
    userPlan = pId
    const plan = PLANS[pId] ?? PLANS['free']
    if (!PLANS[pId]) console.warn(`[regenerate] Unknown plan value '${(profile as { plan?: string } | null)?.plan}' for user ${userId} — defaulting to free`)
    const extraCredits = ((profile as { extra_credits?: number } | null)?.extra_credits ?? 0)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: genCount } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)

    const limit = plan.generations + extraCredits
    if ((genCount ?? 0) >= limit) {
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        .toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })
      return page(
        'Out of credits',
        '🔋',
        'No generations remaining',
        `You've used all your generations this month. You can upgrade your plan or add a Content Pack (CA$4.99 for 20 credits). Your limit resets on ${resetDate}.`,
        `${APP_URL}/billing`,
        'Upgrade or buy credits →'
      )
    }
  }

  // Generate new content
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return page('Error', '❌', 'API not configured', 'The AI service is not configured.', APP_URL, 'Go to ContentAI')
  }

  const anthropic = new Anthropic({ apiKey })
  const platform = (post as { platform: string }).platform
  const language = (post as { language?: string }).language ?? 'en'
  const topic = (post as { topic?: string | null }).topic ?? 'general content'
  const langLabel = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : language === 'es' ? 'Spanish' : language === 'zh' ? 'Chinese' : 'English'

  let newContent: string
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a NEW version of a ${platformLabel(platform)} post in ${langLabel} about: ${topic}. Make it different from this previous version — fresh angle, different hook: "${(post as { content: string }).content.slice(0, 200)}". Platform-optimized, include relevant emojis and hashtags. Maximum ${platform === 'twitter' ? '280' : '500'} characters.`,
      }],
    })
    newContent = (msg.content[0] as { type: string; text: string }).text.trim()
  } catch {
    return page('Error', '❌', 'Generation failed', 'Could not generate a new version. Please try again later.', APP_URL, 'Go to ContentAI')
  }

  // Invalidate old token and insert new post with new token
  await supabase
    .from('marketing_posts')
    .update({ approval_status: 'skipped' })
    .eq('id', (post as { id: string }).id)

  const newToken = crypto.randomUUID()
  const { data: newPost, error: insertErr } = await supabase
    .from('marketing_posts')
    .insert({
      user_id: userId ?? null,
      content: newContent,
      platform,
      language,
      status: 'draft',
      asset_url: (post as { asset_url?: string | null }).asset_url ?? null,
      asset_type: (post as { asset_type?: string | null }).asset_type ?? null,
      scheduled_for: (post as { scheduled_for?: string | null }).scheduled_for ?? null,
      approval_token: newToken,
      approval_status: 'pending',
      approval_sent_at: new Date().toISOString(),
      topic: topic,
    })
    .select('id')
    .single()

  if (insertErr || !newPost) {
    return page('Error', '❌', 'Could not save new version', 'Generation succeeded but saving failed.', APP_URL, 'Go to ContentAI')
  }

  // Record credit usage
  if (userId) {
    await supabase.from('generations').insert({
      user_id: userId,
      content_type: `${platform}_post`,
      topic,
      language,
      content: newContent,
    }).then(() => {})
  }

  // Send new approval email
  const newApproveUrl    = `${APP_URL}/api/marketing/approve?token=${newToken}`
  const newSkipUrl       = `${APP_URL}/api/marketing/skip?token=${newToken}`
  const newRegenerateUrl = `${APP_URL}/api/marketing/regenerate?token=${newToken}`

  const html = approvalEmailHtml({
    content: newContent,
    platform,
    asset_url: (post as { asset_url?: string | null }).asset_url ?? null,
    scheduled_for: (post as { scheduled_for?: string | null }).scheduled_for ?? null,
    approveUrl: newApproveUrl,
    skipUrl: newSkipUrl,
    regenerateUrl: newRegenerateUrl,
    plan: userPlan,
  })

  await sendEmail({
    from: 'ContentAI <support@contentai.ca>',
    to: 'tanker.zero0@gmail.com',
    subject: `🔄 New version of your ${platformLabel(platform)} post is ready — review now`,
    html,
  }).catch(err => console.error('[regenerate] Email error:', err))

  return page(
    'New version sent',
    '🔄',
    'New version sent!',
    'A fresh version has been generated and sent to your email. The previous version is now invalid.',
    APP_URL,
    'Go to ContentAI'
  )
}
