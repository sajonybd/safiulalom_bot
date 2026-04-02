# safiulalom_bot (Telegram + Vercel)

This is a minimal Telegram bot that can run in two ways:

- **Long polling** (best for local dev / simple VPS, no public URL needed)
- **Webhook** (best for Vercel or a VPS with a public HTTPS URL)

## 1) Prerequisites

- A Telegram bot token from **@BotFather**
- A Vercel project connected to this Git repository

## 2) Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

- `BOT_TOKEN` (required) — from @BotFather
- `WEBHOOK_SECRET` (recommended) — any random string (prevents random POSTs)
- `MONGODB_URI` (required) — MongoDB connection string (Atlas, etc.)
- `ADMIN_USER_IDS` (recommended) — comma separated Telegram user ids allowed to use the bot
- `APP_URL` (recommended) — your deployed base URL (used by `/ui` command)
- `AUTH_SECRET` (required for UI login) — random secret used to secure one-time UI login codes

## 2.1) Find your Telegram user id

- Message `@userinfobot` in Telegram to see your numeric user id.

## 2.2) Ledger commands

- `/in 500 gazi theke nilam` (income)
- `/out 295 bajar` (expense)
- `/sub 999 Netflix` (subscription expense)
- `/list 10` (recent entries)
- `/summary` (this month)
- `/edit <id> 300 updated note`
- `/del <id>`

## 2.3) Web UI (public)

- In Telegram, run `/ui` to get a one-time login code.
- Open: `APP_URL/` (redirects to `/api/ui`)
- Or open directly: `APP_URL/api/ui`
- Enter your `Telegram ID` + the code to login.

## 3) Run locally (long polling)

```bash
npm i
cp .env.example .env
# edit .env to set BOT_TOKEN (WEBHOOK_SECRET not required for polling)
npm run dev:poll
```

## 4) Run on a VPS (webhook server)

```bash
npm i
cp .env.example .env
# edit .env to set BOT_TOKEN and WEBHOOK_SECRET (recommended)
npm run start:webhook
```

This starts:

- `GET /health`
- `POST /telegram?secret=WEBHOOK_SECRET`

Then set Telegram webhook (one-time):

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR-DOMAIN.com/telegram?secret=$WEBHOOK_SECRET"
```

## 5) Deploy to Vercel

Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.

After deploy you will have:

- `GET /api/health` → health check
- `POST /api/telegram?secret=WEBHOOK_SECRET` → Telegram webhook target

## 6) Set Telegram webhook for Vercel (one-time)

After you know your deployed URL:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR-PROJECT.vercel.app/api/telegram?secret=$WEBHOOK_SECRET"
```

To verify:

```bash
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

## Notes

- Telegram **cannot** send webhooks to plain `localhost`. Use polling locally, or use a public HTTPS tunnel.
