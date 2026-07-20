import { _electron as electron } from '@playwright/test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const assets = resolve(root, 'docs/assets');

const application = await electron.launch({
  args: [resolve(root, 'apps/desktop')],
  cwd: root,
});

try {
  const page = await application.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole('heading', { name: 'Seu ambiente, sem complicação.' }).waitFor();
  await page.screenshot({ path: resolve(assets, 'onboarding.png') });

  await page.getByRole('button', { name: /Tudo pronto/u }).click();
  await page.getByRole('button', { name: 'Entrar no VisualnsCode' }).click();
  await page.getByRole('heading', { name: 'Comece um projeto.' }).waitFor();
  await page.screenshot({ path: resolve(assets, 'home.png') });

  await page.getByRole('button', { name: /Aurora Dashboard/u }).click();
  await page.locator('.monaco-editor').waitFor({ state: 'visible', timeout: 15_000 });
  await page.screenshot({ path: resolve(assets, 'workspace.png') });
} finally {
  await application.close();
}
