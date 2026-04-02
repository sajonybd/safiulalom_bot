import Link from "next/link";
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function toNum(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value) {
  const n = toNum(value);
  const sign = n < 0 ? "-" : "";
  return `৳${sign}${Math.abs(n).toLocaleString("en-BD")}`;
}

function inferRelation(name) {
  const text = String(name || "").toLowerCase();
  if (/wife|bou|sanjida|pria|stri|spouse/.test(text)) return "Family";
  if (/kid|child|son|daughter|humayra|baby/.test(text)) return "Family";
  if (/office|boss|colleague|manager|team/.test(text)) return "Work";
  return "Other";
}

function relationLabel(name) {
  const relation = inferRelation(name);
  if (relation === "Family") return "Family";
  if (relation === "Work") return "Work";
  return "Other";
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function walletLabel(key) {
  const map = {
    bank: "Bank",
    bkash: "bKash",
    cash: "Cash",
    nagad: "Nagad",
  };
  return map[key] || key.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function walletMark(key) {
  const map = {
    bank: "BNK",
    bkash: "BKS",
    cash: "CSH",
    nagad: "NGD",
  };
  return map[key] || key.slice(0, 3).toUpperCase();
}

function categoryFromText(text) {
  const note = String(text || "").toLowerCase();
  if (/fuel|bike|oil|odometer|odo/.test(note)) return "Fuel";
  if (/hotel|travel|bus|train|flight/.test(note)) return "Travel";
  if (/medicine|doctor|pharma|clinic/.test(note)) return "Medicine";
  if (/school|tuition|book|exam/.test(note)) return "Education";
  if (/grocery|bajar|market|shopping|bazar/.test(note)) return "Shopping";
  if (/electric|water|gas|internet|utility|bill/.test(note)) return "Bills";
  if (/food|dinner|lunch|breakfast|restaurant|tea/.test(note)) return "Food";
  return "Other";
}

function detectPending(entries) {
  const out = [];
  for (const entry of entries) {
    const note = String(entry.note || "");
    const lower = note.toLowerCase();
    if (/hotel/.test(lower) && !/where:|place:|#place/.test(lower)) {
      out.push({
        key: `${entry.id}:hotel`,
        entry,
        prompt: `You spent ${formatMoney(entry.amount)} at a hotel. Which one?`,
        placeholder: "e.g. place: Star Kabab",
      });
    }
    if (/bike|fuel|oil/.test(lower) && !/odo|odometer|km\s*\d+/.test(lower)) {
      out.push({
        key: `${entry.id}:odo`,
        entry,
        prompt: "Bike fuel/oil log found, but odometer is missing.",
        placeholder: "e.g. odo 12840",
      });
    }
  }
  return out.slice(0, 4);
}

function buildWallets(entries) {
  const base = ["bank", "bkash", "cash", "nagad"];
  const map = new Map(base.map((key) => [key, { key, label: walletLabel(key), mark: walletMark(key), balance: 0, tx: 0 }]));

  const ensure = (key) => {
    const normalized = normalizeKey(key);
    if (!normalized) return map.get("cash");
    if (!map.has(normalized)) {
      map.set(normalized, {
        key: normalized,
        label: walletLabel(normalized),
        mark: walletMark(normalized),
        balance: 0,
        tx: 0,
      });
    }
    return map.get(normalized);
  };

  for (const entry of entries) {
    const amount = toNum(entry.amount);
    const source = normalizeKey(entry.source_account);
    const destination = normalizeKey(entry.destination_account);
    const textKey = normalizeKey(
      String(entry.note || "")
        .match(/(?:#|account:|wallet:)([a-z0-9_-]+)/i)?.[1] || ""
    );

    const primary = destination || source || textKey || "cash";
    const wallet = ensure(primary);

    if (source && destination) {
      ensure(source).balance -= amount;
      ensure(source).tx += 1;
      ensure(destination).balance += amount;
      ensure(destination).tx += 1;
      continue;
    }

    if (entry.kind === "in" || entry.kind === "settlement_in" || entry.kind === "fund_received") {
      wallet.balance += amount;
      wallet.tx += 1;
      continue;
    }

    if (entry.kind === "out" || entry.kind === "sub" || entry.kind === "settlement_out" || entry.kind === "loan_given") {
      wallet.balance -= amount;
      wallet.tx += 1;
      continue;
    }

    wallet.tx += 1;
  }

  return Array.from(map.values()).sort((a, b) => {
    const order = { bank: 0, bkash: 1, cash: 2, nagad: 3 };
    const ao = order[a.key] ?? 99;
    const bo = order[b.key] ?? 99;
    if (ao !== bo) return ao - bo;
    return a.label.localeCompare(b.label);
  });
}

function buildExpenseMix(summary) {
  const month = summary?.month;
  if (!month) return [];
  const items = [
    { label: "Income", value: toNum(month.income), accent: "good" },
    { label: "Expense", value: toNum(month.expenseOut), accent: "bad" },
    { label: "Subs", value: toNum(month.expenseSub), accent: "warn" },
  ];
  const max = Math.max(1, ...items.map((item) => item.value));
  return items.map((item) => ({ ...item, ratio: Math.max(8, Math.round((item.value / max) * 100)) }));
}

function buildFuelBars(entries) {
  const rows = entries
    .filter((entry) => /bike|fuel|oil/i.test(String(entry.note || "")))
    .slice(0, 6)
    .reverse();
  const bars = rows.map((row) => ({
    id: row.id,
    label: fmtDate(row.created_at).slice(5),
    value: toNum(row.amount),
  }));
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return bars.map((bar) => ({ ...bar, ratio: Math.max(10, Math.round((bar.value / max) * 100)) }));
}

function buildExplorer(people, entries) {
  const groups = {
    Family: [],
    Work: [],
    Other: [],
  };

  const historyMap = new Map();
  for (const entry of entries) {
    if (!entry.person_key) continue;
    const key = entry.person_key;
    if (!historyMap.has(key)) historyMap.set(key, []);
    historyMap.get(key).push(entry);
  }

  for (const person of people) {
    const group = relationLabel(person.person);
    const history = historyMap.get(person.person_key) || [];
    const categories = Array.from(new Set(history.map((item) => categoryFromText(item.note)).filter((cat) => cat !== "Other")));
    groups[group].push({ ...person, categories, relation: inferRelation(person.person) });
  }

  return groups;
}

function moneyToText(n) {
  return `${n >= 0 ? "+" : "-"}${formatMoney(n)}`;
}

function SectionCard({ id, title, subtitle, right, children, className = "" }) {
  return (
    <section id={id} className={`panel ${className}`.trim()}>
      <div className="panelHead">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, note, tone = "neutral" }) {
  return (
    <div className={`statCard ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function WalletCard({ wallet, onTransfer, onAdjust }) {
  const tone = wallet.key === "bkash" ? "pink" : wallet.key === "bank" ? "blue" : wallet.key === "cash" ? "green" : "amber";
  return (
    <div className={`walletCard ${tone}`}>
      <div className="walletTop">
        <div className="walletMark">{wallet.mark}</div>
        <span>{wallet.tx} tx</span>
      </div>
      <p>{wallet.label}</p>
      <strong>{formatMoney(wallet.balance)}</strong>
      <div className="walletActions">
        <button className="ghostBtn" onClick={onAdjust}>Adjust</button>
        <button className="solidBtn" onClick={onTransfer}>Transfer</button>
      </div>
    </div>
  );
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [people, setPeople] = useState([]);
  const [entries, setEntries] = useState([]);

  const [selectedPersonKey, setSelectedPersonKey] = useState("");
  const [settlingPerson, setSettlingPerson] = useState(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleBusy, setSettleBusy] = useState(false);

  const [pendingInputs, setPendingInputs] = useState({});
  const [pendingBusyId, setPendingBusyId] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const refreshDashboard = async () => {
    setBusy(true);
    setError("");
    try {
      const [summaryRes, peopleRes, entriesRes] = await Promise.all([
        jsonFetch("/api/ui_summary"),
        jsonFetch("/api/ui_people"),
        jsonFetch("/api/ui_ledger?scope=all&limit=120"),
      ]);
      setSummary(summaryRes);
      setPeople(Array.isArray(peopleRes.people) ? peopleRes.people : []);
      setEntries(Array.isArray(entriesRes.entries) ? entriesRes.entries : []);
      if (!selectedPersonKey && Array.isArray(peopleRes.people) && peopleRes.people.length) {
        setSelectedPersonKey(peopleRes.people[0].person_key);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    void refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const normalizedPeople = useMemo(
    () => people.map((p) => ({ ...p, receivable: toNum(p.receivable), payable: toNum(p.payable), net: toNum(p.net), count: toNum(p.count) })),
    [people]
  );

  const wallets = useMemo(() => buildWallets(entries), [entries]);
  const pendingItems = useMemo(() => detectPending(entries), [entries]);
  const expenseMix = useMemo(() => buildExpenseMix(summary), [summary]);
  const fuelBars = useMemo(() => buildFuelBars(entries), [entries]);
  const explorer = useMemo(() => buildExplorer(normalizedPeople, entries), [normalizedPeople, entries]);
  const selectedPerson = useMemo(
    () => normalizedPeople.find((person) => person.person_key === selectedPersonKey) || null,
    [normalizedPeople, selectedPersonKey]
  );
  const selectedHistory = useMemo(
    () => entries.filter((entry) => entry.person_key === selectedPersonKey),
    [entries, selectedPersonKey]
  );
  const receivablePeople = useMemo(
    () => normalizedPeople.filter((person) => person.net > 0),
    [normalizedPeople]
  );
  const payablePeople = useMemo(
    () => normalizedPeople.filter((person) => person.net < 0),
    [normalizedPeople]
  );

  const activePeople = useMemo(() => {
    if (activeSection === "people") return normalizedPeople;
    return normalizedPeople.slice(0, 5);
  }, [activeSection, normalizedPeople]);

  const summaryStats = useMemo(() => {
    const month = summary?.month || {};
    const allTime = summary?.allTime || {};
    return [
      {
        label: "Total Balance",
        value: formatMoney(toNum(allTime.net)),
        note: `${toNum(allTime.counts?.in || 0) + toNum(allTime.counts?.out || 0) + toNum(allTime.counts?.sub || 0)} entries in total`,
        tone: "blue",
      },
      {
        label: "Income (Month)",
        value: formatMoney(month.income),
        note: `${toNum(month.counts?.in || 0)} income entries`,
        tone: "green",
      },
      {
        label: "Expense (Month)",
        value: formatMoney(month.expense),
        note: `${toNum(month.counts?.out || 0) + toNum(month.counts?.sub || 0)} expense entries`,
        tone: "red",
      },
      {
        label: "Net (Month)",
        value: formatMoney(month.net),
        note: `${entries.length} recent records in the ledger`,
        tone: toNum(month.net) >= 0 ? "green" : "amber",
      },
    ];
  }, [summary, entries.length]);

  const recentEntries = useMemo(() => entries.slice(0, 8), [entries]);

  const navigate = (id) => {
    setActiveSection(id);
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const savePendingMeta = async (item) => {
    const note = String(pendingInputs[item.key] || "").trim();
    if (!note) return;
    setPendingBusyId(item.key);
    try {
      const base = String(item.entry.note || "").trim();
      const nextNote = base.includes(note) ? base : `${base} | ${note}`;
      await jsonFetch("/api/ui_ledger", {
        method: "PATCH",
        body: JSON.stringify({ id: item.entry.id, note: nextNote }),
      });
      await refreshDashboard();
      setPendingInputs((prev) => {
        const next = { ...prev };
        delete next[item.key];
        return next;
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setPendingBusyId("");
    }
  };

  const settlePerson = async () => {
    if (!settlingPerson) return;
    const amount = toNum(settleAmount);
    if (!amount) return;
    setSettleBusy(true);
    try {
      await jsonFetch("/api/ui_settlement", {
        method: "POST",
        body: JSON.stringify({
          person: settlingPerson.person_key,
          amount,
          side: settlingPerson.net > 0 ? "receivable" : "payable",
          purpose: "Ledger settlement",
        }),
      });
      setSettlingPerson(null);
      setSettleAmount("");
      await refreshDashboard();
    } catch (e) {
      setError(String(e));
    } finally {
      setSettleBusy(false);
    }
  };

  const openSettlement = (person) => {
    setSettlingPerson(person);
    setSettleAmount(String(Math.abs(toNum(person.net)) || 0));
  };

  if (!loggedIn) {
    return (
      <main className="page loginPage">
        <section className="loginCard">
          <div className="brandRow">
            <div className="brandMark">FN</div>
            <div>
              <h1>Flow Nest Ledger</h1>
              <p>Sign in to view your ledger dashboard.</p>
            </div>
          </div>
          <label>
            Telegram User ID
            <input value={tgId} onChange={(e) => setTgId(e.target.value)} placeholder="123456" />
          </label>
          <label>
            Login Code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="code from /ui" />
          </label>
          <button
            className="solidBtn full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setLoginOut("Logging in...");
              try {
                const data = await jsonFetch("/api/ui_login", {
                  method: "POST",
                  body: JSON.stringify({ telegramUserId: tgId.trim(), code: code.trim() }),
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
          {loginOut ? <pre className="out">{loginOut}</pre> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <aside className="sidebar">
          <div className="brandBlock">
            <div className="brandMark">FN</div>
            <div>
              <h1>Flow Nest Ledger</h1>
              <p>Professional ledger workspace</p>
            </div>
          </div>

          <nav className="navList">
            {[
              ["overview", "Overview"],
              ["wallets", "Accounts"],
              ["people", "People"],
              ["lenden", "Lenden"],
              ["reports", "Reports"],
              ["logs", "Logs"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`navItem ${activeSection === id ? "active" : ""}`}
                onClick={() => navigate(id)}
              >
                <span>{label}</span>
                <span className="navDot" />
              </button>
            ))}
          </nav>

          <div className="sidebarFoot">
            <button className="sideAction" onClick={() => void refreshDashboard()} disabled={busy}>
              Refresh data
            </button>
            <button className="sideAction" onClick={() => navigate("lenden")}>Jump to dues</button>
            <button className="sideAction" onClick={() => navigate("logs")}>Jump to logs</button>
            <div className="sidebarMeta">
              <span>{normalizedPeople.length} people</span>
              <span>{entries.length} entries</span>
              <span>{pendingItems.length} pending</span>
            </div>
          </div>
        </aside>

        <section className="content">
          <header className="heroPanel" id="overview">
            <div>
              <div className="eyebrow">Operational snapshot</div>
              <h2>One clean place for your ledger, people, wallets, and pending work.</h2>
              <p>
                The UI is now built around the Flow Nest Ledger pattern and uses your current backend for summary,
                people, settlement, and ledger data.
              </p>
            </div>
            <div className="heroActions">
              <button className="ghostBtn" onClick={() => navigate("people")}>People</button>
              <button className="ghostBtn" onClick={() => navigate("reports")}>Reports</button>
              <button className="solidBtn" onClick={() => navigate("logs")}>View logs</button>
            </div>
          </header>

          {error ? <div className="errorBanner">{error}</div> : null}

          <div className="quickStatsGrid">
            {summaryStats.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <SectionCard
            id="wallets"
            title="Accounts"
            subtitle="Wallet snapshots are derived from your ledger entries and transfer tags."
            right={<span className="pill">{wallets.length} wallets</span>}
          >
            <div className="walletGrid">
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.key}
                  wallet={wallet}
                  onAdjust={() => navigate("logs")}
                  onTransfer={() => navigate("logs")}
                />
              ))}
            </div>
          </SectionCard>

          <div className="workspaceGrid">
            <div className="workspaceLeft">
              <SectionCard
                id="pending"
                title="Pending Inbox"
                subtitle="Catch missing metadata before it gets buried in the ledger."
                right={<span className="pill amber">{pendingItems.length}</span>}
              >
                {pendingItems.length ? (
                  <div className="stackList">
                    {pendingItems.map((item) => (
                      <div key={item.key} className="pendingCard">
                        <div className="pendingTop">
                          <p>{item.prompt}</p>
                          <span>{fmtDate(item.entry.created_at)}</span>
                        </div>
                        <div className="pendingActionRow">
                          <input
                            value={pendingInputs[item.key] || ""}
                            onChange={(e) => setPendingInputs((prev) => ({ ...prev, [item.key]: e.target.value }))}
                            placeholder={item.placeholder}
                          />
                          <button
                            className="solidBtn"
                            disabled={busy || pendingBusyId === item.key}
                            onClick={() => void savePendingMeta(item)}
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="emptyState">All caught up. No pending items right now.</div>
                )}
              </SectionCard>

              <SectionCard
                id="lenden"
                title="Lenden Ledger"
                subtitle="Clear receivable vs payable view with one-click settlement."
                right={<span className="pill good">Dues</span>}
              >
                <div className="ledgerSummaryRow">
                  <div>
                    <small>They owe me</small>
                    <strong className="goodText">{formatMoney(receivablePeople.reduce((sum, p) => sum + p.receivable, 0))}</strong>
                  </div>
                  <div>
                    <small>I owe them</small>
                    <strong className="badText">{formatMoney(payablePeople.reduce((sum, p) => sum + p.payable, 0))}</strong>
                  </div>
                </div>
                <div className="filterRow">
                  <button
                    className={`filterPill ${selectedPersonKey === "" ? "active" : ""}`}
                    onClick={() => setSelectedPersonKey("")}
                  >
                    All
                  </button>
                  <button
                    className={`filterPill ${selectedPersonKey && (selectedPerson?.net || 0) > 0 ? "active" : ""}`}
                    onClick={() => setSelectedPersonKey(receivablePeople[0]?.person_key || "")}
                  >
                    Receivable
                  </button>
                  <button
                    className={`filterPill ${selectedPersonKey && (selectedPerson?.net || 0) < 0 ? "active" : ""}`}
                    onClick={() => setSelectedPersonKey(payablePeople[0]?.person_key || "")}
                  >
                    Payable
                  </button>
                </div>
                <div className="ledgerList">
                  {activePeople.length ? (
                    activePeople.map((person) => (
                      <div
                        key={person.person_key}
                        className={`ledgerRow ${selectedPersonKey === person.person_key ? "selected" : ""}`}
                        onClick={() => setSelectedPersonKey(person.person_key)}
                      >
                        <div>
                          <strong>{person.person}</strong>
                          <p>
                            {relationLabel(person.person)} · {person.count} entries
                          </p>
                        </div>
                        <div className="ledgerValues">
                          <span className="goodText">{formatMoney(person.receivable)}</span>
                          <span className="badText">{formatMoney(person.payable)}</span>
                          <span className={person.net >= 0 ? "goodText" : "badText"}>{moneyToText(person.net)}</span>
                          <button className="ghostBtn small" onClick={(e) => { e.stopPropagation(); openSettlement(person); }}>
                            Settle
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="emptyState">No people found.</div>
                  )}
                </div>
              </SectionCard>

              <div className="chartGrid" id="reports">
                <SectionCard
                  title="Expense Mix"
                  subtitle="The month-level mix from your backend summary."
                  right={<span className="pill">Monthly</span>}
                >
                  <div className="barChart">
                    {expenseMix.map((bar) => (
                      <div key={bar.label} className={`barItem ${bar.accent}`}>
                        <div className="barTrack">
                          <div className="barFill" style={{ height: `${bar.ratio}%` }} />
                        </div>
                        <span>{bar.label}</span>
                        <small>{formatMoney(bar.value)}</small>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Fuel Efficiency"
                  subtitle="Bike / fuel / oil notes surfaced as a quick operational chart."
                  right={<span className="pill">Recent</span>}
                >
                  <div className="barChart fuelChart">
                    {fuelBars.length ? (
                      fuelBars.map((bar) => (
                        <div key={bar.id} className="barItem amber">
                          <div className="barTrack">
                            <div className="barFill fuelFill" style={{ height: `${bar.ratio}%` }} />
                          </div>
                          <span>{bar.label}</span>
                          <small>{formatMoney(bar.value)}</small>
                        </div>
                      ))
                    ) : (
                      <div className="emptyState">No fuel-related entries yet.</div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="workspaceRight">
              <SectionCard
                id="logs"
                title="Recent Entries"
                subtitle="A compact vertical feed for the latest ledger activity."
                right={<span className="pill slate">{recentEntries.length}</span>}
              >
                <div className="feedList">
                  {recentEntries.length ? (
                    recentEntries.map((entry) => (
                      <article key={entry.id} className="feedCard">
                        <div className="feedHead">
                          <strong>{entry.kind}</strong>
                          <small>{fmtDate(entry.created_at)}</small>
                        </div>
                        <p>{entry.note}</p>
                        <div className="feedMeta">
                          <span>{formatMoney(entry.amount)}</span>
                          {entry.person ? <span>{entry.person}</span> : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="emptyState">No entries found.</div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                id="people"
                title="Entity Explorer"
                subtitle="Group people by relationship and drill into one person at a time."
                right={<span className="pill slate">Explorer</span>}
              >
                <div className="explorerGroups">
                  {Object.entries(explorer).map(([groupName, items]) => (
                    <details key={groupName} open={groupName === "Family"} className="explorerGroup">
                      <summary>
                        <span>{groupName}</span>
                        <small>{items.length}</small>
                      </summary>
                      <div className="explorerList">
                        {items.length ? (
                          items.map((person) => (
                            <button
                              key={person.person_key}
                              className={`explorerItem ${selectedPersonKey === person.person_key ? "selected" : ""}`}
                              onClick={() => setSelectedPersonKey(person.person_key)}
                            >
                              <div>
                                <strong>{person.person}</strong>
                                <p>{person.relation}</p>
                              </div>
                              <span>{moneyToText(person.net)}</span>
                            </button>
                          ))
                        ) : (
                          <div className="emptyState compact">No items in this group.</div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>

                {selectedPerson ? (
                  <div className="detailCard">
                    <div className="detailHead">
                      <div>
                        <h4>{selectedPerson.person}</h4>
                        <p>
                          They owe me: {formatMoney(selectedPerson.receivable)} · I owe them: {formatMoney(selectedPerson.payable)}
                        </p>
                      </div>
                      <Link href={`/report/${encodeURIComponent(selectedPerson.person_key)}/all`} className="detailLink">
                        Open report
                      </Link>
                    </div>
                    <div className="chipsRow">
                      {Array.from(new Set(selectedHistory.map((entry) => categoryFromText(entry.note)).filter((cat) => cat !== "Other"))).map((cat) => (
                        <span key={cat} className="chip">{cat}</span>
                      ))}
                    </div>
                    <div className="historyList">
                      {selectedHistory.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="historyRow">
                          <span>{entry.kind}</span>
                          <small>{fmtDate(entry.created_at)}</small>
                          <strong>{formatMoney(entry.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SectionCard>
            </div>
          </div>
        </section>
      </div>

      {settlingPerson ? (
        <div className="modalWrap" onClick={() => setSettlingPerson(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h3>Settle {settlingPerson.person}</h3>
            <p>
              {settlingPerson.net > 0 ? "They owe me" : "I owe them"} {formatMoney(Math.abs(settlingPerson.net))}
            </p>
            <label>
              Settlement amount
              <input value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} />
            </label>
            <div className="modalActions">
              <button className="ghostBtn" onClick={() => setSettlingPerson(null)}>Cancel</button>
              <button className="solidBtn" disabled={settleBusy} onClick={() => void settlePerson()}>
                Confirm settlement
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 24%),
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 22%),
            linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
          color: #0f172a;
          font-family: "Inter", "Manrope", "Segoe UI", Arial, sans-serif;
        }
        .shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
        }
        .sidebar {
          position: sticky;
          top: 0;
          align-self: start;
          min-height: 100vh;
          padding: 18px 16px;
          background: linear-gradient(180deg, #0f172a 0%, #111827 55%, #0b1220 100%);
          color: #e2e8f0;
          border-right: 1px solid rgba(148, 163, 184, 0.12);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .brandBlock,
        .brandRow {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .brandMark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 800;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(16, 185, 129, 0.28));
          border: 1px solid rgba(148, 163, 184, 0.18);
          color: #fff;
        }
        .brandBlock h1,
        .brandRow h1 {
          margin: 0;
          font-size: 15px;
          line-height: 1.1;
        }
        .brandBlock p,
        .brandRow p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94a3b8;
        }
        .navList {
          display: grid;
          gap: 8px;
          margin-top: 8px;
        }
        .navItem {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid transparent;
          border-radius: 14px;
          background: transparent;
          color: #cbd5e1;
          padding: 12px 13px;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }
        .navItem:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        .navItem.active {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(96, 165, 250, 0.26);
          color: #fff;
        }
        .navDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.55;
        }
        .sidebarFoot {
          margin-top: auto;
          display: grid;
          gap: 8px;
        }
        .sideAction,
        .ghostBtn,
        .solidBtn,
        .filterPill {
          border-radius: 12px;
          border: 1px solid transparent;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
        }
        .sideAction {
          width: 100%;
          padding: 11px 12px;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.14);
          color: #e2e8f0;
          text-align: left;
        }
        .sideAction:hover,
        .ghostBtn:hover,
        .solidBtn:hover,
        .filterPill:hover {
          transform: translateY(-1px);
        }
        .sidebarMeta {
          display: grid;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          font-size: 11px;
          letter-spacing: 0.04em;
        }
        .content {
          padding: 20px;
          display: grid;
          gap: 16px;
          max-width: 1440px;
          width: 100%;
        }
        .heroPanel,
        .panel,
        .statCard,
        .errorBanner,
        .loginCard {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.18);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
        }
        .heroPanel {
          border-radius: 24px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
        }
        .heroPanel h2,
        .panelHead h3,
        .loginCard h1 {
          margin: 0;
          letter-spacing: -0.03em;
        }
        .heroPanel h2 {
          margin-top: 8px;
          font-size: 26px;
          max-width: 28ch;
        }
        .heroPanel p,
        .panelHead p,
        .loginCard p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.5;
        }
        .heroActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .quickStatsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .statCard {
          border-radius: 20px;
          padding: 16px;
        }
        .statCard span {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #64748b;
          font-weight: 700;
        }
        .statCard strong {
          display: block;
          margin-top: 10px;
          font-size: 24px;
          letter-spacing: -0.03em;
        }
        .statCard small {
          display: block;
          margin-top: 8px;
          color: #64748b;
          font-size: 12px;
        }
        .statCard.blue strong { color: #1d4ed8; }
        .statCard.green strong { color: #15803d; }
        .statCard.red strong { color: #dc2626; }
        .statCard.amber strong { color: #b45309; }
        .panel {
          border-radius: 24px;
          padding: 18px;
        }
        .panelHead {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .panelHead h3 {
          font-size: 18px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .pill.good { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .pill.amber { background: #fffbeb; color: #92400e; border-color: #fde68a; }
        .pill.slate { background: #f8fafc; color: #334155; border-color: #e2e8f0; }
        .walletGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .walletCard {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          padding: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,.94), rgba(248,250,252,.92));
        }
        .walletCard.blue { box-shadow: inset 0 1px 0 rgba(59,130,246,.08); }
        .walletCard.green { box-shadow: inset 0 1px 0 rgba(16,185,129,.08); }
        .walletCard.pink { box-shadow: inset 0 1px 0 rgba(236,72,153,.08); }
        .walletCard.amber { box-shadow: inset 0 1px 0 rgba(245,158,11,.08); }
        .walletTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 11px;
        }
        .walletMark {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #0f172a;
          font-weight: 800;
          background: #e2e8f0;
        }
        .walletCard p {
          margin: 14px 0 0;
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .walletCard strong {
          display: block;
          margin-top: 8px;
          font-size: 26px;
          letter-spacing: -0.03em;
        }
        .walletActions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .ghostBtn,
        .solidBtn {
          padding: 10px 12px;
          color: #0f172a;
          background: #fff;
          border-color: #dbe3ee;
        }
        .ghostBtn.small {
          padding: 7px 10px;
          font-size: 12px;
        }
        .solidBtn {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          border-color: #1d4ed8;
          color: #fff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.18);
        }
        .solidBtn.full {
          width: 100%;
          margin-top: 12px;
        }
        .workspaceGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
          gap: 16px;
          align-items: start;
        }
        .workspaceLeft,
        .workspaceRight {
          display: grid;
          gap: 16px;
        }
        .stackList,
        .feedList,
        .explorerGroups {
          display: grid;
          gap: 10px;
        }
        .pendingCard,
        .feedCard,
        .detailCard {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 14px;
        }
        .pendingTop,
        .feedHead,
        .detailHead,
        .historyRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: start;
        }
        .pendingTop p,
        .feedCard p,
        .detailHead p,
        .historyRow span,
        .historyRow small {
          margin: 0;
          font-size: 13px;
          color: #334155;
        }
        .pendingTop span,
        .feedHead small {
          color: #64748b;
          font-size: 11px;
        }
        .pendingActionRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          margin-top: 10px;
        }
        input,
        select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 11px 12px;
          font-size: 14px;
          background: #fff;
          color: #0f172a;
          outline: none;
        }
        input:focus,
        select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .emptyState {
          border-radius: 16px;
          border: 1px dashed #cbd5e1;
          padding: 14px;
          color: #64748b;
          font-size: 13px;
          background: #f8fafc;
        }
        .emptyState.compact {
          padding: 10px 12px;
        }
        .ledgerSummaryRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .ledgerSummaryRow small {
          display: block;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 10px;
        }
        .ledgerSummaryRow strong {
          display: block;
          margin-top: 8px;
          font-size: 22px;
          letter-spacing: -0.03em;
        }
        .goodText { color: #15803d; font-weight: 700; }
        .badText { color: #dc2626; font-weight: 700; }
        .filterRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .filterPill {
          padding: 8px 12px;
          background: #fff;
          border-color: #dbe3ee;
          color: #334155;
        }
        .filterPill.active {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }
        .ledgerList {
          display: grid;
          gap: 8px;
        }
        .ledgerRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px 14px;
          background: #fff;
          cursor: pointer;
        }
        .ledgerRow.selected {
          border-color: #bfdbfe;
          background: #eff6ff;
        }
        .ledgerRow strong {
          display: block;
          font-size: 14px;
        }
        .ledgerRow p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .ledgerValues {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .chartGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .barChart {
          min-height: 180px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          align-items: end;
        }
        .barChart.fuelChart {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }
        .barItem {
          display: grid;
          gap: 8px;
          justify-items: center;
          align-items: end;
          text-align: center;
        }
        .barTrack {
          width: 100%;
          height: 140px;
          border-radius: 16px 16px 8px 8px;
          background: #f8fafc;
          display: flex;
          align-items: end;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .barFill {
          width: 100%;
          border-radius: 16px 16px 0 0;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
        }
        .barItem.bad .barFill { background: linear-gradient(180deg, #f87171, #dc2626); }
        .barItem.warn .barFill { background: linear-gradient(180deg, #fbbf24, #f59e0b); }
        .barItem.good .barFill { background: linear-gradient(180deg, #34d399, #059669); }
        .barItem span {
          font-size: 11px;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
        }
        .barItem small {
          font-size: 11px;
          color: #64748b;
        }
        .fuelFill {
          background: linear-gradient(180deg, #fb923c, #ea580c) !important;
        }
        .feedMeta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          color: #64748b;
          font-size: 11px;
        }
        .explorerGroup {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
        }
        .explorerGroup summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 12px 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .explorerGroup summary::-webkit-details-marker {
          display: none;
        }
        .explorerGroup summary small {
          color: #64748b;
          font-weight: 600;
        }
        .explorerList {
          padding: 0 12px 12px;
          display: grid;
          gap: 8px;
        }
        .explorerItem {
          width: 100%;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 14px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
        }
        .explorerItem.selected {
          border-color: #bfdbfe;
          background: #eff6ff;
        }
        .explorerItem strong {
          display: block;
          font-size: 13px;
        }
        .explorerItem p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #64748b;
          text-transform: capitalize;
        }
        .explorerItem span {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
        }
        .detailCard {
          margin-top: 12px;
          background: linear-gradient(180deg, #fff, #f8fafc);
        }
        .detailHead h4 {
          margin: 0;
          font-size: 15px;
        }
        .detailLink {
          color: #1d4ed8;
          font-weight: 700;
          text-decoration: none;
        }
        .chipsRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .chip {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .historyList {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }
        .historyRow {
          padding: 10px 0;
          border-top: 1px solid #e2e8f0;
          align-items: center;
        }
        .historyRow:first-child {
          border-top: 0;
          padding-top: 0;
        }
        .historyRow strong {
          font-size: 12px;
          color: #0f172a;
        }
        .historyRow span,
        .historyRow small {
          font-size: 12px;
          color: #64748b;
        }
        .errorBanner {
          border-radius: 18px;
          padding: 14px 16px;
          color: #991b1b;
          background: #fff1f2;
          border-color: #fecaca;
        }
        .modalWrap {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(10px);
        }
        .modalCard,
        .loginCard {
          border-radius: 22px;
          padding: 20px;
          width: 100%;
          max-width: 420px;
        }
        .modalCard {
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .modalCard h3 {
          margin: 0;
          font-size: 18px;
        }
        .modalCard p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 13px;
        }
        .modalActions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .loginPage {
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .loginCard {
          max-width: 440px;
          background: rgba(255, 255, 255, 0.92);
        }
        .loginCard label {
          display: block;
          margin-top: 12px;
          font-size: 12px;
          color: #475569;
        }
        .out {
          white-space: pre-wrap;
          word-break: break-word;
          margin-top: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          color: #334155;
        }
        @media (max-width: 1120px) {
          .shell,
          .workspaceGrid,
          .chartGrid {
            grid-template-columns: 1fr;
          }
          .sidebar {
            position: static;
            min-height: auto;
          }
          .quickStatsGrid,
          .walletGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .content {
            padding: 14px;
          }
          .heroPanel {
            flex-direction: column;
            align-items: start;
          }
          .heroActions {
            justify-content: flex-start;
          }
          .barChart.fuelChart {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .quickStatsGrid,
          .walletGrid,
          .ledgerSummaryRow {
            grid-template-columns: 1fr;
          }
          .pendingActionRow {
            grid-template-columns: 1fr;
          }
          .ledgerRow {
            grid-template-columns: 1fr;
          }
          .ledgerValues {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
