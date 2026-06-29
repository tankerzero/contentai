import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

// DELETE single or bulk generations
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'content'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const rawIds: unknown[] = body.ids ?? (body.id ? [body.id] : [])
  const ids = rawIds.map(id => sanitizeShort(id)).filter(Boolean)

  if (!ids.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })

  const { error } = await supabase
    .from('generations')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: ids.length })
}
