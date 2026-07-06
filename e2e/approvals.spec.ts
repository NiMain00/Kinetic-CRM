import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#login-username', 'superadmin');
  await page.fill('#login-password', 'admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/dashboard', { timeout: 60000 });
}

test.describe('Approvals', () => {
  test('approvals page loads via sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Persetujuan"]').click();
    await page.waitForURL('/approvals', { timeout: 10000 });
    await expect(page.getByText('Persetujuan').first()).toBeVisible();
  });

  test('approval content is visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/approvals');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[class*="card"], [class*="approval"]').first()).toBeVisible({ timeout: 5000 });
  });
});
