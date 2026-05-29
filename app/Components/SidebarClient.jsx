"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ChevronRight,
  LogOut,
  X,
  Layers,
  Sun,
  Moon,
  LayoutDashboard,
  ShoppingBag,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  Tag,
  MessageSquare,
  Monitor,
  ShieldCheck,
  History,
  Lock,
  Mail,
  Smile
} from "lucide-react";

import { useGlobalSettings } from "../app/context/GlobalSettingsContext";
import { setCookie } from "@/lib/cookies";
import { User } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const IconMap = {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  Layers,
  Tag,
  MessageSquare,
  Monitor,
  ShieldCheck,
  History,
  Lock,
  Mail,
  Smile,
};

// --- FLOATING TOOLTIP COMPONENT ---
const FloatingTooltip = ({ text, top, visible }) => {
  return (
    <div
      className={`fixed left-20 ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded-lg pointer-events-none z-9999 shadow-2xl border border-slate-700 dark:border-slate-700/50 transition-all duration-150 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{ top: `${top}px`, transform: 'translateY(-50%)' }}
    >
      {text}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800"></div>
    </div>
  );
};

// --- CUSTOM SCROLLBAR CSS ---
const SCROLLBAR_STYLES = `
  .custom-tiny-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-tiny-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-tiny-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 20px;
  }
  .dark .custom-tiny-scrollbar::-webkit-scrollbar-thumb {
    background-color: #1e293b;
  }
  .custom-tiny-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

export default function SidebarClient({ menuGroups, initialCollapsed, session, toggleSidebarMobile }) {
  const pathname = usePathname();
  const { dashboardTitle } = useGlobalSettings(); // logoUrl handled by layout/server usually
  const defaultShopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium";
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState({ text: "", top: 0, visible: false });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- REFS FOR LOGOUT MODAL ---
  const logoutOverlayRef = useRef(null);
  const logoutContentRef = useRef(null);


  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update collapse state and cookie
  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    setCookie("sidebar_collapsed", newState.toString());
    // Also notify parent if needed for layout adjustments
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("sidebar_toggle", { detail: newState }));
    }
  };

  // Synchronize state if props change (though typically they won't)
  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  // Listen for mobile overlay toggle
  useEffect(() => {
    const handleMobileToggle = (e) => setIsOpen(e.detail);
    window.addEventListener("sidebar_mobile_toggle", handleMobileToggle);
    return () => window.removeEventListener("sidebar_mobile_toggle", handleMobileToggle);
  }, []);

  // Listen for external toggle requests (e.g. from Header)
  useEffect(() => {
    const handleToggleRequest = () => {
      handleToggleCollapse();
    };
    window.addEventListener("sidebar_toggle_request", handleToggleRequest);
    return () => window.removeEventListener("sidebar_toggle_request", handleToggleRequest);
  }, [isCollapsed]);

  // Auto-expand menu based on current path
  useEffect(() => {
    if (isCollapsed) return;
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.submenu && item.submenu.some((sub) => sub.href === pathname)) {
          setOpenSubmenu(item.title);
        }
      }
    }
  }, [pathname, isCollapsed, menuGroups]);

  const toggleSubmenu = (title) => {
    if (isCollapsed) {
      handleToggleCollapse();
      setOpenSubmenu(title);
      return;
    }
    setOpenSubmenu(openSubmenu === title ? "" : title);
  };

  const showTooltip = (e, text) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      top: rect.top + rect.height / 2,
      visible: true
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // --- LOGOUT MODAL ANIMATION ---
  const closeLogoutWithAnim = () => {
    if (!logoutContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setShowLogoutConfirm(false) });
    tl.to(logoutContentRef.current, {
      scale: 0.95,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    }).to(logoutOverlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  const { data: statsRes } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?order_status=pending&per_page=1`, session.accessToken] : null,
    ([url, token]) => fetcher(url, token),
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const pendingCount = statsRes?.data?.total || 0;

  const openLogoutWithAnim = () => {
    setShowLogoutConfirm(true);
  };

  useGSAP(() => {
    if (showLogoutConfirm && logoutContentRef.current) {
      gsap.fromTo(
        logoutOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(
        logoutContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
      );
    }
  }, [showLogoutConfirm]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style>{SCROLLBAR_STYLES}</style>

      {/* Mini Sidebar Tooltip */}
      {isCollapsed && <FloatingTooltip {...tooltip} />}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          text-slate-600 dark:text-slate-300
          transition-all duration-300 ease-in-out shadow-2xl
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* 1. BRAND LOGO */}
        <div className={`h-20 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-between sticky top-0 z-10 bg-white dark:bg-slate-900"}`}>
          <Link
            href="/app"
            onMouseEnter={(e) => showTooltip(e, dashboardTitle || defaultShopName)}
            onMouseLeave={hideTooltip}
            className="flex items-center gap-3 group overflow-hidden shrink-0"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <Layers className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="font-bold text-base tracking-tight leading-none text-slate-900 dark:text-white truncate max-w-[120px]">
                  {dashboardTitle || defaultShopName}
                </h1>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                  Admin Dashboard
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* 2. NAVIGATION LINKS */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'no-scrollbar overflow-x-hidden' : 'p-4'} py-6 space-y-8 custom-tiny-scrollbar`}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!isCollapsed && (
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-3 animate-in fade-in duration-300">
                  {group.label}
                </h3>
              )}
              {isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4 mb-4"></div>}

              <div className="space-y-1">
                {group.items.map((item, index) => {
                  const isActive = pathname === item.href;
                  const hasSubmenu = item.submenu;
                  const isSubmenuOpen = openSubmenu === item.title;
                  const isParentActive =
                    hasSubmenu &&
                    item.submenu.some((sub) => sub.href === pathname);

                  return (
                    <div 
                      key={index} 
                      className={`${isCollapsed ? "px-2" : ""} animate-in fade-in slide-in-from-left-2 duration-300`}
                      style={{ animationFillMode: "backwards", animationDelay: `${(gIdx * 4 + index) * 50}ms` }}
                    >
                      {/* Main Item */}
                      {hasSubmenu ? (
                        <button
                          onClick={() => toggleSubmenu(item.title)}
                          onMouseEnter={(e) => showTooltip(e, item.title)}
                          onMouseLeave={hideTooltip}
                          className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 group
                            ${isCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"}
                            ${isSubmenuOpen || isParentActive
                              ? "bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                              : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && IconMap[item.icon] && React.createElement(IconMap[item.icon], {
                              className: `w-5 h-5 shrink-0 ${isParentActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-white"}`
                            })}
                            {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-200">{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-300 ${isSubmenuOpen
                                  ? "rotate-90 text-indigo-600 dark:text-indigo-400"
                                  : "text-slate-400"
                                }`}
                            />
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onMouseEnter={(e) => showTooltip(e, item.title)}
                          onMouseLeave={hideTooltip}
                          className={`relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group
                            ${isCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"}
                            ${isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && IconMap[item.icon] && React.createElement(IconMap[item.icon], {
                              className: `w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-white"}`
                            })}
                            {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-200">{item.title}</span>}
                          </div>
                          {(() => {
                            const badgeValue = item.title === "Orders" ? pendingCount : item.badge;
                            if (!badgeValue || badgeValue === 0 || badgeValue === "0") return null;

                            return (
                              <>
                                {!isCollapsed && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                                  >
                                    {badgeValue}
                                  </span>
                                )}
                                {isCollapsed && (
                                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-600 rounded-full border border-white dark:border-slate-950"></span>
                                )}
                              </>
                            );
                          })()}
                        </Link>
                      )}

                      {/* Submenu Items */}
                      {hasSubmenu && !isCollapsed && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubmenuOpen
                              ? "max-h-120 opacity-100 mt-1"
                              : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="pl-[1.35rem] ml-2.5 border-l border-slate-200 dark:border-slate-800 space-y-1 my-1">
                            {item.submenu.map((sub, idx) => (
                              <Link
                                key={idx}
                                href={sub.href}
                                className={`block px-4 py-2 rounded-lg text-sm transition-colors relative
                                  ${pathname === sub.href
                                    ? "text-indigo-600 dark:text-white font-medium bg-slate-50 dark:bg-slate-800/50 before:absolute before:left-[-11px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-600 dark:before:bg-indigo-500"
                                    : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                  }`}
                              >
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. USER FOOTER & THEME TOGGLE */}
        <div className={`p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 ${isCollapsed ? '' : 'sticky bottom-0 z-10'}`}>
          <div
            onMouseEnter={(e) => showTooltip(e, session?.user?.name || "Admin User")}
            onMouseLeave={hideTooltip}
            className={`group flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer mb-3 ${isCollapsed ? "p-2 justify-center" : "p-3"}`}
          >
            <div className="relative shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {session?.user?.name || "Admin User"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {session?.user?.email || `admin@${defaultShopName.toLowerCase().replace(/\s+/g, "")}.com`}
                  </p>
                </div>
                <button
                  onClick={openLogoutWithAnim}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            onMouseEnter={(e) => showTooltip(e, theme === "dark" ? "Light Mode" : "Dark Mode")}
            onMouseLeave={hideTooltip}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isCollapsed ? "h-10" : ""}`}
          >
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              {!isCollapsed && <span className="animate-in fade-in duration-300">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>}
            </div>
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          <div
            ref={logoutOverlayRef}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={closeLogoutWithAnim}
          />
          <div
            ref={logoutContentRef}
            className="relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-slate-100 dark:border-slate-700 font-sans"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />

            <div className="relative text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10 rotate-3 transform transition-transform hover:rotate-6">
                <LogOut className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Sign Out?
              </h3>

              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Are you sure you want to end your session? You'll need to log in again to access the dashboard.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeLogoutWithAnim}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                 <button
                  onClick={async () => {
                    try {
                      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/logout`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session?.accessToken}`,
                          'Content-Type': 'application/json'
                        }
                      });
                    } catch (err) {
                      console.error("Failed to log logout action:", err);
                    }
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all transform active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
