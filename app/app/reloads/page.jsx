"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search, Plus, Filter, Edit3, Trash2, X, AlertCircle, LayoutGrid, List as ListIcon, Loader2, Globe, CreditCard, ChevronLeft, ChevronRight, ArrowUpDown, Info, Tag, Calendar, DollarSign, RefreshCw
} from "lucide-react";
import { FormInput, FormTextarea, FormSwitch } from "@/components/forms/reusable-fields";

const getGradient = (name = "") => {
  const char = name.trim().charAt(0).toUpperCase() || "?";
  const code = char.charCodeAt(0) || 0;
  const gradients = [
    "from-indigo-500 to-purple-600 shadow-indigo-500/20",
    "from-pink-500 to-rose-600 shadow-pink-500/20",
    "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    "from-amber-500 to-orange-600 shadow-amber-500/20",
    "from-blue-500 to-indigo-600 shadow-blue-500/20",
    "from-purple-500 to-fuchsia-600 shadow-purple-500/20",
    "from-cyan-500 to-blue-600 shadow-cyan-500/20",
    "from-teal-500 to-emerald-600 shadow-teal-500/20",
  ];
  return gradients[code % gradients.length];
};

export default function ReloadsContent() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.some(role => role.name === "Admin" || role.name === "Super Admin");

  const hasPermission = (permissionName) => {
    if (isAdmin) return true;
    return userRoles.some(role => 
      role.permissions?.some(p => p.name === permissionName)
    );
  };

  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // Initialize searchTerm from URL query parameter on mount
  useEffect(() => {
    const initialSearch = searchParams.get("search") || "";
    setSearchTerm(initialSearch);
  }, [searchParams]);

  // --- PAGINATION & SORTING STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [sortBy, setSortBy] = useState("expiry_date");
  const [sortOrder, setSortOrder] = useState("asc");

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    account_number: "",
    amount: "",
    last_reloaded_date: "",
    expiry_date: "",
    is_active: 1,
  });
  const [validationErrors, setValidationErrors] = useState({});

  // --- SWR FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data.data;
  };

  const queryParams = new URLSearchParams({
    page: currentPage,
    search: searchTerm,
  }).toString();

  const { data: fetchResult, error: fetchError, isLoading: isFetching } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reloads?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (fetchResult) {
      setItems(fetchResult.data || []);
      setCurrentPage(fetchResult.current_page || 1);
      setLastPage(fetchResult.last_page || 1);
      setTotalPages(fetchResult.total || 0);
      setLoading(false);
    }
    if (fetchError) {
      toast.error(fetchError.message || "Failed to load reloads");
      setLoading(false);
    }
    if (isFetching) {
      setLoading(true);
    }
  }, [fetchResult, fetchError, isFetching]);

  const refreshData = () => {
    mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reloads?${queryParams}`);
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(".animate-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 });
      tl.fromTo(".animate-toolbar", { y: 10, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 }, "-=0.4");
    },
    { scope: containerRef }
  );

  useGSAP(() => {
    gsap.killTweensOf(".item-card");
    gsap.fromTo(".item-card", { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.04, ease: "expo.out", clearProps: "all" });
  }, [viewMode, items, searchTerm]);

  useGSAP(() => {
    if (isFormOpen && formContentRef.current) {
      gsap.fromTo(formOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(formContentRef.current, { x: "100%" }, { x: "0%", duration: 0.6, ease: "power4.out" });
    }
  }, [isFormOpen]);

  useGSAP(() => {
    if (isDeleteOpen && deleteContentRef.current) {
      gsap.fromTo(deleteOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(deleteContentRef.current, { scale: 0.9, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" });
    }
  }, [isDeleteOpen]);

  const closeFormWithAnim = () => {
    if (!formContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsFormOpen(false) });
    tl.to(formContentRef.current, { x: "100%", duration: 0.4, ease: "power3.in" })
      .to(formOverlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const closeDeleteWithAnim = () => {
    if (!deleteContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsDeleteOpen(false) });
    tl.to(deleteContentRef.current, { scale: 0.95, opacity: 0, duration: 0.2, ease: "power2.in" })
      .to(deleteOverlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedItem(null);
    setFormData({
      name: "",
      account_number: "",
      amount: "",
      last_reloaded_date: "",
      expiry_date: "",
      is_active: 1,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode("edit");
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      account_number: item.account_number || "",
      amount: item.amount || "",
      last_reloaded_date: item.last_reloaded_date ? item.last_reloaded_date.split('T')[0] : "",
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : "",
      is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreate();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = formMode === "edit"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reloads/${selectedItem.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reloads`;

      const data = await globalFetcher(url, session?.accessToken, {
        method: formMode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (data && data.status === "success") {
        toast.success(formMode === "edit" ? "Reload updated" : "Reload created");
        closeFormWithAnim();
        refreshData();
      } else {
        toast.error(data?.message || "Operation failed");
      }
    } catch (error) {
      if (error.info && error.info.errors) {
        const errorsMap = {};
        error.info.errors.forEach(err => {
          errorsMap[err.field] = err.messages[0];
        });
        setValidationErrors(errorsMap);
      } else {
        toast.error(error.message || "An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reloads/${selectedItem.id}`, session?.accessToken, {
        method: "DELETE",
      });
      if (data && data.status === "success") {
        toast.success("Reload deleted successfully");
        closeDeleteWithAnim();
        refreshData();
      } else {
        toast.error(data.message || "Failed to delete reload");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting reload");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortOrder]);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-x-hidden px-8 py-6">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="animate-header">
            <div className="flex gap-4 items-stretch">
              <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex flex-col justify-center py-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">Reloads Manager</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Keep track of expiring reloads, prepaid lines, and metered quotas.</p>
              </div>
            </div>
          </div>

          <div className="animate-header flex items-center gap-3">
             <button onClick={handleOpenCreate} className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform">
               <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
               <span>Add Reload</span>
             </button>
          </div>
        </div>

        <div className="animate-toolbar sticky top-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
                placeholder="Search reloads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-700 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</span>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2">
                <option value="expiry_date">Expiry Date</option>
                <option value="name">Name</option>
                <option value="account_number">Account No</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 dark:text-slate-400"
              >
                <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}>
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Grid</span>
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}>
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">List</span>
            </button>
          </div>
        </div>

        <div className="relative min-h-[400px] mt-6">
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs flex flex-col h-[210px] animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 mb-4 mt-2">
                      <div className="h-7 bg-slate-100 dark:bg-slate-700/50 rounded-lg w-full"></div>
                      <div className="h-7 bg-slate-100 dark:bg-slate-700/50 rounded-lg w-full"></div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-700/50 mt-auto">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                        <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                       <th className="p-4 pl-8"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></th>
                       <th className="p-4"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></th>
                       <th className="p-4"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></th>
                       <th className="p-4"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></th>
                       <th className="p-4"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></th>
                       <th className="p-4 pr-8"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto"></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 animate-pulse">
                        <td className="p-4 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                          </div>
                        </td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                        <td className="p-4"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-16"></div></td>
                        <td className="p-4 pr-8">
                          <div className="flex justify-end gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : sortedItems.length === 0 ? (
            <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <RefreshCw className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No reloads found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">Keep track of expiring items and accounts by adding your first reload record today.</p>
              <button onClick={handleOpenCreate} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add Your First Reload
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedItems.map((item) => {
                    const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // within 7 days
                    return (
                      <div key={item.id} className="item-card group relative bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-slate-600 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-[14px] bg-linear-to-br ${getGradient(item.name)} text-white flex items-center justify-center text-xl font-bold shadow-sm shrink-0`}>
                            {item.name.trim().charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {isExpiring && (
                              <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md text-[11px] font-medium border border-red-100 dark:border-red-800/50">
                                Expiring
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${item.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" : "bg-slate-50 text-slate-500 border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-5 flex-1 pl-1">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-indigo-50 transition-colors leading-tight mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="text-[13px] truncate">{item.account_number || "No Account #"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                          <div className="bg-slate-50/80 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 transition-colors group-hover:bg-indigo-50/30">
                            <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-0.5 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> Amount
                            </div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                              Rs {item.amount || "0.00"}
                            </div>
                          </div>
                          <div className={`rounded-xl p-3 border transition-colors ${isExpiring ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 group-hover:bg-indigo-50/30'}`}>
                            <div className={`text-[12px] font-medium mb-0.5 flex items-center gap-1 ${isExpiring ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Calendar className="w-3.5 h-3.5" /> Expiry
                            </div>
                            <div className={`font-semibold text-base ${isExpiring ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                              {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Last reload: {item.last_reloaded_date ? new Date(item.last_reloaded_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "-"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.preventDefault(); handleOpenEdit(item); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:text-indigo-400 dark:hover:bg-slate-700/50 rounded-lg transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.preventDefault(); handleOpenDelete(item); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-slate-700/50 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="p-4 pl-8 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reload</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account No</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiry</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 pr-8 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map((item) => (
                        <tr key={item.id} className="group border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getGradient(item.name)} text-white flex items-center justify-center font-black text-sm shadow-md`}>
                                {item.name.trim().charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {item.account_number || "-"}
                          </td>
                           <td className="p-4 text-sm font-semibold text-slate-800 dark:text-white">
                            Rs {item.amount || "0.00"}
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${item.is_active ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleOpenDelete(item)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div className="animate-toolbar mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-white font-bold">{items.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span> reloads
            </div>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(lastPage)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === lastPage || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}>
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <button disabled={currentPage === lastPage} onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div ref={formOverlayRef} className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm" onClick={closeFormWithAnim} />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div ref={formContentRef} className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700">
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {formMode === "create" ? "Add Reload" : "Edit Reload"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Provide details for this reload entry, such as expiry dates.</p>
                </div>
                <button onClick={closeFormWithAnim} className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <FormInput
                    label="Name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
                    }}
                    placeholder="e.g. Server Renewal / SIM Card"
                    error={validationErrors.name}
                  />

                  <FormInput
                    label="Account Number"
                    value={formData.account_number}
                    onChange={(e) => {
                      setFormData({ ...formData, account_number: e.target.value });
                      if (validationErrors.account_number) setValidationErrors({ ...validationErrors, account_number: null });
                    }}
                    placeholder="Account / Phone #"
                    error={validationErrors.account_number}
                    icon={<CreditCard className="w-4 h-4" />}
                  />

                   <FormInput
                    label="Amount"
                    value={formData.amount}
                    type="number"
                    step="0.01"
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (validationErrors.amount) setValidationErrors({ ...validationErrors, amount: null });
                    }}
                    placeholder="0.00"
                    error={validationErrors.amount}
                  />

                  <div className="grid grid-cols-2 gap-4">
                     <FormInput
                      label="Last Reload Date"
                      type="date"
                      value={formData.last_reloaded_date}
                      onChange={(e) => {
                        setFormData({ ...formData, last_reloaded_date: e.target.value });
                        if (validationErrors.last_reloaded_date) setValidationErrors({ ...validationErrors, last_reloaded_date: null });
                      }}
                       error={validationErrors.last_reloaded_date}
                    />

                    <FormInput
                      label="Expiry Date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => {
                        setFormData({ ...formData, expiry_date: e.target.value });
                        if (validationErrors.expiry_date) setValidationErrors({ ...validationErrors, expiry_date: null });
                      }}
                       error={validationErrors.expiry_date}
                    />
                  </div>

                  <div className="pt-2">
                    <FormSwitch
                      label="Status"
                      description="Is this reload tracking active currently?"
                      checked={!!formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked ? 1 : 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex gap-3">
                <button type="button" onClick={closeFormWithAnim} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} type="button" disabled={!formData.name || isSubmitting} className={`flex items-center justify-center gap-2 flex-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all transform active:scale-95 ${(!formData.name || isSubmitting) ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"}`}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{formMode === "create" ? "Creating..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{formMode === "create" ? "Save Reload" : "Update Changes"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div ref={deleteOverlayRef} className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" onClick={closeDeleteWithAnim} />
          <div ref={deleteContentRef} className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Reload</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{selectedItem?.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={closeDeleteWithAnim} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
