import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (date) => {
    if (!date) return "N/A";
    try {
        return format(new Date(date), "dd MMM yyyy");
    } catch {
        return "N/A";
    }
};

const Avatar = ({ src, name, size = "w-16 h-16" }) => {
    const initials = name
        ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";
    return src ? (
        <img src={src} alt={name} className={`${size} rounded-full object-cover border-4 border-white shadow-md`} />
    ) : (
        <div className={`${size} rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl border-4 border-white shadow-md`}>
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
const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine the back path based on where we came from, or default to users
    // Alternatively, we could default to checking the user's role after fetch
    const [backPath, setBackPath] = useState("/customers");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("events"); // For organizers: events | courses

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await authAxiosClient.get(`/user/profile/${userId}`);
                if (res.data?.status) {
                    const userData = res.data.data.user;
                    setUserProfile(userData);
                    // Dynamically set back path based on role if no history state
                    if (userData.role === "ORGANIZER") {
                        setBackPath("/organizers");
                    } else if (userData.role === "CUSTOMER") {
                        setBackPath("/customers");
                    } else {
                        setBackPath("/verification-requests"); // Fallback
                    }
                } else {
                    setError("Failed to fetch user details.");
                }
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading profile details…</p>
                </div>
            </div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 font-semibold">{error || "User not found."}</p>
                <button onClick={() => navigate(location.state?.from || "/")} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    ← Go Back
                </button>
            </div>
        );
    }

    const {
        firstName, lastName, email, contactNumber, countryCode, dob, bio, profileImage,
        role, isVerified, location: userLocation, interestedCategories,
        totalAttended, totalInterests, totalFollowers,
        businessType, organizerVerificationStatus, documents,
        totalEventsHosted, totalCoursesAdded, events, courses,
        netEarningEvents, netEarningCourses, totalTicketSold
    } = userProfile;

    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "N/A";
    const phone = (countryCode && contactNumber) ? `${countryCode} ${contactNumber}` : contactNumber || "N/A";
    const addressStr = userLocation ? [userLocation.city, userLocation.country].filter(Boolean).join(", ") : "N/A";
    const isOrganizer = role === "ORGANIZER";

    const renderEventListCard = (item, type) => (
        <div key={item._id} className="flex gap-4 p-4 border rounded-xl hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/${type === 'event' ? 'events' : 'courses'}/${item._id}`)}>
            <img
                src={item.posterImage?.[0] || "/sidebar-logo.svg"}
                alt="poster"
                className="w-20 h-16 object-cover rounded-md flex-shrink-0"
                onError={(e) => {
                    e.target.src = "/sidebar-logo.svg";
                }}
            />
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{type === 'event' ? item.eventTitle : item.courseTitle}</h4>
                <p className="text-xs text-gray-500 mt-1">
                    {item.eventCategory?.name || item.courseCategory?.name || "Uncategorized"}
                </p>
                <p className="text-xs text-teal-600 mt-1 font-medium">
                    {type === 'event'
                        ? (item.startDate ? fmt(item.startDate) : "N/A")
                        : (item.schedules?.[0]?.startDate ? fmt(item.schedules[0].startDate) : "N/A")}
                </p>
            </div>
            {/* Status if needed */}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b sticky top-0 z-20 px-6 py-3 flex items-center gap-4 shadow-sm">
                <button
                    onClick={() => navigate(backPath)}
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium text-sm"
                >
                    ← Back to {isOrganizer ? "Organizers" : "Customers"}
                </button>
                <div className="w-px h-5 bg-gray-300" />
                <h1 className="text-lg font-bold text-gray-800 truncate flex-1">{fullName}</h1>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200 uppercase">
                        {role}
                    </span>
                    {isVerified ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                            ✔ VERIFIED
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                            UNVERIFIED
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* ── Profile Header Section ── */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start">
                    <Avatar src={profileImage} name={fullName} size="w-24 h-24" />
                    <div className="flex-1 space-y-2">
                        <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">📧 {email}</span>
                            <span className="flex items-center gap-1">📞 {phone}</span>
                            <span className="flex items-center gap-1">📍 {addressStr}</span>
                            {dob && <span className="flex items-center gap-1">🎂 {fmt(dob)}</span>}
                        </div>
                        {bio && (
                            <div className="w-3/4">
                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">BIO</p>
                                <p className="text-gray-600 text-sm leading-relaxed rounded-lg ">
                                    {bio}
                                </p>
                            </div>
                        )}
                        {interestedCategories?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Interests</p>
                                <div className="flex flex-wrap gap-1">
                                    {interestedCategories.map(cat => (
                                        <span key={cat} className="px-2 py-0.5 capitalize bg-teal-50 text-teal-700 text-xs rounded-md border border-teal-100">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── General Stats ── */}
                <h3 className="text-lg font-bold text-gray-800">General Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoCard icon="📌" label="Total Interests" value={totalInterests} />
                    <InfoCard icon="🎟" label="Events Attended" value={totalAttended} />
                    <InfoCard icon="👥" label="Followers" value={totalFollowers} />
                </div>

                {/* ── Organizer Specifics ── */}
                {isOrganizer && (
                    <div className="space-y-6">

                        <div className="w-full h-px bg-gray-200 my-8" />

                        <h3 className="text-lg font-bold text-gray-800">Organizer Business Profile</h3>

                        {/* Business Info & Verification */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
                                <h4 className="font-bold text-gray-700 border-b pb-2 text-sm">Business Details</h4>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Business Name</p>
                                    <p className="font-semibold text-gray-800 text-sm">{userProfile.businessName || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Business Type</p>
                                    <p className="font-semibold text-gray-800 text-sm">{businessType || "N/A"}</p>
                                </div>
                                {userProfile.socialMediaLink && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Social Media Link</p>
                                        <a href={userProfile.socialMediaLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-sm font-medium break-all">
                                            {userProfile.socialMediaLink}
                                        </a>
                                    </div>
                                )}
                                {userProfile.shortDesc && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Business Description</p>
                                        <p className="text-gray-600 text-xs leading-relaxed mt-1 p-2.5 bg-gray-50 rounded-lg border whitespace-pre-line">
                                            {userProfile.shortDesc}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
                                <h4 className="font-bold text-gray-700 border-b pb-2 text-sm">Verification Statuses</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="text-sm font-medium text-gray-700">Business Verification</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${userProfile.businessVerificationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                            userProfile.businessVerificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-teal-100 text-teal-700'
                                            }`}>
                                            {userProfile.businessVerificationStatus?.toUpperCase() || "PENDING"}
                                        </span>
                                    </div>

                                    {userProfile.verifications?.email && (
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <span className="text-sm font-medium text-gray-700">Email Verification</span>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${userProfile.verifications.email.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {userProfile.verifications.email.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                                            </span>
                                        </div>
                                    )}

                                    {userProfile.verifications?.phone && (
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <span className="text-sm font-medium text-gray-700">Phone Verification</span>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${userProfile.verifications.phone.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {userProfile.verifications.phone.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                                            </span>
                                        </div>
                                    )}

                                    {userProfile.verifications?.idVerification?.nationalId && (
                                        <div className="flex flex-col border-b pb-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">National ID</span>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${(userProfile.verifications.idVerification.nationalId.status === 'verified' || userProfile.verifications.idVerification.nationalId.status === 'approved') ? 'bg-green-100 text-green-700' :
                                                    userProfile.verifications.idVerification.nationalId.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {userProfile.verifications.idVerification.nationalId.status?.toUpperCase() || "UNVERIFIED"}
                                                </span>
                                            </div>
                                            {(userProfile.verifications.idVerification.nationalId.frontImage || userProfile.verifications.idVerification.nationalId.backImage) && (
                                                <div className="flex gap-3 mt-1.5 text-xs">
                                                    {userProfile.verifications.idVerification.nationalId.frontImage && (
                                                        <a href={userProfile.verifications.idVerification.nationalId.frontImage} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-medium">
                                                            📄 Front Image
                                                        </a>
                                                    )}
                                                    {userProfile.verifications.idVerification.nationalId.backImage && (
                                                        <a href={userProfile.verifications.idVerification.nationalId.backImage} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-medium">
                                                            📄 Back Image
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {userProfile.verifications?.idVerification?.drivingLicence && (
                                        <div className="flex flex-col border-b pb-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Driving Licence</span>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${(userProfile.verifications.idVerification.drivingLicence.status === 'verified' || userProfile.verifications.idVerification.drivingLicence.status === 'approved') ? 'bg-green-100 text-green-700' :
                                                    userProfile.verifications.idVerification.drivingLicence.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {userProfile.verifications.idVerification.drivingLicence.status?.toUpperCase() || "UNVERIFIED"}
                                                </span>
                                            </div>
                                            {(userProfile.verifications.idVerification.drivingLicence.frontImage || userProfile.verifications.idVerification.drivingLicence.backImage) && (
                                                <div className="flex gap-3 mt-1.5 text-xs">
                                                    {userProfile.verifications.idVerification.drivingLicence.frontImage && (
                                                        <a href={userProfile.verifications.idVerification.drivingLicence.frontImage} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-medium">
                                                            📄 Front Image
                                                        </a>
                                                    )}
                                                    {userProfile.verifications.idVerification.drivingLicence.backImage && (
                                                        <a href={userProfile.verifications.idVerification.drivingLicence.backImage} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline font-medium">
                                                            📄 Back Image
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {userProfile.verifications?.bankVerification && (
                                        <div className="flex items-center justify-between pb-1">
                                            <span className="text-sm font-medium text-gray-700">Bank Verification</span>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${(userProfile.verifications.bankVerification.status === 'verified' || userProfile.verifications.bankVerification.status === 'approved') ? 'bg-green-100 text-green-700' :
                                                userProfile.verifications.bankVerification.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {userProfile.verifications.bankVerification.status?.toUpperCase() || "UNVERIFIED"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Financial Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoCard icon="📅" label="Events Hosted" value={totalEventsHosted} />
                            <InfoCard icon="📚" label="Courses Added" value={totalCoursesAdded} />
                            <InfoCard icon="🎟" label="Total Tickets Sold" value={totalTicketSold} />
                            <InfoCard icon="💰" label="Total Earnings" value={`₮${((netEarningEvents || 0) + (netEarningCourses || 0)).toLocaleString()}`} accent="border-green-200 bg-green-50" />
                        </div>

                        {/* Events & Courses Tabs */}
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mt-6">
                            <div className="flex border-b bg-gray-50">
                                <button
                                    onClick={() => setActiveTab("events")}
                                    className={`px-6 py-3 text-sm font-semibold transition ${activeTab === "events"
                                        ? "bg-white border-b-2 border-teal-500 text-teal-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Events
                                </button>
                                <button
                                    onClick={() => setActiveTab("courses")}
                                    className={`px-6 py-3 text-sm font-semibold transition ${activeTab === "courses"
                                        ? "bg-white border-b-2 border-teal-500 text-teal-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Courses
                                </button>
                            </div>

                            <div className="p-6">
                                {activeTab === "events" && (
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Upcoming Events ({events?.upcoming_events?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {events?.upcoming_events?.length > 0 ? (
                                                    events.upcoming_events.map(ev => renderEventListCard(ev, 'event'))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No upcoming events.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Past Events ({events?.previous_events?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {events?.previous_events?.length > 0 ? (
                                                    events.previous_events.map(ev => renderEventListCard(ev, 'event'))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No past events.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === "courses" && (
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Ongoing/Upcoming Courses ({courses?.upcoming_courses?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {courses?.upcoming_courses?.length > 0 ? (
                                                    courses.upcoming_courses.map(cr => renderEventListCard(cr, 'course'))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No active courses.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Past Courses ({courses?.previous_courses?.length || 0})</h4>
                                            <div className="space-y-3">
                                                {courses?.previous_courses?.length > 0 ? (
                                                    courses.previous_courses.map(cr => renderEventListCard(cr, 'course'))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No past courses.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetail;
