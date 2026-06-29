import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlineSave } from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const PrivacyPolicy = () => {
    const { theme } = useTheme();
    const [content, setContent] = useState("");
    const [contentMn, setContentMn] = useState("");
    const [activeTab, setActiveTab] = useState("en");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const token = localStorage.getItem("token");
            
            // Fetch English
            try {
                const response = await axios.get(`${API_URL}/api/v1/globalsetting/privacy_policy`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.data) {
                    setContent(response.data.data.value);
                }
            } catch (error) {
                console.error("Error fetching English privacy policy:", error);
            }

            // Fetch Mongolian
            try {
                const responseMn = await axios.get(`${API_URL}/api/v1/globalsetting/privacy_policy_mn`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (responseMn.data.data) {
                    setContentMn(responseMn.data.data.value);
                }
            } catch (error) {
                console.error("Error fetching Mongolian privacy policy:", error);
            }
        } catch (error) {
            console.error("Error in fetchContent:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Save English
            await axios.post(
                `${API_URL}/api/v1/globalsetting/upsert`,
                {
                    key: "privacy_policy",
                    value: content,
                    description: "HTML content for Privacy Policy page",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Save Mongolian
            await axios.post(
                `${API_URL}/api/v1/globalsetting/upsert`,
                {
                    key: "privacy_policy_mn",
                    value: contentMn,
                    description: "HTML content for Privacy Policy page in Mongolian",
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

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
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
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                    <AiOutlineSave className="mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6" style={{ backgroundColor: theme.colors.cardBg }}>
                <div className="flex border-b mb-4">
                    <button
                        onClick={() => setActiveTab("en")}
                        className={`py-2 px-4 font-medium transition-all ${
                            activeTab === "en"
                                ? "border-b-2 border-teal-600 text-teal-600"
                                : "text-gray-400 hover:text-gray-500"
                        }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setActiveTab("mn")}
                        className={`py-2 px-4 font-medium transition-all ${
                            activeTab === "mn"
                                ? "border-b-2 border-teal-600 text-teal-600"
                                : "text-gray-400 hover:text-gray-500"
                        }`}
                    >
                        Mongolian
                    </button>
                </div>
                <p className="mb-4 text-sm text-gray-400">
                    Use the editor below to manage the Privacy Policy content in {activeTab === "en" ? "English" : "Mongolian"}.
                </p>
                <div className="quill-container">
                    <ReactQuill
                        key={activeTab}
                        theme="snow"
                        value={activeTab === "en" ? content : contentMn}
                        onChange={activeTab === "en" ? setContent : setContentMn}
                        modules={modules}
                        style={{
                            height: "500px",
                            marginBottom: "50px",
                            backgroundColor: theme.colors.background,
                            color: theme.colors.textPrimary,
                        }}
                    />
                </div>
            </div>

            <style jsx global>{`
                .ql-toolbar {
                    background-color: #f3f4f6;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    font-size: 1rem;
                }
                .ql-editor {
                    min-height: 200px;
                }
                .dark .ql-toolbar {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                .dark .ql-container {
                    border-color: #374151;
                }
                .dark .ql-stroke {
                    stroke: #e5e7eb;
                }
                .dark .ql-fill {
                    fill: #e5e7eb;
                }
                .dark .ql-picker {
                    color: #e5e7eb;
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy;
