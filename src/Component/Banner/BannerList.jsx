import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";

const BannerList = ({ title }) => {
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
            alert("Image upload failed");
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
                fetchBanners();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.response?.data?.message || error.message || "Failed to save banner");
        }
    };

    const handleDelete = async (banner) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            try {
                const response = await authAxiosClient.delete(`/banner/delete/${banner._id}`);
                if (response.data?.status) {
                    fetchBanners();
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.response?.data?.message || error.message || "Failed to delete banner");
            }
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
            }
        } catch (error) {
            console.error("Toggle active error:", error);
            alert(error?.response?.data?.message || error.message || "Failed to toggle active status");
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
        { 
            key: "linkUrl", 
            label: "Redirect URL",
            render: (val) => val ? <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{val}</a> : <span className="text-gray-400">None</span>
        },
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
                <div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 font-medium"
                    >
                        <FiPlus /> Add Banner
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading Banners...</div>
            ) : (
                <DataTable columns={columns} data={data} />
            )}

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

            {/* Modal for Create/Update */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">{editingBanner ? "Edit Banner" : "Add Banner"}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Banner Image / GIF</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border p-2 rounded mt-1"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                                {formData.image && (
                                    <p className="text-xs text-green-600 truncate mt-1">Selected path: {formData.image}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Redirect URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    className="w-full border p-2 rounded mt-1"
                                    value={formData.linkUrl}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ ...prev, linkUrl: val }));
                                    }}
                                />
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
                                    className="h-4 w-4 cursor-pointer"
                                />
                                <label htmlFor="isActiveCheckbox" className="text-sm font-medium cursor-pointer">Active</label>
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
                                    disabled={uploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
