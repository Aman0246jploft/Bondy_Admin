import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2 } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import { AiOutlineBarChart } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/authAxiosClient";
import OrganizerStatsModal from "./OrganizerStatsModal";
import { toast } from "react-toastify";

const UserList = ({ roleId, title }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [selectedOrganizer, setSelectedOrganizer] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const trimmedSearch = search.trim();
            const response = await axiosClient.get("/user/userList", {
                params: {
                    page,
                    limit,
                    roleId,
                    ...(trimmedSearch ? { search: trimmedSearch } : {}),
                },
            });
            if (response.data?.status) {
                setData(response.data.data.users);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, roleId, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const getLoggedInUserId = () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            }
        } catch (e) {
            console.error("Error decoding token:", e);
        }
        return null;
    };

    const toggleStatus = async (user, index) => {
        const loggedInUserId = getLoggedInUserId();
        if (loggedInUserId && user._id === loggedInUserId) {
            toast.error("You cannot deactivate your own admin account!");
            return;
        }

        const actionText = user.isDisable ? "activate" : "deactivate";
        if (!window.confirm(`Are you sure you want to ${actionText} ${user.firstName || 'this user'}?`)) {
            return;
        }

        try {
            const newStatus = !user.isDisable;
            const response = await axiosClient.patch(`/user/toggle-disable/${user._id}`, {
                isDisable: newStatus,
            });
            if (response.data?.status) {
                const newData = [...data];
                newData[index] = { ...user, isDisable: newStatus };
                setData(newData);
                toast.success(`User ${newStatus ? "deactivated" : "activated"} successfully`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(error.message || "Failed to update status");
        }
    };

    const togglePromote = async (user, index) => {
        try {
            const newPromoteStatus = !user.isPromoted;
            const response = await axiosClient.patch(`/user/toggle-promote/${user._id}`, {
                isPromoted: newPromoteStatus,
            });
            if (response.data?.status) {
                const newData = [...data];
                newData[index] = { ...user, isPromoted: newPromoteStatus };
                setData(newData);
                toast.success(`Organizer ${newPromoteStatus ? "promoted" : "unpromoted"} successfully`);
            }
        } catch (error) {
            console.error("Error updating promotion status:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update promotion status");
        }
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.firstName || 'this user'}?`)) {
            try {
                const response = await axiosClient.delete(`/user/delete/${user._id}`);
                if (response.data?.status) {
                    fetchUsers();
                }
            } catch (error) {
                console.error("Error deleting user:", error);
                alert(error.message || "Failed to delete user");
            }
        }
    };

    const handleViewStats = (user) => {
        setSelectedOrganizer(user);
        setShowStatsModal(true);
    };

    const handleCloseStatsModal = () => {
        setShowStatsModal(false);
        setSelectedOrganizer(null);
    };

    const columns = [
        {
            key: "name",
            label: "Name",
            render: (val, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A'
        },
        { key: "email", label: "Email" },
        {
            key: "contactNumber",
            label: "Contact",
            render: (val, row) => {
                if (!row.contactNumber) return "N/A";
                const countryCode = row.countryCode ? row.countryCode.trim() : "";
                if (countryCode && !row.contactNumber.startsWith(countryCode)) {
                    return `${countryCode} ${row.contactNumber}`;
                }
                return row.contactNumber;
            }
        },
        ...(!roleId ? [{
            key: "roleId",
            label: "Role",
            render: (val) => (
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${val === 2
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-teal-100 text-teal-800 border border-teal-200"
                    }`}>
                    {val === 2 ? "Organizer" : val === 3 ? "Customer" : "User"}
                </span>
            )
        }] : []),
        ...(roleId === 2 ? [{
            key: "isPromoted",
            label: "Promoted",
            render: (value, row, rowIndex) => (
                <div className="flex items-center gap-2">
                    <label className="inline-flex items-center cursor-pointer" title={value ? "Promoted on Homepage" : "Click to promote on Homepage"}>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={Boolean(value)}
                            onChange={() => togglePromote(row, rowIndex)}
                        />
                        <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${value ? "bg-amber-500" : "bg-gray-300"}`}>
                            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                    </label>
                    {value ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                            ★ Promoted
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Regular</span>
                    )}
                </div>
            ),
        }] : []),
        {
            key: "isDisable",
            label: "Status",
            render: (value, row, rowIndex) => (
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={!value}
                        onChange={() => toggleStatus(row, rowIndex)}
                    />
                    <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${!value ? "bg-[#23ada4]" : "bg-gray-300"}`}>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${!value ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                </label>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/users/${row._id}`)}
                        className="px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition whitespace-nowrap shadow-2xs"
                    >
                        View Details
                    </button>
                    {(roleId === 2 || !roleId) && (
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {row.roleId === 2 ? (
                                <button
                                    onClick={() => handleViewStats(row)}
                                    title="View Stats"
                                    className="text-purple-500 hover:text-purple-700 transition flex items-center justify-center"
                                >
                                    <AiOutlineBarChart className="w-4 h-4" />
                                </button>
                            ) : null}
                        </div>
                    )}
                    <button
                        onClick={() => handleDelete(row)}
                        title="Delete User"
                        className="text-red-500 hover:text-red-700 transition flex items-center justify-center flex-shrink-0"
                    >
                        <BsTrash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="w-full px-[10px] space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shadow-xs font-semibold text-lg">
                        {roleId === 2 ? "🏢" : "👤"}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage and view registered {title.toLowerCase()} accounts and statuses.</p>
                    </div>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email or mobile..."
                        className="pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-72 shadow-xs transition"
                        value={search}
                        onChange={handleSearchChange}
                    />
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(""); setPage(1); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    emptyMessage={search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} found`}
                    emptySubtext={search ? "Check for spelling errors or try clearing your search query." : `There are currently no registered ${title.toLowerCase()} records.`}
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 px-1">
                <span>Showing {data.length} of {total} {title.toLowerCase()}</span>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition bg-white shadow-xs"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </button>
                    <span className="font-semibold text-slate-700 px-2">Page {page} of {Math.ceil(total / limit) || 1}</span>
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition bg-white shadow-xs"
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {showStatsModal && selectedOrganizer && (
                <OrganizerStatsModal
                    organizer={selectedOrganizer}
                    onClose={handleCloseStatsModal}
                />
            )}
        </div>
    );
};

export default UserList;

