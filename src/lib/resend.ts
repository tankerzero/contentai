import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'ContentAI <support@contentai.ca>'
const FROM_FALLBACK = 'ContentAI <onboarding@resend.dev>'

/** Send via primary FROM; retry with Resend sandbox domain on failure. */
export async function sendEmail(opts: Parameters<typeof resend.emails.send>[0]) {
  const primary = await resend.emails.send(opts)
  if (primary.error) {
    console.warn('[resend] Primary sender failed, retrying with fallback:', primary.error.message)
    return resend.emails.send({ ...opts, from: FROM_FALLBACK })
  }
  return primary
}
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface EmailUser {
  email: string
  name?: string
}

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
<tr><td style="background:linear-gradient(135deg,#0D7377,#0a5d61);padding:28px 40px">
<span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px">✦ ContentAI</span></td></tr>
<tr><td style="padding:36px 40px 28px">${body}</td></tr>
<tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f0f0f0">
<p style="margin:0;font-size:12px;color:#9ca3af">ContentAI · ${APP_URL}<br>
<a href="${APP_URL}/unsubscribe" style="color:#9ca3af">Unsubscribe</a> ·
<a href="${APP_URL}/privacy" style="color:#9ca3af">Privacy</a></p></td></tr>
</table></td></tr></table></body></html>`
}

const btn = (href: string, text: string) =>
  `<a href="${href}" style="display:inline-block;background:#0D7377;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:20px">${text}</a>`

const h1 = (t: string) =>
  `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827">${t}</h1>`

const p = (t: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151">${t}</p>`

// ── Email templates ───────────────────────────────────────────────────────────

export function welcomeEmail(user: EmailUser) {
  const name = user.name ?? 'there'
  const html = base('Welcome to ContentAI!', `
    ${h1(`Welcome to ContentAI, ${name}! 🎉`)}
    ${p('You\'re all set to generate professional content in English, French, and Arabic — powered by Claude AI.')}
    ${p('Here\'s what you can do right now:')}
    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
      <li>Generate your first blog post, social caption, or email</li>
      <li>Try the Arabic RTL content generation</li>
      <li>Set up your brand voice for consistent content</li>
      <li>Plan an entire week of content with the Planner</li>
    </ul>
    ${btn(`${APP_URL}/generate`, 'Start generating →')}
  `)
  return { from: FROM, to: user.email, subject: 'Welcome to ContentAI — let\'s create something great', html }
}

export function tipsEmail(user: EmailUser) {
  const html = base('ContentAI Tips & Tricks', `
    ${h1('3 tips to get the most out of ContentAI')}
    ${p('You\'ve been with us for 3 days — here are pro tips to level up your content:')}
    <ol style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
      <li><strong>Set up Brand Voice</strong> — configure your tone once, apply it everywhere</li>
      <li><strong>Use Templates</strong> — start from Ramadan, Product Launch, and more</li>
      <li><strong>Try the Planner</strong> — generate 7 posts for an entire week in one click</li>
    </ol>
    ${btn(`${APP_URL}/brand`, 'Set up my brand voice →')}
  `)
  return { from: FROM, to: user.email, subject: '3 ContentAI tips you might have missed', html }
}

export function upgradeNudgeEmail(user: EmailUser) {
  const html = base('Upgrade your ContentAI plan', `
    ${h1('You\'re running low on generations')}
    ${p('Your free plan includes 5 generations per month. Upgrade to unlock:')}
    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
      <li><strong>Basic ($9/mo)</strong> — 30 generations + brand voice</li>
      <li><strong>Pro ($29/mo)</strong> — 100 generations + planner + CSV export</li>
      <li><strong>Agency ($79/mo)</strong> — 500 generations + unlimited brand profiles</li>
    </ul>
    ${btn(`${APP_URL}/billing`, 'See plans →')}
  `)
  return { from: FROM, to: user.email, subject: 'Unlock unlimited content generation', html }
}

export function reengagementEmail(user: EmailUser) {
  const html = base('We miss you at ContentAI', `
    ${h1('It\'s been a while — come back and create!')}
    ${p('You haven\'t generated any content in 30 days. Your audience is waiting.')}
    ${p('New features since your last visit:')}
    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:1.8">
      <li>Weekly Content Planner (7 posts in one click)</li>
      <li>Brand Voice profiles with tone injection</li>
      <li>Arabic RTL content generation</li>
      <li>Content calendar & analytics</li>
    </ul>
    ${btn(`${APP_URL}/generate`, 'Create content now →')}
  `)
  return { from: FROM, to: user.email, subject: 'Your audience misses your content', html }
}

export type EmailStep = 0 | 3 | 7 | 30

export function getEmailTemplate(step: EmailStep, user: EmailUser) {
  switch (step) {
    case 0:  return welcomeEmail(user)
    case 3:  return tipsEmail(user)
    case 7:  return upgradeNudgeEmail(user)
    case 30: return reengagementEmail(user)
  }
}
