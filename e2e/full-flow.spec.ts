import { test, expect } from '@playwright/test';

const TS = Date.now().toString().slice(-4);

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#login-username', 'superadmin');
  await page.fill('#login-password', 'admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/dashboard', { timeout: 60000 });
}

test.describe('Full Flow: Prospect → Project → Pengadaan', () => {

  test('1. Create prospect + verify in list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/prospects/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="radio"][value="new"]').check();
    await page.waitForTimeout(300);

    await page.locator('input[placeholder="Contoh: PT. Maju Bersama"]').fill(`PT. E2E Prospect ${TS}`);
    await page.locator('input[placeholder="Contoh: MB"]').fill(`E2E${TS}`);
    await page.locator('input[placeholder="Kota"]').fill('Jakarta');
    await page.locator('input[aria-label="Nama Prospek"]').fill(`E2E Test Prospect ${TS}`);
    await page.locator('input[aria-label="Potensi Penambahan Unit"]').fill('5');
    await page.locator('button[aria-label="Simpan Draft"]').click();

    await expect(page.getByText('Draf prospek berhasil disimpan')).toBeVisible({ timeout: 20000 });
    await page.waitForURL('/prospects', { timeout: 15000 });
    await expect(page.getByText('Prospek').first()).toBeVisible();

    const prospectCell = page.locator(`text="E2E Test Prospect ${TS}"`);
    await expect(prospectCell.first()).toBeVisible({ timeout: 10000 });
  });

  test('2. Create project + verify in list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[aria-label="Nama Proyek"]').fill(`E2E Test Project ${TS}`);

    const clientSelect = page.locator('select[aria-label="Client"]');
    const clientOptions = await clientSelect.locator('option[value]').all();
    const validOptions = [];
    for (const opt of clientOptions) {
      const val = await opt.getAttribute('value');
      if (val && val !== '') validOptions.push(val);
    }
    if (validOptions.length > 0) {
      await clientSelect.selectOption(validOptions[0]);
    }

    await page.locator('input[aria-label="Lokasi"]').fill('Jakarta');

    const submitBtn = page.getByRole('button', { name: 'Buat Proyek' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.getByText(/berhasil dibuat/)).toBeVisible({ timeout: 20000 });
    await page.waitForURL(/\/project\//, { timeout: 15000 });
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 10000 });
  });

  test('3. Create procurement + verify detail', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/procurement/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder="Nama perusahaan klien"]').fill(`PT. E2E Procurement ${TS}`);
    await page.locator('input[type="number"]').fill('750000000');
    await page.locator('input[placeholder="Lokasi proyek"]').fill('Jakarta');
    await page.getByRole('button', { name: /Simpan Pengadaan/i }).click();

    await expect(page.getByText(/berhasil dibuat/)).toBeVisible({ timeout: 15000 });
    await page.waitForURL(/\/procurement\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 10000 });
  });
});
