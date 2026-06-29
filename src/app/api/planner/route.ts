import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent, type OutputLanguage, type BrandVoice } from '@/lib/anthropic'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'

const DAYS: Record<OutputLanguage, { key: string; label: string; focus: string }[]> = {
  fr: [
    { key: 'mon', label: 'Lundi',    focus: "post d'ouverture accrocheur qui lance la semaine sur le bon ton" },
    { key: 'tue', label: 'Mardi',    focus: 'contenu éducatif, astuce ou conseil pratique' },
    { key: 'wed', label: 'Mercredi', focus: "post d'engagement avec une question ouverte à la communauté" },
    { key: 'thu', label: 'Jeudi',    focus: 'storytelling ou contenu coulisses/behind-the-scenes' },
    { key: 'fri', label: 'Vendredi', focus: 'bilan de la semaine, succès ou réalisation à célébrer' },
    { key: 'sat', label: 'Samedi',   focus: 'contenu léger et convivial, esprit de weekend' },
    { key: 'sun', label: 'Dimanche', focus: 'réflexion, inspiration ou aperçu de la semaine à venir' },
  ],
  ar: [
    { key: 'mon', label: 'الاثنين',  focus: 'منشور افتتاحي جذاب يطلق الأسبوع بأسلوب إيجابي' },
    { key: 'tue', label: 'الثلاثاء', focus: 'محتوى تعليمي، نصيحة أو إرشاد عملي' },
    { key: 'wed', label: 'الأربعاء', focus: 'منشور تفاعلي مع سؤال مفتوح للمجتمع' },
    { key: 'thu', label: 'الخميس',   focus: 'رواية قصة أو محتوى من وراء الكواليس' },
    { key: 'fri', label: 'الجمعة',   focus: 'ملخص الأسبوع والإنجازات للاحتفاء بها' },
    { key: 'sat', label: 'السبت',    focus: 'محتوى خفيف وودود، أجواء عطلة نهاية الأسبوع' },
    { key: 'sun', label: 'الأحد',    focus: 'تأمل وإلهام أو لمحة عن الأسبوع القادم' },
  ],
  en: [
    { key: 'mon', label: 'Monday',    focus: 'engaging opening post to kick off the week' },
    { key: 'tue', label: 'Tuesday',   focus: 'educational tip or practical how-to' },
    { key: 'wed', label: 'Wednesday', focus: 'engagement post with an open question to the community' },
    { key: 'thu', label: 'Thursday',  focus: 'behind-the-scenes or storytelling content' },
    { key: 'fri', label: 'Friday',    focus: 'weekly highlight or achievement to celebrate' },
    { key: 'sat', label: 'Saturday',  focus: 'lighter, community-focused weekend content' },
    { key: 'sun', label: 'Sunday',    focus: 'reflection, inspiration, or preview of the week ahead' },
  ],
  es: [
    { key: 'mon', label: 'Lunes',     focus: 'publicación de apertura atractiva para empezar la semana con buen pie' },
    { key: 'tue', label: 'Martes',    focus: 'consejo educativo o guía práctica' },
    { key: 'wed', label: 'Miércoles', focus: 'publicación de participación con una pregunta abierta a la comunidad' },
    { key: 'thu', label: 'Jueves',    focus: 'contenido de historia o detrás de cámaras' },
    { key: 'fri', label: 'Viernes',   focus: 'resumen semanal o logro para celebrar' },
    { key: 'sat', label: 'Sábado',    focus: 'contenido ligero y comunitario de fin de semana' },
    { key: 'sun', label: 'Domingo',   focus: 'reflexión, inspiración o vista previa de la semana siguiente' },
  ],
  zh: [
    { key: 'mon', label: '周一', focus: '吸引人的开场帖子，为本周定下积极基调' },
    { key: 'tue', label: '周二', focus: '教育性技巧或实用指南' },
    { key: 'wed', label: '周三', focus: '互动帖子，向社区提出开放性问题' },
    { key: 'thu', label: '周四', focus: '幕后故事或品牌叙事内容' },
    { key: 'fri', label: '周五', focus: '每周亮点或值得庆祝的成就' },
    { key: 'sat', label: '周六', focus: '轻松愉快的周末内容，贴近社区' },
    { key: 'sun', label: '周日', focus: '思考、灵感或下周预告' },
  ],
}

export interface PlannerDay {
  key: string
  label: string
  content: string | null
  error?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'planner'), 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  const body = await req.json()
  const topic    = sanitize(body.topic, 500)
  const tone     = sanitizeShort(body.tone)
  const language = (sanitizeShort(body.language) || 'fr') as OutputLanguage
  const platform = sanitizeShort(body.platform)
  const useBrandVoice = Boolean(body.useBrandVoice)

  if (!topic || !tone || !language || !platform) {
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

  const days = DAYS[language] ?? DAYS.fr

  const results = await Promise.allSettled(
    days.map(day =>
      generateContent({
        type: 'social_media',
        topic: `[${platform}] ${topic}`,
        tone,
        language,
        wordCount: 120,
        brandVoice,
        dayContext: day.focus,
      }).then(content => ({ key: day.key, label: day.label, content } as PlannerDay))
    )
  )

  const week: PlannerDay[] = results.map((r, i) => {
    const day = days[i]
    if (r.status === 'fulfilled') return r.value
    return { key: day.key, label: day.label, content: null, error: 'Generation failed' }
  })

  const toInsert = week
    .filter(d => d.content)
    .map(d => ({
      user_id: user.id,
      content_type: 'social_media',
      topic: `${topic} — ${d.label}`,
      tone,
      language,
      content: d.content!,
      source: 'planner',
      platform,
    }))

  if (toInsert.length > 0) {
    await supabase.from('generations').insert(toInsert)
  }

  return NextResponse.json({ week })
}
