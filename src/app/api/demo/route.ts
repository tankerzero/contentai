import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/anthropic'
import type { ContentType, OutputLanguage } from '@/lib/anthropic'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize } from '@/lib/sanitize'

const VALID_TYPES: ContentType[] = ['social_media', 'blog_post', 'ad_copy']
const VALID_LANGS: OutputLanguage[] = ['en', 'fr', 'ar', 'es', 'zh']

export async function POST(req: NextRequest) {
  // IP-based rate limit: 10 requests / hour (localStorage limits to 3, this is a server-side backstop)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = checkRateLimit(rateLimitKey(ip, 'demo'), 10, 3_600_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const topic = sanitize(String(body.topic ?? ''), 300)
  if (!topic.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 })

  const type: ContentType = VALID_TYPES.includes(body.type as ContentType)
    ? (body.type as ContentType)
    : 'social_media'

  const language: OutputLanguage = VALID_LANGS.includes(body.language as OutputLanguage)
    ? (body.language as OutputLanguage)
    : 'en'

  try {
    const content = await generateContent({ type, topic, tone: 'professional', language, wordCount: 150 })
    return NextResponse.json({ content })
  } catch (err) {
    console.error('[demo] generation error:', err)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
