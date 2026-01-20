import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";

const TaxList = ({ title }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "percentage",
        value: 0,
        active: true,
        description: ""
    });

    const fetchTaxes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/tax/list", {
                params: {
                    pageNo: page,
                    size: limit,
                },
            });
            if (response.data?.status) {
                setData(response.data.data.taxes);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching taxes:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchTaxes();
    }, [fetchTaxes]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingTax) {
                response = await authAxiosClient.post("/tax/update", { id: editingTax._id, ...formData });
            } else {
                response = await authAxiosClient.post("/tax/create", formData);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingTax(null);
                setFormData({ name: "", type: "percentage", value: 0, active: true, description: "" });
                fetchTaxes();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save tax");
        }
    };

    const handleDelete = async (tax) => {
        if (window.confirm(`Are you sure you want to delete tax "${tax.name}"?`)) {
            try {
                const response = await authAxiosClient.post("/tax/delete", { id: tax._id });
                if (response.data?.status) {
                    fetchTaxes();
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.message || "Failed to delete tax");
            }
        }
    };

    const openModal = (tax = null) => {
        if (tax) {
            setEditingTax(tax);
            setFormData({
                name: tax.name,
                type: tax.type,
                value: tax.value,
                active: tax.active,
                description: tax.description || ""
            });
        } else {
            setEditingTax(null);
            setFormData({ name: "", type: "percentage", value: 0, active: true, description: "" });
        }
        setIsModalOpen(true);
    };

    const columns = [
        { key: "name", label: "Name" },
        {
            key: "type",
            label: "Type",
            render: (val) => <span className="capitalize">{val}</span>
        },
        {
            key: "value",
            label: "Value",
            render: (val, row) => row.type === 'percentage' ? `${val}%` : val
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
                {/* <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                >
                    <FiPlus /> Add Tax
                </button> */}
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
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">{editingTax ? "Edit Tax" : "Add Tax"}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Type</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Value</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full border p-2 rounded"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                />
                                <label htmlFor="active" className="text-sm font-medium">Active</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
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

export default TaxList;
