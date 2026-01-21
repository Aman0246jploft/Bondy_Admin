import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlineSave } from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const PrivacyPolicy = () => {
    const { theme } = useTheme();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/api/v1/globalsetting/privacy_policy`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.data) {
                setContent(response.data.data.value);
            }
        } catch (error) {
            console.error("Error fetching privacy policy:", error);
            // If not found, it might be empty, which is fine
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_URL}/globalsetting/upsert`,
                {
                    key: "privacy_policy",
                    value: content,
                    description: "HTML content for Privacy Policy page",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Privacy Policy updated successfully");
        } catch (error) {
            console.error("Error updating privacy policy:", error);
            toast.error(error.response?.data?.message || "Failed to update Privacy Policy");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    Privacy Policy Management
                </h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <AiOutlineSave className="mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.cardBg }}>
                <p className="mb-4 text-sm text-gray-400">
                    Enter the HTML content for the Privacy Policy page below.
                </p>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[600px] p-4 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                        backgroundColor: theme.colors.background,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border
                    }}
                    placeholder="<h1>Privacy Policy</h1><p>Your content here...</p>"
                />
            </div>
        </div>
    );
};

export default PrivacyPolicy;
