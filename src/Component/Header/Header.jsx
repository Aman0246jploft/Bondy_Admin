import React, { useState, useRef, useEffect } from "react";
import {
  AiOutlineBell,
  AiOutlineDown,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineProfile,
  AiOutlineQuestionCircle,
  AiOutlineMenu,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import Image from "../Atoms/Image/Image";
import userApi from "../../api/userApi";

const Header = ({ toggleSidebar }) => {
  const { currentTheme, changeTheme, theme } = useTheme();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userData, setUserData] = useState(null);
  const profileDropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await userApi.getSelfProfile();

      if (response.data && response.data.data) {
        setUserData(response.data.data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    const handleProfileUpdate = () => {
      fetchUserProfile();
    };
    window.addEventListener("admin_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("admin_profile_updated", handleProfileUpdate);
    };
  }, []);


  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme options with their display info
  const themeOptions = [
    {
      key: "light",
      name: "Light",
      icon: "🌞",
      description: "Clean and bright",
    },
    {
      key: "dark",
      name: "Dark",
      icon: "🌙",
      description: "Easy on the eyes",
    },
    {
      key: "red",
      name: "Red",
      icon: "🔴",
      description: "Bold and vibrant",
    },
    {
      key: "green",
      name: "Green",
      icon: "🟢",
      description: "Fresh and natural",
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target)
      ) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    setShowThemeDropdown(false);
  };

  const getCurrentThemeInfo = () => {
    return (
      themeOptions.find((option) => option.key === currentTheme) ||
      themeOptions[0]
    );
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem("kadSunInfo");
    localStorage.removeItem("token");

    // Close dropdown
    setShowProfileDropdown(false);

    // Redirect to login page
    navigate("/login");
  };

  const profileMenuItems = [
    {
      icon: AiOutlineProfile,
      label: "My Profile",
      onClick: () => {
        setShowProfileDropdown(false);
        navigate("/profile");
      },
    },
    {
      icon: AiOutlineLogout,
      label: "Sign Out",
      onClick: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <header
      className="h-16 border-b px-4 md:px-6 relative flex items-center justify-between flex-shrink-0"
      style={{
        backgroundColor: theme.colors.headerBg,
        borderColor: theme.colors.headerBorder,
        color: theme.colors.headerText,
      }}
    >
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl transition-colors duration-200 md:hidden border cursor-pointer"
            style={{
              backgroundColor: theme.colors.buttonSecondary,
              borderColor: theme.colors.border,
              color: theme.colors.buttonTextOnSecondary,
            }}
            title="Toggle Menu"
          >
            <AiOutlineMenu className="w-5 h-5" />
          </button>
        )}

        {/* Title */}
        <div>
          <h1
            className="text-base md:text-lg font-bold tracking-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            Welcome back!
          </h1>
        </div>
      </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}

          {/* Theme Dropdown */}
          {/* <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: showThemeDropdown
                  ? theme.colors.buttonSecondaryHover
                  : theme.colors.buttonSecondary,
                color: theme.colors.buttonTextOnSecondary,
              }}
              onMouseEnter={(e) => {
                if (!showThemeDropdown) {
                  e.currentTarget.style.backgroundColor =
                    theme.colors.buttonSecondaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!showThemeDropdown) {
                  e.currentTarget.style.backgroundColor =
                    theme.colors.buttonSecondary;
                }
              }}
            >
              <span className="text-lg">{getCurrentThemeInfo().icon}</span>
              <span className="hidden sm:block text-sm font-medium">
                {getCurrentThemeInfo().name}
              </span>
              <AiOutlineDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showThemeDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
            {showThemeDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.border,
                  boxShadow: theme.shadows.lg,
                }}
              >
                <div className="py-1">
                  {themeOptions.map((themeOption) => (
                    <button
                      key={themeOption.key}
                      onClick={() => handleThemeChange(themeOption.key)}
                      className="flex items-center space-x-3 w-full px-4 py-1.5 text-left transition-colors duration-200"
                      style={{
                        backgroundColor:
                          currentTheme === themeOption.key
                            ? theme.colors.secondary
                            : "transparent",
                        color: theme.colors.textPrimary,
                      }}
                      onMouseEnter={(e) => {
                        if (currentTheme !== themeOption.key) {
                          e.currentTarget.style.backgroundColor =
                            theme.colors.secondary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTheme !== themeOption.key) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <span className="text-lg">{themeOption.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {themeOption.name}
                          </span>
                          {currentTheme === themeOption.key && (
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: theme.colors.success,
                                color: "#ffffff",
                              }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs mt-1"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {themeOption.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div> */}

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2.5 p-1.5 sm:p-2 rounded-xl transition-all duration-200 cursor-pointer border"
              style={{
                backgroundColor: showProfileDropdown
                  ? theme.colors.buttonSecondaryHover
                  : theme.colors.buttonSecondary,
                borderColor: showProfileDropdown ? theme.colors.border : "transparent",
                color: theme.colors.buttonTextOnSecondary,
              }}
            >
              {/* Circular Avatar Badge */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0">
                {userData?.profileImage ? (
                  <img
                    src={
                      userData.profileImage.startsWith("http://") ||
                      userData.profileImage.startsWith("https://")
                        ? userData.profileImage
                        : `${(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")}/${userData.profileImage.replace(/^\/+/, "")}`
                    }
                    alt="Admin Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/sidebar-logo.svg";
                      e.currentTarget.className = "w-5 h-5 object-contain";
                    }}
                  />
                ) : (
                  <img
                    src="/sidebar-logo.svg"
                    alt="Admin Logo"
                    className="w-5 h-5 object-contain"
                  />
                )}
              </div>

              <div className="hidden md:flex flex-col items-start text-left leading-tight">
                <span
                  className="text-xs sm:text-sm font-semibold tracking-tight truncate max-w-[140px]"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {userData
                    ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Bondy Admin"
                    : "Bondy Admin"}
                </span>
                <span
                  className="text-[11px] truncate max-w-[140px]"
                  style={{ color: theme.colors.textMuted }}
                >
                  {userData?.email || "adminbondy@gmail.com"}
                </span>
              </div>

              <AiOutlineDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showProfileDropdown ? "rotate-180" : ""
                }`}
                style={{ color: theme.colors.textMuted }}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.border,
                  boxShadow: theme.shadows.lg,
                }}
              >
                {/* User Info Section */}
                {/* <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/api/placeholder/40/40"
                      alt="Profile"
                      width={40}
                      height={40}
                      rounded={true}
                      className="w-10 h-10"
                    />
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        John Doe
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        john.doe@example.com
                      </p>
                    </div>
                  </div>
                </div> */}

                {/* Menu Items */}
                <div className="py-2">
                  {profileMenuItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={item.onClick}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors duration-200"
                        style={{
                          color: item.isDestructive
                            ? theme.colors.error
                            : theme.colors.textPrimary,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            theme.colors.secondary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
    </header>
  );
};

export default Header;