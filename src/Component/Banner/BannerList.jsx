import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useConfirm } from "../../contexts/confirm/ConfirmContext";

const BannerList = ({ title }) => {
    const confirm = useConfirm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        image: "",
        linkUrl: "",
        isActive: true
    });
    const [uploading, setUploading] = useState(false);
    const [togglingActiveId, setTogglingActiveId] = useState(null);

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/banner/admin/list", {
                params: {
                    page,
                    limit
                },
            });
            if (response.data?.status) {
                setData(response.data.data.banners);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("files", file);
        uploadData.append("userId", "banner");

        try {
            const response = await authAxiosClient.post("/user/upload", uploadData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            if (response.data?.status) {
                const uploadedPath = response.data.data.files[0];
                setFormData(prev => ({ ...prev, image: uploadedPath }));
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingBanner) {
                response = await authAxiosClient.post(`/banner/update/${editingBanner._id}`, formData);
            } else {
                response = await authAxiosClient.post("/banner/create", formData);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingBanner(null);
                setFormData({ image: "", linkUrl: "", isActive: true });
                toast.success(editingBanner ? "Banner updated successfully" : "Banner created successfully");
                fetchBanners();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to save banner");
        }
    };

    const handleDelete = async (banner) => {
        const confirmed = await confirm({
            title: "Delete Banner",
            message: "Are you sure you want to delete this banner? This action cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const response = await authAxiosClient.delete(`/banner/delete/${banner._id}`);
            if (response.data?.status) {
                toast.success("Banner deleted successfully");
                fetchBanners();
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to delete banner");
        }
    };

    const openModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            const relativePath = banner.image ? banner.image.split('/uploads/').pop() : "";
            setFormData({
                image: relativePath ? `uploads/${relativePath}` : "",
                linkUrl: banner.linkUrl || "",
                isActive: banner.isActive
            });
        } else {
            setEditingBanner(null);
            setFormData({ image: "", linkUrl: "", isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleToggleActive = async (banner) => {
        if (togglingActiveId) return;

        setTogglingActiveId(banner._id);
        try {
            const response = await authAxiosClient.post(`/banner/toggle-active/${banner._id}`);
            if (response.data?.status) {
                const updatedActive = response.data?.data?.isActive;
                setData((prev) => prev.map((item) => (
                    item._id === banner._id
                        ? { ...item, isActive: updatedActive }
                        : item
                )));
                toast.success(`Banner ${updatedActive ? "activated" : "deactivated"} successfully`);
            }
        } catch (error) {
            console.error("Toggle active error:", error);
            toast.error(error?.response?.data?.message || error.message || "Failed to toggle active status");
            fetchBanners();
        } finally {
            setTogglingActiveId(null);
        }
    };

    const columns = [
        {
            key: "image",
            label: "Banner Image / GIF",
            render: (val) => val ? <img src={val} alt="banner" className="w-24 h-12 object-cover rounded border" /> : <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">No Image</div>
        },
        // {
        //     key: "linkUrl",
        //     label: "Redirect URL",
        //     render: (val) => val ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline break-all">{val}</a> : <span className="text-gray-400">None</span>
        // },
        {
            key: "isActive",
            label: "Active",
            render: (val, row) => (
                <input
                    type="checkbox"
                    checked={!!val}
                    disabled={togglingActiveId === row._id}
                    onChange={() => handleToggleActive(row)}
                    className="h-4 w-4 cursor-pointer"
                />
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
                <h2 className="text-xl font-bold">{title}</h2>
                <div>
                    <button
                        onClick={() => openModal()}
                        className="bg-[#23ada4] hover:bg-[#1ca398] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
                    >
                        <FiPlus /> Add Banner
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4 text-slate-500">Loading Banners...</div>
            ) : (
                <DataTable columns={columns} data={data} />
            )}

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

            {/* Modal for Create/Update */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white p-6 sm:p-7 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 animate-scaleUp">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">{editingBanner ? "Edit Banner" : "Add Banner"}</h3>
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
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Banner Image / GIF</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border border-slate-200 p-2 rounded-xl text-sm"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <p className="text-xs text-teal-600 mt-1">Uploading...</p>}
                                {formData.image && (
                                    <p className="text-xs text-green-600 truncate mt-1">Selected path: {formData.image}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActiveCheckbox"
                                    checked={formData.isActive}
                                    onChange={(e) => {
                                        const val = e.target.checked;
                                        setFormData(prev => ({ ...prev, isActive: val }));
                                    }}
                                    className="h-4 w-4 accent-[#23ada4] cursor-pointer"
                                />
                                <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-slate-700 cursor-pointer">Active</label>
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
                                    disabled={uploading}
                                    className="px-5 py-2.5 bg-[#23ada4] hover:bg-[#1ca398] text-white font-semibold rounded-xl text-sm shadow-xs transition cursor-pointer disabled:opacity-50"
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

export default BannerList;
