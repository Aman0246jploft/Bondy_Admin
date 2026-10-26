import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useConfirm } from "../../contexts/confirm/ConfirmContext";

const PromoCodeList = ({ title }) => {
    const confirm = useConfirm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        maxUsage: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date().toISOString().split('T')[0],
        active: true
    });

    const fetchPromoCodes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.post("/promocode/list", null, {
                params: {
                    pageNo: page,
                    size: limit,
                },
            });
            if (response.data?.status) {
                setData(response.data.data.promoCodes);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching promo codes:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingPromo) {
                response = await authAxiosClient.post("/promocode/update", { id: editingPromo._id, ...formData });
            } else {
                response = await authAxiosClient.post("/promocode/create", formData);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingPromo(null);
                setFormData({
                    code: "",
                    description: "",
                    discountType: "percentage",
                    discountValue: 0,
                    maxUsage: 0,
                    validFrom: new Date().toISOString().split('T')[0],
                    validUntil: new Date().toISOString().split('T')[0],
                    active: true
                });
                toast.success(editingPromo ? "Promo code updated successfully" : "Promo code created successfully");
                fetchPromoCodes();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save promo code");
        }
    };

    const handleDelete = async (promo) => {
        const confirmed = await confirm({
            title: "Delete Promo Code",
            message: `Are you sure you want to delete promo code "${promo.code}"? This action cannot be undone.`,
            confirmText: "Delete",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const response = await authAxiosClient.post("/promocode/delete", { id: promo._id });
            if (response.data?.status) {
                toast.success("Promo code deleted successfully");
                fetchPromoCodes();
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete promo code");
        }
    };

    const openModal = (promo = null) => {
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                code: promo.code,
                description: promo.description || "",
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                maxUsage: promo.maxUsage,
                validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : "",
                validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : "",
                active: promo.active
            });
        } else {
            setEditingPromo(null);
            setFormData({
                code: "",
                description: "",
                discountType: "percentage",
                discountValue: 0,
                maxUsage: 0,
                validFrom: new Date().toISOString().split('T')[0],
                validUntil: new Date().toISOString().split('T')[0],
                active: true
            });
        }
        setIsModalOpen(true);
    };

    const columns = [
        { key: "code", label: "Code" },
        // {
        //     key: "discountType",
        //     label: "Type",
        //     render: (val) => <span className="capitalize">{val}</span>
        // },
        {
            key: "discountValue",
            label: "Value",
            render: (val, row) => row.discountType === 'percentage' ? `${val}%` : val
        },
        {
            key: "usage",
            label: "Usage",
            render: (_, row) => `${row.usedCount || 0} / ${row.maxUsage || '∞'}`
        },
        {
            key: "validUntil",
            label: "Expiry",
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            key: "active",
            label: "Status",
            render: (val) => (
                <span className={`px-2 py-1 rounded text-xs ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {val ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (value, row) => (
                <div className="flex gap-3">
                    <button onClick={() => openModal(row)}>
                        <FiEdit2 className="w-4 h-4 text-teal-500 hover:text-teal-700" />
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
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <button
                    onClick={() => openModal()}
                    className="bg-[#23ada4] hover:bg-[#1ca398] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                >
                    <FiPlus /> Add Promo Code
                </button>
            </div>

            <DataTable columns={columns} data={data} loading={loading} />

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500 font-medium">Total: {total}</span>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Prev
                    </button>
                    <span className="text-sm text-slate-600 font-medium px-2 py-1.5">Page {page} of {Math.ceil(total / limit) || 1}</span>
                    <button
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fadeIn">
                    <div className="bg-white p-6 sm:p-7 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-scaleUp">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">{editingPromo ? "Edit Promo Code" : "Add Promo Code"}</h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded uppercase"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                />
                            </div>
                            {/* <div>
                                <label className="block text-sm font-medium">Type</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={formData.discountType}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div> */}
                            <div>
                                <label className="block text-sm font-medium">Value</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Max Usage (0 for unlimited)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.maxUsage}
                                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Active</label>
                                <div className="mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    />
                                    <span className="ml-2 text-sm">Is Active</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Valid From</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Valid Until</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-[#23ada4] hover:bg-[#1ca398] text-white font-semibold rounded-xl text-sm shadow-xs transition cursor-pointer"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PromoCodeList;
