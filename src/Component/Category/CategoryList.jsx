import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";

const CategoryList = ({ title }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        name_thi: "",
        type: "event",
        image: "",
        posterImage: ""
    });
    const [uploading, setUploading] = useState(false);
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [togglingFeaturedId, setTogglingFeaturedId] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/category/list", {
                params: {
                    page,
                    limit,
                    search,
                    type: type || undefined
                },
            });
            if (response.data?.status) {
                setData(response.data.data.categories);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, type]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCategories();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchCategories]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append("files", file);
        data.append("userId", "category");

        try {
            const response = await authAxiosClient.post("/user/upload", data, {
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

    const handlePosterUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPoster(true);
        const data = new FormData();
        data.append("files", file);
        data.append("userId", "category");

        try {
            const response = await authAxiosClient.post("/user/upload", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            if (response.data?.status) {
                const uploadedPath = response.data.data.files[0];
                setFormData(prev => ({ ...prev, posterImage: uploadedPath }));
            }
        } catch (error) {
            console.error("Poster upload error:", error);
            alert("Poster image upload failed");
        } finally {
            setUploadingPoster(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        console.log("Saving Category Payload:", formData); // Debugging
        try {
            let response;
            if (editingCategory) {
                response = await authAxiosClient.post(`/category/update/${editingCategory._id}`, formData);
            } else {
                response = await authAxiosClient.post("/category/create", formData);
            }

            if (response.data?.status) {
                setIsModalOpen(false);
                setEditingCategory(null);
                setFormData({ name: "", name_thi: "", type: "event", image: "", posterImage: "" });
                fetchCategories();
            }
        } catch (error) {
            console.error("Save error:", error);
            alert(error.message || "Failed to save category");
        }
    };

    const handleDelete = async (category) => {
        if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            try {
                const response = await authAxiosClient.delete(`/category/delete/${category._id}`);
                if (response.data?.status) {
                    fetchCategories();
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert(error.message || "Failed to delete category");
            }
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            const relativePath = category.image ? category.image.split('/uploads/').pop() : "";
            const posterRelativePath = category.posterImage ? category.posterImage.split('/uploads/').pop() : "";
            setFormData({
                name: category.name,
                name_thi: category.name_thi || "",
                type: category.type,
                image: relativePath ? `uploads/${relativePath}` : "",
                posterImage: posterRelativePath ? `uploads/${posterRelativePath}` : ""
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", name_thi: "", type: "event", image: "", posterImage: "" });
        }
        setIsModalOpen(true);
    };

    const handleToggleFeatured = async (category) => {
        if (togglingFeaturedId) return;

        setTogglingFeaturedId(category._id);
        try {
            const response = await authAxiosClient.post(`/category/toggle-featured/${category._id}`);
            if (response.data?.status) {
                const updatedFeatured = response.data?.data?.featured;
                setData((prev) => prev.map((item) => (
                    item._id === category._id
                        ? { ...item, featured: updatedFeatured }
                        : item
                )));
            }
        } catch (error) {
            console.error("Toggle featured error:", error);
            alert(error?.response?.data?.message || error.message || "Failed to toggle featured status");
            fetchCategories();
        } finally {
            setTogglingFeaturedId(null);
        }
    };

    const columns = [
        {
            key: "image",
            label: "Icon",
            render: (val) => val ? <img src={val} alt="icon" className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">No Icon</div>
        },
        { key: "name", label: "Name (EN)" },
        { key: "name_thi", label: "Name (THI)" },
        {
            key: "posterImage",
            label: "Poster",
            render: (val, row) => row.type !== "event" ? null : (
                val ? <img src={val} alt="poster" className="w-14 h-10 object-cover rounded" /> : <div className="w-14 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">None</div>
            )
        },
        {
            key: "type",
            label: "Type",
            render: (val) => <span className={`capitalize px-2 py-1 rounded text-xs ${val === 'event' ? 'bg-blue-100 text-blue-800' : val === 'support_ticket' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{val === 'support_ticket' ? 'Support Ticket' : val}</span>
        },
        {
            key: "featured",
            label: "Featured",
            render: (val, row) => row.type !== "event" ? null : (
                <input
                    type="checkbox"
                    checked={!!val}
                    disabled={togglingFeaturedId === row._id}
                    onChange={() => handleToggleFeatured(row)}
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
                <div className="flex gap-4">
                    <select
                        className="border p-2 rounded"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="event">Event</option>
                        <option value="course">Course</option>
                        <option value="support_ticket">Support Ticket</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="border p-2 rounded w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                    >
                        <FiPlus /> Add Category
                    </button>
                </div>
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

            {/* Modal for Create/Update */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">{editingCategory ? "Edit Category" : "Add Category"}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ ...prev, name: val }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Name in Mongolian</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={formData.name_thi}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ ...prev, name_thi: val }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Type</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={formData.type}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ ...prev, type: val }));
                                    }}
                                >
                                    <option value="event">Event</option>
                                    <option value="course">Course</option>
                                    <option value="support_ticket">Support Ticket</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border p-2 rounded"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
                                {formData.image && (
                                    <p className="text-xs text-green-600 truncate">Selected: {formData.image}</p>
                                )}
                            </div>
                            {formData.type === "event" && (
                            <div>
                                <label className="block text-sm font-medium">Poster Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border p-2 rounded"
                                    onChange={handlePosterUpload}
                                />
                                {uploadingPoster && <p className="text-xs text-blue-600">Uploading...</p>}
                                {formData.posterImage && (
                                    <p className="text-xs text-green-600 truncate">Selected: {formData.posterImage}</p>
                                )}
                            </div>
                            )}
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

export default CategoryList;
