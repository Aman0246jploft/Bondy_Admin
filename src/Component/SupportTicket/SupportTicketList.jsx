import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEye } from "react-icons/fi";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const SupportTicketList = ({ title }) => {
    const { theme } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [categories, setCategories] = useState([]);


    const fetchCategories = useCallback(async () => {
        try {
            const response = await authAxiosClient.get("/category/list", {
                params: {
                    page: 1,
                    limit: 1000000000,
                },
            });
            if (response.data?.status) {
                setCategories(response.data.data.categories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Filters
    const [filters, setFilters] = useState({
        status: "",
        category: "",
        ticketId: "",
        userId: "",
        search: "",
        startDate: "",
        endDate: "",
    });

    // Modal states
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateFormData, setUpdateFormData] = useState({
        status: "",
        adminComment: "",
    });
    const [updateLoading, setUpdateLoading] = useState(false);

    // Validation errors
    const [validationErrors, setValidationErrors] = useState({});

    // Status options
    const statusOptions = ["Pending", "Open", "Resolved", "Cancelled", "Reopen"];

    // Validate update form
    const validateUpdateForm = () => {
        const errors = {};

        if (!updateFormData.status) {
            errors.status = "Status is required";
        } else if (!statusOptions.includes(updateFormData.status)) {
            errors.status = "Invalid status. Must be one of: " + statusOptions.join(", ");
        }

        // adminComment is optional, but if provided, should not be empty string only
        if (updateFormData.adminComment && updateFormData.adminComment.trim().length === 0) {
            // Allow empty string, but trim it
            setUpdateFormData(prev => ({ ...prev, adminComment: "" }));
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
            };

            // Add filters only if they have values
            if (filters.status) params.status = filters.status;
            if (filters.category) params.category = filters.category;
            if (filters.ticketId) params.ticketId = filters.ticketId;
            if (filters.userId) params.userId = filters.userId;
            if (filters.search) params.search = filters.search;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await authAxiosClient.get("/support/admin/list", { params });

            if (response.data?.status) {
                setData(response.data.data.tickets || []);
                setTotal(response.data.data.total || 0);
            }
        } catch (err) {
            console.error("Error fetching tickets:", err);
            toast.error(err.message || "Failed to fetch support tickets");
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTickets]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
        setPage(1); // Reset to first page when filters change
    };

    const handleViewDetails = async (ticket) => {
        try {
            setLoading(true);
            const response = await authAxiosClient.get(`/support/${ticket.ticketId}`);
            if (response.data?.status) {
                setSelectedTicket(response.data.data.ticket);
                setIsDetailModalOpen(true);
            }
        } catch (err) {
            console.error("Error fetching ticket details:", err);
            toast.error(err.message || "Failed to fetch ticket details");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUpdateModal = (ticket) => {
        setSelectedTicket(ticket);
        setUpdateFormData({
            status: ticket.status || "",
            adminComment: "",
        });
        setValidationErrors({});
        setIsUpdateModalOpen(true);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();

        if (!validateUpdateForm()) {
            return;
        }

        if (!selectedTicket) {
            toast.error("No ticket selected");
            return;
        }

        setUpdateLoading(true);
        try {
            const payload = {
                status: updateFormData.status,
            };

            // Only include adminComment if it's not empty
            if (updateFormData.adminComment && updateFormData.adminComment.trim()) {
                payload.adminComment = updateFormData.adminComment.trim();
            }

            const response = await authAxiosClient.put(
                `/support/admin/update/${selectedTicket.ticketId}`,
                payload
            );

            if (response.data?.status) {
                toast.success("Ticket status updated successfully");
                setIsUpdateModalOpen(false);
                setUpdateFormData({ status: "", adminComment: "" });
                setSelectedTicket(null);
                fetchTickets(); // Refresh the list
            }
        } catch (err) {
            console.error("Error updating ticket:", err);
            toast.error(err.message || "Failed to update ticket status");
        } finally {
            setUpdateLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            Pending: "bg-yellow-100 text-yellow-800",
            Open: "bg-blue-100 text-blue-800",
            Resolved: "bg-green-100 text-green-800",
            Cancelled: "bg-red-100 text-red-800",
            Reopen: "bg-orange-100 text-orange-800",
            closed: "bg-gray-100 text-gray-800",
        };
        return statusClasses[status] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const columns = [
        {
            key: "ticketId",
            label: "Ticket ID",
            render: (val) => <span className="font-mono text-xs">{val}</span>
        },
        {
            key: "user",
            label: "User",
            render: (val) => {
                if (!val) return "N/A";
                const name = `${val.firstName || ""} ${val.lastName || ""}`.trim();
                return name || val.email || "N/A";
            }
        },
        {
            key: "category",
            label: "Category",
            render: (val) => {
                if (typeof val === "object" && val?.name) {
                    return val.name;
                }
                return val || "N/A";
            }
        },
        {
            key: "subject",
            label: "Subject",
            render: (val) => <span className="max-w-xs truncate block" title={val}>{val}</span>
        },
        {
            key: "status",
            label: "Status",
            render: (val) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(val)}`}>
                    {val}
                </span>
            )
        },
        {
            key: "createdAt",
            label: "Created",
            render: (val) => formatDate(val)
        },
        {
            key: "actions",
            label: "Actions",
            render: (value, row) => (
                <div className="flex gap-3">
                    <button
                        onClick={() => handleViewDetails(row)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                    >
                        <FiEye className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                    </button>
                    <button
                        onClick={() => handleOpenUpdateModal(row)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title="Update Status"
                    >
                        Update
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    >
                        <option value="">All Status</option>
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>

                    <select
                        className="w-full border p-2 rounded"
                        value={filters.category}
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        style={{
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary
                        }}
                    >
                        {/* All option */}
                        <option value="">All</option>

                        {/* Category options */}
                        {categories.map((category) => (
                            <option key={category._id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <input
                        type="text"
                        placeholder="Category"
                        className="w-full border p-2 rounded"
                        value={filters.category}
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div> */}
                <div>
                    <label className="block text-sm font-medium mb-1">Ticket ID</label>
                    <input
                        type="text"
                        placeholder="Ticket ID"
                        className="w-full border p-2 rounded"
                        value={filters.ticketId}
                        onChange={(e) => handleFilterChange("ticketId", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input
                        type="text"
                        placeholder="Search subject, description..."
                        className="w-full border p-2 rounded"
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div>
                {/* <div>
                    <label className="block text-sm font-medium mb-1">User ID</label>
                    <input
                        type="text"
                        placeholder="User ID"
                        className="w-full border p-2 rounded"
                        value={filters.userId}
                        onChange={(e) => handleFilterChange("userId", e.target.value)}
                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                    />
                </div> */}
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
                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setFilters({
                                status: "",
                                category: "",
                                ticketId: "",
                                userId: "",
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

            {/* Ticket Detail Modal */}
            {isDetailModalOpen && selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold">Ticket Details</h3>
                                <button
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        setSelectedTicket(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Ticket ID</label>
                                        <p className="mt-1 font-mono text-sm">{selectedTicket.ticketId}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Status</label>
                                        <p className="mt-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(selectedTicket.status)}`}>
                                                {selectedTicket.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Category</label>
                                        <p className="mt-1">
                                            {typeof selectedTicket.category === "object" && selectedTicket.category?.name
                                                ? selectedTicket.category.name
                                                : selectedTicket.category || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600">Created At</label>
                                        <p className="mt-1">{formatDate(selectedTicket.createdAt)}</p>
                                    </div>
                                </div>

                                {selectedTicket.user && (
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">User Information</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm">
                                                    <span className="font-medium">Name:</span>{" "}
                                                    {`${selectedTicket.user.firstName || ""} ${selectedTicket.user.lastName || ""}`.trim() || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm">
                                                    <span className="font-medium">Email:</span> {selectedTicket.user.email || "N/A"}
                                                </p>
                                            </div>
                                            {selectedTicket.user.contactNumber && (
                                                <div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">Contact:</span> {selectedTicket.user.contactNumber}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Subject</label>
                                    <p className="text-sm">{selectedTicket.subject}</p>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                                </div>

                                {selectedTicket.images && selectedTicket.images.length > 0 && (
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Images</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedTicket.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    alt={`Ticket image ${idx + 1}`}
                                                    className="w-full h-32 object-cover rounded border"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTicket.adminComments && selectedTicket.adminComments.length > 0 && (
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Admin Comments</label>
                                        <div className="space-y-2">
                                            {selectedTicket.adminComments.map((comment, idx) => (
                                                <div key={idx} className="bg-gray-50 p-3 rounded">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-medium">
                                                            {comment.adminId
                                                                ? `${comment.adminId.firstName || ""} ${comment.adminId.lastName || ""}`.trim() || "Admin"
                                                                : "Admin"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                                                    </div>
                                                    <p className="text-sm">{comment.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            handleOpenUpdateModal(selectedTicket);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Update Status
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            setSelectedTicket(null);
                                        }}
                                        className="px-4 py-2 border rounded"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {isUpdateModalOpen && selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md" style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold">Update Ticket Status</h3>
                                <button
                                    onClick={() => {
                                        setIsUpdateModalOpen(false);
                                        setSelectedTicket(null);
                                        setUpdateFormData({ status: "", adminComment: "" });
                                        setValidationErrors({});
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`w-full border p-2 rounded ${validationErrors.status ? "border-red-500" : ""}`}
                                        value={updateFormData.status}
                                        onChange={(e) => {
                                            setUpdateFormData(prev => ({ ...prev, status: e.target.value }));
                                            if (validationErrors.status) {
                                                setValidationErrors(prev => ({ ...prev, status: "" }));
                                            }
                                        }}
                                        required
                                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    {validationErrors.status && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Admin Comment (Optional)</label>
                                    <textarea
                                        className="w-full border p-2 rounded"
                                        rows="4"
                                        value={updateFormData.adminComment}
                                        onChange={(e) => setUpdateFormData(prev => ({ ...prev, adminComment: e.target.value }))}
                                        placeholder="Add a comment about this update..."
                                        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }}
                                    />
                                </div>

                                <div className="bg-gray-50 p-3 rounded text-sm" style={{ backgroundColor: theme.colors.tertiary }}>
                                    <p className="font-medium mb-1">Ticket ID:</p>
                                    <p className="font-mono text-xs">{selectedTicket.ticketId}</p>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUpdateModalOpen(false);
                                            setSelectedTicket(null);
                                            setUpdateFormData({ status: "", adminComment: "" });
                                            setValidationErrors({});
                                        }}
                                        className="px-4 py-2 border rounded"
                                        disabled={updateLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                        disabled={updateLoading}
                                    >
                                        {updateLoading ? "Updating..." : "Update Status"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTicketList;

