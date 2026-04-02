import { useEffect, useMemo, useState } from "react";

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

export async function getServerSideProps({ req }) {
  // Gate UI sections server-side; API routes also enforce session.
  const { getSessionUserId } = require("../lib/session");
  const userId = await getSessionUserId(req);
  return { props: { loggedIn: Boolean(userId) } };
}

export default function Home({ loggedIn }) {
  const [tgId, setTgId] = useState("");
  const [code, setCode] = useState("");

  const [kind, setKind] = useState("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [loginOut, setLoginOut] = useState("");
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const canSubmit = useMemo(() => {
    return ["in", "out", "sub"].includes(kind.trim()) && amount.trim() && note.trim();
  }, [kind, amount, note]);

  async function refresh() {
    if (!loggedIn) return;
    setError("");
    try {
      const [listData, sumData] = await Promise.all([
        jsonFetch("/api/ui_ledger", { method: "GET" }),
        jsonFetch("/api/ui_summary", { method: "GET" }),
      ]);
      setEntries(Array.isArray(listData.entries) ? listData.entries : []);
      setStats(sumData);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  function formatKind(k) {
    if (k === "in") return "Earn";
    if (k === "out") return "Spend";
    if (k === "sub") return "Subscription";
    return k;
  }

  function kindBadgeStyle(k) {
    if (k === "in") return { background: "rgba(16,185,129,.12)", color: "#065f46", borderColor: "rgba(16,185,129,.22)" };
    if (k === "out") return { background: "rgba(239,68,68,.12)", color: "#7f1d1d", borderColor: "rgba(239,68,68,.22)" };
    if (k === "sub") return { background: "rgba(59,130,246,.12)", color: "#1e3a8a", borderColor: "rgba(59,130,246,.22)" };
    return { background: "rgba(107,114,128,.12)", color: "#111827", borderColor: "rgba(107,114,128,.22)" };
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 10% 0%, rgba(59,130,246,.18), transparent 60%), radial-gradient(1200px 600px at 90% 0%, rgba(16,185,129,.14), transparent 60%), #0b1220", color: "#e5e7eb" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 48px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>safiulalom_bot</h1>
            <div style={{ color: "rgba(229,231,235,.72)", fontSize: 13, marginTop: 6 }}>
              Track earn, spend, subscriptions, and balance (per-user).
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
              disabled={!loggedIn || busy}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,.25)",
                background: "rgba(15,23,42,.8)",
                color: "#e5e7eb",
                cursor: !loggedIn || busy ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div style={{ border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.12)", padding: 12, borderRadius: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Error</div>
            <div style={{ color: "rgba(229,231,235,.86)", fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</div>
          </div>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 14, alignItems: "start" }}>
          <div style={{ border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.68)", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Login</div>
                <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
                  Telegram e <code style={{ background: "rgba(255,255,255,.06)", padding: "2px 6px", borderRadius: 8 }}>/ui</code> diye code nin, tarpor ekhane login korun.
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.25)",
                  background: loggedIn ? "rgba(16,185,129,.12)" : "rgba(107,114,128,.12)",
                  color: loggedIn ? "#a7f3d0" : "rgba(229,231,235,.78)",
                }}
              >
                {loggedIn ? "Logged in" : "Locked"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Telegram User ID</div>
                <input
                  value={tgId}
                  onChange={(e) => setTgId(e.target.value)}
                  placeholder="12345678"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.2)",
                    background: "rgba(2,6,23,.6)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Login Code</div>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.2)",
                    background: "rgba(2,6,23,.6)",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button
                onClick={async () => {
                  setLoginOut("Logging in...");
                  setBusy(true);
                  setError("");
                  try {
                    const data = await jsonFetch("/api/ui_login", {
                      method: "POST",
                      body: JSON.stringify({
                        telegramUserId: tgId.trim(),
                        code: code.trim(),
                      }),
                    });
                    setLoginOut(JSON.stringify(data, null, 2));
                    window.location.reload();
                  } catch (e) {
                    setLoginOut(String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(59,130,246,.35)",
                  background: "rgba(59,130,246,.18)",
                  color: "#e5e7eb",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Login
              </button>

              <button
                onClick={async () => {
                  setLoginOut("Logging out...");
                  setBusy(true);
                  setError("");
                  try {
                    const data = await jsonFetch("/api/ui_logout", {
                      method: "POST",
                      body: "{}",
                    });
                    setLoginOut(JSON.stringify(data, null, 2));
                    window.location.reload();
                  } catch (e) {
                    setLoginOut(String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,.25)",
                  background: "rgba(2,6,23,.35)",
                  color: "#e5e7eb",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Logout
              </button>
            </div>

            {loginOut ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(2,6,23,.45)", padding: 12, borderRadius: 12, marginTop: 12, color: "rgba(229,231,235,.86)", fontSize: 12 }}>
                {loginOut}
              </pre>
            ) : null}
          </div>

          <div style={{ border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.68)", borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Overview</div>
            <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
              Summary updates from your entries.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div style={{ border: "1px solid rgba(148,163,184,.14)", background: "rgba(2,6,23,.35)", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12 }}>This month net</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
                  {loggedIn && stats && stats.month ? stats.month.net : "--"}
                </div>
                <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
                  Earn {loggedIn && stats && stats.month ? stats.month.income : "--"} / Spend {loggedIn && stats && stats.month ? stats.month.expense : "--"}
                </div>
              </div>
              <div style={{ border: "1px solid rgba(148,163,184,.14)", background: "rgba(2,6,23,.35)", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12 }}>All-time balance</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
                  {loggedIn && stats && stats.allTime ? stats.allTime.net : "--"}
                </div>
                <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
                  Earn {loggedIn && stats && stats.allTime ? stats.allTime.income : "--"} / Spend {loggedIn && stats && stats.allTime ? stats.allTime.expense : "--"}
                </div>
              </div>
            </div>

            {!loggedIn ? (
              <div style={{ marginTop: 12, color: "rgba(229,231,235,.72)", fontSize: 12 }}>
                Login required to view stats.
              </div>
            ) : null}
          </div>
        </section>

        {loggedIn ? (
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div style={{ border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.68)", borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Add entry</div>
                  <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
                    Earn/spend/subscription track korun.
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Type</div>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,.2)",
                      background: "rgba(2,6,23,.6)",
                      color: "#e5e7eb",
                      outline: "none",
                    }}
                  >
                    <option value="in">Earn</option>
                    <option value="out">Spend</option>
                    <option value="sub">Subscription</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Amount</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,.2)",
                      background: "rgba(2,6,23,.6)",
                      color: "#e5e7eb",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Note</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="gazi theke nilam / bajar / Netflix"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.2)",
                    background: "rgba(2,6,23,.6)",
                    color: "#e5e7eb",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await jsonFetch("/api/ui_ledger", {
                        method: "POST",
                        body: JSON.stringify({
                          kind: kind.trim(),
                          amount: amount.trim(),
                          note: note.trim(),
                        }),
                      });
                      setAmount("");
                      setNote("");
                      await refresh();
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={!canSubmit || busy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(16,185,129,.35)",
                    background: "rgba(16,185,129,.14)",
                    color: "#e5e7eb",
                    cursor: !canSubmit || busy ? "not-allowed" : "pointer",
                  }}
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setKind("out");
                    setAmount("");
                    setNote("");
                  }}
                  disabled={busy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,.25)",
                    background: "rgba(2,6,23,.35)",
                    color: "#e5e7eb",
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.68)", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Recent entries</div>
              <div style={{ color: "rgba(229,231,235,.7)", fontSize: 12, marginTop: 6 }}>
                Manage your latest entries (edit/delete).
              </div>

              <div style={{ marginTop: 12, overflow: "auto", border: "1px solid rgba(148,163,184,.14)", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                  <thead>
                    <tr style={{ background: "rgba(2,6,23,.45)" }}>
                      <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(229,231,235,.75)", borderBottom: "1px solid rgba(148,163,184,.14)" }}>Type</th>
                      <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(229,231,235,.75)", borderBottom: "1px solid rgba(148,163,184,.14)" }}>Amount</th>
                      <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(229,231,235,.75)", borderBottom: "1px solid rgba(148,163,184,.14)" }}>Note</th>
                      <th style={{ textAlign: "left", padding: 10, fontSize: 12, color: "rgba(229,231,235,.75)", borderBottom: "1px solid rgba(148,163,184,.14)" }}>Date</th>
                      <th style={{ textAlign: "right", padding: 10, fontSize: 12, color: "rgba(229,231,235,.75)", borderBottom: "1px solid rgba(148,163,184,.14)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length ? (
                      entries.map((e) => (
                        <tr key={e.id} style={{ borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                          <td style={{ padding: 10 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid", ...kindBadgeStyle(e.kind) }}>
                              {formatKind(e.kind)}
                            </span>
                          </td>
                          <td style={{ padding: 10, fontWeight: 700 }}>{String(e.amount)}</td>
                          <td style={{ padding: 10, color: "rgba(229,231,235,.88)" }}>{e.note}</td>
                          <td style={{ padding: 10, color: "rgba(229,231,235,.72)", fontSize: 12 }}>
                            {e.created_at ? new Date(e.created_at).toISOString().slice(0, 10) : "--"}
                          </td>
                          <td style={{ padding: 10, textAlign: "right" }}>
                            <button
                              onClick={() => {
                                setEditId(e.id);
                                setEditAmount(String(e.amount));
                                setEditNote(e.note);
                              }}
                              disabled={busy}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid rgba(148,163,184,.25)",
                                background: "rgba(2,6,23,.35)",
                                color: "#e5e7eb",
                                cursor: busy ? "not-allowed" : "pointer",
                                marginRight: 8,
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Delete this entry?")) return;
                                setBusy(true);
                                setError("");
                                try {
                                  await jsonFetch(`/api/ui_ledger?id=${encodeURIComponent(e.id)}`, { method: "DELETE" });
                                  await refresh();
                                } catch (ex) {
                                  setError(String(ex));
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              disabled={busy}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid rgba(239,68,68,.35)",
                                background: "rgba(239,68,68,.12)",
                                color: "#fecaca",
                                cursor: busy ? "not-allowed" : "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: 14, color: "rgba(229,231,235,.72)", fontSize: 12 }}>
                          No entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {editId ? (
                <div style={{ marginTop: 12, border: "1px solid rgba(148,163,184,.18)", background: "rgba(2,6,23,.35)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Edit entry</div>
                    <button
                      onClick={() => {
                        setEditId("");
                        setEditAmount("");
                        setEditNote("");
                      }}
                      disabled={busy}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,.25)",
                        background: "transparent",
                        color: "rgba(229,231,235,.8)",
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Amount</div>
                      <input
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid rgba(148,163,184,.2)",
                          background: "rgba(2,6,23,.6)",
                          color: "#e5e7eb",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "rgba(229,231,235,.7)", marginBottom: 6 }}>Note</div>
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid rgba(148,163,184,.2)",
                          background: "rgba(2,6,23,.6)",
                          color: "#e5e7eb",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          await jsonFetch("/api/ui_ledger", {
                            method: "PATCH",
                            body: JSON.stringify({ id: editId, amount: editAmount.trim(), note: editNote.trim() }),
                          });
                          setEditId("");
                          setEditAmount("");
                          setEditNote("");
                          await refresh();
                        } catch (ex) {
                          setError(String(ex));
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(59,130,246,.35)",
                        background: "rgba(59,130,246,.16)",
                        color: "#e5e7eb",
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <footer style={{ marginTop: 18, color: "rgba(229,231,235,.55)", fontSize: 12 }}>
          Tip: Telegram e <code style={{ background: "rgba(255,255,255,.06)", padding: "2px 6px", borderRadius: 8 }}>/help</code> for commands.
        </footer>
      </main>
    </div>
  );
}
