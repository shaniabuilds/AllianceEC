import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { requestWithdrawal, fetchPayoutProfile } from "../services/withdrawalService";

interface Props { available: number; onClose: () => void; onDone: () => void; }

export const MlmWithdrawModal: React.FC<Props> = ({ available, onClose, onDone }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"BANK" | "UPI">("BANK");
  const [holder, setHolder] = useState("");
  const [accNo, setAccNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bank, setBank] = useState("");
  const [upi, setUpi] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPayoutProfile().then((res) => {
      const p = res.data?.payoutProfile;
      if (!p) return;
      if (p.preferredMethod) setMethod(p.preferredMethod);
      setHolder(p.bankAccount?.accountHolderName || "");
      setAccNo(p.bankAccount?.accountNumber || "");
      setIfsc(p.bankAccount?.ifscCode || "");
      setBank(p.bankAccount?.bankName || "");
      setUpi(p.upi?.upiId || "");
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const amt = Number(amount);
    if (isNaN(amt) || amt < 50) return setErr("Minimum withdrawal is ₹50.");
    if (amt > available) return setErr(`Maximum available is ₹${available.toLocaleString("en-IN")}.`);
    if (method === "BANK" && (!holder.trim() || !accNo.trim() || ifsc.trim().length < 5))
      return setErr("Enter account holder, account number and IFSC.");
    if (method === "UPI" && !upi.includes("@")) return setErr("Enter a valid UPI ID.");

    setBusy(true);
    const res = await requestWithdrawal({
      amount: amt,
      payoutMethod: method,
      bankDetails: method === "BANK"
        ? { accountHolderName: holder.trim(), accountNumber: accNo.trim(), ifscCode: ifsc.trim(), bankName: bank.trim() }
        : undefined,
      upiDetails: method === "UPI" ? { upiId: upi.trim() } : undefined,
      saveAsDefault: true,
    });
    setBusy(false);
    if (res.success) { onDone(); onClose(); } else setErr(res.message || "Withdrawal failed.");
  };

  const input = { padding: "8px 10px", fontSize: "0.85rem", width: "100%" } as const;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: 22, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Withdraw Earnings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12 }}>
          Available: <strong>₹{available.toLocaleString("en-IN")}</strong> · Min ₹50
        </div>
        {err && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(244,63,94,0.15)", color: "#FB7185", fontSize: "0.8rem", marginBottom: 10 }}>{err}</div>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="form-input" type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} style={input} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className={method === "BANK" ? "btn-primary" : "btn-secondary"} onClick={() => setMethod("BANK")} style={{ flex: 1, padding: 8 }}>Bank</button>
            <button type="button" className={method === "UPI" ? "btn-primary" : "btn-secondary"} onClick={() => setMethod("UPI")} style={{ flex: 1, padding: 8 }}>UPI</button>
          </div>
          {method === "BANK" ? (
            <>
              <input className="form-input" placeholder="Account holder name" value={holder} onChange={(e) => setHolder(e.target.value)} style={input} />
              <input className="form-input" placeholder="Account number" value={accNo} onChange={(e) => setAccNo(e.target.value)} style={input} />
              <input className="form-input" placeholder="IFSC code" maxLength={11} value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} style={input} />
              <input className="form-input" placeholder="Bank name (optional)" value={bank} onChange={(e) => setBank(e.target.value)} style={input} />
            </>
          ) : (
            <input className="form-input" placeholder="UPI ID (name@bank)" value={upi} onChange={(e) => setUpi(e.target.value)} style={input} />
          )}
          <button type="submit" className="btn-emerald" disabled={busy} style={{ padding: 10, fontWeight: 800 }}>
            {busy ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};