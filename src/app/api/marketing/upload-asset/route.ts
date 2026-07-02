import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'

export const runtime = 'nodejs'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024  // 50 MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service-role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST: upload a customer media file
// Body: multipart/form-data with field "file"
// Returns: { url, asset_type }
export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(rateLimitKey(user.id, 'upload-asset'), 10)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  const mimeType = file.type
  const isImage = ALLOWED_IMAGE_TYPES.has(mimeType)
  const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType)

  if (!isImage && !isVideo) {
    return NextResponse.json({
      error: 'Unsupported file type. Allowed: JPG, PNG, WebP (images) or MP4, MOV (video)',
    }, { status: 400 })
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    const maxMB = maxBytes / 1024 / 1024
    return NextResponse.json({
      error: `File too large. Maximum size: ${maxMB} MB for ${isVideo ? 'video' : 'images'}`,
    }, { status: 400 })
  }

  const ext = EXT_MAP[mimeType] ?? 'bin'
  const fileName = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const svc = getServiceClient()

    // Create bucket if needed (safe to call repeatedly)
    await svc.storage.createBucket('post-assets', { public: true }).catch(() => {})

    const { error: uploadError } = await svc.storage
      .from('post-assets')
      .upload(fileName, buffer, {
        contentType: mimeType,
        cacheControl: '86400',
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = svc.storage
      .from('post-assets')
      .getPublicUrl(fileName)

    const asset_type = isVideo ? 'video' : 'image'
    return NextResponse.json({ url: publicUrl, asset_type })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
