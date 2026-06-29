import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

// GET: list social connections
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { data: connections } = await supabase
    .from('social_connections')
    .select('id, platform, username, avatar_url, connected_at, posted_count')
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false })

  return NextResponse.json({ connections: connections ?? [] })
}

// DELETE: disconnect a platform
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const platform = sanitizeShort(body.platform)
  if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 })

  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
