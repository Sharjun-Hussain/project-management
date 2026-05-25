"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  History,
  User as UserIcon,
  X,
  Loader2,
  Calendar,
  Layers,
  Activity,
  UserCircle,
} from "lucide-react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { getImageUrl } from "../../../lib/utils";
import { toast } from "sonner";

const getAvatarUrl = (user) => {
  if (user?.profile_image && user.profile_image !== "/image") {
    return getImageUrl(user.profile_image);
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random&color=fff&bold=true`;
};

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const containerRef = useRef(null);
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const tableRef = useRef(null);

  // --- API FETCHING ---
  const { data: logsResponse, isLoading, mutate } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/activity-logs?page=${currentPage}&per_page=${itemsPerPage}&module=${selectedModule}&action_type=${selectedAction}&sort_order=${sortOrder}`,
          session?.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken),
    { revalidateOnFocus: false }
  );

  const { data: logDetailsResponse, isLoading: isDetailsLoading } = useSWR(
    session?.accessToken && selectedLog?.id
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/activity-logs/${selectedLog.id}`,
          session?.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken)
  );

  const logDetails = logDetailsResponse?.data || selectedLog;

  const logs = useMemo(() => logsResponse?.data?.data || [], [logsResponse]);
  const totalPages = logsResponse?.data?.last_page || 1;
  const totalLogs = logsResponse?.data?.total || 0;

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [selectedModule, selectedAction, sortOrder]);

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }
      );
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  useGSAP(() => {
    if (tableRef.current && logs.length > 0) {
      gsap.fromTo(
        ".log-row",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.02,
          ease: "expo.out",
          clearProps: "all",
        }
      );
    }
  }, [logs]);

  // Drawer Animation
  useGSAP(() => {
    if (selectedLog && drawerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        drawerRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power4.out" }
      );
    }
  }, [selectedLog]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    const tl = gsap.timeline({ onComplete: () => setSelectedLog(null) });
    tl.to(drawerRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
    }).to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white px-8 py-6 space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-header">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <History className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-600" />Activity Logs</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Monitor system activities and admin actions.
          </p>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div className="animate-toolbar flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Module:</span>
            <div className="relative flex items-center">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="appearance-none w-36 sm:w-40 pl-2.5 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500/80 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="Authentication">Authentication</option>
                <option value="RBAC">RBAC</option>
                <option value="User Management">User Management</option>
                <option value="Products">Products</option>
                <option value="Categories">Categories</option>
                <option value="Settings">Settings</option>
                <option value="Reviews">Reviews</option>
                <option value="Support">Support</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Action:</span>
            <div className="relative flex items-center">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="appearance-none w-32 sm:w-36 pl-2.5 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500/80 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">Sort:</span>
            <div className="relative flex items-center">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none w-32 sm:w-36 pl-2.5 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:border-indigo-500/80 transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Logs: {totalLogs}</span>
        </div>
      </div>

      {/* 3. LOGS TABLE */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] z-10 relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse" ref={tableRef}>
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="p-4 pl-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Module</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 mb-2 animate-spin text-indigo-600" />
                      <p className="text-sm font-medium">Loading activity logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="log-row hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(log.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600">
                          <img
                            src={getAvatarUrl(log.user)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {log.user?.name || "System"}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            {log.ip_address}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('cancel') 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('verify')
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md line-clamp-1 italic">
                        "{log.description}"
                      </p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Activity className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No activity logs found matching your filters.</p>
                      <button
                        onClick={() => {
                          setSelectedModule("all");
                          setSelectedAction("all");
                          setSortOrder("DESC");
                        }}
                        className="mt-2 text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2 font-medium">
              Page <span className="text-slate-900 dark:text-white font-black">{currentPage}</span> of <span className="text-slate-900 dark:text-white font-black">{totalPages}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-black text-slate-400">{currentPage}</span>
                <span className="text-[10px] text-slate-300">/</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. LOG DETAILS DRAWER */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          onClick={() => handleCloseDrawer()}
        >
          <div 
             ref={overlayRef}
             className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity" 
             onClick={handleCloseDrawer}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16">
            <div 
              ref={drawerRef}
              className="w-screen max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Activity Detail</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{selectedLog.id}</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseDrawer}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isDetailsLoading && !logDetailsResponse ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                    <p className="text-sm font-medium">Loading detailed log data...</p>
                  </div>
                ) : logDetails ? (
                  <>
                    {/* Basic Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <UserCircle className="w-3 h-3" /> Performed By
                        </p>
                        <div className="flex items-center gap-3">
                          <img src={getAvatarUrl(logDetails.user)} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                          <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{logDetails.user?.name || "System"}</p>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{logDetails.user?.email || "No Email"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Occurred At
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {new Date(logDetails.created_at).toLocaleString("en-US", {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action Info */}
                    <div className="p-5 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-600 text-white rounded shadow-sm">{logDetails.module}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded shadow-sm">{logDetails.action}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                        "{logDetails.description}"
                      </p>
                    </div>

                    {/* Payload JSON */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Layers className="w-3 h-3" /> Technical Payload 
                          </h4>
                      </div>
                      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl font-mono text-[11px] overflow-x-auto text-indigo-400 custom-tiny-scrollbar">
                        <pre className="selection:bg-indigo-500/30">{JSON.stringify(logDetails.payload, null, 2)}</pre>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-6">
                       <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">IP Address</p>
                          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{logDetails.ip_address}</p>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">User Agent</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate w-full" title={logDetails.user_agent}>{logDetails.user_agent}</p>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <p>No log details available.</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
                <button 
                  onClick={handleCloseDrawer}
                  className="px-8 py-2.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
