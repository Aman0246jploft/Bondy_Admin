import React, { useState, useEffect, useCallback } from "react";
import authAxiosClient from "../../api/authAxiosClient";
import financeApi from "../../api/financeApi";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";

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

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";

const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REFUNDED: "bg-gray-100 text-gray-700 border-gray-200",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
  FAILED: "bg-rose-50 text-rose-800 border-rose-200",
};

const CATEGORY_CONFIG = {
  PURCHASE: {
    label: "User Purchase",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
  WALLET_DEPOSIT: {
    label: "Organizer Deposit",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
  REFUND: {
    label: "Refund",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`bg-white rounded-xl p-5 border border-gray-200 shadow-2xs transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300" : ""
        }`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
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

// ─── Transaction Detail Modal ────────────────────────────────────────────────
const TransactionDetailModal = ({ transaction, onClose, onApprove, onReject }) => {
  if (!transaction) return null;

  const categoryInfo = CATEGORY_CONFIG[transaction.type] || CATEGORY_CONFIG.PURCHASE;
  const statusClass = STATUS_COLORS[transaction.status] || "bg-gray-100 text-gray-700 border-gray-200";

  const isOutflow = transaction.type === "WITHDRAWAL";
  const isRefund = transaction.type === "REFUND";
  const isCredit = transaction.type === "PURCHASE" || transaction.type === "WALLET_DEPOSIT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-base font-bold text-gray-900">
              {transaction.displayId || `#${(transaction.bookingId?.slice(-8) || transaction._id?.slice(-8)).toUpperCase()}`}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryInfo.badge}`}>
              {transaction.typeLabel || categoryInfo.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
              {transaction.status || "PAID"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <AiOutlineClose className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Highlight Amount Banner */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/70 rounded-xl p-4 border border-gray-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-0.5">
                {isRefund ? "Refund Amount" : isOutflow ? "Withdrawal Amount" : "Transaction Amount"}
              </span>
              <div
                className={`text-2xl font-bold ${isRefund || isOutflow ? "text-rose-600" : "text-gray-900"
                  }`}
              >
                {isRefund || isOutflow ? `-${fmt(transaction.totalAmount)}` : `+${fmt(transaction.totalAmount)}`}
              </div>
            </div>

            <div className="flex gap-2.5 flex-wrap text-xs">
              {transaction.type === "PURCHASE" && (
                <>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                    <span className="text-gray-400 block text-[10px]">Organizer Earning</span>
                    <span className="font-bold text-gray-800">{fmt(transaction.organizerEarning)}</span>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                    <span className="text-gray-400 block text-[10px]">Bondy Commission</span>
                    <span className="font-bold text-gray-800">{fmt(transaction.commissionAmount)}</span>
                  </div>
                </>
              )}
              {transaction.balanceAfter !== undefined && (
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                  <span className="text-gray-400 block text-[10px]">Wallet Balance After</span>
                  <span className="font-bold text-gray-800">{fmt(transaction.balanceAfter)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refund Notice (if present) */}
          {transaction.refundReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 text-xs">
              <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                <span>Refund Reason</span>
              </div>
              <div className="text-rose-700">{transaction.refundReason}</div>
            </div>
          )}

          {/* Involved Parties / Users */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Involved Parties / Users
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    Customer / Buyer
                  </span>
                </div>
                {transaction.userId ? (
                  <div>
                    <div className="font-semibold text-gray-900">
                      {transaction.userId.firstName} {transaction.userId.lastName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{transaction.userId.email}</div>
                    {transaction.userId.phone && (
                      <div className="text-xs text-gray-500 mt-0.5">Phone: {transaction.userId.phone}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No buyer attached (Direct organizer or wallet action)</p>
                )}
              </div>

              {/* Organizer Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    Organizer / Requester
                  </span>
                </div>
                {transaction.organizer ? (
                  <div>
                    <div className="font-semibold text-gray-900">
                      {transaction.organizer.firstName} {transaction.organizer.lastName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{transaction.organizer.email}</div>
                    {transaction.organizer.phone && (
                      <div className="text-xs text-gray-500 mt-0.5">Phone: {transaction.organizer.phone}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Bondy Platform / Internal</p>
                )}
              </div>
            </div>
          </div>

          {/* Service & Booking Details */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Transaction Details & Metadata
            </h4>
            <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Service / Title</span>
                <span className="font-medium text-gray-900 text-right">{transaction.itemTitle || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Activity Type</span>
                <span className="font-medium text-gray-900">{transaction.bookingType || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Booking / Internal Reference</span>
                <span className="font-mono text-gray-800">{transaction.bookingId || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Payment Channel</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {transaction.paymentMethod || "QPAY"}
                </span>
              </div>
              {transaction.paymentReference && (
                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Payment Reference / Txn No.</span>
                  <span className="font-mono text-gray-800">{transaction.paymentReference}</span>
                </div>
              )}
              {transaction.adminNote && (
                <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Admin Note</span>
                  <span className="text-gray-700">{transaction.adminNote}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Created Date & Time</span>
                <span className="text-gray-700">{fmtDateTime(transaction.createdAt)}</span>
              </div>
              {transaction.paidAt && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">Settled / Paid Date</span>
                  <span className="text-gray-700">{fmtDateTime(transaction.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Details (if Withdrawal) */}
          {transaction.bankDetails && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                Payout Bank Account Details
              </h4>
              <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-950">
                <div className="flex justify-between">
                  <span className="text-amber-800">Bank Name</span>
                  <span className="font-semibold">{transaction.bankDetails.bankName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Account Number</span>
                  <span className="font-mono font-bold">{transaction.bankDetails.accountNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">Account Holder</span>
                  <span className="font-semibold">{transaction.bankDetails.accountName || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="text-xs text-gray-400">
            Internal ID: <span className="font-mono">{transaction._id}</span>
          </div>
          <div className="flex items-center gap-2">
            {transaction.type === "WITHDRAWAL" && transaction.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(transaction);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition cursor-pointer"
                >
                  Approve Payout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReject(transaction);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition cursor-pointer"
                >
                  Reject Payout
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const FinanceDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "payouts" ? "payouts" : "transactions";
  const [activeTab, setActiveTab] = useState(currentTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "payouts" ? { tab: "payouts" } : {});
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "payouts") {
      setActiveTab("payouts");
    } else {
      setActiveTab("transactions");
    }
  }, [searchParams]);

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

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [txnTotal, setTxnTotal] = useState(0);

  // Advanced Ledger Filters
  const [txnCategory, setTxnCategory] = useState("ALL"); // ALL | PURCHASE | WALLET_DEPOSIT | WITHDRAWAL | REFUND
  const [txnStatus, setTxnStatus] = useState("ALL"); // ALL | PAID | PENDING | REFUNDED | CANCELLED
  const [txnPaymentMethod, setTxnPaymentMethod] = useState("ALL");
  const [txnStartDate, setTxnStartDate] = useState("");
  const [txnEndDate, setTxnEndDate] = useState("");
  const [txnDateError, setTxnDateError] = useState("");
  const [txnCounts, setTxnCounts] = useState({
    all: 0,
    purchases: 0,
    walletDeposits: 0,
    withdrawals: 0,
    refunds: 0,
  });

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Commission setting
  const [commission, setCommission] = useState(null);
  const [commissionEdit, setCommissionEdit] = useState(false);
  const [commissionVal, setCommissionVal] = useState("");
  const [commissionSaving, setCommissionSaving] = useState(false);

  // Min Payout setting
  const [minPayout, setMinPayout] = useState(null);
  const [minPayoutEdit, setMinPayoutEdit] = useState(false);
  const [minPayoutVal, setMinPayoutVal] = useState("");
  const [minPayoutSaving, setMinPayoutSaving] = useState(false);

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

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const res = await financeApi.getGlobalSettings();
      if (res?.status) {
        const settings = res.data?.settings || [];

        const commCfg = settings.find((s) => s.key === "COMMISSION_CONFIG");
        if (commCfg) {
          setCommission(commCfg.value);
          setCommissionVal(commCfg.value);
        }

        const minPayCfg = settings.find((s) => s.key === "MIN_PAYOUT_CONFIG");
        if (minPayCfg) {
          setMinPayout(minPayCfg.value);
          setMinPayoutVal(minPayCfg.value);
        } else {
          // Default if not set in DB
          setMinPayout("1000");
          setMinPayoutVal("1000");
        }
      }
    } catch (_) { }
  }, []);

  // ── Fetch Transactions (Unified Ledger) ──
  const fetchTransactions = useCallback(async () => {
    if (txnStartDate && txnEndDate && txnEndDate < txnStartDate) {
      return;
    }

    setTransactionsLoading(true);
    try {
      const res = await financeApi.getAllTransactions({
        page: txnPage,
        limit: LIMIT,
        type: txnCategory === "ALL" ? undefined : txnCategory,
        status: txnStatus === "ALL" ? undefined : txnStatus,
        paymentMethod: txnPaymentMethod === "ALL" ? undefined : txnPaymentMethod,
        startDate: txnStartDate || undefined,
        endDate: txnEndDate || undefined,
        search: txnSearch || undefined,
      });
      if (res?.status) {
        setTransactions(res.data.transactions || []);
        setTxnTotalPages(res.data.totalPages || 1);
        setTxnTotal(res.data.total || 0);
        if (res.data.counts) {
          setTxnCounts(res.data.counts);
        }
      }
    } catch (err) {
      toast.error("Failed to load transactions.");
    } finally {
      setTransactionsLoading(false);
    }
  }, [txnPage, txnCategory, txnStatus, txnPaymentMethod, txnStartDate, txnEndDate, txnSearch]);

  const handleStartDateChange = (val) => {
    setTxnStartDate(val);
    setTxnPage(1);
    if (val && txnEndDate && txnEndDate < val) {
      setTxnDateError("End date must be later than start date");
    } else {
      setTxnDateError("");
    }
  };

  const handleEndDateChange = (val) => {
    setTxnEndDate(val);
    setTxnPage(1);
    if (val && txnStartDate && val < txnStartDate) {
      setTxnDateError("End date must be later than start date");
    } else {
      setTxnDateError("");
    }
  };

  const handleClearTxnFilters = () => {
    setTxnCategory("ALL");
    setTxnStatus("ALL");
    setTxnPaymentMethod("ALL");
    setTxnStartDate("");
    setTxnEndDate("");
    setTxnDateError("");
    setTxnSearch("");
    setTxnPage(1);
  };

  useEffect(() => { fetchStats(); fetchGlobalSettings(); }, [fetchStats, fetchGlobalSettings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayouts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPayouts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

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

  const handleMinPayoutSave = async () => {
    const val = Number(minPayoutVal);
    if (isNaN(val) || val < 0) {
      toast.error("Minimum payout must be a positive number.");
      return;
    }
    setMinPayoutSaving(true);
    try {
      await financeApi.updateGlobalSetting("MIN_PAYOUT_CONFIG", String(val));
      setMinPayout(String(val));
      setMinPayoutEdit(false);
      toast.success("Minimum payout updated.");
    } catch (err) {
      toast.error(err?.message || "Failed to update minimum payout.");
    } finally {
      setMinPayoutSaving(false);
    }
  };

  const onActionDone = () => {
    setApproveTarget(null);
    setRejectTarget(null);
    setSelectedTxn(null);
    fetchStats();
    fetchPayouts();
    fetchTransactions();
  };

  const openPayoutDetail = (p) => {
    setSelectedTxn({
      _id: p._id,
      displayId: `#PO-${String(p._id).slice(-6).toUpperCase()}`,
      bookingId: p.paymentReference || `PO-${String(p._id).slice(-6)}`,
      type: "WITHDRAWAL",
      typeLabel: "Organizer Withdrawal",
      flow: "OUTFLOW",
      bookingType: "PAYOUT",
      itemTitle: p.paymentReference ? `Payout: ${p.paymentReference}` : "Organizer Payout Request",
      description: p.adminNote || (p.paymentReference ? `Ref: ${p.paymentReference}` : "Withdrawal to bank account"),
      userId: null,
      organizer: p.organizerId,
      bankDetails: p.bankDetails || p.organizerId?.bankDetails || null,
      totalAmount: p.amount || 0,
      organizerEarning: -(p.amount || 0),
      commissionAmount: 0,
      status: p.status || "PENDING",
      paymentMethod: "BANK_TRANSFER",
      paymentReference: p.paymentReference,
      adminNote: p.adminNote,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
    });
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
        <div className="flex flex-wrap items-center gap-4">
          {/* Commission inline editor */}
          {/* <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3">
            <span className="text-sm text-gray-500">Commission:</span>
            {commissionEdit ? (
              <>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-16 border rounded px-2 py-1 text-sm font-semibold"
                  value={commissionVal}
                  onChange={(e) => setCommissionVal(e.target.value)}
                />
                <span className="text-sm text-gray-500">%</span>
                <button
                  onClick={handleCommissionSave}
                  disabled={commissionSaving}
                  className="bg-teal-500 text-white text-xs px-2 py-1 rounded hover:bg-teal-600 disabled:opacity-50"
                >
                  {commissionSaving ? "..." : "Save"}
                </button>
                <button
                  onClick={() => { setCommissionEdit(false); setCommissionVal(commission); }}
                  className="text-gray-400 text-xs hover:text-gray-600 underline"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-teal-600">
                  {commission != null ? `${commission}%` : "—"}
                </span>
                <button
                  onClick={() => setCommissionEdit(true)}
                  className="text-xs text-teal-500 hover:underline"
                >
                  Edit
                </button>
              </>
            )}
          </div> */}

          {/* Min Payout inline editor */}
          <div className="flex items-center gap-3 bg-white rounded-xl shadow px-4 py-3">
            <span className="text-sm text-gray-500">Min Payout:</span>
            {minPayoutEdit ? (
              <>
                <span className="text-sm text-gray-500">₮</span>
                <input
                  type="number"
                  min={0}
                  className="w-24 border rounded px-2 py-1 text-sm font-semibold"
                  value={minPayoutVal}
                  onChange={(e) => setMinPayoutVal(e.target.value)}
                />
                <button
                  onClick={handleMinPayoutSave}
                  disabled={minPayoutSaving}
                  className="bg-teal-500 text-white text-xs px-2 py-1 rounded hover:bg-teal-600 disabled:opacity-50"
                >
                  {minPayoutSaving ? "..." : "Save"}
                </button>
                <button
                  onClick={() => { setMinPayoutEdit(false); setMinPayoutVal(minPayout); }}
                  className="text-gray-400 text-xs hover:text-gray-600 underline"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-teal-600">
                  ₮{Number(minPayout || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => setMinPayoutEdit(true)}
                  className="text-xs text-teal-500 hover:underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Revenue"
            value={fmt(stats.totalRevenue)}
            sub={`${stats.transactionCount} transactions`}
            onClick={() => {
              handleTabChange("transactions");
              setTxnCategory("PURCHASE");
              setTxnPage(1);
            }}
          />
          <StatCard
            label="Organizer Earnings"
            value={fmt(stats.totalOrganizerEarnings)}
            sub="Wallet credited from sales"
            onClick={() => {
              handleTabChange("transactions");
              setTxnCategory("WALLET_DEPOSIT");
              setTxnPage(1);
            }}
          />
          <StatCard
            label="Total Payouts Made"
            value={fmt(stats.totalPayoutsMade)}
            sub="Completed bank transfers"
            onClick={() => handleTabChange("payouts")}
          />
          <StatCard
            label="Pending Payouts"
            value={fmt(stats.pendingPayoutsAmount)}
            sub={`${stats.pendingPayoutCount} requests`}
            onClick={() => handleTabChange("payouts")}
          />
          <StatCard
            label="Total Refunds"
            value={fmt(stats.refundTotal)}
            sub={`${stats.refundCount} cases`}
            onClick={() => {
              handleTabChange("transactions");
              setTxnCategory("REFUND");
              setTxnPage(1);
            }}
          />
        </div>
      ) : null}

      {/* ── Tabs Navigation Bar ── */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange("transactions")}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === "transactions"
            ? "border-[#23ada4] text-[#23ada4]"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          <span>Transactions Ledger</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {txnCounts.all || txnTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("payouts")}
          className={`pb-3 px-4 text-sm font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === "payouts"
            ? "border-[#23ada4] text-[#23ada4]"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          <span>Payout Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {stats?.pendingPayoutCount > 0 ? `${stats.pendingPayoutCount} Pending` : total}
          </span>
        </button>
      </div>

      {/* ── Transactions Tab Content ── */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl shadow overflow-hidden space-y-4">
          {/* Category Tabs Header */}
          <div className="p-4 border-b bg-gray-50/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: "All Transactions", count: txnCounts.all || txnTotal },
                { id: "PURCHASE", label: "User Purchases", count: txnCounts.purchases },
                { id: "WALLET_DEPOSIT", label: "Organizer Deposits", count: txnCounts.walletDeposits },
                { id: "WITHDRAWAL", label: "Withdrawals", count: txnCounts.withdrawals },
                { id: "REFUND", label: "Refunds & Deductions", count: txnCounts.refunds },
              ].map((tab) => {
                const isActive = txnCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setTxnCategory(tab.id);
                      setTxnPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${isActive
                      ? "bg-gray-900 text-white border-gray-900 shadow-2xs font-semibold"
                      : "bg-white text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {tab.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search ID, customer, organizer, item..."
                className="w-full sm:w-72 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                value={txnSearch}
                onChange={(e) => { setTxnSearch(e.target.value); setTxnPage(1); }}
              />
            </div>
          </div>

          {/* Secondary Controls Bar: Multi-dimensional Filters */}
          <div className="px-4 pb-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                className="w-full border rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                value={txnStatus}
                onChange={(e) => {
                  setTxnStatus(e.target.value);
                  setTxnPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid / Completed</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled / Failed</option>
              </select>
            </div>



            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                max={txnEndDate || undefined}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${txnDateError ? "border-red-500" : ""
                  }`}
                value={txnStartDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                min={txnStartDate || undefined}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${txnDateError ? "border-red-500" : ""
                  }`}
                value={txnEndDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
              {txnDateError && (
                <p className="text-red-500 text-[10px] mt-0.5 font-medium">{txnDateError}</p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={handleClearTxnFilters}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100/70 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Master Transactions Ledger Table */}
          <div className="table-responsive overflow-x-auto border-t">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Ref / ID</th>
                  <th className="px-4 py-3 text-left">Type & Flow</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Item / Details</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {transactionsLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      Loading financial ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      No matching financial transactions found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const categoryInfo = CATEGORY_CONFIG[t.type] || CATEGORY_CONFIG.PURCHASE;
                    const statusClass = STATUS_COLORS[t.status] || "bg-gray-100 text-gray-700 border-gray-200";

                    const isOutflow = t.type === "WITHDRAWAL";
                    const isRefund = t.type === "REFUND";
                    const isCredit = t.type === "PURCHASE" || t.type === "WALLET_DEPOSIT";

                    return (
                      <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* ID / Ref (Clickable to open Detail Modal) */}
                        <td className="px-4 py-3 font-mono">
                          <button
                            type="button"
                            onClick={() => setSelectedTxn(t)}
                            className="font-semibold text-gray-800 hover:text-teal-600 hover:underline text-left cursor-pointer transition block"
                            title="Click to view full transaction details"
                          >
                            {t.displayId || `#${(t.bookingId?.slice(-8) || t._id?.slice(-8)).toUpperCase()}`}
                          </button>
                          {t.bookingId && t.bookingId !== t.displayId && (
                            <div className="text-[10px] text-gray-400 truncate max-w-[120px]" title={t.bookingId}>
                              {t.bookingId}
                            </div>
                          )}
                        </td>

                        {/* Type & Flow */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${categoryInfo.badge}`}>
                            {t.typeLabel || categoryInfo.label}
                          </span>
                        </td>

                        {/* Customer & Organizer (Merged Single Column) */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5 min-w-[190px] max-w-[240px]">
                            {/* Customer */}
                            {t.userId ? (
                              <div className="flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  User
                                </span>
                                <div className="truncate">
                                  <div className="font-medium text-gray-900 truncate" title={`${t.userId.firstName || ""} ${t.userId.lastName || ""}`}>
                                    {t.userId.firstName} {t.userId.lastName}
                                  </div>
                                  <div className="text-[10px] text-gray-400 truncate" title={t.userId.email}>
                                    {t.userId.email}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {/* Organizer */}
                            {t.organizer ? (
                              <div className="flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  Org
                                </span>
                                <div className="truncate">
                                  <div className="font-medium text-gray-800 truncate" title={`${t.organizer.firstName || ""} ${t.organizer.lastName || ""}`}>
                                    {t.organizer.firstName} {t.organizer.lastName}
                                  </div>
                                  <div className="text-[10px] text-gray-400 truncate" title={t.organizer.email}>
                                    {t.organizer.email}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {!t.userId && !t.organizer && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Item / Description */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-medium text-gray-800 truncate" title={t.itemTitle || t.description}>
                            {t.itemTitle || t.description || "—"}
                          </div>
                          {t.refundReason && (
                            <div className="text-[10px] text-rose-500 truncate" title={t.refundReason}>
                              Reason: {t.refundReason}
                            </div>
                          )}
                          {t.balanceAfter !== undefined && (
                            <div className="text-[10px] text-gray-400">
                              Bal after: {fmt(t.balanceAfter)}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`font-semibold ${isRefund || isOutflow ? "text-rose-600" : "text-gray-900"
                            }`}>
                            {isRefund || isOutflow ? `-${fmt(t.totalAmount)}` : `+${fmt(t.totalAmount)}`}
                          </div>
                          {t.type === "PURCHASE" && t.organizerEarning !== undefined && (
                            <div className="text-[10px] text-gray-400">
                              Org: {fmt(t.organizerEarning)}
                            </div>
                          )}
                        </td>

                        {/* Channel */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {t.paymentMethod || "QPAY"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass}`}>
                            {t.status || "PAID"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {fmtDateTime(t.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTxn(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 rounded-md text-xs font-medium transition cursor-pointer border border-gray-200 hover:border-teal-200"
                              title="View complete transaction breakdown"
                            >
                              <FiEye className="w-3.5 h-3.5 text-gray-500" />
                              <span>Details</span>
                            </button>

                            {t.type === "WITHDRAWAL" && t.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveTarget({ ...t, organizerId: t.organizer, amount: t.totalAmount })}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-[10px] font-medium hover:bg-green-600 transition cursor-pointer"
                                  title="Approve Payout"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectTarget({ ...t, organizerId: t.organizer, amount: t.totalAmount })}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-medium hover:bg-red-600 transition cursor-pointer"
                                  title="Reject Payout"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              Showing {transactions.length > 0 ? (txnPage - 1) * LIMIT + 1 : 0} – {Math.min(txnPage * LIMIT, txnTotal)} of {txnTotal} record{txnTotal !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                disabled={txnPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition"
              >
                ← Prev
              </button>
              <span className="px-3 py-1 text-xs text-gray-600 font-medium">
                Page {txnPage} of {txnTotalPages || 1}
              </span>
              <button
                onClick={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))}
                disabled={txnPage >= txnTotalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payout Requests Tab Content ── */}
      {activeTab === "payouts" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-gray-700">Payout Requests</h2>
            <div className="flex gap-3 flex-wrap">
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                className="border rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="table-responsive overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  {["Request ID", "Organizer", "Amount", "Payment Reference", "Status", "Requested On", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
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
                  payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* ID / Ref (Clickable) */}
                      <td className="px-4 py-3 font-mono">
                        <button
                          type="button"
                          onClick={() => openPayoutDetail(p)}
                          className="font-semibold text-gray-800 hover:text-teal-600 hover:underline text-left cursor-pointer transition block"
                          title="Click to view full payout details"
                        >
                          #{String(p._id).slice(-6).toUpperCase()}
                        </button>
                      </td>

                      {/* Organizer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {p.organizerId?.firstName} {p.organizerId?.lastName}
                        </div>
                        <div className="text-xs text-gray-400">{p.organizerId?.email}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(p.amount)}
                      </td>

                      {/* Payment Reference */}
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate font-mono">
                        {p.paymentReference || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Requested Date */}
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {fmtDateTime(p.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPayoutDetail(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 rounded-md text-xs font-medium transition cursor-pointer border border-gray-200 hover:border-teal-200"
                            title="View complete payout details"
                          >
                            <FiEye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Details</span>
                          </button>

                          {p.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApproveTarget(p)}
                                className="px-2.5 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition cursor-pointer"
                                title="Approve Payout"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(p)}
                                className="px-2.5 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition cursor-pointer"
                                title="Reject Payout"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
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
      )}

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
      {selectedTxn && (
        <TransactionDetailModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onApprove={(t) => setApproveTarget({ ...t, organizerId: t.organizer, amount: t.totalAmount })}
          onReject={(t) => setRejectTarget({ ...t, organizerId: t.organizer, amount: t.totalAmount })}
        />
      )}
    </div>
  );
};

export default FinanceDashboard;
