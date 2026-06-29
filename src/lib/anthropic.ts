import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { ContentType, OutputLanguage, BrandVoice } from './content-types'

export type { ContentType, OutputLanguage, BrandVoice } from './content-types'

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error(
    'Missing ANTHROPIC_API_KEY. Add it in Vercel → Project Settings → Environment Variables.'
  )
  return new Anthropic({ apiKey })
}

export interface GenerateContentParams {
  type: ContentType
  topic: string
  tone: string
  language?: OutputLanguage
  keywords?: string
  wordCount?: number
  brandVoice?: BrandVoice
  dayContext?: string
}

const systemPrompts: Record<ContentType, string> = {
  blog_post:
    'You are an expert blog writer. Write engaging, SEO-optimised blog posts with clear structure, headings, and compelling content.',
  social_media:
    'You are a social media expert. Write punchy, engaging posts optimised for virality. Include relevant hashtags.',
  email:
    'You are an email marketing specialist. Write persuasive emails with strong subject lines and clear calls to action.',
  product_description:
    'You are a conversion copywriter. Write compelling product descriptions that highlight benefits and drive purchases.',
  ad_copy:
    'You are an advertising expert. Write concise, impactful ad copy that grabs attention and converts.',
}

const languageInstructions: Record<OutputLanguage, string> = {
  en: 'Write the content in English.',
  fr: 'Rédigez le contenu entièrement en français, avec un style naturel et fluide.',
  ar: 'اكتب المحتوى باللغة العربية الفصحى المعاصرة (Modern Standard Arabic). يجب أن يكون النص من اليمين إلى اليسار ومُنسّقاً بشكل صحيح.',
}

function buildBrandSection(bv: BrandVoice): string {
  const lines: string[] = ['', '--- Brand voice to apply ---']
  if (bv.companyName) lines.push(`Company: ${bv.companyName}`)
  if (bv.industry)     lines.push(`Industry: ${bv.industry}`)
  if (bv.values)       lines.push(`Values: ${bv.values}`)
  if (bv.writingStyle) lines.push(`Writing style: ${bv.writingStyle}`)
  if (bv.toneExamples) lines.push(`Tone examples:\n${bv.toneExamples}`)
  lines.push('Apply this brand voice consistently throughout the content.')
  return lines.join('\n')
}

export async function generateContent(params: GenerateContentParams): Promise<string> {
  const { type, topic, tone, language = 'en', keywords, wordCount = 300, brandVoice, dayContext } = params

  const brandSection = brandVoice ? buildBrandSection(brandVoice) : ''
  const daySection = dayContext ? `\nContent focus for this day: ${dayContext}` : ''
  const typeName = type.replace('_', ' ')

  const userPrompt = `Write a ${typeName} about: ${topic}

Tone: ${tone}
${keywords ? `Keywords to include: ${keywords}` : ''}
Target length: approximately ${wordCount} words
Language: ${languageInstructions[language]}${daySection}${brandSection}

Produce only the content itself, no meta-commentary.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompts[type],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}
