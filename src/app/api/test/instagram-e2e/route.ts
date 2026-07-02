// TEMPORARY TEST ENDPOINT — DELETE AFTER E2E TESTING
// Gated by X-Test-Secret header matching CONTENTAI_OWNER_USER_ID env var.
// Supports: ?test=a (en brand card), ?test=b (customer upload sim), ?test=c (arabic RTL card)
// Does NOT publish to Buffer — returns image URLs only for verification before posting.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateBrandCardBuffer, uploadCardToStorage } from '@/lib/brand-card'

export const runtime = 'nodejs'

const OWNER_UID = '08d9a043-21b9-4981-a6f3-5cc2ac448e9f'

function getSvc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

function checkSecret(req: NextRequest): boolean {
  const ownerUid = process.env.CONTENTAI_OWNER_USER_ID
  if (!ownerUid) return false
  return req.headers.get('x-test-secret') === ownerUid
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const test = req.nextUrl.searchParams.get('test')
  const svc = getSvc()

  try {
    if (test === 'a') {
      // TEST A: Auto-generated English brand card (Tier 2 flow, no customer upload)
      const content = "Testing ContentAI's Instagram auto-posting — please ignore this post. ✦"
      const cardBuffer = await generateBrandCardBuffer(content, 'en')
      const imageUrl = await uploadCardToStorage(svc, cardBuffer, `test/${OWNER_UID}/en`)
      return NextResponse.json({
        test: 'A',
        ok: true,
        imageUrl,
        tier: 'Tier 2 — auto-generated brand card',
        language: 'en',
        contentUsed: content,
        storagePath: imageUrl.split('/post-assets/')[1] ?? imageUrl,
      })
    }

    if (test === 'b') {
      // TEST B: Simulate customer upload (Tier 1 flow)
      // Download a real photo and upload to the uploads/ path (as the upload-asset endpoint would)
      const photoRes = await fetch('https://via.placeholder.com/1080x1080/026676/C9A84C.png?text=ContentAI+TEST+B')
      if (!photoRes.ok) throw new Error(`Failed to download test image: HTTP ${photoRes.status}`)
      const photoBuf = Buffer.from(await photoRes.arrayBuffer())

      const fileName = `uploads/${OWNER_UID}/test-upload-${crypto.randomUUID()}.png`
      await svc.storage.createBucket('post-assets', { public: true }).catch(() => {})
      const { error: upErr } = await svc.storage.from('post-assets').upload(
        fileName, photoBuf, { contentType: 'image/png', cacheControl: '86400' }
      )
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`)

      const { data: { publicUrl } } = svc.storage.from('post-assets').getPublicUrl(fileName)
      return NextResponse.json({
        test: 'B',
        ok: true,
        imageUrl: publicUrl,
        tier: 'Tier 1 — simulated customer upload (NOT auto-generated)',
        storagePath: fileName,
        note: 'Uploaded to uploads/ path, not generated/ or users/ — confirms Tier 1 path',
      })
    }

    if (test === 'c') {
      // TEST C: Auto-generated Arabic RTL brand card (Tier 2, no publish)
      const content = "اختبار نشر ContentAI التلقائي على إنستغرام — يرجى تجاهل هذه المشاركة. ✦ المحتوى الذكي"
      const cardBuffer = await generateBrandCardBuffer(content, 'ar')
      const imageUrl = await uploadCardToStorage(svc, cardBuffer, `test/${OWNER_UID}/ar`)
      return NextResponse.json({
        test: 'C',
        ok: true,
        imageUrl,
        tier: 'Tier 2 — auto-generated Arabic RTL brand card',
        language: 'ar',
        contentUsed: content,
        storagePath: imageUrl.split('/post-assets/')[1] ?? imageUrl,
        note: 'View imageUrl to verify Arabic letters render correctly (right-to-left, properly shaped)',
      })
    }

    return NextResponse.json({
      error: 'Specify ?test=a (EN brand card), ?test=b (customer upload), or ?test=c (Arabic RTL card)',
    }, { status: 400 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[test/instagram-e2e] ${test ?? 'unknown'} error:`, err)
    return NextResponse.json({ test, ok: false, error: msg }, { status: 500 })
  }
}
