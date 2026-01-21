import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlinePlus, AiOutlineEdit, AiOutlineDelete, AiOutlineClose } from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";
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
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentFAQ, setCurrentFAQ] = useState(null); // For editing
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        order: 0,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/api/v1/faq/list`, {
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

    const openModal = (faq = null) => {
        if (faq) {
            setCurrentFAQ(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                order: faq.order,
                isActive: faq.isActive,
            });
        } else {
            setCurrentFAQ(null);
            setFormData({
                question: "",
                answer: "",
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
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
                await axios.put(`${API_URL}/faq/update/${currentFAQ._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("FAQ updated successfully");
            } else {
                // Create
                await axios.post(`${API_URL}/faq/create`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("FAQ created successfully");
            }
            fetchFAQs();
            closeModal();
        } catch (error) {
            console.error("Error saving FAQ:", error);
            toast.error(error.response?.data?.message || "Failed to save FAQ");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/faq/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("FAQ deleted successfully");
            fetchFAQs();
        } catch (error) {
            console.error("Error deleting FAQ:", error);
            toast.error(error.response?.data?.message || "Failed to delete FAQ");
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
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <AiOutlinePlus className="mr-2" />
                    Add FAQ
                </button>
            </div>

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
                                {faq.isActive ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                                )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1" style={{ color: theme.colors.textPrimary }}>{faq.question}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => openModal(faq)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
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
                            <label className="block text-sm font-medium mb-1">Question</label>
                            <input
                                type="text"
                                name="question"
                                value={formData.question}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.textPrimary,
                                    borderColor: theme.colors.border
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Answer</label>
                            <textarea
                                name="answer"
                                value={formData.answer}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save FAQ"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default FAQList;
