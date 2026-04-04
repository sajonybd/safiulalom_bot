# Life-OS : Personal AI Assistant (Telegram + WhatsApp + Next.js)

This is a comprehensive Life-OS (Personal AI Assistant) managed via AI assistants on Telegram and WhatsApp, with a visual dashboard built in Next.js.

The bot supports:

- **Telegram Bot**: Full command support and AI natural language processing.
- **WhatsApp Bot**: Lightweight, NLP-driven entry via WaAPI.app.
- **Unified Credit System**: 50 AI Bits per day per user across all platforms.
- **Team Management**: Role-Based Access Control (RBAC) to share ledgers with family or colleagues.
- **Admin Control Room**: Comprehensive dashboard for user management, credit resets, and administrative audit logs.

## 1) Prerequisites

- A Telegram bot token from **@BotFather**
- A **WaAPI.app** account for WhatsApp integration
- A Vercel project connected to this Git repository

## 2) Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

- `BOT_TOKEN` (required) — from @BotFather
- `WEBHOOK_SECRET` (recommended) — random string for Telegram security
- `MONGODB_URI` (required) — MongoDB connection string
- `APP_URL` (recommended) — your deployed base URL
- `AUTH_SECRET` (required) — for UI login security
- `GEMINI_API_KEY` (required) — for AI interpretation
- `WAAPI_TOKEN` — for WhatsApp support
- `WAAPI_INSTANCE_ID` — for WhatsApp support
- `WAAPI_WEBHOOK_SECRET` — for WhatsApp security
- `ADMIN_USER_IDS` — comma separated Telegram user IDs for admin access

## 3) Support & Limit Upgrade

Life-OS is free for everyone with a default limit of **50 AI Bits per day**. If you need more:

1. Send any support amount to **01967550181** (bKash/Rocket/Nagad Personal).
2. Take a screenshot of the transaction.
3. Send it along with your User ID to **@safiulalom** on Telegram.
4. Your daily limit will be upgraded within 2-4 hours.

## 4) Find your Telegram user id

- Message `@userinfobot` in Telegram to see your numeric user id.

## 2.2) Ledger commands

- `/in 500 omuk theke nilam` (income)
- `/out 295 bajar` (expense)
- `/sub 999 Netflix` (subscription expense)
- `/person_out Ma 500 medicine` (I gave Ma, so I should get)
- `/person_in Vaiya 1200 groceries` (Vaiya gave me, so I should pay)
- `/person_summary Ma` (person-wise balance + recent history)
- Natural language (no command): `@Ma ke 1000 bajar dilam #Cash theke`, `@Hasif theke 500 nilam`, `#bKash theke 500 mobile recharge`
- **Pro Shortcuts**: `@Name` for person/entity focus, `#Account` for source/destination wallet.
- `/ai_cancel` (cancel pending follow-up question)
- `/list 10` (recent entries)
- `/summary` (this month)
- `/edit <id> 300 updated note`
- `/del <id>`

## 2.3) Web UI (public)

- In Telegram, run `/ui` to get a one-time login code.
- Open: `APP_URL/`
- Enter your `Telegram ID` + the code to login.

## 3) Run locally (long polling)

```bash
npm i
cp .env.example .env
# edit .env to set BOT_TOKEN (WEBHOOK_SECRET not required for polling)
npm run dev:poll
```

## 4) Run locally (web UI + API)

```bash
npm i
cp .env.example .env
# edit .env to set MONGODB_URI and AUTH_SECRET
npm run dev
```

Open `http://localhost:3000/`.

## 5) Deploy to Vercel

Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.

After deploy you will have:

- `GET /` → web UI
- `GET /api/health` → health check
- `POST /api/telegram?secret=WEBHOOK_SECRET` → Telegram webhook target

## 6) Set Telegram webhook (one-time)

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
- AI parse flow: Extract items (Bajar), mileage (Fuel), and meal counts (Bachelor Mess). If details missing, bot asks follow-up.
- State management: Pending follow-ups are stored in `pending_transactions`.
- Pro Shortcuts: Use `@` for entities and `#` for accounts in any message.
- UI/API AI parse endpoint: `POST /api/ai_parse` with `{ "text": "...", "save": true|false }`.
- Settlement endpoint: `POST /api/ui_settlement` with `{ "person": "Shimul", "side": "receivable|payable", "amount": 500, "purpose": "partial return" }`.
- Advanced lenden kinds supported: `loan_given`, `loan_taken`, `fund_received`, `settlement_in`, `settlement_out`.
