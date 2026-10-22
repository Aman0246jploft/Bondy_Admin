import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import authAxiosClient from "../../api/authAxiosClient";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiCopy,
    FiExternalLink,
    FiTrash2,
    FiPower,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiUser,
    FiStar,
    FiShield,
    FiGlobe,
    FiShoppingBag,
    FiBookOpen,
    FiUsers,
    FiFileText,
    FiCreditCard,
    FiCheck,
    FiAward,
    FiTrendingUp,
    FiLayers,
    FiAlertCircle
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

const formatLocation = (loc) => {
    if (!loc) return null;
    if (typeof loc === "string") return loc.trim();
    if (typeof loc === "object") {
        const city = loc.city?.trim();
        const state = loc.state?.trim();
        const country = loc.country?.trim();
        const address = loc.address?.trim();

        // 1. Build concise location using city, state, country
        const cleanParts = [];
        if (city) cleanParts.push(city);
        if (state && !cleanParts.some(p => p.toLowerCase().includes(state.toLowerCase()))) cleanParts.push(state);
        if (country && !cleanParts.some(p => p.toLowerCase().includes(country.toLowerCase()))) cleanParts.push(country);

        if (cleanParts.length > 0) {
            return cleanParts.join(", ");
        }

        // 2. Fallback to address (cleanly truncated if long)
        if (address) {
            const segments = address.split(",").map(s => s.trim()).filter(Boolean);
            if (segments.length > 3) {
                return segments.slice(0, 3).join(", ");
            }
            return address;
        }

        if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
            return `${loc.coordinates[1].toFixed(2)}, ${loc.coordinates[0].toFixed(2)}`;
        }
    }
    return null;
};

const formatAuthMethod = (sl) => {
    if (!sl) return "Email & Password";
    if (typeof sl === "string") return sl;
    if (typeof sl === "object") {
        if (sl.isSocialLogin && sl.socialType) {
            return String(sl.socialType).toUpperCase();
        }
        if (sl.socialType) return String(sl.socialType).toUpperCase();
    }
    return "Email & Password";
};

const Avatar = ({ src, name, size = "w-16 h-16" }) => {
    const initials = name
        ? name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
        : "?";
    return src ? (
        <img
            src={src}
            alt={name}
            className={`${size} rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm flex-shrink-0 bg-slate-50`}
            onError={(e) => {
                e.target.style.display = "none";
            }}
        />
    ) : (
        <div className={`${size} rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-lg ring-2 ring-slate-100 shadow-sm flex-shrink-0 tracking-wide`}>
            {initials}
        </div>
    );
};

// ─── Minimalist Metric Tile ─────────────────────────────────────────────────
const MetricTile = ({ label, value, subtext, icon: Icon }) => (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 transition-all duration-150 hover:border-slate-300">
        <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {label}
            </span>
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
        </div>
        <div className="text-xl font-bold text-slate-900 tracking-tight">
            {value ?? 0}
        </div>
        {subtext && (
            <p className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">
                {subtext}
            </p>
        )}
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [backPath, setBackPath] = useState("/customers");
    const [activeTab, setActiveTab] = useState("bookings");
    const [bookingFilter, setBookingFilter] = useState("ALL");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [imageModal, setImageModal] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await authAxiosClient.get(`/user/profile/${userId}`);
                if (res.data?.status) {
                    const userData = res.data.data.user;
                    setUserProfile(userData);

                    const isOrg = userData.role === "ORGANIZER";
                    if (isOrg) {
                        setBackPath("/organizers");
                        setActiveTab("events");
                    } else if (userData.role === "CUSTOMER") {
                        setBackPath("/customers");
                        setActiveTab("bookings");
                    } else {
                        setBackPath("/verification-requests");
                        setActiveTab("verifications");
                    }
                } else {
                    setError("Failed to fetch user details.");
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchDetails();
        }
    }, [userId]);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`${fieldName} copied to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleToggleStatus = async () => {
        if (!userProfile) return;
        const newStatus = !userProfile.isDisable;
        const actionText = newStatus ? "deactivate" : "activate";

        if (!window.confirm(`Are you sure you want to ${actionText} ${userProfile.firstName || "this user"}'s account?`)) {
            return;
        }

        setIsUpdatingStatus(true);
        try {
            const res = await authAxiosClient.patch(`/user/toggle-disable/${userId}`, {
                isDisable: newStatus,
            });
            if (res.data?.status) {
                setUserProfile((prev) => ({ ...prev, isDisable: newStatus }));
                toast.success(`Account ${newStatus ? "deactivated" : "activated"} successfully`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to update account status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleTogglePromote = async () => {
        if (!userProfile) return;
        setIsPromoting(true);
        try {
            const newPromote = !userProfile.isPromoted;
            const res = await authAxiosClient.patch(`/user/toggle-promote/${userProfile._id || userId}`, {
                isPromoted: newPromote,
            });
            if (res.data?.status) {
                setUserProfile((prev) => ({ ...prev, isPromoted: newPromote }));
                toast.success(`Organizer ${newPromote ? "promoted on homepage" : "unpromoted"} successfully`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to update promotion status");
        } finally {
            setIsPromoting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete ${userProfile.firstName || "this user"}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await authAxiosClient.delete(`/user/delete/${userId}`);
            if (res.data?.status) {
                toast.success("User deleted successfully");
                navigate(backPath);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to delete user");
        }
    };

    if (loading) {
        return null; // Global LoadingOverlay is active
    }

    if (error || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl">
                    <FiAlertCircle />
                </div>
                <h3 className="text-base font-semibold text-slate-800">{error || "User not found."}</h3>
                <button
                    onClick={() => navigate(location.state?.from || "/customers")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition cursor-pointer"
                >
                    <FiArrowLeft className="w-4 h-4" /> Return to List
                </button>
            </div>
        );
    }

    const {
        firstName,
        lastName,
        email,
        contactNumber,
        countryCode,
        gender,
        dob,
        bio,
        profileImage,
        role,
        isVerified,
        isAllVerified,
        isDisable,
        location: userLocation,
        interestedCategories,
        totalFollowers,
        totalFollowing,
        createdAt,
        lastLogin,
        lastSeen,
        language,
        timeZone,
        socialLogin,
        isPromoted,
        businessName,
        businessRegisterNumber,
        website,
        bankAccounts = [],
        events = {},
        courses = {},
        bookings = [],
        customerStats = {},
        userReviews = [],
        verifications = {},
        netEarningEvents = 0,
        netEarningCourses = 0,
        totalEarnings = 0,
        payoutBalance = 0,
    } = userProfile;

    const isCustomer = role === "CUSTOMER";
    const isOrganizer = role === "ORGANIZER";
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Unnamed User";
    const locationString = formatLocation(userLocation);
    const authMethodString = formatAuthMethod(socialLogin);

    // Filter bookings
    const filteredBookings = bookings.filter((b) => {
        if (bookingFilter === "ALL") return true;
        const st = (b.status || b.paymentStatus || "").toUpperCase();
        return st === bookingFilter;
    });

    const idDoc = verifications?.idVerification?.nationalId || verifications?.governmentId;
    const licenceDoc = verifications?.idVerification?.drivingLicence || verifications?.drivingLicence;

    return (
        <div className="w-full px-[10px] space-y-6 pb-12">

            {/* ── 1. Modern Minimal Header & Actions Bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                {/* Navigation & Context */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(location.state?.from || backPath)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>{isOrganizer ? "Organizers" : "Customers"}</span>
                    </button>
                    <span className="text-slate-300">/</span>
                    {/* <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{fullName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isOrganizer ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                            {role}
                        </span>
                    </div> */}
                </div>

                {/* Quick Status & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Pills */}
                    <div className="flex items-center gap-1.5 mr-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${!isDisable ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${!isDisable ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {!isDisable ? "Active" : "Disabled"}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${(isVerified || isAllVerified) ? "bg-teal-50 text-teal-700 border border-teal-200/60" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                            {(isVerified || isAllVerified) ? <FiCheck className="w-3 h-3 text-teal-600" /> : null}
                            {(isVerified || isAllVerified) ? "Verified" : "Unverified"}
                        </span>
                    </div>

                    {/* Organizer Promote Button */}
                    {isOrganizer && (
                        <button
                            onClick={handleTogglePromote}
                            disabled={isPromoting}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${isPromoted
                                ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                            title="Feature this organizer on homepage"
                        >
                            <FiAward className={`w-3.5 h-3.5 ${isPromoted ? "text-amber-600" : "text-slate-400"}`} />
                            {isPromoted ? "Promoted" : "Promote"}
                        </button>
                    )}

                    {/* Toggle Disable / Enable Button */}
                    <button
                        onClick={handleToggleStatus}
                        disabled={isUpdatingStatus}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${isDisable
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <FiPower className={`w-3.5 h-3.5 ${isDisable ? "text-emerald-600" : "text-slate-400"}`} />
                        {isDisable ? "Activate" : "Deactivate"}
                    </button>

                    {/* Delete User */}
                    <button
                        onClick={handleDeleteUser}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                        title="Delete User Account"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* ── 2. Modern Profile Header Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

                    {/* Avatar & Core Identity */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                        <Avatar src={profileImage} name={fullName} size="w-16 h-16 sm:w-20 sm:h-20" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                    {fullName}
                                </h1>
                                {businessName && (
                                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                        {businessName}
                                    </span>
                                )}
                            </div>

                            {/* Monospace User ID with copy */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="text-[11px] font-mono text-slate-400">ID:</span>
                                <code className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60">
                                    {userId}
                                </code>
                                <button
                                    onClick={() => handleCopy(userId, "User ID")}
                                    className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
                                    title="Copy User ID"
                                >
                                    {copiedField === "User ID" ? <FiCheck className="w-3 h-3 text-emerald-600" /> : <FiCopy className="w-3 h-3" />}
                                </button>
                            </div>

                            {/* Primary Contact Chips */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
                                {email && (
                                    <span className="inline-flex items-center gap-1.5 hover:text-slate-800">
                                        <FiMail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="truncate max-w-[200px]">{email}</span>
                                        <button
                                            onClick={() => handleCopy(email, "Email")}
                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                            title="Copy Email"
                                        >
                                            {copiedField === "Email" ? <FiCheck className="w-2.5 h-2.5 text-emerald-600" /> : <FiCopy className="w-2.5 h-2.5" />}
                                        </button>
                                    </span>
                                )}

                                {contactNumber && (
                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                        <FiPhone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        <span>{countryCode ? `${countryCode} ` : ""}{contactNumber}</span>
                                    </span>
                                )}

                                {locationString && (
                                    <span className="inline-flex items-center gap-1.5 max-w-xs sm:max-w-sm md:max-w-md" title={locationString}>
                                        <FiMapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{locationString}</span>
                                    </span>
                                )}

                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                    <FiCalendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span>Joined {fmtDateOnly(createdAt)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Attributes / Tags */}
                    <div className="flex flex-wrap lg:flex-col lg:items-end gap-2 text-xs text-slate-500 border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Last Login:</span>
                            <span className="font-medium text-slate-700 whitespace-nowrap">{lastLogin ? fmt(lastLogin) : "Never logged in"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Auth Method:</span>
                            <span className="font-medium text-slate-700 whitespace-nowrap">{authMethodString}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Language:</span>
                            <span className="font-medium text-slate-700 uppercase whitespace-nowrap">{language || "EN"}</span>
                        </div>
                        {dob && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">DOB:</span>
                                <span className="font-medium text-slate-700 whitespace-nowrap">{fmtDateOnly(dob)} {gender ? `(${gender})` : ""}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bio & Categories (if available) */}
                {(bio || (interestedCategories && interestedCategories.length > 0)) && (
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        {bio && (
                            <p className="text-slate-600 italic line-clamp-2 max-w-2xl">
                                "{bio}"
                            </p>
                        )}
                        {interestedCategories && interestedCategories.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-400 font-medium">Interests:</span>
                                {interestedCategories.map((c, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                        {typeof c === "object" ? (c.name || c.categoryName || "Category") : c}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── 3. Role-Based Minimalist Metrics Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {isCustomer ? (
                    <>
                        <MetricTile
                            label="Total Orders"
                            value={customerStats.totalBookings ?? bookings.length}
                            subtext={`${customerStats.paidBookings ?? bookings.filter(b => b.paymentStatus === 'PAID').length} paid`}
                            icon={FiShoppingBag}
                        />
                        <MetricTile
                            label="Total Spent"
                            value={`₮${(customerStats.totalSpent ?? 0).toLocaleString()}`}
                            subtext="Lifetime value"
                            icon={FiTrendingUp}
                        />
                        <MetricTile
                            label="Tickets"
                            value={customerStats.totalTicketsBought ?? 0}
                            subtext="Total passes"
                            icon={FiLayers}
                        />
                        <MetricTile
                            label="Events Attended"
                            value={customerStats.totalEventsAttended ?? 0}
                            subtext="Checked-in"
                            icon={FiCalendar}
                        />
                        <MetricTile
                            label="Courses"
                            value={customerStats.totalCoursesEnrolled ?? 0}
                            subtext="Enrolled"
                            icon={FiBookOpen}
                        />
                        <MetricTile
                            label="Following"
                            value={totalFollowing ?? 0}
                            subtext="Organizers"
                            icon={FiUsers}
                        />
                    </>
                ) : (
                    <>
                        <MetricTile
                            label="Events Hosted"
                            value={(events?.upcoming_events?.length || 0) + (events?.previous_events?.length || 0)}
                            subtext={`${events?.upcoming_events?.length || 0} active`}
                            icon={FiCalendar}
                        />
                        <MetricTile
                            label="Courses Added"
                            value={(courses?.upcoming_courses?.length || 0) + (courses?.previous_courses?.length || 0)}
                            subtext={`${courses?.upcoming_courses?.length || 0} active`}
                            icon={FiBookOpen}
                        />
                        <MetricTile
                            label="Tickets Sold"
                            value={events?.upcoming_events?.reduce((acc, ev) => acc + (ev.ticketSold || 0), 0) || 0}
                            subtext="Event passes"
                            icon={FiLayers}
                        />
                        <MetricTile
                            label="Total Earnings"
                            value={`₮${((netEarningEvents || 0) + (netEarningCourses || 0)).toLocaleString()}`}
                            subtext="Net revenue"
                            icon={FiTrendingUp}
                        />
                        <MetricTile
                            label="Followers"
                            value={totalFollowers ?? 0}
                            subtext="Audience"
                            icon={FiUsers}
                        />
                        <MetricTile
                            label="Payout Balance"
                            value={`₮${(payoutBalance || 0).toLocaleString()}`}
                            subtext="Available"
                            icon={FiCreditCard}
                        />
                    </>
                )}
            </div>

            {/* ── 4. Main Content Area with Clean Segmented Tabs ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Minimal Tab Bar */}
                <div className="flex items-center gap-1 border-b border-slate-200 px-6 pt-3 overflow-x-auto">
                    {isCustomer ? (
                        <>
                            <button
                                onClick={() => setActiveTab("bookings")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "bookings"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiShoppingBag className="w-3.5 h-3.5" />
                                <span>Orders & Bookings</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    {bookings.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab("verifications")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "verifications"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiShield className="w-3.5 h-3.5" />
                                <span>Security & Verification</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "reviews"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiStar className="w-3.5 h-3.5" />
                                <span>Reviews Written</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    {userReviews.length}
                                </span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setActiveTab("events")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "events"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiCalendar className="w-3.5 h-3.5" />
                                <span>Events</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    {(events?.upcoming_events?.length || 0) + (events?.previous_events?.length || 0)}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab("courses")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "courses"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiBookOpen className="w-3.5 h-3.5" />
                                <span>Courses</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    {(courses?.upcoming_courses?.length || 0) + (courses?.previous_courses?.length || 0)}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab("business")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "business"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiFileText className="w-3.5 h-3.5" />
                                <span>Business Profile & Docs</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("financial")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "financial"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiCreditCard className="w-3.5 h-3.5" />
                                <span>Financials & Payouts</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className={`pb-3 px-3 text-xs font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === "reviews"
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                <FiStar className="w-3.5 h-3.5" />
                                <span>Reviews</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                                    {userReviews.length}
                                </span>
                            </button>
                        </>
                    )}
                </div>

                {/* Tab Panes */}
                <div className="p-6">

                    {/* ── CUSTOMER: ORDERS & BOOKINGS ── */}
                    {isCustomer && activeTab === "bookings" && (
                        <div className="space-y-4">
                            {/* Filter bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                                    {["ALL", "PAID", "PENDING", "CANCELLED", "REFUNDED"].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setBookingFilter(st)}
                                            className={`px-3 py-1 rounded-md transition cursor-pointer text-xs font-semibold ${bookingFilter === st
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-slate-500">
                                    {filteredBookings.length} order{filteredBookings.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {filteredBookings.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                                <th className="py-3 px-4">Order ID</th>
                                                <th className="py-3 px-4">Item / Event</th>
                                                <th className="py-3 px-4">Type</th>
                                                <th className="py-3 px-4">Qty</th>
                                                <th className="py-3 px-4">Amount</th>
                                                <th className="py-3 px-4">Payment</th>
                                                <th className="py-3 px-4">Check-in</th>
                                                <th className="py-3 px-4">Date</th>
                                                <th className="py-3 px-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredBookings.map((bk) => (
                                                <tr key={bk._id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                                                        {bk.bookingId}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={bk.posterImage || "/sidebar-logo.svg"}
                                                                alt=""
                                                                className="w-8 h-8 rounded-lg object-cover bg-slate-100 flex-shrink-0 border border-slate-200/60"
                                                                onError={(e) => {
                                                                    e.target.src = "/sidebar-logo.svg";
                                                                }}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 truncate max-w-xs">{bk.title}</p>
                                                                {bk.venue && (
                                                                    <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                                                        {typeof bk.venue === "object" ? (bk.venue.name || bk.venue.address || "Venue") : bk.venue}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                                            {bk.bookingType}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-slate-700">
                                                        {bk.qty || bk.quantity || 1}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-slate-900">
                                                        ₮{(bk.totalAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(bk.status || bk.paymentStatus) === "PAID"
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                                            : (bk.status || bk.paymentStatus) === "PENDING"
                                                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                                            }`}>
                                                            {bk.status || bk.paymentStatus || "PAID"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${(bk.checkedInQty > 0 || bk.checkInStatus || bk.tickets?.some((t) => t.isCheckedIn))
                                                            ? "bg-teal-50 text-teal-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                            {(bk.checkedInQty > 0 || bk.checkInStatus || bk.tickets?.some((t) => t.isCheckedIn)) ? "Checked In" : "Not Checked In"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                                        {fmtDateOnly(bk.createdAt || bk.date || bk.bookingDate)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {bk.eventId && (
                                                            <button
                                                                onClick={() => navigate(`/events/${bk.eventId}`)}
                                                                className="text-slate-600 hover:text-slate-900 text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span>View</span>
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        {bk.courseId && (
                                                            <button
                                                                onClick={() => navigate(`/courses/${bk.courseId}`)}
                                                                className="text-slate-600 hover:text-slate-900 text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <span>View</span>
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                                    <FiShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-slate-600">No bookings match the selected criteria.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── CUSTOMER: SECURITY & VERIFICATIONS ── */}
                    {isCustomer && activeTab === "verifications" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Verifications */}
                            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <FiShield className="w-4 h-4 text-slate-400" /> Contact Verifications
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-800">Email Address</p>
                                            <p className="text-slate-500 text-[11px] mt-0.5">{email || "Not provided"}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                            {isVerified ? "VERIFIED" : "UNVERIFIED"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-800">Mobile Phone</p>
                                            <p className="text-slate-500 text-[11px] mt-0.5">{contactNumber ? `${countryCode || ""} ${contactNumber}` : "Not provided"}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${contactNumber ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                                            {contactNumber ? "PROVIDED" : "MISSING"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Timeline & Meta */}
                            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <FiClock className="w-4 h-4 text-slate-400" /> Account Timeline & Metadata
                                </h3>
                                <div className="space-y-2.5 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Account Created</span>
                                        <span className="font-medium text-slate-800">{fmt(createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Last Login</span>
                                        <span className="font-medium text-slate-800">{lastLogin ? fmt(lastLogin) : "Never"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Last Seen</span>
                                        <span className="font-medium text-slate-800">{lastSeen ? fmt(lastSeen) : "Never"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                                        <span className="text-slate-500">Timezone</span>
                                        <span className="font-medium text-slate-800">{timeZone || "UTC / Device Default"}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-slate-500">Authentication</span>
                                        <span className="font-medium text-slate-800">{authMethodString}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ORGANIZER: EVENTS ── */}
                    {isOrganizer && activeTab === "events" && (
                        <div className="space-y-6">
                            {/* Upcoming Events */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Upcoming & Live Events ({events?.upcoming_events?.length || 0})
                                    </h4>
                                </div>
                                {events?.upcoming_events && events.upcoming_events.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {events.upcoming_events.map((ev) => (
                                            <div key={ev._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={ev.image || "/sidebar-logo.svg"}
                                                        alt=""
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                                                        onError={(e) => { e.target.src = "/sidebar-logo.svg"; }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-900 text-xs truncate">{ev.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{ev.category || "Event"}</p>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">{fmtDateOnly(ev.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                                    <span className="text-slate-500">Sold: <strong className="text-slate-800">{ev.ticketSold || 0}</strong></span>
                                                    <button
                                                        onClick={() => navigate(`/events/${ev._id}`)}
                                                        className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Details</span>
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-3">No upcoming events found.</p>
                                )}
                            </div>

                            {/* Past Events */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Past Events ({events?.previous_events?.length || 0})
                                </h4>
                                {events?.previous_events && events.previous_events.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {events.previous_events.map((ev) => (
                                            <div key={ev._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={ev.image || "/sidebar-logo.svg"}
                                                        alt=""
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0 grayscale"
                                                        onError={(e) => { e.target.src = "/sidebar-logo.svg"; }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-800 text-xs truncate">{ev.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{ev.category || "Event"}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{fmtDateOnly(ev.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                                                    <span className="text-slate-500">Sold: <strong className="text-slate-700">{ev.ticketSold || 0}</strong></span>
                                                    <button
                                                        onClick={() => navigate(`/events/${ev._id}`)}
                                                        className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Details</span>
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-3">No past events recorded.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ORGANIZER: COURSES ── */}
                    {isOrganizer && activeTab === "courses" && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Ongoing & Active Courses ({courses?.upcoming_courses?.length || 0})
                                </h4>
                                {courses?.upcoming_courses && courses.upcoming_courses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {courses.upcoming_courses.map((c) => (
                                            <div key={c._id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={c.image || "/sidebar-logo.svg"}
                                                        alt=""
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                                                        onError={(e) => { e.target.src = "/sidebar-logo.svg"; }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-900 text-xs truncate">{c.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{c.category || "Course"}</p>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">{fmtDateOnly(c.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                                    <span className="text-slate-500">Enrolled: <strong className="text-slate-800">{c.ticketSold || 0}</strong></span>
                                                    <button
                                                        onClick={() => navigate(`/courses/${c._id}`)}
                                                        className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Details</span>
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-3">No active courses found.</p>
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Past Courses ({courses?.previous_courses?.length || 0})
                                </h4>
                                {courses?.previous_courses && courses.previous_courses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {courses.previous_courses.map((c) => (
                                            <div key={c._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={c.image || "/sidebar-logo.svg"}
                                                        alt=""
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0 grayscale"
                                                        onError={(e) => { e.target.src = "/sidebar-logo.svg"; }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-slate-800 text-xs truncate">{c.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{c.category || "Course"}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{fmtDateOnly(c.date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                                                    <span className="text-slate-500">Enrolled: <strong className="text-slate-700">{c.ticketSold || 0}</strong></span>
                                                    <button
                                                        onClick={() => navigate(`/courses/${c._id}`)}
                                                        className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Details</span>
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-3">No past courses recorded.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ORGANIZER: BUSINESS PROFILE & DOCUMENTS ── */}
                    {isOrganizer && activeTab === "business" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Business Profile */}
                                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                        <FiFileText className="w-4 h-4 text-slate-400" /> Business Identity
                                    </h4>
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500">Business Name</span>
                                            <span className="font-semibold text-slate-800">{businessName || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500">Registration #</span>
                                            <span className="font-mono font-medium text-slate-800">{businessRegisterNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                                            <span className="text-slate-500">Website</span>
                                            {website ? (
                                                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-slate-900 underline inline-flex items-center gap-1">
                                                    <span>{website}</span>
                                                    <FiExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">N/A</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between py-1.5">
                                            <span className="text-slate-500">Verification Status</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAllVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                                {isAllVerified ? "FULLY APPROVED" : "PENDING / INCOMPLETE"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Identity Verification Documents */}
                                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                        <FiShield className="w-4 h-4 text-slate-400" /> Identity Documents
                                    </h4>
                                    {idDoc ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-700">National ID Document</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                    {idDoc.status || "SUBMITTED"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                {idDoc.frontImage && (
                                                    <div
                                                        onClick={() => setImageModal(idDoc.frontImage)}
                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                                                    >
                                                        <img
                                                            src={idDoc.frontImage}
                                                            alt="ID Front"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                        />
                                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                                                            Front View
                                                        </span>
                                                    </div>
                                                )}
                                                {idDoc.backImage && (
                                                    <div
                                                        onClick={() => setImageModal(idDoc.backImage)}
                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                                                    >
                                                        <img
                                                            src={idDoc.backImage}
                                                            alt="ID Back"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                        />
                                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                                                            Back View
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : licenceDoc ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-700">Driving Licence Document</span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                    {licenceDoc.status || "SUBMITTED"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                {licenceDoc.frontImage && (
                                                    <div
                                                        onClick={() => setImageModal(licenceDoc.frontImage)}
                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                                                    >
                                                        <img
                                                            src={licenceDoc.frontImage}
                                                            alt="Licence Front"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                        />
                                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                                                            Front View
                                                        </span>
                                                    </div>
                                                )}
                                                {licenceDoc.backImage && (
                                                    <div
                                                        onClick={() => setImageModal(licenceDoc.backImage)}
                                                        className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                                                    >
                                                        <img
                                                            src={licenceDoc.backImage}
                                                            alt="Licence Back"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                                        />
                                                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                                                            Back View
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic py-2">No identity documents submitted.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ORGANIZER: FINANCIALS & PAYOUTS ── */}
                    {isOrganizer && activeTab === "financial" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                    <p className="text-[11px] font-semibold uppercase text-slate-400">Events Revenue</p>
                                    <p className="text-xl font-bold text-slate-900 mt-1">₮{(netEarningEvents || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                    <p className="text-[11px] font-semibold uppercase text-slate-400">Courses Revenue</p>
                                    <p className="text-xl font-bold text-slate-900 mt-1">₮{(netEarningCourses || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white">
                                    <p className="text-[11px] font-semibold uppercase text-slate-400">Lifetime Revenue</p>
                                    <p className="text-xl font-bold text-white mt-1">₮{((netEarningEvents || 0) + (netEarningCourses || 0)).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <FiCreditCard className="w-4 h-4 text-slate-400" /> Connected Bank Accounts & Payout Destination
                                </h4>

                                {verifications?.bankVerification ? (
                                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-900">{verifications.bankVerification.bankName || "Bank"}</p>
                                            <p className="text-slate-500 mt-0.5">
                                                Holder: <strong>{verifications.bankVerification.bankHolderName || "N/A"}</strong>
                                            </p>
                                            <p className="text-slate-500">
                                                Account #: <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">{verifications.bankVerification.accountNumber || "N/A"}</code>
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${verifications.bankVerification.status === "verified" || verifications.bankVerification.status === "approved"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                            }`}>
                                            {verifications.bankVerification.status?.toUpperCase() || "PENDING"}
                                        </span>
                                    </div>
                                ) : bankAccounts.length > 0 ? (
                                    <div className="space-y-3">
                                        {bankAccounts.map((acc, idx) => (
                                            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{acc.bankName}</p>
                                                    <p className="text-slate-500">Account: {acc.accountNumber} ({acc.holderName})</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic py-2">No bank accounts linked yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── REVIEWS (BOTH CUSTOMER & ORGANIZER) ── */}
                    {activeTab === "reviews" && (
                        <div className="space-y-4">
                            {userReviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {userReviews.map((rev) => (
                                        <div key={rev._id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-900 truncate">{rev.entityTitle}</span>
                                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                    <FiStar className="fill-amber-400 w-3 h-3" />
                                                    <span>{rev.rating}/5</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 italic">"{rev.review}"</p>
                                            <p className="text-[10px] text-slate-400">{fmtDateOnly(rev.createdAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
                                    <FiStar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-slate-600">No reviews have been submitted yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox / Modal for Document Preview */}
            {imageModal && (
                <div
                    onClick={() => setImageModal(null)}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
                >
                    <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
                        <img
                            src={imageModal}
                            alt="Document Preview"
                            className="max-h-[80vh] w-auto object-contain mx-auto rounded-lg"
                        />
                        <div className="text-center py-2 text-xs text-slate-500">
                            Click anywhere to close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDetail;
