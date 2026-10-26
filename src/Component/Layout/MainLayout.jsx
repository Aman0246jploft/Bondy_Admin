import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import { AiOutlineMenu } from "react-icons/ai";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-close sidebar on mobile by default
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      // Auto-open sidebar on desktop if it was closed due to mobile
      else if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          // On desktop: apply margin matching Sidebar (md:w-60 -> ml-60, md:w-16 -> ml-16)
          // On mobile: no margin (sidebar overlays)
          isMobile
            ? "ml-0"
            : isSidebarOpen
              ? "ml-60"
              : "ml-16"
          }`}
      >
        {/* Mobile Hamburger (only visible on mobile when sidebar is closed) */}
        {isMobile && !isSidebarOpen && (
          <div className="p-3 md:hidden flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Open sidebar"
            >
              <AiOutlineMenu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-800">Bondy Admin</span>
          </div>
        )}

        {/* Page Content */}
        <main
          className="flex-1 px-4 md:px-6 pt-4 pb-8 overflow-y-auto"
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.textPrimary,
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;