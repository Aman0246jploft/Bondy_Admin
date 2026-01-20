import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../Table/DataTable";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";

const CourseList = () => {
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
                if (response.data?.status) {
                    if (response.data.data.categories) {
                        setCategories(response.data.data.categories);
                    }
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
                setData(response.data.data.courses);
                setTotal(response.data.data.totalCourses); // Note: Backend returns totalCourses
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
            render: (val) =>
                val && val.length > 0 ? (
                    <img
                        src={val[0]}
                        alt="poster"
                        className="w-16 h-10 object-cover rounded"
                    />
                ) : (
                    <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                        No Img
                    </div>
                ),
        },
        { key: "courseTitle", label: "Title" },
        {
            key: "createdBy",
            label: "Organizer",
            render: (val) => (val ? `${val.firstName} ${val.lastName}` : "N/A"),
        },
        {
            key: "courseCategory",
            label: "Category",
            render: (val) => (val ? val.name : "N/A"),
        },
        {
            key: "schedules",
            label: "Start Date",
            render: (val) => {
                if (val && val.length > 0) {
                    return format(new Date(val[0].startDate), "dd HH:mm yyyy");
                }
                return "N/A";
            },
        },
        {
            key: "duration",
            label: "Duration",
            render: (val) => val || "N/A",
        },
        {
            key: "leftSeats",
            label: "Seats",
            render: (_val, row) => (
                <div className="text-xs">
                    <div>Total: {row.totalSeats}</div>
                    <div>Avail: {row.leftSeats}</div>
                </div>
            )
        },

    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Course Management</h2>
                <div className="flex gap-4">
                    <select
                        className="border p-2 rounded"
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
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="border p-2 rounded w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <DataTable columns={columns} data={data} />

            <div className="flex justify-between items-center mt-4">
                <span>Total: {total}</span>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Prev
                    </button>
                    <span>
                        Page {page} of {Math.ceil(total / limit) || 1}
                    </span>
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseList;
