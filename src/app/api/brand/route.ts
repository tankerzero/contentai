import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/stripe'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'brand'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const all = req.nextUrl.searchParams.get('all') === '1'

  if (all) {
    const { data } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
    return NextResponse.json({ profiles: data ?? [] })
  }

  // Default: return the default profile (backward compat for generate/planner)
  const { data } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ profile: data ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'brand'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id            = sanitizeShort(body.id)
  const profile_name  = sanitizeShort(body.profile_name)
  const company_name  = sanitizeShort(body.company_name)
  const industry      = sanitizeShort(body.industry)
  const values        = sanitize(body.values, 1000)
  const writing_style = sanitize(body.writing_style, 1000)
  const tone_examples = sanitize(body.tone_examples, 2000)

  // For creating a new profile, check plan limits
  if (!id) {
    const { data: profileData } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const plan = (profileData?.plan ?? 'free') as PlanId
    const { count } = await supabase
      .from('brand_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const allowMultiple = plan === 'pro' || plan === 'agency'
    if (!allowMultiple && (count ?? 0) >= 1) {
      return NextResponse.json(
        { error: 'Upgrade to Pro to create multiple brand profiles.' },
        { status: 403 }
      )
    }

    const isFirst = (count ?? 0) === 0
    const { data: created, error } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: user.id,
        profile_name: profile_name ?? 'Default',
        company_name,
        industry,
        values,
        writing_style,
        tone_examples,
        is_default: isFirst,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: created?.id })
  }

  // Update existing profile
  const { error } = await supabase
    .from('brand_profiles')
    .update({
      profile_name: profile_name ?? 'Default',
      company_name,
      industry,
      values,
      writing_style,
      tone_examples,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'brand'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id = sanitizeShort(body.id)
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('brand_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH: set default profile
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'brand'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const id = sanitizeShort(body.id)
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Clear existing default
  await supabase
    .from('brand_profiles')
    .update({ is_default: false })
    .eq('user_id', user.id)

  // Set new default
  await supabase
    .from('brand_profiles')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
