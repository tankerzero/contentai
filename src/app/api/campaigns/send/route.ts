import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { createHmac } from 'crypto'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitizeShort } from '@/lib/sanitize'

const PLAN_LIMITS: Record<string, number> = {
  free:   0,
  basic:  1000,
  pro:    10000,
  agency: -1,
}

function generateUnsubToken(userId: string, contactId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
  return createHmac('sha256', secret).update(`${userId}:${contactId}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'campaign_send'), 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many send requests. Please wait.' }, { status: 429 })

  // Check plan
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = profile?.plan ?? 'free'
  const emailLimit = PLAN_LIMITS[plan] ?? 0
  if (emailLimit === 0) {
    return NextResponse.json({ error: 'Upgrade to Basic or higher to send campaigns.' }, { status: 403 })
  }

  const body = await req.json()
  const campaignId = sanitizeShort(body.campaignId)
  if (!campaignId) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

  // Load campaign
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, name, subject, content, status, sends_count')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Campaign already sent.' }, { status: 400 })

  // Check email limit for this billing period (count existing sends this month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthSends } = await supabase
    .from('email_sends')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  if (emailLimit > 0 && (monthSends ?? 0) >= emailLimit) {
    return NextResponse.json({ error: `Monthly email limit reached (${emailLimit}). Upgrade to send more.` }, { status: 403 })
  }

  // Load subscribed contacts
  const { data: contacts } = await supabase
    .from('email_contacts')
    .select('id, email, name')
    .eq('user_id', user.id)
    .eq('subscribed', true)
    .limit(emailLimit > 0 ? Math.min(emailLimit - (monthSends ?? 0), 5000) : 5000)

  if (!contacts?.length) {
    return NextResponse.json({ error: 'No subscribed contacts to send to.' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending not configured. Please set RESEND_API_KEY.' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://contentai-omega.vercel.app'

  // Update campaign status
  await supabase
    .from('email_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId)

  let sent = 0
  let failed = 0

  const sends: { user_id: string; campaign_id: string; contact_id: string; email: string; status: string }[] = []

  for (const contact of contacts) {
    const token = generateUnsubToken(user.id, contact.id)
    const unsubUrl = `${baseUrl}/api/unsubscribe?token=${token}&cid=${contact.id}&uid=${user.id}`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333">
  ${campaign.content.replace(/\n/g, '<br>')}
  <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb">
  <p style="font-size:12px;color:#9ca3af">
    You received this email because you subscribed to communications from this account.
    <a href="${unsubUrl}" style="color:#6366f1">Unsubscribe</a>
  </p>
</body>
</html>`

    try {
      const emailOpts = {
        from: 'ContentAI <support@contentai.ca>',
        to: [contact.email],
        subject: campaign.subject,
        html,
      }
      let { error } = await resend.emails.send(emailOpts)
      if (error) {
        // Fallback to Resend shared domain
        const fallback = await resend.emails.send({ ...emailOpts, from: 'ContentAI <onboarding@resend.dev>' })
        error = fallback.error
      }
      if (error) {
        failed++
        sends.push({ user_id: user.id, campaign_id: campaignId, contact_id: contact.id, email: contact.email, status: 'failed' })
      } else {
        sent++
        sends.push({ user_id: user.id, campaign_id: campaignId, contact_id: contact.id, email: contact.email, status: 'sent' })
      }
    } catch {
      failed++
      sends.push({ user_id: user.id, campaign_id: campaignId, contact_id: contact.id, email: contact.email, status: 'failed' })
    }
  }

  // Save send records
  if (sends.length) {
    await supabase.from('email_sends').insert(sends)
  }

  // Update campaign status
  await supabase
    .from('email_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sends_count: (campaign.sends_count ?? 0) + sent,
    })
    .eq('id', campaignId)

  return NextResponse.json({ sent, failed, total: contacts.length })
}
