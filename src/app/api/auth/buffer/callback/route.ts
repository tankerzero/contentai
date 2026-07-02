import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://contentai.ca'
const BUFFER_API = 'https://api.buffer.com'

// Buffer service name → ContentAI platform key
const SERVICE_MAP: Record<string, string> = {
  facebook:  'facebook',
  instagram: 'instagram',
  twitter:   'twitter',
  x:         'twitter', // Buffer may return 'x' for Twitter/X
  linkedin:  'linkedin',
  tiktok:    'tiktok',
  pinterest: 'pinterest',
  youtube:   'youtube',
}

const SUPPORTED_PLATFORMS = new Set(Object.values(SERVICE_MAP))

interface BufferChannel {
  id: string
  name: string
  service: string
  // serviceType exists in some Buffer API versions — not required
}

async function bufferGraphQL<T>(
  accessToken: string,
  query: string,
  label: string,
): Promise<T> {
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const rawText = await res.text()

  if (!res.ok) {
    throw new Error(`[buffer/${label}] HTTP ${res.status}: ${rawText}`)
  }

  let json: { data?: T; errors?: Array<{ message: string; extensions?: { code?: string } }> }
  try {
    json = JSON.parse(rawText)
  } catch {
    throw new Error(`[buffer/${label}] Response not JSON (HTTP ${res.status}): ${rawText.slice(0, 500)}`)
  }

  if (json.errors?.length) {
    const msgs = json.errors.map(e => e.message).join('; ')
    // Detect Buffer channel-limit errors specifically
    const isChannelLimit = json.errors.some(e =>
      /channel.?limit|upgrade.*plan|free.*plan.*limit|maximum.*channel/i.test(e.message) ||
      e.extensions?.code === 'CHANNEL_LIMIT_REACHED'
    )
    if (isChannelLimit) {
      throw Object.assign(new Error(msgs), { code: 'BUFFER_CHANNEL_LIMIT' })
    }
    throw new Error(`[buffer/${label}] GraphQL errors: ${msgs}`)
  }

  if (!json.data) {
    throw new Error(`[buffer/${label}] No data in response: ${rawText.slice(0, 500)}`)
  }

  return json.data
}

async function fetchBufferChannels(accessToken: string): Promise<BufferChannel[]> {
  // Step 1: get the organization ID
  const orgQuery = `
    query GetOrganizations {
      account {
        organizations {
          id
        }
      }
    }
  `
  const orgData = await bufferGraphQL<{
    account: { organizations: Array<{ id: string }> }
  }>(accessToken, orgQuery, 'organizations')

  const orgId = orgData.account?.organizations?.[0]?.id
  if (!orgId) {
    throw new Error('[buffer/organizations] No organization found on this Buffer account')
  }

  // Step 2: get all channels for that organization
  const channelsQuery = `
    query GetChannels {
      channels(input: { organizationId: ${JSON.stringify(orgId)} }) {
        id
        name
        service
      }
    }
  `
  const channelsData = await bufferGraphQL<{
    channels: BufferChannel[]
  }>(accessToken, channelsQuery, 'channels')

  return channelsData.channels ?? []
}

export async function GET(req: NextRequest) {
  const clientId     = process.env.BUFFER_CLIENT_ID
  const clientSecret = process.env.BUFFER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP_URL}/social?error=buffer_not_configured`)
  }

  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/social?error=${encodeURIComponent(error)}`)
  }

  const cookieStore = await cookies()
  const storedState  = cookieStore.get('buffer_oauth_state')?.value
  const codeVerifier = cookieStore.get('buffer_code_verifier')?.value
  cookieStore.delete('buffer_oauth_state')
  cookieStore.delete('buffer_code_verifier')

  if (!state || state !== storedState || !code || !codeVerifier) {
    return NextResponse.redirect(`${APP_URL}/social?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://auth.buffer.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:      clientId,
        client_secret:  clientSecret,
        redirect_uri:   'https://contentai.ca/api/auth/buffer/callback',
        code,
        grant_type:     'authorization_code',
        code_verifier:  codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[buffer/callback] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}/social?error=buffer_token_failed`)
    }

    const tokens = await tokenRes.json() as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}/social?error=buffer_no_token`)
    }

    const tokenExpiresAt = new Date(
      Date.now() + (tokens.expires_in ?? 3600) * 1000
    ).toISOString()

    // Fetch all Buffer channels
    let channels: BufferChannel[]
    try {
      channels = await fetchBufferChannels(tokens.access_token)
    } catch (err) {
      const channelErr = err as Error & { code?: string }
      console.error('[buffer/callback] Channel fetch failed:', channelErr.message)
      if (channelErr.code === 'BUFFER_CHANNEL_LIMIT') {
        return NextResponse.redirect(`${APP_URL}/social?error=buffer_channel_limit`)
      }
      return NextResponse.redirect(`${APP_URL}/social?error=buffer_channels_failed`)
    }

    const now = new Date().toISOString()

    // Map Buffer channels to our platform keys, de-duplicate (keep first for each platform)
    const seen = new Set<string>()
    const upsertRows: Array<{
      user_id: string; platform: string; username: string
      access_token: string; refresh_token: string | null
      token_expires_at: string; channel_id: string
      connected_at: string; connected_via: string
    }> = []

    for (const ch of channels) {
      const platform = SERVICE_MAP[ch.service.toLowerCase()]
      if (!platform || !SUPPORTED_PLATFORMS.has(platform) || seen.has(platform)) continue
      seen.add(platform)
      upsertRows.push({
        user_id:          user.id,
        platform,
        username:         ch.name,
        access_token:     tokens.access_token,
        refresh_token:    tokens.refresh_token ?? null,
        token_expires_at: tokenExpiresAt,
        channel_id:       ch.id,
        connected_at:     now,
        connected_via:    'buffer',
      })
    }

    if (upsertRows.length === 0) {
      console.warn('[buffer/callback] No supported platforms found in Buffer account')
      return NextResponse.redirect(`${APP_URL}/social?error=buffer_no_channels`)
    }

    console.log(`[buffer/callback] Upserting ${upsertRows.length} channels for user=${user.id}: ${upsertRows.map(r => r.platform).join(',')}`)

    const savedPlatforms: string[] = []
    for (const row of upsertRows) {
      const { error: upsertErr } = await supabase
        .from('social_connections')
        .upsert(row, { onConflict: 'user_id,platform' })
      if (upsertErr) {
        console.error(`[buffer/callback] Upsert failed for ${row.platform}:`, JSON.stringify(upsertErr))
      } else {
        savedPlatforms.push(row.platform)
      }
    }

    if (savedPlatforms.length === 0) {
      console.error('[buffer/callback] All upserts failed — nothing written to social_connections')
      return NextResponse.redirect(`${APP_URL}/social?error=buffer_save_failed`)
    }

    return NextResponse.redirect(`${APP_URL}/social?connected=${savedPlatforms.join(',')}`)
  } catch (err) {
    console.error('[buffer/callback] Unexpected error:', err)
    return NextResponse.redirect(`${APP_URL}/social?error=unexpected`)
  }
}
