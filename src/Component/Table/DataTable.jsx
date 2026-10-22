import React, { useState } from "react";
import { useTheme } from "../../contexts/theme/hook/useTheme";

const isUrlOrFilePath = (str) => {
  if (typeof str !== "string") return false;
  const s = str.trim();
  // Starts with http, https, data:, blob:, //, or /
  if (/^(https?:\/\/|\/\/|data:|blob:|\/|uploads\/)/i.test(s)) return true;
  // Contains common image/document extensions
  if (/\.(svg|png|jpe?g|webp|gif|ico|bmp|tiff|pdf|avif)(\?.*)?$/i.test(s)) return true;
  return false;
};

const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found",
  emptySubtext = "No records match your search or filter criteria. Try adjusting your search query or clearing filters.",
}) => {
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const handleMouseEnter = (e, value) => {
    if (!value) return;
    const text = typeof value === "string" ? value : (value !== undefined && value !== null ? String(value) : "");
    if (!text || isUrlOrFilePath(text)) {
      return;
    }
    if (text.length > 50) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({
        visible: true,
        content: text,
        x: rect.left,
        y: rect.top - 10,
      });
    }
  };

  const handleMouseLeave = (e) => {
    const related = e.relatedTarget;
    if (!related || !related.closest(".custom-tooltip")) {
      setTooltip({ visible: false, content: "", x: 0, y: 0 });
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return null;
    }

    if (!data || data.length === 0) {
      return (
        <tr>
          <td
            colSpan={columns.length}
            className="py-16 px-4 text-center"
            style={{
              backgroundColor: theme?.colors?.background || "#ffffff",
            }}
          >
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto select-none">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-xs"
                style={{
                  backgroundColor: theme?.colors?.tertiary || "#f8fafc",
                  border: `1px solid ${theme?.colors?.borderLight || "#e2e8f0"}`,
                  color: theme?.colors?.textMuted || "#94a3b8",
                }}
              >
                <svg
                  className="w-7 h-7 stroke-[1.6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h3
                className="text-sm font-semibold tracking-tight"
                style={{ color: theme?.colors?.textPrimary || "#0f172a" }}
              >
                {emptyMessage}
              </h3>
              <p
                className="text-xs mt-1.5 leading-relaxed max-w-xs"
                style={{ color: theme?.colors?.textMuted || "#64748b" }}
              >
                {emptySubtext}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return data.map((row, rowIndex) => (
      <tr
        key={rowIndex}
        className="hover:bg-opacity-75 transition-colors"
        style={{
          borderBottom: `1px solid ${theme?.colors?.border || "#e5e7eb"}`,
          backgroundColor: theme?.colors?.background || "#ffffff",
          color: theme?.colors?.textPrimary || "#111827",
        }}
      >
        {columns.map((col) => {
          const value = row[col.key];

          const content = col.render
            ? col.render(value, row, rowIndex)
            : (value !== undefined && value !== null ? String(value) : "");

          const isStringContent = typeof content === "string";
          const displayContent = isStringContent && content.length > 50
            ? content.slice(0, 50) + "..."
            : content;

          // Only show tooltip for truncated text content, never for URLs, file paths, or custom React elements
          const tooltipContent = isStringContent && !isUrlOrFilePath(content) ? content : null;

          return (
            <td
              key={col.key}
              className="p-2.5 truncate align-middle"
              onMouseEnter={(e) => tooltipContent && handleMouseEnter(e, tooltipContent)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="truncate">{displayContent}</div>
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <>
      <div className="table-responsive overflow-x-auto w-full">
        <table
          className="min-w-full text-sm text-left table-fixed border"
          style={{ borderColor: theme?.colors?.border || "#e5e7eb" }}
        >
          <thead style={{ backgroundColor: theme?.colors?.tertiary || "#f5f5f5" }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2.5 font-semibold text-xs border-b uppercase tracking-wider"
                  style={{
                    color: theme?.colors?.textSecondary || "#64748b",
                    borderColor: theme?.colors?.borderLight || "#f1f5f9",
                    width: col.width || "auto",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Tooltip with theme */}
      {tooltip.visible && (
        <div
          className="fixed z-[9999] pointer-events-auto custom-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translateY(-100%)",
          }}
          onMouseEnter={() =>
            setTooltip((prev) => ({ ...prev, visible: true }))
          }
          onMouseLeave={() =>
            setTooltip({ visible: false, content: "", x: 0, y: 0 })
          }
        >
          {/* Arrow */}
          <div
            className="absolute left-3 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent"
            style={{
              borderTopColor: theme?.colors?.background || "#ffffff",
            }}
          />

          {/* Tooltip Box */}
          <div
            className="text-sm p-3 break-words whitespace-normal shadow-xl max-w-xs rounded-lg"
            style={{
              backgroundColor: theme?.colors?.background || "#ffffff",
              color: theme?.colors?.textPrimary || "#111827",
              border: `1px solid ${theme?.colors?.borderLight || "#e5e7eb"}`,
              boxShadow: theme?.shadows?.lg || "0 10px 15px -3px rgba(0,0,0,0.1)",
            }}
          >
            {tooltip.content}
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
