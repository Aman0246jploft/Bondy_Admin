import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../Table/DataTable";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";
import { FiBookOpen, FiSearch, FiChevronLeft, FiChevronRight, FiEye } from "react-icons/fi";

const PosterThumbnail = ({ src, alt = "Course poster" }) => {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div className="w-14 h-10 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-xs select-none">
                📚
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            className="w-14 h-10 object-cover rounded-lg border border-slate-200/80 shadow-xs"
            onError={() => setFailed(true)}
        />
    );
};

const CourseList = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    // Fetch Categories for Filter (type=course)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await authAxiosClient.get("/category/list?type=course&limit=100");
                if (response.data?.status && response.data.data.categories) {
                    setCategories(response.data.data.categories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authAxiosClient.get("/course/admin/list", {
                params: {
                    page,
                    limit,
                    search,
                    categoryId: selectedCategory || undefined,
                },
            });
            if (response.data?.status) {
                setData(response.data.data.courses || []);
                setTotal(response.data.data.totalCourses || 0);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, selectedCategory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCourses();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchCourses]);

    const columns = [
        {
            key: "posterImage",
            label: "Poster",
            render: (val, row) => (
                <PosterThumbnail
                    src={val && val.length > 0 ? val[0] : null}
                    alt={row.courseTitle}
                />
            ),
        },
        {
            key: "courseTitle",
            label: "Title",
            render: (val, row) => (
                <div className="max-w-xs">
                    <div className="font-semibold text-slate-900 text-sm truncate">{val}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {row.isFeatured && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Featured
                            </span>
                        )}
                        <span className="text-[11px] text-slate-500 capitalize">{row.enrollmentType || "Course"}</span>
                    </div>
                </div>
            )
        },
        {
            key: "createdBy",
            label: "Instructor / Host",
            render: (val) => (
                <span className="text-sm font-medium text-slate-800">
                    {val ? `${val.firstName || ""} ${val.lastName || ""}`.trim() || "N/A" : "N/A"}
                </span>
            ),
        },
        {
            key: "courseCategory",
            label: "Category",
            render: (val) => (
                val?.name ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {val.name}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">N/A</span>
                )
            ),
        },
        {
            key: "startDate",
            label: "Schedule",
            render: (_val, row) => {
                if (row.startDate) {
                    try {
                        return (
                            <div className="text-xs">
                                <div className="font-medium text-slate-700">{format(new Date(row.startDate), "dd MMM yyyy")}</div>
                                <div className="text-slate-400 text-[11px]">{row.totalSessions ? `${row.totalSessions} sessions` : row.duration || ""}</div>
                            </div>
                        );
                    } catch {
                        return <span className="text-slate-400 text-xs">N/A</span>;
                    }
                }
                return <span className="text-slate-400 text-xs">Ongoing</span>;
            },
        },
        {
            key: "price",
            label: "Fee",
            render: (val) => (
                <span className="font-bold text-slate-900 text-sm">
                    {val === 0 ? "Free" : `₮${Number(val || 0).toLocaleString()}`}
                </span>
            ),
        },
        {
            key: "leftSeats",
            label: "Seats",
            render: (_val, row) => (
                <div className="text-xs space-y-0.5">
                    <div className="text-slate-500">Total: <strong className="text-slate-800">{row.totalSeats || 0}</strong></div>
                    <div className="text-emerald-600 font-semibold">Avail: {row.leftSeats || 0}</div>
                </div>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (_val, row) => (
                <button
                    onClick={() => navigate(`/courses/${row._id}`)}
                    className="px-3.5 py-1.5 bg-[#23ada4] hover:bg-[#1ca398] text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap shadow-xs hover:shadow-md cursor-pointer"
                >
                    View Details
                </button>
            ),
        },
    ];

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="w-full px-[10px] space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shadow-xs">
                        <FiBookOpen className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Courses Directory</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage masterclasses, recurring tracks, enrolled students, and pass plans.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-60 shadow-xs transition"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <DataTable columns={columns} data={data} loading={loading} />
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 px-1">
                <span>Showing {data.length} of {total} courses</span>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition bg-white shadow-xs"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        <FiChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                    </button>
                    <span className="font-semibold text-slate-700 px-2">
                        {page} / {totalPages}
                    </span>
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition bg-white shadow-xs"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <span>Next</span>
                        <FiChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseList;
