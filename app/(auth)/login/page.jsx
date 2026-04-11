import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Login | Igen Admin Dashboard",
  description: "Secure login for the Igen Admin Dashboard.",
};

/**
 * Optimized Server-Side Login Page
 * Handles immediate server-side redirection if already authenticated.
 */
export default async function LoginPage(props) {
  const session = await getServerSession(authOptions);
  
  // Extract search params - in Next.js 16/15 they are a promise
  const params = await props.searchParams;
  const isExpired = params?.expired === "1";

  // Redirect if already authenticated, UNLESS the session just expired in the backend
  if (session && !isExpired) {
    redirect("/app");
  }

  // Fetch settings on the server - following the pattern in layout.js
  let settings = {
    dashboardTitle: "Igen",
    logoUrl: "/igen_mobiles_logo.png",
    footerText: "© 2026 Igen LK. All rights reserved. | Powered by Inzeedo (PVT) Ltd"
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
        dashboardTitle: data.admin_dashboard_title || "Igen",
        logoUrl: data.site_logo ? (data.site_logo.startsWith('http') ? data.site_logo : `${BASE_URL}/${data.site_logo}`) : "/igen_mobiles_logo.png",
        footerText: data.footer_text || "© 2026 Igen LK. All rights reserved. | Powered by Inzeedo (PVT) Ltd"
      };
    }
  } catch (err) {
    console.error("Login settings fetch failed:", err);
  }

  return (
    <AuthLayout 
      logoUrl={settings.logoUrl}
      dashboardTitle={settings.dashboardTitle}
      footerText={settings.footerText}
    >
      <LoginForm />
    </AuthLayout>
  );
}

