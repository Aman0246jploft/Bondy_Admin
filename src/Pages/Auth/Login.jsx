import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { login } from "../../features/slices/userSlice";
import Button from "../../Component/Atoms/Button/Button";
import { useTheme } from "../../contexts/theme/hook/useTheme";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selector = useSelector((state) => state.user);
  const { theme } = useTheme();

  const primaryColor = theme?.colors?.buttonPrimary || "#0f766e";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Restore remembered email on initial mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("bondy_admin_remembered_email");
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail }));
      }
    } catch (_) { }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.email || !form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (rememberMe) {
      try {
        localStorage.setItem("bondy_admin_remembered_email", form.email.trim());
      } catch (_) { }
    } else {
      try {
        localStorage.removeItem("bondy_admin_remembered_email");
      } catch (_) { }
    }

    dispatch(login({ email: form.email.trim(), password: form.password }))
      .then((result) => {
        if (login.fulfilled.match(result)) {
          toast.success("Welcome back! Login Successful");
          navigate("/dashboard");
        } else {
          const { message, code } = result.payload || {};
          console.error(`Login failed [${code}]: ${message}`);
        }
      })
      .catch((error) => {
        console.error("Unexpected login error:", error);
        toast.error("Unexpected error occurred while signing in");
      });
  };

  const loading = selector?.loading || false;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#0b1320] text-slate-100 font-sans selection:bg-teal-600 selection:text-white px-4 py-8 relative overflow-hidden">
      {/* Subtle Ambient Vignette (Soft, not loud) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(15, 118, 110, 0.12) 0%, rgba(11, 19, 32, 0) 70%)",
        }}
      />

      {/* Top Spacer */}
      <div className="relative z-10" />

      {/* Main Centered Authentication Card */}
      <div className="w-full max-w-[420px] mx-auto my-auto relative z-10">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal-50/80 border border-teal-100/80 flex items-center justify-center p-2.5 mb-4 shadow-sm">
              <img
                src="/sidebar-logo.svg"
                alt="Bondy Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(15,118,110,0.2)]"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In to Bondy
            </h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Enter your credentials to access the admin console
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@bondy.mn"
                  disabled={loading}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none ${errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none ${errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-4 h-4" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: rememberMe ? primaryColor : "#ffffff",
                      borderColor: rememberMe ? primaryColor : "#cbd5e1",
                    }}
                  >
                    {rememberMe && <FiCheck className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                  Remember me
                </span>
              </label>

              <span className="text-[11px] text-slate-400">
                Encrypted Session
              </span>
            </div>

            {/* Submit Button (Theme Button) */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                loaderText="Signing in..."
                className="w-full h-11 text-sm font-medium rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <span>Sign In</span>
                <FiArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Security Subtext */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Authorized personnel only. Contact support if you need access.
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-slate-500 pt-4 relative z-10">
        © {new Date().getFullYear()} Bondy Platform. All rights reserved.
      </div>
    </div>
  );
}
