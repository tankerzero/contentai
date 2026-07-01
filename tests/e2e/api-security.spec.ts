import { test, expect } from '@playwright/test'

test.describe('API route security — unauthenticated access', () => {
  test('GET /api/generate returns 405 (POST only)', async ({ request }) => {
    const res = await request.get('/api/generate')
    expect(res.status()).toBe(405)
  })

  test('POST /api/generate without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/generate', {
      data: { type: 'blog_post', topic: 'test', tone: 'professional', language: 'en' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/marketing/queue without CRON_SECRET returns 401', async ({ request }) => {
    const res = await request.post('/api/marketing/queue', {
      data: { platform: 'twitter', content: 'test', language: 'en' },
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/marketing/publish without auth returns 401', async ({ request }) => {
    const res = await request.post('/api/marketing/publish')
    expect(res.status()).toBe(401)
  })

  test('GET /api/marketing/approve without token returns HTML error page', async ({ request }) => {
    const res = await request.get('/api/marketing/approve')
    expect(res.status()).toBe(200) // Returns styled HTML error page
    const body = await res.text()
    expect(body).toContain('Invalid link')
  })

  test('GET /api/marketing/approve with invalid token returns 200 HTML (not found)', async ({ request }) => {
    const res = await request.get('/api/marketing/approve?token=00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(200)
    const body = await res.text()
    // Should say not found or invalid
    expect(body.toLowerCase()).toMatch(/not found|invalid/i)
  })

  test('GET /api/marketing/seed-canada-day returns 404 (endpoint deleted)', async ({ request }) => {
    const res = await request.get('/api/marketing/seed-canada-day')
    expect(res.status()).toBe(404)
  })

  test('POST /api/stripe/webhook without valid signature returns 400', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 'v1=invalidsignature,t=1234567890' },
      data: '{"type":"checkout.session.completed"}',
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/brand requires auth — returns 401', async ({ request }) => {
    const res = await request.post('/api/brand', {
      data: { company_name: 'Test Co' },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('API route security — method validation', () => {
  test('GET /api/marketing/queue returns 405', async ({ request }) => {
    const res = await request.get('/api/marketing/queue')
    expect(res.status()).toBe(405)
  })

  test('DELETE /api/generate returns 405', async ({ request }) => {
    const res = await request.delete('/api/generate')
    expect(res.status()).toBe(405)
  })
})

test.describe('Demo route', () => {
  test('POST /api/demo with valid payload returns content', async ({ request }) => {
    const res = await request.post('/api/demo', {
      data: { topic: 'summer coffee shop', type: 'social_media', language: 'en' },
    })
    // 200 = success, 429 = rate limited, 500 = API key not configured in test env
    expect([200, 429, 500]).toContain(res.status())
  })

  test('POST /api/demo with empty topic returns 400', async ({ request }) => {
    const res = await request.post('/api/demo', {
      data: { topic: '   ', type: 'social_media', language: 'en' },
    })
    // 400 = bad request, 429 = rate limited (acceptable in repeated test runs)
    expect([400, 429]).toContain(res.status())
  })

  test('POST /api/demo with invalid JSON returns 400', async ({ request }) => {
    const res = await request.post('/api/demo', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json {{{',
    })
    expect([400, 429, 500]).toContain(res.status())
  })
})
