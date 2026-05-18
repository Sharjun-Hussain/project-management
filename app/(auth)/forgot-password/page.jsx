import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password | Foreign Emporium Admin Dashboard",
  description: "Recover your Foreign Emporium account access securely.",
};

/**
 * Optimized Server-Side Forgot Password Page
 */
export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already authenticated
  if (session) {
    redirect("/app");
  }

  const defaultShopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium";
  const defaultFooter = `© 2026 ${defaultShopName}. All rights reserved.`;

  // Fetch settings on the server
  let settings = {
    dashboardTitle: defaultShopName,
    logoUrl: "/favicon.ico",
    footerText: defaultFooter
  };

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${API_BASE}/admin/settings`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      const BASE_URL = API_BASE ? new URL(API_BASE).origin : "";
      
      settings = {
        dashboardTitle: data.admin_dashboard_title || defaultShopName,
        logoUrl: data.site_logo ? (data.site_logo.startsWith('http') ? data.site_logo : `${BASE_URL}/${data.site_logo}`) : "/favicon.ico",
        footerText: data.footer_text || defaultFooter
      };
    }
  } catch (err) {
    console.error("Forgot password settings fetch failed:", err);
  }

  return (
    <AuthLayout 
      logoUrl={settings.logoUrl}
      dashboardTitle={settings.dashboardTitle}
      footerText={settings.footerText}
      showTag={true}
      tagLabel="Secure Recovery"
      tagline="Secure Access, \nReliable Protection."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
