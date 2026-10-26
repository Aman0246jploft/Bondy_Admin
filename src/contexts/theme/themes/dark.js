export const darkTheme = {
  name: "dark",
  colors: {
    // Primary and secondary shades
    primary: "#1f2937",          // dark gray background for primary content
    secondary: "#111827",        // darker gray for secondary elements
    tertiary: "#0f172a",         // very dark for tertiary elements

    // Backgrounds
    background: "#0f172a",       // dark background color (very dark teal-gray)

    // Sidebar
    sidebarText: "#9ca3af",      // light gray for text in the sidebar
    sidebarTextHover: "#f3f4f6", // very light gray text on hover for better contrast
    sidebarActive: "#23ada4",    // brand teal for active sidebar items
    sidebarHover: "#374151",     // darker gray hover effect for sidebar items

    // Header
    headerBg: "#1f2937",         // dark gray background for header
    headerText: "#f3f4f6",       // light gray text for header
    headerBorder: "#374151",     // dark border for header

    // Table Header
    tableHeaderBg: "#1e293b",
    tableHeaderText: "#f3f4f6",
    tableHeaderBorder: "#374151",

    // Text
    textPrimary: "#f3f4f6",      // light gray for main text
    textSecondary: "#d1d5db",    // medium light gray for secondary text
    textMuted: "#6b7280",        // darker gray for muted text

    // Borders
    border: "#374151",           // dark border color
    borderLight: "#4b5563",      // lighter dark border color for less prominent borders

    // Status colors
    success: "#10b981",          // green for success messages
    warning: "#f59e0b",          // amber/orange for warning messages
    error: "#ef4444",            // red for error messages
    info: "#23ada4",             // brand teal for informational messages

    // Button 
    buttonGhost: "transparent",
    buttonTextOnPrimary: "#ffffff",
    buttonTextOnDanger: "#ffffff",
    buttonTextOnSecondary: "#f3f4f6",
    buttonTextOnGhost: "#f3f4f6", // light text for ghost buttons
    buttonPrimary: "#23ada4",        // brand teal
    buttonPrimaryHover: "#1ca398",  // brand teal hover
    buttonSecondary: "#374151",      // Dark gray
    buttonSecondaryHover: "#4b5563", // Lighter dark gray
    buttonDanger: "#ef4444",         // Red-500
    buttonDangerHover: "#dc2626",    // Red-600
    buttonGhostHover: "#374151",     // Dark gray hover
    buttonBorder: "#4b5563",         // Dark border

  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
};