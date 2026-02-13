import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../../Component/Table/DataTable";
import axiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { socketURL } from "../../api/baseUrl";

const VerificationRequests = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending
    const [search, setSearch] = useState("");

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get("/verification/requests", {
                params: {
                    page,
                    limit,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    search,
                },
            });
            if (response.data?.status) {
                setData(response.data.data.requests);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, search]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAudit = async (userId, documentId, documentName, action, reason = null) => {
        if (!window.confirm(`Are you sure you want to ${action} "${documentName}"?`)) return;

        // If reject, ask for reason
        let finalReason = reason;
        if (action === "reject" && !finalReason) {
            finalReason = prompt("Please enter a reason for rejection:");
            if (!finalReason) return; // Cancel if no reason
        }

        try {
            const response = await axiosClient.post("/verification/audit", {
                userId,
                documentId,
                action,
                reason: finalReason
            });

            if (response.data?.status) {
                toast.success(`Document ${action}d successfully`);
                fetchRequests();
            }
        } catch (error) {
            console.error("Audit error:", error);
            toast.error(error.response?.data?.message || `Failed to ${action}`);
        }
    };

    const columns = [
        {
            key: "name",
            label: "Organizer Name",
            render: (val, row) => `${row.firstName || ''} ${row.lastName || ''}`
        },
        { key: "email", label: "Email" },
        { key: "contactNumber", label: "Contact" },
        { key: "businessType", label: "Business Type" },
        {
            key: "documents",
            label: "Documents",
            render: (val, row) => (
                <div className="flex flex-col gap-2">
                    {row.documents && row.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 border-b pb-2">
                            <a
                                href={socketURL + '/' + doc.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm flex-1"
                            >
                                {doc.name || "View Doc"}
                            </a>
                            <span className={`px-2 py-1 rounded text-xs ${doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {doc.status}
                            </span>
                            {doc.status === 'pending' && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleAudit(row._id, doc._id, doc.name, 'approve')}
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => handleAudit(row._id, doc._id, doc.name, 'reject')}
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                    >
                                        ✗
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!row.documents || row.documents.length === 0) && <span className="text-gray-400">No docs</span>}
                </div>
            )
        },
        {
            key: "organizerVerificationStatus",
            label: "Status",
            render: (val) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${val === 'approved' ? 'bg-green-100 text-green-800' :
                    val === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {val?.toUpperCase()}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: () => <span className="text-gray-400">See documents</span>
        }
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Verification Requests</h2>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded shadow">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All</option>
                </select>

                <input
                    type="text"
                    placeholder="Search..."
                    className="border p-2 rounded w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <DataTable columns={columns} data={data} loading={loading} />

            <div className="flex justify-between items-center mt-4">
                <span>Total: {total}</span>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </button>
                    <span>Page {page} of {Math.ceil(total / limit) || 1}</span>
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationRequests;
