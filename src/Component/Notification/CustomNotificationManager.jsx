import React, { useState, useEffect, useCallback } from "react";
import {
  AiOutlineBell,
  AiOutlineTeam,
  AiOutlineUser,
  AiOutlineShop,
  AiOutlineSend,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineReload,
  AiOutlineLink,
  AiOutlineClockCircle,
  AiOutlineClose,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { FiUsers, FiUser, FiSend, FiAlertTriangle, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import notificationApi from "../../api/notificationApi";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const PRESET_LINKS = [
  { label: "None", value: "" },
  { label: "Events Page", value: "/events" },
  { label: "Courses Page", value: "/courses" },
  { label: "Profile", value: "/profile" },
  { label: "Contact Us", value: "/contact" },
];

const TARGET_CONFIG = {
  everyone: {
    label: "Everyone",
    sublabel: "All active customers & organizers",
    icon: AiOutlineTeam,
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    color: "#2563eb",
  },
  users: {
    label: "Users Only",
    sublabel: "Regular customers & attendees",
    icon: AiOutlineUser,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    color: "#059669",
  },
  organizers: {
    label: "Organizers Only",
    sublabel: "Event & course creators",
    icon: AiOutlineShop,
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    color: "#7c3aed",
  },
};

const CustomNotificationManager = () => {
  const { theme } = useTheme();

  // Form State
  const [target, setTarget] = useState("everyone");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [deepLink, setDeepLink] = useState("");

  // Recipient Counts
  const [counts, setCounts] = useState({ everyone: 0, users: 0, organizers: 0 });
  const [countsLoading, setCountsLoading] = useState(false);

  // History State
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState(null);

  // Fetch Recipient Counts
  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const res = await notificationApi.getRecipientCounts();
      if (res.data?.status && res.data?.data) {
        setCounts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch recipient counts:", err);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  // Fetch Notification History
  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await notificationApi.getNotificationHistory({ page, limit: historyLimit });
      if (res.data?.status && res.data?.data) {
        setHistory(res.data.data.logs || []);
        setHistoryTotal(res.data.data.total || 0);
        setHistoryPage(page);
      }
    } catch (err) {
      console.error("Failed to fetch notification history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit]);

  useEffect(() => {
    fetchCounts();
    fetchHistory(1);
  }, [fetchCounts, fetchHistory]);

  // Validation before opening confirmation
  const handleOpenConfirm = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a notification title.");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Title must be at least 2 characters.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a notification message.");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Message must be at least 5 characters.");
      return;
    }

    const currentCount = counts[target] || 0;
    if (currentCount === 0) {
      toast.warning(`Selected recipient group (${TARGET_CONFIG[target]?.label}) has 0 active recipients.`);
    }

    setShowConfirmModal(true);
  };

  // Perform actual broadcast send
  const handleSendNotification = async () => {
    setIsSending(true);
    try {
      const payload = {
        target,
        title: title.trim(),
        message: message.trim(),
        deepLink: deepLink.trim() || undefined,
        webLink: deepLink.trim() || undefined,
      };

      const res = await notificationApi.sendCustomNotification(payload);

      if (res.data?.status) {
        const sentCount = res.data?.data?.recipientCount || counts[target] || 0;
        toast.success(`Notification broadcasted successfully to ${sentCount} recipients!`);
        setShowConfirmModal(false);
        // Reset form
        setTitle("");
        setMessage("");
        setDeepLink("");
        // Refresh counts and history
        fetchCounts();
        fetchHistory(1);
      } else {
        toast.error(res.data?.message || "Failed to send notification.");
      }
    } catch (err) {
      console.error("Error sending custom notification:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to send notification.");
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = counts[target] ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: theme.colors.border }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shadow-sm border border-teal-100">
              <AiOutlineBell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.colors.textPrimary }}>
                Custom Notifications
              </h1>
              <p className="text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
                Send instant in-app alerts and push notifications to specific recipient groups.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchCounts();
            fetchHistory(historyPage);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
          style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
          title="Refresh statistics"
        >
          <AiOutlineReload className={`w-4 h-4 ${countsLoading ? "animate-spin text-teal-600" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* ── Audience Quick Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["everyone", "users", "organizers"]).map((key) => {
          const config = TARGET_CONFIG[key];
          const Icon = config.icon;
          const isSelected = target === key;
          const count = counts[key] ?? 0;

          return (
            <div
              key={key}
              onClick={() => setTarget(key)}
              className={`cursor-pointer rounded-xl p-5 border transition-all duration-200 relative overflow-hidden shadow-sm ${
                isSelected
                  ? "border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/40"
                  : "bg-white hover:border-gray-300 hover:shadow"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                  <p className="text-3xl font-extrabold mt-3 tracking-tight" style={{ color: theme.colors.textPrimary }}>
                    {countsLoading ? (
                      <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      count.toLocaleString()
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{config.sublabel}</p>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Main Composer & Preview Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border shadow-sm p-6 space-y-6" style={{ borderColor: theme.colors.border }}>
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
              <AiOutlineSend className="w-5 h-5 text-teal-600" />
              Compose Notification
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select audience, compose message, and confirm before dispatching to users.
            </p>
          </div>

          <form onSubmit={handleOpenConfirm} className="space-y-5">
            {/* Target Audience Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Select Recipients <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["everyone", "users", "organizers"]).map((key) => {
                  const config = TARGET_CONFIG[key];
                  const Icon = config.icon;
                  const isSelected = target === key;

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setTarget(key)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-teal-600 bg-teal-50 text-teal-900 font-semibold shadow-sm ring-1 ring-teal-600"
                          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-teal-700" : "text-gray-500"}`} />
                      <span className="text-xs font-semibold">{config.label}</span>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        ({(counts[key] ?? 0).toLocaleString()} users)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  2. Notification Title <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400 font-mono">
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled Maintenance Notice, New Feature Announcement..."
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400"
                style={{ borderColor: theme.colors.border }}
                required
              />
            </div>

            {/* Notification Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  3. Notification Body <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400 font-mono">
                  {message.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the full notification message that recipients will see..."
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400 resize-y"
                style={{ borderColor: theme.colors.border }}
                required
              />
            </div>

            {/* Deep Link / Action URL (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                4. Action Link / Deep Link <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <AiOutlineLink className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="e.g. /events, /courses, or custom path"
                  className="w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400"
                  style={{ borderColor: theme.colors.border }}
                />
              </div>

              {/* Quick Select Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-gray-400 mr-1">Quick presets:</span>
                {PRESET_LINKS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDeepLink(preset.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      deepLink === preset.value
                        ? "bg-teal-50 border-teal-300 text-teal-700 font-medium"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!title.trim() || !message.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-700"
              >
                <FiSend className="w-4 h-4" />
                Review & Send Notification
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Requires confirmation dialog before dispatching to {selectedCount.toLocaleString()} recipients.
              </p>
            </div>
          </form>
        </div>

        {/* Live Preview Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live End-User Preview
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                Real-time
              </span>
            </div>

            {/* Mobile Push Notification Mockup */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-4 shadow-xl text-white space-y-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1 border-b border-gray-700/60">
                <span className="flex items-center gap-1.5 font-medium">
                  <img src="/sidebar-logo.svg" alt="Bondy" className="w-4 h-4 rounded" />
                  BONDY APP
                </span>
                <span>Just now</span>
              </div>

              {/* Notification Banner */}
              <div className="bg-gray-800/90 backdrop-blur rounded-xl p-3.5 border border-gray-700/80 shadow-inner space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate">
                    {title.trim() || "Notification Title"}
                  </h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${TARGET_CONFIG[target]?.badgeColor}`}>
                    {TARGET_CONFIG[target]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                  {message.trim() || "Your notification body message will appear here exactly as recipients will read it on their devices..."}
                </p>
                {deepLink && (
                  <div className="pt-1 flex items-center gap-1 text-[11px] text-teal-400 font-medium">
                    <AiOutlineLink className="w-3 h-3" />
                    <span>Action: {deepLink}</span>
                  </div>
                )}
              </div>
            </div>

            {/* In-App Notification Card Mockup */}
            <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: theme.colors.border }}>
              <p className="text-xs font-semibold text-gray-500 mb-2">In-App Notification Item:</p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AiOutlineBell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {title.trim() || "Notification Title"}
                    </p>
                    <span className="text-[10px] text-gray-400">Now</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {message.trim() || "Notification body text..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200/60 flex items-start gap-3">
            <AiOutlineInfoCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Delivery Channels:</p>
              <p>
                Recipients receive an in-app notification in their notification feed, and users with active device tokens receive a mobile push notification simultaneously.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sent Notifications History Table ── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: theme.colors.border }}>
        <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: theme.colors.border }}>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.textPrimary }}>
              <AiOutlineClockCircle className="w-5 h-5 text-teal-600" />
              Broadcast History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Log of all custom notifications sent to users and organizers ({historyTotal} total).
            </p>
          </div>

          <button
            onClick={() => fetchHistory(historyPage)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 transition-all self-start sm:self-auto"
            style={{ borderColor: theme.colors.border, color: theme.colors.textSecondary }}
          >
            <AiOutlineReload className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin text-teal-600" : ""}`} />
            Refresh History
          </button>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-500" style={{ borderColor: theme.colors.border }}>
              <tr>
                <th className="py-3.5 px-5">Date & Time</th>
                <th className="py-3.5 px-5">Target Audience</th>
                <th className="py-3.5 px-5">Title</th>
                <th className="py-3.5 px-5">Message</th>
                <th className="py-3.5 px-5 text-center">Recipients</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    <AiOutlineReload className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading broadcast history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <AiOutlineBell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">No custom notifications sent yet</p>
                    <p className="text-xs text-gray-400 mt-1">Use the composer above to broadcast your first custom notification.</p>
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const targetConfig = TARGET_CONFIG[item.targetGroup] || TARGET_CONFIG.everyone;
                  const Icon = targetConfig.icon;
                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 whitespace-nowrap text-xs text-gray-600">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${targetConfig.badgeColor}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {targetConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600 max-w-sm truncate text-xs">
                        {item.message}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-gray-800">
                        {item.recipientCount?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <AiOutlineCheckCircle className="w-3 h-3" />
                          {item.status || "SENT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewDetailModal(item)}
                          className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg border border-teal-200 transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyTotal > historyLimit && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-gray-500" style={{ borderColor: theme.colors.border }}>
            <span>
              Showing page {historyPage} of {Math.ceil(historyTotal / historyLimit)} ({historyTotal} items)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={historyPage <= 1}
                onClick={() => fetchHistory(historyPage - 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={historyPage >= Math.ceil(historyTotal / historyLimit)}
                onClick={() => fetchHistory(historyPage + 1)}
                className="px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CONFIRMATION MODAL (REQUIRED BEFORE SENDING)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                <FiAlertTriangle className="w-6 h-6 text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Confirm Notification Broadcast</h3>
                <p className="text-xs text-teal-100 mt-1">
                  Please review the details below before sending. Once sent, notifications are immediately pushed to recipient devices.
                </p>
              </div>
              <button
                onClick={() => !isSending && setShowConfirmModal(false)}
                className="text-white/70 hover:text-white transition-colors"
                disabled={isSending}
              >
                <AiOutlineClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Audience Summary Box */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-600 text-white">
                    <AiOutlineTeam className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-teal-900">Target Audience</span>
                    <p className="text-sm font-bold text-teal-700">
                      {TARGET_CONFIG[target]?.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-teal-700 font-semibold">Active Recipients</span>
                  <p className="text-lg font-extrabold text-teal-900">
                    {selectedCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Title
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{title}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Message
                  </span>
                  <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                </div>

                {deepLink && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Action Link
                    </span>
                    <p className="text-xs font-mono text-teal-700 mt-0.5">{deepLink}</p>
                  </div>
                )}
              </div>

              {/* Warning Alert */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p>
                  <strong>Irreversible Action:</strong> This notification cannot be unsent or edited once broadcasted. All active recipients in the selected group will receive it.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3" style={{ borderColor: theme.colors.border }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Cancel / Edit
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={isSending}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <AiOutlineReload className="w-4 h-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Confirm & Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          VIEW DETAIL MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AiOutlineBell className="w-5 h-5 text-teal-600" />
                Broadcast Details
              </h3>
              <button
                onClick={() => setViewDetailModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AiOutlineClose className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Sent Date</span>
                <span className="font-medium text-gray-800">
                  {viewDetailModal.createdAt ? new Date(viewDetailModal.createdAt).toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Target Group</span>
                <span className="font-semibold text-teal-700 capitalize">
                  {TARGET_CONFIG[viewDetailModal.targetGroup]?.label || viewDetailModal.targetGroup}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Recipients Count</span>
                <span className="font-bold text-gray-900">
                  {viewDetailModal.recipientCount?.toLocaleString() || 0}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Title</span>
                <p className="font-bold text-gray-900 p-2.5 rounded-lg bg-gray-50 border">
                  {viewDetailModal.title}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-1">Message</span>
                <p className="text-xs text-gray-700 p-2.5 rounded-lg bg-gray-50 border whitespace-pre-wrap leading-relaxed">
                  {viewDetailModal.message}
                </p>
              </div>
              {viewDetailModal.deepLink && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold block mb-1">Action Link</span>
                  <p className="text-xs font-mono text-teal-700 p-2 rounded-lg bg-teal-50 border border-teal-200">
                    {viewDetailModal.deepLink}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end" style={{ borderColor: theme.colors.border }}>
              <button
                onClick={() => setViewDetailModal(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomNotificationManager;
