import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineClose } from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import { useConfirm } from "../../contexts/confirm/ConfirmContext";
import Modal from "react-modal";

// Styles for react-modal
const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        padding: '0',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: 'transparent',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000,
    },
};

Modal.setAppElement('#root'); // Important for accessibility

const FAQList = () => {
    const { theme } = useTheme();
    const confirm = useConfirm();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentFAQ, setCurrentFAQ] = useState(null); // For editing
    const [topics, setTopics] = useState([]);
    const [topicModalIsOpen, setTopicModalIsOpen] = useState(false);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [topicFormData, setTopicFormData] = useState({
        name: "",
        name_mn: "",
        order: 0,
        isActive: true,
    });
    const [formData, setFormData] = useState({
        categoryId: "",
        question: "",
        question_mn: "",
        answer: "",
        answer_mn: "",
        order: 0,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [topicSaving, setTopicSaving] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const requireSuccess = (response) => {
        if (!response?.data?.status) {
            throw new Error(response?.data?.message || "Request failed");
        }
        return response;
    };

    useEffect(() => {
        fetchFAQs();
        fetchTopics();
    }, []);

    const fetchFAQs = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/api/v1/faq/admin/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFaqs(response.data.data.faqs);
        } catch (error) {
            console.error("Error fetching FAQs:", error);
            toast.error("Failed to fetch FAQs");
        } finally {
            setLoading(false);
        }
    };

    const fetchTopics = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/api/v1/faq/admin/topics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTopics(response.data.data.topics || []);
        } catch (error) {
            console.error("Error fetching FAQ topics:", error);
            toast.error("Failed to fetch FAQ topics");
        }
    };

    const openModal = (faq = null) => {
        if (faq) {
            setCurrentFAQ(faq);
            setFormData({
                categoryId: faq.categoryId || faq.category?._id || "",
                question: faq.question,
                question_mn: faq.question_mn || "",
                answer: faq.answer,
                answer_mn: faq.answer_mn || "",
                order: faq.order,
                isActive: faq.isActive,
            });
        } else {
            setCurrentFAQ(null);
            const firstActiveTopic = topics.find((topic) => topic.isActive);
            setFormData({
                categoryId: firstActiveTopic?._id || "",
                question: "",
                question_mn: "",
                answer: "",
                answer_mn: "",
                order: faqs.length + 1,
                isActive: true,
            });
        }
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setCurrentFAQ(null);
    };

    const openTopicModal = (topic = null) => {
        if (topic) {
            setCurrentTopic(topic);
            setTopicFormData({
                name: topic.name,
                name_mn: topic.name_mn,
                order: topic.order,
                isActive: topic.isActive,
            });
        } else {
            setCurrentTopic(null);
            setTopicFormData({
                name: "",
                name_mn: "",
                order: topics.length + 1,
                isActive: true,
            });
        }
        setTopicModalIsOpen(true);
    };

    const closeTopicModal = () => {
        setTopicModalIsOpen(false);
        setCurrentTopic(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleTopicChange = (e) => {
        const { name, value, type, checked } = e.target;
        setTopicFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem("token");

        try {
            if (currentFAQ) {
                // Update
                const response = await axios.put(`${API_URL}/api/v1/faq/update/${currentFAQ._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                requireSuccess(response);
                toast.success("FAQ updated successfully");
            } else {
                const response = await axios.post(`${API_URL}/api/v1/faq/create`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                requireSuccess(response);
                toast.success("FAQ created successfully");
            }
            fetchFAQs();
            closeModal();
        } catch (error) {
            console.error("Error saving FAQ:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to save FAQ");
        } finally {
            setSaving(false);
        }
    };

    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        setTopicSaving(true);
        const token = localStorage.getItem("token");

        try {
            if (currentTopic) {
                const response = await axios.put(
                    `${API_URL}/api/v1/faq/admin/topics/${currentTopic._id}`,
                    topicFormData,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                requireSuccess(response);
                toast.success("FAQ topic updated successfully");
            } else {
                const response = await axios.post(
                    `${API_URL}/api/v1/faq/admin/topics`,
                    topicFormData,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                requireSuccess(response);
                toast.success("FAQ topic created successfully");
            }
            await fetchTopics();
            closeTopicModal();
        } catch (error) {
            console.error("Error saving FAQ topic:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to save FAQ topic");
        } finally {
            setTopicSaving(false);
        }
    };

    const handleTopicDelete = async (topic) => {
        const confirmed = await confirm({
            title: "Delete FAQ Topic",
            message: `Are you sure you want to delete topic "${topic.name}"? This action cannot be undone.`,
            confirmText: "Delete Topic",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(`${API_URL}/api/v1/faq/admin/topics/${topic._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            requireSuccess(response);
            toast.success("FAQ topic deleted successfully");
            fetchTopics();
        } catch (error) {
            console.error("Error deleting FAQ topic:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to delete FAQ topic");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Delete FAQ",
            message: "Are you sure you want to delete this FAQ? This action cannot be undone.",
            confirmText: "Delete FAQ",
            variant: "danger",
        });
        if (!confirmed) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(`${API_URL}/api/v1/faq/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            requireSuccess(response);
            toast.success("FAQ deleted successfully");
            fetchFAQs();
        } catch (error) {
            console.error("Error deleting FAQ:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to delete FAQ");
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                    FAQ Management
                </h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                    <AiOutlinePlus className="mr-2" />
                    Add FAQ
                </button>
            </div>

            <section
                className="mb-8 p-5 rounded-xl border"
                style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }}
            >
                <div className="flex justify-between items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                            Common Topics
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the categories shown in the FAQ help center.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openTopicModal()}
                        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex-shrink-0"
                    >
                        <AiOutlinePlus className="mr-2" />
                        Add Topic
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {topics.map((topic) => (
                        <div
                            key={topic._id}
                            className="p-4 rounded-lg border flex items-start gap-3"
                            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-500">#{topic.order}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${topic.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                        {topic.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <b className="block text-sm truncate" style={{ color: theme.colors.textPrimary }}>
                                    {topic.name}
                                </b>
                                <span className="block text-xs text-teal-600 mt-1 truncate">
                                    MN: {topic.name_mn}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => openTopicModal(topic)}
                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                    title="Edit topic"
                                >
                                    <AiOutlineEdit size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTopicDelete(topic)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete topic"
                                >
                                    <AiOutlineDelete size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>
                FAQs
            </h2>
            <div className="grid gap-4">
                {faqs.map((faq) => (
                    <div
                        key={faq._id}
                        className="p-4 rounded-lg shadow-sm border flex justify-between items-start"
                        style={{
                            backgroundColor: theme.colors.cardBg,
                            borderColor: theme.colors.border
                        }}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full" title="Order">#{faq.order}</span>
                                {faq.category && (
                                    <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">
                                        {faq.category.name}
                                    </span>
                                )}
                                {faq.isActive ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                                )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1" style={{ color: theme.colors.textPrimary }}>
                                {faq.question}
                                {faq.question_mn && <span className="block text-xs font-normal text-teal-600 mt-0.5">MN: {faq.question_mn}</span>}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                                {faq.answer}
                                {faq.answer_mn && <span className="block text-xs font-normal text-teal-500 mt-0.5">MN: {faq.answer_mn}</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => openModal(faq)}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                title="Edit"
                            >
                                <AiOutlineEdit size={20} />
                            </button>
                            <button
                                onClick={() => handleDelete(faq._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete"
                            >
                                <AiOutlineDelete size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {faqs.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No FAQs found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="FAQ Modal"
            >
                <div className="bg-white p-6 rounded-lg w-full"
                    style={{
                        backgroundColor: theme.colors.cardBg,
                        color: theme.colors.textPrimary
                    }}>
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold">{currentFAQ ? "Edit FAQ" : "Add New FAQ"}</h2>
                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                            <AiOutlineClose size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Common Topic <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            >
                                <option value="">Select a common topic</option>
                                {topics.map((topic) => (
                                    <option
                                        key={topic._id}
                                        value={topic._id}
                                        disabled={!topic.isActive && formData.categoryId !== topic._id}
                                    >
                                        {topic.name} / {topic.name_mn}{!topic.isActive ? " (Inactive)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Question (English)</label>
                            <input
                                type="text"
                                name="question"
                                value={formData.question}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Question (Mongolian)</label>
                            <input
                                type="text"
                                name="question_mn"
                                value={formData.question_mn}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Answer (English)</label>
                            <textarea
                                name="answer"
                                value={formData.answer}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Answer (Mongolian)</label>
                            <textarea
                                name="answer_mn"
                                value={formData.answer_mn}
                                onChange={handleChange}
                                rows={4}
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1">Display Order</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    style={{
                                        backgroundColor: theme.colors.background,
                                        color: theme.colors.textPrimary,
                                        borderColor: theme.colors.border
                                    }}
                                />
                            </div>
                            <div className="w-1/2 flex items-center pt-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <span className="ml-2 text-sm font-medium">Is Active?</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save FAQ"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                isOpen={topicModalIsOpen}
                onRequestClose={closeTopicModal}
                style={customStyles}
                contentLabel="FAQ Topic Modal"
            >
                <div
                    className="bg-white p-6 rounded-lg w-full"
                    style={{ backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary }}
                >
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold">
                            {currentTopic ? "Edit Common Topic" : "Add Common Topic"}
                        </h2>
                        <button type="button" onClick={closeTopicModal} className="text-gray-500 hover:text-gray-700">
                            <AiOutlineClose size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleTopicSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Topic Name (English) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={topicFormData.name}
                                onChange={handleTopicChange}
                                required
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Topic Name (Mongolian) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name_mn"
                                value={topicFormData.name_mn}
                                onChange={handleTopicChange}
                                required
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium mb-1">Display Order</label>
                                <input
                                    type="number"
                                    name="order"
                                    min="0"
                                    value={topicFormData.order}
                                    onChange={handleTopicChange}
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    style={{
                                        backgroundColor: theme.colors.background,
                                        color: theme.colors.textPrimary,
                                        borderColor: theme.colors.border
                                    }}
                                />
                            </div>
                            <div className="w-1/2 flex items-center pt-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={topicFormData.isActive}
                                        onChange={handleTopicChange}
                                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    <span className="ml-2 text-sm font-medium">Is Active?</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button
                                type="button"
                                onClick={closeTopicModal}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={topicSaving}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                            >
                                {topicSaving ? "Saving..." : "Save Topic"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default FAQList;
