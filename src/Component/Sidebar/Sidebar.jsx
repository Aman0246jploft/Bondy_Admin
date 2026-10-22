import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import {
  AiOutlineHome,
  AiOutlineDashboard,
  AiOutlineTeam,
  AiOutlineFileText,
  AiOutlineBell,
  AiOutlineSetting,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineCalendar,
  AiOutlineBook,
  AiOutlineQuestionCircle,
  AiOutlineCustomerService,
  AiOutlineMail,
  AiOutlineDollar,
  AiOutlineBug,
  AiOutlineLayout,
} from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import clsx from "clsx";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    setHoveredItem(null);
  }, [isOpen, location.pathname]);

  useEffect(() => {
    const handleDismiss = () => setHoveredItem(null);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: AiOutlineHome },
    // { name: "Dashboard", href: "/dashboard", icon: AiOutlineDashboard },
    { name: "Customers", href: "/customers", icon: AiOutlineTeam },
    { name: "Organizers", href: "/organizers", icon: AiOutlineTeam },
    { name: "Verification Requests", href: "/verification-requests", icon: AiOutlineFileText },
    { name: "Finance", href: "/finance", icon: AiOutlineDollar },
    { name: "Categories", href: "/categories", icon: AiOutlineFileText },
    // { name: "Banners", href: "/banners", icon: AiOutlineFileText },
    { name: "Events", href: "/events", icon: AiOutlineCalendar },
    { name: "Courses", href: "/courses", icon: AiOutlineBook },
    { name: "Taxes", href: "/taxes", icon: AiOutlineSetting },
    { name: "Banks", href: "/banks", icon: AiOutlineSetting },
    { name: "Promo Codes", href: "/promo-codes", icon: AiOutlineFileText },
    { name: "Promotion Packages", href: "/promotion-packages", icon: AiOutlineFileText },
    { name: "Global Settings", href: "/settings", icon: AiOutlineSetting },
    { name: "Privacy Policy", href: "/privacy-policy", icon: AiOutlineFileText },
    { name: "Terms & Conditions", href: "/terms-conditions", icon: AiOutlineFileText },
    { name: "FAQs", href: "/faqs", icon: AiOutlineQuestionCircle },
    { name: "Support Tickets", href: "/support-tickets", icon: AiOutlineCustomerService },
    { name: "Contact Messages", href: "/contacts", icon: AiOutlineMail },
    // { name: "Update Signups", href: "/stay-updated", icon: AiOutlineMail },
    { name: "Reports", href: "/reports", icon: AiOutlineFileText },
    { name: "Bug Reports", href: "/bugs", icon: AiOutlineBug },
    //footer-management
    { name: "Footer Management", href: "/footer-management", icon: AiOutlineLayout },
    { name: "Notifications", href: "/notifications", icon: AiOutlineBell },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.textPrimary,
        }}
        className={clsx(
          "fixed left-0 top-0 h-full border-r z-40 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
          // Desktop behavior (unchanged)
          "md:translate-x-0",
          isOpen ? "md:w-60 " : "md:w-16",
          // Mobile behavior (new)
          "w-64 md:w-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.borderLight,
          }}
          className={clsx(
            "absolute -right-3 top-8 border-2 rounded-full p-1.5 transition-colors duration-200",
            !isOpen && "md:rotate-180",
            // Hide toggle button on mobile when sidebar is closed
            "hidden md:block",
            isOpen && "md:block"
          )}
        >
          {isOpen ? (
            <AiOutlineLeft
              className="w-4 h-4"
              style={{ color: theme.colors.textPrimary }}
            />
          ) : (
            <AiOutlineRight
              className="w-4 h-4"
              style={{ color: theme.colors.textPrimary }}
            />
          )}
        </button>

        {/* Logo Section */}
        <div
          className={clsx(
            "flex items-center p-4 border-b",
            !isOpen && "md:justify-center md:px-2"
          )}
          style={{
            borderColor: theme.colors.border,
          }}
        >
          <div className="w-10 h-10  rounded-lg flex items-center justify-center flex-shrink-0">
            <img src="/sidebar-logo.svg" />
          </div>
          {/* Always show text on mobile, conditionally on desktop */}
          <div className={clsx("ml-3 overflow-hidden", !isOpen && "md:hidden")}>
            <h1
              className="text-xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Bondy
            </h1>
            <p
              className="text-xs"
              style={{ color: theme.colors.textSecondary }}
            >
              Admin Panel
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav
          className="flex-1 py-6 overflow-y-auto overflow-x-hidden"
          onScroll={() => setHoveredItem(null)}
        >
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <li
                  key={item.name}
                  style={{
                    backgroundColor: isActive
                      ? theme.colors.sidebarActive
                      : undefined,
                    color: theme.colors.textPrimary,
                    borderRadius: theme.borderRadius.lg,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor =
                        theme.colors.sidebarHover;
                    if (!isOpen && typeof window !== "undefined" && window.innerWidth >= 768) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredItem({
                        name: item.name,
                        top: rect.top + rect.height / 2,
                        left: rect.right + 10,
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "";
                    if (!isOpen) {
                      setHoveredItem(null);
                    }
                  }}
                >
                  <NavLink
                    to={item.href}
                    className={clsx(
                      "group flex items-center px-3 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? `bg-${theme.colors.sidebarActive} text-${theme.colors.textPrimary} shadow-lg`
                        : `text-${theme.colors.textPrimary} `,
                      !isOpen && "md:justify-center md:px-2"
                    )}
                    style={{
                      backgroundColor: isActive
                        ? theme.colors.sidebarActive
                        : undefined,
                      color: theme.colors.textPrimary,
                    }}
                    onClick={() => {
                      // Close sidebar on mobile when a link is clicked
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    {/* Always show text on mobile, conditionally on desktop */}
                    <span
                      className={clsx(
                        "ml-3 font-medium text-sm overflow-hidden whitespace-nowrap",
                        !isOpen && "md:hidden"
                      )}
                    >
                      {item.name}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Floating Tooltip for Collapsed Sidebar (rendered outside scrollable hierarchy) */}
      {typeof document !== "undefined" &&
        !isOpen &&
        hoveredItem &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999] hidden md:flex items-center transition-opacity duration-150"
            style={{
              top: `${hoveredItem.top}px`,
              left: `${hoveredItem.left}px`,
              transform: "translateY(-50%)",
            }}
          >
            {/* Small arrow */}
            <div
              className="w-2 h-2 rotate-45 -mr-1 z-10 border-l border-b border-slate-700/60"
              style={{
                backgroundColor: "#0f172a",
              }}
            />
            {/* Tooltip Pill */}
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xl whitespace-nowrap border border-slate-700/60"
              style={{
                backgroundColor: "#0f172a",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
              }}
            >
              {hoveredItem.name}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Sidebar;
