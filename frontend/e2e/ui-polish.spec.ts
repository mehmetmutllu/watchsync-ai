import { test, expect, type Page } from '@playwright/test'

const OWNER = { email: 'demo@watchsync.ai', password: 'password' }

async function disableTour(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('watchsync_onboarding_completed', 'true')
    } catch {
      /* no-op */
    }
  })
}

async function login(page: Page) {
  await page.goto('/tr/login')
  await page.waitForLoadState('networkidle')
  await page.locator('input[type="email"]').fill(OWNER.email)
  await page.locator('input[type="password"]').fill(OWNER.password)
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
  await page.waitForURL('**/dashboard', { timeout: 30000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('UI polish — settings tab etiketleri + izin matrisi grup seçimi', () => {
  test.slow()

  test('settings tab etiketleri mobilde görünür + tablist a11y rolleri', async ({ page }) => {
    await disableTour(page)
    await login(page)

    // Mobil viewport: eski davranışta sadece ikonlar görünüyordu
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/tr/dashboard/settings')

    const tablist = page.getByRole('tablist')
    await expect(tablist).toBeVisible({ timeout: 30000 })

    for (const label of ['Profil', 'Şirket Bilgileri', 'Bildirimler', 'Platformlar']) {
      const tab = page.getByRole('tab', { name: label })
      await expect(tab).toBeVisible()
      // Etiket metni görünür olmalı (sadece ikon değil)
      await expect(tab.getByText(label, { exact: true })).toBeVisible()
    }

    // Aktif tab aria-selected=true
    await expect(page.getByRole('tab', { name: 'Profil' })).toHaveAttribute('aria-selected', 'true')

    // Tab değişimi + tabpanel
    await page.getByRole('tab', { name: 'Şirket Bilgileri' }).click()
    await expect(page.getByRole('tab', { name: 'Şirket Bilgileri' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('tabpanel')).toBeVisible()

    await page.screenshot({ path: 'test-results/settings-mobile-tabs.png' })
  })

  test('izin matrisi grup "Tümünü seç / Temizle" çalışır ve gruplar bağımsız', async ({ page }) => {
    await disableTour(page)
    await login(page)

    await page.goto('/tr/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Ekip Yönetimi' })).toBeVisible({
      timeout: 30000,
    })

    await page.getByRole('button', { name: 'Üye Davet Et' }).click()

    // "Envanter" grubunun kapsayıcısını yakala
    const group = page
      .locator('div.p-3')
      .filter({ has: page.getByRole('heading', { name: 'Envanter', exact: true }) })
    await expect(group).toBeVisible()
    expect(await group.getByRole('checkbox').count()).toBeGreaterThan(0)

    const selectAllBtn = group.getByRole('button', { name: 'Tümünü seç' })
    const clearBtn = group.getByRole('button', { name: 'Temizle' })

    // Başlangıçta hepsi seçili değil → "Tümünü seç" görünür
    await expect(selectAllBtn).toBeVisible()

    // Tümünü seç → tüm ETKİN kutular işaretlenir, buton "Temizle"ye döner
    await selectAllBtn.click()
    await expect(clearBtn).toBeVisible()
    await expect(group.getByRole('checkbox', { checked: false, disabled: false })).toHaveCount(0)
    await page.screenshot({ path: 'test-results/perm-select-all.png' })

    // Temizle → grup artık "hepsi seçili" değil, buton tekrar "Tümünü seç"e döner
    await clearBtn.click()
    await expect(selectAllBtn).toBeVisible()

    // Bağımsızlık: "Ekip" grubunun "Tümünü seç"i Envanter'i etkilemez
    const otherGroup = page
      .locator('div.p-3')
      .filter({ has: page.getByRole('heading', { name: 'Ekip', exact: true }) })
    await otherGroup.getByRole('button', { name: 'Tümünü seç' }).click()
    await expect(otherGroup.getByRole('button', { name: 'Temizle' })).toBeVisible()
    // Envanter hâlâ "Tümünü seç" durumunda (başka grup onu değiştirmedi)
    await expect(selectAllBtn).toBeVisible()
  })

  test('davet modalı preset-farkı göstergesi ve "Varsayılana dön"', async ({ page }) => {
    await disableTour(page)
    await login(page)

    await page.goto('/tr/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Ekip Yönetimi' })).toBeVisible({
      timeout: 30000,
    })
    await page.getByRole('button', { name: 'Üye Davet Et' }).click()

    // Açılışta seçim = rol varsayılanı → "Rol varsayılanıyla aynı"
    await expect(page.getByText('Rol varsayılanıyla aynı')).toBeVisible()

    // Bir gruba izin ekle → gösterge "Özelleştirildi"ye döner
    const group = page
      .locator('div.p-3')
      .filter({ has: page.getByRole('heading', { name: 'Envanter', exact: true }) })
    await group.getByRole('button', { name: 'Tümünü seç' }).click()
    await expect(page.getByText('Özelleştirildi')).toBeVisible()

    // "Varsayılana dön" → gösterge yeniden "Rol varsayılanıyla aynı"
    await page.getByRole('button', { name: 'Varsayılana dön' }).click()
    await expect(page.getByText('Rol varsayılanıyla aynı')).toBeVisible()
  })

  test('ConfirmDialog kapanınca odağı tetikleyen butona geri verir', async ({ page }) => {
    await disableTour(page)
    await login(page)

    await page.goto('/tr/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Ekip Yönetimi' })).toBeVisible({
      timeout: 30000,
    })

    // Kalıcı bir tetikleyici için bir davet oluştur (satır iptal sonrası kaybolmaz)
    const email = `focus-${Date.now()}@watchsync.test`
    await page.getByRole('button', { name: 'Üye Davet Et' }).click()
    await page.getByPlaceholder('uye@ornek.com').fill(email)
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/team/invitations') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Davet Gönder' }).click(),
    ])

    const revokeBtn = page.locator('li').filter({ hasText: email }).getByTitle('İptal et')
    await expect(revokeBtn).toBeVisible()

    // Diyaloğu aç → Escape ile kapat → odak tetikleyen butona dönmeli
    await revokeBtn.click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(revokeBtn).toBeFocused()

    // Temizlik: daveti gerçekten iptal et (Enter = onayla)
    await revokeBtn.click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('li').filter({ hasText: email })).toHaveCount(0)
  })

  test('envanter satırı erişilebilir ad + 44px aksiyon hedefi', async ({ page }) => {
    await disableTour(page)
    await login(page)

    await page.goto('/tr/dashboard/inventory')
    await page.waitForLoadState('networkidle')

    // İkon-only aksiyon butonu artık erişilebilir ada sahip
    const actionBtn = page.getByRole('button', { name: 'İşlemler' }).first()
    await expect(actionBtn).toBeVisible({ timeout: 30000 })

    // 44px dokunma hedefi
    const box = await actionBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)

    // Satırlar tanımlayıcı aria-label taşır (marka/model)
    expect(await page.locator('tbody tr[aria-label]').count()).toBeGreaterThan(0)
  })
})
