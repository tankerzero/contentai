import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REQUIRES_MEDIA = new Set(['instagram', 'tiktok', 'youtube', 'pinterest'])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id } = await req.json() as { post_id?: string }
  if (!post_id) return NextResponse.json({ error: 'Missing post_id' }, { status: 400 })

  // Fetch post (RLS ensures user ownership)
  const { data: post, error: postErr } = await supabase
    .from('marketing_posts')
    .select('id, content, platform, asset_url, asset_type, status')
    .eq('id', post_id)
    .eq('user_id', user.id)
    .single()

  if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status === 'posted') return NextResponse.json({ error: 'Already posted' }, { status: 409 })

  const platform = (post.platform as string).toLowerCase()

  if (REQUIRES_MEDIA.has(platform) && !post.asset_url) {
    return NextResponse.json(
      { error: `${platform} requires an image or video — no asset attached to this post` },
      { status: 422 }
    )
  }

  // Get Buffer connection for this platform
  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token, channel_id, auto_post_enabled')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single()

  if (!conn?.access_token || !conn?.channel_id) {
    return NextResponse.json(
      { error: `No ${platform} connection found — connect via Buffer in Social Connections` },
      { status: 422 }
    )
  }
  if (!conn.auto_post_enabled) {
    return NextResponse.json(
      { error: `Auto-posting is not enabled for ${platform} — enable it in Social Connections` },
      { status: 422 }
    )
  }

  // Build Buffer media input
  const isVideo = post.asset_type === 'video' ||
    /\.(mp4|mov|avi|webm|m4v)(\?|$)/i.test((post.asset_url as string | null) ?? '')
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

  let platformPostId: string
  try {
    const res = await fetch('https://api.buffer.com', {
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

    platformPostId = json.data?.createPost?.post?.id ?? ''
    if (!platformPostId) throw new Error(`Buffer returned no post ID: ${JSON.stringify(json)}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[marketing/post-now] Buffer error:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Mark as posted
  await supabase
    .from('marketing_posts')
    .update({ status: 'posted' })
    .eq('id', post_id)

  console.log(`[marketing/post-now] ✓ post ${post_id} → ${platform} ${platformPostId}`)
  return NextResponse.json({ ok: true, platform_post_id: platformPostId })
}
