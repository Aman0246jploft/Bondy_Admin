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
    FiBookOpen,
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

const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    try {
        const [h, m] = timeStr.split(":");
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
    } catch {
        return timeStr;
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
                    <FiBookOpen className="w-8 h-8 text-teal-400 stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-bold text-white max-w-sm leading-snug line-clamp-2">{title}</h3>
                <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Course Showcase</span>
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
                    📚
                </div>
            )}
        </button>
    );
};

// ─── Main CourseDetail Component ─────────────────────────────────────────────
const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [course, setCourse] = useState(null);
    const [attendees, setAttendees] = useState({ list: [], total: 0 });
    const [reviews, setReviews] = useState([]);
    const [comments, setComments] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);
    const [mediaType, setMediaType] = useState("image");
    const [copiedField, setCopiedField] = useState(null);
    const [studentSearch, setStudentSearch] = useState("");

    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Course Details
                const res = await authAxiosClient.get(`/course/details/${courseId}`);
                if (res.data?.status && res.data.data) {
                    setCourse(res.data.data);
                } else {
                    setError("Failed to fetch course details.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch Attendees / Students (non-fatal)
                try {
                    const attRes = await authAxiosClient.get(`/course/attendees/${courseId}?limit=50`);
                    if (attRes.data?.status && attRes.data.data) {
                        setAttendees({
                            list: attRes.data.data.attendees || [],
                            total: attRes.data.data.total || 0,
                        });
                    }
                } catch (err) {
                    console.warn("Attendees fetch error:", err);
                }

                // 3. Fetch Reviews (non-fatal)
                try {
                    const revRes = await authAxiosClient.get(`/review/list?entityId=${courseId}&entityModel=Course`);
                    if (revRes.data?.status && revRes.data.data) {
                        setReviews(revRes.data.data.reviews || []);
                    }
                } catch (err) {
                    console.warn("Reviews fetch error:", err);
                }

                // 4. Fetch Comments (non-fatal)
                try {
                    const comRes = await authAxiosClient.get(`/comment/list?entityId=${courseId}&entityModel=Course`);
                    if (comRes.data?.status && comRes.data.data) {
                        setComments(comRes.data.data.comments || []);
                    }
                } catch (err) {
                    console.warn("Comments fetch error:", err);
                }

                // 5. Fetch Analytics (non-fatal)
                try {
                    const anaRes = await authAxiosClient.get(`/course/analytics/${courseId}`);
                    if (anaRes.data?.status && anaRes.data.data) {
                        setAnalytics(anaRes.data.data);
                    }
                } catch (err) {
                    console.warn("Analytics fetch error:", err);
                }

            } catch (err) {
                setError(err.response?.data?.message || err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.info(`Copied ${fieldName} to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (loading) {
        return null;
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl">
                    <FiAlertCircle />
                </div>
                <h3 className="text-base font-semibold text-slate-800">{error || "Course not found."}</h3>
                <button
                    onClick={() => navigate("/courses")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition cursor-pointer"
                >
                    <FiArrowLeft className="w-4 h-4" /> Return to Courses
                </button>
            </div>
        );
    }

    const images = course.posterImage || [];
    const mediaLinks = course.mediaLinks || [];
    const videos = course.shortTeaserVideo || [];
    const venue = course.venueAddress || {};
    const batches = course.batches || [];

    // Capacity & Metric calculations
    const totalSeats = course.totalSeats || 0;
    const enrolledSeats = course.acquiredSeats || 0;
    const availableSeats = course.leftSeats ?? Math.max(0, totalSeats - enrolledSeats);
    const bookedPercent = totalSeats > 0 ? Math.min(100, Math.round((enrolledSeats / totalSeats) * 100)) : 0;
    const courseFee = course.price || 0;
    const grossRevenue = analytics?.grossRevenue ?? (enrolledSeats * courseFee);

    // Status styling
    const status = course.status || "Upcoming";
    const statusMap = {
        Live: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500" },
        Active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-500" },
        Upcoming: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200/60", dot: "bg-teal-500" },
        Past: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
        Cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/60", dot: "bg-rose-500" },
    };
    const currentStatusStyle = statusMap[status] || statusMap.Upcoming;

    const hostFullName = `${course.createdBy?.firstName || ""} ${course.createdBy?.lastName || ""}`.trim() || "Course Instructor";

    // Filtered students for table
    const filteredStudents = attendees.list.filter((s) => {
        if (!studentSearch.trim()) return true;
        const q = studentSearch.toLowerCase();
        const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
        const email = (s.email || "").toLowerCase();
        return fullName.includes(q) || email.includes(q);
    });

    const tabs = [
        { id: "overview", label: "Overview & Syllabus", icon: FiCalendar },
        {
            id: "schedule",
            label: course.weeklySchedule ? "Weekly Schedule" : `Batches (${batches.length})`,
            icon: FiLayers
        },
        { id: "passes", label: "Pass Options", icon: FiTag },
        { id: "students", label: `Students (${attendees.total || 0})`, icon: FiUsers },
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
                        onClick={() => navigate("/courses")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer flex-shrink-0"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Courses</span>
                    </button>
                    <span className="text-slate-300">/</span>
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-sm font-bold text-slate-900 truncate">{course.courseTitle}</span>
                        {course.courseCategory && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 flex-shrink-0">
                                {course.courseCategory.name}
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

                    {course.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                            ⭐ Featured
                        </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {course.enrollmentType === "Ongoing" ? "🔄 Ongoing Track" : "📅 Fixed Cohort"}
                    </span>

                    <button
                        onClick={() => handleCopy(course._id, "Course ID")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs"
                    >
                        {copiedField === "Course ID" ? (
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

            {/* ── 2. Hero Showcase: Media Gallery & Course Highlights ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Media Showcase (Left 7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                    {/* Main Display Box */}
                    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 relative group shadow-inner flex items-center justify-center">
                        {mediaType === "image" ? (
                            <HeroImage
                                src={images[activeImg]}
                                title={course.courseTitle}
                                alt={`Course visual ${activeImg + 1}`}
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

                {/* Course Quick Highlights Card (Right 5 Cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                                {course.courseCategory?.name || "Professional Course"}
                            </span>
                            {course.isDraft && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    Draft
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                            {course.courseTitle}
                        </h1>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {course.shortdesc || "Comprehensive instructor-led professional masterclass designed for in-depth mastery."}
                        </p>

                        {/* Highlights Matrix */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Sessions</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                                    {course.totalSessions ? `${course.totalSessions} Sessions` : course.duration || "Self-Paced"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Timeline</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {course.startDate ? fmtDateOnly(course.startDate) : "Ongoing"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Campus / Venue</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {course.venueName || "Classroom Campus"}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Timezone</span>
                                <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                                    {course.timeZone || "Asia/Ulaanbaatar"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Instructor Mini Card */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                                src={course.createdBy?.profileImage}
                                name={hostFullName}
                                size="w-10 h-10"
                            />
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Taught By</span>
                                <Link
                                    to={course.createdBy?._id ? `/users/${course.createdBy._id}` : "#"}
                                    className="text-xs font-bold text-slate-900 hover:text-teal-700 transition truncate block"
                                >
                                    {hostFullName}
                                </Link>
                            </div>
                        </div>

                        {course.createdBy?.isVerified && (
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
                    <span className="text-[10px] text-slate-500">Class capacity</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Enrolled</span>
                        <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{enrolledSeats}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">{bookedPercent}% filled</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Available</span>
                        <FiLayers className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-emerald-600">{availableSeats}</div>
                    <span className="text-[10px] text-slate-500">Seats left</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Course Fee</span>
                        <FiTag className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                        {courseFee === 0 ? "Free" : `₮${Number(courseFee).toLocaleString()}`}
                    </div>
                    <span className="text-[10px] text-slate-500">Standard rate</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Revenue</span>
                        <span className="font-bold text-teal-600 text-sm leading-none flex items-center justify-center">₮</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">₮{Number(grossRevenue || 0).toLocaleString()}</div>
                    <span className="text-[10px] text-teal-700 font-semibold">Gross enrolled</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-wider">Page Views</span>
                        <FiTrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{analytics?.viewCount || 0}</div>
                    <span className="text-[10px] text-slate-500">{analytics?.bookingRate || 0}% conversion</span>
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

                    {/* TAB 1: Overview & Syllabus */}
                    {activeTab === "overview" && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                            {/* About */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <FiBookOpen className="text-teal-600" />
                                    <span>About the Masterclass</span>
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                    {course.longdesc || course.shortdesc || "No comprehensive course description provided."}
                                </p>
                            </div>

                            {/* What You Will Learn (Syllabus) */}
                            {course.whatYouWillLearn && (
                                <div className="p-5 rounded-xl bg-teal-50/50 border border-teal-100/80 space-y-3">
                                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                                        <FiCheckCircle className="text-teal-600 w-4 h-4" />
                                        <span>What You Will Learn & Key Objectives</span>
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                        {course.whatYouWillLearn}
                                    </div>
                                </div>
                            )}

                            {/* Course Policies Matrix */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                    Enrollment & Campus Policies
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Cut-off</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {course.bookingCutOff || "24 Hours prior to start"}
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Refund Policy</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {course.refundPolicy || "Standard Policy"}
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Age Eligibility</span>
                                        <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                            {course.ageRestriction || "All Ages"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Links */}
                            {mediaLinks.length > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                                        Curriculum & External Resources
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

                    {/* TAB 2: Batches & Classes / Weekly Schedule */}
                    {activeTab === "schedule" && (
                        <div className="space-y-4">
                            {course.weeklySchedule ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                                        <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">Weekly Schedule Track</h4>
                                        <p className="text-xs text-slate-600 mt-0.5">Recurring sessions organized by weekday slots.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(course.weeklySchedule).map(([dayName, dayData]) => {
                                            if (!dayData?.slots?.length) return null;
                                            return (
                                                <div key={dayName} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                                                    <div className="flex items-center justify-between border-b pb-2">
                                                        <span className="font-bold text-xs text-slate-900">🗓️ {dayName}</span>
                                                        <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                                                            {dayData.date}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {dayData.slots.map((slot, sIdx) => (
                                                            <div key={sIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-semibold text-slate-800">{slot.batchName}</span>
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${slot.isCancelled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                                        {slot.isCancelled ? "Cancelled" : "Active"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                                                                    <span className="text-teal-700 font-semibold">🕒 {formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                                                    <span>{slot.availableSeats} / {slot.seats} seats</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                batches.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400">
                                        <FiCalendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">No batches configured for this course yet.</p>
                                    </div>
                                ) : (
                                    batches.map((batch) => {
                                        const batchSeats = batch.seats || 0;
                                        const batchSold = batch.acquiredSeats || batch.soldSeats || 0;
                                        const batchReserved = batch.ReservedExternally || 0;
                                        const batchAvail = batch.availableSeats ?? Math.max(0, batchSeats - batchSold - batchReserved);
                                        const batchPercent = batchSeats > 0 ? Math.min(100, Math.round((batchSold / batchSeats) * 100)) : 0;

                                        return (
                                            <div key={batch._id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">{batch.batchName}</h4>
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                            {batch.days?.map((d, dIdx) => (
                                                                <span key={dIdx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                                                    {d}
                                                                </span>
                                                            ))}
                                                            <span className="text-[11px] text-teal-700 font-semibold ml-2">
                                                                🕒 {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            ₮{Number(batch.price || course.price || 0).toLocaleString()}
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${batch.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                            {batch.status || "Active"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Seat Statistics */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Seats</span>
                                                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">{batchSeats}</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled</span>
                                                        <span className="text-sm font-bold text-teal-700 mt-0.5 block">{batchSold}</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                                                        <span className="text-sm font-bold text-emerald-600 mt-0.5 block">{batchAvail}</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Reserved Ext.</span>
                                                        <span className="text-sm font-bold text-slate-600 mt-0.5 block">{batchReserved}</span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                                        <span>Occupancy</span>
                                                        <span>{batchPercent}% Filled</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-teal-600 h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${batchPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    )}

                    {/* TAB 3: Multi-Month Pass Options */}
                    {activeTab === "passes" && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
                                    Membership & Multi-Month Passes
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Flexible access passes allowing students to attend sessions across multiple cohorts.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1-Month Pass */}
                                <div className={`p-5 rounded-2xl border transition ${course.oneMonthPassEnabled ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Pass Option</span>
                                            <h4 className="text-base font-bold text-slate-900 mt-0.5">1-Month Membership Pass</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${course.oneMonthPassEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                            {course.oneMonthPassEnabled ? "Active" : "Disabled"}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {course.oneMonthPassEnabled && course.oneMonthPassPrice ? `₮${Number(course.oneMonthPassPrice).toLocaleString()}` : "—"}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">/ 30 calendar days</span>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-emerald-100 pt-3">
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-emerald-600 w-3.5 h-3.5" />
                                            <span>Full access to all scheduled weekday sessions</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-emerald-600 w-3.5 h-3.5" />
                                            <span>Interactive lab walkthroughs & live coding</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-emerald-600 w-3.5 h-3.5" />
                                            <span>Certificate of module completion</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 3-Month Pass */}
                                <div className={`p-5 rounded-2xl border transition ${course.threeMonthPassEnabled ? "bg-teal-50/40 border-teal-200" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Pass Option</span>
                                            <h4 className="text-base font-bold text-slate-900 mt-0.5">3-Month Comprehensive Pass</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${course.threeMonthPassEnabled ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"}`}>
                                            {course.threeMonthPassEnabled ? "Active" : "Disabled"}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {course.threeMonthPassEnabled && course.threeMonthPassPrice ? `₮${Number(course.threeMonthPassPrice).toLocaleString()}` : "—"}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">/ 90 calendar days</span>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-teal-100 pt-3">
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-teal-600 w-3.5 h-3.5" />
                                            <span>Unlimited access to all cohort tracks and batches</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-teal-600 w-3.5 h-3.5" />
                                            <span>1-on-1 architecture review workshops</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <FiCheck className="text-teal-600 w-3.5 h-3.5" />
                                            <span>Full capstone evaluation & recommendation letter</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Enrolled Students Roster */}
                    {activeTab === "students" && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Enrolled Students</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Total registered students: <strong>{attendees.total}</strong>
                                    </p>
                                </div>

                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search student name or email..."
                                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-64 shadow-2xs"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {filteredStudents.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 text-xs">
                                    <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No enrolled students found matching the criteria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                                                <th className="py-3 px-4">Student</th>
                                                <th className="py-3 px-4">Contact</th>
                                                <th className="py-3 px-4">Track / Batch</th>
                                                <th className="py-3 px-4">Booking ID</th>
                                                <th className="py-3 px-4">Paid</th>
                                                <th className="py-3 px-4">Enrolled Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.map((st) => {
                                                const fullName = `${st.firstName || ""} ${st.lastName || ""}`.trim() || "Student";
                                                const txn = st.transactions?.[0] || {};
                                                return (
                                                    <tr key={st._id} className="hover:bg-slate-50/60 transition">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    src={st.profileImage}
                                                                    name={fullName}
                                                                    size="w-8 h-8"
                                                                />
                                                                <div>
                                                                    <Link
                                                                        to={`/users/${st._id}`}
                                                                        className="font-bold text-slate-900 hover:text-teal-700 transition"
                                                                    >
                                                                        {fullName}
                                                                    </Link>
                                                                    <span className="text-[10px] text-slate-400 block font-mono">
                                                                        ID: {st._id?.slice(-6)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-slate-700">{st.email || "—"}</div>
                                                            <div className="text-[11px] text-slate-400">{st.contactNumber || "—"}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/60">
                                                                {txn.batchName || "Enrolled"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                                                            {txn.bookingId || "—"}
                                                        </td>
                                                        <td className="py-3 px-4 font-bold text-slate-900">
                                                            ₮{Number(st.totalAmountPaid || txn.totalAmount || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                            {fmt(st.latestBookingDate || txn.createdAt)}
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

                    {/* TAB 5: Reviews */}
                    {activeTab === "reviews" && (
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                                    <FiStar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No student reviews submitted for this course yet.</p>
                                </div>
                            ) : (
                                reviews.map((rev) => {
                                    const reviewerName = `${rev.userId?.firstName || ""} ${rev.userId?.lastName || ""}`.trim() || "Verified Student";
                                    return (
                                        <div key={rev._id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={rev.userId?.profileImage}
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

                    {/* TAB 6: Discussion & Comments */}
                    {activeTab === "comments" && (
                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400 text-xs">
                                    <FiShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No discussion comments on this course yet.</p>
                                </div>
                            ) : (
                                comments.map((com) => {
                                    const authorName = `${com.user?.firstName || ""} ${com.user?.lastName || ""}`.trim() || "Community Member";
                                    return (
                                        <div key={com._id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        src={com.user?.profileImage}
                                                        name={authorName}
                                                        size="w-8 h-8"
                                                    />
                                                    <div>
                                                        <span className="font-bold text-xs text-slate-900">{authorName}</span>
                                                        <span className="text-[10px] text-slate-400 ml-2">{fmt(com.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    ❤️ {com.likes?.length || 0}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 pl-10 leading-relaxed">
                                                {com.content}
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
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline & Sessions</h3>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">📅</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Start Date</span>
                                    <span className="font-semibold text-slate-800 text-xs">{fmtDateOnly(course.startDate)}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">🏁</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">End Date</span>
                                    <span className="font-semibold text-slate-800 text-xs">{fmtDateOnly(course.endDate)}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">🏫</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Sessions</span>
                                    <span className="font-semibold text-slate-800 text-xs">{course.totalSessions || 0} Live Sessions</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base mt-0.5">⏱</span>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Duration</span>
                                    <span className="font-semibold text-slate-800 text-xs">{course.duration || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classroom Campus / Venue Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Classroom Campus</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-2.5">
                                <FiMapPin className="text-teal-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-xs text-slate-900">{course.venueName || "Classroom Location"}</h4>
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
                                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{enrolledSeats}</span>
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

                    {/* Instructor / Host Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Instructor Profile</h3>
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={course.createdBy?.profileImage}
                                name={hostFullName}
                                size="w-12 h-12"
                            />
                            <div className="min-w-0">
                                <Link
                                    to={course.createdBy?._id ? `/users/${course.createdBy._id}` : "#"}
                                    className="font-bold text-sm text-slate-900 hover:text-teal-700 transition truncate block"
                                >
                                    {hostFullName}
                                </Link>
                                <span className="text-xs text-teal-700 font-medium block">
                                    {course.createdBy?.isVerified ? "Verified Senior Instructor" : "Course Host"}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* ── 5. Meta Footer ── */}
            <div className="text-[11px] text-slate-400 text-right pt-4 border-t border-slate-200">
                Course ID: <span className="font-mono text-slate-600">{course._id}</span> &nbsp;·&nbsp;
                Created: {fmt(course.createdAt)} &nbsp;·&nbsp;
                Last Updated: {fmt(course.updatedAt)}
            </div>

        </div>
    );
};

export default CourseDetail;
