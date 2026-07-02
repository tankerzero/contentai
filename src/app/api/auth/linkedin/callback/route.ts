import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'

export async function GET(req: NextRequest) {
  const clientId     = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP_URL}/social?error=linkedin_not_configured`)
  }

  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/social?error=${encodeURIComponent(error)}`)
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('linkedin_oauth_state')?.value
  cookieStore.delete('linkedin_oauth_state')

  if (!state || state !== storedState || !code) {
    return NextResponse.redirect(`${APP_URL}/social?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[linkedin/callback] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}/social?error=linkedin_token_failed`)
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      expires_in?: number
      refresh_token?: string
    }

    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}/social?error=linkedin_no_token`)
    }

    // Fetch profile for display name and URN
    const profileRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json() as {
      id: string
      localizedFirstName?: string
      localizedLastName?: string
    }

    if (!profile.id) {
      return NextResponse.redirect(`${APP_URL}/social?error=linkedin_profile_failed`)
    }

    const displayName = [profile.localizedFirstName, profile.localizedLastName]
      .filter(Boolean).join(' ') || 'LinkedIn User'
    // channel_id stores the LinkedIn URN needed for posting via UGC Posts API
    const personUrn = `urn:li:person:${profile.id}`

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('social_connections').upsert({
      user_id: user.id,
      platform: 'linkedin',
      username: displayName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      channel_id: personUrn,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${APP_URL}/social?connected=linkedin`)
  } catch (err) {
    console.error('[linkedin/callback] Unexpected error:', err)
    return NextResponse.redirect(`${APP_URL}/social?error=unexpected`)
  }
}
