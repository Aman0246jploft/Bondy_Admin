import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";

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
                const filteredSettings = allSettings.filter(item =>
                    // item.key === 'COMMISSION_CONFIG' ||
                    // item.key === 'FEATURE_EVENT_FEE' ||
                    // item.key === 'REFERRAL_REWARD_AMOUNT' ||
                    item.key === 'MIN_PAYOUT_CONFIG' ||
                    item.key === 'SOCIAL_LINKS' ||
                    item.key === 'CANCELLATION_FEE_PERCENT'
                );

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
                toast.success("Setting saved successfully");
                fetchSettings();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save setting");
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
                        <FiEdit2 className="w-4 h-4 text-teal-500 hover:text-teal-700" />
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
                    className="bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-teal-700"
                >
                    <FiPlus /> Add Setting
                </button> */}
            </div>

            <DataTable columns={columns} data={data} loading={loading} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-6 sm:p-7 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 animate-scaleUp">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">{editingSetting ? "Edit Setting" : "Add Setting"}</h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Key</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingSetting}
                                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
                                    value={formData.key}
                                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Value (String or JSON)</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl font-mono text-sm focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                                    value={formData.value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                                <textarea
                                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                </div>
            )}
        </div>
    );
};

export default GlobalSettingList;
