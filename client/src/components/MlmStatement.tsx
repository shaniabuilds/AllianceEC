import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Download } from "lucide-react";
import {
  fetchMlmStatement,
  MlmStatementEntry,
  MlmStatementSummary,
} from "../services/affiliateService";
import { MlmWithdrawModal } from "./MlmWithdrawModal";

interface Props {
  withdrawable: number;
  onChanged?: () => void;
}

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const TYPE_OPTIONS = [
  { v: "ALL", l: "All Entries" },
  { v: "JOIN", l: "Member Joins" },
  { v: "DIRECT", l: "Direct Bonus" },
  { v: "BINARY", l: "Binary Bonus" },
  { v: "WITHDRAWAL", l: "Withdrawals" },
];

const badgeClass = (t: string) =>
  t === "BINARY_BONUS" ? "badge badge-amber"
  : t === "DIRECT_REFERRAL" ? "badge badge-emerald"
  : t === "WITHDRAWAL" ? "badge badge-rose"
  : "badge badge-primary";

export const MlmStatement: React.FC<Props> = ({ withdrawable, onChanged }) => {
  const [entries, setEntries] = useState<MlmStatementEntry[]>([]);
  const [summary, setSummary] = useState<MlmStatementSummary | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ from: "", to: "", type: "ALL" });
  const [applied, setApplied] = useState(draft);
  const [page, setPage] = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetchMlmStatement({ page, limit: 20, ...applied });
    if (res.success && res.data) {
      setEntries(res.data.entries || []);
      setSummary(res.data.summary || null);
      setPagination(res.data.pagination);
    } else {
      setError(res.message || "Failed to load MLM statement");
    }
    setLoading(false);
  }, [page, applied]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Date", "Type", "Details", "Notes", "PV", "Amount"];
    const rows = entries.map((e) => [
      new Date(e.date).toISOString(), e.typeLabel, e.title, e.explanation.join(" | "), e.pv, e.amount,
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mlm_statement_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const card = (label: string, value: string, color: string, sub?: string) => (
    <div className="glass-card" style={{ padding: "14px 18px", borderRadius: 14, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );

  const lbl = { fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block" } as const;
  const inp = { padding: "6px 8px", fontSize: "0.8rem" } as const;

  return (
    <div className="glass-card" style={{ padding: 20, marginTop: 22, borderRadius: 16 }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>🧾 MLM Statement</h3>
      <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 14px" }}>
        Members joined, bonuses earned and withdrawals from your network.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
        {card("Total Profit", inr(summary?.totalProfit || 0), "#10B981", `${summary?.totalCount || 0} entries`)}
        {card("Binary Bonus", inr(summary?.binaryTotal || 0), "#F59E0B")}
        {card("Direct Bonus", inr(summary?.directTotal || 0), "#6366F1")}
        {card("Withdrawn", inr(summary?.withdrawn || 0), "#F43F5E")}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <label style={lbl}>From</label>
          <input type="date" className="form-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>To</label>
          <input type="date" className="form-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>Type</label>
          <select className="form-input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} style={inp}>
            {TYPE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setPage(1); setApplied(draft); }} style={{ padding: "7px 16px", fontSize: "0.8rem" }}>Apply</button>
        <button className="btn-secondary" onClick={() => { const e = { from: "", to: "", type: "ALL" }; setDraft(e); setApplied(e); setPage(1); }} style={{ padding: "7px 12px", fontSize: "0.8rem" }}>Clear</button>
        <button className="btn-secondary" onClick={load} style={{ padding: "7px 12px", fontSize: "0.8rem" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button className="btn-emerald" onClick={exportCsv} disabled={entries.length === 0}
          style={{ padding: "7px 14px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
        <button className="btn-primary" onClick={() => setShowWithdraw(true)} disabled={withdrawable < 50}
          style={{ padding: "7px 14px", fontSize: "0.8rem" }}>
          Withdraw ({inr(withdrawable)})
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(244,63,94,0.15)", color: "#FB7185", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border-color)", background: "var(--bg-surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem" }}>
              <th style={{ padding: "12px 16px" }}>Date & Time</th>
              <th style={{ padding: "12px 16px" }}>Type</th>
              <th style={{ padding: "12px 16px" }}>Details</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>PV</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: "var(--text-muted)" }}>No MLM entries yet.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={`${e.type}-${e.id}`} style={{ borderBottom: "1px solid var(--border-color)", verticalAlign: "top" }}>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{fmtDate(e.date)}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span className={badgeClass(e.type)} style={{ fontSize: "0.68rem", padding: "2px 7px" }}>{e.typeLabel}</span>
                  </td>
                  <td style={{ padding: "10px 16px", minWidth: 300 }}>
                    <div style={{ fontWeight: 700 }}>{e.title}</div>
                    <div style={{ marginTop: 4, fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {e.explanation.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>{e.pv > 0 ? `${e.pv} PV` : "—"}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap",
                    color: e.amount > 0 ? "#34D399" : e.amount < 0 ? "#FB7185" : "var(--text-muted)" }}>
                    {e.amount > 0 ? `+ ${inr(e.amount)}` : e.amount < 0 ? `− ${inr(Math.abs(e.amount))}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> • {pagination.totalRecords} entries
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ padding: "5px 12px", fontSize: "0.78rem" }}>Previous</button>
            <button className="btn-secondary" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)} style={{ padding: "5px 12px", fontSize: "0.78rem" }}>Next</button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <MlmWithdrawModal
          available={withdrawable}
          onClose={() => setShowWithdraw(false)}
          onDone={() => { load(); onChanged?.(); }}
        />
      )}
    </div>
  );
};