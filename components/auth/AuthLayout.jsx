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
      <div className="animate-fade-in w-full lg:w-[45%] bg-card border-r border-border text-card-foreground p-8 lg:p-16 flex flex-col justify-between relative z-10 shrink-0 overflow-hidden">
        
        {/* Decorative Background Elements to avoid empty look */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0" />
        
        {/* Animated Glowing Blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] filter animate-pulse pointer-events-none z-0" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] filter animate-pulse delay-700 pointer-events-none z-0" />
        
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Header content ... */}
          <div className="animate-slide-up flex items-center gap-4 text-2xl font-bold tracking-tight">
            <img 
              src={logoUrl || "/favicon.ico"} 
              alt={dashboardTitle || defaultShopName} 
              className="w-16 h-16 object-contain rounded-xl shadow-md border border-border bg-white dark:bg-transparent animate-in zoom-in duration-300" 
            />
            {dashboardTitle || defaultShopName}
          </div>

          {/* Middle Content */}
          <div className="max-w-md my-12 lg:my-auto">
            {showTag && (
              <div className="animate-slide-up delay-100 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                <ShieldCheck className="w-4 h-4" /> {tagLabel}
              </div>
            )}
            
            <h1 className="animate-slide-up delay-150 text-4xl lg:text-5xl font-black leading-tight text-foreground mb-6 tracking-tight">
              Control Center
            </h1>
            
            <div className="animate-slide-up delay-200 w-16 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6"></div>

            <p className="animate-slide-up delay-300 text-muted-foreground text-lg leading-relaxed">
              {description}
            </p>
            <div className="animate-slide-up delay-400 mt-12">
              <a 
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
              >
                Visit Store
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="animate-slide-up delay-500 text-sm font-medium text-muted-foreground/80 mt-12 lg:mt-0">
            {footerText || `© 2026 ${defaultShopName}. All rights reserved.`}
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL --- */}
      <div className="animate-fade-in w-full lg:flex-1 p-8 lg:p-16 flex flex-col justify-center items-center bg-background relative z-0">
        <div className="animate-slide-up delay-300 w-full max-w-md relative z-10">
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
