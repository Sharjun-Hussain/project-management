"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import { useCurrency } from "../context/CurrencyContext";
import {Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Calendar,
  ShieldAlert,
  Ban,
  CheckCircle2,
  DollarSign,
  Check,
  Trash2,
  X, Users} from "lucide-react";
import { exportToCSV } from "@/app/lib/exportUtils";

// --- THEMED CHECKBOX COMPONENT ---
const Checkbox = ({ checked, onChange, indeterminate = false }) => {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${checked || indeterminate
        ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20"
        : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
        }`}
    >
      {checked && !indeterminate && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
      {indeterminate && <div className="w-2 h-0.5 bg-white rounded-full" />}
    </button>
  );
};

export default function ClientsPage() {
  const { data: session } = useSession();
  const containerRef = useRef(null);
  const { symbol } = useCurrency();

  // --- STATE ---
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- FILTER STATES ---
  const [activeTab, setActiveTab] = useState("All"); // All, Active, Blocked

  // Date Filter
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateRange, setDateRange] = useState({ label: "Any Time", days: null });

  // Status Filter Menu
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilters, setStatusFilters] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer Actions
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // --- REFS ---
  const tableRef = useRef(null);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // --- DATA FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data.data;
  };

  const queryParams = new URLSearchParams({
    page: currentPage,
    per_page: itemsPerPage,
    search: searchTerm,
    status: activeTab !== "All" ? activeTab : "",
    // Add other filters if API supports them
  }).toString();

  const { data: swrData, error: swrError, isLoading: swrLoading } = useSWR(
    session?.accessToken
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/customers?${queryParams}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (swrData) {
      // Map API data to UI format
      const mappedClients = (swrData.data || []).map((c) => ({
        id: c.id,
        name: c.user?.name || "Unknown",
        email: c.user?.email || "",
        phone: c.phone || "",
        location: [c.city, c.state, c.country].filter(Boolean).join(", ") || "N/A",
        ordersCount: 0, // Placeholder
        totalSpent: "0.00", // Placeholder
        joinedDate: new Date(c.created_at),
        joinedDateStr: new Date(c.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: c.user?.is_active ? "Active" : "Blocked",
        avatar: c.user?.profile_image || `https://ui-avatars.com/api/?name=${c.user?.name || "User"}&background=random`,
        originalData: c, // Keep original data for reference
      }));

      setClients(mappedClients);
      setCurrentPage(swrData.current_page || 1);
      setLastPage(swrData.last_page || 1);
      setTotalPages(swrData.total || 0);
      setLoading(false);
    }
    if (swrError) {
      toast.error(swrError.message || "Failed to fetch clients");
      setLoading(false);
    }
    if (swrLoading) {
      setLoading(true);
    }
  }, [swrData, swrError, swrLoading]);

  // --- FILTER LOGIC (Client-side refinement if needed, but mainly server-side now) ---
  const filteredClients = useMemo(() => {
    // Since we are fetching from API with search/filter, we might just return clients
    // But for date range (if API doesn't support it yet) we can filter here
    return clients.filter((c) => {
      // 3. Date Filter (Joined within X days)
      let matchesDate = true;
      if (dateRange.days !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dateRange.days);
        matchesDate = c.joinedDate >= cutoffDate;
      }

      // 4. Advanced Status Filter (Multi-select) - if used in addition to tabs
      let matchesStatusFilter = true;
      if (statusFilters.length > 0) {
        matchesStatusFilter = statusFilters.includes(c.status);
      }

      return matchesDate && matchesStatusFilter;
    });
  }, [clients, dateRange, statusFilters]);

  // Reset page on filter change
  useEffect(
    () => setCurrentPage(1),
    [searchTerm, activeTab, dateRange, statusFilters, itemsPerPage]
  );

  // --- SELECTION HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClients.length && filteredClients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map((c) => c.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < filteredClients.length;

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Header & Stats
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );
      tl.fromTo(
        ".animate-stat",
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05 },
        "-=0.6",
      );
      // Toolbar
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4",
      );
    },
    { scope: containerRef },
  );

  // Row Transitions
  useGSAP(() => {
    if (tableRef.current && !loading) {
      gsap.fromTo(
        ".client-row",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.02,
          ease: "expo.out",
          clearProps: "all",
        },
      );
    }
  }, [filteredClients, loading]);

  // Drawer Animation
  useGSAP(() => {
    if (selectedClient && drawerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.fromTo(
        drawerRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power4.out" },
      );
    }
  }, [selectedClient]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    setShowActionsMenu(false);
    const tl = gsap.timeline({ onComplete: () => setSelectedClient(null) });
    tl.to(drawerRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
    }).to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  const handleDateSelect = (label, days) => {
    setDateRange({ label, days });
    setShowDateMenu(false);
  };

  const toggleStatusFilter = (status) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter((s) => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  const handleExport = () => {
    const headerMap = {
      id: "ID",
      name: "Name",
      email: "Email",
      phone: "Phone",
      location: "Location",
      status: "Status",
      joinedDateStr: "Joined Date",
    };
    exportToCSV(clients, "Clients", headerMap);
  };

  // --- HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "Blocked":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans px-8 py-6 text-slate-900 dark:text-white overflow-x-hidden relative"
      onClick={() => {
        if (showDateMenu) setShowDateMenu(false);
        if (showFilterMenu) setShowFilterMenu(false);
      }}
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  mb-8">
        <div className="animate-header">
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Clients</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">View and manage your client base.</p>
            </div>
          </div>
        </div>
        <div className="animate-header flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit px-4">
            <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-full shadow-2xl py-1.5 px-3 flex items-center gap-3 border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-center gap-2 px-2 shrink-0">
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {selectedIds.length}
                </div>
                <span className="text-[11px] font-semibold whitespace-nowrap">Selected</span>
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1 hover:bg-white/5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    toast.success(`Bulk delete initiated for ${selectedIds.length} clients`);
                    setSelectedIds([]);
                  }}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-red-500/20 whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Clients",
            val: totalPages.toString(), // Use total from API
            icon: User,
            color: "text-indigo-600",
          },
          {
            label: "Active Members",
            val: "0", // Placeholder - API doesn't provide this yet
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
          {
            label: "Blocked Users",
            val: "0", // Placeholder
            icon: Ban,
            color: "text-red-600",
          },
          {
            label: "Avg. Spend",
            val: `${symbol}0`, // Placeholder
            icon: DollarSign,
            color: "text-blue-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="animate-stat bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${stat.color}`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TOOLBAR */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 mb-6 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-3">
          {/* Tab Filters */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto scrollbar-hide">
            {["All", "Active", "Blocked"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* DATE JOINED FILTER */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateMenu(!showDateMenu);
                  setShowFilterMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold transition-colors ${showDateMenu ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateRange.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${showDateMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showDateMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Joined Within
                  </div>
                  {[
                    { label: "Any Time", days: null },
                    { label: "Last 30 Days", days: 30 },
                    { label: "Last 90 Days", days: 90 },
                    { label: "Last Year", days: 365 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateSelect(item.label, item.days);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${dateRange.label === item.label ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      {item.label}
                      {dateRange.label === item.label && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STATUS FILTER DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                  setShowDateMenu(false);
                }}
                className={`p-2 border rounded-lg transition-all ${showFilterMenu ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400"}`}
              >
                <div className="relative">
                  <Filter className="w-4 h-4" />
                  {statusFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full border border-white dark:border-slate-800"></span>
                  )}
                </div>
              </button>

              {showFilterMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                    Filter Status
                  </h4>
                  <div className="space-y-1">
                    {["Active", "Blocked"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={statusFilters.includes(status)}
                          onChange={() => toggleStatusFilter(status)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMER TABLE */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading clients...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" ref={tableRef}>
              <thead className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                <tr>
                  <th className="p-4 px-6 w-12 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="p-4 px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="p-4 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="p-4 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="p-4 px-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="client-row hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer group"
                    >
                      <td
                        className="p-4 px-6 w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedIds.includes(client.id)}
                            onChange={() => toggleSelectItem(client.id)}
                          />
                        </div>
                      </td>
                      <td className="p-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600">
                            <img
                              src={client.avatar}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                {client.name}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(client.status)}`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {client.location}
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {client.joinedDateStr}
                      </td>
                      <td className="p-4 px-6 text-right">
                        <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                    >
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. PAGINATION FOOTER (MATCHING ORDERS PAGE) */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider opacity-60">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center gap-1">
              {filteredClients.length > 0 ? (
                <>
                  <span className="text-slate-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>
                  <span className="opacity-40">-</span>
                  <span className="text-slate-900 dark:text-white">
                    {Math.min(currentPage * itemsPerPage, totalPages)}
                  </span>
                  <span className="opacity-40 ml-1">of</span>
                  <span className="text-slate-900 dark:text-white ml-1">
                    {totalPages}
                  </span>
                </>
              ) : (
                <span>0 results</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {[...Array(Math.min(5, lastPage))].map((_, i) => {
                let pageNum = i + 1;
                if (lastPage > 5) {
                  if (currentPage > 3) pageNum = currentPage - 2 + i;
                  if (pageNum > lastPage) return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${currentPage === pageNum
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-90"
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
              disabled={currentPage === lastPage || lastPage === 0}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- DETAILS DRAWER --- */}
      {selectedClient && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setShowActionsMenu(false)}
        >
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16 z-[101]">
            <div
              ref={drawerRef}
              className="w-screen max-w-xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Header */}
              <div className="relative h-32 bg-slate-100 dark:bg-slate-900">
                <div className="absolute inset-0 bg-indigo-600/10 pattern-dots"></div>
                <button
                  onClick={handleCloseDrawer}
                  className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 relative -mt-12 flex items-end justify-between mb-6">
                <div className="flex items-end gap-4">
                  <img
                    src={selectedClient.avatar}
                    className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-800"
                  />
                  <div className="pb-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">
                      {selectedClient.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedClient.location}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(selectedClient.status)}`}
                      >
                        {selectedClient.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-tiny-scrollbar">


                {/* Contact Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    Contact Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedClient.email}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          Primary Email
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedClient.phone}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">Mobile</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedClient.location}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          Billing Address
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase mb-1">
                      Lifetime Spent
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {symbol}{selectedClient.totalSpent}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase mb-1">
                      Total Orders
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedClient.ordersCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center relative">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(!showActionsMenu);
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white font-bold text-sm"
                  >
                    Manage
                  </button>
                  {showActionsMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                      <button className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5" /> Block Client
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" /> Reset Password
                      </button>
                    </div>
                  )}
                </div>

                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
