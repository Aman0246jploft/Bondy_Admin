import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import DataTable from "../Table/DataTable";
import { FiEdit2, FiPlus, FiChevronDown, FiSearch } from "react-icons/fi";
import { BsTrash2 } from "react-icons/bs";
import authAxiosClient from "../../api/authAxiosClient";
import { toast } from "react-toastify";
import { useConfirm } from "../../contexts/confirm/ConfirmContext";

const CategoryAvatar = ({ src, name }) => {
    const [imgSrc, setImgSrc] = useState(src || "/Profileimage.png");
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || "/Profileimage.png");
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (!hasError && imgSrc !== "/Profileimage.png") {
            setImgSrc("/Profileimage.png");
        } else {
            setHasError(true);
        }
    };

    if (hasError) {
        return (
            <div
                className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 select-none flex-shrink-0"
                title={name || "Category Avatar"}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={name || "Category Icon"}
            className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white flex-shrink-0"
            onError={handleError}
        />
    );
};


const CategoryList = ({ title }) => {
    const confirm = useConfirm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");

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

    const fetchCategories = useCallback(async (overrideParams = {}) => {
        setLoading(true);
        try {
            const targetType = overrideParams.type !== undefined ? overrideParams.type : type;
            const targetPage = overrideParams.page !== undefined ? overrideParams.page : page;
            const targetSearch = overrideParams.search !== undefined ? overrideParams.search : search;

            const response = await authAxiosClient.get("/category/list", {
                params: {
                    page: targetPage,
                    limit,
                    search: targetSearch,
                    type: targetType || "all"
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

        // Strict validation: Only images allowed (no PDF, DOC, PPT, etc.)
        const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];
        const validExtension = /\.(jpe?g|png|webp|svg|gif)$/i;

        if (!file.type.startsWith("image/") || (!validTypes.includes(file.type) && !validExtension.test(file.name))) {
            toast.error("Invalid file format. Please select an image file (PNG, JPG, JPEG, WEBP, SVG, GIF). PDF, DOC, PPT or other file types are not allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image file size should not exceed 10MB.");
            e.target.value = "";
            return;
        }

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
                toast.success("Image uploaded successfully");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handlePosterUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Strict validation: Only images allowed (no PDF, DOC, PPT, etc.)
        const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];
        const validExtension = /\.(jpe?g|png|webp|svg|gif)$/i;

        if (!file.type.startsWith("image/") || (!validTypes.includes(file.type) && !validExtension.test(file.name))) {
            toast.error("Invalid file format. Please select an image file (PNG, JPG, JPEG, WEBP, SVG, GIF). PDF, DOC, PPT or other file types are not allowed.");
            e.target.value = "";
            return;
        }

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
                toast.success("Poster image uploaded");
            }
        } catch (error) {
            console.error("Poster upload error:", error);
            toast.error("Poster image upload failed");
        } finally {
            setUploadingPoster(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
                toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
                // Refresh all categories immediately
                setPage(1);
                fetchCategories({ page: 1 });
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save category");
        }
    };

    const handleDelete = async (category) => {
        const confirmed = await confirm({
            title: "Delete Category",
            message: `Are you sure you want to delete category "${category.name}"? This action cannot be undone.`,
            confirmText: "Delete",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const response = await authAxiosClient.delete(`/category/delete/${category._id}`);
            if (response.data?.status) {
                toast.success("Category deleted successfully");
                fetchCategories();
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete category");
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            const getSafePath = (url) => {
                if (!url) return "";
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.includes("/uploads/")) {
                        const relative = url.split('/uploads/').pop();
                        return `uploads/${relative}`;
                    }
                    return url;
                }
                return url;
            };

            setFormData({
                name: category.name,
                name_thi: category.name_thi || "",
                type: category.type,
                image: getSafePath(category.image),
                posterImage: getSafePath(category.posterImage)
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", name_thi: "", type: "event", image: "", posterImage: "" });
        }
        setIsModalOpen(true);
    };

    const handleToggleFeatured = async (category) => {
        if (togglingFeaturedId) return;

        const nextFeatured = !category.featured;
        const confirmed = await confirm({
            title: nextFeatured ? "Feature Category" : "Unfeature Category",
            message: `Are you sure you want to ${nextFeatured ? "feature" : "unfeature"} "${category.name}"?`,
            confirmText: nextFeatured ? "Feature" : "Unfeature",
            variant: "primary",
        });
        if (!confirmed) return;

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
                toast.success(`Category ${updatedFeatured ? "featured" : "unfeatured"} successfully`);
            }
        } catch (error) {
            console.error("Toggle featured error:", error);
            toast.error(error?.response?.data?.message || error.message || "Failed to toggle featured status");
            fetchCategories();
        } finally {
            setTogglingFeaturedId(null);
        }
    };

    const columns = [
        {
            key: "image",
            label: "Icon",
            render: (val, row) => (
                <CategoryAvatar src={val} name={row?.name || row?.name_thi} />
            )
        },
        { key: "name", label: "Name (EN)" },
        { key: "name_thi", label: "Name (THI)" },
        // {
        //     key: "posterImage",
        //     label: "Poster",
        //     render: (val, row) => row.type !== "event" ? null : (
        //         val ? <img src={val} alt="poster" className="w-14 h-10 object-cover rounded" /> : <div className="w-14 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">None</div>
        //     )
        // },
        {
            key: "type",
            label: "Type",
            render: (val) => <span className={`capitalize px-2 py-1 rounded text-xs ${val === 'event' ? 'bg-teal-100 text-teal-800' : val === 'support_ticket' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>{val === 'support_ticket' ? 'Support Ticket' : val}</span>
        },
        // {
        //     key: "featured",
        //     label: "Featured",
        //     render: (val, row) => row.type !== "event" ? null : (
        //         <input
        //             type="checkbox"
        //             checked={!!val}
        //             disabled={togglingFeaturedId === row._id}
        //             onChange={() => handleToggleFeatured(row)}
        //             className="h-4 w-4 cursor-pointer"
        //         />
        //     )
        // },
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
        <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage event, course, and support ticket categories.</p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                    {/* Category Type Filter */}
                    <div className="relative w-full sm:w-auto min-w-[150px]">
                        <select
                            className="appearance-none bg-white border border-slate-200 pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 shadow-2xs cursor-pointer transition w-full"
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">All Types</option>
                            <option value="event">Event</option>
                            <option value="course">Course</option>
                            <option value="support_ticket">Support Ticket</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full bg-white border border-slate-200 pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 shadow-2xs transition"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Add Category Button */}
                    <button
                        onClick={() => openModal()}
                        className="bg-[#23ada4] hover:bg-[#1ca398] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-md transition cursor-pointer whitespace-nowrap w-full sm:w-auto"
                    >
                        <FiPlus className="w-4 h-4" /> Add Category
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <DataTable columns={columns} data={data} loading={loading} />
            </div>

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
            {isModalOpen &&
                createPortal(
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fadeIn">
                        <div className="bg-white p-6 sm:p-7 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 animate-scaleUp">
                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900">{editingCategory ? "Edit Category" : "Add Category"}</h3>
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
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                                        value={formData.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({ ...prev, name: val }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name in Mongolian</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                                        value={formData.name_thi}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({ ...prev, name_thi: val }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none bg-white border border-slate-200 pl-3.5 pr-9 py-2.5 rounded-xl text-sm font-medium text-slate-800 focus:border-[#23ada4] focus:ring-2 focus:ring-teal-500/20 outline-none transition cursor-pointer"
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
                                        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Image</label>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif"
                                        className="w-full border border-slate-200 p-2 rounded-xl text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-[#178c82] hover:file:bg-teal-100 cursor-pointer"
                                        onChange={handleFileUpload}
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP, SVG, GIF only. Documents (PDF, DOC, PPT) are not allowed.</p>
                                    {uploading && <p className="text-xs text-teal-600 mt-1">Uploading...</p>}
                                    {formData.image && (
                                        <p className="text-xs text-green-600 truncate mt-1">Selected: {formData.image}</p>
                                    )}
                                    <div className="mt-2.5 flex items-center gap-3">
                                        <CategoryAvatar src={formData.image} name={formData.name} />
                                        <span className="text-xs text-slate-500">
                                            {formData.image ? "Current Icon Preview" : "Default Avatar"}
                                        </span>
                                    </div>
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
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default CategoryList;