import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Download, Search } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

interface StatementEntry {
  id: string;
  date: string;
  type: string;
  typeLabel: string;
  title: string;
  subtitle?: string;
  party?: { name?: string; userId?: string; mobile?: string } | null;
  grossAmount?: number;
  amount: number;
}

interface Props {
  apiUrl: string; // "/admin/revenue-statement" | "/student/purchase-statement"
  mode: "ADMIN" | "TEACHER" | "STUDENT";
}

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const RevenueStatement: React.FC<Props> = ({ apiUrl, mode }) => {
  const isAdmin = mode === "ADMIN";
  const isStudent = mode === "STUDENT";
  const [entries, setEntries] = useState<StatementEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // draft (inputs) vs applied (jo API ko gaya)
  const [draft, setDraft] = useState({
    from: "",
    to: "",
    type: "ALL",
    search: "",
  });
  const [applied, setApplied] = useState(draft);
  const [page, setPage] = useState(1);

  const typeOptions = isStudent
    ? [{ v: "ALL", l: "All Purchases" }]
    : isAdmin
      ? [
          { v: "ALL", l: "All Sales" },
          { v: "COURSE_PURCHASE", l: "Course Sales" },
          { v: "EBOOK_PURCHASE", l: "E-Book Sales" },
        ]
      : [
          { v: "ALL", l: "All Earnings" },
          { v: "COURSE_ROYALTY", l: "Course Royalties" },
          { v: "REFERRAL", l: "Referral Commissions" },
        ];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (applied.from) qs.set("from", applied.from);
      if (applied.to) qs.set("to", applied.to);
      if (applied.type !== "ALL")
        qs.set(isAdmin ? "category" : "type", applied.type);
      if (isAdmin && applied.search.trim())
        qs.set("search", applied.search.trim());

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}${apiUrl}?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to load statement");
      setEntries(json.data.entries || []);
      setSummary(json.data.summary || null);
      setPagination(json.data.pagination);
    } catch (e: any) {
      setError(e.message || "Failed to load revenue statement");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, applied, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setApplied(draft);
  };

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "Date",
      "Type",
      "Details",
      "Party",
      "Mobile",
      "Gross",
      "Amount",
    ];
    const rows = entries.map((e) => [
      new Date(e.date).toISOString(),
      e.typeLabel,
      `${e.title}${e.subtitle ? " - " + e.subtitle : ""}`,
      e.party?.name || "",
      e.party?.mobile || "",
      e.grossAmount ?? e.amount,
      e.amount,
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_statement_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const card = (label: string, value: string, color: string, sub?: string) => (
    <div
      className="glass-card"
      style={{
        padding: "14px 18px",
        borderRadius: "14px",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
        }}
      >
        {isStudent ? (
          <>
            {card(
              "Total Spent",
              inr(summary?.totalAmount || 0),
              "#10B981",
              `${summary?.totalCount || 0} courses`,
            )}
            {card(
              "Courses Purchased",
              String(summary?.totalCount || 0),
              "#6366F1",
            )}
          </>
        ) : (
          <>
            {card(
              isAdmin
                ? "Total Revenue (filtered)"
                : "Total Earnings (filtered)",
              inr(summary?.totalAmount || 0),
              "#10B981",
              `${summary?.totalCount || 0} entries`,
            )}
            {isAdmin ? (
              <>
                {card(
                  "Course Sales",
                  inr(summary?.byCategory?.COURSE_PURCHASE?.total || 0),
                  "#6366F1",
                  `${summary?.byCategory?.COURSE_PURCHASE?.count || 0} sales`,
                )}
                {card(
                  "E-Book Sales",
                  inr(summary?.byCategory?.EBOOK_PURCHASE?.total || 0),
                  "#F59E0B",
                  `${summary?.byCategory?.EBOOK_PURCHASE?.count || 0} sales`,
                )}
              </>
            ) : (
              <>
                {card(
                  "Course Royalties (70%)",
                  inr(summary?.courseRoyalty || 0),
                  "#6366F1",
                )}
                {card(
                  "Referral Commissions",
                  inr(summary?.referral || 0),
                  "#EC4899",
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Filters */}
      <div
        className="glass-card"
        style={{
          padding: "14px 16px",
          borderRadius: "14px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            From
          </label>
          <input
            type="date"
            className="form-input"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            style={{ padding: "6px 8px", fontSize: "0.8rem" }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            To
          </label>
          <input
            type="date"
            className="form-input"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            style={{ padding: "6px 8px", fontSize: "0.8rem" }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "block",
            }}
          >
            Type
          </label>
          <select
            className="form-input"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            style={{ padding: "6px 8px", fontSize: "0.8rem" }}
          >
            {typeOptions.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 9,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              className="form-input"
              placeholder="Search buyer name, mobile, ID, details..."
              value={draft.search}
              onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                fontSize: "0.8rem",
              }}
            />
          </div>
        )}
        <button
          className="btn-primary"
          onClick={applyFilters}
          style={{ padding: "7px 16px", fontSize: "0.8rem" }}
        >
          Apply
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            const empty = { from: "", to: "", type: "ALL", search: "" };
            setDraft(empty);
            setApplied(empty);
            setPage(1);
          }}
          style={{ padding: "7px 12px", fontSize: "0.8rem" }}
        >
          Clear
        </button>
        <button
          className="btn-secondary"
          onClick={load}
          style={{ padding: "7px 12px", fontSize: "0.8rem" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          className="btn-emerald"
          onClick={exportCsv}
          disabled={entries.length === 0}
          style={{
            padding: "7px 14px",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(244,63,94,0.15)",
            color: "#FB7185",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--bg-surface)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.82rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid var(--border-color)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontSize: "0.7rem",
              }}
            >
              <th style={{ padding: "12px 16px" }}>Date & Time</th>
              <th style={{ padding: "12px 16px" }}>Type</th>
              <th style={{ padding: "12px 16px" }}>Details</th>
              <th style={{ padding: "12px 16px" }}>
                {isAdmin ? "Buyer" : isStudent ? "Teacher" : "Student"}
              </th>
              {mode === "TEACHER" && (
                <th style={{ padding: "12px 16px", textAlign: "right" }}>
                  Sale Amount
                </th>
              )}
              <th style={{ padding: "12px 16px", textAlign: "right" }}>
                {isAdmin
                  ? "Amount"
                  : isStudent
                    ? "Amount Paid"
                    : "Your Earning"}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={mode === "TEACHER" ? 6 : 5}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Loading statement...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                 colSpan={mode === "TEACHER" ? 6 : 5}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No revenue entries found for the selected filters.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr
                  key={`${e.type}-${e.id}`}
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                      whiteSpace: "nowrap",
                      color: "var(--text-muted)",
                    }}
                  >
                    {fmtDate(e.date)}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      className={
                        e.type === "REFERRAL"
                          ? "badge badge-rose"
                          : e.type === "EBOOK_PURCHASE"
                            ? "badge badge-amber"
                            : "badge badge-primary"
                      }
                      style={{ fontSize: "0.68rem", padding: "2px 7px" }}
                    >
                      {e.typeLabel}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div
                      style={{ fontWeight: 700, color: "var(--text-primary)" }}
                    >
                      {e.title}
                    </div>
                    {e.subtitle && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {e.subtitle}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {e.party ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{e.party.name}</div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {e.party.userId} • {e.party.mobile}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  {mode === "TEACHER" && (
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        color: "var(--text-muted)",
                      }}
                    >
                      {inr(e.grossAmount || 0)}
                    </td>
                  )}
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 800,
                      color: "#34D399",
                    }}
                  >
                    {isStudent ? "" : "+ "}
                    {inr(e.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong> • {pagination.totalRecords}{" "}
            entries
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: "5px 12px", fontSize: "0.78rem" }}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: "5px 12px", fontSize: "0.78rem" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
