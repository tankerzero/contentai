import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile as { plan?: string } | null)?.plan ?? 'free'
  if (!['pro', 'agency', 'unlimited'].includes(plan)) {
    return NextResponse.json({ error: 'Auto-approve mode is available on Pro and Agency plans.' }, { status: 403 })
  }

  const body = await req.json() as { enabled?: boolean }
  const enabled = body.enabled === true

  const { error } = await supabase
    .from('profiles')
    .update({ auto_approve_mode: enabled })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, auto_approve_mode: enabled })
}
