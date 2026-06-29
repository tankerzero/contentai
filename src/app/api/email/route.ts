import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { resend, getEmailTemplate, type EmailStep } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'email'), 5)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const step = Number(body.step) as EmailStep

  if (![0, 3, 7, 30].includes(step)) {
    return NextResponse.json({ error: 'Invalid step. Must be 0, 3, 7, or 30.' }, { status: 400 })
  }

  // Check not already sent
  const { data: existing } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('user_id', user.id)
    .eq('step', step)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Email already sent for this step.' }, { status: 409 })
  }

  const template = getEmailTemplate(step, {
    email: user.email!,
    name: user.user_metadata?.full_name as string | undefined,
  })

  const { error: sendError } = await resend.emails.send(template)

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  await supabase.from('email_sequences').insert({
    user_id: user.id,
    step,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}

// GET: email sequence status
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'email'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { data: sequences } = await supabase
    .from('email_sequences')
    .select('step, sent_at, opened_at, clicked_at')
    .eq('user_id', user.id)
    .order('step', { ascending: true })

  return NextResponse.json({ sequences: sequences ?? [] })
}
