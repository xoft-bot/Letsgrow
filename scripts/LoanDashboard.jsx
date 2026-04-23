// LoanDashboard.jsx — Let's Grow Investment Club Admin Loan Dashboard
// Wires directly to loans_logic.js functions via your backend API
// Replace API_BASE with your actual backend URL

import { useState, useEffect } from "react";

const API_BASE = "/api/loans"; // adjust to your backend route

const STATUS_COLORS = {
  healthy:  { bg: "bg-green-100",  text: "text-green-800",  badge: "bg-green-500"  },
  caution:  { bg: "bg-yellow-100", text: "text-yellow-800", badge: "bg-yellow-500" },
  restrict: { bg: "bg-red-100",    text: "text-red-800",    badge: "bg-red-500"    },
};

const CYCLE_COLORS = {
  1: "bg-blue-100 text-blue-800",
  2: "bg-purple-100 text-purple-800",
  3: "bg-green-100 text-green-800",
};

function ugx(n) {
  if (!n && n !== 0) return "—";
  return "UGX " + Math.round(n).toLocaleString();
}

function pct(n) {
  return (n ?? 0).toFixed(1) + "%";
}

// ─────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color = "gray" }) {
  const colors = {
    gray:   "border-gray-200 bg-white",
    green:  "border-green-300 bg-green-50",
    yellow: "border-yellow-300 bg-yellow-50",
    red:    "border-red-300 bg-red-50",
    blue:   "border-blue-300 bg-blue-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAR METER
// ─────────────────────────────────────────────────────────────
function PARMeter({ parPercent, status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.healthy;
  const width = Math.min(parPercent, 25); // cap display at 25%
  const fillColor = status === "healthy" ? "bg-green-500"
    : status === "caution" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`rounded-xl border p-4 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Portfolio at Risk (PAR)</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${colors.badge}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>{pct(parPercent)}</p>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fillColor}`}
          style={{ width: `${(width / 25) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0%</span><span>10% ⚠</span><span>15% 🚨</span><span>25%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CYCLE BADGE
// ─────────────────────────────────────────────────────────────
function CycleBadge({ cycle }) {
  const labels = { 1: "Cycle 1 — 60%", 2: "Cycle 2 — 80%", 3: "Cycle 3 — 100%" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CYCLE_COLORS[cycle] || "bg-gray-100 text-gray-700"}`}>
      {labels[cycle] || `Cycle ${cycle}`}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// LOAN ROW
// ─────────────────────────────────────────────────────────────
function LoanRow({ loan, onSelect }) {
  const overdueInstallments = loan.schedule?.filter(s => s.status === "overdue") || [];
  const nextDue = loan.schedule?.find(s => s.status === "pending");

  return (
    <tr
      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onSelect(loan)}
    >
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 text-sm">{loan.memberId}</p>
        <p className="text-xs text-gray-400">{loan.loanId?.slice(0, 8)}...</p>
      </td>
      <td className="px-4 py-3 text-sm">{ugx(loan.amount)}</td>
      <td className="px-4 py-3 text-sm">{loan.loanType}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          loan.status === "active"  ? "bg-blue-100 text-blue-700" :
          loan.status === "overdue" ? "bg-red-100 text-red-700"   :
          "bg-gray-100 text-gray-600"
        }`}>
          {loan.status}
          {overdueInstallments.length > 0 && ` (${overdueInstallments.length} overdue)`}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{ugx(loan.outstandingBalance)}</td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {nextDue ? nextDue.dueDate : "—"}
      </td>
      <td className="px-4 py-3">
        <CycleBadge cycle={loan.cycleAtIssuance} />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// LOAN DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function LoanDetailModal({ loan, onClose, onRepayment }) {
  const [installmentNum, setInstallmentNum] = useState(1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!loan) return null;

  async function handleRepayment() {
    if (!amount || isNaN(amount)) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: loan.loanId, installmentNumber: installmentNum, amountPaid: Number(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `Installment ${installmentNum} recorded. Status: ${data.installmentStatus}` });
        onRepayment();
      } else {
        setMsg({ type: "error", text: data.error || "Failed" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="p-5 border-b flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{loan.memberId}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{loan.loanId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Loan summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Loan Amount</p>
              <p className="font-bold text-gray-900">{ugx(loan.amount)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="font-bold text-red-600">{ugx(loan.outstandingBalance)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-bold text-gray-900">{loan.loanType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Penalty Accrued</p>
              <p className="font-bold text-orange-600">{ugx(loan.penaltyAccrued)}</p>
            </div>
          </div>

          {/* Repayment schedule */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Repayment Schedule</h3>
            <div className="space-y-2">
              {loan.schedule?.map(inst => (
                <div key={inst.installmentNumber}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    inst.status === "paid"    ? "bg-green-50 border border-green-200" :
                    inst.status === "overdue" ? "bg-red-50 border border-red-200"    :
                    inst.status === "partial" ? "bg-yellow-50 border border-yellow-200" :
                    "bg-gray-50 border border-gray-200"
                  }`}>
                  <div>
                    <span className="font-medium">Installment {inst.installmentNumber}</span>
                    <span className="text-xs text-gray-500 ml-2">Due {inst.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ugx(inst.total)}</p>
                    <p className="text-xs text-gray-500">{inst.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Record repayment */}
          {loan.status !== "completed" && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Record Repayment</h3>
              <div className="flex gap-2 mb-2">
                <select
                  value={installmentNum}
                  onChange={e => setInstallmentNum(Number(e.target.value))}
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                >
                  {loan.schedule?.filter(s => s.status !== "paid").map(s => (
                    <option key={s.installmentNumber} value={s.installmentNumber}>
                      Installment {s.installmentNumber}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (UGX)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                />
              </div>
              <button
                onClick={handleRepayment}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Recording..." : "Record Payment"}
              </button>
              {msg && (
                <p className={`text-xs mt-2 ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ISSUE LOAN PANEL
// ─────────────────────────────────────────────────────────────
function IssueLoanPanel({ onIssued }) {
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [loanType, setLoanType] = useState("60day");
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleCheck() {
    if (!memberId) return;
    setLoading(true);
    setEligibility(null);
    try {
      const res = await fetch(`${API_BASE}/eligibility/${memberId}`);
      const data = await res.json();
      setEligibility(data);
    } catch (e) {
      setEligibility({ eligible: false, reason: e.message });
    }
    setLoading(false);
  }

  async function handleIssue() {
    if (!memberId || !amount) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount: Number(amount), loanType }),
      });
      const data = await res.json();
      if (data.loanId) {
        setMsg({ type: "success", text: `Loan issued! ID: ${data.loanId}` });
        setMemberId(""); setAmount(""); setEligibility(null);
        onIssued();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to issue loan" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="text-base font-bold text-gray-900 mb-4">Issue New Loan</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            placeholder="Member ID (e.g. kirabira_jude)"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1"
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Check
          </button>
        </div>

        {eligibility && (
          <div className={`rounded-lg p-3 text-sm ${eligibility.eligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {eligibility.eligible ? (
              <div className="space-y-1">
                <p className="font-semibold text-green-700">✅ Eligible</p>
                <p className="text-gray-600">Savings: {ugx(eligibility.eligibleSavings)}</p>
                <p className="text-gray-600">Max loan: {ugx(eligibility.maxLoan)}</p>
                <p className="text-gray-600">
                  Cycle {eligibility.currentCycle} limit ({eligibility.cyclePercent}%): <strong>{ugx(eligibility.cycleLimit)}</strong>
                </p>
              </div>
            ) : (
              <p className="text-red-700 font-medium">❌ {eligibility.reason}</p>
            )}
          </div>
        )}

        {eligibility?.eligible && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Amount (UGX)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={eligibility.cycleLimit}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={loanType}
                onChange={e => setLoanType(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="60day">60-Day (Reducing 5%)</option>
                <option value="30day">30-Day (Flat 5%)</option>
              </select>
            </div>
            <button
              onClick={handleIssue}
              disabled={loading || !amount}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Issuing..." : "Issue Loan"}
            </button>
          </>
        )}

        {msg && (
          <p className={`text-xs ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function LoanDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load dashboard", e);
    }
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  const { summary, activeLoans, overdueAlerts, lendingRestricted } = data || {};
  const filteredLoans = activeTab === "overdue"
    ? (activeLoans || []).filter(l => l.isOverdue)
    : (activeLoans || []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loan Dashboard</h1>
          <p className="text-xs text-gray-500">Let's Grow Investment Club</p>
        </div>
        <button
          onClick={loadDashboard}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-600"
        >
          Refresh
        </button>
      </div>

      {/* Lending restricted banner */}
      {lendingRestricted && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-center gap-2">
          <span className="text-red-500 text-lg">🚨</span>
          <p className="text-sm font-semibold text-red-700">
            Lending restricted — PAR above 15%. Resolve overdue loans before issuing new ones.
          </p>
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Loan Pool" value={ugx(summary?.totalLoanPool)} sub="Total pool" color="blue" />
        <SummaryCard label="Available" value={ugx(summary?.availableToLend)} sub="Ready to lend" color="green" />
        <SummaryCard label="Outstanding" value={ugx(summary?.totalOutstanding)} sub={`${summary?.activeLoansCount} active loans`} />
        <SummaryCard
          label="Overdue"
          value={ugx(summary?.totalOverdue)}
          sub={`${summary?.overdueCount} loans overdue`}
          color={summary?.overdueCount > 0 ? "red" : "gray"}
        />
      </div>

      {/* PAR + Utilization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PARMeter parPercent={summary?.parPercent || 0} status={summary?.parStatus || "healthy"} />
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Pool Utilization</p>
          <p className="text-2xl font-bold text-gray-900">{pct(summary?.utilizationRate)}</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(summary?.utilizationRate || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Target: 50–60% · Max: 80%</p>
        </div>
      </div>

      {/* Issue Loan + Active Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <IssueLoanPanel onIssued={loadDashboard} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border">
          {/* Tabs */}
          <div className="flex border-b">
            {["active", "overdue"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-green-600 text-green-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab} {tab === "overdue" && overdueAlerts?.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {overdueAlerts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredLoans.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No {activeTab} loans</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-2 font-medium">Member</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Outstanding</th>
                    <th className="px-4 py-2 font-medium">Next Due</th>
                    <th className="px-4 py-2 font-medium">Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map(loan => (
                    <LoanRow key={loan.loanId} loan={loan} onSelect={setSelectedLoan} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Loan detail modal */}
      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onRepayment={() => { loadDashboard(); setSelectedLoan(null); }}
        />
      )}
    </div>
  );
}
