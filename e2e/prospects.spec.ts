import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#login-username', 'superadmin');
  await page.fill('#login-password', 'admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/dashboard', { timeout: 30000 });
}

test.describe('Prospects', () => {
  test('prospects list page loads via sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Prospek"]').click();
    await page.waitForURL('/prospects', { timeout: 10000 });
    await expect(page.getByText('Prospek').first()).toBeVisible();
  });

  test('prospect new button visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/prospects');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Buat Prospek|Prospek Baru/i }).first()).toBeVisible();
  });

  test('prospect form page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/prospects/new');
    await page.waitForLoadState('networkidle');
    const nameField = page.locator('input[name="name"], input[placeholder*="nama" i], input[id*="name" i]').first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
  });
});
