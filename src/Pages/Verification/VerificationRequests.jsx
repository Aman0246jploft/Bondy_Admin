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
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);

    // Detail Modal State
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchCategories = async () => {
        try {
            const response = await axiosClient.get("/category/list", { params: { limit: 100 } });
            if (response.data?.status && Array.isArray(response.data.data?.categories)) {
                setCategories(response.data.data.categories);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

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

                // If modal is open, update the selected user details with fresh data
                if (selectedUser) {
                    const freshUser = response.data.data.requests.find(u => u._id === selectedUser._id);
                    if (freshUser) {
                        setSelectedUser(freshUser);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, search, selectedUser]);

    useEffect(() => {
        fetchRequests();
    }, [page, statusFilter, search]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const formatTypeLabel = (t) => {
        switch (t) {
            case "nationalId":
                return "National ID";
            case "drivingLicence":
                return "Driving Licence";
            case "bankVerification":
                return "Bank verification";
            case "businessVerification":
                return "Business verification";
            default: {
                if (!t) return "Verification";
                const withSpaces = t.replace(/([A-Z])/g, " $1").trim();
                return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
            }
        }
    };

    const capitalizeFirstLetter = (str) => {
        if (!str || typeof str !== "string") return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const formatContactNumber = (user) => {
        if (!user || !user.contactNumber) return "N/A";
        const code = user.countryCode ? user.countryCode.trim() : "";
        if (code && !user.contactNumber.toString().startsWith(code)) {
            return `${code} ${user.contactNumber}`;
        }
        return user.contactNumber;
    };

    const handleAudit = async (userId, type, action) => {
        let reason = null;
        let reasonTitle = null;

        if (action === "reject") {
            const enteredTitle = prompt("Enter Rejection Title (e.g. Blurry Document Images):");
            if (enteredTitle === null) return; // Cancel if Cancel button clicked
            reasonTitle = enteredTitle.trim() || "Rejected Verification";

            const enteredReason = prompt("Please enter the reason for rejection:");
            if (enteredReason === null) return; // Cancel if Cancel button clicked
            reason = enteredReason.trim() || "Please review and submit valid documents.";
        }

        try {
            const response = await axiosClient.post("/verification/audit", {
                userId,
                type,
                action,
                reason,
                reasonTitle
            });

            if (response.data?.status) {
                const label = formatTypeLabel(type);
                const actionPastTense = action === "approve" ? "approved" : "rejected";
                toast.success(`${label} request ${actionPastTense} successfully`);

                // Update selectedUser state locally so the modal updates immediately
                setSelectedUser(prevUser => {
                    if (!prevUser) return null;
                    const updatedUser = { ...prevUser };
                    const isApprove = action === "approve";
                    const newStatus = isApprove ? "approved" : "rejected";

                    if (type === "nationalId" || type === "drivingLicence") {
                        if (updatedUser.verifications?.idVerification) {
                            updatedUser.verifications.idVerification = {
                                ...updatedUser.verifications.idVerification,
                                [type]: {
                                    ...updatedUser.verifications.idVerification[type],
                                    status: newStatus,
                                    isVerified: isApprove
                                }
                            };
                        }
                    } else if (type === "bankVerification") {
                        if (updatedUser.verifications?.bankVerification) {
                            updatedUser.verifications.bankVerification = {
                                ...updatedUser.verifications.bankVerification,
                                status: newStatus,
                                isVerified: isApprove
                            };
                        }
                    } else if (type === "businessVerification") {
                        updatedUser.businessVerificationStatus = newStatus;
                        updatedUser.isBusinessVerified = isApprove;
                    }

                    return updatedUser;
                });

                fetchRequests();
            }
        } catch (error) {
            console.error("Audit error:", error);
            const rawMsg = error.response?.data?.message || error.message || `Failed to ${action} request`;
            toast.error(capitalizeFirstLetter(rawMsg));
        }
    };

    const getImageUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${socketURL}/${url}`;
    };

    const columns = [
        {
            key: "name",
            label: "Organizer Name",
            render: (val, row) => `${row.firstName || ''} ${row.lastName || ''}`
        },
        { key: "email", label: "Email" },
        {
            key: "contactNumber",
            label: "Contact",
            render: (val, row) => formatContactNumber(row)
        },
        {
            key: "status",
            label: "Statuses (ID / Bank / Profile)",
            render: (val, row) => {
                const natStatus = row.verifications?.idVerification?.nationalId?.status || "unverified";
                const licStatus = row.verifications?.idVerification?.drivingLicence?.status || "unverified";
                const idStatus = natStatus === "approved" || licStatus === "approved" ? "approved" : (natStatus === "pending" || licStatus === "pending" ? "pending" : "unverified");

                const bankStatus = row.verifications?.bankVerification?.status || "unverified";
                const profileStatus = row.businessVerificationStatus || "unverified";

                const getStatusBadgeClass = (status) => {
                    if (status === 'approved') return 'bg-green-100 text-green-800';
                    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
                    if (status === 'rejected') return 'bg-red-100 text-red-800';
                    return 'bg-gray-100 text-gray-600';
                };

                return (
                    <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded font-semibold ${getStatusBadgeClass(idStatus)}`}>
                            ID: {idStatus}
                        </span>
                        <span className={`px-2 py-1 rounded font-semibold ${getStatusBadgeClass(bankStatus)}`}>
                            Bank: {bankStatus}
                        </span>
                        <span className={`px-2 py-1 rounded font-semibold ${getStatusBadgeClass(profileStatus)}`}>
                            Profile: {profileStatus}
                        </span>
                    </div>
                );
            }
        },
        {
            key: "actions",
            label: "Action",
            render: (val, row) => (
                <button
                    onClick={() => setSelectedUser(row)}
                    className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 text-xs font-semibold"
                >
                    Review & Verify
                </button>
            )
        }
    ];

    const getStatusBadge = (status) => {
        const classes = {
            approved: "bg-green-100 text-green-800 border border-green-200",
            pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
            rejected: "bg-red-100 text-red-800 border border-red-200",
            unverified: "bg-gray-100 text-gray-700 border border-gray-200"
        };
        const current = status || "unverified";
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${classes[current]}`}>
                {current}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Organizer Verification Portal</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Review and audit organizer profile, ID documents, and bank verification requests.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl shadow-xs border border-gray-200/80">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { key: "all", label: "All Requests" },
                        { key: "pending", label: "Pending Review" },
                        { key: "approved", label: "Approved" },
                        { key: "rejected", label: "Rejected" },
                        { key: "unverified", label: "Unverified" },
                    ].map((tab) => {
                        const isActive = statusFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.key);
                                    setPage(1);
                                }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${isActive
                                    ? "bg-[#23ada4] hover:bg-[#1ca398] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search Organizers Bar */}
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        className="w-full border border-gray-200 py-1.5 pl-3 pr-8 rounded-lg bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage={search ? `No verification requests match "${search}"` : `No ${statusFilter === 'all' ? '' : statusFilter} requests found`}
                    emptySubtext={
                        search && statusFilter !== 'all'
                            ? `Can't find "${search}" in "${statusFilter}"? Try switching the filter above to "All Requests".`
                            : "There are currently no verification records matching this filter."
                    }
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">Total: {total}</span>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 font-medium"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </button>
                    <span className="text-sm font-semibold self-center text-gray-700">Page {page} of {Math.ceil(total / limit) || 1}</span>
                    <button
                        className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 font-medium"
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Premium Verification Audit Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Reviewing: {selectedUser.firstName || ""} {selectedUser.lastName || ""}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    Email: {selectedUser.email || "N/A"} | Contact: {formatContactNumber(selectedUser)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-black transition text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body / Three Main Panels */}
                        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50">

                            {/* Panel 1: Identity Document */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <h4 className="font-bold text-gray-800 text-lg">Identity Document</h4>
                                        {(() => {
                                            const nat = selectedUser.verifications?.idVerification?.nationalId;
                                            const lic = selectedUser.verifications?.idVerification?.drivingLicence;
                                            const status = nat?.status === "approved" || lic?.status === "approved" ? "approved" : (nat?.status === "pending" || lic?.status === "pending" ? "pending" : (nat?.status === "rejected" || lic?.status === "rejected" ? "rejected" : "unverified"));
                                            return getStatusBadge(status);
                                        })()}
                                    </div>

                                    {/* Document Contents */}
                                    {(() => {
                                        const nat = selectedUser.verifications?.idVerification?.nationalId;
                                        const lic = selectedUser.verifications?.idVerification?.drivingLicence;
                                        const isNatSubmitted = nat && nat.status !== "unverified";
                                        const isLicSubmitted = lic && lic.status !== "unverified";

                                        if (!isNatSubmitted && !isLicSubmitted) {
                                            return <p className="text-gray-400 text-sm italic py-8 text-center">No Identity document uploaded yet.</p>;
                                        }

                                        const renderDocSection = (doc, docType, label) => {
                                            if (!doc || doc.status === "unverified") return null;
                                            return (
                                                <div className="space-y-4 border-b border-gray-200 pb-5 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-center">
                                                        <div className="text-xs font-bold text-teal-600 uppercase bg-teal-50 px-2.5 py-1 rounded inline-block">
                                                            {label}
                                                        </div>
                                                        {getStatusBadge(doc.status)}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold">Front side</span>
                                                            <a href={getImageUrl(doc.frontImage)} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden mt-1 hover:opacity-90">
                                                                <img src={getImageUrl(doc.frontImage)} alt={`${label} Front`} className="h-32 w-full object-cover" />
                                                            </a>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold">Back side</span>
                                                            <a href={getImageUrl(doc.backImage)} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden mt-1 hover:opacity-90">
                                                                <img src={getImageUrl(doc.backImage)} alt={`${label} Back`} className="h-32 w-full object-cover" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {doc.status === "pending" && (
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => handleAudit(selectedUser._id, docType, "approve")}
                                                                className="flex-1 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-xs shadow-sm transition"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleAudit(selectedUser._id, docType, "reject")}
                                                                className="flex-1 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-xs shadow-sm transition"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="space-y-6">
                                                {renderDocSection(nat, "nationalId", "National ID Card")}
                                                {renderDocSection(lic, "drivingLicence", "Driving Licence")}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Panel 2: Bank Account */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <h4 className="font-bold text-gray-800 text-lg">Bank Account</h4>
                                        {getStatusBadge(selectedUser.verifications?.bankVerification?.status)}
                                    </div>

                                    {/* Bank Details */}
                                    {selectedUser.verifications?.bankVerification?.bankName ? (
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Bank Name</span>
                                                <span className="text-gray-800 font-semibold text-sm">{selectedUser.verifications.bankVerification.bankName}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Account Holder</span>
                                                <span className="text-gray-800 font-semibold text-sm">{selectedUser.verifications.bankVerification.bankHolderName}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Account Number</span>
                                                <span className="text-gray-850 font-bold text-sm tracking-wider">{selectedUser.verifications.bankVerification.accountNumber}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm italic py-8 text-center">No Payout bank account details submitted.</p>
                                    )}
                                </div>

                                {/* Controls */}
                                {selectedUser.verifications?.bankVerification?.status === "pending" && (
                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={() => handleAudit(selectedUser._id, "bankVerification", "approve")}
                                            className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm shadow-sm transition"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAudit(selectedUser._id, "bankVerification", "reject")}
                                            className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-sm shadow-sm transition"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Panel 3: Organizer Profile */}
                            <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <h4 className="font-bold text-gray-800 text-lg">Organizer Profile</h4>
                                        {getStatusBadge(selectedUser.businessVerificationStatus)}
                                    </div>

                                    {/* Business Profile Details */}
                                    {selectedUser.businessName ? (
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Business Name</span>
                                                <span className="text-gray-800 font-semibold text-sm">{selectedUser.businessName}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Category</span>
                                                <span className="text-gray-800 font-semibold text-sm">
                                                    {categories.find(c => c._id === selectedUser.businessCategory)?.name || selectedUser.businessCategory || "Not Set"}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-24 overflow-y-auto">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Description</span>
                                                <span className="text-gray-800 text-xs">{selectedUser.shortDesc}</span>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Social Media Link</span>
                                                <span className="text-gray-800 font-semibold text-xs text-truncate block">
                                                    <a
                                                        href={selectedUser.socialMediaLink?.startsWith("http") ? selectedUser.socialMediaLink : `https://${selectedUser.socialMediaLink}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-teal-500 hover:underline"
                                                    >
                                                        {selectedUser.socialMediaLink}
                                                    </a>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm italic py-8 text-center">No business details filled yet.</p>
                                    )}
                                </div>

                                {/* Controls */}
                                {selectedUser.businessVerificationStatus === "pending" && (
                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={() => handleAudit(selectedUser._id, "businessVerification", "approve")}
                                            className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-sm shadow-sm transition"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAudit(selectedUser._id, "businessVerification", "reject")}
                                            className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-sm shadow-sm transition"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationRequests;
