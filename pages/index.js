import { useState } from "react";

async function jsonFetch(path, opts) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error((data && data.error) || text || `HTTP ${res.status}`);
  return data;
}

export default function Home() {
  const [tgId, setTgId] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [loginOut, setLoginOut] = useState("");
  const [addOut, setAddOut] = useState("");
  const [listOut, setListOut] = useState("");
  const [sumOut, setSumOut] = useState("");

  return (
    <main style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1>safiulalom_bot UI</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Login code pete Telegram e <code>/ui</code> command use korun.
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "14px 0" }}>
        <h2>Login</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Telegram User ID</label>
            <input value={tgId} onChange={(e) => setTgId(e.target.value)} placeholder="12345678" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
          </div>
          <div>
            <label>Login Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
          </div>
        </div>
        <p>
          <button
            onClick={async () => {
              setLoginOut("Logging in...");
              try {
                const data = await jsonFetch("/api/ui_login", { method: "POST", body: JSON.stringify({ telegramUserId: tgId.trim(), code: code.trim() }) });
                setLoginOut(JSON.stringify(data, null, 2));
              } catch (e) {
                setLoginOut(String(e));
              }
            }}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Login
          </button>{" "}
          <button
            onClick={async () => {
              setLoginOut("Logging out...");
              try {
                const data = await jsonFetch("/api/ui_logout", { method: "POST", body: "{}" });
                setLoginOut(JSON.stringify(data, null, 2));
              } catch (e) {
                setLoginOut(String(e));
              }
            }}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Logout
          </button>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: 12, borderRadius: 10 }}>{loginOut}</pre>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "14px 0" }}>
        <h2>Add entry</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Kind</label>
            <input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="in | out | sub" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
          </div>
          <div>
            <label>Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
          </div>
        </div>
        <p>
          <label>Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="gazi theke nilam / bajar / Netflix" style={{ width: "100%", padding: 10, boxSizing: "border-box" }} />
        </p>
        <p>
          <button
            onClick={async () => {
              setAddOut("Saving...");
              try {
                const data = await jsonFetch("/api/ui_ledger", { method: "POST", body: JSON.stringify({ kind: kind.trim(), amount: amount.trim(), note: note.trim() }) });
                setAddOut(JSON.stringify(data, null, 2));
              } catch (e) {
                setAddOut(String(e));
              }
            }}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Save
          </button>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: 12, borderRadius: 10 }}>{addOut}</pre>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "14px 0" }}>
        <h2>Recent</h2>
        <p>
          <button
            onClick={async () => {
              setListOut("Loading...");
              try {
                const data = await jsonFetch("/api/ui_ledger", { method: "GET" });
                setListOut(JSON.stringify(data, null, 2));
              } catch (e) {
                setListOut(String(e));
              }
            }}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Refresh
          </button>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: 12, borderRadius: 10 }}>{listOut}</pre>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "14px 0" }}>
        <h2>Summary (this month)</h2>
        <p>
          <button
            onClick={async () => {
              setSumOut("Loading...");
              try {
                const data = await jsonFetch("/api/ui_summary", { method: "GET" });
                setSumOut(JSON.stringify(data, null, 2));
              } catch (e) {
                setSumOut(String(e));
              }
            }}
            style={{ padding: 10, cursor: "pointer" }}
          >
            Refresh
          </button>
        </p>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f7f7f7", padding: 12, borderRadius: 10 }}>{sumOut}</pre>
      </section>
    </main>
  );
}

