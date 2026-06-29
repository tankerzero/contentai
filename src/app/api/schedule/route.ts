import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

// GET: list user's posting schedules
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'schedule'), 30)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { data: schedules } = await supabase
    .from('posting_schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ schedules: schedules ?? [] })
}

// POST: create or update schedule (upsert per user+platform)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'schedule'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const platform     = sanitizeShort(body.platform ?? 'twitter')
  const frequency    = sanitizeShort(body.frequency ?? '1x_week')
  const post_hour    = Math.max(0, Math.min(23, parseInt(String(body.post_hour ?? 9), 10)))
  const timezone     = sanitizeShort(body.timezone ?? 'UTC')
  const content_type = sanitizeShort(body.content_type ?? 'social_media')
  const language     = sanitizeShort(body.language ?? 'en')
  const topic        = sanitize(body.topic ?? '', 200)
  const is_active    = body.is_active !== undefined ? Boolean(body.is_active) : true

  const payload = {
    user_id: user.id,
    platform,
    frequency,
    post_hour,
    timezone,
    content_type,
    language,
    topic,
    is_active,
    updated_at: new Date().toISOString(),
  }

  // Try update first (if a schedule exists for this platform), then insert
  const { data: existing } = await supabase
    .from('posting_schedules')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single()

  let result
  if (existing?.id) {
    const { data, error } = await supabase
      .from('posting_schedules')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('posting_schedules')
      .insert(payload)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ schedule: result })
}

// PATCH: toggle is_active
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'schedule'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id = sanitizeShort(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabase
    .from('posting_schedules')
    .update({ is_active: Boolean(body.is_active), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

// DELETE: remove a schedule
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'schedule'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id = sanitizeShort(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('posting_schedules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
