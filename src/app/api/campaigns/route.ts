import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

const PLAN_LIMITS: Record<string, { contacts: number; emails: number } | null> = {
  free:   null,
  basic:  { contacts: 500,  emails: 1000 },
  pro:    { contacts: 5000, emails: 10000 },
  agency: { contacts: -1,   emails: -1 },
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('email_campaigns')
    .select('id, name, subject, status, scheduled_at, sent_at, created_at, sends_count, opens_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'campaigns'), 20, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // Check plan
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = profile?.plan ?? 'free'
  if (!PLAN_LIMITS[plan]) {
    return NextResponse.json({ error: 'Upgrade to Basic or higher to use email campaigns.' }, { status: 403 })
  }

  const body = await req.json()
  const name    = sanitize(body.name ?? '', 200)
  const subject = sanitize(body.subject ?? '', 500)
  const content = sanitize(body.content ?? '', 50000)

  if (!name || !subject || !content) {
    return NextResponse.json({ error: 'Name, subject, and content are required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({ user_id: user.id, name, subject, content, status: 'draft' })
    .select('id, name, subject, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = sanitizeShort(body.id)
  if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
