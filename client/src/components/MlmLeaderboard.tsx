import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Download, Search, Trophy } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

interface LeaderboardMember {
  rank: number;
  id: string;
  name: string;
  userId: string;
  mobile?: string;
  role?: string;
  parent?: { name?: string; userId?: string } | null;
  directCount: number;
  leftCount: number;
  rightCount: number;
  teamSize: number;
  leftPV: number;
  rightPV: number;
  matchedPV: number;
  totalEarnings: number;
}

interface Summary {
  totalMembers: number;
  totalDirectReferrals: number;
  totalMatchedPV: number;
  topPerformer?: { name: string; userId: string; teamSize: number } | null;
}

const SORT_OPTIONS = [
  { v: "TEAM", l: "Sort: Total Team" },
  { v: "DIRECT", l: "Sort: Direct Referrals" },
  { v: "LEFT", l: "Sort: Left Members" },
  { v: "RIGHT", l: "Sort: Right Members" },
  { v: "MATCHED", l: "Sort: Matched PV" },
  { v: "EARNINGS", l: "Sort: Earnings" },
];

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;
const num = (n: number) => (n || 0).toLocaleString("en-IN");

export const MlmLeaderboard: React.FC = () => {
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("TEAM");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "20",
        sortBy,
      });
      if (search.trim()) qs.set("search", search.trim());

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE_URL}/admin/mlm-leaderboard?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to load leaderboard");
      setMembers(json.data.members || []);
      setSummary(json.data.summary || null);
      setPagination(json.data.pagination);
    } catch (e: any) {
      setError(e.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => {
    setPage(1);
    setSearch(searchDraft);
  };

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "Rank",
      "Name",
      "User ID",
      "Parent",
      "Direct",
      "Left",
      "Right",
      "Team",
      "Left PV",
      "Right PV",
      "Matched PV",
      "Earnings",
    ];
    const rows = members.map((m) => [
      m.rank,
      m.name,
      m.userId,
      m.parent ? `${m.parent.name} (${m.parent.userId})` : "ROOT",
      m.directCount,
      m.leftCount,
      m.rightCount,
      m.teamSize,
      m.leftPV,
      m.rightPV,
      m.matchedPV,
      m.totalEarnings,
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `mlm_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const rankBadge = (rank: number) => {
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
    return medal ? (
      <span style={{ fontSize: "1.2rem" }}>{medal}</span>
    ) : (
      <span style={{ fontWeight: 800, color: "var(--text-muted)" }}>
        #{rank}
      </span>
    );
  };

  const legBar = (left: number, right: number) => {
    const total = left + right;
    const l = total > 0 ? Math.round((left / total) * 100) : 50;
    return (
      <div
        style={{
          display: "flex",
          height: 6,
          width: 90,
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(255,255,255,0.08)",
        }}
        title={`Left ${l}% • Right ${100 - l}%`}
      >
        {total > 0 && (
          <>
            <div style={{ width: `${l}%`, background: "#10B981" }} />
            <div style={{ width: `${100 - l}%`, background: "#6366F1" }} />
          </>
        )}
      </div>
    );
  };

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
        {card("MLM Members", num(summary?.totalMembers || 0), "#6366F1")}
        {card(
          "Total Direct Referrals",
          num(summary?.totalDirectReferrals || 0),
          "#10B981",
        )}
        {card("Total Matched PV", `${num(summary?.totalMatchedPV || 0)} PV`, "#F59E0B")}
        {card(
          "Top Performer",
          summary?.topPerformer?.name || "—",
          "#EC4899",
          summary?.topPerformer
            ? `${summary.topPerformer.userId} • Team ${num(summary.topPerformer.teamSize)}`
            : undefined,
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
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
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
            placeholder="Search name, mobile, user ID, referral code..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            style={{
              width: "100%",
              padding: "6px 10px 6px 30px",
              fontSize: "0.8rem",
            }}
          />
        </div>
        <select
          className="form-input"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          style={{ padding: "6px 8px", fontSize: "0.8rem" }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={applySearch}
          style={{ padding: "7px 16px", fontSize: "0.8rem" }}
        >
          Search
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setSearchDraft("");
            setSearch("");
            setSortBy("TEAM");
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
          disabled={members.length === 0}
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

      {/* Table */}
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
              <th style={{ padding: "12px 16px" }}>Rank</th>
              <th style={{ padding: "12px 16px" }}>Member</th>
              <th style={{ padding: "12px 16px" }}>Parent</th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>
                Direct
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>
                Left
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>
                Right
              </th>
              <th style={{ padding: "12px 16px", textAlign: "center" }}>
                Total Team
              </th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>
                Matched PV
              </th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>
                Earnings
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Loading leaderboard...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No MLM members found.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    background:
                      m.rank <= 3 && page === 1
                        ? "rgba(245,158,11,0.05)"
                        : "transparent",
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>{rankBadge(m.rank)}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ fontWeight: 800 }}>{m.name}</div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {m.userId}
                      {m.mobile ? ` • ${m.mobile}` : ""}
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {m.parent ? (
                      <>
                        <div style={{ fontWeight: 700 }}>{m.parent.name}</div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          {m.parent.userId}
                        </div>
                      </>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
                        ROOT
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontWeight: 800,
                    }}
                  >
                    {num(m.directCount)}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontWeight: 800,
                      color: "#10B981",
                    }}
                  >
                    {num(m.leftCount)}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontWeight: 800,
                      color: "#818CF8",
                    }}
                  >
                    {num(m.rightCount)}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                      {legBar(m.leftCount, m.rightCount)}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontWeight: 900,
                    }}
                  >
                    {num(m.teamSize)}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#FBBF24",
                    }}
                  >
                    {num(m.matchedPV)} PV
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontWeight: 800,
                      color: "#34D399",
                    }}
                  >
                    {inr(m.totalEarnings)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
        <Trophy size={12} style={{ display: "inline", marginRight: 4 }} />
       Left/Right = entire team at all levels. 
        <span style={{ color: "#10B981", fontWeight: 700 }}>green = Left</span>,{" "}
        <span style={{ color: "#818CF8", fontWeight: 700 }}>purple = Right</span>.
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
            <strong>{pagination.totalPages}</strong> •{" "}
            {pagination.totalRecords} members
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