import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'
import { sanitize } from '@/lib/sanitize'

const SUPPORT_EMAIL = 'support@contentai.ca'

const SYSTEM_PROMPT = `You are a friendly and knowledgeable customer support assistant for ContentAI — an AI-powered content generation SaaS.

## About ContentAI
ContentAI helps businesses generate high-quality content using AI. Key features:
- Generate blog posts, social media posts, emails, product descriptions, and ad copy
- 5 languages: English, French, Arabic, Spanish, Chinese (Simplified)
- Brand Voice: Save your brand tone and style for consistent content
- Weekly Planner: Generate 7 days of social posts in one click
- Content history, favorites, CSV export
- Email campaign manager

## Plans
- **Free**: 5 generations/month — no credit card required
- **Basic** ($9 CAD/mo): 30 generations/month, brand voice, priority generation
- **Pro** ($29 CAD/mo): 100 generations/month, weekly planner, CSV export
- **Agency** ($79 CAD/mo): 500 generations/month, unlimited brand profiles, 10 client workspaces

## Common Questions
- Generations reset at the start of each calendar month
- Payments are processed securely via Stripe; cancel anytime from the Billing page
- Password reset: use the "Forgot password?" link on the login page
- Content is saved automatically to History after generation
- Brand Voice requires Basic plan or higher
- CSV export requires Pro plan or higher
- Email campaigns require Basic plan or higher

## Support Guidelines
- Keep responses concise, helpful, and friendly
- Always respond in the same language as the user's message
- For billing issues or account problems, suggest contacting support at support@contentai.ca
- If you cannot solve the issue, acknowledge it and offer to connect them with a human agent`

const ESCALATION_KEYWORDS = [
  'human', 'agent', 'person', 'real person', 'operator', 'urgent', 'emergency',
  'refund', 'cancel subscription', 'account blocked', 'account suspended',
  'agent humain', 'personne réelle', 'remboursement', 'annuler abonnement',
  'وكيل', 'إنسان', 'استرداد', 'إلغاء الاشتراك', 'عاجل',
  'humano', 'agente', 'reembolso', 'cancelar suscripción', 'urgente',
  '人工', '客服人员', '退款', '取消订阅', '紧急',
]

function needsEscalation(message: string): boolean {
  const lower = message.toLowerCase()
  return ESCALATION_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'support'), 30, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })

  const body = await req.json()
  console.log('[support] route called, user:', user.id, '| message preview:', String(body.message ?? '').slice(0, 80))

  const message = sanitize(body.message ?? '', 1000)
  const rawHistory = Array.isArray(body.history) ? body.history.slice(-12) : []

  if (!message.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Check for escalation keywords
  if (needsEscalation(message)) {
    console.log('[support] escalation triggered for:', user.email ?? user.id)
    console.log('[support] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)

    if (process.env.RESEND_API_KEY) {
      try {
        const { data: profileData } = await supabase
          .from('profiles').select('plan').eq('id', user.id).single()
        const userPlan = profileData?.plan ?? 'free'
        const userEmail = user.email ?? user.id

        const resendClient = new Resend(process.env.RESEND_API_KEY)
        console.log('[support] sending escalation email to:', SUPPORT_EMAIL, '| replyTo:', userEmail)
        const emailOpts = {
          from: 'ContentAI Support <support@contentai.ca>',
          to: [SUPPORT_EMAIL],
          replyTo: userEmail,
          subject: `[ContentAI Support] New escalation from ${userEmail}`,
          html: `
            <h2>New Support Escalation</h2>
            <table style="border-collapse:collapse;margin-bottom:16px">
              <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:bold">User:</td><td>${userEmail}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:bold">Plan:</td><td>${userPlan}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666;font-weight:bold">Question:</td><td>${message}</td></tr>
            </table>
            <p style="color:#888;font-size:13px">Reply directly to this email to respond to the user.</p>
            <hr/>
            <h3>Chat History</h3>
            <pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px">${
              rawHistory.map((m: { role: string; content: string }) =>
                `[${m.role.toUpperCase()}]: ${m.content}`
              ).join('\n\n')
            }</pre>
          `,
        }
        let { data: emailResult, error: emailError } = await resendClient.emails.send(emailOpts)
        if (emailError) {
          console.warn('[support] Primary sender failed, retrying with fallback:', emailError.message)
          ;({ data: emailResult, error: emailError } = await resendClient.emails.send({
            ...emailOpts,
            from: 'ContentAI <onboarding@resend.dev>',
          }))
        }
        if (emailError) {
          console.error('[support] Resend error:', JSON.stringify(emailError))
        } else {
          console.log('[support] Resend response:', JSON.stringify(emailResult))
        }
      } catch (err) {
        console.error('[support] Escalation email exception:', JSON.stringify(err, Object.getOwnPropertyNames(err as object)))
      }
    } else {
      console.warn('[support] RESEND_API_KEY not set — escalation email skipped')
    }

    return NextResponse.json({
      reply: "I've notified a human agent who will reach out to you at your email address shortly. Is there anything else I can help with in the meantime?",
      escalated: true,
    })
  }

  // Call Claude claude-haiku-4-5-20251001
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const messages: Anthropic.MessageParam[] = [
      ...rawHistory.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    })

    const reply = response.content[0]?.type === 'text'
      ? response.content[0].text
      : "I'm sorry, I couldn't generate a response. Please try again."

    return NextResponse.json({ reply, escalated: false })
  } catch (err) {
    console.error('[support] Claude error:', err)
    return NextResponse.json({ error: 'Support service temporarily unavailable.' }, { status: 500 })
  }
}
