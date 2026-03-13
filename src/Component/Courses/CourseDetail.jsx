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

const fmtTimeDate = (date) => {
    if (!date) return "N/A";
    try {
        return format(new Date(date), "dd MMM yyyy");
    } catch {
        return "N/A";
    }
}

const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
};


const StatusBadge = ({ status }) => {
    const map = {
        LIVE: "bg-green-100 text-green-700 border border-green-300",
        UPCOMING: "bg-blue-100 text-blue-700 border border-blue-300",
        PAST: "bg-gray-100 text-gray-600 border border-gray-300",
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
            {status || "Unknown"}
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
        <div className={`${size} rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-sm border-2 border-white shadow`}>
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
const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);

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
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading course details…</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-semibold">{error || "Course not found."}</p>
                <button onClick={() => navigate("/courses")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ← Back to Courses
                </button>
            </div>
        );
    }

    const images = course.posterImage || [];
    const gallery = course.galleryImages || [];
    const allImages = [...images, ...gallery];
    const venue = course.venueAddress || {};

    const tabs = [
        { id: "overview", label: "📋 Overview" },
        { id: "schedules", label: `📅 Schedules (${course.schedules?.length || 0})` },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b sticky top-0 z-20 px-6 py-3 flex items-center gap-4 shadow-sm">
                <button
                    onClick={() => navigate("/courses")}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                    ← Back to Courses
                </button>
                <div className="w-px h-5 bg-gray-300" />
                <h1 className="text-lg font-bold text-gray-800 truncate flex-1">{course.courseTitle}</h1>
                <div className="flex items-center gap-2">
                    {course.isFeatured && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 text-xs font-semibold rounded-full">
                            ⭐ Featured
                        </span>
                    )}
                    <StatusBadge status={course.sessionStatus} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* ── Hero Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Poster */}
                    <div className="lg:col-span-2 space-y-2">
                        {allImages.length > 0 ? (
                            <>
                                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border bg-gray-100">
                                    <img
                                        src={allImages[activeImg]}
                                        alt="poster"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {allImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto">
                                        {allImages.map((img, i) => (
                                            <button key={i} onClick={() => setActiveImg(i)}>
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className={`w-16 h-10 object-cover rounded-lg border-2 transition ${i === activeImg ? "border-blue-500" : "border-transparent"}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full aspect-video rounded-2xl bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">📚</div>
                        )}
                    </div>

                    {/* Short Info */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Organizer */}
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={course.createdBy?.profileImage}
                                name={`${course.createdBy?.firstName || ""} ${course.createdBy?.lastName || ""}`}
                                size="w-11 h-11"
                            />
                            <div>
                                <p className="text-xs text-gray-500">Instructor / Organizer</p>
                                <p className="font-semibold text-gray-800">
                                    {course.createdBy?.firstName} {course.createdBy?.lastName}
                                    {course.createdBy?.isVerified && (
                                        <span className="ml-1 text-blue-500 text-xs">✔ Verified</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Short description */}
                        {course.shortdesc && (
                            <p className="text-gray-600 text-sm leading-relaxed">{course.shortdesc}</p>
                        )}

                        {/* What You Will Learn */}
                        {course.whatYouWillLearn && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">What you will learn</h4>
                                <p className="text-sm text-blue-900">{course.whatYouWillLearn}</p>
                            </div>
                        )}

                        {/* Category */}
                        {course.courseCategory && (
                            <div className="flex items-center gap-2 pt-2">
                                {course.courseCategory.image && (
                                    <img src={course.courseCategory.image} alt="" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className="text-xs font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                                    {course.courseCategory.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Info Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <InfoCard icon="📌" label="Enrollment Type" value={course.enrollmentType === "fixedStart" ? "Fixed Start" : "Ongoing"} />
                    <InfoCard icon="⏱" label="Duration (per session)" value={course.duration} />
                    <InfoCard icon="🎟" label="Course Price" value={course.price != null ? `₹${course.price}` : "Free"} />
                    <InfoCard icon="🪑" label="Seats Per Schedule" value={course.totalSeats?.toLocaleString()} />
                    <InfoCard icon="✅" label="Total Left Seats" value={course.leftSeats?.toLocaleString()} />
                    <InfoCard icon="👥" label="Total Enrolled" value={course.acquiredSeats?.toLocaleString()} />
                    <InfoCard icon="🏙" label="City / Country" value={[venue.city, venue.country].filter(Boolean).join(", ")} />
                    <InfoCard icon="📍" label="Full Address" value={venue.address || "N/A"} />
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    {/* Tab headers */}
                    <div className="flex border-b bg-gray-50">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-6 py-3 text-sm font-semibold transition ${
                                    activeTab === t.id
                                        ? "bg-white border-b-2 border-blue-500 text-blue-600"
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
                            
                            {/* Venue Details */}
                            {venue.address && (
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">Venue Address</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-sm text-gray-800 font-medium">{course.venueAddress?.address}</p>
                                        <p className="text-sm text-gray-600">
                                            {[venue.city, venue.state, venue.country, venue.zipcode].filter(Boolean).join(", ")}
                                        </p>
                                        {venue.coordinates && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                Coordinates: {venue.coordinates[1]}, {venue.coordinates[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                             {/* Promo Info */}
                             {course.activePromotionPackage && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-purple-700 mb-1">Active Promotion Package</h3>
                                    <p className="text-sm text-purple-800">Package ID: <span className="font-mono">{course.activePromotionPackage}</span></p>
                                </div>
                            )}

                        </div>
                    )}

                    {/* ── Schedules Tab ── */}
                    {activeTab === "schedules" && (
                        <div className="p-6">
                            {!course.schedules || course.schedules.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-4xl mb-2">📅</p>
                                    <p>No schedules added yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border rounded-lg hidden md:table">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">Dates</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">Timing</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 border-b">Enrolled</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 border-b">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {course.schedules.map((sched, i) => (
                                                <tr key={sched._id || i} className="border-b hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-800">{fmtTimeDate(sched.startDate)}</div>
                                                        <div className="text-gray-500">to {fmtTimeDate(sched.endDate)}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-semibold">{sched.acquiredSeats || 0}</span>
                                                        <span className="text-gray-400 mx-1">/</span>
                                                        <span>{sched.totalSeats}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {sched.isFull ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">FULL</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                                                {sched.availableSeats} LEFT
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile View */}
                                    <div className="grid grid-cols-1 gap-4 md:hidden">
                                        {course.schedules.map((sched, i) => (
                                            <div key={sched._id || i} className="bg-white border rounded-xl p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{fmtTimeDate(sched.startDate)}</p>
                                                        <p className="text-sm text-gray-500">to {fmtTimeDate(sched.endDate)}</p>
                                                    </div>
                                                    {sched.isFull ? (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">FULL</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                                            {sched.availableSeats} LEFT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-t pt-3">
                                                    <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                                        🕒 {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                                    </span>
                                                    <span className="text-gray-600">
                                                        <strong className="text-gray-800">{sched.acquiredSeats || 0}</strong> / {sched.totalSeats} enrolled
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Meta Footer ── */}
                <div className="text-xs text-gray-400 text-right">
                    Course ID: {course._id} &nbsp;·&nbsp; Created: {fmt(course.createdAt)}
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
