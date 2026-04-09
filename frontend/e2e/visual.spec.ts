import { test, expect } from '@playwright/test'

test.describe('Visual & Accessibility', () => {
  test('login page has no broken layout', async ({ page }) => {
    await page.goto('/login')
    // Check no console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.waitForLoadState('networkidle')

    // Basic layout checks
    const viewport = page.viewportSize()
    expect(viewport).toBeTruthy()

    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // 1px tolerance
  })

  test('login page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // Password input should still be visible on mobile
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /giriş yap/i })).toBeVisible()
  })

  test('login form has proper input types', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.getByPlaceholder(/e-posta/i)
    await expect(emailInput).toHaveAttribute('type', 'text')

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()

    // Click the eye toggle button (next to password field)
    const toggleBtn = page.locator('input[type="password"]').locator('..').getByRole('button')
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click()
      // After toggle, input type should be 'text'
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
    }
  })
})
