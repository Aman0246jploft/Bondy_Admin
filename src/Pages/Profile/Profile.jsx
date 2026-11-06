import React, { useState, useEffect, useRef } from "react";
import {
    FiCamera,
    FiLock,
    FiUser,
    FiCheck,
    FiAlertCircle,
    FiEye,
    FiEyeOff,
    FiMail,
    FiShield
} from "react-icons/fi";
import { toast } from "react-toastify";
import userApi from "../../api/userApi";
import authAxiosClient from "../../api/authAxiosClient";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const Profile = () => {
    const { theme } = useTheme();
    const fileInputRef = useRef(null);

    // Profile state
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        profileImage: "",
        role: "",
    });

    const [imagePreview, setImagePreview] = useState("");

    // Password state
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordSubmitted, setPasswordSubmitted] = useState(false);

    // Fetch self profile
    const fetchProfile = async () => {
        setLoadingProfile(true);
        try {
            const res = await userApi.getSelfProfile();
            if (res.data?.status && res.data.data?.user) {
                const u = res.data.data.user;
                setProfile({
                    firstName: u.firstName || "",
                    lastName: u.lastName || "",
                    email: u.email || "",
                    profileImage: u.profileImage || "",
                    role: u.userRole || u.role || "SUPER_ADMIN",
                });
                setImagePreview(u.profileImage || "");
            }
        } catch (err) {
            console.error("Error loading profile:", err);
            toast.error(err.response?.data?.message || "Failed to load profile");
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle Image file selection & upload
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check: 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be under 5MB");
            return;
        }

        // Preview local
        const localPreviewUrl = URL.createObjectURL(file);
        setImagePreview(localPreviewUrl);

        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("files", file);

        try {
            const res = await authAxiosClient.post("/user/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.status) {
                const uploadedPath = res.data.data?.files?.[0] || res.data.data?.fileUrl;
                setProfile((prev) => ({ ...prev, profileImage: uploadedPath }));
                toast.success("Profile photo uploaded! Click Save to apply changes.");
            } else {
                toast.error(res.data?.message || "Failed to upload photo");
            }
        } catch (err) {
            console.error("Photo upload error:", err);
            toast.error(err.response?.data?.message || "Image upload failed");
            setImagePreview(profile.profileImage || "");
        } finally {
            setUploadingImage(false);
        }
    };

    // Save profile changes (Name, Profile Photo)
    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (!profile.firstName.trim()) {
            toast.error("First name cannot be empty");
            return;
        }

        const nameRegex = /^[A-Za-zА-Яа-яӨөҮүЁё\s]+$/;
        if (!nameRegex.test(profile.firstName.trim())) {
            toast.error("First name can only contain letters");
            return;
        }
        if (profile.lastName && !nameRegex.test(profile.lastName.trim())) {
            toast.error("Last name can only contain letters");
            return;
        }

        setSavingProfile(true);
        try {
            const payload = {
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
            };

            if (profile.profileImage) {
                // If the url contains /uploads/, store the relative path for backend consistency
                if (profile.profileImage.includes("/uploads/")) {
                    const rel = profile.profileImage.split("/uploads/").pop();
                    payload.profileImage = `uploads/${rel}`;
                } else {
                    payload.profileImage = profile.profileImage;
                }
            }

            const res = await userApi.updateProfile(payload);
            if (res.data?.status) {
                toast.success("Profile updated successfully!");
                // Trigger profile updated event so Header refreshes
                window.dispatchEvent(new Event("admin_profile_updated"));
            } else {
                toast.error(res.data?.message || "Failed to update profile");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    // Password validation helper: 8-15 characters, uppercase, lowercase, number, special character, no spaces
    const validatePasswordFormat = (password) => {
        if (password.length < 8 || password.length > 15) {
            return "Password must be between 8 and 15 characters long";
        }
        if (/\s/.test(password)) {
            return "Password cannot contain spaces";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter (A-Z)";
        }
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter (a-z)";
        }
        if (!/\d/.test(password)) {
            return "Password must contain at least one number (0-9)";
        }
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
            return "Password must contain at least one special character (!@#$%^&* etc.)";
        }
        return null;
    };

    // Change Password submit
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordSubmitted(true);

        if (!passwordData.oldPassword) {
            toast.error("Please enter your current password");
            return;
        }
        if (!passwordData.newPassword) {
            toast.error("Please enter a new password");
            return;
        }

        const formatError = validatePasswordFormat(passwordData.newPassword);
        if (formatError) {
            toast.error(formatError);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New password and confirmation do not match");
            return;
        }

        setUpdatingPassword(true);
        try {
            const res = await userApi.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword,
            });

            if (res.data?.status) {
                toast.success(res.data?.message || "Password changed successfully!");
                setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setPasswordSubmitted(false);
            } else {
                toast.error(res.data?.message || "Failed to change password");
            }
        } catch (err) {
            console.error("Error changing password:", err);
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="w-full space-y-4 pb-12">
            {/* Hidden image upload input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />

            {/* ── 1. Page Header & Actions Bar (Matches other admin pages) ── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b"
                style={{ borderColor: theme.colors.border }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#23ada4] shadow-xs">
                        <FiUser className="w-5 h-5 text-[#23ada4]" />
                    </div>
                    <div>
                        <h1
                            className="text-xl font-bold tracking-tight"
                            style={{ color: theme.colors.textPrimary }}
                        >
                            Account Profile & Security
                        </h1>
                        <p
                            className="text-xs text-slate-500 mt-0.5"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Manage your administrator profile details, avatar photo, and security credentials.
                        </p>
                    </div>
                </div>

                {/* <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Administrator
                    </span>
                </div> */}
            </div>

            {/* ── 2. Top Profile Header Banner Card (Full Width) ── */}
            <div
                className="p-5 sm:p-6 rounded-2xl border shadow-xs transition-all"
                style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.border,
                }}
            >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left min-w-0">
                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-xs bg-slate-100 flex items-center justify-center">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Admin avatar"
                                        className="w-full h-full object-cover"
                                        onError={() => setImagePreview("/Profileimage.png")}
                                    />
                                ) : (
                                    <img
                                        src="/sidebar-logo.svg"
                                        alt="Admin avatar default"
                                        className="w-10 h-10 object-contain"
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="absolute bottom-0 right-0 p-1.5 bg-[#23ada4] hover:bg-[#1ca398] text-white rounded-full shadow-md transition-transform hover:scale-105 disabled:opacity-50 cursor-pointer"
                                title="Upload photo"
                            >
                                <FiCamera className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Admin Identity */}
                        <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                <h2
                                    className="text-xl font-bold tracking-tight"
                                    style={{ color: theme.colors.textPrimary }}
                                >
                                    {`${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Administrator"}
                                </h2>
                                {/* <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                                    {profile.role || "SUPER_ADMIN"}
                                </span> */}
                            </div>
                            <div
                                className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <FiMail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{profile.email || "—"}</span>
                                </span>
                                {/* <span className="inline-flex items-center gap-1.5">
                                    <FiShield className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Super Admin Privileges</span>
                                </span> */}
                            </div>
                        </div>
                    </div>

                    {/* Actions / Upload button */}
                    {/* <div className="flex flex-col items-center sm:items-end gap-1 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                            style={{
                                borderColor: theme.colors.border,
                                color: theme.colors.textPrimary,
                                backgroundColor: theme.colors.tertiary || "#ffffff",
                            }}
                        >
                            <FiCamera className="w-3.5 h-3.5 text-[#23ada4]" />
                            <span>{uploadingImage ? "Uploading..." : "Change Avatar"}</span>
                        </button>
                        <span className="text-[11px]" style={{ color: theme.colors.textMuted }}>
                            JPG, PNG, WebP up to 5MB
                        </span>
                    </div> */}
                </div>
            </div>

            {/* ── 3. Main Form Cards Grid (Full Width 2-Column Grid) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. General Profile Info Card */}
                <div
                    className="rounded-2xl border shadow-xs transition-all overflow-hidden"
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border,
                    }}
                >
                    {/* Card Header */}
                    <div
                        className="flex items-center gap-3 p-5 border-b"
                        style={{ borderColor: theme.colors.border }}
                    >
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#23ada4] shadow-xs">
                            <FiUser className="w-4 h-4 text-[#23ada4]" />
                        </div>
                        <div>
                            <h2
                                className="text-sm font-bold tracking-tight"
                                style={{ color: theme.colors.textPrimary }}
                            >
                                Profile Details
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                Personal information and administrator identity
                            </p>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleProfileSubmit} className="p-5 sm:p-6 space-y-4">
                        {/* First Name */}
                        <div>
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                placeholder="Enter first name"
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#23ada4] transition shadow-xs"
                                style={{
                                    backgroundColor: theme.colors.tertiary || "#ffffff",
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                placeholder="Enter last name"
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#23ada4] transition shadow-xs"
                                style={{
                                    backgroundColor: theme.colors.tertiary || "#ffffff",
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>

                        {/* Email Address (Read-only) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    className="block text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    Email Address
                                </label>

                            </div>
                            <input
                                type="email"
                                disabeled
                                readOnly
                                value={profile.email}
                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-100/70 text-slate-500 cursor-not-allowed select-none opacity-85 shadow-xs"
                                style={{
                                    borderColor: theme.colors.border,
                                }}
                            />
                            <p
                                className="text-[11px] mt-1.5 flex items-center gap-1"
                                style={{ color: theme.colors.textMuted }}
                            >
                                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                Administrator email address cannot be modified.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingProfile || uploadingImage}
                                className="w-full py-2.5 px-4 bg-[#23ada4] hover:bg-[#1ca398] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {savingProfile ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-4 h-4" />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 2. Change Password Card */}
                <div
                    className="rounded-2xl border shadow-xs transition-all overflow-hidden"
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border,
                    }}
                >
                    {/* Card Header */}
                    <div
                        className="flex items-center gap-3 p-5 border-b"
                        style={{ borderColor: theme.colors.border }}
                    >
                        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#23ada4] shadow-xs">
                            <FiLock className="w-4 h-4 text-[#23ada4]" />
                        </div>
                        <div>
                            <h2
                                className="text-sm font-bold tracking-tight"
                                style={{ color: theme.colors.textPrimary }}
                            >
                                Change Password
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                Update your credentials to keep your administrator account safe
                            </p>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handlePasswordSubmit} className="p-5 sm:p-6 space-y-4">
                        {/* Current Password */}
                        <div>
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                Current Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    required
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                    placeholder="Enter current password"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#23ada4] transition shadow-xs"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                >
                                    {showOldPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="8-15 characters with mixed case & symbols"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#23ada4] transition shadow-xs"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                >
                                    {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Inline Validation Checklist */}
                            {((passwordSubmitted || passwordData.newPassword.length > 0) && validatePasswordFormat(passwordData.newPassword)) && (
                                <div className="mt-2 text-xs space-y-1 p-2.5 rounded-xl bg-red-50/80 border border-red-200/80 text-red-600">
                                    <div className="flex items-center gap-1.5 font-medium mb-1">
                                        <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Password requirements not met:</span>
                                    </div>
                                    <ul className="space-y-0.5 pl-5 list-disc text-[11px]">
                                        {(passwordData.newPassword.length < 8 || passwordData.newPassword.length > 15) && (
                                            <li>Must be between 8 and 15 characters</li>
                                        )}
                                        {/\s/.test(passwordData.newPassword) && (
                                            <li>Cannot contain spaces</li>
                                        )}
                                        {!/[A-Z]/.test(passwordData.newPassword) && (
                                            <li>Must include at least one uppercase letter (A-Z)</li>
                                        )}
                                        {!/[a-z]/.test(passwordData.newPassword) && (
                                            <li>Must include at least one lowercase letter (a-z)</li>
                                        )}
                                        {!/\d/.test(passwordData.newPassword) && (
                                            <li>Must include at least one number (0-9)</li>
                                        )}
                                        {!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(passwordData.newPassword) && (
                                            <li>Must include at least one special character (!@#$%^&* etc.)</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label
                                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                Confirm New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Re-enter new password"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#23ada4] transition shadow-xs"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                    <FiAlertCircle className="w-3.5 h-3.5" />
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Update Password Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={updatingPassword}
                                className="w-full py-2.5 px-4 bg-[#23ada4] hover:bg-[#1ca398] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {updatingPassword ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiLock className="w-4 h-4" />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
