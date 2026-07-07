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

const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
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

const StatusBadge = ({ status }) => {
    const map = {
        Active: "bg-green-100 text-green-700 border border-green-300",
        Live: "bg-green-100 text-green-700 border border-green-300",
        LIVE: "bg-green-100 text-green-700 border border-green-300",
        Upcoming: "bg-teal-100 text-teal-700 border border-teal-300",
        UPCOMING: "bg-teal-100 text-teal-700 border border-teal-300",
        Past: "bg-gray-100 text-gray-600 border border-gray-300",
        PAST: "bg-gray-100 text-gray-600 border border-gray-300",
    };
    const lookup = String(status).toUpperCase();

    // Find closest match
    let badgeClass = "bg-gray-100 text-gray-600 border border-gray-300";
    if (lookup.includes("LIVE") || lookup.includes("ACTIVE")) {
        badgeClass = map.Live;
    } else if (lookup.includes("UPCOMING")) {
        badgeClass = map.Upcoming;
    } else if (lookup.includes("PAST")) {
        badgeClass = map.Past;
    }

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
            {status || "N/A"}
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
const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);
    const [mediaType, setMediaType] = useState("image");

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authAxiosClient.get(`/course/details/${courseId}`);
                if (res.data?.status) {
                    setCourse(res.data.data);
                } else {
                    setError("Failed to fetch course details.");
                }
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [courseId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading course details…</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-semibold">{error || "Course not found."}</p>
                <button onClick={() => navigate("/courses")} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    ← Back to Courses
                </button>
            </div>
        );
    }

    const images = course.posterImage || [];
    const mediaLinks = course.mediaLinks || [];
    const videos = course.shortTeaserVideo || [];
    const venue = course.venueAddress || {};
    const batches = course.batches || [];

    const tabs = [
        { id: "overview", label: "📋 Course Overview" },
    ];
    if (course.weeklySchedule) {
        tabs.push({ id: "weekly", label: "📅 Weekly Schedule" });
    } else {
        tabs.push({ id: "batches", label: `👥 Batches & Classes (${batches.length})` });
    }

    const bookedPercent = course.totalSeats > 0 ? Math.round((course.acquiredSeats / course.totalSeats) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/courses")}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-800 font-medium text-sm transition"
                    >
                        ← Back to Courses
                    </button>
                    <div className="w-px h-5 bg-slate-300" />
                    {/* <h1 className="text-md font-bold text-slate-800 truncate max-w-lg">{course.courseTitle}</h1> */}
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={course.status} />
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
                                <span className="font-bold text-sm text-slate-700">Course Media Gallery</span>
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
                                            alt="Course visual"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-slate-400 text-6xl">📚</div>
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

                        {/* Course Header Info */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                {course.courseCategory && (
                                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                                        {course.courseCategory.image && (
                                            <img src={course.courseCategory.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                                        )}
                                        <span className="text-xs font-semibold text-teal-700 capitalize">
                                            {course.courseCategory.name}
                                        </span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {course.isFeatured && (
                                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-medium">⭐ Featured</span>
                                    )}
                                    {course.isDraft && (
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-medium">Draft</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{course.courseTitle}</h2>
                            <p className="text-slate-600 text-sm leading-relaxed">{course.shortdesc}</p>
                        </div>

                        {/* Tabs */}
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

                            <div className="p-6">
                                {/* Overview Tab */}
                                {activeTab === "overview" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-md border-b pb-2 mb-3">About the Course</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{course.longdesc}</p>
                                        </div>

                                        {course.whatYouWillLearn && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                                <h4 className="font-bold text-slate-800 text-sm mb-3">🎓 What You Will Learn</h4>
                                                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {course.whatYouWillLearn}
                                                </div>
                                            </div>
                                        )}

                                        {/* Multi-month pass configuration */}
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 mb-3">Pass Options</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className={`border rounded-xl p-4 flex flex-col justify-between ${course.oneMonthPassEnabled ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400 block uppercase">1-Month Pass</span>
                                                        <span className="text-lg font-bold text-slate-800 mt-1 block">
                                                            {course.oneMonthPassEnabled ? `₮${course.oneMonthPassPrice}` : "Disabled"}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold mt-2 inline-block self-start px-2 py-0.5 rounded ${course.oneMonthPassEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                                        {course.oneMonthPassEnabled ? "Active" : "Inactive"}
                                                    </span>
                                                </div>

                                                <div className={`border rounded-xl p-4 flex flex-col justify-between ${course.threeMonthPassEnabled ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400 block uppercase">3-Month Pass</span>
                                                        <span className="text-lg font-bold text-slate-800 mt-1 block">
                                                            {course.threeMonthPassEnabled ? `₮${course.threeMonthPassPrice}` : "Disabled"}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold mt-2 inline-block self-start px-2 py-0.5 rounded ${course.threeMonthPassEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                                                        {course.threeMonthPassEnabled ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Policies and details */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Booking Cut-off</span>
                                                <span className="font-semibold text-slate-800 text-sm mt-1 block">{course.bookingCutOff || "N/A"}</span>
                                            </div>
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Refund Policy</span>
                                                <span className="font-semibold text-slate-800 text-sm mt-1 block">{course.refundPolicy || "No Refund"}</span>
                                            </div>
                                            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Featured Expiry</span>
                                                <span className="font-semibold text-slate-800 text-sm mt-1 block">{course.featuredExpiry ? fmtDateOnly(course.featuredExpiry) : "N/A"}</span>
                                            </div>
                                        </div>

                                        {/* External media / documents */}
                                        {mediaLinks.length > 0 && (
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm mb-2">Reference Links</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {mediaLinks.map((url, i) => (
                                                        <a
                                                            key={i}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg transition truncate max-w-[200px]"
                                                        >
                                                            🔗 Link #{i + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Batches Tab */}
                                {activeTab === "batches" && (
                                    <div className="space-y-4">
                                        {batches.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <p className="text-3xl mb-1">📅</p>
                                                <p className="text-sm">No batches created for this course yet.</p>
                                            </div>
                                        ) : (
                                            batches.map((batch) => (
                                                <div key={batch._id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-300 transition duration-200 bg-white">
                                                    <div className="flex justify-between items-start flex-wrap gap-2 border-b pb-3 mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-md">{batch.batchName}</h4>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {batch.days?.map((day, idx) => (
                                                                    <span key={idx} className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                                                                        {day}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold border ${batch.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                            {batch.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                        <div>
                                                            <span className="text-slate-400 block">Total Seats</span>
                                                            <span className="font-bold text-slate-700 text-sm">{batch.seats}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Available Seats</span>
                                                            <span className="font-bold text-emerald-600 text-sm">{batch.availableSeats}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Enrolled Seats</span>
                                                            <span className="font-bold text-teal-600 text-sm">{batch.acquiredSeats}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">Reserved Externally</span>
                                                            <span className="font-bold text-slate-600 text-sm">{batch.ReservedExternally || 0}</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 bg-slate-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
                                                        <span className="font-semibold text-teal-600">
                                                            🕒 Time: {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                                                        </span>
                                                        {batch.isFull && (
                                                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold text-[10px]">
                                                                FULL
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Weekly Schedule Tab */}
                                {activeTab === "weekly" && course.weeklySchedule && (
                                    <div className="space-y-6">
                                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-4">
                                            <h4 className="font-bold text-teal-800 text-xs uppercase tracking-wider mb-1">Ongoing Enrollment Schedule</h4>
                                            <p className="text-slate-700 text-xs">
                                                This course follows an ongoing schedule. Below are the class slots available for each day of the week.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {Object.entries(course.weeklySchedule).map(([dayName, dayData]) => {
                                                if (!dayData || !dayData.slots || dayData.slots.length === 0) return null;
                                                return (
                                                    <div key={dayName} className="border border-slate-100 rounded-2xl bg-slate-50 p-4 space-y-3">
                                                        <div className="flex justify-between items-center border-b pb-2">
                                                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                                                🗓️ {dayName}
                                                            </span>
                                                            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded">
                                                                {dayData.date}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {dayData.slots.map((slot, index) => (
                                                                <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 hover:shadow-sm transition">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h5 className="font-semibold text-slate-800 text-xs">{slot.batchName}</h5>
                                                                            <span className="text-[10px] text-slate-400">ID: {slot.batchId}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${slot.isCancelled ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                                            {slot.isCancelled ? "Cancelled" : "Scheduled"}
                                                                        </span>
                                                                    </div>

                                                                    {slot.isCancelled && slot.cancelReason && (
                                                                        <p className="text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded font-medium">
                                                                            Reason: {slot.cancelReason}
                                                                        </p>
                                                                    )}

                                                                    <div className="flex justify-between items-center text-[11px] border-t pt-2 mt-1">
                                                                        <span className="text-teal-600 font-medium">
                                                                            🕒 {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                                        </span>
                                                                        <span className="text-slate-500">
                                                                            Seats: <strong>{slot.availableSeats}</strong> / {slot.seats} left
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Instructor & Sidebar */}
                    <div className="space-y-6">

                        {/* Instructor Info */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Instructor</h3>
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={course.createdBy?.profileImage}
                                    name={`${course.createdBy?.firstName || ""} ${course.createdBy?.lastName || ""}`}
                                    size="w-12 h-12"
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">
                                        {course.createdBy?.firstName} {course.createdBy?.lastName}
                                    </p>
                                    <p className="text-xs text-teal-600 font-medium">
                                        {course.createdBy?.isVerified ? "★ Verified Instructor" : "Instructor"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Timeline */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Timeline & Sessions</h3>
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">📅</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Start Date</span>
                                        <span className="font-semibold text-slate-700 text-sm">{fmtDateOnly(course.startDate)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">🏁</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">End Date</span>
                                        <span className="font-semibold text-slate-700 text-sm">{fmtDateOnly(course.endDate)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">🏫</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Total Sessions</span>
                                        <span className="font-semibold text-slate-700 text-sm">{course.totalSessions} Sessions</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-slate-400 text-lg">⏱</span>
                                    <div>
                                        <span className="text-slate-400 text-xs block font-medium">Duration</span>
                                        <span className="font-semibold text-slate-700 text-sm">
                                            {course.duration}
                                            {/* {course.durationTranslation ? `(${course.durationTranslation})` : ""} */}
                                        </span>
                                    </div>
                                </div>
                                {course.currentSchedule && (
                                    <div className="mt-2 pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                                        <span className="block font-semibold text-slate-500">Current active slot:</span>
                                        <span>📆 {fmtDateOnly(course.currentSchedule.startDate)} - {fmtDateOnly(course.currentSchedule.endDate)}</span>
                                        <span className="block">🕒 {formatTime(course.currentSchedule.startTime)} - {formatTime(course.currentSchedule.endTime)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location details */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Classroom Location</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="text-lg mt-0.5">📍</span>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{course.venueName}</h4>
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

                        {/* Pricing details */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Pricing</h3>
                            <div className="flex justify-between items-center bg-teal-50/50 border border-teal-100 rounded-xl p-4">
                                <span className="text-xs font-bold text-slate-500 block uppercase">Course Price</span>
                                <span className="text-lg font-bold text-teal-600">
                                    {course.price === 0 ? "Free" : `₮${course.price}`}
                                </span>
                            </div>
                        </div>

                        {/* Seat tracker */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Total Enrolled Tracker</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-slate-500 font-medium">Total Capacity</span>
                                    <span className="text-sm font-bold text-slate-800">{course.acquiredSeats} / {course.totalSeats} seats</span>
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
                                        <span className="text-slate-400 block text-[10px]">Total Left Seats</span>
                                        <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{course.leftSeats}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <span className="text-slate-400 block text-[10px]">Enrollment Type</span>
                                        <span className="font-bold text-teal-600 text-[10px] mt-1 block uppercase truncate">{course.enrollmentType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* ── Meta Footer ── */}
                <div className="text-xs text-slate-400 text-right pt-6 border-t border-slate-200">
                    Course ID: {course._id} &nbsp;·&nbsp; Created: {fmt(course.createdAt)} &nbsp;·&nbsp; Last Updated: {fmt(course.updatedAt)}
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
