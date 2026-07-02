import { test, expect, type Page } from '@playwright/test'

const OWNER = { email: 'demo@watchsync.ai', password: 'password' }

// Her koşuda çakışmayı önlemek için benzersiz e-posta
const STAMP = Date.now()
const STAFF = {
  email: `e2e-staff-${STAMP}@watchsync.test`,
  name: 'E2E Staff',
  password: 'StaffPass123!',
}

// Testler arasında paylaşılan davet kabul URL'si
let acceptUrl = ''

// Onboarding turunu kapat (yeni context'lerde overlay tıklamaları engellemesin)
async function disableTour(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('watchsync_onboarding_completed', 'true')
    } catch {
      /* no-op */
    }
  })
}

// Locale'i deterministik tut: uygulama varsayılanı `de` + Accept-Language tespiti
// olduğundan tüm rotalara açıkça /tr öneki koyup Türkçe metinleri assert ediyoruz.
async function doLogin(page: Page, email: string, password: string) {
  await page.goto('/tr/login')
  // Hidrasyonu bekle: aksi halde tıklama native GET submit'e düşer (dev build yarışı)
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
}

test.describe.configure({ mode: 'serial' })

test.describe('Aşama 7 — Ekip Yönetimi & İzin Sistemi', () => {
  // Dev derlemesi ilk rota ziyaretlerinde yavaş olabilir → cömert timeout
  test.slow()

  test('owner ekip sayfasını açar ve bir çalışan davet eder', async ({ page }) => {
    await disableTour(page)
    await doLogin(page, OWNER.email, OWNER.password)
    await page.waitForURL('**/dashboard', { timeout: 30000 })

    await page.goto('/tr/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Ekip Yönetimi' })).toBeVisible({
      timeout: 30000,
    })

    await page.getByRole('button', { name: 'Üye Davet Et' }).click()
    await page.getByPlaceholder('uye@ornek.com').fill(STAFF.email)

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/team/invitations') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Davet Gönder' }).click(),
    ])

    expect(resp.status()).toBe(201)
    const body = await resp.json()
    acceptUrl = body.invitation.accept_url
    expect(acceptUrl).toContain('/invite/')

    // Bekleyen davetler listesinde e-posta görünür
    await expect(page.getByText(STAFF.email)).toBeVisible({ timeout: 10000 })
  })

  test('davet edilen çalışan hesabı oluşturup dashboard\'a ulaşır', async ({ browser }) => {
    expect(acceptUrl).not.toBe('')
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await disableTour(page)

    // Türkçe UI için /tr öneki ekle
    await page.goto(acceptUrl.replace('/invite/', '/tr/invite/'))

    await expect(page.getByRole('heading', { name: 'Ekibe Katıl' })).toBeVisible({
      timeout: 30000,
    })
    // Özet kartında davet e-postası görünür
    await expect(page.getByText(STAFF.email)).toBeVisible()

    await page.locator('#name').fill(STAFF.name)
    await page.locator('#password').fill(STAFF.password)
    await page.locator('#password_confirmation').fill(STAFF.password)
    await page.getByRole('button', { name: 'Hesabı Oluştur ve Katıl' }).click()

    await page.waitForURL('**/dashboard', { timeout: 30000 })
    await ctx.close()
  })

  test('çalışan Ekip menüsünü ve fiyat sütunlarını göremez', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await disableTour(page)

    await doLogin(page, STAFF.email, STAFF.password)
    await page.waitForURL('**/dashboard', { timeout: 30000 })

    // team.manage yok → Sidebar'da "Ekip" bağlantısı yok
    await expect(page.getByRole('link', { name: 'Ekip' })).toHaveCount(0)

    // inventory.view_price / view_cost yok → fiyat sütunları gizli
    await page.goto('/tr/dashboard/inventory')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('columnheader', { name: 'Satış Fiyatı' })).toHaveCount(0)
    await expect(page.getByRole('columnheader', { name: 'Maliyet' })).toHaveCount(0)

    await ctx.close()
  })

  test('geçersiz davet token\'ı hata durumu gösterir', async ({ page }) => {
    await disableTour(page)
    await page.goto('/tr/invite/definitely-not-a-real-token')
    await expect(page.getByRole('heading', { name: 'Geçersiz Davet' })).toBeVisible({
      timeout: 30000,
    })
  })

  test('owner çalışanı pasifleştirir, pasif çalışan giriş yapamaz, son owner silinemez', async ({
    browser,
  }) => {
    // 1) Owner çalışanı pasifleştirir
    const ownerCtx = await browser.newContext()
    const op = await ownerCtx.newPage()
    await disableTour(op)
    await doLogin(op, OWNER.email, OWNER.password)
    await op.waitForURL('**/dashboard', { timeout: 30000 })
    await op.goto('/tr/dashboard/team')
    await expect(op.getByRole('heading', { name: 'Ekip Yönetimi' })).toBeVisible({ timeout: 30000 })

    const row = op.locator('tr', { hasText: STAFF.email })
    await expect(row).toBeVisible()
    await row.getByTitle('Pasifleştir').click()
    await expect(row.getByText('Pasif')).toBeVisible({ timeout: 10000 })

    // 2) Son owner korunur: owner satırında silme/pasifleştirme aksiyonu yok
    const ownerRow = op.locator('tr', { hasText: OWNER.email })
    await expect(ownerRow).toBeVisible()
    await expect(ownerRow.getByTitle('Sil')).toHaveCount(0)
    await expect(ownerRow.getByTitle('Pasifleştir')).toHaveCount(0)

    await ownerCtx.close()

    // 3) Pasifleştirilen çalışan giriş yapamaz
    const staffCtx = await browser.newContext()
    const sp = await staffCtx.newPage()
    await disableTour(sp)

    const [loginResp] = await Promise.all([
      sp.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
      ),
      doLogin(sp, STAFF.email, STAFF.password),
    ])

    // Backend girişi engeller (disabled → 401)
    expect(loginResp.status()).toBe(401)
    // UI'da spesifik hata mesajı görünür
    await expect(sp.locator('.text-semantic-error')).toContainText(/devre dışı/i, {
      timeout: 10000,
    })
    // Dashboard'a geçmemeli
    await expect(sp).not.toHaveURL(/\/dashboard(\/|$)/)

    await staffCtx.close()
  })
})
