import React, { useEffect, useRef } from "react";
import { FiAlertTriangle, FiTrash2, FiInfo, FiCheckCircle, FiX } from "react-icons/fi";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'primary' | 'info'
  loading = false,
}) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 60);

    // Prevent body scroll when modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <FiTrash2 className="w-6 h-6 text-red-600" />,
      iconBg: "bg-red-50 border-red-100",
      accentBar: "bg-gradient-to-r from-red-500 to-rose-600",
      confirmBtn:
        "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 focus:ring-red-500",
    },
    warning: {
      icon: <FiAlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-50 border-amber-100",
      accentBar: "bg-gradient-to-r from-amber-400 to-amber-600",
      confirmBtn:
        "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 focus:ring-amber-500",
    },
    primary: {
      icon: <FiCheckCircle className="w-6 h-6 text-[#23ada4]" />,
      iconBg: "bg-teal-50 border-teal-100",
      accentBar: "bg-gradient-to-r from-[#23ada4] to-[#178c82]",
      confirmBtn:
        "bg-[#23ada4] hover:bg-[#1ca398] text-white shadow-md shadow-teal-500/25 focus:ring-teal-500",
    },
    info: {
      icon: <FiInfo className="w-6 h-6 text-[#23ada4]" />,
      iconBg: "bg-teal-50 border-teal-100",
      accentBar: "bg-gradient-to-r from-[#23ada4] to-[#178c82]",
      confirmBtn:
        "bg-[#23ada4] hover:bg-[#1ca398] text-white shadow-md shadow-teal-500/25 focus:ring-teal-500",
    },
  }[variant] || {
    icon: <FiAlertTriangle className="w-6 h-6 text-amber-600" />,
    iconBg: "bg-amber-50 border-amber-100",
    accentBar: "bg-gradient-to-r from-[#23ada4] to-[#178c82]",
    confirmBtn:
      "bg-[#23ada4] hover:bg-[#1ca398] text-white shadow-md shadow-teal-500/25",
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7 transform transition-all duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
        }}
      >
        {/* Top Brand Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.accentBar}`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pt-1">
          {/* Variant Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${config.iconBg} shadow-xs`}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer flex items-center gap-2 ${config.confirmBtn} disabled:opacity-50`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
