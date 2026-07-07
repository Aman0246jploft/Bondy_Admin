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

const fmtDateOnly = (date) => {
    if (!date) return "N/A";
    try {
        return format(new Date(date), "dd MMM yyyy");
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
        Upcoming: "bg-teal-100 text-teal-700 border border-teal-300",
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
        <div className={`${size} rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm border-2 border-white shadow`}>
            {initials}
        </div>
    );
};

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
    const [similarEvents, setSimilarEvents] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);
    const [mediaType, setMediaType] = useState("image"); // "image" or "video"

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
                    setSimilarEvents(d.similarEvents || []);
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
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading event details…</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-semibold">{error || "Event not found."}</p>
                <button onClick={() => navigate("/events")} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    ← Back to Events
                </button>
            </div>
        );
    }

    const images = event.posterImage || [];
    const mediaLinks = event.mediaLinks || [];
    const videos = event.shortTeaserVideo || [];
    const venue = event.venueAddress || {};

    const tabs = [
        { id: "overview", label: `📋 Overview` },
        { id: "tickets", label: `🎟 Tickets (${event.tickets?.length || 0})` },
        { id: "reviews", label: `⭐ Reviews (${reviews.length})` },
        { id: "comments", label: `💬 Comments (${comments.length})` },
    ];

    // Percentage of seats booked
    const bookedPercent = event.totalSeats > 0 ? Math.round((event.totalBooked / event.totalSeats) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/events")}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-800 font-medium text-sm transition"
                    >
                        ← Back to Events
                    </button>
                    <div className="w-px h-5 bg-slate-300" />
                    {/* <h1 className="text-md font-bold text-slate-800 truncate max-w-lg">{event.eventTitle}</h1> */}
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={event.status} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* ── Main Layout: 2 Columns ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left 2 Columns: Media & Description & Tabs */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Media Display Card */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="font-bold text-sm text-slate-700">Event Media Gallery</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMediaType("image")}
                                        className={`px-3 py-1 text-xs rounded-lg font-medium transition ${mediaType === "image" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                    >
                                        Images ({images.length})
                                    </button>
                                    {videos.length > 0 && (
                                        <button
                                            onClick={() => setMediaType("video")}
                                            className={`px-3 py-1 text-xs rounded-lg font-medium transition ${mediaType === "video" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                        >
                                            Teaser Video
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Media Box */}
                            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative group">
                                {mediaType === "image" ? (
                                    images.length > 0 ? (
                                        <img
                                            src={images[activeImg]}
                                            alt="Event visual"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-slate-400 text-6xl">🎪</div>
                                    )
                                ) : (
                                    videos.length > 0 && (
                                        <video
                                            src={videos[0]}
                                            controls
                                            className="w-full h-full object-contain"
                                            poster={images[0]}
                                        />
                                    )
                                )}
                            </div>

                            {/* Thumbnail selector */}
                            {mediaType === "image" && images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((img, i) => (
                                        <button key={i} onClick={() => setActiveImg(i)} className="flex-shrink-0">
                                            <img
                                                src={img}
                                                alt=""
                                                className={`w-20 h-14 object-cover rounded-lg border-2 transition ${i === activeImg ? "border-teal-500 scale-95 shadow" : "border-slate-200 opacity-70 hover:opacity-100"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Event Quick Summary */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {event.eventCategory && (
                                        <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                                            {event.eventCategory.image && (
                                                <img src={event.eventCategory.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                                            )}
                                            <span className="text-xs font-semibold text-teal-700 capitalize">
                                                {event.eventCategory.name}
                                            </span>
                                        </div>
                                    )}
                                    {event.ageRestriction && (
                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold rounded">
                                            {event.ageRestriction}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {event.isOnline && (
                                        <span className="bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded-full font-medium">🌐 Online</span>
                                    )}
                                    {event.isFree && (
                                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium">🎁 Free</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{event.eventTitle}</h2>
                            <p className="text-slate-600 text-sm leading-relaxed">{event.shortdesc}</p>
                        </div>

                        {/* Interactive Tabs */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex border-b bg-slate-50">
                                {tabs.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        className={`flex-1 px-4 py-3 text-center text-sm font-semibold transition ${activeTab === t.id
                                            ? "bg-white border-b-2 border-teal-600 text-teal-600"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── Tab Contents ── */}
                            <div className="p-6">

                                {/* 1. Overview Tab */}
                                {activeTab === "overview" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-md border-b pb-2 mb-3">About the Event</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{event.longdesc}</p>
                                        </div>

                                        {event.notes && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                <h4 className="font-semibold text-amber-800 text-xs uppercase tracking-wider mb-1">Important Notes</h4>
                                                <p className="text-slate-700 text-xs leading-relaxed">{event.notes}</p>
                                            </div>
                                        )}

                                        {/* Basic details grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase">Dress Code</h4>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{event.dressCode || "No specific dress code"}</p>
                                            </div>
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase">Refund Policy</h4>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{event.refundPolicy || "No Refund"}</p>
                                            </div>
                                            {/* <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase">Add Ons</h4>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{event.addOns || "None"}</p>
                                            </div> */}
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase">Promotion Package</h4>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">
                                                    {event.activePromotionPackage ? "Active" : "None"}
                                                    {event.featureEventFee > 0 && ` (Fee: ₮${event.featureEventFee})`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Links Section */}
                                        {event.mediaLinks?.length > 0 && (
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm mb-2">Media & External Links</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {event.mediaLinks.map((url, i) => (
                                                        <a
                                                            key={i}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg transition truncate max-w-[200px]"
                                                        >
                                                            🔗 External Link #{i + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 2. Tickets Tab */}
                                {activeTab === "tickets" && (
                                    <div className="space-y-4">
                                        {(!event.tickets || event.tickets.length === 0) ? (
                                            <p className="text-slate-500 text-center py-6">No ticket tiers set up for this event.</p>
                                        ) : (
                                            event.tickets.map((ticket) => (
                                                <div key={ticket._id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-300 transition duration-200 bg-white">
                                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-md">{ticket.ticketName}</h4>
                                                            <p className="text-xs text-slate-500 mt-1">{ticket.ticketShortDesc || "No description provided."}</p>
                                                        </div>
                                                        <span className="text-lg font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-lg">
                                                            {ticket.price === 0 ? "Free" : `₮${ticket.price}`}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                                                        <div>
                                                            <span className="text-slate-400 block">Total Quantity</span>
                                                            <span className="font-bold text-slate-700 text-sm">{ticket.qty}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Available</span>
                                                            <span className="font-bold text-emerald-600 text-sm">{ticket.availableQty ?? ticket.qty}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Sold</span>
                                                            <span className="font-bold text-teal-600 text-sm">{ticket.soldQty || 0}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Status</span>
                                                            <span className={`inline-block px-2 py-0.5 rounded font-bold mt-0.5 ${ticket.availableQty === 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                                                {ticket.availableQty === 0 ? "Sold Out" : "On Sale"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 bg-slate-50 p-2.5 rounded-lg flex flex-col sm:flex-row justify-between text-[11px] text-slate-500 gap-1">
                                                        <span>📅 Sales Start: {fmt(ticket.salesStart)}</span>
                                                        <span>📅 Sales End: {fmt(ticket.salesEnd)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* 3. Reviews Tab */}
                                {activeTab === "reviews" && (
                                    <div className="space-y-4">
                                        {reviews.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <p className="text-3xl mb-1">⭐</p>
                                                <p className="text-sm">No reviews yet</p>
                                            </div>
                                        ) : (
                                            reviews.map((r) => (
                                                <div key={r._id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                                                    <Avatar
                                                        src={r.user?.profileImage}
                                                        name={`${r.user?.firstName || ""} ${r.user?.lastName || ""}`}
                                                        size="w-10 h-10"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                                            <p className="font-semibold text-sm text-slate-800">
                                                                {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Anonymous"}
                                                                {r.user?.isVerified && <span className="ml-1 text-teal-500 text-[10px]">✔</span>}
                                                            </p>
                                                            <span className="text-[11px] text-slate-400">{fmt(r.createdAt)}</span>
                                                        </div>
                                                        <StarRating rating={r.rating} />
                                                        {r.review && <p className="text-sm text-slate-600 mt-1.5">{r.review}</p>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* 4. Comments Tab */}
                                {activeTab === "comments" && (
                                    <div className="space-y-4">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <p className="text-3xl mb-1">💬</p>
                                                <p className="text-sm">No comments yet</p>
                                            </div>
                                        ) : (
                                            comments.map((c) => (
                                                <div key={c._id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                                                    <Avatar
                                                        src={c.user?.profileImage}
                                                        name={`${c.user?.firstName || ""} ${c.user?.lastName || ""}`}
                                                        size="w-10 h-10"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between flex-wrap gap-1">
                                                            <p className="font-semibold text-sm text-slate-800">
                                                                {c.user ? `${c.user.firstName} ${c.user.lastName}` : "Anonymous"}
                                                                {c.user?.isVerified && <span className="ml-1 text-teal-500 text-[10px]">✔</span>}
                                                            </p>
                                                            <span className="text-[11px] text-slate-400">{fmt(c.createdAt)}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1">{c.comment}</p>
                                                        {c.likes > 0 && (
                                                            <p className="text-xs text-slate-400 mt-1">👍 {c.likes} likes</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Attendees Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-bold text-slate-800 text-sm">
                                    👥 Attendees ({attendees.total.toLocaleString()} total)
                                </h3>
                            </div>
                            {attendees.recent.length === 0 ? (
                                <p className="text-slate-400 text-xs py-2">No attendees registered yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {attendees.recent.map((u) => (
                                        <div key={u._id} className="flex flex-col items-center gap-1">
                                            <Avatar
                                                src={u.profileImage}
                                                name={`${u.firstName} ${u.lastName}`}
                                                size="w-11 h-11"
                                            />
                                            <p className="text-[10px] text-slate-600 text-center max-w-[60px] truncate">
                                                {u.firstName}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right 1 Column: Key Information & Sidebar Details */}
                    <div className="space-y-6">

                        {/* Organizer Profile Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Created By</h3>
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={event.createdBy?.profileImage}
                                    name={`${event.createdBy?.firstName || ""} ${event.createdBy?.lastName || ""}`}
                                    size="w-12 h-12"
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">
                                        {event.createdBy?.firstName} {event.createdBy?.lastName}
                                    </p>
                                    <p className="text-xs text-teal-600 font-medium">
                                        {event.createdBy?.isVerified ? "★ Verified Host" : "Host"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Event Timing Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Date & Time</h3>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">📅</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Start Date & Time</span>
                                        <span className="font-semibold text-slate-700 text-sm">{fmt(event.startDate)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">🏁</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">End Date & Time</span>
                                        <span className="font-semibold text-slate-700 text-sm">{fmt(event.endDate)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">⏱</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Event Duration</span>
                                        <span className="font-semibold text-slate-700 text-sm">
                                            {event.duration}
                                            {/* {event.durationTranslation ? `(${event.durationTranslation})` : ""} */}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">🕒</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Time Zone / Hours</span>
                                        <span className="font-semibold text-slate-700 text-xs">
                                            {event.startTime} - {event.endTime} ({event.timeZone})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Venue / Location Details Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Location</h3>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                                    {event.visibility}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="text-lg mt-0.5">📍</span>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{event.venueName}</h4>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            {venue.address && `${venue.address}, `}
                                            {venue.city && `${venue.city}, `}
                                            {venue.state && `${venue.state}, `}
                                            {venue.zipcode && `${venue.zipcode}, `}
                                            {venue.country}
                                        </p>
                                    </div>
                                </div>

                                {venue.coordinates && venue.coordinates.length === 2 && (
                                    <div className="pt-2">
                                        <span className="text-[10px] text-slate-400 block mb-1">GPS Coordinates</span>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 transition rounded-lg text-xs font-semibold"
                                        >
                                            🗺 View on Google Maps
                                            <span className="text-[10px] font-normal opacity-85">({venue.coordinates[1].toFixed(4)}, {venue.coordinates[0].toFixed(4)})</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ticket Stats / Seat Tracker Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seat Tracker</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-slate-500 font-medium">Capacity Booked</span>
                                    <span className="text-sm font-bold text-slate-800">{event.totalBooked} / {event.totalSeats} seats</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-teal-600 h-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, bookedPercent)}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="text-slate-400 block text-[10px]">Left Seats</span>
                                        <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{event.leftSeats}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="text-slate-400 block text-[10px]">Ticket Available</span>
                                        <span className="font-bold text-teal-600 text-sm mt-0.5 block">{event.ticketQtyAvailable}</span>
                                    </div>
                                </div>

                                {event.isFewSeatsAvailable && (
                                    <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg p-2.5 text-center text-xs font-semibold animate-pulse">
                                        ⚠️ Selling out fast! Only a few seats left.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Similar Events Section ── */}
                {similarEvents.length > 0 && (
                    <div className="pt-8 border-t border-slate-200 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Similar Events You Might Like</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {similarEvents.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => navigate(`/events/${item._id}`)}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition duration-200 cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Image */}
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                            {item.posterImage && item.posterImage.length > 0 ? (
                                                <img
                                                    src={item.posterImage[0]}
                                                    alt={item.eventTitle}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl">🎪</div>
                                            )}
                                            <div className="absolute top-3 right-3">
                                                <StatusBadge status={item.status} />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5 space-y-3">
                                            {item.eventCategory && (
                                                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">
                                                    {item.eventCategory.name}
                                                </span>
                                            )}
                                            <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-teal-600 transition truncate">
                                                {item.eventTitle}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {item.shortdesc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-5 py-4 border-t border-slate-50 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                                        <span>📍 {item.venueAddress?.city || "Unknown"}, {item.venueAddress?.country || ""}</span>
                                        <span className="font-semibold text-teal-600">
                                            {item.duration || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Meta Footer ── */}
                <div className="text-xs text-slate-400 text-right pt-6 border-t border-slate-200">
                    Event ID: {event._id} &nbsp;·&nbsp; Created: {fmt(event.createdAt)} &nbsp;·&nbsp; Last Updated: {fmt(event.updatedAt)}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
