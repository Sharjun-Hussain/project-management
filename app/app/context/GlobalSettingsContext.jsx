"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSettings } from "../../lib/api/settings";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// Robustly extract the origin (e.g., https://api.igen.lk) from the API URL
let BASE_URL = "";
try {
  if (API_BASE_URL) {
    BASE_URL = new URL(API_BASE_URL).origin;
  }
} catch (e) {
  console.error("Invalid NEXT_PUBLIC_API_BASE_URL:", API_BASE_URL);
}

const formatUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const GlobalSettingsContext = createContext();

const ACCENT_COLORS = {
  indigo: { name: "Indigo", primary: "#6366f1", hover: "#4f46e5", light: "#eef2ff" },
  blue: { name: "Ocean Blue", primary: "#3b82f6", hover: "#2563eb", light: "#eff6ff" },
  rose: { name: "Rose Crimson", primary: "#f43f5e", hover: "#e11d48", light: "#fff1f2" },
  emerald: { name: "Mint Emerald", primary: "#10b981", hover: "#059669", light: "#ecfdf5" },
  amber: { name: "Gold Amber", primary: "#f59e0b", hover: "#d97706", light: "#fef3c7" },
  purple: { name: "Royal Purple", primary: "#a855f7", hover: "#9333ea", light: "#faf5ff" },
  orange: { name: "Sunset Orange", primary: "#f97316", hover: "#ea580c", light: "#fff7ed" },
  teal: { name: "Teal Breeze", primary: "#0d9488", hover: "#0f766e", light: "#f0fdfa" },
};

export const GlobalSettingsProvider = ({ children }) => {
  const { data: session, status } = useSession();

  // Default values mapped from API keys
  const [settings, setSettings] = useState(() => {
    let initialColor = "indigo";
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("accent_color");
      if (cached) initialColor = cached;
    }
    return {
      businessName: "",
      logoUrl: null,
      footerText: "",
      adminEmail: "",
      adminName: "",
      dashboardTitle: "",
      faviconUrl: null,
      accentColor: initialColor,
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch settings from API
  // Real API response: { status: "success", message: "...", data: { key: value, ... } }
  const fetchSettings = async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getSettings(session.accessToken);
      // data is a flat { key: string_value } object
      const defaultShopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium";
      const defaultFooter = `© 2026 ${defaultShopName}. All rights reserved.`;
      const defaultEmail = `support@${defaultShopName.toLowerCase().replace(/\s+/g, '')}.com`;

      const fetchedColor = data.site_accent_color || "indigo";
      if (typeof window !== "undefined") {
        localStorage.setItem("accent_color", fetchedColor);
      }

      setSettings({
        businessName: data.site_name || defaultShopName,
        logoUrl: formatUrl(data.site_logo),
        footerText: data.footer_text || defaultFooter,
        adminEmail: data.shop_email || defaultEmail,
        adminName: data.admin_name || "Admin User",
        dashboardTitle: data.admin_dashboard_title || defaultShopName,
        faviconUrl: formatUrl(data.site_favicon),
        accentColor: fetchedColor,
        // persist the raw data so the settings page can access all keys
        raw: data,
      });
    } catch (error) {
      console.error("Failed to fetch global settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [session?.accessToken]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined" && newSettings.accentColor) {
        localStorage.setItem("accent_color", newSettings.accentColor);
      }
      return updated;
    });
  };

  useEffect(() => {
    const selectedAccent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.indigo;
    document.documentElement.style.setProperty("--accent-color", selectedAccent.primary);
    document.documentElement.style.setProperty("--accent-hover", selectedAccent.hover);
    document.documentElement.style.setProperty("--accent-light", selectedAccent.light);
    if (typeof window !== "undefined") {
      localStorage.setItem("accent_color", settings.accentColor);
    }
  }, [settings.accentColor]);

  return (
    <GlobalSettingsContext.Provider
      value={{
        ...settings,
        isLoading,
        updateSettings,
        refreshSettings: fetchSettings,
        accentColorsMap: ACCENT_COLORS,
      }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = () => {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error("useGlobalSettings must be used within a GlobalSettingsProvider");
  }
  return context;
};
