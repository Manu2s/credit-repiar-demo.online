# Credit Repair Pro (Hostinger + GitHub Ready)

This project is prepared for:
- **GitHub** (clean repo, no `node_modules` committed)
- **Hostinger Web App (Node.js)** deployment

## Deploy on Hostinger Web App
In Hostinger Web App settings use:
- **Install command**: `npm install`
- **Build command**: `npm run build`
- **Start command**: `npm start`

## Environment variables
Set these in Hostinger (Web App -> Environment):
- `NODE_ENV=production`
- `PORT=3000` (Hostinger may set this automatically)
- `DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME`
- `SESSION_SECRET=change-this-to-a-long-random-string`
- `STRIPE_SECRET_KEY=sk_live_or_test_...`
- `STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `APP_URL=https://credit-repiar-demo.online`
- `OPENAI_API_KEY=...` (optional)

## Stripe webhook URL
Use the public HTTPS URL from your domain:
- `https://credit-repiar-demo.online/api/stripe/webhook`

## Local dev (optional)
```bash
npm install
npm --prefix client install
npm run dev
```
