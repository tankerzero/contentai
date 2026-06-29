import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent, type ContentType, type OutputLanguage, type BrandVoice } from '@/lib/anthropic'
import { PLANS, type PlanId } from '@/lib/stripe'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 10 req/min
  const rl = checkRateLimit(rateLimitKey(user.id, 'generate'), 10)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single()

  const planId = (profile?.plan ?? 'free') as PlanId
  const plan = PLANS[planId]
  const limit = plan.generations

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count } = await supabase
    .from('generations').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).gte('created_at', startOfMonth)

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `${plan.name} plan limit reached (${limit}/month). Please upgrade.` },
      { status: 429 }
    )
  }

  const body = await req.json()

  // Sanitize all inputs
  const type     = sanitizeShort(body.type) as ContentType
  const topic    = sanitize(body.topic, 1000)
  const tone     = sanitizeShort(body.tone)
  const language = (sanitizeShort(body.language) || 'en') as OutputLanguage
  const keywords = sanitize(body.keywords ?? '', 500)
  const wordCount = Math.min(Math.max(Number(body.wordCount) || 300, 50), 2000)
  const platform = sanitizeShort(body.platform ?? '')
  const useBrandVoice = Boolean(body.useBrandVoice)

  if (!type || !topic || !tone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let brandVoice: BrandVoice | undefined
  if (useBrandVoice) {
    const { data: bp } = await supabase
      .from('brand_profiles').select('company_name, industry, values, writing_style, tone_examples')
      .eq('user_id', user.id).order('is_default', { ascending: false }).limit(1).single()
    if (bp) {
      brandVoice = {
        companyName: bp.company_name ?? undefined,
        industry: bp.industry ?? undefined,
        values: bp.values ?? undefined,
        writingStyle: bp.writing_style ?? undefined,
        toneExamples: bp.tone_examples ?? undefined,
      }
    }
  }

  try {
    const content = await generateContent({ type, topic, tone, language, keywords, wordCount, brandVoice })

    console.log('[generate] Attempting insert for user:', user.id, '| type:', type, '| lang:', language)

    const insertPayload = {
      user_id: user.id,
      content_type: type,
      topic,
      tone,
      language,
      content,
      ...(platform ? { platform } : {}),
    }

    const { data: saved, error: saveError } = await supabase
      .from('generations')
      .insert(insertPayload)
      .select('id').single()

    if (saveError) {
      console.error('[generate] INSERT FAILED:', JSON.stringify({ code: saveError.code, message: saveError.message, details: saveError.details, hint: saveError.hint }))
    } else {
      console.log('[generate] INSERT OK — saved id:', saved?.id)
    }

    return NextResponse.json({ content, id: saved?.id ?? null })
  } catch (err) {
    console.error('Generation error:', err)
    return NextResponse.json({ error: 'Content generation failed. Please try again.' }, { status: 500 })
  }
}
