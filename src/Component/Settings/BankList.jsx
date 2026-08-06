import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";

const BankList = ({ title }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [formData, setFormData] = useState({
        bankName: "",
        bankNameMn: "",
        isActive: true
    });

    const fetchBanks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/verification/banks/admin");
            if (response.data?.status) {
                setData(response.data.data.banks);
            }
        } catch (error) {
            console.error("Error fetching banks:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingBank) {
                response = await authAxiosClient.put(`/verification/banks/admin/${editingBank._id}`, formData);
            } else {
                response = await authAxiosClient.post("/verification/banks/admin", formData);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingBank(null);
                setFormData({ bankName: "", bankNameMn: "", isActive: true });
                fetchBanks();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.response?.data?.message || error.message || "Failed to save bank");
        }
    };

    const handleDelete = async (bank) => {
        if (window.confirm(`Are you sure you want to delete bank "${bank.bankName}"?`)) {
            try {
                const response = await authAxiosClient.delete(`/verification/banks/admin/${bank._id}`);
                if (response.data?.status) {
                    fetchBanks();
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.response?.data?.message || error.message || "Failed to delete bank");
            }
        }
    };

    const openModal = (bank = null) => {
        if (bank) {
            setEditingBank(bank);
            setFormData({
                bankName: bank.bankName,
                bankNameMn: bank.bankNameMn || "",
                isActive: bank.isActive !== undefined ? bank.isActive : true
            });
        } else {
            setEditingBank(null);
            setFormData({ bankName: "", bankNameMn: "", isActive: true });
        }
        setIsModalOpen(true);
    };

    const columns = [
        { label: "Bank Name (English)", key: "bankName" },
        { label: "Bank Name (Mongolian)", key: "bankNameMn" },
        {
            label: "Status",
            key: "isActive",
            render: (value) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {value ? "Active" : "Inactive"}
                </span>
            )
        },
        {
            label: "Actions",
            key: "_id",
            render: (_, row) => (
                <div className="flex space-x-3">
                    <button onClick={() => openModal(row)} className="text-blue-500 hover:text-blue-700 transition">
                        <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700 transition">
                        <BsTrash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition shadow-md"
                >
                    <FiPlus />
                    <span>Add Bank</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                total={data.length}
                page={1}
                limit={100}
                onPageChange={() => { }}
                onLimitChange={() => { }}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingBank ? "Edit Bank" : "Add New Bank"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name (English) *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="e.g. State Bank"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name (Mongolian)</label>
                                <input
                                    type="text"
                                    value={formData.bankNameMn}
                                    onChange={(e) => setFormData({ ...formData, bankNameMn: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                                    placeholder="e.g. Төрийн банк"
                                />
                            </div>

                            {editingBank && (
                                <div className="flex items-center space-x-3 pt-2">
                                    <label className="text-sm font-semibold text-gray-700">Status:</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">{formData.isActive ? 'Active' : 'Inactive'}</span>
                                    </label>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                                >
                                    {editingBank ? "Update Bank" : "Add Bank"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankList;
