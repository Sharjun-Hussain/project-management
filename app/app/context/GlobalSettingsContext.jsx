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

  return (
    <GlobalSettingsContext.Provider
      value={{
        ...settings,
        isLoading,
        updateSettings,
        refreshSettings: fetchSettings,
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
