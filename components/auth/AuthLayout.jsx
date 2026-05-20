import React from "react";
import { ShieldCheck } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

/**
 * Server Component: AuthLayout
 * Provides the visual structure for auth pages with lightweight CSS animations.
 */
const AuthLayout = ({ 
  children, 
  logoUrl, 
  dashboardTitle, 
  footerText,
  tagline = "",
  description = `Welcome to the ${process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium"} Administration panel. Manage your products, inventory, orders, and customer insights in real-time.`,
  showTag = false,
  tagLabel = "Secure Access"
}) => {
  const defaultShopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium";
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-x-hidden font-sans relative">
      {/* --- LEFT PANEL: BRANDING --- */}
      <div className="animate-fade-in w-full lg:w-[45%] bg-card border-r border-border text-card-foreground p-8 lg:p-16 flex flex-col justify-between relative z-10 shrink-0">
        {/* Header content ... */}
        <div className="animate-slide-up flex items-center gap-4 text-2xl font-bold tracking-tight">
          <img 
            src={logoUrl || "/favicon.ico"} 
            alt={dashboardTitle || defaultShopName} 
            className="w-16 h-16 object-contain rounded-lg animate-in zoom-in duration-300" 
          />
          {dashboardTitle || defaultShopName}
        </div>

        {/* Middle Content */}
        <div className="max-w-md my-12 lg:my-0">
          {showTag && (
            <div className="animate-slide-up delay-100 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4" /> {tagLabel}
            </div>
          )}
          <p className="animate-slide-up delay-200 text-muted-foreground text-lg leading-relaxed">
            {description}
          </p>
          <div className="animate-slide-up delay-400 mt-12">
            <a 
              href="/"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              Visit Store
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="animate-slide-up delay-500 text-sm text-muted-foreground">
          {footerText || `© 2026 ${defaultShopName}. All rights reserved.`}
        </div>
      </div>

      {/* --- RIGHT PANEL --- */}
      <div className="animate-fade-in w-full lg:flex-1 p-8 lg:p-16 flex flex-col justify-center items-center bg-background relative">
        <div className="animate-slide-up delay-300 w-full max-w-md relative">
          {children}
        </div>
      </div>

      {/* Theme Toggle: Small & Tiny in bottom right */}
      <div className="absolute bottom-6 right-6 z-20 animate-fade-in delay-500">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default AuthLayout;
