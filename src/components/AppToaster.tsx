"use client";

import { Toaster } from "react-hot-toast";

/**
 * Shared, app-wide toast configuration.
 * All toasts render top-right with a consistent white + orange style.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600,
          fontSize: "14px",
          lineHeight: "1.35",
          color: "#1f2937",
          background: "#ffffff",
          border: "1px solid #f1f5f9",
          borderRadius: "14px",
          padding: "12px 16px",
          boxShadow:
            "0 12px 32px rgba(17, 24, 39, 0.10), 0 2px 8px rgba(17, 24, 39, 0.05)",
          maxWidth: "360px",
        },
        success: {
          iconTheme: { primary: "#f97316", secondary: "#ffffff" },
          style: { border: "1px solid #fed7aa" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
          style: { border: "1px solid #fecaca" },
        },
        loading: {
          iconTheme: { primary: "#f59e0b", secondary: "#ffffff" },
        },
      }}
    />
  );
}
