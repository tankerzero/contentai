import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'referral'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase
      .from('profiles')
      .select('referral_code, referral_balance')
      .eq('id', user.id)
      .single(),
    supabase
      .from('referrals')
      .select('id, status, commission, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    referral_code: profile?.referral_code ?? null,
    referral_balance: profile?.referral_balance ?? 0,
    referrals: referrals ?? [],
  })
}
