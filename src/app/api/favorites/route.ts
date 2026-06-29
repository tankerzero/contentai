import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'favorites'), 30)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id = sanitizeShort(body.id)
  const is_favorite = Boolean(body.is_favorite)

  if (!id || typeof is_favorite !== 'boolean') {
    return NextResponse.json({ error: 'Missing id or is_favorite' }, { status: 400 })
  }

  const { error } = await supabase
    .from('generations')
    .update({ is_favorite })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
