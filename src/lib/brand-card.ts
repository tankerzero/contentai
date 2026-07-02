import fs from 'fs'
import path from 'path'
import { ImageResponse } from 'next/og'
import { createElement as h } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// Platforms that can use a static image card (not video-only)
export const CARD_PLATFORMS = new Set(['instagram', 'facebook', 'pinterest'])

// Font cache to avoid re-reading from disk on every call
const fontCache: Record<string, Buffer> = {}

function loadFont(filename: string): Buffer {
  if (!fontCache[filename]) {
    fontCache[filename] = fs.readFileSync(
      path.join(process.cwd(), 'public', 'fonts', filename)
    )
  }
  return fontCache[filename]
}

function truncate(text: string, maxLen: number): string {
  const stripped = text.replace(/[#@]\S+/g, '').replace(/\s+/g, ' ').trim()
  if (stripped.length <= maxLen) return stripped
  return stripped.slice(0, maxLen - 1) + '…'
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

interface FontOption {
  name: string
  data: Buffer | ArrayBuffer
  weight: FontWeight
  style: 'normal' | 'italic'
}

function buildFonts(language: string): FontOption[] {
  const inter: FontOption = {
    name: 'Inter',
    data: loadFont('Inter-Bold.ttf'),
    weight: 700,
    style: 'normal',
  }
  if (language === 'ar') {
    return [
      inter,
      {
        name: 'NotoArabic',
        data: loadFont('NotoSansArabic-Bold.ttf'),
        weight: 700,
        style: 'normal',
      },
    ]
  }
  if (language === 'zh') {
    try {
      return [
        inter,
        {
          name: 'NotoSC',
          data: loadFont('NotoSansSC-Bold.otf'),
          weight: 700,
          style: 'normal',
        },
      ]
    } catch {
      return [inter]
    }
  }
  return [inter]
}

export async function generateBrandCardBuffer(
  content: string,
  language: string
): Promise<Buffer> {
  const isRTL = language === 'ar'
  const displayText = truncate(content, 220)
  const fontSize = displayText.length > 120 ? 42 : displayText.length > 80 ? 50 : 60

  const fontFamily = language === 'ar'
    ? "'NotoArabic', 'Inter', sans-serif"
    : language === 'zh'
      ? "'NotoSC', 'Inter', sans-serif"
      : "'Inter', sans-serif"

  const fonts = buildFonts(language)

  const element = h(
    'div',
    {
      style: {
        width: 1080,
        height: 1080,
        display: 'flex',
        flexDirection: 'column' as const,
        background: 'linear-gradient(145deg, #012f38 0%, #014a57 40%, #026676 100%)',
        padding: '72px 80px',
        fontFamily,
        direction: isRTL ? 'rtl' : 'ltr',
      },
    },
    // Gold accent bar
    h('div', {
      style: {
        width: 72,
        height: 4,
        background: '#C9A84C',
        borderRadius: 2,
        marginBottom: 52,
        // Center for Arabic (since text is centered), left-align for LTR
        alignSelf: isRTL ? 'center' : 'flex-start',
      },
    }),
    // Opening quote mark
    h('div', {
      style: {
        fontSize: 96,
        color: 'rgba(201,168,76,0.3)',
        lineHeight: 0.8,
        marginBottom: 16,
        fontFamily: 'Inter, sans-serif',
        alignSelf: isRTL ? 'center' : 'flex-start',
      },
    }, '«'),
    // Main text — use explicit width so RTL textAlign:'right' has room to anchor
    h('div', {
      style: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        width: 920,  // 1080 - 2*80 padding
      },
    },
      h('p', {
        style: {
          fontSize,
          color: '#ffffff',
          lineHeight: 1.55,
          // Arabic: center looks better than left-aligned since Satori RTL
          // text-align support is limited; center works for all languages.
          textAlign: isRTL ? 'center' : 'left',
          direction: isRTL ? 'rtl' : 'ltr',
          margin: 0,
          fontWeight: 700,
          letterSpacing: isRTL ? 0 : '-0.015em',
          wordSpacing: isRTL ? '-2px' : 'normal',
          width: 920,
        },
      }, displayText)
    ),
    // Footer
    h('div', {
      style: {
        display: 'flex',
        justifyContent: isRTL ? 'flex-end' : 'space-between',
        alignItems: 'center',
        marginTop: 40,
        flexDirection: isRTL ? 'row-reverse' as const : 'row' as const,
      },
    },
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexDirection: 'row' as const,
        },
      },
        h('span', { style: { color: '#C9A84C', fontSize: 28, fontWeight: 700, fontFamily: 'Inter, sans-serif' } }, '◆'),
        h('span', { style: { color: '#C9A84C', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' } }, 'ContentAI')
      ),
      !isRTL && h('span', {
        style: { color: 'rgba(255,255,255,0.35)', fontSize: 16, fontFamily: 'Inter, sans-serif' },
      }, 'contentai.ca')
    )
  )

  const imageResponse = new ImageResponse(element as React.ReactElement, {
    width: 1080,
    height: 1080,
    fonts,
  })

  const arrayBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function uploadCardToStorage(
  supabase: SupabaseClient,
  buffer: Buffer,
  folder = 'generated'
): Promise<string> {
  const fileName = `${folder}/${crypto.randomUUID()}.png`

  // Create bucket if it doesn't exist (safe to call even if it does)
  await supabase.storage
    .createBucket('post-assets', { public: true })
    .catch(() => {})

  const { error } = await supabase.storage
    .from('post-assets')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      cacheControl: '86400',
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('post-assets')
    .getPublicUrl(fileName)

  return publicUrl
}
