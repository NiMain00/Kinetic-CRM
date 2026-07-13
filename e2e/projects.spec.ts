import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#login-username', 'superadmin');
  await page.fill('#login-password', 'admin123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.waitForURL('/dashboard', { timeout: 30000 });
}

test.describe('Projects', () => {
  test('projects list page loads via sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.locator('button[aria-label="Proyek"]').click();
    await page.waitForURL('/projects', { timeout: 10000 });
    await expect(page.getByText('Proyek').first()).toBeVisible();
  });

  test('project list has filter tabs', async ({ page }) => {
    await loginAsAdmin(page);
    // Kunjungi /prospects dulu agar input config groups ter-load (ProspectsPage trigger fetchGroups)
    await page.goto('/prospects');
    await page.waitForLoadState('networkidle');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const tabs = page.locator('button:has-text("Semua"), button:has-text("Prospecting"), button:has-text("Tender"), button:has-text("Negosiasi"), button:has-text("Menang"), button:has-text("Kalah")');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('project form loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');

    const nameField = page.locator('input[name="name"], input[placeholder*="nama" i], input[id*="name" i]').first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
  });

  test('export CSV button visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.getByRole('button', { name: /Export|CSV|Ekspor/i });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });
});
