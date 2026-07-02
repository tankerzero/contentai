import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize, sanitizeShort } from '@/lib/sanitize'
import Anthropic from '@anthropic-ai/sdk'
import { generateBrandCardBuffer, uploadCardToStorage, CARD_PLATFORMS } from '@/lib/brand-card'

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error(
    'Missing ANTHROPIC_API_KEY. Add it in Vercel → Project Settings → Environment Variables.'
  )
  return new Anthropic({ apiKey })
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish', zh: 'Chinese (Simplified)',
}

const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'marketing'), 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json()
  const topic      = sanitize(body.topic, 500)
  const language   = sanitizeShort(body.language) || 'en'
  const tone       = sanitizeShort(body.tone) || 'professional'
  const assetUrl   = sanitize(body.asset_url ?? '', 2000) || null
  const assetType  = sanitizeShort(body.asset_type ?? '') || null

  if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })

  const langLabel = LANG_LABELS[language] ?? 'English'
  const svc = getServiceClient()

  const results = await Promise.allSettled(
    PLATFORMS.map(async platform => {
      const msg = await getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a promotional ${platform} post in ${langLabel} about: ${topic}. Tone: ${tone}. Platform-optimized. Include relevant emojis and hashtags. Maximum ${platform === 'Twitter' ? '280' : '500'} characters.`,
        }],
      })

      const content = (msg.content[0] as { type: string; text: string }).text.trim()
      const platformKey = platform.toLowerCase()

      // Determine asset for this post:
      // 1. Customer-uploaded asset takes priority for all platforms
      // 2. For image-capable platforms with no upload, auto-generate a branded card
      let postAssetUrl: string | null = assetUrl
      let postAssetType: string | null = assetType

      if (!postAssetUrl && CARD_PLATFORMS.has(platformKey)) {
        try {
          const cardBuffer = await generateBrandCardBuffer(content, language)
          postAssetUrl = await uploadCardToStorage(svc, cardBuffer, `users/${user.id}`)
          postAssetType = 'image'
        } catch (err) {
          console.error(`[marketing] Card generation failed for ${platformKey}:`, err)
          // Continue without asset — publish will skip if platform requires it
        }
      }

      const { data: saved } = await supabase
        .from('marketing_posts')
        .insert({
          user_id: user.id,
          content,
          platform: platformKey,
          language,
          status: 'draft',
          asset_url: postAssetUrl,
          asset_type: postAssetType,
        })
        .select('id')
        .single()

      return {
        platform: platformKey,
        content,
        id: saved?.id,
        asset_url: postAssetUrl,
        asset_type: postAssetType,
      }
    })
  )

  const posts = results
    .filter((r): r is PromiseFulfilledResult<{
      platform: string; content: string; id: string
      asset_url: string | null; asset_type: string | null
    }> => r.status === 'fulfilled')
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
    .select('id, content, platform, language, status, asset_url, asset_type, auto_posted, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ posts: posts ?? [] })
}
