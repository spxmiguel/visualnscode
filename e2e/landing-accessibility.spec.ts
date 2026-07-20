import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('keeps navigation and theme usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.getByRole('button', { name: 'Abrir menu' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();

  const theme = page.getByRole('button', { name: /Ativar tema/ });
  await theme.click();
  const selected = await page.evaluate(() =>
    window.localStorage.getItem('visualnscode-landing-theme'),
  );
  expect(['light', 'dark']).toContain(selected);
  await page.reload();
  expect(
    await page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    ),
  ).toBe(selected);
});
