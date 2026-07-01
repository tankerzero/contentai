import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'
const BUFFER_URL = 'https://api.bufferapp.com/graphql'

// Buffer channel IDs mapped from platform name
const BUFFER_CHANNELS: Record<string, string> = {
  twitter:  '6a43c20b5ab6d2f1068ad84a',
  linkedin: '6a43c2ee5ab6d2f1068adcdd',
  facebook: '6a442bd45ab6d2f1068d2a88',
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

interface MarketingPost {
  id: string
  content: string
  platform: string
  asset_url: string | null
  scheduled_for: string | null
  user_id: string | null
}

async function publishViaBuffer(post: MarketingPost): Promise<string> {
  const token = process.env.BUFFER_ACCESS_TOKEN
  if (!token) throw new Error('BUFFER_ACCESS_TOKEN not set')

  const channelId = BUFFER_CHANNELS[post.platform.toLowerCase()]
  if (!channelId) throw new Error(`No Buffer channel configured for platform: ${post.platform}`)

  // Build media object if asset is provided
  const mediaInput = post.asset_url
    ? `media: { picture: ${JSON.stringify(post.asset_url)} }`
    : ''

  const mutation = `
    mutation CreatePost($input: PostInput!) {
      createPost(input: $input) {
        post {
          id
          status
          dueAt
        }
      }
    }
  `

  const variables = {
    input: {
      profileIds: [channelId],
      text: post.content,
      ...(post.asset_url ? { media: { picture: post.asset_url } } : {}),
    },
  }

  const res = await fetch(BUFFER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation, variables }),
  })

  const json = await res.json() as {
    data?: { createPost?: { post?: { id: string; status: string } } }
    errors?: Array<{ message: string }>
  }

  if (!res.ok) throw new Error(`Buffer HTTP ${res.status}`)
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join('; '))

  const bufferPostId = json.data?.createPost?.post?.id
  if (!bufferPostId) throw new Error(`Buffer returned no post ID. Response: ${JSON.stringify(json)}`)

  return bufferPostId
}

async function sendSummaryEmail(posted: number, failed: number, pending: number) {
  if (!process.env.RESEND_API_KEY) return
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Publish run summary</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:32px 16px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0D7377,#026676);padding:24px 32px">
    <span style="font-size:20px;font-weight:700;color:#fff">✦ ContentAI — Publish run</span>
  </div>
  <div style="padding:28px 32px">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td style="text-align:center;padding:16px;background:#f0fdf4;border-radius:12px;margin:4px">
          <div style="font-size:32px;font-weight:700;color:#15803d">${posted}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Published</div>
        </td>
        <td style="width:12px"></td>
        <td style="text-align:center;padding:16px;background:${failed > 0 ? '#fef2f2' : '#f9fafb'};border-radius:12px">
          <div style="font-size:32px;font-weight:700;color:${failed > 0 ? '#dc2626' : '#9ca3af'}">${failed}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Failed</div>
        </td>
        <td style="width:12px"></td>
        <td style="text-align:center;padding:16px;background:#fafafa;border-radius:12px">
          <div style="font-size:32px;font-weight:700;color:#f59e0b">${pending}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Pending approval</div>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#9ca3af;margin:0">
      <a href="${APP_URL}" style="color:#0D7377">${APP_URL.replace('https://','')} →</a>
    </p>
  </div>
</div>
</body>
</html>`

  await sendEmail({
    from: 'ContentAI <support@contentai.ca>',
    to: 'tanker.zero0@gmail.com',
    subject: `[ContentAI] Publish run: ${posted} posted, ${failed} failed, ${pending} awaiting approval`,
    html,
  }).catch(err => console.error('[marketing/publish] Summary email error:', err))
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
    console.error('[marketing/publish] Service client init failed:', err)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const now = new Date().toISOString()
  console.log(`[marketing/publish] ${now} — starting`)

  // Fetch posts ready to publish
  const { data: readyPosts, error: fetchErr } = await supabase
    .from('marketing_posts')
    .select('id, content, platform, asset_url, scheduled_for, user_id')
    .eq('approval_status', 'approved')
    .eq('status', 'draft')
    .lte('scheduled_for', now)

  if (fetchErr) {
    console.error('[marketing/publish] Fetch error:', fetchErr.message)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  // Count posts pending approval (for summary email)
  const { count: pendingCount } = await supabase
    .from('marketing_posts')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')
    .eq('status', 'draft')

  const posts = (readyPosts ?? []) as MarketingPost[]
  console.log(`[marketing/publish] ${posts.length} ready to publish`)

  let posted = 0
  let failed = 0

  for (const post of posts) {
    // Basic plan: enforce 3 auto-posts/month cap
    if (post.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, auto_posts_this_month, auto_posts_reset_at')
        .eq('id', post.user_id)
        .single()

      const plan = (profile as { plan?: string } | null)?.plan ?? 'free'

      if (plan === 'basic') {
        // Reset counter if past reset date
        const resetAt = (profile as { auto_posts_reset_at?: string | null } | null)?.auto_posts_reset_at
        let usedThisMonth = (profile as { auto_posts_this_month?: number } | null)?.auto_posts_this_month ?? 0
        if (resetAt && now > resetAt) {
          const nextReset = new Date(now)
          nextReset.setMonth(nextReset.getMonth() + 1, 1)
          nextReset.setHours(0, 0, 0, 0)
          await supabase
            .from('profiles')
            .update({ auto_posts_this_month: 0, auto_posts_reset_at: nextReset.toISOString() })
            .eq('id', post.user_id)
          usedThisMonth = 0
        }

        if (usedThisMonth >= 3) {
          console.log(`[marketing/publish] Basic user ${post.user_id} at 3/month limit — skipping post ${post.id}`)
          await supabase
            .from('marketing_posts')
            .update({ status: 'failed', error_message: 'Monthly auto-post limit (3/month) reached on Basic plan.' })
            .eq('id', post.id)
          // Notify user
          const { data: userRow } = await supabase.auth.admin.getUserById(post.user_id)
          const userEmail = (userRow as { user?: { email?: string } } | null)?.user?.email
          if (userEmail) {
            await sendEmail({
              from: 'ContentAI <support@contentai.ca>',
              to: userEmail,
              subject: '[ContentAI] Auto-post limit reached — upgrade to Pro for unlimited',
              html: `<p style="font-family:sans-serif;padding:24px">You've reached your 3 auto-posts/month limit on the Basic plan. <a href="${APP_URL}/billing" style="color:#0D7377">Upgrade to Pro</a> for unlimited auto-posting.</p>`,
            }).catch(() => {})
          }
          failed++
          continue
        }
      }
    }

    try {
      const bufferPostId = await publishViaBuffer(post)
      await supabase
        .from('marketing_posts')
        .update({
          status: 'posted',
          posted_at: now,
          posted_platform_id: bufferPostId,
        })
        .eq('id', post.id)

      // Increment Basic plan monthly counter
      if (post.user_id) {
        const { data: p } = await supabase
          .from('profiles')
          .select('plan, auto_posts_this_month')
          .eq('id', post.user_id)
          .single()
        if ((p as { plan?: string } | null)?.plan === 'basic') {
          const cur = (p as { auto_posts_this_month?: number } | null)?.auto_posts_this_month ?? 0
          await supabase
            .from('profiles')
            .update({ auto_posts_this_month: cur + 1 })
            .eq('id', post.user_id)
        }
      }

      console.log(`[marketing/publish] ✓ ${post.platform} post ${post.id} → Buffer ${bufferPostId}`)
      posted++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[marketing/publish] ✗ Post ${post.id} failed: ${msg}`)
      await supabase
        .from('marketing_posts')
        .update({ status: 'failed', error_message: msg })
        .eq('id', post.id)
      failed++
    }
  }

  // Send summary (only if something happened or there's a backlog)
  const totalActivity = posted + failed + (pendingCount ?? 0)
  if (totalActivity > 0) {
    await sendSummaryEmail(posted, failed, pendingCount ?? 0)
  }

  console.log(`[marketing/publish] done — posted:${posted} failed:${failed} pending:${pendingCount ?? 0}`)
  return NextResponse.json({
    ok: true,
    processed: posts.length,
    posted,
    failed,
    pending_approval: pendingCount ?? 0,
  })
}
