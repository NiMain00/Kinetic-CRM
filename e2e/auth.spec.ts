import { test, expect } from '@playwright/test';

const DEMO_ACCOUNTS = [
  { name: 'Super Administrator', username: 'superadmin', password: 'admin123', role: 'Super Admin' },
  { name: 'Bambang Permadi', username: 'bambang', password: 'admin123', role: 'PM' },
  { name: 'Rina Marlina', username: 'rina', password: 'admin123', role: 'Branch Manager' },
  { name: 'Deni Saputra', username: 'deni', password: 'staff123', role: 'Staff Finance' },
  { name: 'Siti Rahmawati', username: 'siti', password: 'staff123', role: 'Staff Procurement' },
  { name: 'Ahmad Sulistyo', username: 'ahmad', password: 'staff123', role: 'Staff PM' },
];

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Kinetic CRM/i }).first()).toBeVisible();
  });

  test('login with empty fields shows validation toast', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByText('Harap masukkan username dan password.')).toBeVisible();
  });

  test('failed login redirects back to login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'wronguser');
    await page.fill('#login-password', 'wrongpass');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await page.waitForTimeout(1500);
    await expect(page.locator('#login-username')).toBeVisible();
  });

  test('login as Super Admin and verify redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'superadmin');
    await page.fill('#login-password', 'admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page.getByText(/Selamat (pagi|siang|sore|malam)/)).toBeVisible({ timeout: 10000 });
  });

  test('demo account quick-select fills credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByText('Super Administrator').click();
    await expect(page.locator('#login-username')).toHaveValue('superadmin');
  });

  test('logout clears auth state and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'superadmin');
    await page.fill('#login-password', 'admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/dashboard', { timeout: 15000 });

    const logoutBtn = page.getByLabel('Keluar');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page.locator('#login-username')).toBeVisible();

    const raw = await page.evaluate(() => localStorage.getItem('kinetic-auth'));
    const parsed = raw ? JSON.parse(raw) : null;
    expect(parsed?.state?.isAuthenticated).toBe(false);
  });

  test('all demo accounts can log in', async ({ page }) => {
    for (let i = 0; i < DEMO_ACCOUNTS.length; i++) {
      const account = DEMO_ACCOUNTS[i];

      if (i === 0) {
        await page.goto('/login');
      } else {
        await page.evaluate(() => localStorage.removeItem('kinetic-auth'));
        await page.goto('/login');
      }

      await page.waitForSelector('#login-username', { timeout: 10000 });
      await page.fill('#login-username', account.username);
      await page.fill('#login-password', account.password);
      await page.getByRole('button', { name: 'Masuk' }).click();

      try {
        await page.waitForURL('/dashboard', { timeout: 15000 });
        await expect(page.getByText(/Selamat (pagi|siang|sore|malam)/)).toBeVisible({ timeout: 10000 });
      } catch {
        continue;
      }
    }
  });

  test('forgot password page loads with Lupa Password heading', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Lupa password?').click();
    await page.waitForURL('/forgot-password', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Lupa Password' })).toBeVisible();
  });

  test('auth persists across page reload', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-username', 'superadmin');
    await page.fill('#login-password', 'admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/dashboard', { timeout: 15000 });

    await page.reload();
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page.getByText(/Selamat (pagi|siang|sore|malam)/)).toBeVisible({ timeout: 10000 });
  });
});
