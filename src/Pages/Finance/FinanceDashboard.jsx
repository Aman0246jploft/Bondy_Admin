import React, { useState, useEffect, useCallback } from "react";
import authAxiosClient from "../../api/authAxiosClient";
import financeApi from "../../api/financeApi";
import { toast } from "react-toastify";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₮${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "blue" }) => {
  const border = {
    blue: "border-blue-400",
    green: "border-green-400",
    yellow: "border-yellow-400",
    red: "border-red-400",
    purple: "border-purple-400",
    indigo: "border-indigo-400",
  }[color] || "border-blue-400";

  return (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${border}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

// ─── Approve Modal ────────────────────────────────────────────────────────────
const ApproveModal = ({ payout, onClose, onDone }) => {
  const [txnId, setTxnId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!txnId.trim()) {
      toast.error("Payment reference / transaction ID is required.");
      return;
    }
    setLoading(true);
    try {
      await financeApi.approvePayout(payout._id, txnId.trim(), note.trim());
      toast.success("Payout approved successfully!");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Failed to approve payout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Approve Payout</h3>
        <p className="text-sm text-gray-500 mb-4">
          Organizer:{" "}
          <strong>
            {payout.organizerId?.firstName} {payout.organizerId?.lastName}
          </strong>{" "}
          &nbsp;|&nbsp; Amount: <strong>{fmt(payout.amount)}</strong>
        </p>
        <form onSubmit={handle} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference / Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. BankRef-20240313-001"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Note (optional)
            </label>
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Internal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Approving..." : "Approve & Mark Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ payout, onClose, onDone }) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setLoading(true);
    try {
      await financeApi.rejectPayout(payout._id, note.trim());
      toast.success("Payout rejected and balance refunded.");
      onDone();
    } catch (err) {
      toast.error(err?.message || "Failed to reject payout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Reject Payout</h3>
        <p className="text-sm text-gray-500 mb-4">
          Organizer:{" "}
          <strong>
            {payout.organizerId?.firstName} {payout.organizerId?.lastName}
          </strong>{" "}
          &nbsp;|&nbsp; Amount: <strong>{fmt(payout.amount)}</strong>
        </p>
        <form onSubmit={handle} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Reason for rejection..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Rejecting..." : "Reject & Refund Balance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const FinanceDashboard = () => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // Commission setting
  const [commission, setCommission] = useState(null);
  const [commissionEdit, setCommissionEdit] = useState(false);
  const [commissionVal, setCommissionVal] = useState("");
  const [commissionSaving, setCommissionSaving] = useState(false);

  // ── Fetch Stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await financeApi.getFinanceStats();
      if (res?.status) setStats(res.data);
    } catch (err) {
      toast.error("Failed to load finance stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch Payouts ──
  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const res = await financeApi.getAllPayouts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page,
        limit: LIMIT,
        search: search || undefined,
      });
      if (res?.status) {
        setPayouts(res.data.payouts || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load payouts.");
    } finally {
      setPayoutsLoading(false);
    }
  }, [statusFilter, page, search]);

  // ── Fetch Commission Setting ──
  const fetchCommission = useCallback(async () => {
    try {
      const res = await financeApi.getGlobalSettings();
      if (res?.status) {
        const cfg = res.data?.settings?.find?.((s) => s.key === "COMMISSION_CONFIG");
        if (cfg) {
          setCommission(cfg.value);
          setCommissionVal(cfg.value);
        }
      }
    } catch (_) { }
  }, []);

  useEffect(() => { fetchStats(); fetchCommission(); }, [fetchStats, fetchCommission]);
  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleCommissionSave = async () => {
    const val = Number(commissionVal);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Commission must be between 0 and 100.");
      return;
    }
    setCommissionSaving(true);
    try {
      await financeApi.updateGlobalSetting("COMMISSION_CONFIG", String(val));
      setCommission(String(val));
      setCommissionEdit(false);
      toast.success("Commission updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update commission.");
    } finally {
      setCommissionSaving(false);
    }
  };

  const onActionDone = () => {
    setApproveTarget(null);
    setRejectTarget(null);
    fetchStats();
    fetchPayouts();
  };

  return (
    <div className="p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Revenue, commissions, payouts, and refunds at a glance.
          </p>
        </div>

        {/* Commission inline editor */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3">
          <span className="text-sm text-gray-500">Platform Commission:</span>
          {commissionEdit ? (
            <>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-20 border rounded px-2 py-1 text-sm"
                value={commissionVal}
                onChange={(e) => setCommissionVal(e.target.value)}
              />
              <span className="text-sm text-gray-500">%</span>
              <button
                onClick={handleCommissionSave}
                disabled={commissionSaving}
                className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {commissionSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setCommissionEdit(false); setCommissionVal(commission); }}
                className="text-gray-400 text-xs hover:text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-blue-600">
                {commission != null ? `${commission}%` : "—"}
              </span>
              <button
                onClick={() => setCommissionEdit(true)}
                className="text-xs text-blue-500 hover:underline"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} sub={`${stats.transactionCount} transactions`} color="blue" />
          <StatCard label="Platform Commission" value={fmt(stats.totalCommission)} color="indigo" />
          <StatCard label="Organizer Earnings" value={fmt(stats.totalOrganizerEarnings)} color="green" />
          <StatCard label="Total Payouts Made" value={fmt(stats.totalPayoutsMade)} color="purple" />
          <StatCard label="Pending Payouts" value={fmt(stats.pendingPayoutsAmount)} sub={`${stats.pendingPayoutCount} requests`} color="yellow" />
          <StatCard label="Refunds" value={fmt(stats.refundTotal)} sub={`${stats.refundCount} cases`} color="red" />
        </div>
      ) : null}

      {/* ── Recent Transactions ── */}
      {stats?.recentTransactions?.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-700">Recent Transactions (Last 10 Paid)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Booking ID", "Customer", "Item", "Type", "Total", "Commission", "Org. Earning", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{t.bookingId?.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{t.userId?.firstName} {t.userId?.lastName}</span>
                      <div className="text-xs text-gray-400">{t.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {t.eventId?.eventTitle || t.courseId?.courseTitle || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                        {t.bookingType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(t.totalAmount)}</td>
                    <td className="px-4 py-3 text-indigo-600">{fmt(t.commissionAmount)}</td>
                    <td className="px-4 py-3 text-green-600">{fmt(t.organizerEarning)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payout Requests ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-gray-700">Payout Requests</h2>
          <div className="flex gap-3 flex-wrap">
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled / Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["#", "Organizer", "Amount", "Payment Reference", "Status", "Requested On", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payoutsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Loading payouts...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                payouts.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      #{String(p._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">
                        {p.organizerId?.firstName} {p.organizerId?.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{p.organizerId?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {p.paymentReference || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setApproveTarget(p)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 font-medium"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(p)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 font-medium"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      ) : p.status === "PAID" ? (
                        <div>
                          <span className="text-xs text-green-600 font-medium">Paid</span>
                          {p.paidAt && <div className="text-xs text-gray-400">{fmtDate(p.paidAt)}</div>}
                          {p.adminNote && <div className="text-xs text-gray-400 truncate max-w-xs" title={p.adminNote}>{p.adminNote}</div>}
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs text-red-500 font-medium">Rejected</span>
                          {p.adminNote && <div className="text-xs text-gray-400 truncate max-w-xs" title={p.adminNote}>{p.adminNote}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Total: {total} request{total !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {approveTarget && (
        <ApproveModal
          payout={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={onActionDone}
        />
      )}
      {rejectTarget && (
        <RejectModal
          payout={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={onActionDone}
        />
      )}
    </div>
  );
};

export default FinanceDashboard;
