import { test, expect } from '@playwright/test'

test.describe('Navigation & Protected Routes', () => {
  test('root redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/')
    // Should redirect to login page
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('inventory page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('settings page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('login page is accessible without auth', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})
