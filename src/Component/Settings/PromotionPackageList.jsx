import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";

const PromotionPackageList = ({ title }) => {
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
                fetchPackages();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save promotion package");
        }
    };

    const handleDelete = async (pkg) => {
        if (window.confirm(`Are you sure you want to delete package "${pkg.name}"?`)) {
            try {
                const response = await authAxiosClient.post("/promotion-package/delete", { id: pkg._id });
                if (response.data?.status) {
                    fetchPackages();
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.message || "Failed to delete promotion package");
            }
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
                        <FiEdit2 className="w-4 h-4 text-blue-500 hover:text-blue-700" />
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
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <FiPlus /> Add Package
                </button>
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[32rem]">
                        <h3 className="text-lg font-bold mb-4">{editingPackage ? "Edit Promotion Package" : "Add Promotion Package"}</h3>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium">Package Name</label>
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
                                        <option value="homePage">Home page</option>
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

                            <div className="col-span-2 flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionPackageList;
