import React, { useEffect, useState } from "react";
import contactApi from "../../api/contactApi";
import { toast } from "react-toastify";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const ContactList = () => {
    const [contacts, setContacts] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const limit = 10;
    const { theme } = useTheme();

    useEffect(() => {
        fetchContacts();
    }, [page]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await contactApi.listContacts({ page, limit });
            if (response.data && response.data.data && response.data.data.contacts) {
                setContacts(response.data.data.contacts);
                setTotal(response.data.data.total);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const response = await contactApi.deleteContact({ id });
            if (response.status) {
                toast.success("Message deleted successfully");
                fetchContacts();
            }
        } catch (error) {
            console.error("Error deleting contact:", error);
            toast.error("Failed to delete message");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await contactApi.updateContact({ id, status: newStatus });
            if (response.status) {
                toast.success("Status updated successfully");
                fetchContacts();
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const statusColors = {
        New: "bg-blue-100 text-blue-800",
        Read: "bg-yellow-100 text-yellow-800",
        Replied: "bg-green-100 text-green-800",
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Contact Messages</h3>
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
                                    {["#", "Name", "Email", "Phone", "Topic", "Message", "Status", "Date", "Actions"].map((header) => (
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
                                {contacts.length > 0 ? (
                                    contacts.map((contact, index) => (
                                        <tr key={contact._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textPrimary }}>
                                                {(page - 1) * limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                                {contact.fullName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a href={`mailto:${contact.email}`} className="text-blue-500 hover:text-blue-700">
                                                    {contact.email}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textPrimary }}>
                                                {contact.phone || "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textPrimary }}>
                                                {contact.topic}
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs break-words" style={{ color: theme.colors.textPrimary }}>
                                                {contact.message.length > 50 ? (
                                                    <>
                                                        {contact.message.substring(0, 50)}...
                                                        <button
                                                            onClick={() => setSelectedContact(contact)}
                                                            className="text-blue-500 hover:text-blue-700 ml-1 text-xs font-bold underline"
                                                        >
                                                            Read More
                                                        </button>
                                                    </>
                                                ) : (
                                                    contact.message
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <select
                                                    value={contact.status}
                                                    onChange={(e) => handleStatusUpdate(contact._id, e.target.value)}
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${statusColors[contact.status] || "bg-gray-100 text-gray-800"}`}
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Read">Read</option>
                                                    <option value="Replied">Replied</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>
                                                {new Date(contact.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleDelete(contact._id)}
                                                    className="text-red-500 hover:text-red-700 bg-red-100 px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-4 text-center text-sm" style={{ color: theme.colors.textSecondary }}>
                                            No messages found
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

            {/* Message Modal */}
            {selectedContact && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-lg bg-white p-6 max-w-lg w-full relative shadow-xl"
                        style={{ backgroundColor: theme.colors.cardBg }}
                    >
                        <button
                            onClick={() => setSelectedContact(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                            Message from {selectedContact.fullName}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                            <strong>Topic:</strong> {selectedContact.topic} <br />
                            <strong>Email:</strong> {selectedContact.email} <br />
                            <strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-xs ${statusColors[selectedContact.status]}`}>{selectedContact.status}</span>
                        </p>
                        <div
                            className="mt-4 p-4 rounded max-h-[60vh] overflow-y-auto"
                            style={{ backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}
                        >
                            {selectedContact.message}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactList;
