import React from "react";

export default function GlobalLoader({ fullScreen = true, message = "" }) {
  const containerStyle = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        pointerEvents: "none",
      }
    : {
        width: "100%",
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: "40px 20px",
      };

  return (
    <div style={containerStyle} aria-live="polite" aria-busy="true">
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/bondy-logo.svg"
          alt="Bondy"
          style={{
            height: 48,
            width: "auto",
            animation: "bondyPulse 1.8s ease-in-out infinite",
            filter: "drop-shadow(0 4px 16px rgba(15, 118, 110, 0.35))",
          }}
        />
      </div>

      {message && (
        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "#6b7280",
            fontWeight: 500,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
