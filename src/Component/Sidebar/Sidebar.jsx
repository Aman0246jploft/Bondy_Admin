import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  AiOutlineUser,
  AiOutlineLogout,
} from "react-icons/ai";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import userApi from "../../api/userApi";
import clsx from "clsx";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem("kadSunInfo");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userApi.getSelfProfile();
        if (response.data && response.data.data) {
          setUserData(response.data.data.user);
        }
      } catch (error) { }
    };
    fetchUserProfile();

    const handleProfileUpdate = () => fetchUserProfile();
    window.addEventListener("admin_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("admin_profile_updated", handleProfileUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("kadSunInfo");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const [activeUserRole, setActiveUserRole] = useState(() => {
    try {
      return sessionStorage.getItem("last_active_user_role") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleRoleUpdate = (e) => {
      if (e?.detail?.role) {
        setActiveUserRole(e.detail.role);
      } else {
        try {
          setActiveUserRole(sessionStorage.getItem("last_active_user_role") || null);
        } catch { }
      }
    };
    window.addEventListener("user_role_active", handleRoleUpdate);
    window.addEventListener("storage", handleRoleUpdate);
    return () => {
      window.removeEventListener("user_role_active", handleRoleUpdate);
      window.removeEventListener("storage", handleRoleUpdate);
    };
  }, []);

  const checkIsActive = (item) => {
    if (item.href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }

    if (location.pathname === item.href) return true;

    // Direct subpaths (e.g. /events/123 -> /events, /courses/123 -> /courses)
    if (location.pathname.startsWith(item.href + "/")) return true;

    // Handle user detail page /users/:userId mapping to Organizers or Customers
    if (location.pathname.startsWith("/users/")) {
      const fromPath = location.state?.from;
      const role = location.state?.role || activeUserRole;
      const roleId = location.state?.roleId;

      if (item.href === "/organizers") {
        if (fromPath === "/organizers" || role === "ORGANIZER" || roleId === 2) {
          return true;
        }
      } else if (item.href === "/customers") {
        if (fromPath === "/customers" || role === "CUSTOMER" || roleId === 1) {
          return true;
        }
      }
    }

    return false;
  };

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
    { name: "Admin Profile", href: "/profile", icon: AiOutlineUser },
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
              const isActive = checkIsActive(item);

              return (
                <li
                  key={item.name}
                  style={{
                    borderRadius: theme.borderRadius.lg,
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen && typeof window !== "undefined" && window.innerWidth >= 768) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredItem({
                        name: item.name,
                        top: rect.top + rect.height / 2,
                        left: rect.right + 10,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isOpen) {
                      setHoveredItem(null);
                    }
                  }}
                >
                  <NavLink
                    to={item.href}
                    className={clsx(
                      "group flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 font-medium",
                      isActive
                        ? "shadow-md"
                        : "hover:bg-teal-50/70 hover:text-[#178c82]",
                      !isOpen && "md:justify-center md:px-2"
                    )}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #23ada4 0%, #178c82 100%)"
                        : "transparent",
                      color: isActive ? "#ffffff" : theme.colors.sidebarText || "#64748b",
                      boxShadow: isActive ? "0 4px 14px rgba(35, 173, 164, 0.35)" : undefined,
                    }}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <Icon className={clsx("w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-current")} />
                    {/* Always show text on mobile, conditionally on desktop */}
                    <span
                      className={clsx(
                        "ml-3 text-sm overflow-hidden whitespace-nowrap",
                        isActive ? "font-semibold text-white" : "",
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

        {/* User Profile & Sign Out Footer */}
        <div
          className={clsx(
            "p-3 border-t flex items-center justify-between gap-2 flex-shrink-0 bg-white/50",
            !isOpen && "md:justify-center md:px-2"
          )}
          style={{ borderColor: theme.colors.border }}
        >
          <NavLink
            to="/profile"
            className={clsx(
              "flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition",
              !isOpen && "md:hidden"
            )}
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {userData?.firstName ? userData.firstName[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                {userData?.firstName ? `${userData.firstName} ${userData.lastName || ""}` : "Bondy Admin"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userData?.email || "admin@bondy.com"}
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex-shrink-0"
            title="Sign Out"
          >
            <AiOutlineLogout className="w-4 h-4" />
          </button>
        </div>
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
