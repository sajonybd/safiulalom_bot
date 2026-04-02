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

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function getServerSideProps({ req }) {
  const { getSessionUserId } = require("../lib/session");
  const userId = await getSessionUserId(req);
  return { props: { loggedIn: Boolean(userId) } };
}

export default function Home({ loggedIn }) {
  const [tgId, setTgId] = useState("");
  const [code, setCode] = useState("");
  const [loginOut, setLoginOut] = useState("");

  const [kind, setKind] = useState("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const [personName, setPersonName] = useState("");
  const [personDirection, setPersonDirection] = useState("person_out");
  const [personAmount, setPersonAmount] = useState("");
  const [personPurpose, setPersonPurpose] = useState("");
  const [personDate, setPersonDate] = useState(todayISO());

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [people, setPeople] = useState([]);
  const [selectedPersonKey, setSelectedPersonKey] = useState("");
  const [personHistory, setPersonHistory] = useState([]);
  const [selectedPersonSummary, setSelectedPersonSummary] = useState(null);

  const [editId, setEditId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPerson, setEditPerson] = useState("");
  const [editDate, setEditDate] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canSaveGeneral = useMemo(
    () =>
      ["in", "out", "sub"].includes(kind.trim()) &&
      amount.trim() &&
      note.trim(),
    [kind, amount, note]
  );

  const canSavePerson = useMemo(
    () =>
      ["person_in", "person_out"].includes(personDirection) &&
      personName.trim() &&
      personAmount.trim() &&
      personPurpose.trim(),
    [personDirection, personName, personAmount, personPurpose]
  );

  async function refreshDashboard() {
    if (!loggedIn) return;
    const [generalList, summaryData, peopleData] = await Promise.all([
      jsonFetch("/api/ui_ledger?scope=general&limit=40"),
      jsonFetch("/api/ui_summary"),
      jsonFetch("/api/ui_people"),
    ]);

    setEntries(Array.isArray(generalList.entries) ? generalList.entries : []);
    setStats(summaryData || null);
    const peopleRows = Array.isArray(peopleData.people) ? peopleData.people : [];
    setPeople(peopleRows);

    if (selectedPersonKey) {
      const detail = await jsonFetch(
        `/api/ui_people?person=${encodeURIComponent(selectedPersonKey)}`
      );
      setSelectedPersonSummary(detail.person || null);
      setPersonHistory(Array.isArray(detail.history) ? detail.history : []);
    }
  }

  useEffect(() => {
    if (!loggedIn) return;
    void refreshDashboard().catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  async function selectPerson(personKey) {
    setSelectedPersonKey(personKey);
    setBusy(true);
    setError("");
    try {
      const detail = await jsonFetch(
        `/api/ui_people?person=${encodeURIComponent(personKey)}`
      );
      setSelectedPersonSummary(detail.person || null);
      setPersonHistory(Array.isArray(detail.history) ? detail.history : []);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneralEntry() {
    if (!canSaveGeneral) return;
    setBusy(true);
    setError("");
    try {
      await jsonFetch("/api/ui_ledger", {
        method: "POST",
        body: JSON.stringify({
          kind: kind.trim(),
          amount: amount.trim(),
          note: note.trim(),
          date: date || undefined,
        }),
      });
      setAmount("");
      setNote("");
      await refreshDashboard();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function savePersonEntry() {
    if (!canSavePerson) return;
    setBusy(true);
    setError("");
    try {
      await jsonFetch("/api/ui_ledger", {
        method: "POST",
        body: JSON.stringify({
          kind: personDirection,
          person: personName.trim(),
          amount: personAmount.trim(),
          note: personPurpose.trim(),
          date: personDate || undefined,
        }),
      });
      setPersonAmount("");
      setPersonPurpose("");
      await refreshDashboard();
      if (selectedPersonKey) await selectPerson(selectedPersonKey);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id) {
    setBusy(true);
    setError("");
    try {
      await jsonFetch(`/api/ui_ledger?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await refreshDashboard();
      if (selectedPersonKey) await selectPerson(selectedPersonKey);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editId) return;
    setBusy(true);
    setError("");
    try {
      await jsonFetch("/api/ui_ledger", {
        method: "PATCH",
        body: JSON.stringify({
          id: editId,
          amount: editAmount || undefined,
          note: editNote || undefined,
          person: editPerson || undefined,
          date: editDate || undefined,
        }),
      });
      setEditId("");
      setEditAmount("");
      setEditNote("");
      setEditPerson("");
      setEditDate("");
      await refreshDashboard();
      if (selectedPersonKey) await selectPerson(selectedPersonKey);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="hero">
        <h1>Personal Ledger</h1>
        <p>
          Earn, spend, and person-to-person transaction tracking with clear
          balances.
        </p>
      </div>

      {!loggedIn ? (
        <section className="card">
          <h2>Login</h2>
          <p className="hint">
            Telegram bot e <code>/ui</code> pathale login code paben.
          </p>
          <div className="grid two">
            <label>
              Telegram User ID
              <input
                value={tgId}
                onChange={(e) => setTgId(e.target.value)}
                placeholder="12345678"
              />
            </label>
            <label>
              Login Code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
              />
            </label>
          </div>
          <div className="row">
            <button
              className="btn primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setLoginOut("Logging in...");
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
            >
              Login
            </button>
          </div>
          {loginOut ? <pre className="out">{loginOut}</pre> : null}
        </section>
      ) : (
        <>
          <section className="stats">
            <div className="stat">
              <h3>This Month Balance</h3>
              <strong>{stats && stats.month ? stats.month.net : "--"}</strong>
              <small>
                Earn {stats && stats.month ? stats.month.income : "--"} | Spend{" "}
                {stats && stats.month ? stats.month.expense : "--"}
              </small>
            </div>
            <div className="stat">
              <h3>All-Time Balance</h3>
              <strong>{stats && stats.allTime ? stats.allTime.net : "--"}</strong>
              <small>
                Earn {stats && stats.allTime ? stats.allTime.income : "--"} |
                Spend {stats && stats.allTime ? stats.allTime.expense : "--"}
              </small>
            </div>
            <div className="stat">
              <h3>People Count</h3>
              <strong>{people.length}</strong>
              <small>Tracked people in transactions</small>
            </div>
          </section>

          {error ? <section className="error">{error}</section> : null}

          <section className="grid two">
            <div className="card">
              <h2>General Entry</h2>
              <p className="hint">
                Regular income/expense/subscription add korte parben.
              </p>
              <label>
                Type
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="in">Earn (in)</option>
                  <option value="out">Spend (out)</option>
                  <option value="sub">Subscription (sub)</option>
                </select>
              </label>
              <label>
                Amount
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                />
              </label>
              <label>
                Purpose / Note
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="what for?"
                />
              </label>
              <label>
                Date (old missing transaction add possible)
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <div className="row">
                <button
                  className="btn primary"
                  disabled={!canSaveGeneral || busy}
                  onClick={saveGeneralEntry}
                >
                  Save General Entry
                </button>
              </div>
            </div>

            <div className="card">
              <h2>Person Transaction</h2>
              <p className="hint">
                Person-wise lenden. Balance auto calculate hobe.
              </p>
              <label>
                Person Name
                <input
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ma / Vaiya / Friend"
                />
              </label>
              <label>
                Direction
                <select
                  value={personDirection}
                  onChange={(e) => setPersonDirection(e.target.value)}
                >
                  <option value="person_out">
                    I gave this person (Ami pabo)
                  </option>
                  <option value="person_in">
                    Person gave me (Ami debo)
                  </option>
                </select>
              </label>
              <label>
                Amount
                <input
                  value={personAmount}
                  onChange={(e) => setPersonAmount(e.target.value)}
                  placeholder="1000"
                />
              </label>
              <label>
                Purpose
                <input
                  value={personPurpose}
                  onChange={(e) => setPersonPurpose(e.target.value)}
                  placeholder="loan / shopping / medicine"
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={personDate}
                  onChange={(e) => setPersonDate(e.target.value)}
                />
              </label>
              <div className="row">
                <button
                  className="btn primary"
                  disabled={!canSavePerson || busy}
                  onClick={savePersonEntry}
                >
                  Save Person Entry
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>People Balances</h2>
            <p className="hint">
              Net {">"} 0 hole ami pabo, Net {"<"} 0 hole ami debo.
            </p>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Ami pabo</th>
                    <th>Ami debo</th>
                    <th>Net</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {people.length ? (
                    people.map((p) => (
                      <tr
                        key={p.person_key}
                        className={
                          selectedPersonKey === p.person_key ? "activeRow" : ""
                        }
                        onClick={() => void selectPerson(p.person_key)}
                      >
                        <td>{p.person}</td>
                        <td>{p.receivable}</td>
                        <td>{p.payable}</td>
                        <td>{p.net}</td>
                        <td>{p.count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No person transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid two">
            <div className="card">
              <h2>Selected Person History</h2>
              {!selectedPersonKey ? (
                <p className="hint">Select a person row to see full history.</p>
              ) : (
                <>
                  <p className="hint">
                    {selectedPersonSummary
                      ? `${selectedPersonSummary.person} | Ami pabo: ${selectedPersonSummary.receivable} | Ami debo: ${selectedPersonSummary.payable} | Net: ${selectedPersonSummary.net}`
                      : "No summary"}
                  </p>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Direction</th>
                          <th>Amount</th>
                          <th>Purpose</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personHistory.length ? (
                          personHistory.map((e) => (
                            <tr key={e.id}>
                              <td>{fmtDate(e.created_at)}</td>
                              <td>
                                {e.kind === "person_out"
                                  ? "I gave (Ami pabo)"
                                  : "I got (Ami debo)"}
                              </td>
                              <td>{e.amount}</td>
                              <td>{e.note}</td>
                              <td>
                                <button
                                  className="btn danger small"
                                  disabled={busy}
                                  onClick={() => void removeEntry(e.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>No history.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h2>Edit Any Entry</h2>
              <p className="hint">
                ID diye old entry update korte parben (amount/note/person/date).
              </p>
              <label>
                Entry ID
                <input
                  value={editId}
                  onChange={(e) => setEditId(e.target.value)}
                  placeholder="24-char id"
                />
              </label>
              <label>
                Amount (optional)
                <input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="amount"
                />
              </label>
              <label>
                Note (optional)
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="updated purpose"
                />
              </label>
              <label>
                Person (optional)
                <input
                  value={editPerson}
                  onChange={(e) => setEditPerson(e.target.value)}
                  placeholder="name for person transactions"
                />
              </label>
              <label>
                Date (optional)
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </label>
              <div className="row">
                <button
                  className="btn primary"
                  disabled={!editId.trim() || busy}
                  onClick={saveEdit}
                >
                  Save Edit
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>General History</h2>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length ? (
                    entries.map((e) => (
                      <tr key={e.id}>
                        <td>{fmtDate(e.created_at)}</td>
                        <td>{e.kind}</td>
                        <td>{e.amount}</td>
                        <td>{e.note}</td>
                        <td>
                          <button
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => void removeEntry(e.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          padding: 20px 14px 40px;
          font-family: "Manrope", "Segoe UI", Arial, sans-serif;
        }
        .hero {
          max-width: 1100px;
          margin: 0 auto 14px;
        }
        .hero h1 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.02em;
        }
        .hero p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 14px;
        }
        .card,
        .stats,
        .error {
          max-width: 1100px;
          margin: 12px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          background: transparent;
          border: 0;
          box-shadow: none;
          padding: 0;
        }
        .stat {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }
        .stat h3 {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .stat strong {
          display: block;
          margin-top: 10px;
          font-size: 22px;
          letter-spacing: -0.02em;
        }
        .stat small {
          display: block;
          margin-top: 8px;
          color: #475569;
          font-size: 12px;
        }
        .grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          gap: 12px;
        }
        .grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.01em;
        }
        .hint {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 13px;
        }
        label {
          display: block;
          margin-top: 10px;
          font-size: 12px;
          color: #475569;
        }
        input,
        select {
          width: 100%;
          margin-top: 6px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
          background: #ffffff;
          color: #0f172a;
          outline: none;
        }
        input:focus,
        select:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.14);
        }
        .row {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          padding: 9px 12px;
          cursor: pointer;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn.primary {
          background: #0ea5e9;
          border-color: #0284c7;
          color: #ffffff;
        }
        .btn.danger {
          background: #ef4444;
          border-color: #dc2626;
          color: #ffffff;
        }
        .btn.small {
          padding: 6px 10px;
          font-size: 12px;
        }
        .tableWrap {
          overflow: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
          background: #ffffff;
        }
        th,
        td {
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        th {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #f8fafc;
        }
        .activeRow {
          background: #f0f9ff;
        }
        .activeRow td {
          border-bottom-color: #bae6fd;
        }
        .activeRow:hover {
          background: #e0f2fe;
        }
        tbody tr:hover {
          background: #f8fafc;
        }
        .error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
        }
        .out {
          white-space: pre-wrap;
          word-break: break-word;
          margin-top: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 10px;
          padding: 10px;
          font-size: 12px;
          color: #334155;
        }
        @media (max-width: 920px) {
          .grid.two,
          .stats {
            grid-template-columns: 1fr;
          }
          .hero h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </main>
  );
}

