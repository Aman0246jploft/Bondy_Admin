import React, { useEffect, useState } from "react";
import stayUpdatedApi from "../../api/stayUpdatedApi";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const StayUpdatedList = () => {
    const [signups, setSignups] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const limit = 10;
    const { theme } = useTheme();

    useEffect(() => {
        fetchSignups();
    }, [page]);

    const fetchSignups = async () => {
        setLoading(true);
        try {
            const response = await stayUpdatedApi.listSignups({ page, limit });
            if (response.data && response.data.data && response.data.data.signups) {
                setSignups(response.data.data.signups);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching signups:", error);
            toast.error("Failed to fetch signups");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this signup?")) return;
        try {
            const response = await stayUpdatedApi.deleteSignup(id);
            if (response.data.status) {
                toast.success("Signup removed successfully");
                fetchSignups();
            }
        } catch (error) {
            console.error("Error deleting signup:", error);
            toast.error("Failed to remove signup");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Website Update Signups</h3>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg shadow" style={{ backgroundColor: theme.colors.cardBg }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead style={{ backgroundColor: theme.colors.background }}>
                                <tr>
                                    {["#", "Email", "Signup Date", "Actions"].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                                            style={{ color: theme.colors.textSecondary }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200" style={{ backgroundColor: theme.colors.cardBg }}>
                                {signups.length > 0 ? (
                                    signups.map((signup, index) => (
                                        <tr key={signup._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textPrimary }}>
                                                {(page - 1) * limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                                {signup.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>
                                                {new Date(signup.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(signup._id)}
                                                    className="text-red-500 hover:text-red-700 bg-red-100 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm" style={{ color: theme.colors.textSecondary }}>
                                            No signups found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 space-x-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                                style={{
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary
                                }}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`px-3 py-1 rounded border ${page === i + 1 ? "bg-blue-500 text-white border-blue-500" : ""
                                        }`}
                                    style={page !== i + 1 ? {
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary
                                    } : {}}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                                style={{
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StayUpdatedList;
