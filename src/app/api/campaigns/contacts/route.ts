import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

const PLAN_LIMITS: Record<string, number> = {
  free:   0,
  basic:  500,
  pro:    5000,
  agency: -1,
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('email_contacts')
    .select('id, email, name, tags, subscribed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5000)

  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'contacts'), 30, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // Check plan
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = profile?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan] ?? 0
  if (limit === 0) {
    return NextResponse.json({ error: 'Upgrade to Basic or higher to manage contacts.' }, { status: 403 })
  }

  const body = await req.json()

  // Batch import mode: array of emails
  if (Array.isArray(body.emails)) {
    const emails = body.emails
      .map((e: string) => sanitize(e, 320).trim().toLowerCase())
      .filter((e: string) => validateEmail(e))
      .slice(0, 500)

    if (!emails.length) return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 })

    // Check current count
    const { count } = await supabase
      .from('email_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (limit > 0 && (count ?? 0) + emails.length > limit) {
      return NextResponse.json({ error: `Contact limit reached (${limit}). Upgrade to add more.` }, { status: 403 })
    }

    const rows = emails.map((email: string) => ({ user_id: user.id, email }))
    const { data, error } = await supabase
      .from('email_contacts')
      .upsert(rows, { onConflict: 'user_id,email', ignoreDuplicates: true })
      .select('id, email')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ added: data?.length ?? 0 })
  }

  // Single contact mode
  const email = sanitize(body.email ?? '', 320).trim().toLowerCase()
  const name  = sanitize(body.name ?? '', 200).trim()

  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const { count } = await supabase
    .from('email_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (limit > 0 && (count ?? 0) >= limit) {
    return NextResponse.json({ error: `Contact limit reached (${limit}). Upgrade to add more.` }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('email_contacts')
    .upsert({ user_id: user.id, email, name: name || null }, { onConflict: 'user_id,email' })
    .select('id, email, name, subscribed, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map((id: string) => sanitizeShort(id)).filter(Boolean) : []
  if (!ids.length) return NextResponse.json({ error: 'Contact IDs required' }, { status: 400 })

  const { error } = await supabase
    .from('email_contacts')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
