import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('WatchSync')).toBeVisible()
    await expect(page.getByPlaceholder(/e-posta/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /giriş yap/i })).toBeVisible()
  })

  test('login shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page.getByText(/e-posta/i)).toBeVisible()
  })

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/e-posta/i).fill('invalid@test.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /giriş yap/i }).click()

    // Should show error message (network may be down or credentials invalid)
    await expect(
      page.getByText(/giriş başarısız|hata|error|network/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('WatchSync')).toBeVisible()
    await expect(page.getByPlaceholder(/ad/i).first()).toBeVisible()
  })

  test('navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /kayıt ol|hesap oluştur/i }).click()
    await expect(page).toHaveURL(/register/)

    await page.getByRole('link', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/login/)
  })
})
