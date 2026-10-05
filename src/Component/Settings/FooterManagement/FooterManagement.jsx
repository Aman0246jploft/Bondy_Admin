import React, { useState, useEffect, useCallback } from "react";
import authAxiosClient from "../../../api/authAxiosClient";
import { FiPlus, FiTrash2, FiSave, FiExternalLink, FiLink, FiLayout, FiGlobe } from "react-icons/fi";

// ─── Default link structure with bilingual support ───────────────────────────
const DEFAULT_COLUMN_TITLES = {
  explore: { en: "Explore", mn: "Судлах" },
  organizer: { en: "Organizer", mn: "Зохион байгуулагч" },
  help: { en: "Help", mn: "Тусламж" },
};

const DEFAULT_FOOTER_LINKS = {
  explore: [
    { labelEn: "Events", labelMn: "Арга хэмжээ", label: "Events", href: "/Explore" },
    { labelEn: "Courses", labelMn: "Сургалт", label: "Courses", href: "/Programs-Listing" },
    { labelEn: "Organizers", labelMn: "Зохион байгуулагчид", label: "Organizers", href: "/Organizers" },
  ],
  organizer: [
    { labelEn: "Become an organizer", labelMn: "Зохион байгуулагч болох", label: "Become an organizer", href: "/register?role=organizer" },
    { labelEn: "Partner with us", labelMn: "Хамтрагч болох", label: "Partner with us", href: "/#partner" },
    { labelEn: "Dashboard", labelMn: "Хяналтын самбар", label: "Dashboard", href: "/Dashboard" },
  ],
  help: [
    { labelEn: "Contact Us", labelMn: "Холбоо барих", label: "Contact Us", href: "/contact-us" },
    { labelEn: "Privacy Policy", labelMn: "Нууцлалын бодлого", label: "Privacy Policy", href: "/privacy-policy" },
    { labelEn: "Terms of Service", labelMn: "Үйлчилгээний нөхцөл", label: "Terms of Service", href: "/terms" },
  ],
};

const DEFAULT_SOCIAL = { instagram: "", facebook: "", youtube: "", linkedin: "" };

// ─── Column Editor ────────────────────────────────────────────────────────────
const ColumnCard = ({
  colKey,
  defaultTitleEn,
  defaultTitleMn,
  columnTitle = { en: "", mn: "" },
  links = [],
  onTitleChange,
  onLinksChange,
}) => {
  const handleChange = (idx, field, val) => {
    const updated = [...links];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
      // Keep legacy 'label' synchronized with English label
      ...(field === "labelEn" ? { label: val } : {}),
    };
    onLinksChange(colKey, updated);
  };

  const handleAdd = () => {
    onLinksChange(colKey, [
      ...links,
      { labelEn: "", labelMn: "", label: "", href: "" },
    ]);
  };

  const handleDelete = (idx) => {
    onLinksChange(colKey, links.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex-1 min-w-0 border border-gray-200 rounded-2xl p-5 bg-gray-50 flex flex-col justify-between">
      <div>
        {/* Column Header & Column Title Translation */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider bg-teal-100/70 text-teal-700 px-2 py-0.5 rounded">
              Column: {colKey}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-white border border-teal-200 rounded-lg px-2.5 py-1 hover:bg-teal-50 shadow-xs transition-colors"
            >
              <FiPlus size={12} /> Add link
            </button>
          </div>

          {/* Column Title Translations */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[9px] font-bold font-mono">EN</span> Title
              </label>
              <input
                type="text"
                placeholder={defaultTitleEn}
                value={columnTitle.en ?? ""}
                onChange={(e) => onTitleChange(colKey, "en", e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold font-mono">MN</span> Гарчиг
              </label>
              <input
                type="text"
                placeholder={defaultTitleMn}
                value={columnTitle.mn ?? ""}
                onChange={(e) => onTitleChange(colKey, "mn", e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Links List */}
        {links.length === 0 && (
          <p className="text-xs text-gray-400 italic py-4 text-center">
            No links in this column. Click "Add link" above.
          </p>
        )}

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs hover:border-gray-300 transition-all"
            >
              {/* Labels Grid: EN and MN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold font-mono">EN</span> English Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Events"
                    value={link.labelEn ?? link.label ?? ""}
                    onChange={(e) => handleChange(idx, "labelEn", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold font-mono">MN</span> Монгол Нэр
                  </label>
                  <input
                    type="text"
                    placeholder="Жишээ: Арга хэмжээ"
                    value={link.labelMn ?? ""}
                    onChange={(e) => handleChange(idx, "labelMn", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* URL and Delete */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  URL / Route
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /Explore"
                    value={link.href ?? ""}
                    onChange={(e) => handleChange(idx, "href", e.target.value)}
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove Link"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  const [columnTitles, setColumnTitles] = useState(DEFAULT_COLUMN_TITLES);
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
        const val = footerRes.value.data.data?.value || {};
        const normalize = (items, fallback) => {
          if (!Array.isArray(items) || items.length === 0) return fallback;
          return items.map((item) => ({
            labelEn: item.labelEn || item.label || "",
            labelMn: item.labelMn || "",
            label: item.label || item.labelEn || "",
            href: item.href || item.url || "",
          }));
        };

        setFooterLinks({
          explore: normalize(val.explore, DEFAULT_FOOTER_LINKS.explore),
          organizer: normalize(val.organizer, DEFAULT_FOOTER_LINKS.organizer),
          help: normalize(val.help, DEFAULT_FOOTER_LINKS.help),
        });

        if (val.titles) {
          setColumnTitles({
            explore: { ...DEFAULT_COLUMN_TITLES.explore, ...val.titles.explore },
            organizer: { ...DEFAULT_COLUMN_TITLES.organizer, ...val.titles.organizer },
            help: { ...DEFAULT_COLUMN_TITLES.help, ...val.titles.help },
          });
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLinksChange = (colKey, newLinks) => {
    setFooterLinks((prev) => ({ ...prev, [colKey]: newLinks }));
  };

  const handleTitleChange = (colKey, lang, val) => {
    setColumnTitles((prev) => ({
      ...prev,
      [colKey]: {
        ...prev[colKey],
        [lang]: val,
      },
    }));
  };

  const handleSaveSocial = async () => {
    for (const [field, val] of Object.entries(social)) {
      if (val && val.trim() && !val.trim().startsWith("http://") && !val.trim().startsWith("https://")) {
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
      showToast("Social links saved successfully!");
    } catch {
      showToast("Failed to save social links", "error");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSaveFooterLinks = async () => {
    // Validate rows
    for (const [col, links] of Object.entries(footerLinks)) {
      for (const [i, link] of links.entries()) {
        const en = (link.labelEn || link.label || "").trim();
        const mn = (link.labelMn || "").trim();
        const href = (link.href || "").trim();
        if (!en && !mn) {
          showToast(`${col} — row ${i + 1}: Label required (English or Mongolian)`, "error");
          return;
        }
        if (!href) {
          showToast(`${col} — row ${i + 1}: URL / route is required`, "error");
          return;
        }
      }
    }

    const payload = {
      explore: (footerLinks.explore || []).map((l) => ({
        labelEn: (l.labelEn || l.label || "").trim(),
        labelMn: (l.labelMn || "").trim(),
        label: (l.labelEn || l.label || "").trim(),
        href: (l.href || "").trim(),
      })),
      organizer: (footerLinks.organizer || []).map((l) => ({
        labelEn: (l.labelEn || l.label || "").trim(),
        labelMn: (l.labelMn || "").trim(),
        label: (l.labelEn || l.label || "").trim(),
        href: (l.href || "").trim(),
      })),
      help: (footerLinks.help || []).map((l) => ({
        labelEn: (l.labelEn || l.label || "").trim(),
        labelMn: (l.labelMn || "").trim(),
        label: (l.labelEn || l.label || "").trim(),
        href: (l.href || "").trim(),
      })),
      titles: {
        explore: {
          en: (columnTitles.explore?.en || DEFAULT_COLUMN_TITLES.explore.en).trim(),
          mn: (columnTitles.explore?.mn || DEFAULT_COLUMN_TITLES.explore.mn).trim(),
        },
        organizer: {
          en: (columnTitles.organizer?.en || DEFAULT_COLUMN_TITLES.organizer.en).trim(),
          mn: (columnTitles.organizer?.mn || DEFAULT_COLUMN_TITLES.organizer.mn).trim(),
        },
        help: {
          en: (columnTitles.help?.en || DEFAULT_COLUMN_TITLES.help.en).trim(),
          mn: (columnTitles.help?.mn || DEFAULT_COLUMN_TITLES.help.mn).trim(),
        },
      },
    };

    setSavingLinks(true);
    try {
      await authAxiosClient.post("/globalsetting/upsert", {
        key: "FOOTER_LINKS",
        value: payload,
        description: "Navigation links and column titles in the site footer",
      });
      showToast("Footer links and translations saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
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
    <div className="p-6 space-y-6 max-w-6xl">
      <Toast toast={toast} />

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FiLayout className="text-teal-600" size={20} />
          <h1 className="text-xl font-bold text-gray-800">Footer Management</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage navigation links, multilingual translations (English & Mongolian), and social media URLs shown in the site footer.
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          {[
            { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/bondy.mn" },
            { key: "facebook", label: "Facebook URL", placeholder: "https://facebook.com/bondy.mn" },
            { key: "youtube", label: "YouTube URL", placeholder: "https://youtube.com/@bondy" },
            { key: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/bondy" },
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
                  value={social[key] || ""}
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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
        >
          <FiSave size={14} />
          {savingSocial ? "Saving..." : "Save Social Links"}
        </button>
      </div>

      {/* ── Footer Nav Columns with Bilingual Support ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FiGlobe className="text-teal-600" size={17} />
            <h2 className="text-base font-bold text-gray-800">Footer Navigation Columns & Translations</h2>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Manage link text in English (<span className="text-blue-600 font-bold">EN</span>) and Mongolian (<span className="text-emerald-600 font-bold">MN</span>). Internal routes start with <code className="bg-gray-100 px-1 rounded">/</code> (e.g. <code className="bg-gray-100 px-1 rounded">/Explore</code>).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ColumnCard
            colKey="explore"
            defaultTitleEn="Explore"
            defaultTitleMn="Судлах"
            columnTitle={columnTitles.explore}
            links={footerLinks.explore || []}
            onTitleChange={handleTitleChange}
            onLinksChange={handleLinksChange}
          />
          <ColumnCard
            colKey="organizer"
            defaultTitleEn="Organizer"
            defaultTitleMn="Зохион байгуулагч"
            columnTitle={columnTitles.organizer}
            links={footerLinks.organizer || []}
            onTitleChange={handleTitleChange}
            onLinksChange={handleLinksChange}
          />
          <ColumnCard
            colKey="help"
            defaultTitleEn="Help"
            defaultTitleMn="Тусламж"
            columnTitle={columnTitles.help}
            links={footerLinks.help || []}
            onTitleChange={handleTitleChange}
            onLinksChange={handleLinksChange}
          />
        </div>

        <button
          onClick={handleSaveFooterLinks}
          disabled={savingLinks}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
        >
          <FiSave size={14} />
          {savingLinks ? "Saving..." : "Save Footer Links & Translations"}
        </button>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-sm font-semibold text-teal-800">Bilingual Sync Active</p>
          <p className="text-xs text-teal-700 mt-0.5">
            Changes saved here update the database in real-time. When website visitors switch between <strong>English</strong> and <strong>Монгол</strong>, the footer dynamically displays the corresponding translations without any hardcoded text.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FooterManagement;
