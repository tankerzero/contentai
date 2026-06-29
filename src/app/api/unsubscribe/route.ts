import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

function verifyToken(userId: string, contactId: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
  const expected = createHmac('sha256', secret).update(`${userId}:${contactId}`).digest('hex')
  return expected === token
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') ?? ''
  const contactId = searchParams.get('cid') ?? ''
  const userId = searchParams.get('uid') ?? ''

  if (!token || !contactId || !userId) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  if (!verifyToken(userId, contactId, token)) {
    return new NextResponse('Invalid or expired unsubscribe link.', { status: 400, headers: { 'Content-Type': 'text/html' } })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('email_contacts')
    .update({ subscribed: false })
    .eq('id', contactId)
    .eq('user_id', userId)

  if (error) {
    return new NextResponse('Something went wrong. Please try again.', { status: 500, headers: { 'Content-Type': 'text/html' } })
  }

  return new NextResponse(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title>
<style>body{font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;text-align:center;color:#333}</style>
</head>
<body>
  <h2>✓ You've been unsubscribed</h2>
  <p>You will no longer receive emails from this sender.</p>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } })
}
