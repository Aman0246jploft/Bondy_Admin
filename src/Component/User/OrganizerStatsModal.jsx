import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import organizerStatsApi from "../../api/organizerStatsApi";

const OrganizerStatsModal = ({ organizer, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for all data
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [walletHistory, setWalletHistory] = useState([]);
    const [payouts, setPayouts] = useState([]);

    // Pagination states
    const [transactionPage, setTransactionPage] = useState(1);
    const [transactionTotal, setTransactionTotal] = useState(0);
    const [walletPage, setWalletPage] = useState(1);
    const [walletTotal, setWalletTotal] = useState(0);
    const [payoutPage, setPayoutPage] = useState(1);
    const [payoutTotal, setPayoutTotal] = useState(0);

    // Filter states
    const [transactionFilters, setTransactionFilters] = useState({
        status: "",
        bookingType: "",
        startDate: "",
        endDate: "",
    });
    const [walletFilters, setWalletFilters] = useState({
        type: "",
        startDate: "",
        endDate: "",
    });
    const [payoutFilters, setPayoutFilters] = useState({
        status: "",
    });

    const limit = 10;

    // Fetch summary on mount
    useEffect(() => {
        if (organizer?._id) {
            fetchSummary();
        }
    }, [organizer]);

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === "transactions" && (!transactions || transactions.length === 0)) {
            fetchTransactions();
        } else if (activeTab === "wallet" && (!walletHistory || walletHistory.length === 0)) {
            fetchWalletHistory();
        } else if (activeTab === "payouts" && (!payouts || payouts.length === 0)) {
            fetchPayouts();
        }
    }, [activeTab]);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await organizerStatsApi.getStatsSummary(organizer._id);
            if (response.data?.status) {
                setSummary(response.data.data);
            } else {
                setError(response.data?.message || "Failed to fetch summary");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error fetching summary");
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (page = transactionPage, filters = transactionFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit, ...filters };
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await organizerStatsApi.getTransactions(organizer._id, params);
            console.log("4444455", response)
            if (response.data?.status) {
                setTransactions(response.data.data.transactions);
                setTransactionTotal(response.data.data.pagination.total);
            } else {
                setError(response.data?.message || "Failed to fetch transactions");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error fetching transactions");
        } finally {
            setLoading(false);
        }
    };

    const fetchWalletHistory = async (page = walletPage, filters = walletFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit, ...filters };
            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await organizerStatsApi.getWalletHistory(organizer._id, params);
            if (response.data?.status) {
                setWalletHistory(response.data.data.walletHistory);
                setWalletTotal(response.data.data.pagination.total);
            } else {
                setError(response.data?.message || "Failed to fetch wallet history");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error fetching wallet history");
        } finally {
            setLoading(false);
        }
    };

    const fetchPayouts = async (page = payoutPage, filters = payoutFilters) => {
        setLoading(true);
        setError(null);
        try {
            const params = { page, limit, ...filters };
            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await organizerStatsApi.getPayouts(organizer._id, params);
            if (response.data?.status) {
                setPayouts(response.data.data.payouts);
                setPayoutTotal(response.data.data.pagination.total);
            } else {
                setError(response.data?.message || "Failed to fetch payouts");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error fetching payouts");
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionFilterChange = (key, value) => {
        const newFilters = { ...transactionFilters, [key]: value };
        setTransactionFilters(newFilters);
    };

    const applyTransactionFilters = () => {
        setTransactionPage(1);
        fetchTransactions(1, transactionFilters);
    };

    const handleWalletFilterChange = (key, value) => {
        const newFilters = { ...walletFilters, [key]: value };
        setWalletFilters(newFilters);
    };

    const applyWalletFilters = () => {
        setWalletPage(1);
        fetchWalletHistory(1, walletFilters);
    };

    const handlePayoutFilterChange = (value) => {
        const newFilters = { status: value };
        setPayoutFilters(newFilters);
    };

    const applyPayoutFilters = () => {
        setPayoutPage(1);
        fetchPayouts(1, payoutFilters);
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderOverviewTab = () => {
        if (!summary || !summary.wallet || !summary.events || !summary.courses || !summary.transactions) {
            return (
                <div className="p-8 flex items-center justify-center">
                    <div className="text-gray-600">
                        {loading ? "Loading summary..." : "No summary data available"}
                    </div>
                </div>
            );
        }

        return (
            <div className="p-6 space-y-6">
                {/* Wallet Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Current Wallet Balance</h3>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.wallet.currentBalance || 0)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Earnings</h3>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.wallet.totalEarnings || 0)}</p>
                    </div>
                </div>

                {/* Events & Courses */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Events</h3>
                        <p className="text-xl font-bold text-gray-800">{summary.events.totalEvents || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Upcoming Events</h3>
                        <p className="text-xl font-bold text-orange-600">{summary.events.upcomingEvents || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Live Events</h3>
                        <p className="text-xl font-bold text-green-600">{summary.events.liveEvents || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Courses</h3>
                        <p className="text-xl font-bold text-purple-600">{summary.courses.totalCourses || 0}</p>
                    </div>
                </div>

                {/* Transaction Stats */}
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Transaction Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-xl font-bold text-gray-800">{summary.transactions.totalBookings || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.transactions.totalRevenue || 0)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Admin Commission</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.transactions.totalCommission || 0)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Organizer Earning</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.transactions.totalOrganizerEarning || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransactionsTab = () => {
        return (
            <div className="p-6 space-y-4">
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <h3 className="font-semibold text-gray-700">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                            className="border p-2 rounded"
                            value={transactionFilters.status}
                            onChange={(e) => handleTransactionFilterChange("status", e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="FAILED">Failed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUND_INITIATED">Refund Initiated</option>
                        </select>
                        <select
                            className="border p-2 rounded"
                            value={transactionFilters.bookingType}
                            onChange={(e) => handleTransactionFilterChange("bookingType", e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="EVENT">Event</option>
                            <option value="COURSE">Course</option>
                        </select>
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={transactionFilters.startDate}
                            onChange={(e) => handleTransactionFilterChange("startDate", e.target.value)}
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={transactionFilters.endDate}
                            onChange={(e) => handleTransactionFilterChange("endDate", e.target.value)}
                            placeholder="End Date"
                        />
                    </div>
                    <button
                        onClick={applyTransactionFilters}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Apply Filters
                    </button>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Booking ID</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Type</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Item Name</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Customer</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Qty</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Total</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Admin Cut</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Organizer</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Status</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!transactions || transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center py-8 text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border text-sm">{txn.bookingId}</td>
                                        <td className="px-4 py-2 border text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${txn.bookingType === "EVENT" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                                {txn.bookingType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 border text-sm">{txn.itemName || "N/A"}</td>
                                        <td className="px-4 py-2 border text-sm">{txn.customerName?.trim() || txn.customerEmail || "N/A"}</td>
                                        <td className="px-4 py-2 border text-right text-sm">{txn.qty}</td>
                                        <td className="px-4 py-2 border text-right text-sm font-semibold">{formatCurrency(txn.totalAmount)}</td>
                                        <td className="px-4 py-2 border text-right text-sm text-red-600">{formatCurrency(txn.commissionAmount)}</td>
                                        <td className="px-4 py-2 border text-right text-sm text-green-600">{formatCurrency(txn.organizerEarning)}</td>
                                        <td className="px-4 py-2 border text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${txn.status === "PAID" ? "bg-green-100 text-green-700" :
                                                txn.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                                    txn.status === "FAILED" ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                                }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 border text-sm">{formatDate(txn.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total: {transactionTotal}</span>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={transactionPage === 1}
                            onClick={() => {
                                const newPage = transactionPage - 1;
                                setTransactionPage(newPage);
                                fetchTransactions(newPage, transactionFilters);
                            }}
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">Page {transactionPage} of {Math.ceil(transactionTotal / limit) || 1}</span>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={transactionPage >= Math.ceil(transactionTotal / limit)}
                            onClick={() => {
                                const newPage = transactionPage + 1;
                                setTransactionPage(newPage);
                                fetchTransactions(newPage, transactionFilters);
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderWalletTab = () => {
        return (
            <div className="p-6 space-y-4">
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <h3 className="font-semibold text-gray-700">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                            className="border p-2 rounded"
                            value={walletFilters.type}
                            onChange={(e) => handleWalletFilterChange("type", e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="TICKET_SALE">Ticket Sale</option>
                            <option value="PAYOUT_REQUEST">Payout Request</option>
                            <option value="PAYOUT_REJECTED">Payout Rejected</option>
                            <option value="REFUND">Refund</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={walletFilters.startDate}
                            onChange={(e) => handleWalletFilterChange("startDate", e.target.value)}
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            className="border p-2 rounded"
                            value={walletFilters.endDate}
                            onChange={(e) => handleWalletFilterChange("endDate", e.target.value)}
                            placeholder="End Date"
                        />
                    </div>
                    <button
                        onClick={applyWalletFilters}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Apply Filters
                    </button>
                </div>

                {/* Wallet History Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Type</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Amount</th>
                                <th className="px-4 py-2 border text-right text-sm font-semibold">Balance After</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Description</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!walletHistory || walletHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        No wallet history found
                                    </td>
                                </tr>
                            ) : (
                                walletHistory.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${entry.type === "TICKET_SALE" ? "bg-green-100 text-green-700" :
                                                entry.type === "PAYOUT_REQUEST" ? "bg-blue-100 text-blue-700" :
                                                    entry.type === "REFUND" ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                                }`}>
                                                {entry.type.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-2 border text-right text-sm font-semibold ${entry.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {entry.amount >= 0 ? "+" : ""}{formatCurrency(entry.amount)}
                                        </td>
                                        <td className="px-4 py-2 border text-right text-sm">{formatCurrency(entry.balanceAfter)}</td>
                                        <td className="px-4 py-2 border text-sm">{entry.description || "N/A"}</td>
                                        <td className="px-4 py-2 border text-sm">{formatDate(entry.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total: {walletTotal}</span>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={walletPage === 1}
                            onClick={() => {
                                const newPage = walletPage - 1;
                                setWalletPage(newPage);
                                fetchWalletHistory(newPage, walletFilters);
                            }}
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">Page {walletPage} of {Math.ceil(walletTotal / limit) || 1}</span>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={walletPage >= Math.ceil(walletTotal / limit)}
                            onClick={() => {
                                const newPage = walletPage + 1;
                                setWalletPage(newPage);
                                fetchWalletHistory(newPage, walletFilters);
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPayoutsTab = () => {
        return (
            <div className="p-6 space-y-4">
                {/* Filters */}
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <h3 className="font-semibold text-gray-700">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                            className="border p-2 rounded"
                            value={payoutFilters.status}
                            onChange={(e) => handlePayoutFilterChange(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button
                            onClick={applyPayoutFilters}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Payouts Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Amount</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Status</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Payment Reference</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Admin Note</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Requested Date</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold">Paid Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!payouts || payouts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No payout requests found
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => (
                                    <tr key={payout._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 border text-sm font-semibold">{formatCurrency(payout.amount)}</td>
                                        <td className="px-4 py-2 border text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${payout.status === "PAID" ? "bg-green-100 text-green-700" :
                                                payout.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 border text-sm">{payout.paymentReference || "N/A"}</td>
                                        <td className="px-4 py-2 border text-sm">{payout.adminNote || "N/A"}</td>
                                        <td className="px-4 py-2 border text-sm">{formatDate(payout.createdAt)}</td>
                                        <td className="px-4 py-2 border text-sm">{payout.paidAt ? formatDate(payout.paidAt) : "N/A"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total: {payoutTotal}</span>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={payoutPage === 1}
                            onClick={() => {
                                const newPage = payoutPage - 1;
                                setPayoutPage(newPage);
                                fetchPayouts(newPage, payoutFilters);
                            }}
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">Page {payoutPage} of {Math.ceil(payoutTotal / limit) || 1}</span>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            disabled={payoutPage >= Math.ceil(payoutTotal / limit)}
                            onClick={() => {
                                const newPage = payoutPage + 1;
                                setPayoutPage(newPage);
                                fetchPayouts(newPage, payoutFilters);
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        Organizer Statistics - {organizer?.firstName} {organizer?.lastName}
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-gray-300">
                        <AiOutlineClose size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-100">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-3 font-semibold ${activeTab === "overview"
                            ? "bg-white border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`px-6 py-3 font-semibold ${activeTab === "transactions"
                            ? "bg-white border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab("wallet")}
                        className={`px-6 py-3 font-semibold ${activeTab === "wallet"
                            ? "bg-white border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Wallet History
                    </button>
                    <button
                        onClick={() => setActiveTab("payouts")}
                        className={`px-6 py-3 font-semibold ${activeTab === "payouts"
                            ? "bg-white border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                    >
                        Payouts
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-gray-600">Loading...</div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                            {error}
                        </div>
                    )}
                    {!loading && !error && (
                        <>
                            {activeTab === "overview" && renderOverviewTab()}
                            {activeTab === "transactions" && renderTransactionsTab()}
                            {activeTab === "wallet" && renderWalletTab()}
                            {activeTab === "payouts" && renderPayoutsTab()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerStatsModal;
