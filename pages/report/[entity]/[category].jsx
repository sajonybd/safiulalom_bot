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

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function categoryMatch(note, category) {
  const n = String(note || "").toLowerCase();
  const c = String(category || "").toLowerCase();
  if (!c || c === "all") return true;
  return n.includes(c);
}

export async function getServerSideProps({ req, params }) {
  const { getSessionUserId } = require("../../../lib/session");
  const userId = await getSessionUserId(req);
  if (!userId) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      entity: String((params && params.entity) || ""),
      category: String((params && params.category) || ""),
    },
  };
}

export default function EntityCategoryReport({ entity, category }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError("");
      try {
        const detail = await jsonFetch(`/api/ui_people?person=${encodeURIComponent(entity)}`);
        if (cancelled) return;
        setSummary(detail.person || null);
        setHistory(Array.isArray(detail.history) ? detail.history : []);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [entity]);

  const filtered = useMemo(
    () => history.filter((row) => categoryMatch(row.note, category)),
    [history, category]
  );

  return (
    <main className="page">
      <section className="card">
        <h1>Drill-Down Report</h1>
        <p className="hint">
          Entity: <strong>{entity}</strong> | Category: <strong>{category}</strong>
        </p>
        <p className="hint">
          <Link href="/" className="inlineLink">
            Back to Dashboard
          </Link>
        </p>
      </section>

      {error ? <section className="card error">{error}</section> : null}

      <section className="card">
        <h2>Master Summary</h2>
        {busy ? (
          <p className="hint">Loading...</p>
        ) : summary ? (
            <div className="summaryGrid">
            <div>
              <small>They owe me</small>
              <strong>{summary.receivable}</strong>
            </div>
            <div>
              <small>I owe them</small>
              <strong>{summary.payable}</strong>
            </div>
            <div>
              <small>Net</small>
              <strong>{summary.net}</strong>
            </div>
            <div>
              <small>Entries</small>
              <strong>{summary.count}</strong>
            </div>
          </div>
        ) : (
          <p className="hint">No summary found.</p>
        )}
      </section>

      <section className="card">
        <h2>Category Timeline</h2>
        {busy ? (
          <p className="hint">Loading history...</p>
        ) : filtered.length ? (
          <div className="timeline">
            {filtered.map((row) => (
              <article key={row.id} className="feedCard">
                <div className="feedHead">
                  <strong>{row.kind}</strong>
                  <small>{fmtDate(row.created_at)}</small>
                </div>
                <p>{row.note}</p>
                <small>{row.amount}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="hint">No history matched this category. Try another category route.</p>
        )}
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #fff7ed;
          color: #0f172a;
          padding: 16px 12px 36px;
          font-family: "Manrope", "Segoe UI", Arial, sans-serif;
        }
        .card {
          max-width: 860px;
          margin: 12px auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }
        h1,
        h2 {
          margin: 0;
          letter-spacing: -0.02em;
        }
        .hint {
          margin: 8px 0 0;
          color: #475569;
          font-size: 13px;
        }
        .inlineLink {
          color: #0f766e;
          text-decoration: underline;
          font-weight: 600;
        }
        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        .summaryGrid div {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #f8fafc;
        }
        .summaryGrid small {
          color: #64748b;
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .summaryGrid strong {
          display: block;
          margin-top: 8px;
          font-size: 18px;
        }
        .timeline {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }
        .feedCard {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
        }
        .feedHead {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }
        .feedCard p {
          margin: 8px 0;
          font-size: 13px;
        }
        .feedCard small {
          color: #64748b;
          font-size: 12px;
        }
        .error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #991b1b;
        }
        @media (max-width: 760px) {
          .summaryGrid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
