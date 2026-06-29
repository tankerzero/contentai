import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social-post'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const platform     = sanitizeShort(body.platform)
  const content      = sanitize(body.content, 4000)
  const generationId = sanitizeShort(body.generation_id ?? '')

  if (!platform || !content) {
    return NextResponse.json({ error: 'Missing platform or content' }, { status: 400 })
  }

  // Get connection tokens for this platform
  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token, platform')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single()

  if (!conn?.access_token) {
    return NextResponse.json({ error: `${platform} not connected` }, { status: 400 })
  }

  // Insert pending social_post record
  const { data: post } = await supabase
    .from('social_posts')
    .insert({
      user_id: user.id,
      generation_id: generationId || null,
      platform,
      content,
      status: 'pending',
    })
    .select('id')
    .single()

  const postId = post?.id

  if (platform === 'twitter') {
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
        await supabase.from('social_posts').update({
          status: 'failed',
          error_message: tweetData.detail ?? 'Twitter API error',
        }).eq('id', postId)

        return NextResponse.json({ error: tweetData.detail ?? 'Tweet failed' }, { status: 500 })
      }

      await supabase.from('social_posts').update({
        status: 'posted',
        external_id: tweetData.data.id,
        posted_at: new Date().toISOString(),
      }).eq('id', postId)

      await supabase.from('social_connections')
        .update({ posted_count: supabase.rpc('increment', { row_id: postId, amount: 1 }) as unknown as number })
        .eq('user_id', user.id)
        .eq('platform', 'twitter')

      return NextResponse.json({ ok: true, tweet_id: tweetData.data.id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await supabase.from('social_posts').update({
        status: 'failed',
        error_message: msg,
      }).eq('id', postId)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // For other platforms (LinkedIn, Instagram, etc.), mark as pending for manual posting
  return NextResponse.json({ ok: true, message: 'Content queued. Post manually using Copy & Open.' })
}

// GET: post history
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social-post'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { data: posts } = await supabase
    .from('social_posts')
    .select('id, platform, content, status, external_id, error_message, posted_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ posts: posts ?? [] })
}
