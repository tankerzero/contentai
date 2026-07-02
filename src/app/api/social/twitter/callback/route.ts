import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const TWITTER_CLIENT_ID     = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const APP_URL               = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'
const TWITTER_REDIRECT_URI  = 'https://contentai.ca/api/social/twitter/callback'

export async function GET(req: NextRequest) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(`${APP_URL}/social?error=twitter_not_configured`)
  }

  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/social?error=${encodeURIComponent(error)}`)
  }

  const cookieStore = await cookies()
  const storedState   = cookieStore.get('twitter_oauth_state')?.value
  const codeVerifier  = cookieStore.get('twitter_code_verifier')?.value
  cookieStore.delete('twitter_oauth_state')
  cookieStore.delete('twitter_code_verifier')

  if (!state || state !== storedState || !code || !codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/social?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  try {
    // Exchange code for tokens — confidential client requires HTTP Basic auth
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        Authorization:   `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[twitter/callback] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}/social?error=token_exchange_failed`)
    }

    const tokens = await tokenRes.json() as {
      access_token:   string
      refresh_token?: string
      expires_in?:    number
    }

    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}/social?error=token_exchange_failed`)
    }

    // Fetch Twitter user info
    const meRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!meRes.ok) {
      console.error('[twitter/callback] User fetch failed:', await meRes.text())
      return NextResponse.redirect(`${APP_URL}/social?error=token_exchange_failed`)
    }

    const { data: twitterUser } = await meRes.json() as {
      data: { id: string; name: string; username: string; profile_image_url?: string }
    }

    if (!twitterUser?.id) {
      console.error('[twitter/callback] User response missing id field')
      return NextResponse.redirect(`${APP_URL}/social?error=token_exchange_failed`)
    }

    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : new Date(Date.now() + 7200 * 1000).toISOString()

    const { error: upsertErr } = await supabase.from('social_connections').upsert({
      user_id:          user.id,
      platform:         'twitter',
      username:         twitterUser.username,
      avatar_url:       twitterUser.profile_image_url ?? null,
      access_token:     tokens.access_token,
      refresh_token:    tokens.refresh_token ?? null,
      token_expires_at: tokenExpiresAt,
      channel_id:       twitterUser.id,
      connected_at:     new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    if (upsertErr) {
      console.error('[twitter/callback] Upsert error:', JSON.stringify(upsertErr))
      return NextResponse.redirect(`${APP_URL}/social?error=twitter_save_failed`)
    }

    return NextResponse.redirect(`${APP_URL}/social?connected=twitter`)
  } catch (err) {
    console.error('[twitter/callback] Unexpected error:', err)
    return NextResponse.redirect(`${APP_URL}/social?error=unexpected`)
  }
}
