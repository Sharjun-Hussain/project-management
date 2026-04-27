"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * Premium 403 Access Denied Page
 * Styled to match the dashboard's high-end aesthetic.
 */
export default function ForbiddenPage() {
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Background glow animation
    gsap.to(".bg-glow", {
      opacity: 0.6,
      duration: 3,
      repeat: -1,
      yoyo: true,
      stagger: 0.5
    });

    // Content entrance
    tl.fromTo(
      ".animate-content",
      { y: 40, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, stagger: 0.2 }
    );

    // Lock icon "shaking" then settling
    tl.fromTo(
      ".lock-icon",
      { rotate: -15 },
      { rotate: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" },
      "-=0.8"
    );
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative"
    >
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full bg-glow opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-500/5 blur-[120px] rounded-full bg-glow opacity-30 delay-1000" />

      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="animate-content mb-8 relative inline-block">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700/50 relative z-10 mx-auto">
            <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-slate-900 dark:text-white lock-icon" />
          </div>
          {/* Status Badge */}
          <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-500/40 z-20 uppercase tracking-tighter">
            Error 403
          </div>
        </div>

        <div className="animate-content space-y-4 mb-12">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Access <span className="text-red-500 italic block sm:inline">Denied</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            It looks like you don't have the required permissions to view this module. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="animate-content flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group"
          >
            <Home className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            Back to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Go Back
          </button>
        </div>

        {/* Support Info */}
        <div className="animate-content mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-red-500" />
             Security Event Logged
           </div>
           <span className="hidden sm:inline opacity-30">|</span>
           <div>Admin Node: 0x4F92</div>
        </div>
      </div>
    </div>
  );
}
