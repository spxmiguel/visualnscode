import { expect, test } from '@playwright/test';

test('apresenta a proposta inicial do produto', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('VisualnsCode');
  await expect(page.getByRole('heading', { name: 'VisualnsCode' })).toBeVisible();
  await expect(page.getByText('Uma IDE orientada por IA')).toBeVisible();
});
