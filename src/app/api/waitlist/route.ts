import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = checkRateLimit(rateLimitKey(ip, 'waitlist'), 5)
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

    const { email, lang, source } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('waitlist_emails')
      .insert({ email: trimmed, lang: lang ?? 'en', source: source ?? null })

    if (error) {
      // 23505 = unique constraint violation → email already on list, treat as success
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json({ ok: true })
      }
      console.error('[waitlist] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[waitlist] unexpected error:', (err as Error).message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
