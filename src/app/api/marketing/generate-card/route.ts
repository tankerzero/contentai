import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'
import { generateBrandCardBuffer, uploadCardToStorage } from '@/lib/brand-card'

export const runtime = 'nodejs'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST: generate a branded card for a given text snippet
// Body: { content, language, post_id? }
// Returns: { url, asset_type }
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'gen-card'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  let body: { content?: string; language?: string; post_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content  = sanitize(body.content ?? '', 2000)
  const language = sanitizeShort(body.language ?? 'en')
  const postId   = sanitizeShort(body.post_id ?? '')

  if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 })

  try {
    const buffer = await generateBrandCardBuffer(content, language)
    const svc = getServiceClient()
    const url = await uploadCardToStorage(svc, buffer, `users/${user.id}`)

    if (postId) {
      await svc
        .from('marketing_posts')
        .update({ asset_url: url, asset_type: 'image' })
        .eq('id', postId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ url, asset_type: 'image' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Card generation failed'
    console.error('[generate-card] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
