import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEye, FiTrash2, FiCheckCircle, FiXCircle } from "react-icons/fi";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const ReportList = ({ title }) => {
    const { theme } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [filters, setFilters] = useState({
        status: "",
        search: "",
        startDate: "",
        endDate: "",
    });

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [resolveFormData, setResolveFormData] = useState({
        status: "resolved",
        adminComment: "",
        banUser: false,
    });
    const [resolveLoading, setResolveLoading] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                pageNo: page,
                size: limit,
                status: filters.status || undefined,
                search: filters.search || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            };

            const response = await authAxiosClient.get("/report/list", { params });

            if (response.data?.status) {
                setData(response.data.data.reports || []);
                setTotal(response.data.data.total || 0);
            }
        } catch (err) {
            console.error("Error fetching reports:", err);
            toast.error(err.message || "Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReports();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchReports]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleOpenResolveModal = (report) => {
        setSelectedReport(report);
        setResolveFormData({
            status: "approved",
            adminComment: "",
            banUser: false,
        });
        setIsResolveModalOpen(true);
    };

    const handleResolveReport = async (e) => {
        e.preventDefault();
        if (!selectedReport) return;

        setResolveLoading(true);
        try {
            const response = await authAxiosClient.post("/report/resolve", {
                id: selectedReport._id,
                status: resolveFormData.status,
                adminComment: resolveFormData.adminComment,
                banUser: resolveFormData.banUser,
            });

            if (response.data?.status) {
                toast.success(`Report ${resolveFormData.status} successfully`);
                setIsResolveModalOpen(false);
                fetchReports();
            }
        } catch (err) {
            toast.error(err.message || "Failed to resolve report");
        } finally {
            setResolveLoading(false);
        }
    };

    const handleDeleteReport = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report record?")) return;

        try {
            const response = await authAxiosClient.delete(`/report/delete/${id}`);
            if (response.data?.status) {
                toast.success("Report deleted successfully");
                fetchReports();
            }
        } catch (err) {
            toast.error(err.message || "Failed to delete report");
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status] || "bg-gray-100 text-gray-800"}`}>
                {status}
            </span>
        );
    };

    const formatDate = (date) => date ? new Date(date).toLocaleString() : "N/A";

    const columns = [
        {
            key: "fromUser",
            label: "Reporter",
            render: (val) => val ? `${val.firstName} ${val.lastName}` : "Unknown"
        },
        {
            key: "toUser",
            label: "Reported User",
            render: (val) => val ? `${val.firstName} ${val.lastName}` : "Unknown"
        },
        {
            key: "reason",
            label: "Reason",
        },
        {
            key: "status",
            label: "Status",
            render: (val) => getStatusBadge(val)
        },
        {
            key: "createdAt",
            label: "Date",
            render: (val) => formatDate(val)
        },
        {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
                <div className="flex gap-3">
                    <button onClick={() => { setSelectedReport(row); setIsDetailModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded" title="View Details">
                        <FiEye className="text-blue-500 w-4 h-4" />
                    </button>
                    {row.status === "pending" && (
                        <button
                            onClick={() => handleOpenResolveModal(row)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            title="Update Status"
                        >
                            Update
                        </button>
                    )}
                    <button onClick={() => handleDeleteReport(row._id)} className="p-1 hover:bg-gray-100 rounded" title="Delete">
                        <FiTrash2 className="text-red-500 w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input
                        type="text"
                        placeholder="Search reason..."
                        className="w-full border p-2 rounded"
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setFilters({
                                status: "",
                                search: "",
                                startDate: "",
                                endDate: "",
                            });
                            setPage(1);
                        }}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <DataTable columns={columns} data={data} loading={loading} />

            <div className="flex justify-between items-center mt-4">
                <span>Total: {total}</span>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </button>
                    <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page >= Math.ceil(total / limit) || loading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailModalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
                        <h3 className="text-xl font-bold mb-4">Report Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="font-bold">Reporter:</p><p>{selectedReport.fromUser?.firstName} {selectedReport.fromUser?.lastName}</p><p className="text-xs text-gray-500">{selectedReport.fromUser?.email}</p></div>
                                <div><p className="font-bold">Reported User:</p><p>{selectedReport.toUser?.firstName} {selectedReport.toUser?.lastName}</p><p className="text-xs text-gray-500">{selectedReport.toUser?.email}</p></div>
                            </div>
                            <div><p className="font-bold">Reason:</p><p>{selectedReport.reason}</p></div>
                            <div><p className="font-bold">Description:</p><p className="whitespace-pre-wrap">{selectedReport.description || "No description provided."}</p></div>
                            {selectedReport.status !== "pending" && (
                                <div className="border-t pt-4">
                                    <p className="font-bold">Resolution Details:</p>
                                    <p>Status: {getStatusBadge(selectedReport.status)}</p>
                                    <p>Comment: {selectedReport.adminComment || "N/A"}</p>
                                    <p>By: {selectedReport.resolvedBy?.firstName} {selectedReport.resolvedBy?.lastName}</p>
                                    <p>Date: {formatDate(selectedReport.resolvedAt)}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {isResolveModalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
                        <h3 className="text-xl font-bold mb-4">Update Report Status</h3>
                        <form onSubmit={handleResolveReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={resolveFormData.status}
                                    onChange={(e) => setResolveFormData(prev => ({ ...prev, status: e.target.value }))}
                                    required
                                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                                >
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Admin Comment</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    rows="4"
                                    value={resolveFormData.adminComment}
                                    onChange={(e) => setResolveFormData(prev => ({ ...prev, adminComment: e.target.value }))}
                                    placeholder="Add notes about this resolution..."
                                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                                />
                            </div>
                            {resolveFormData.status === "resolved" && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="banUser"
                                        className="w-4 h-4 cursor-pointer"
                                        checked={resolveFormData.banUser}
                                        onChange={(e) => setResolveFormData(prev => ({ ...prev, banUser: e.target.checked }))}
                                    />
                                    <label htmlFor="banUser" className="text-sm font-medium text-red-600 cursor-pointer">Ban Reported User (Disable Account)</label>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsResolveModalOpen(false)} className="px-4 py-2 border rounded" disabled={resolveLoading}>Cancel</button>
                                <button type="submit" className={`px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50`} disabled={resolveLoading}>
                                    {resolveLoading ? "Processing..." : `Confirm Update`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportList;
