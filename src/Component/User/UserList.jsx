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

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get("/user/userList", {
                params: {
                    page,
                    limit,
                    roleId,
                    search,
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
        { key: "contactNumber", label: "Contact" },
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
                <div className="flex gap-3">
                    {roleId === 2 && (
                        <button
                            onClick={() => handleViewStats(row)}
                            title="View Stats"
                        >
                            <AiOutlineBarChart className="w-4 h-4 text-purple-500 hover:text-purple-700" />
                        </button>
                    )}
                    {/* <button onClick={() => console.log("Edit", row)}>
                        <FiEdit2 className="w-4 h-4 text-teal-500 hover:text-teal-700" />
                    </button> */}
                    <button
                        onClick={() => navigate(`/users/${row._id}`)}
                        className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition whitespace-nowrap"
                    >
                        View Details
                    </button>
                    <button onClick={() => handleDelete(row)}>
                        <BsTrash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
                <input
                    type="text"
                    placeholder="Search by name, email or mobile..."
                    className="border p-2 rounded w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <DataTable columns={columns} data={data} />

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

            {showStatsModal && selectedOrganizer && (
                <OrganizerStatsModal
                    organizer={selectedOrganizer}
                    onClose={handleCloseStatsModal}
                />
            )}
        </div >
    );
};

export default UserList;

