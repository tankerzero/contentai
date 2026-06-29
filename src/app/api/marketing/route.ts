import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'marketing'), 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const topic    = sanitize(body.topic, 500)
  const language = (sanitizeShort(body.language) || 'en') as 'en' | 'fr' | 'ar'
  const tone     = sanitizeShort(body.tone) || 'professional'

  if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })

  const langLabel = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English'

  const results = await Promise.allSettled(
    PLATFORMS.map(async platform => {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a promotional ${platform} post in ${langLabel} about: ${topic}. Tone: ${tone}. Platform-optimized. Include relevant emojis and hashtags. Maximum ${platform === 'Twitter' ? '280' : '500'} characters.`,
        }],
      })

      const content = (msg.content[0] as { type: string; text: string }).text.trim()

      const { data: saved } = await supabase
        .from('marketing_posts')
        .insert({
          user_id: user.id,
          content,
          platform: platform.toLowerCase(),
          language,
          status: 'draft',
        })
        .select('id')
        .single()

      return { platform: platform.toLowerCase(), content, id: saved?.id }
    })
  )

  const posts = results
    .filter((r): r is PromiseFulfilledResult<{ platform: string; content: string; id: string }> => r.status === 'fulfilled')
    .map(r => r.value)

  return NextResponse.json({ posts })
}

// GET: list marketing posts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'marketing'), 20)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { data: posts } = await supabase
    .from('marketing_posts')
    .select('id, content, platform, language, status, auto_posted, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ posts: posts ?? [] })
}
