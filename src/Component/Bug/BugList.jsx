import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEye } from "react-icons/fi";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const BugList = ({ title }) => {
    const { theme } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);

    const fetchBugs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                limit: limit,
            };

            const response = await authAxiosClient.get("/bug/list", { params });

            if (response.data?.status) {
                setData(response.data.data.bugs || []);
                setTotal(response.data.data.total || 0);
            }
        } catch (err) {
            console.error("Error fetching bugs:", err);
            toast.error(err.message || "Failed to fetch bugs");
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchBugs();
    }, [fetchBugs]);

    const formatDate = (date) => date ? new Date(date).toLocaleString() : "N/A";

    const columns = [
        {
            key: "userId",
            label: "Reporter",
            render: (val) => val ? `${val.firstName} ${val.lastName}` : "Unknown"
        },
        {
            key: "title",
            label: "Bug Title",
            render: (val) => val && val.length > 30 ? `${val.substring(0, 30)}...` : (val || "N/A")
        },
        {
            key: "description",
            label: "Description",
            render: (val) => val && val.length > 50 ? `${val.substring(0, 50)}...` : (val || "N/A")
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
                    <button
                        onClick={() => { setSelectedBug(row); setIsDetailModalOpen(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                    >
                        <FiEye className="text-teal-500 w-5 h-5" />
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

            <DataTable columns={columns} data={data} loading={loading} />

            <div className="flex justify-between items-center mt-4">
                <span>Total Bugs: {total}</span>
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
            {isDetailModalOpen && selectedBug && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-lg max-w-2xl w-full p-6 space-y-4 border" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                        <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.colors.border }}>
                            <h3 className="text-lg font-bold">Bug Report Details</h3>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-semibold text-gray-500 block">Reporter</span>
                                <span className="text-sm">
                                    {selectedBug.userId
                                        ? `${selectedBug.userId.firstName} ${selectedBug.userId.lastName} (${selectedBug.userId.email})`
                                        : "Unknown"}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-500 block">Title</span>
                                <span className="text-sm">{selectedBug.title}</span>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-500 block">Description</span>
                                <p className="text-sm whitespace-pre-wrap">{selectedBug.description || "No description provided."}</p>
                            </div>
                            {selectedBug.image && (
                                <div>
                                    <span className="text-sm font-semibold text-gray-500 block mb-2">Screenshot / Image</span>
                                    <img
                                        src={selectedBug.image}
                                        alt="Bug screenshot"
                                        className="max-h-60 object-contain rounded border"
                                        style={{ borderColor: theme.colors.border }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div>
                                <span className="text-sm font-semibold text-gray-500 block">Reported At</span>
                                <span className="text-sm">{formatDate(selectedBug.createdAt)}</span>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugList;
