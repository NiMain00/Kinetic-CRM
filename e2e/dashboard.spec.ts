import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'superadmin');
    await page.fill('#login-password', 'admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
  });

  test('greeting message is shown with user name', async ({ page }) => {
    // Wait for dashboard to finish loading (spinner might show briefly)
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Selamat (pagi|siang|sore|malam)/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Super Administrator').first()).toBeVisible({ timeout: 5000 });
  });

  test('stat cards are displayed', async ({ page }) => {
    await expect(page.getByText('Total Proyek Aktif')).toBeVisible();
    await expect(page.getByText('Persetujuan Tertunda')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Mendekati Deadline')).toBeVisible();
    await expect(page.getByText('Rasio Kemenangan')).toBeVisible();
  });

  test('action buttons are present and clickable', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Prospek Baru/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Proyek Baru/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Approval/i })).toBeVisible();
  });

  test('Prospek Baru button navigates to prospect form', async ({ page }) => {
    await page.getByRole('button', { name: /Prospek Baru/i }).click();
    await page.waitForURL('/prospects/new', { timeout: 10000 });
  });

  test('Proyek Baru button navigates to project form', async ({ page }) => {
    await page.getByRole('button', { name: /Proyek Baru/i }).click();
    await page.waitForURL('/projects/new', { timeout: 10000 });
  });

  test('dashboard shows current date in Indonesian format', async ({ page }) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const today = new Date();
    const dateStr = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    await expect(page.getByText(dateStr)).toBeVisible();
  });

  test('chart section is visible', async ({ page }) => {
    await expect(page.getByText('Trend Win/Loss')).toBeVisible();
    await expect(page.getByText('Proyek per Status')).toBeVisible();
  });

  test('recent projects section is present', async ({ page }) => {
    await expect(page.getByText('Proyek Terbaru')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lihat Semua' }).first()).toBeVisible();
  });
});
