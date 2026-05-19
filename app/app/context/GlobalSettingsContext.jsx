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
  emerald: { 
    name: "Mint Emerald", 
    primary: "#003C2D", 
    hover: "#002a1f", 
    light: "#e6f0eb",
    dark: {
      primary: "#22c55e",
      hover: "#16a34a",
      light: "#0f1710"
    }
  },
  amber: { name: "Gold Amber", primary: "#f59e0b", hover: "#d97706", light: "#fef3c7" },
  purple: { name: "Royal Purple", primary: "#a855f7", hover: "#9333ea", light: "#faf5ff" },
  orange: { name: "Sunset Orange", primary: "#f97316", hover: "#ea580c", light: "#fff7ed" },
  teal: { name: "Teal Breeze", primary: "#0d9488", hover: "#0f766e", light: "#f0fdfa" },
  gold: { 
    name: "Antique Gold", 
    primary: "#a97d43", 
    hover: "#936c3a", 
    light: "#faf6f0",
    dark: {
      primary: "#d4af37",
      hover: "#bba032",
      light: "#121212"
    }
  },
};

export const GlobalSettingsProvider = ({ children }) => {
  const { data: session, status } = useSession();

  // Default values mapped from API keys
  const [settings, setSettings] = useState({
    businessName: "",
    logoUrl: null,
    footerText: "",
    adminEmail: "",
    adminName: "",
    dashboardTitle: "",
    faviconUrl: null,
    accentColor: "emerald",
    darkAccentColor: "gold",
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

      setSettings({
        businessName: data.site_name || defaultShopName,
        logoUrl: formatUrl(data.site_logo),
        footerText: data.footer_text || defaultFooter,
        adminEmail: data.shop_email || defaultEmail,
        adminName: data.admin_name || "Admin User",
        dashboardTitle: data.admin_dashboard_title || defaultShopName,
        faviconUrl: formatUrl(data.site_favicon),
        accentColor: data.site_accent_color || "gold",
        darkAccentColor: data.site_dark_accent_color || "gold",
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
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const selectedAccent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.gold;
  const selectedDarkAccent = ACCENT_COLORS[settings.darkAccentColor] || ACCENT_COLORS.gold;

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
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --accent-color: ${selectedAccent.primary};
          --accent-hover: ${selectedAccent.hover};
          --accent-light: ${selectedAccent.light};
        }
        .dark {
          --accent-color: ${selectedDarkAccent.dark?.primary || selectedDarkAccent.primary};
          --accent-hover: ${selectedDarkAccent.dark?.hover || selectedDarkAccent.hover};
          --accent-light: ${selectedDarkAccent.dark?.light || selectedDarkAccent.light};
        }
      `}} />
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
