# Deployment

## Supported targets

| Service | Status |
|---|---|
| Vercel | Available |
| Firebase Hosting | Available |
| GitHub Pages | Planned |
| Supabase | Planned |

## Deploy flow

1. Open the **Preview** panel and run the project to verify it builds.
2. Click **Deploy** (toolbar or keyboard shortcut).
3. Select a target service.
4. VisualnsCode shows the build configuration for review.
5. A preview deployment is created first.
6. You inspect the preview URL.
7. Click **Publish to production** — requires explicit confirmation.
8. The production URL is shown.

Production deployment always requires confirmation — it can never happen automatically.

## Vercel

```bash
# Link once per project
vercel link

# Preview deploy (automatic on push)
vercel

# Production deploy
vercel --prod
```

VisualnsCode runs these via the Vercel integration after checking permissions.

## Firebase Hosting

```bash
# Init once per project
firebase init hosting

# Deploy preview channel
firebase hosting:channel:deploy preview

# Promote to production
firebase hosting:channel:promote preview live
```

## GitHub Pages

Planned for a future release. Will use `gh-pages` or the built-in GitHub Actions workflow.

## Deploy history

Each deploy is recorded in `.visualnscode/deploy-history.json` inside the project folder. Entries include:

- Service
- Environment (preview / production)
- URL
- Timestamp
- Status
