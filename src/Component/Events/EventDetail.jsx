import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (date) => {
    if (!date) return "N/A";
    try {
        return format(new Date(date), "dd MMM yyyy, hh:mm a");
    } catch {
        return "N/A";
    }
};

const StarRating = ({ rating }) => {
    const stars = Math.round(rating || 0);
    return (
        <span className="text-yellow-400 text-sm">
            {"★".repeat(stars)}{"☆".repeat(5 - stars)}
            <span className="text-gray-500 ml-1 text-xs">({rating?.toFixed(1) ?? "0.0"})</span>
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        Live: "bg-green-100 text-green-700 border border-green-300",
        Upcoming: "bg-blue-100 text-blue-700 border border-blue-300",
        Past: "bg-gray-100 text-gray-600 border border-gray-300",
        Ongoing: "bg-orange-100 text-orange-700 border border-orange-300",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
};

const Avatar = ({ src, name, size = "w-10 h-10" }) => {
    const initials = name
        ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";
    return src ? (
        <img src={src} alt={name} className={`${size} rounded-full object-cover border-2 border-white shadow`} />
    ) : (
        <div className={`${size} rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-sm border-2 border-white shadow`}>
            {initials}
        </div>
    );
};

const InfoCard = ({ icon, label, value, accent }) => (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm ${accent || ""}`}>
        <span className="text-2xl mt-0.5">{icon}</span>
        <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value ?? "N/A"}</p>
        </div>
    </div>
);

// ─── main component ──────────────────────────────────────────────────────────
const EventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [event, setEvent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [comments, setComments] = useState([]);
    const [attendees, setAttendees] = useState({ total: 0, recent: [] });
    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authAxiosClient.get(`/event/details/${eventId}`);
                if (res.data?.status) {
                    const d = res.data.data;
                    setEvent(d.event);
                    setReviews(d.reviews || []);
                    setComments(d.comments || []);
                    setAttendees(d.attendees || { total: 0, recent: [] });
                } else {
                    setError("Failed to fetch event details.");
                }
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [eventId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading event details…</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-semibold">{error || "Event not found."}</p>
                <button onClick={() => navigate("/events")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    ← Back to Events
                </button>
            </div>
        );
    }

    const images = event.posterImage || [];
    const venue = event.venueAddress || {};

    const tabs = [
        { id: "overview", label: "📋 Overview" },
        // { id: "reviews", label: `⭐ Reviews (${reviews.length})` },
        // { id: "comments", label: `💬 Comments (${comments.length})` },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b sticky top-0 z-20 px-6 py-3 flex items-center gap-4 shadow-sm">
                <button
                    onClick={() => navigate("/events")}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                    ← Back to Events
                </button>
                <div className="w-px h-5 bg-gray-300" />
                <h1 className="text-lg font-bold text-gray-800 truncate flex-1">{event.eventTitle}</h1>
                <div className="flex items-center gap-2">
                    {event.isFeatured && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-xs font-semibold rounded-full">
                            ⭐ Featured
                        </span>
                    )}
                    <StatusBadge status={event.status} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* ── Hero Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Poster */}
                    <div className="lg:col-span-2 space-y-2">
                        {images.length > 0 ? (
                            <>
                                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border bg-gray-100">
                                    <img
                                        src={images[activeImg]}
                                        alt="poster"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {images.map((img, i) => (
                                            <button key={i} onClick={() => setActiveImg(i)}>
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className={`w-16 h-10 object-cover rounded-lg border-2 transition ${i === activeImg ? "border-indigo-500" : "border-transparent"}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full aspect-video rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">🎪</div>
                        )}
                    </div>

                    {/* Short Info */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Organizer */}
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={event.createdBy?.profileImage}
                                name={`${event.createdBy?.firstName || ""} ${event.createdBy?.lastName || ""}`}
                                size="w-11 h-11"
                            />
                            <div>
                                <p className="text-xs text-gray-500">Organizer</p>
                                <p className="font-semibold text-gray-800">
                                    {event.createdBy?.firstName} {event.createdBy?.lastName}
                                    {event.createdBy?.isVerified && (
                                        <span className="ml-1 text-blue-500 text-xs">✔ Verified</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Short description */}
                        {event.shortdesc && (
                            <p className="text-gray-600 text-sm leading-relaxed">{event.shortdesc}</p>
                        )}

                        {/* Tags */}
                        {event.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {event.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Category */}
                        {event.eventCategory && (
                            <div className="flex items-center gap-2">
                                {event.eventCategory.image && (
                                    <img src={event.eventCategory.image} alt="" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {event.eventCategory.name}
                                </span>
                            </div>
                        )}

                        {/* Attendees summary */}
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex -space-x-2">
                                {attendees.recent.slice(0, 5).map((u) => (
                                    <Avatar
                                        key={u._id}
                                        src={u.profileImage}
                                        name={`${u.firstName} ${u.lastName}`}
                                        size="w-8 h-8"
                                    />
                                ))}
                            </div>
                            {attendees.total > 0 && (
                                <span className="text-sm text-gray-600 font-medium">
                                    {attendees.total.toLocaleString()} attendee{attendees.total !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Info Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <InfoCard icon="📅" label="Start Date" value={fmt(event.startDate)} />
                    <InfoCard icon="🏁" label="End Date" value={fmt(event.endDate)} />
                    <InfoCard icon="⏱" label="Duration" value={event.duration} />
                    <InfoCard
                        icon="🎟"
                        label="Ticket Price"
                        value={
                            event.isFree
                                ? "Free"
                                : event.ticketPrice != null
                                    ? `₹${event.ticketPrice}`
                                    : "N/A"
                        }
                    />
                    {/* <InfoCard icon="🪑" label="Total Seats" value={event.totalSeats?.toLocaleString()} />
                    <InfoCard icon="✅" label="Available Seats" value={event.leftSeats?.toLocaleString()} />
                    <InfoCard icon="👥" label="Booked Seats" value={event.acquiredSeats?.toLocaleString()} />
                    <InfoCard icon="👁" label="Total Views" value={event.totalViews?.toLocaleString()} /> */}
                    <InfoCard icon="📍" label="Venue" value={event.venueName} />
                    <InfoCard icon="🏙" label="City / Country" value={[venue.city, venue.country].filter(Boolean).join(", ")} />
                    <InfoCard icon="📧" label="Contact Email" value={event.contactEmail} />
                    <InfoCard icon="📞" label="Contact Phone" value={event.contactPhone} />
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    {/* Tab headers */}
                    <div className="flex border-b bg-gray-50">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-6 py-3 text-sm font-semibold transition ${activeTab === t.id
                                    ? "bg-white border-b-2 border-indigo-500 text-indigo-600"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Overview Tab ── */}
                    {activeTab === "overview" && (
                        <div className="p-6 space-y-6">
                            {/* Full description */}
                            {event.description && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                </div>
                            )}

                            {/* Ticket Tiers */}
                            {event.ticketTiers?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-3">Ticket Tiers</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    {["Tier", "Price", "Qty", "Available", "Description"].map((h) => (
                                                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {event.ticketTiers.map((tier, i) => (
                                                    <tr key={i} className="border-t hover:bg-gray-50">
                                                        <td className="px-4 py-2 font-medium">{tier.name}</td>
                                                        <td className="px-4 py-2">₹{tier.price}</td>
                                                        <td className="px-4 py-2">{tier.quantity}</td>
                                                        <td className="px-4 py-2">{tier.available ?? "N/A"}</td>
                                                        <td className="px-4 py-2 text-gray-500">{tier.description || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Venue Full Address */}
                            {venue.address && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-1">Full Address</h3>
                                    <p className="text-sm text-gray-600">{venue.address}, {venue.city}, {venue.country}</p>
                                </div>
                            )}

                            {/* Social / External Links */}
                            {(event.websiteLink || event.facebookLink || event.instagramLink || event.twitterLink) && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Links</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {event.websiteLink && <a href={event.websiteLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">🌐 Website</a>}
                                        {event.facebookLink && <a href={event.facebookLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">📘 Facebook</a>}
                                        {event.instagramLink && <a href={event.instagramLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">📸 Instagram</a>}
                                        {event.twitterLink && <a href={event.twitterLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">🐦 Twitter</a>}
                                    </div>
                                </div>
                            )}

                            {/* Media Links */}
                            {event.mediaLinks?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Media</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {event.mediaLinks.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline truncate">
                                                🖼 Media {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Promo Code Info */}
                            {event.promoCode && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-700 mb-1">Promo Code</h3>
                                    <p className="text-sm text-green-800 font-mono">{event.promoCode}</p>
                                    {event.promoDiscount && (
                                        <p className="text-xs text-green-700 mt-1">Discount: {event.promoDiscount}%</p>
                                    )}
                                </div>
                            )}

                            {/* Other Flags */}
                            <div className="flex flex-wrap gap-2">
                                {event.isDraft && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full border border-yellow-300">Draft</span>}
                                {event.isOnline && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-300">Online Event</span>}
                                {event.isFree && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-300">Free Event</span>}
                                {event.fetcherEvent && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-300">Featured Promoted</span>}
                            </div>
                        </div>
                    )}

                    {/* ── Reviews Tab ── */}
                    {activeTab === "reviews" && (
                        <div className="p-6">
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-4xl mb-2">⭐</p>
                                    <p>No reviews yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((r) => (
                                        <div key={r._id} className="flex gap-4 p-4 rounded-xl border bg-gray-50 hover:bg-white transition">
                                            <Avatar
                                                src={r.user?.profileImage}
                                                name={`${r.user?.firstName || ""} ${r.user?.lastName || ""}`}
                                                size="w-10 h-10"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between flex-wrap gap-1">
                                                    <p className="font-semibold text-sm text-gray-800">
                                                        {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Anonymous"}
                                                        {r.user?.isVerified && <span className="ml-1 text-blue-500 text-xs">✔</span>}
                                                    </p>
                                                    <span className="text-xs text-gray-400">{fmt(r.createdAt)}</span>
                                                </div>
                                                <StarRating rating={r.rating} />
                                                {r.review && <p className="text-sm text-gray-600 mt-1">{r.review}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Comments Tab ── */}
                    {activeTab === "comments" && (
                        <div className="p-6">
                            {comments.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-4xl mb-2">💬</p>
                                    <p>No comments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((c) => (
                                        <div key={c._id} className="flex gap-4 p-4 rounded-xl border bg-gray-50 hover:bg-white transition">
                                            <Avatar
                                                src={c.user?.profileImage}
                                                name={`${c.user?.firstName || ""} ${c.user?.lastName || ""}`}
                                                size="w-10 h-10"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between flex-wrap gap-1">
                                                    <p className="font-semibold text-sm text-gray-800">
                                                        {c.user ? `${c.user.firstName} ${c.user.lastName}` : "Anonymous"}
                                                        {c.user?.isVerified && <span className="ml-1 text-blue-500 text-xs">✔</span>}
                                                    </p>
                                                    <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{c.comment}</p>
                                                {c.likes > 0 && (
                                                    <p className="text-xs text-gray-400 mt-1">👍 {c.likes} likes</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Recent Attendees Card ── */}
                {attendees.total > 0 && (
                    <div className="bg-white rounded-2xl border shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4">
                            👥 Recent Attendees
                            <span className="ml-2 text-sm font-normal text-gray-500">({attendees.total.toLocaleString()} total)</span>
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {attendees.recent.map((u) => (
                                <div key={u._id} className="flex flex-col items-center gap-1">
                                    <Avatar
                                        src={u.profileImage}
                                        name={`${u.firstName} ${u.lastName}`}
                                        size="w-12 h-12"
                                    />
                                    <p className="text-xs text-gray-600 text-center max-w-[64px] truncate">
                                        {u.firstName}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Meta Footer ── */}
                <div className="text-xs text-gray-400 text-right">
                    Event ID: {event._id} &nbsp;·&nbsp; Created: {fmt(event.createdAt)}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
