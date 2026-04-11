"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronRight, Plus, Box, Layers, Tag, Ticket, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import GlobalSearch from "./GlobalSearch";
import { useGlobalSettings } from "../context/GlobalSettingsContext";

export default function AdminLayoutClient({ children, sidebar, initialCollapsed }) {
  const { dashboardTitle, faviconUrl } = useGlobalSettings();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync with Sidebar events for layout padding
  useEffect(() => {
    const handleToggle = (e) => {
      setIsCollapsed(e.detail);
    };
    window.addEventListener("sidebar_toggle", handleToggle);
    return () => window.removeEventListener("sidebar_toggle", handleToggle);
  }, []);

  const toggleCollapse = () => {
    // Dispatch event so SidebarClient can react
    window.dispatchEvent(new CustomEvent("sidebar_toggle_request"));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setQuickCreateOpen(false);
      }
    }
    if (quickCreateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickCreateOpen]);

  // --- DYNAMIC BRANDING (Side Effects for client-side updates if needed) ---
  useEffect(() => {
    // 1. Update Document Title
    if (dashboardTitle) {
      document.title = dashboardTitle;
    }

    // 2. Update Favicon
    if (faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [dashboardTitle, faviconUrl]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white">
      <NextTopLoader
        color="#4f46e5"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #4f46e5,0 0 5px #4f46e5"
      />

      {/* Render Server-Provided Sidebar directly */}
      {sidebar}

      {/* MAIN CONTENT AREA */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>

        {/* TOP HEADER */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          <div className="flex items-center gap-4">
            {/* Mobile Toggle */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sidebar_mobile_toggle", { detail: true }))}
              className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
              <Link href="/app" className="hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              {pathname.split("/").filter(Boolean).slice(1).map((segment, index, array) => {
                const href = `/app/${array.slice(0, index + 1).join("/")}`;
                const isLast = index === array.length - 1;
                return (
                  <React.Fragment key={href}>
                    <ChevronRight className="w-4 h-4 mx-1 text-slate-400" />
                    {isLast ? (
                      <span className="text-slate-900 dark:text-white font-semibold capitalize">
                        {segment.replace(/-/g, " ")}
                      </span>
                    ) : (
                      <Link href={href} className="hover:text-indigo-600 transition-colors capitalize">
                        {segment.replace(/-/g, " ")}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Create Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>

              {quickCreateOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Create New
                  </p>
                  <Link
                    href="/app/products/new"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Product</span>
                  </Link>
                  <Link
                    href="/app/categories?action=create"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Category</span>
                  </Link>
                  <Link
                    href="/app/brand?action=create"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Brand</span>
                  </Link>
                  <Link
                    href="/app/coupons?action=create"
                    onClick={() => setQuickCreateOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Offer / Coupon</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>


          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 ">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-700 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          © 2026 Igen LK. All rights reserved. | Powered by Inzeedo (PVT) Ltd
        </footer>

      </div >
    </div>
  );
}
