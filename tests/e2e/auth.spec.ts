import { test, expect } from '@playwright/test'

test.describe('Auth — protected route redirect', () => {
  const PROTECTED_ROUTES = [
    '/dashboard',
    '/generate',
    '/history',
    '/brand',
    '/billing',
    '/social',
    '/marketing',
  ]

  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route)
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })
  }
})

test.describe('Auth — login page', () => {
  test('login page renders without error', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.getByRole('button', { name: /sign in|log in|se connecter/i }).click()
    await expect(page.getByText(/invalid|error|incorrect|failed/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Auth — signup page', () => {
  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

test.describe('Auth — forgot password', () => {
  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
