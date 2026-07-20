# Landing page

The VisualnsCode website lives in `apps/landing`. It is a static Vite, React, TypeScript, and
Tailwind application; it has no access to Electron APIs, local files, credentials, or development
commands.

## Information architecture

The page follows the product story instead of reproducing the desktop navigation:

1. product promise and calls to action;
2. a visual representation of the real IDE workspace;
3. problem, solution, and supported integrations;
4. simple and advanced modes;
5. agent workflows and automatic environment setup;
6. security, GitHub, preview, and deployment;
7. roadmap, FAQ, and final open-source call to action.

Reusable layout primitives are in `src/components/Primitives.tsx`. The header and footer are in
`Layout.tsx`, the product workspace representation is in `ProductWorkspace.tsx`, and the content sections are in
`Sections.tsx`. Product URLs and integration labels are centralized in `src/constants.ts`.

## Themes and accessibility

The light and dark palettes use CSS custom properties. The selected theme is stored under
`visualnscode-landing-theme`; when no preference exists, the page follows `prefers-color-scheme`.
The document also publishes matching browser theme colors.

The page includes a skip link, visible keyboard focus, semantic landmarks, accessible names for icon
controls, reduced-motion support, native FAQ disclosure controls, and a keyboard-operable mobile
menu. Playwright runs Axe against the rendered page and covers the mobile navigation and persisted
theme.

## SEO and static assets

`index.html` contains the canonical URL, description, Open Graph data, Twitter card metadata, and
`SoftwareApplication` structured data. `public/` contains the provisional favicon, social card,
`robots.txt`, and `sitemap.xml`. Update all `https://visualnscode.dev` references together if the
canonical production domain changes.

## Local development and verification

From the repository root:

```bash
pnpm dev:landing
pnpm --filter @visualnscode/landing build
pnpm test:e2e
pnpm test:lighthouse
```

The production output is written to `apps/landing/dist`. Lighthouse CI uses the median of three runs
and enforces minimum scores of 0.80 for performance, 0.90 for best practices, 0.95 for
accessibility, and 0.95 for SEO. The median keeps the mobile performance gate useful on shared CI
runners without making one noisy CPU sample fail the workflow.

## Deploy to Vercel

Create a dedicated Vercel project for the landing page so the Electron application is never treated
as a web deployment.

1. Import `spxmiguel/visualnscode` in Vercel.
2. Set **Root Directory** to `apps/landing`.
3. Select the **Vite** framework preset.
4. Keep the install command as `pnpm install --frozen-lockfile`.
5. Set the build command to `pnpm build` and the output directory to `dist`.
6. Deploy a preview and run the accessibility and Lighthouse checks before promoting it.
7. Point `visualnscode.dev` to the project only after the preview metadata and canonical URL have
   been verified.

Vercel supports deploying individual applications from a monorepo by assigning each one its own
project and root directory. See the official
[monorepo deployment guide](https://vercel.com/academy/production-monorepos/deploy-all-apps).

No runtime environment variables are required. If an interest form is connected later, its public
endpoint and privacy behavior must be documented before deployment; secrets must never use a
client-exposed Vite variable.
