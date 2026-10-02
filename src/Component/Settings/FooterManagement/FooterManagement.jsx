import React, { useState, useEffect, useCallback } from "react";
import authAxiosClient from "../../../api/authAxiosClient";
import { FiPlus, FiTrash2, FiSave, FiExternalLink, FiLink, FiLayout } from "react-icons/fi";

// ─── Default link structure ───────────────────────────────────────────────────
const DEFAULT_FOOTER_LINKS = {
  explore: [
    { label: "Events", href: "/Explore" },
    { label: "Courses", href: "/Programs-Listing" },
    { label: "Organizers", href: "/Organizers" },
  ],
  organizer: [
    { label: "Become an organizer", href: "/register?role=organizer" },
    { label: "Partner with us", href: "/#partner" },
    { label: "Dashboard", href: "/Dashboard" },
  ],
  help: [
    { label: "Contact Us", href: "/contact-us" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const DEFAULT_SOCIAL = { instagram: "", facebook: "", youtube: "" };

// ─── Column Editor ────────────────────────────────────────────────────────────
const ColumnCard = ({ title, links, colKey, onLinksChange }) => {
  const handleChange = (idx, field, val) => {
    const updated = [...links];
    updated[idx] = { ...updated[idx], [field]: val };
    onLinksChange(colKey, updated);
  };
  const handleAdd = () => onLinksChange(colKey, [...links, { label: "", href: "" }]);
  const handleDelete = (idx) => onLinksChange(colKey, links.filter((_, i) => i !== idx));

  return (
    <div className="flex-1 min-w-0 border border-gray-200 rounded-xl p-5 bg-gray-50">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-md px-3 py-1.5 hover:bg-teal-100 transition-colors"
        >
          <FiPlus size={11} /> Add link
        </button>
      </div>

      {links.length === 0 && (
        <p className="text-sm text-gray-400 italic py-2">No links yet. Click "Add link".</p>
      )}

      <div className="space-y-3">
        {links.map((link, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
            {/* Label row */}
            <div className="mb-2">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">Label</label>
              <input
                type="text"
                placeholder="e.g. Events"
                value={link.label}
                onChange={(e) => handleChange(idx, "label", e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
            {/* URL row */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. /Explore"
                  value={link.href}
                  onChange={(e) => handleChange(idx, "href", e.target.value)}
                  className="flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) =>
  toast ? (
    <div
      className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border transition-all ${
        toast.type === "error"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      {toast.msg}
    </div>
  ) : null;

// ─── Main Component ───────────────────────────────────────────────────────────
const FooterManagement = () => {
  const [social, setSocial] = useState(DEFAULT_SOCIAL);
  const [footerLinks, setFooterLinks] = useState(DEFAULT_FOOTER_LINKS);
  const [loading, setLoading] = useState(true);
  const [savingSocial, setSavingSocial] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [socialRes, footerRes] = await Promise.allSettled([
        authAxiosClient.get("/globalsetting/SOCIAL_LINKS"),
        authAxiosClient.get("/globalsetting/FOOTER_LINKS"),
      ]);
      if (socialRes.status === "fulfilled" && socialRes.value?.data?.status) {
        setSocial({ ...DEFAULT_SOCIAL, ...socialRes.value.data.data?.value });
      }
      if (footerRes.status === "fulfilled" && footerRes.value?.data?.status) {
        setFooterLinks({ ...DEFAULT_FOOTER_LINKS, ...footerRes.value.data.data?.value });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLinksChange = (colKey, newLinks) => {
    setFooterLinks((prev) => ({ ...prev, [colKey]: newLinks }));
  };

  const handleSaveSocial = async () => {
    for (const [field, val] of Object.entries(social)) {
      if (val.trim() && !val.trim().startsWith("http://") && !val.trim().startsWith("https://")) {
        showToast(`${field}: URL must start with http:// or https://`, "error");
        return;
      }
    }
    setSavingSocial(true);
    try {
      await authAxiosClient.post("/globalsetting/upsert", {
        key: "SOCIAL_LINKS",
        value: social,
        description: "Social media links shown in the footer",
      });
      showToast("Social links saved!");
    } catch {
      showToast("Failed to save social links", "error");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSaveFooterLinks = async () => {
    for (const [col, links] of Object.entries(footerLinks)) {
      for (const [i, link] of links.entries()) {
        if (!link.label.trim()) { showToast(`${col} — row ${i + 1}: Label required`, "error"); return; }
        if (!link.href.trim()) { showToast(`${col} — row ${i + 1}: URL required`, "error"); return; }
      }
    }
    setSavingLinks(true);
    try {
      await authAxiosClient.post("/globalsetting/upsert", {
        key: "FOOTER_LINKS",
        value: footerLinks,
        description: "Navigation links in the site footer columns",
      });
      showToast("Footer links saved!");
    } catch {
      showToast("Failed to save footer links", "error");
    } finally {
      setSavingLinks(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading footer settings...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <Toast toast={toast} />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiLayout className="text-teal-600" size={20} />
          <h1 className="text-xl font-bold text-gray-800">Footer Management</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage navigation links and social media URLs shown in the site footer.
        </p>
      </div>

      {/* ── Social Links ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FiLink className="text-teal-600" size={15} />
          <h2 className="text-base font-bold text-gray-800">Social Media Links</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Leave blank to hide the icon from the footer. Must start with <code className="bg-gray-100 px-1 rounded">https://</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/bondy.mn" },
            { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/bondy.mn" },
            { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/@bondy" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {label}
              </label>
              <div className="relative">
                <FiExternalLink
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="url"
                  placeholder={placeholder}
                  value={social[key]}
                  onChange={(e) => setSocial((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSocial}
          disabled={savingSocial}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          <FiSave size={14} />
          {savingSocial ? "Saving..." : "Save Social Links"}
        </button>
      </div>

      {/* ── Footer Nav Columns ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FiLayout className="text-teal-600" size={15} />
          <h2 className="text-base font-bold text-gray-800">Footer Navigation Columns</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Edit links for each footer column. Internal links start with <code className="bg-gray-100 px-1 rounded">/</code>. External links need a full URL.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <ColumnCard
            title="Explore"
            colKey="explore"
            links={footerLinks.explore || []}
            onLinksChange={handleLinksChange}
          />
          <ColumnCard
            title="Organizer"
            colKey="organizer"
            links={footerLinks.organizer || []}
            onLinksChange={handleLinksChange}
          />
          <ColumnCard
            title="Help"
            colKey="help"
            links={footerLinks.help || []}
            onLinksChange={handleLinksChange}
          />
        </div>

        <button
          onClick={handleSaveFooterLinks}
          disabled={savingLinks}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          <FiSave size={14} />
          {savingLinks ? "Saving..." : "Save Footer Links"}
        </button>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-sm font-semibold text-teal-800">Live update</p>
          <p className="text-xs text-teal-700 mt-0.5">
            Changes are applied immediately. Refresh the frontend site to see updates in the footer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FooterManagement;
