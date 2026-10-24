import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiCopy,
    FiExternalLink,
    FiCalendar,
    FiMapPin,
    FiStar,
    FiShoppingBag,
    FiLayers,
    FiTrendingUp,
    FiUsers,
    FiAward,
    FiCheck,
    FiPlay,
    FiImage,
    FiAlertCircle,
    FiGlobe,
    FiTag,
    FiShield,
    FiSearch
} from "react-icons/fi";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (date) => {
    if (!date) return "—";
    try {
        return format(new Date(date), "dd MMM yyyy, HH:mm");
    } catch {
        return "—";
    }
};

const fmtDateOnly = (date) => {
    if (!date) return "—";
    try {
        return format(new Date(date), "dd MMM yyyy");
    } catch {
        return "—";
    }
};

const StarRating = ({ rating = 0 }) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
        <div className="inline-flex items-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xs">
                    {i < fullStars ? "★" : (i === fullStars && hasHalf ? "★" : "☆")}
                </span>
            ))}
            <span className="text-[11px] font-semibold text-slate-700 ml-1.5">
                {Number(rating).toFixed(1)}
            </span>
        </div>
    );
};

// ─── Safe Image Components with Graceful Fallbacks ───────────────────────────
const Avatar = ({ src, name, size = "w-10 h-10", className = "" }) => {
    const [failed, setFailed] = useState(false);
    const initials = name
        ? name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
        : "?";

    if (!src || failed) {
        return (
            <div className={`${size} rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 shadow-xs flex-shrink-0 tracking-wide select-none ${className}`}>
                {initials}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name || "User avatar"}
            className={`${size} rounded-xl object-cover ring-1 ring-slate-200 shadow-xs flex-shrink-0 bg-slate-50 ${className}`}
            onError={() => setFailed(true)}
        />
    );
};

const HeroImage = ({ src, title, alt }) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    if (!src || failed) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col items-center justify-center text-slate-300 p-6 text-center select-none">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3 shadow-inner">
                    <FiCalendar className="w-8 h-8 text-teal-400 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-white max-w-sm leading-snug line-clamp-2">{title}</h3>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Event Showcase</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || title}
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setFailed(true)}
        />
    );
};

const ThumbnailImage = ({ src, alt, isActive, onClick }) => {
    const [failed, setFailed] = useState(false);
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition cursor-pointer ${isActive ? "border-[#0f766e] ring-2 ring-[#0f766e]/20" : "border-slate-200 opacity-70 hover:opacity-100"}`}
        >
            {!failed && src ? (
                <img
                    src={src}
                    alt={alt || "Thumbnail"}
                    className="w-full h-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold select-none">
                    🎪
                </div>
            )}
        </button>
    );
};

// ─── Main EventDetail Component ──────────────────────────────────────────────
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
    const [mediaType, setMediaType] = useState("image");
    const [copiedField, setCopiedField] = useState(null);
    const [isTogglingSlider, setIsTogglingSlider] = useState(false);
    const [attendeeSearch, setAttendeeSearch] = useState("");

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Event Details
                const res = await authAxiosClient.get(`/event/details/${eventId}`);
                if (res.data?.status && res.data.data) {
                    const d = res.data.data;
                    setEvent(d.event);
                    setReviews(d.reviews || []);
                    setComments(d.comments || []);
                    setAttendees(d.attendees || { total: 0, recent: [] });
                } else {
                    setError("Failed to fetch event details.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch Full Attendees Roster (non-fatal)
                try {
                    const attRes = await authAxiosClient.get(`/event/attendees/${eventId}?limit=50`);
                    if (attRes.data?.status && attRes.data.data) {
                        setAttendees({
                            total: attRes.data.data.total || 0,
                            recent: attRes.data.data.attendees || [],
                        });
                    }
                } catch (attErr) {
                    console.warn("Event attendees fetch fallback:", attErr);
                }

            } catch (err) {
                setError(err.response?.data?.message || err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.info(`Copied ${fieldName} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleToggleSlider = async () => {
        if (!event) return;
        setIsTogglingSlider(true);
        const newStatus = !event.addToSlider;
        try {
            await authAxiosClient.post("/event/admin/slider-toggle", {
                eventId: event._id,
                addToSlider: newStatus,
            });
            setEvent((prev) => ({ ...prev, addToSlider: newStatus }));
            toast.success(newStatus ? "Event added to home slider" : "Event removed from home slider");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update slider status");
        } finally {
            setIsTogglingSlider(false);
        }
    };

    if (loading) {
        return null;
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl">
                    <FiAlertCircle />
                </div>
                <h3 className="text-base font-semibold text-slate-800">{error || "Event not found."}</h3>
                <button
                    onClick={() => navigate("/events")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition cursor-pointer"
                >
                    <FiArrowLeft className="w-4 h-4" /> Return to Events
                </button>
            </div>
        );
    }

    const images = event.posterImage || [];
    const mediaLinks = event.mediaLinks || [];
    const videos = event.shortTeaserVideo || [];
    const venue = event.venueAddress || {};
    const tickets = event.tickets || [];

    // Capacity & Metric calculations
    const totalSeats = event.totalSeats || event.totalTickets || 0;
    const totalBooked = event.totalBooked || 0;
    const availableSeats = event.leftSeats ?? event.ticketQtyAvailable ?? Math.max(0, totalSeats - totalBooked);
    const bookedPercent = totalSeats > 0 ? Math.min(100, Math.round((totalBooked / totalSeats) * 100)) : 0;
    const grossRevenue = event.totalRevenue || 0;

    // Minimum ticket price
    const ticketPrices = tickets.map((t) => Number(t.price || 0)).filter((p) => !isNaN(p));
    const startingPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : 0;

    // Status styling
    const status = event.status || "Upcoming";
    const statusMap = {
        Live: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500" },
        Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500" },
        Upcoming: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200/60", dot: "bg-teal-500" },
        Past: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
        Cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/60", dot: "bg-rose-500" },
    };
    const currentStatusStyle = statusMap[status] || statusMap.Upcoming;

    const hostFullName = `${event.createdBy?.firstName || ""} ${event.createdBy?.lastName || ""}`.trim() || "Event Host";

    // Filter attendees for table
    const filteredAttendees = attendees.recent.filter((u) => {
        if (!attendeeSearch.trim()) return true;
        const q = attendeeSearch.toLowerCase();
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        return fullName.includes(q) || email.includes(q);
    });

    const tabs = [
        { id: "overview", label: "Overview & Details", icon: FiCalendar },
        { id: "tickets", label: `Tickets (${tickets.length})`, icon: FiTag },
        { id: "attendees", label: `Attendees (${attendees.total || 0})`, icon: FiUsers },
        { id: "reviews", label: `Reviews (${reviews.length})`, icon: FiStar },
        { id: "comments", label: `Discussion (${comments.length})`, icon: FiShoppingBag },
    ];

    return (
        <div className="w-full px-[10px] space-y-6 pb-12">

            {/* ── 1. Modern Minimal Header & Actions Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                {/* Navigation & Context */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate("/events")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer flex-shrink-0"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Events</span>
                    </button>
                    <span className="text-slate-300">/</span>
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-sm font-bold text-slate-900 truncate">{event.eventTitle}</span>
                        {event.eventCategory && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 flex-shrink-0">
                                {event.eventCategory.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Badges & Quick Action */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${currentStatusStyle.dot}`} />
                        {status}
                    </span>

                    {event.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                            ⭐ Featured
                        </span>
                    )}

                    {/* Slider Toggle Button */}
                    {/* <button
                        onClick={handleToggleSlider}
                        disabled={isTogglingSlider}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-2xs ${event.addToSlider
                            ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                        title="Toggle appearance on homepage slider"
                    >
                        <span className={`w-2 h-2 rounded-full ${event.addToSlider ? "bg-teal-600 animate-pulse" : "bg-slate-400"}`} />
                        <span>{event.addToSlider ? "In Slider" : "Add to Slider"}</span>
                    </button> */}

                    <button
                        onClick={() => handleCopy(event._id, "Event ID")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                    >
                        {copiedField === "Event ID" ? (
                            <>
                                <FiCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span className="text-teal-600">Copied</span>
                            </>
                        ) : (
                            <>
                                <FiCopy className="w-3.5 h-3.5" />
                                <span>Copy ID</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── 2. Hero Showcase: Media Gallery & Event Highlights ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Media Showcase (Left 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                    {/* Main Display Box */}
                    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 relative group shadow-inner flex items-center justify-center">
                        {mediaType === "image" ? (
                            <HeroImage
                                src={images[activeImg]}
                                title={event.eventTitle}
                                alt={`Event visual ${activeImg + 1}`}
                            />
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

                        {/* Top Media Switcher overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md p-1 rounded-lg border border-white/10 z-10 shadow-sm">
                            <button
                                onClick={() => setMediaType("image")}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${mediaType === "image" ? "bg-teal-600 text-white shadow-xs" : "text-slate-300 hover:text-white"}`}
                            >
                                <FiImage className="w-3 h-3" />
                                <span>Photos ({images.length})</span>
                            </button>
                            {videos.length > 0 && (
                                <button
                                    onClick={() => setMediaType("video")}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${mediaType === "video" ? "bg-teal-600 text-white shadow-xs" : "text-slate-300 hover:text-white"}`}
                                >
                                    <FiPlay className="w-3 h-3" />
                                    <span>Teaser ({videos.length})</span>
                                </button>
                            )}
                        </div>

                        {/* Floating Format / Price Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                            {event.isOnline && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/80 text-purple-200 backdrop-blur-xs border border-purple-500/30">
                                    🌐 Online
                                </span>
                            )}
                            {event.isFreeEvent && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-200 backdrop-blur-xs border border-emerald-500/30">
                                    🎁 Free Event
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Selector */}
                    {images.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                            {images.map((img, idx) => (
                                <ThumbnailImage
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    isActive={mediaType === "image" && activeImg === idx}
                                    onClick={() => {
                                        setActiveImg(idx);
                                        setMediaType("image");
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Event Quick Highlights Card (Right 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                                {event.eventCategory?.name || "Event Showcase"}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {event.visibility || "PUBLIC"}
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                            {event.eventTitle}
                        </h1>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {event.shortdesc || "Exciting and immersive event experience featuring premier performances, industry talks, and networking."}
                        </p>

                        {/* Highlights Matrix */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Format</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                                    {event.isOnline ? "🌐 Online Stream" : "🏛️ In-Person"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Schedule</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {event.startDate ? fmtDateOnly(event.startDate) : "Upcoming"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Venue</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {event.venueName || "Classroom Campus"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Timezone</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {event.timeZone || "Asia/Ulaanbaatar"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Organizer Mini Card */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                                src={event.createdBy?.profileImage}
                                name={hostFullName}
                                size="w-10 h-10"
                            />
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Organized By</span>
                                <Link
                                    to={event.createdBy?._id ? `/users/${event.createdBy._id}` : "#"}
                                    className="text-xs font-bold text-slate-900 hover:text-teal-700 transition truncate block"
                                >
                                    {hostFullName}
                                </Link>
                            </div>
                        </div>

                        {event.createdBy?.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                                <FiCheckCircle className="w-3 h-3 text-teal-600" />
                                <span>Verified</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 3. Six Polished Metric Tiles ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Total Seats</span>
                        <FiUsers className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{totalSeats}</div>
                    <span className="text-[10px] text-slate-500">Venue capacity</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Tickets Sold</span>
                        <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{totalBooked}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{bookedPercent}% filled</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Available</span>
                        <FiLayers className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-emerald-600">{availableSeats}</div>
                    <span className="text-[10px] text-slate-500">Passes left</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Starting Fee</span>
                        <FiTag className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                        {startingPrice === 0 ? "Free" : `₮${Number(startingPrice).toLocaleString()}`}
                    </div>
                    <span className="text-[10px] text-slate-500">Base pass rate</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Revenue</span>
                        <span className="font-bold text-teal-600 text-sm leading-none flex items-center justify-center">₮</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">₮{Number(grossRevenue || 0).toLocaleString()}</div>
                    <span className="text-[10px] text-teal-700 font-semibold">Gross booked</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Attendees</span>
                        <FiTrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{attendees.total || 0}</div>
                    <span className="text-[10px] text-slate-500">Confirmed bookers</span>
                </div>
            </div>

            {/* ── 4. Main Two-Column Layout: Segmented Tabs (Left) & Sidebar (Right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left 8 Columns: Segmented Tabs & Content */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Segmented Tab Navigation Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${isActive ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"}`}
                                >
                                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* TAB 1: Overview */}
                    {activeTab === "overview" && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                            {/* About */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FiCalendar className="text-teal-600" />
                                    <span>About the Event</span>
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                    {event.longdesc || event.shortdesc || "No comprehensive event description provided."}
                                </p>
                            </div>

                            {/* Guidelines / Notes Banner */}
                            {event.notes && (
                                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiAlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Important Notes & Guidelines</span>
                                    </h4>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        {event.notes}
                                    </p>
                                </div>
                            )}

                            {/* Specifications & Policies Matrix */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                    Event Policies & Entry Guidelines
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dress Code</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {event.dressCode || "Casual / No specific code"}
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Refund Policy</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {event.refundPolicy || "Standard Policy"}
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Age Eligibility</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {event.ageRestriction || "All Ages"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Links */}
                            {mediaLinks.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                                        Official Media & Links
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {mediaLinks.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                            >
                                                <FiExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="truncate max-w-[220px]">{url}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: Tickets */}
                    {activeTab === "tickets" && (
                        <div className="space-y-4">
                            {tickets.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                                    <FiTag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No ticket tiers configured for this event.</p>
                                </div>
                            ) : (
                                tickets.map((t, idx) => {
                                    const ticketTotal = t.totalQty || t.qty || 0;
                                    const ticketSold = t.soldQty || 0;
                                    const ticketAvailable = t.availableQty ?? Math.max(0, ticketTotal - ticketSold);
                                    const percentSold = ticketTotal > 0 ? Math.min(100, Math.round((ticketSold / ticketTotal) * 100)) : 0;
                                    const isSoldOut = ticketAvailable === 0 && ticketTotal > 0;

                                    return (
                                        <div key={t._id || idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">{t.ticketName}</h4>
                                                    {t.ticketShortDesc && (
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                            {t.ticketShortDesc}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {t.price === 0 ? "Free" : `₮${Number(t.price).toLocaleString()}`}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isSoldOut ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                                        {isSoldOut ? "Sold Out" : t.price === 0 ? "Free Pass" : "On Sale"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ticket Seat Stats */}
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Passes</span>
                                                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">{ticketTotal}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sold</span>
                                                    <span className="text-sm font-bold text-teal-700 mt-0.5 block">{ticketSold}</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                                                    <span className="text-sm font-bold text-emerald-600 mt-0.5 block">{ticketAvailable}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                                    <span>Sales Progress</span>
                                                    <span>{percentSold}% Sold</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${percentSold}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {(t.salesStart || t.salesEnd) && (
                                                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100">
                                                    <span>Sales Start: {fmt(t.salesStart)}</span>
                                                    <span>Sales End: {fmt(t.salesEnd)}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* TAB 3: Attendees Roster */}
                    {activeTab === "attendees" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Confirmed Attendees</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Total registered attendees: <strong>{attendees.total}</strong>
                                    </p>
                                </div>

                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search attendee name or email..."
                                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-64 shadow-2xs"
                                        value={attendeeSearch}
                                        onChange={(e) => setAttendeeSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredAttendees.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 text-xs">
                                    <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No confirmed attendees found matching the criteria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                                                <th className="py-3 px-4">Attendee</th>
                                                <th className="py-3 px-4">Contact</th>
                                                <th className="py-3 px-4">Pass Breakdown</th>
                                                <th className="py-3 px-4">Qty</th>
                                                <th className="py-3 px-4">Paid</th>
                                                <th className="py-3 px-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAttendees.map((u) => {
                                                const attName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Guest Attendee";
                                                return (
                                                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    src={u.profileImage}
                                                                    name={attName}
                                                                    size="w-8 h-8"
                                                                />
                                                                <div>
                                                                    <Link
                                                                        to={`/users/${u._id}`}
                                                                        className="font-bold text-slate-900 hover:text-teal-700 transition"
                                                                    >
                                                                        {attName}
                                                                    </Link>
                                                                    <span className="text-[10px] text-slate-400 block font-mono">
                                                                        ID: {u._id?.slice(-6)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-slate-700">{u.email || "—"}</div>
                                                            <div className="text-[11px] text-slate-400">{u.contactNumber || "—"}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {u.tickets && u.tickets.length > 0 ? (
                                                                    u.tickets.map((tk, i) => (
                                                                        <span key={i} className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-semibold border border-teal-200/60">
                                                                            {tk.ticketName} × {tk.qty}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">Standard Pass</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-900">
                                                            {u.totalTicketsBought || 1}
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-900">
                                                            {u.totalAmountPaid ? `₮${Number(u.totalAmountPaid).toLocaleString()}` : "—"}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <Link
                                                                to={`/users/${u._id}`}
                                                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span>Profile</span>
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: Reviews */}
                    {activeTab === "reviews" && (
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                                    <FiStar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No attendee reviews submitted for this event yet.</p>
                                </div>
                            ) : (
                                reviews.map((rev) => {
                                    const revUser = rev.user || rev.userId;
                                    const reviewerName = revUser ? `${revUser.firstName || ""} ${revUser.lastName || ""}`.trim() : "Verified Attendee";
                                    return (
                                        <div key={rev._id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={revUser?.profileImage}
                                                        name={reviewerName}
                                                        size="w-9 h-9"
                                                    />
                                                    <div>
                                                        <h5 className="font-bold text-xs text-slate-900">{reviewerName}</h5>
                                                        <span className="text-[10px] text-slate-400">{fmtDateOnly(rev.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <StarRating rating={rev.rating || 5} />
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                "{rev.review}"
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* TAB 5: Discussion & Comments */}
                    {activeTab === "comments" && (
                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                                    <FiShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No discussion comments on this event yet.</p>
                                </div>
                            ) : (
                                comments.map((com) => {
                                    const cUser = com.user;
                                    const authorName = cUser ? `${cUser.firstName || ""} ${cUser.lastName || ""}`.trim() : "Community Member";
                                    const likeCount = Array.isArray(com.likes) ? com.likes.length : (com.likes || 0);

                                    return (
                                        <div key={com._id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        src={cUser?.profileImage}
                                                        name={authorName}
                                                        size="w-8 h-8"
                                                    />
                                                    <div>
                                                        <span className="font-bold text-xs text-slate-900">{authorName}</span>
                                                        <span className="text-[10px] text-slate-400 ml-2">{fmt(com.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    ❤️ {likeCount}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 pl-10 leading-relaxed">
                                                {com.content || com.comment}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                </div>

                {/* Right 4 Columns: Sidebar Cards */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Timeline & Schedule Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline & Schedule</h3>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">📅</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Start Date</span>
                                    <span className="font-semibold text-slate-800 text-xs">{fmt(event.startDate)}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">🏁</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">End Date</span>
                                    <span className="font-semibold text-slate-800 text-xs">{fmt(event.endDate)}</span>
                                </div>
                            </div>
                            {event.duration && (
                                <div className="flex items-start gap-3">
                                    <span className="text-base mt-0.5">⏱</span>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Duration</span>
                                        <span className="font-semibold text-slate-800 text-xs">{event.duration}</span>
                                    </div>
                                </div>
                            )}
                            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                Daily Hours: {event.startTime || "10:00 AM"} – {event.endTime || "08:00 PM"} ({event.timeZone || "UTC"})
                            </div>
                        </div>
                    </div>

                    {/* Venue / Campus Location Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Event Venue</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {event.visibility || "PUBLIC"}
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-2.5">
                                <FiMapPin className="text-teal-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-xs text-slate-900">{event.venueName || "Venue Name"}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                        {[venue.address, venue.city, venue.state, venue.country].filter(Boolean).join(", ") || "Location details on admission"}
                                    </p>
                                </div>
                            </div>

                            {venue.coordinates && venue.coordinates.length === 2 && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 transition rounded-xl text-xs font-semibold mt-2 border border-teal-200/60"
                                >
                                    <FiGlobe className="w-3.5 h-3.5 text-teal-600" />
                                    <span>View on Google Maps</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Seat Capacity Tracker Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seat Capacity Tracker</h3>
                            <span className="text-xs font-bold text-teal-700">{bookedPercent}%</span>
                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${bookedPercent}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled</span>
                                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{totalBooked}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                                <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{availableSeats}</span>
                            </div>
                        </div>

                        {availableSeats <= 5 && availableSeats > 0 && (
                            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Almost sold out! Only {availableSeats} seats left.</span>
                            </div>
                        )}
                    </div>

                    {/* Organizer Profile Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Organizer Profile</h3>
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={event.createdBy?.profileImage}
                                name={hostFullName}
                                size="w-12 h-12"
                            />
                            <div className="min-w-0">
                                <Link
                                    to={event.createdBy?._id ? `/users/${event.createdBy._id}` : "#"}
                                    className="font-bold text-sm text-slate-900 hover:text-teal-700 transition truncate block"
                                >
                                    {hostFullName}
                                </Link>
                                <span className="text-xs text-teal-700 font-medium block">
                                    {event.createdBy?.isVerified ? "Verified Event Organizer" : "Event Host"}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* ── 5. Meta Footer ── */}
            <div className="text-[11px] text-slate-400 text-right pt-4 border-t border-slate-200">
                Event ID: <span className="font-mono text-slate-600">{event._id}</span> &nbsp;·&nbsp;
                Created: {fmt(event.createdAt)} &nbsp;·&nbsp;
                Last Updated: {fmt(event.updatedAt)}
            </div>

        </div>
    );
};

export default EventDetail;
