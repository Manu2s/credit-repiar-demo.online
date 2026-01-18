# Upload to Hostinger Node.js (ZIP)

## Stripe webhook URL
Use **either** endpoint (both work):
- `https://credit-repiar-demo.online/api/stripe/webhook`
- `https://credit-repiar-demo.online/stripe/webhook`

In Stripe Dashboard → Developers → Webhooks, add the endpoint and copy the signing secret `whsec_...`.

## Required environment variables (Hostinger panel)
Set these in Hostinger → Node.js app → **Environment variables**:

- `NODE_ENV=production`
- `PORT=3000` (or Hostinger port)
- `APP_URL=https://credit-repiar-demo.online`
- `DATABASE_URL=postgresql://...`
- `SESSION_SECRET=...`
- `STRIPE_PUBLISHABLE_KEY=pk_...`
- `STRIPE_SECRET_KEY=sk_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- (optional) `OPENAI_API_KEY=...`

## Install / build / start
Because the build uses Vite + esbuild, make sure dev dependencies are installed:

**Install command**
```
npm install --include=dev
```

**Build command**
```
npm run build
```

**Start command**
```
npm run start
```

If Hostinger asks for a startup file, use:
- `dist/index.cjs` (after build)

## Database (important)
After you set `DATABASE_URL`, run:

```
npm run db:push
```

This will create/update tables (including the `users.password_hash` column used by email/password login).

## Login
- User login page: `/login`
- User register page: `/register`
- Admin login page: `/admin/login`
