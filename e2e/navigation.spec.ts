import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#login-username', 'superadmin');
  await page.fill('#login-password', 'admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/dashboard', { timeout: 30000 });
}

test.describe('Navigation', () => {
  test('Prospek nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Prospek"]').click();
    await page.waitForURL(/\/prospects/, { timeout: 15000 });
  });

  test('Proyek nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Proyek"]').click();
    await page.waitForURL(/\/projects/, { timeout: 15000 });
  });

  test('Pengadaan nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Pengadaan"]').click();
    await page.waitForURL(/\/procurement/, { timeout: 15000 });
  });

  test('Persetujuan nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Persetujuan"]').click();
    await page.waitForURL(/\/approvals/, { timeout: 15000 });
  });

  test('Laporan nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Laporan"]').click();
    await page.waitForURL(/\/reports/, { timeout: 15000 });
  });

  test('Master Data nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Master Data"]').click();
    await page.waitForURL(/\/master-data/, { timeout: 15000 });
  });

  test('Notifikasi nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Notifikasi"]').first().click();
    await page.waitForURL(/\/notifications/, { timeout: 15000 });
  });

  test('Konfigurasi nav works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Konfigurasi"]').click();
    await page.waitForURL(/\/config/, { timeout: 15000 });
  });

  test('404 page shows for invalid route', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/some-nonexistent-route');
    await expect(page.getByText(/404|Tidak Ditemukan|Not Found/i).first()).toBeVisible({ timeout: 10000 });
  });
});
