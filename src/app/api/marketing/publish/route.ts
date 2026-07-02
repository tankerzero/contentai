import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'

const APP_URL               = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'
const BUFFER_URL_LEGACY     = 'https://api.bufferapp.com/graphql'  // ContentAI's own legacy token
const BUFFER_URL_OAUTH      = 'https://api.buffer.com'             // customer OAuth tokens
// Set CONTENTAI_OWNER_USER_ID in Vercel if internal marketing posts are queued with the owner's user_id.
// Posts with user_id = null are always treated as internal regardless of this var.
const OWNER_USER_ID  = process.env.CONTENTAI_OWNER_USER_ID ?? null

// ContentAI's own Buffer channel IDs (used for Twitter, LinkedIn, and internal marketing posts only)
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
  asset_type: string | null
  scheduled_for: string | null
  user_id: string | null
}

// All platforms routed through Buffer for customers
const BUFFER_PLATFORM_LIST = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'pinterest', 'youtube']

// Platforms that require media before publishing
const REQUIRES_MEDIA = new Set(['instagram', 'tiktok', 'youtube', 'pinterest'])

function validateMediaForPlatform(platform: string, post: MarketingPost): void {
  if (REQUIRES_MEDIA.has(platform) && !post.asset_url) {
    throw new Error(`${platform} requires an image or video — no asset_url provided for this post`)
  }
}

interface SocialConn {
  access_token: string
  refresh_token: string | null
  channel_id: string | null
  token_expires_at: string | null
}

const BUFFER_TOKEN_URL   = 'https://auth.buffer.com/token'
const REFRESH_BUFFER_MS  = 5 * 60 * 1000  // refresh if expiring within 5 minutes

async function refreshBufferToken(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  platform: string,
  currentRefreshToken: string,
): Promise<Pick<SocialConn, 'access_token' | 'refresh_token' | 'token_expires_at'>> {
  const clientId     = process.env.BUFFER_CLIENT_ID
  const clientSecret = process.env.BUFFER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Buffer credentials not configured — contact support')

  const tokenRes = await fetch(BUFFER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'refresh_token',
      refresh_token: currentRefreshToken,
    }),
  })

  const rawText = await tokenRes.text()

  if (!tokenRes.ok) {
    console.error(`[buffer/refresh] HTTP ${tokenRes.status} for ${userId}/${platform}: ${rawText}`)
    // Null out refresh_token on all Buffer-connected platforms — the OAuth grant is gone
    await supabase
      .from('social_connections')
      .update({ refresh_token: null })
      .eq('user_id', userId)
      .in('platform', BUFFER_PLATFORM_LIST)
    // Notify the customer to reconnect
    const { data: userRow } = await supabase.auth.admin.getUserById(userId)
    const userEmail = (userRow as { user?: { email?: string } } | null)?.user?.email
    if (userEmail) {
      await sendEmail({
        from: 'ContentAI <support@contentai.ca>',
        to: userEmail,
        subject: '[ContentAI] Action required: reconnect your social channels via Buffer',
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:520px">
          <p style="font-size:15px">Your Buffer connection to ContentAI has expired and could not be automatically renewed.</p>
          <p style="font-size:15px">One or more scheduled posts could not be published as a result.</p>
          <p><a href="${APP_URL}/social" style="background:#0D7377;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-size:14px">Reconnect via Buffer →</a></p>
          <p style="color:#9ca3af;font-size:13px">Go to Social Connections and click Connect via Buffer.</p>
        </div>`,
      }).catch(e => console.error('[buffer/refresh] Reconnect email error:', e))
    }
    throw new Error(
      `Buffer token refresh failed for ${platform} — reconnect via Buffer from Social Connections`
    )
  }

  let tokens: { access_token?: string; refresh_token?: string; expires_in?: number }
  try {
    tokens = JSON.parse(rawText)
  } catch {
    throw new Error(`Buffer refresh response not JSON: ${rawText.slice(0, 200)}`)
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(`Buffer refresh response missing tokens: ${rawText.slice(0, 200)}`)
  }

  const tokenExpiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000
  ).toISOString()

  // All Buffer-connected platforms share the same OAuth grant — update them all
  await supabase
    .from('social_connections')
    .update({
      access_token:     tokens.access_token,
      refresh_token:    tokens.refresh_token,
      token_expires_at: tokenExpiresAt,
    })
    .eq('user_id', userId)
    .in('platform', BUFFER_PLATFORM_LIST)

  console.log(`[buffer/refresh] Refreshed token for ${userId}/${platform}, expires ${tokenExpiresAt}`)

  return {
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token,
    token_expires_at: tokenExpiresAt,
  }
}

async function publishViaLinkedIn(post: MarketingPost, conn: SocialConn): Promise<string> {
  if (!conn.channel_id) throw new Error('LinkedIn person URN missing — reconnect LinkedIn')

  if (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date()) {
    throw new Error('LinkedIn token expired — reconnect LinkedIn from Social Connections')
  }

  const body = {
    author: conn.channel_id,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.content },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${conn.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LinkedIn API error ${res.status}: ${text}`)
  }

  const json = await res.json() as { id?: string }
  return json.id ?? 'linkedin-ok'
}

async function publishViaCustomerBuffer(post: MarketingPost, conn: SocialConn): Promise<string> {
  if (!conn.channel_id) {
    throw new Error(`Buffer channel ID missing for ${post.platform} — reconnect via Buffer`)
  }

  // Determine media type: video platforms need { video } input, image platforms need { picture }
  const isVideo = post.asset_type === 'video' ||
    /\.(mp4|mov|avi|webm|m4v)(\?|$)/i.test(post.asset_url ?? '')
  const mediaInput = post.asset_url
    ? (isVideo ? { video: post.asset_url } : { picture: post.asset_url })
    : undefined

  const mutation = `
    mutation CreatePost($input: PostInput!) {
      createPost(input: $input) {
        post { id status }
      }
    }
  `
  const variables = {
    input: {
      profileIds: [conn.channel_id],
      text: post.content,
      ...(mediaInput ? { media: mediaInput } : {}),
    },
  }

  const res = await fetch(BUFFER_URL_OAUTH, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${conn.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation, variables }),
  })

  const json = await res.json() as {
    data?: { createPost?: { post?: { id: string } } }
    errors?: Array<{ message: string }>
  }

  if (!res.ok) throw new Error(`Buffer HTTP ${res.status}`)
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join('; '))

  const postId = json.data?.createPost?.post?.id
  if (!postId) throw new Error(`Buffer returned no post ID: ${JSON.stringify(json)}`)
  return postId
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

  const res = await fetch(BUFFER_URL_LEGACY, {
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

async function refreshTwitterToken(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  currentRefreshToken: string,
): Promise<Pick<SocialConn, 'access_token' | 'refresh_token' | 'token_expires_at'>> {
  const clientId     = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Twitter credentials not configured')

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: currentRefreshToken,
      client_id:     clientId,
    }),
  })

  const rawText = await tokenRes.text()

  if (!tokenRes.ok) {
    console.error(`[twitter/refresh] HTTP ${tokenRes.status} for ${userId}: ${rawText}`)
    await supabase
      .from('social_connections')
      .update({ refresh_token: null })
      .eq('user_id', userId)
      .eq('platform', 'twitter')
    const { data: userRow } = await supabase.auth.admin.getUserById(userId)
    const userEmail = (userRow as { user?: { email?: string } } | null)?.user?.email
    if (userEmail) {
      await sendEmail({
        from: 'ContentAI <support@contentai.ca>',
        to: userEmail,
        subject: '[ContentAI] Action required: reconnect your Twitter/X account',
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:520px">
          <p style="font-size:15px">Your Twitter/X connection to ContentAI has expired and could not be automatically renewed.</p>
          <p style="font-size:15px">One or more scheduled posts could not be published as a result.</p>
          <p><a href="${APP_URL}/social" style="background:#0D7377;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-size:14px">Reconnect Twitter/X →</a></p>
          <p style="color:#9ca3af;font-size:13px">Go to Social Connections and click Connect next to Twitter/X.</p>
        </div>`,
      }).catch(e => console.error('[twitter/refresh] Reconnect email error:', e))
    }
    throw new Error('Twitter token refresh failed — reconnect Twitter/X from Social Connections')
  }

  let tokens: { access_token?: string; refresh_token?: string; expires_in?: number }
  try {
    tokens = JSON.parse(rawText)
  } catch {
    throw new Error(`Twitter refresh response not JSON: ${rawText.slice(0, 200)}`)
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(`Twitter refresh missing tokens: ${rawText.slice(0, 200)}`)
  }

  const tokenExpiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 7200) * 1000
  ).toISOString()

  await supabase
    .from('social_connections')
    .update({
      access_token:     tokens.access_token,
      refresh_token:    tokens.refresh_token,
      token_expires_at: tokenExpiresAt,
    })
    .eq('user_id', userId)
    .eq('platform', 'twitter')

  console.log(`[twitter/refresh] Refreshed token for ${userId}, expires ${tokenExpiresAt}`)

  return {
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token,
    token_expires_at: tokenExpiresAt,
  }
}

// ── Dormant backup: direct Twitter API (requires paid $100/month API tier) ──
// Twitter/X is now published via Buffer's Twitter integration instead.
// Kept here in case Buffer drops Twitter support and we need to fall back.
//
// async function publishViaCustomerTwitter(post: MarketingPost, conn: SocialConn): Promise<string> {
//   const res = await fetch('https://api.twitter.com/2/tweets', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${conn.access_token}`, 'Content-Type': 'application/json' },
//     body: JSON.stringify({ text: post.content }),
//   })
//   if (!res.ok) { const text = await res.text(); throw new Error(`Twitter API error ${res.status}: ${text}`) }
//   const json = await res.json() as { data?: { id: string } }
//   const tweetId = json.data?.id
//   if (!tweetId) throw new Error(`Twitter returned no tweet ID: ${JSON.stringify(json)}`)
//   return tweetId
// }

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
  if (!process.env.CRON_SECRET) {
    console.error('[marketing/publish] CRON_SECRET is not set — refusing to run unprotected')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
    .select('id, content, platform, asset_url, asset_type, scheduled_for, user_id')
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
      let platformId: string
      const platform = post.platform.toLowerCase()
      const isInternal = !post.user_id || post.user_id === OWNER_USER_ID

      if (isInternal) {
        // ContentAI's own marketing posts → use ContentAI's internal Buffer token
        platformId = await publishViaBuffer(post)
        console.log(`[marketing/publish] ✓ ${post.id} → ContentAI Buffer (${platform} internal) ${platformId}`)
      } else {
        // Customer post — route through their Buffer connection with auto_post_enabled=true
        const { data: conn } = await supabase
          .from('social_connections')
          .select('access_token, refresh_token, channel_id, token_expires_at')
          .eq('user_id', post.user_id)
          .eq('platform', platform)
          .eq('auto_post_enabled', true)
          .single()

        if (!conn?.access_token || !conn?.channel_id) {
          throw new Error(
            `No ${platform} connection with auto-posting enabled — go to Social Connections to connect via Buffer and enable auto-posting`
          )
        }

        let activeConn = conn as SocialConn

        // Refresh Buffer token if expired or expiring within the next 5 minutes
        if (activeConn.token_expires_at) {
          const expiresAt = new Date(activeConn.token_expires_at).getTime()
          if (expiresAt - Date.now() < REFRESH_BUFFER_MS) {
            if (!activeConn.refresh_token) {
              throw new Error(
                `${platform} token is expired — reconnect via Buffer from Social Connections`
              )
            }
            const refreshed = await refreshBufferToken(
              supabase,
              post.user_id as string,
              platform,
              activeConn.refresh_token,
            )
            activeConn = { ...activeConn, ...refreshed }
          }
        }

        // Validate media requirements (skip this post rather than failing whole run)
        validateMediaForPlatform(platform, post)

        platformId = await publishViaCustomerBuffer(post, activeConn)
        console.log(`[marketing/publish] ✓ ${post.id} → customer Buffer (${platform}) ${platformId}`)
      }

      await supabase
        .from('marketing_posts')
        .update({
          status: 'posted',
          posted_at: now,
          posted_platform_id: platformId,
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
