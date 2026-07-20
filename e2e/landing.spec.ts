import { expect, test } from '@playwright/test';

test('apresenta a proposta inicial do produto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('VisualnsCode — Build with every AI');
  await expect(
    page.getByRole('heading', {
      name: 'Build with every AI. Manage everything from one place.',
    }),
  ).toBeVisible();
  await expect(page.getByText(/VisualnsCode combines AI agents/)).toBeVisible();
  await expect(page.locator('#top').getByRole('link', { name: 'Download' })).toHaveAttribute(
    'href',
    /releases\/latest$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://visualnscode.dev/',
  );
});
