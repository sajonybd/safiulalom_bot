const express = require("express");
const { getBot } = require("./bot");
const { verifyAndConsumeLoginCode } = require("./ui_login");
const { createSession, buildSessionCookie, getSessionTokenFromReq, clearSession, getSessionUserId } = require("./session");
const { getDb } = require("./db");
const { parseAmount, addEntry, listEntries, formatMoney, summary } = require("./ledger");

function createHealthApp() {
  const app = express();
  app.get("/", (_req, res) => {
    res.json({ ok: true, service: "safiulalom_bot" });
  });
  return app;
}

function createTelegramApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  function requireSecretIfConfigured(req, res) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return true;
    const provided = req.query && req.query.secret;
    if (provided !== secret) {
      res.status(401).send("Unauthorized");
      return false;
    }
    return true;
  }

  app.get("/", (_req, res) => {
    res.status(200).type("text").send("Send POST updates from Telegram to this endpoint.");
  });

  app.post("/", async (req, res) => {
    if (!requireSecretIfConfigured(req, res)) return;
    try {
      const update = req.body;
      if (!update || typeof update !== "object") {
        res.status(400).send("Missing update payload");
        return;
      }
      const bot = getBot();
      await bot.handleUpdate(update);
      res.status(200).send("OK");
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  return app;
}

function createUiApp() {
  const app = express();
  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>safiulalom_bot UI</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 900px; margin: 24px auto; padding: 0 16px; }
      input, button, textarea { font: inherit; padding: 10px; }
      input, textarea { width: 100%; box-sizing: border-box; }
      button { cursor: pointer; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin: 14px 0; }
      pre { white-space: pre-wrap; word-break: break-word; background: #f7f7f7; padding: 12px; border-radius: 10px; }
      .muted { color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>safiulalom_bot UI</h1>
    <p class="muted">Login code pete Telegram e <code>/ui</code> command use korun.</p>

    <div class="card">
      <h2>Login</h2>
      <div class="row">
        <div>
          <label>Telegram User ID</label>
          <input id="tgId" placeholder="12345678" />
        </div>
        <div>
          <label>Login Code</label>
          <input id="code" placeholder="6-digit" />
        </div>
      </div>
      <p><button id="loginBtn">Login</button> <button id="logoutBtn">Logout</button></p>
      <pre id="loginOut"></pre>
    </div>

    <div class="card">
      <h2>Add entry</h2>
      <div class="row">
        <div>
          <label>Kind</label>
          <input id="kind" placeholder="in | out | sub" />
        </div>
        <div>
          <label>Amount</label>
          <input id="amount" placeholder="500" />
        </div>
      </div>
      <p>
        <label>Note</label>
        <textarea id="note" rows="2" placeholder="gazi theke nilam / bajar / Netflix"></textarea>
      </p>
      <p><button id="addBtn">Save</button></p>
      <pre id="addOut"></pre>
    </div>

    <div class="card">
      <h2>Recent</h2>
      <p><button id="listBtn">Refresh</button></p>
      <pre id="listOut"></pre>
    </div>

    <div class="card">
      <h2>Summary (this month)</h2>
      <p><button id="sumBtn">Refresh</button></p>
      <pre id="sumOut"></pre>
    </div>

    <script>
      async function jsonFetch(path, opts) {
        const res = await fetch(path, Object.assign({ headers: { "content-type": "application/json" } }, opts || {}));
        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
        if (!res.ok) throw new Error((data && data.error) || text || ("HTTP " + res.status));
        return data;
      }

      const $ = (id) => document.getElementById(id);

      $("loginBtn").onclick = async () => {
        $("loginOut").textContent = "Logging in...";
        try {
          const telegramUserId = $("tgId").value.trim();
          const code = $("code").value.trim();
          const data = await jsonFetch("/api/ui_login", { method: "POST", body: JSON.stringify({ telegramUserId, code }) });
          $("loginOut").textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          $("loginOut").textContent = String(e);
        }
      };

      $("logoutBtn").onclick = async () => {
        $("loginOut").textContent = "Logging out...";
        try {
          const data = await jsonFetch("/api/ui_logout", { method: "POST", body: "{}" });
          $("loginOut").textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          $("loginOut").textContent = String(e);
        }
      };

      $("addBtn").onclick = async () => {
        $("addOut").textContent = "Saving...";
        try {
          const kind = $("kind").value.trim();
          const amount = $("amount").value.trim();
          const note = $("note").value.trim();
          const data = await jsonFetch("/api/ui_ledger", { method: "POST", body: JSON.stringify({ kind, amount, note }) });
          $("addOut").textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          $("addOut").textContent = String(e);
        }
      };

      $("listBtn").onclick = async () => {
        $("listOut").textContent = "Loading...";
        try {
          const data = await jsonFetch("/api/ui_ledger", { method: "GET" });
          $("listOut").textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          $("listOut").textContent = String(e);
        }
      };

      $("sumBtn").onclick = async () => {
        $("sumOut").textContent = "Loading...";
        try {
          const data = await jsonFetch("/api/ui_summary", { method: "GET" });
          $("sumOut").textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          $("sumOut").textContent = String(e);
        }
      };
    </script>
  </body>
</html>`
      );
  });
  return app;
}

function createUiLoginApp() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));

  app.post("/", async (req, res) => {
    try {
      const telegramUserId = Number(req.body && req.body.telegramUserId);
      const code = String((req.body && req.body.code) || "").trim();
      if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0 || !code) {
        res.status(400).json({ ok: false, error: "Invalid telegramUserId/code" });
        return;
      }

      const verified = await verifyAndConsumeLoginCode({ telegramUserId, code });
      if (!verified.ok) {
        res.status(401).json({ ok: false, error: "Invalid or expired code" });
        return;
      }

      const db = await getDb();
      await db.collection("users").updateOne(
        { telegram_user_id: telegramUserId },
        { $setOnInsert: { telegram_user_id: telegramUserId, created_at: new Date() } },
        { upsert: true }
      );

      const token = await createSession({ userId: telegramUserId });
      res.setHeader("set-cookie", buildSessionCookie(token));
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  return app;
}

function createUiLogoutApp() {
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.post("/", async (req, res) => {
    try {
      const token = getSessionTokenFromReq(req);
      await clearSession(token);
      res.setHeader(
        "set-cookie",
        "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" +
          (process.env.NODE_ENV === "production" ? "; Secure" : "")
      );
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  return app;
}

function createUiLedgerApp() {
  const app = express();
  app.use(express.json({ limit: "64kb" }));

  app.get("/", async (req, res) => {
    try {
      const userId = await getSessionUserId(req);
      if (!userId) {
        res.status(401).json({ ok: false, error: "Not logged in" });
        return;
      }

      const entries = await listEntries({ userId, limit: 20 });
      res.status(200).json({ ok: true, entries });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  app.post("/", async (req, res) => {
    try {
      const userId = await getSessionUserId(req);
      if (!userId) {
        res.status(401).json({ ok: false, error: "Not logged in" });
        return;
      }

      const kind = String((req.body && req.body.kind) || "").trim();
      if (!["in", "out", "sub"].includes(kind)) {
        res.status(400).json({ ok: false, error: "kind must be in|out|sub" });
        return;
      }

      const amount = parseAmount(req.body && req.body.amount);
      const note = String((req.body && req.body.note) || "").trim();
      if (amount === null || !note) {
        res.status(400).json({ ok: false, error: "amount and note are required" });
        return;
      }

      const { id } = await addEntry({
        userId,
        chatId: null,
        kind,
        amount,
        note,
        rawText: null,
      });

      res.status(200).json({
        ok: true,
        id,
        saved: { kind, amount: formatMoney(amount), note },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  return app;
}

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { from, to };
}

function createUiSummaryApp() {
  const app = express();

  app.get("/", async (req, res) => {
    try {
      const userId = await getSessionUserId(req);
      if (!userId) {
        res.status(401).json({ ok: false, error: "Not logged in" });
        return;
      }

      const { from, to } = monthRange(new Date());
      const s = await summary({ userId, from, to });
      res.status(200).json({
        ok: true,
        summary: {
          income: formatMoney(s.income),
          expenseOut: formatMoney(s.expenseOut),
          expenseSub: formatMoney(s.expenseSub),
          net: formatMoney(s.net),
          counts: s.counts,
        },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  });

  return app;
}

module.exports = {
  createHealthApp,
  createTelegramApp,
  createUiApp,
  createUiLoginApp,
  createUiLogoutApp,
  createUiLedgerApp,
  createUiSummaryApp,
};

