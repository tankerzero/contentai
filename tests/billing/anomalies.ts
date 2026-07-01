// Billing anomaly detection script — run: npx tsx tests/billing/anomalies.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY.startsWith('placeholder')) {
  console.log('[anomalies] SUPABASE_SERVICE_ROLE_KEY not available in local env — skipping live check.')
  console.log('[anomalies] To run: add real SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run.')
  const report = {
    timestamp: new Date().toISOString(),
    skipped: true,
    reason: 'SUPABASE_SERVICE_ROLE_KEY not configured in local environment',
    instructions: 'Run from production environment or add real keys to .env.local',
  }
  mkdirSync('./test_reports', { recursive: true })
  writeFileSync('./test_reports/billing_anomalies.json', JSON.stringify(report, null, 2))
  process.exit(0)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

interface Anomaly {
  type: string
  severity: 'critical' | 'warning' | 'info'
  count: number
  details: string
  userIds?: string[]
}

async function runAnomalyCheck() {
  const anomalies: Anomaly[] = []
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  console.log('[anomalies] Starting billing anomaly check...')

  // 1. Paid plan but no stripe_subscription_id
  const { data: noSub } = await supabase
    .from('profiles')
    .select('id, plan, stripe_subscription_id, stripe_customer_id')
    .neq('plan', 'free')
    .is('stripe_subscription_id', null)

  if (noSub?.length) {
    anomalies.push({
      type: 'paid_plan_no_subscription',
      severity: 'critical',
      count: noSub.length,
      details: 'Users with paid plan but no stripe_subscription_id — possible missed webhook',
      userIds: noSub.map(u => u.id),
    })
  }

  // 2. Has stripe_subscription_id but plan = 'free'
  const { data: subButFree } = await supabase
    .from('profiles')
    .select('id, plan, stripe_subscription_id')
    .eq('plan', 'free')
    .not('stripe_subscription_id', 'is', null)

  if (subButFree?.length) {
    anomalies.push({
      type: 'subscription_id_but_free_plan',
      severity: 'critical',
      count: subButFree.length,
      details: 'Users with stripe_subscription_id but still on free plan — possible failed upgrade webhook',
      userIds: subButFree.map(u => u.id),
    })
  }

  // 3. stripe_customer_id but no subscription and created > 24h ago (abandoned checkout)
  const { data: abandoned } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id, created_at')
    .not('stripe_customer_id', 'is', null)
    .is('stripe_subscription_id', null)
    .eq('plan', 'free')
    .lt('created_at', oneDayAgo)

  if (abandoned?.length) {
    anomalies.push({
      type: 'abandoned_checkout',
      severity: 'info',
      count: abandoned.length,
      details: 'Users with Stripe customer ID but no subscription and no payment — possible abandoned checkout',
      userIds: abandoned.slice(0, 10).map(u => u.id),
    })
  }

  // 4. Approved marketing posts past schedule but still draft
  const { data: missedPosts } = await supabase
    .from('marketing_posts')
    .select('id, platform, scheduled_for, approval_status')
    .eq('approval_status', 'approved')
    .eq('status', 'draft')
    .lt('scheduled_for', now.toISOString())

  if (missedPosts?.length) {
    anomalies.push({
      type: 'approved_posts_not_published',
      severity: 'warning',
      count: missedPosts.length,
      details: 'Marketing posts approved and past schedule but status still draft — cron may have missed them',
    })
  }

  const report = {
    timestamp: now.toISOString(),
    total_anomalies: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    warnings: anomalies.filter(a => a.severity === 'warning').length,
    info: anomalies.filter(a => a.severity === 'info').length,
    anomalies,
  }

  mkdirSync('./test_reports', { recursive: true })
  writeFileSync('./test_reports/billing_anomalies.json', JSON.stringify(report, null, 2))

  console.log('\n[anomalies] ─────────────────────────────────────')
  console.log(`Total: ${anomalies.length} | Critical: ${report.critical} | Warnings: ${report.warnings} | Info: ${report.info}`)
  for (const a of anomalies) {
    console.log(`  [${a.severity.toUpperCase()}] ${a.type}: ${a.count} — ${a.details}`)
  }
  if (anomalies.length === 0) {
    console.log('  ✓ No anomalies found')
  }
  console.log('[anomalies] Report saved to test_reports/billing_anomalies.json')
}

runAnomalyCheck().catch(err => {
  console.error('[anomalies] Error:', err)
  process.exit(1)
})
