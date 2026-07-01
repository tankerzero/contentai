// TEMPORARY SEED ENDPOINT — remove after Canada Day posts are confirmed seeded
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

const CANADA_DAY_POSTS = [
  {
    platform: 'twitter',
    language: 'en',
    content: `🇨🇦 Happy Canada Day! Built in Montreal, for the world.

ContentAI generates native content in 5 languages — EN, FR, AR, ES, 中文. Not translated. Native.

Launching today on @ProductHunt 🚀

contentai.ca`,
    asset_url: 'https://contentai.ca/flyers/social_flyer_square_1080.png',
    asset_type: 'image',
    scheduled_for: '2026-07-01T13:00:00.000Z',
  },
  {
    platform: 'linkedin',
    language: 'en',
    content: `Happy Canada Day 🇨🇦

I'm a gamer in Montreal. I'm not a developer. Over 36 hours, I built ContentAI — a multilingual AI content platform that generates native content in English, French, Arabic, Spanish, and Chinese.

It's live today, with real Stripe billing. No waitlist.

Launching on Product Hunt today — would love your support and honest feedback.

contentai.ca`,
    asset_url: 'https://contentai.ca/flyers/ph_gallery_background_1270x760.png',
    asset_type: 'image',
    scheduled_for: '2026-07-01T13:00:00.000Z',
  },
  {
    platform: 'facebook',
    language: 'fr',
    content: `🇨🇦 Bonne fête du Canada! / Happy Canada Day!

ContentAI est maintenant en ligne — génération de contenu IA en 5 langues, conçu pour les marchés francophones et MENA.

EN · FR · AR · ES · 中文

Essayez gratuitement → contentai.ca`,
    asset_url: 'https://contentai.ca/flyers/social_flyer_square_1080.png',
    asset_type: 'image',
    scheduled_for: '2026-07-01T13:00:00.000Z',
  },
]

function platformLabel(p: string) {
  return { twitter: 'Twitter / X', linkedin: 'LinkedIn', facebook: 'Facebook' }[p] ?? p
}

function approvalEmailHtml(opts: {
  content: string; platform: string; asset_url: string; approveUrl: string; skipUrl: string
}) {
  const safe = opts.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')
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
  <div style="margin:20px 0">
    <img src="${opts.asset_url}" alt="Post asset" style="width:100%;max-width:520px;border-radius:12px;display:block" />
  </div>
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
  const results = []

  for (const p of CANADA_DAY_POSTS) {
    const token = crypto.randomUUID()

    const { data, error } = await supabase
      .from('marketing_posts')
      .insert({
        content: p.content,
        platform: p.platform,
        language: p.language,
        status: 'draft',
        asset_url: p.asset_url,
        asset_type: p.asset_type,
        scheduled_for: p.scheduled_for,
        approval_token: token,
        approval_status: 'pending',
        approval_sent_at: new Date().toISOString(),
      })
      .select('id, approval_token')
      .single()

    if (error) {
      results.push({ platform: p.platform, error: error.message })
      continue
    }

    const approveUrl = `${APP_URL}/api/marketing/approve?token=${token}`
    const skipUrl    = `${APP_URL}/api/marketing/skip?token=${token}`

    await sendEmail({
      from: 'ContentAI <support@contentai.ca>',
      to: 'tanker.zero0@gmail.com',
      subject: `[ContentAI] Review post: ${platformLabel(p.platform)} · Jul 1, 2026 · 9:00 AM EDT`,
      html: approvalEmailHtml({ content: p.content, platform: p.platform, asset_url: p.asset_url, approveUrl, skipUrl }),
    }).catch(err => console.error('[seed] Email error:', err))

    results.push({ platform: p.platform, id: data!.id, approval_token: token })
  }

  return NextResponse.json({ ok: true, seeded: results })
}
