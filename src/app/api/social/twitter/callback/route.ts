import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(`${APP_URL}/social?error=not_configured`)
  }

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/social?error=${encodeURIComponent(error)}`)
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('twitter_oauth_state')?.value
  const codeVerifier = cookieStore.get('twitter_code_verifier')?.value

  cookieStore.delete('twitter_oauth_state')
  cookieStore.delete('twitter_code_verifier')

  if (!state || state !== storedState || !code || !codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/social?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/api/social/twitter/callback`,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${APP_URL}/social?error=token_exchange_failed`)
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in?: number
    }

    // Fetch Twitter user info
    const meRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const { data: twitterUser } = await meRes.json() as {
      data: { id: string; name: string; username: string; profile_image_url?: string }
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    await supabase.from('social_connections').upsert({
      user_id: user.id,
      platform: 'twitter',
      username: twitterUser.username,
      avatar_url: twitterUser.profile_image_url ?? null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${APP_URL}/social?connected=twitter`)
  } catch {
    return NextResponse.redirect(`${APP_URL}/social?error=unexpected`)
  }
}
