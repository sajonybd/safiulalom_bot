# safiulalom_bot (Telegram + Vercel)

This is a minimal Telegram bot using **webhooks** so it can run on **Vercel Serverless Functions**.

## 1) Prerequisites

- A Telegram bot token from **@BotFather**
- A Vercel project connected to this Git repository

## 2) Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

- `BOT_TOKEN` (required) — from @BotFather
- `WEBHOOK_SECRET` (recommended) — any random string (prevents random POSTs)

## 3) Deploy

Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.

After deploy you will have:

- `GET /api/health` → health check
- `POST /api/telegram?secret=WEBHOOK_SECRET` → Telegram webhook target

## 4) Set Telegram webhook (one-time)

After you know your deployed URL:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR-PROJECT.vercel.app/api/telegram?secret=$WEBHOOK_SECRET"
```

To verify:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

## 5) Local dev (optional)

```bash
npm i
npx vercel dev
```

Then you can hit:

```bash
curl http://localhost:3000/api/health
```

