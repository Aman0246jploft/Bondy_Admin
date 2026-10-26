import React, { useState, useEffect, useRef } from "react";
import { FiCamera, FiLock, FiUser, FiCheck, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
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

    // if (loadingProfile) {
    //     return (
    //         <div className="flex items-center justify-center min-h-[400px]">
    //             <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
    //         </div>
    //     );
    // }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header Title */}
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: theme.colors.textPrimary }}
                >
                    Account Profile & Security
                </h1>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                    Manage your administrator details and update your credentials
                </p>
            </div>

            {/* Main Form Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. General Profile Info Card */}
                <div
                    className="p-6 rounded-2xl border shadow-sm transition-all"
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border,
                    }}
                >
                    <div className="flex items-center gap-3 pb-5 border-b" style={{ borderColor: theme.colors.border }}>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                            <FiUser className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                                Profile Details
                            </h2>
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                Personal information and profile picture
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
                        {/* Avatar photo change */}
                        <div className="flex flex-col items-center sm:flex-row sm:items-center gap-5">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
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
                                            className="w-12 h-12 object-contain"
                                        />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="absolute bottom-0 right-0 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-md transition-transform hover:scale-105 disabled:opacity-50"
                                    title="Upload photo"
                                >
                                    <FiCamera className="w-4 h-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            <div className="text-center sm:text-left">
                                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                    Profile Picture
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>
                                    JPG, PNG, WebP up to 5MB
                                </p>
                                {uploadingImage && (
                                    <p className="text-xs text-teal-600 font-medium mt-1 animate-pulse">
                                        Uploading photo...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* First Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                placeholder="Enter first name"
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                style={{
                                    backgroundColor: theme.colors.tertiary || "#ffffff",
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                placeholder="Enter last name"
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                style={{
                                    backgroundColor: theme.colors.tertiary || "#ffffff",
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>

                        {/* Email Address (Read-only - Not allowed to change) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                                    Email Address
                                </label>
                                {/* <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    Fixed / Read-only
                                </span> */}
                            </div>
                            <input
                                type="email"
                                disabled
                                readOnly
                                value={profile.email}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-100 text-slate-500 cursor-not-allowed select-none opacity-80"
                                style={{
                                    borderColor: theme.colors.border,
                                }}
                            />
                            {/* <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                Administrator email address cannot be modified.
                            </p> */}
                        </div>

                        {/* Save Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={savingProfile || uploadingImage}
                                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
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
                    className="p-6 rounded-2xl border shadow-sm transition-all"
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border,
                    }}
                >
                    <div className="flex items-center gap-3 pb-5 border-b" style={{ borderColor: theme.colors.border }}>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                            <FiLock className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                                Change Password
                            </h2>
                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                Update your password to keep your account safe
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                                Current Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    required
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                    placeholder="Enter current password"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showOldPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                                New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="8-15 chars, uppercase, lowercase, number, symbol"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Inline Validation Errors for New Password */}
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
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.colors.textSecondary }}>
                                Confirm New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    // placeholder="Re-enter new password"
                                    className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                                    style={{
                                        backgroundColor: theme.colors.tertiary || "#ffffff",
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
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
                                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
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
