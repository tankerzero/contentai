import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

// Service-role client — bypasses RLS so cron can read all users' schedules
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

function getHourInTz(date: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', hour12: false,
    }).formatToParts(date)
    const val = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10)
    return val === 24 ? 0 : val
  } catch {
    return date.getUTCHours()
  }
}

function getDayInTz(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(date)
  } catch {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getUTCDay()]
  }
}

interface Schedule {
  id: string
  user_id: string
  platform: string
  frequency: string
  post_hour: number
  timezone: string
  content_type: string
  language: string
  topic: string
  is_active: boolean
  last_posted_at: string | null
}

function isDue(s: Schedule, now: Date): boolean {
  if (!s.last_posted_at) return true
  const hoursSince = (now.getTime() - new Date(s.last_posted_at).getTime()) / 3_600_000
  switch (s.frequency) {
    case '1x_day':   return hoursSince >= 20
    case '3x_week':  return ['Monday','Wednesday','Friday'].includes(getDayInTz(now, s.timezone)) && hoursSince >= 44
    case '1x_week':  return hoursSince >= 144
    default:         return hoursSince >= 20
  }
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish', zh: 'Chinese (Simplified)',
}

async function generatePost(s: Schedule): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const langName = LANG_NAMES[s.language] ?? 'English'
  const typeLabel = s.content_type === 'social_media' ? 'social media post' : s.content_type.replace(/_/g, ' ')
  const niche = s.topic.trim() || 'productivity and business tips'
  const prompt = `Write a ${typeLabel} in ${langName} about: ${niche}. Make it engaging, authentic, and under 280 characters. Add 2-3 relevant hashtags at the end. Return only the post text, no quotes or commentary.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
}

async function sendNotification(
  email: string,
  s: Schedule,
  content: string,
  success: boolean,
  errorMsg?: string,
) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

  if (success) {
    await resend.emails.send({
      from: 'ContentAI <support@contentai.ca>',
      to: [email],
      subject: `✓ Auto-post published on ${s.platform}`,
      html: `
        <h2 style="color:#0D7377">Post published successfully</h2>
        <p>Your scheduled post was published to <strong>${s.platform}</strong>.</p>
        <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #0D7377;margin:16px 0">${content}</blockquote>
        <p><a href="${appUrl}/social" style="color:#0D7377">View post history →</a></p>
      `,
    }).catch(err => console.error('[cron] Email send error:', err))
  } else {
    await resend.emails.send({
      from: 'ContentAI <support@contentai.ca>',
      to: [email],
      subject: `⚠ Auto-post failed on ${s.platform}`,
      html: `
        <h2 style="color:#dc2626">Auto-post failed</h2>
        <p>Your scheduled post to <strong>${s.platform}</strong> could not be published.</p>
        <p><strong>Error:</strong> ${errorMsg ?? 'Unknown error'}</p>
        <blockquote style="background:#f5f5f5;padding:12px;border-left:4px solid #dc2626;margin:16px 0">${content}</blockquote>
        <p>If your account token has expired, please <a href="${appUrl}/social" style="color:#0D7377">reconnect your ${s.platform} account</a>.</p>
      `,
    }).catch(err => console.error('[cron] Email send error:', err))
  }
}

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let supabase: ReturnType<typeof getServiceClient>
  try {
    supabase = getServiceClient()
  } catch (err) {
    console.error('[cron] Service client init failed:', err)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const now = new Date()
  console.log(`[cron/auto-post] ${now.toISOString()} — starting`)

  const { data: schedules, error: schedErr } = await supabase
    .from('posting_schedules')
    .select('*')
    .eq('is_active', true)

  if (schedErr) {
    console.error('[cron] Failed to load schedules:', schedErr.message)
    return NextResponse.json({ error: schedErr.message }, { status: 500 })
  }

  const due = (schedules as Schedule[]).filter(s => {
    const userHour = getHourInTz(now, s.timezone)
    return userHour === s.post_hour && isDue(s, now)
  })

  console.log(`[cron/auto-post] ${schedules?.length ?? 0} active, ${due.length} due`)

  let processed = 0
  let failed = 0

  for (const s of due) {
    // Get user email via admin API
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(s.user_id)
    const userEmail = authUser?.email ?? ''

    // Get platform connection
    const { data: conn } = await supabase
      .from('social_connections')
      .select('access_token, username')
      .eq('user_id', s.user_id)
      .eq('platform', s.platform)
      .single()

    if (!conn?.access_token) {
      console.log(`[cron] No ${s.platform} token for user ${s.user_id} — skipping`)
      continue
    }

    // Generate content
    let content: string
    try {
      content = await generatePost(s)
    } catch (err) {
      console.error(`[cron] Generation failed for schedule ${s.id}:`, err)
      failed++
      continue
    }
    if (!content) { failed++; continue }

    // Save to generations
    const { data: gen } = await supabase
      .from('generations')
      .insert({
        user_id: s.user_id,
        content_type: s.content_type,
        topic: s.topic || 'auto-post',
        tone: 'professional',
        language: s.language,
        content,
        platform: s.platform,
      })
      .select('id')
      .single()

    // Insert social_post as pending
    const { data: post } = await supabase
      .from('social_posts')
      .insert({
        user_id: s.user_id,
        generation_id: gen?.id ?? null,
        platform: s.platform,
        content,
        status: 'pending',
        is_scheduled: true,
      })
      .select('id')
      .single()

    const postId = post?.id

    if (s.platform === 'twitter') {
      try {
        const tweetRes = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${conn.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: content.slice(0, 280) }),
        })
        const tweetData = await tweetRes.json() as { data?: { id: string }; detail?: string }

        if (!tweetRes.ok || !tweetData.data?.id) {
          const errMsg = tweetData.detail ?? `HTTP ${tweetRes.status}`
          console.error(`[cron] Tweet failed for schedule ${s.id}: ${errMsg}`)
          await supabase.from('social_posts').update({ status: 'failed', error_message: errMsg }).eq('id', postId)
          if (userEmail) await sendNotification(userEmail, s, content, false, errMsg)
          failed++
        } else {
          await supabase.from('social_posts').update({
            status: 'posted',
            external_id: tweetData.data.id,
            posted_at: now.toISOString(),
          }).eq('id', postId)

          await supabase.from('posting_schedules').update({
            last_posted_at: now.toISOString(),
            updated_at: now.toISOString(),
          }).eq('id', s.id)

          console.log(`[cron] Tweet posted for schedule ${s.id}: ${tweetData.data.id}`)
          if (userEmail) await sendNotification(userEmail, s, content, true)
          processed++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        await supabase.from('social_posts').update({ status: 'failed', error_message: msg }).eq('id', postId)
        if (userEmail) await sendNotification(userEmail, s, content, false, msg)
        failed++
      }
    }
  }

  console.log(`[cron/auto-post] done — processed: ${processed}, failed: ${failed}`)
  return NextResponse.json({ ok: true, processed, failed, checked: due.length })
}
