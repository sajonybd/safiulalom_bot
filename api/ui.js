const express = require("express");

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

module.exports = app;

