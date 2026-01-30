import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import authAxiosClient from "../../api/authAxiosClient";

const GlobalSettingList = ({ title }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [formData, setFormData] = useState({
        key: "",
        value: "",
        description: ""
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/globalsetting/all");
            if (response.data?.status) {
                // Filter to show only COMMISSION_CONFIG as requested
                const allSettings = response.data.data.settings;
                const filteredSettings = allSettings.filter(item => item.key === 'COMMISSION_CONFIG' || item.key === 'FEATURE_EVENT_FEE');
                console.log("filteredSettings1111", filteredSettings);
                setData(filteredSettings);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Check if value is JSON
            let finalValue = formData.value;
            try {
                if (typeof formData.value === 'string' && (formData.value.startsWith('{') || formData.value.startsWith('['))) {
                    finalValue = JSON.parse(formData.value);
                }
            } catch (e) {
                // Keep as string if not valid JSON
            }

            const response = await authAxiosClient.post("/globalsetting/upsert", {
                ...formData,
                value: finalValue
            });

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingSetting(null);
                setFormData({ key: "", value: "", description: "" });
                fetchSettings();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save setting");
        }
    };

    const openModal = (setting = null) => {
        if (setting) {
            setEditingSetting(setting);
            setFormData({
                key: setting.key,
                value: typeof setting.value === 'object' ? JSON.stringify(setting.value, null, 2) : setting.value,
                description: setting.description || ""
            });
        } else {
            setEditingSetting(null);
            setFormData({ key: "", value: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const columns = [
        { key: "key", label: "Key" },
        {
            key: "value",
            label: "Value",
            render: (val) => typeof val === 'object' ? JSON.stringify(val) : String(val)
        },
        { key: "description", label: "Description" },
        {
            key: "actions",
            label: "Actions",
            render: (value, row) => (
                <div className="flex gap-3">
                    <button onClick={() => openModal(row)}>
                        <FiEdit2 className="w-4 h-4 text-blue-500 hover:text-blue-700" />
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
                    <FiPlus /> Add Setting
                </button>
            </div>

            <DataTable columns={columns} data={data} loading={loading} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[32rem]">
                        <h3 className="text-lg font-bold mb-4">{editingSetting ? "Edit Setting" : "Add Setting"}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Key</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingSetting}
                                    className="w-full border p-2 rounded disabled:bg-gray-100"
                                    value={formData.key}
                                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Value (String or JSON)</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full border p-2 rounded font-mono text-sm"
                                    value={formData.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
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

export default GlobalSettingList;
