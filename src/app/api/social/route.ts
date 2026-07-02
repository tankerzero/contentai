import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'
import { PLANS, type PlanId } from '@/lib/plans'

// GET: list social connections + user plan
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const [{ data: connections }, { data: profile }] = await Promise.all([
    supabase
      .from('social_connections')
      .select('id, platform, username, avatar_url, connected_at, posted_count, auto_post_enabled, connected_via')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ])

  return NextResponse.json({
    connections: connections ?? [],
    plan: (profile as { plan?: string } | null)?.plan ?? 'free',
  })
}

// PATCH: toggle auto_post_enabled on a channel (plan-slot-limited)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'social'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  let body: { platform?: string; auto_post_enabled?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const platform = sanitizeShort(body.platform ?? '')
  const autoPostEnabled = Boolean(body.auto_post_enabled)

  if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 })

  if (autoPostEnabled) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const planId = ((profile as { plan?: string } | null)?.plan ?? 'free') as PlanId
    const slotLimit = (PLANS[planId] ?? PLANS.free).autoPostSlots

    // Count enabled channels, excluding this platform (so re-enabling is idempotent)
    const { count } = await supabase
      .from('social_connections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('auto_post_enabled', true)
      .neq('platform', platform)

    if ((count ?? 0) >= slotLimit) {
      return NextResponse.json({ error: 'slot_limit_exceeded', limit: slotLimit, plan: planId }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('social_connections')
    .update({ auto_post_enabled: autoPostEnabled })
    .eq('user_id', user.id)
    .eq('platform', platform)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
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
