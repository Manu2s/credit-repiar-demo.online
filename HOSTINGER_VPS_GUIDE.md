# Credit Repair Pro — Hostinger VPS Deploy (Nginx + SSL)

This project is configured for **Hostinger VPS** using:
- Node.js (app listens on `PORT`)
- Nginx reverse proxy
- Let's Encrypt SSL (Certbot)

## 1) Server prerequisites

```bash
sudo apt update
sudo apt install -y nginx
```

Install Node.js (LTS) and npm.

## 2) App env

Create `.env` in the project root:

- Copy `.env.example` → `.env`
- Fill in `DATABASE_URL`, `SESSION_SECRET`, and Stripe keys.

## 3) Database schema

This app uses Drizzle. After your Postgres DB is ready and `DATABASE_URL` is set:

```bash
npm install --include=dev
npm run db:push
```

## 4) Build + run

```bash
npm install --include=dev
npm run build
npm run start
```

The server will bind to `0.0.0.0:$PORT`.

## 5) Nginx reverse proxy

Create a new server block:

```bash
sudo nano /etc/nginx/sites-available/credit-repiar-demo.online
```

Paste (replace domain if needed):

```nginx
server {
    server_name credit-repiar-demo.online www.credit-repiar-demo.online;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/credit-repiar-demo.online /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6) SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d credit-repiar-demo.online -d www.credit-repiar-demo.online
```

## 7) Stripe webhook URL

Use either of these (both are supported):

- `https://credit-repiar-demo.online/api/stripe/webhook`
- `https://credit-repiar-demo.online/stripe/webhook`

Then set in `.env`:

- `STRIPE_WEBHOOK_SECRET=whsec_...`

## 8) Quick health check

Visit:

- `https://credit-repiar-demo.online/api/health`

