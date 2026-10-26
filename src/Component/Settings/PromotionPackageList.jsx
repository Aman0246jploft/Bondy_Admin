import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useConfirm } from "../../contexts/confirm/ConfirmContext";

const PromotionPackageList = ({ title }) => {
    const confirm = useConfirm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        durationInDays: 1,
        packageType: "EVENT",
        placements: "",
        price: 0,
        isActive: true
    });

    const fetchPackages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.post("/promotion-package/list", null, {
                params: {
                    pageNo: page,
                    size: limit,
                },
            });
            if (response.data?.status) {
                setData(response.data.data.packages);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching promotion packages:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Convert placements string to array
            const placementsArray = formData.placements.split(',').map(p => p.trim()).filter(p => p);

            const payload = {
                ...formData,
                placements: placementsArray
            };

            let response;
            if (editingPackage) {
                response = await authAxiosClient.post("/promotion-package/update", { id: editingPackage._id, ...payload });
            } else {
                response = await authAxiosClient.post("/promotion-package/create", payload);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingPackage(null);
                setFormData({
                    name: "",
                    durationInDays: 1,
                    packageType: "EVENT",
                    placements: "",
                    price: 0,
                    isActive: true
                });
                toast.success(editingPackage ? "Package updated successfully" : "Package created successfully");
                fetchPackages();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save promotion package");
        }
    };

    const handleDelete = async (pkg) => {
        const confirmed = await confirm({
            title: "Delete Promotion Package",
            message: `Are you sure you want to delete package "${pkg.name}"? This action cannot be undone.`,
            confirmText: "Delete",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const response = await authAxiosClient.post("/promotion-package/delete", { id: pkg._id });
            if (response.data?.status) {
                toast.success("Package deleted successfully");
                fetchPackages();
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete promotion package");
        }
    };

    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                name: pkg.name,
                durationInDays: pkg.durationInDays,
                packageType: pkg.packageType || "EVENT",
                placements: pkg.placements ? pkg.placements.join(', ') : "",
                price: pkg.price,
                isActive: pkg.isActive
            });
        } else {
            setEditingPackage(null);
            setFormData({
                name: "",
                durationInDays: 1,
                packageType: "EVENT",
                placements: "",
                price: 0,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const columns = [
        { key: "name", label: "Name" },
        {
            key: "packageType",
            label: "Type",
            render: (val) => val === "COURSE" ? "Course" : "Event"
        },
        {
            key: "durationInDays",
            label: "Duration (Days)",
        },
        {
            key: "price",
            label: "Price (MNT)",
            render: (val) => val.toLocaleString()
        },
        {
            key: "placements",
            label: "Placements",
            render: (val) => Array.isArray(val) ? val.join(', ') : val
        },
        {
            key: "isActive",
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
                    <FiPlus /> Add Package
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
                            <h3 className="text-lg font-bold text-slate-900">{editingPackage ? "Edit Promotion Package" : "Add Promotion Package"}</h3>
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
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Package Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Package Type</label>
                                <select
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.packageType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            packageType: type,
                                            placements: type === "COURSE" ? "homePage" : ""
                                        }));
                                    }}
                                >
                                    <option value="EVENT">Event</option>
                                    <option value="COURSE">Course</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Duration (Days)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full border p-2 rounded"
                                    value={formData.durationInDays}
                                    onChange={(e) => setFormData(prev => ({ ...prev, durationInDays: parseInt(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Price (MNT)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full border p-2 rounded"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium">Placements (Select multiple)</label>
                                <select
                                    multiple
                                    required
                                    className="w-full border p-2 rounded h-32"
                                    value={formData.placements ? formData.placements.split(',').map(p => p.trim()).filter(Boolean) : []}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setFormData(prev => ({ ...prev, placements: selected.join(', ') }));
                                    }}
                                >
                                    {formData.packageType === "COURSE" ? (
                                        <>
                                            <option value="homePage">Homepage</option>
                                            <option value="explorePage">Explore Page</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="homePage">Homepage</option>
                                            <option value="explorePage">Explore Page</option>
                                        </>
                                    )}
                                </select>
                                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Active</label>
                                <div className="mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                    <span className="ml-2 text-sm">Is Active</span>
                                </div>
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

export default PromotionPackageList;
