import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

export async function GET() {
  const clientId = process.env.BUFFER_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${APP_URL}/social?error=buffer_not_configured`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  // PKCE
  const codeVerifier  = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  const state         = crypto.randomBytes(16).toString('hex')

  const cookieStore = await cookies()
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
  }
  cookieStore.set('buffer_oauth_state',    state,         cookieOpts)
  cookieStore.set('buffer_code_verifier',  codeVerifier,  cookieOpts)

  const params = new URLSearchParams({
    client_id:              clientId,
    redirect_uri:           'https://contentai.ca/api/auth/buffer/callback',
    response_type:          'code',
    scope:                  'posts:write posts:read ideas:read ideas:write account:read account:write offline_access',
    state,
    code_challenge:         codeChallenge,
    code_challenge_method:  'S256',
  })

  return NextResponse.redirect(
    `https://auth.buffer.com/auth?${params.toString()}`
  )
}
