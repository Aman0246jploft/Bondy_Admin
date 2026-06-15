import React from "react";

/**
 * LoadingOverlay Component
 * Renders a full-screen semi-transparent overlay with a centered spinning loader.
 * 
 * @param {Object} props
 * @param {boolean} props.isLoading - Controls the visibility of the overlay.
 * @param {string} [props.message] - Optional text to display below the loader.
 */
const LoadingOverlay = ({ isLoading = true, message = "" }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer Glowing Ring */}
        <div className="absolute h-20 w-20 rounded-full border-4 border-blue-500/20 animate-pulse"></div>
        
        {/* Inner Spinning Ring */}
        <div className="h-16 w-16 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
        
        {/* Center Dot */}
        <div className="absolute h-3 w-3 rounded-full bg-blue-500 animate-ping"></div>
      </div>
      
      {message && (
        <p className="mt-4 text-sm font-semibold tracking-wider text-white/90 drop-shadow-md animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingOverlay;
