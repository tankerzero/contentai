import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

function page(title: string, icon: string, heading: string, body: string, ctaHref: string, ctaLabel: string) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — ContentAI</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}
  .card{background:#fff;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,.10);padding:48px 40px;max-width:460px;width:100%;text-align:center}
  .icon{font-size:52px;margin-bottom:20px}
  h1{font-size:24px;font-weight:700;color:#111827;margin-bottom:12px}
  p{font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:28px}
  a.btn{display:inline-block;background:#0D7377;color:#fff;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;text-decoration:none}
  a.btn:hover{background:#0a5d61}
  .brand{margin-top:28px;font-size:13px;color:#d1d5db}
</style>
</head>
<body>
<div class="card">
  <div class="icon">${icon}</div>
  <h1>${heading}</h1>
  <p>${body}</p>
  <a class="btn" href="${ctaHref}">${ctaLabel}</a>
  <div class="brand">✦ ContentAI</div>
</div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return page('Invalid link', '⚠️', 'Invalid link', 'No approval token was provided.', APP_URL, 'Go to ContentAI')
  }

  let supabase: ReturnType<typeof getServiceClient>
  try {
    supabase = getServiceClient()
  } catch {
    return page('Error', '❌', 'Configuration error', 'The server is not configured correctly. Please contact support.', APP_URL, 'Go to ContentAI')
  }

  const { data: post, error } = await supabase
    .from('marketing_posts')
    .select('id, approval_status')
    .eq('approval_token', token)
    .single()

  if (error || !post) {
    return page('Not found', '🔍', 'Post not found', 'This link is invalid or has expired.', APP_URL, 'Go to ContentAI')
  }

  if (post.approval_status === 'skipped') {
    return page('Already skipped', '⏭', 'Already skipped', 'This post has already been skipped.', APP_URL, 'Go to ContentAI')
  }

  if (post.approval_status === 'approved') {
    return page('Already approved', '✅', 'Already approved', 'This post was already approved. To skip it, contact support.', APP_URL, 'Go to ContentAI')
  }

  const { error: updateErr } = await supabase
    .from('marketing_posts')
    .update({ approval_status: 'skipped' })
    .eq('id', post.id)

  if (updateErr) {
    return page('Error', '❌', 'Could not skip', `Database error: ${updateErr.message}`, APP_URL, 'Go to ContentAI')
  }

  return page(
    'Post skipped',
    '⏭',
    'Post skipped',
    'This post has been removed from the publishing queue.',
    APP_URL,
    'Go to ContentAI'
  )
}
