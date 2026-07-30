"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { getImageUrl } from "../../../lib/utils";
import { toast } from "sonner";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  X,
  UploadCloud,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Loader2,
  Globe,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Camera,
  Info,
  ToggleLeft,
  ToggleRight, Tag} from "lucide-react";
import { Suspense } from "react";
import { FormInput, FormTextarea, FormSwitch } from "@/components/forms/reusable-fields";

const getLicenseGradient = (name = "") => {
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

function LicenseContent() {
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
  const [licenses, setLicenses] = useState([]);
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
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedLicense, setSelectedLicense] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    description: "",
    is_featured: 0,
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

  const { data: licensesData, error: licensesError, isLoading: licensesLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (licensesData) {
      setLicenses(licensesData.data || []);
      setCurrentPage(licensesData.current_page || 1);
      setLastPage(licensesData.last_page || 1);
      setTotalPages(licensesData.total || 0);
      setLoading(false);
    }
    if (licensesError) {
      toast.error(licensesError.message);
      setLoading(false);
    }
    if (licensesLoading) {
      setLoading(true);
    }
  }, [licensesData, licensesError, licensesLoading]);

  const refreshLicenses = () => {
    mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands?${queryParams}`);
  };


  // ------------------------------------------------------------------
  // 1. PAGE LOAD ANIMATION
  // ------------------------------------------------------------------
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Header elements slide down smoothly
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );

      // Toolbar fades in
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        "-=0.4",
      );
    },
    { scope: containerRef },
  );

  // ------------------------------------------------------------------
  // 2. GRID/LIST SWITCH ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    // Kill any existing animations on these items to prevent glitches
    gsap.killTweensOf(".license-item");

    // Animate items in with a satisfying "pop" and stagger
    gsap.fromTo(
      ".license-item",
      {
        y: 20,
        opacity: 0,
        scale: 0.95,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.04,
        ease: "expo.out",
        clearProps: "all",
      },
    );
  }, [viewMode, licenses, searchTerm]);

  // ------------------------------------------------------------------
  // 3. FORM DRAWER ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isFormOpen && formContentRef.current) {
      // Overlay Fade
      gsap.fromTo(
        formOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
      // Drawer Slide
      gsap.fromTo(
        formContentRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.6, ease: "power4.out" },
      );
    }
  }, [isFormOpen]);

  // ------------------------------------------------------------------
  // 4. DELETE MODAL ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isDeleteOpen && deleteContentRef.current) {
      gsap.fromTo(
        deleteOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.fromTo(
        deleteContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" },
      );
    }
  }, [isDeleteOpen]);

  // --- HANDLERS WITH EXIT ANIMATIONS ---

  const closeFormWithAnim = () => {
    if (!formContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsFormOpen(false) });

    // Slide out slightly faster than slide in
    tl.to(formContentRef.current, {
      x: "100%",
      duration: 0.4,
      ease: "power3.in",
    }).to(formOverlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const closeDeleteWithAnim = () => {
    if (!deleteContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsDeleteOpen(false) });

    tl.to(deleteContentRef.current, {
      scale: 0.95,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    }).to(deleteOverlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedLicense(null);
    setFormData({
      name: "",
      website: "",
      description: "",
      is_featured: 0,
      is_active: 1,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (license) => {
    setFormMode("edit");
    setSelectedLicense(license);
    setFormData({
      name: license.name,
      website: license.website || "",
      description: license.description || "",
      is_featured: license.is_featured ? 1 : 0,
      is_active: license.is_active ? 1 : 0,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (license) => {
    setSelectedLicense(license);
    setIsDeleteOpen(true);
  };

  // Handle Quick Action from Header
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreate();
      // Clean up URL to prevent re-opening on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = formMode === "edit"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands/${selectedLicense.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands`;

      const data = await globalFetcher(url, session?.accessToken, {
        method: formMode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (data && data.status === "success") {
        toast.success(formMode === "edit" ? "License updated" : "License created");
        closeFormWithAnim();
        refreshLicenses();
      } else {
        toast.error(data?.message || "Operation failed");
      }
    } catch (error) {
      if (error.info && error.info.errors) {
        const errorsMap = {};
        error.info.errors.forEach(err => {
          let message = err.messages[0];
          if (err.field === "website" && message.includes("valid URL")) {
            message = `${message} (e.g., https://example.com)`;
          }
          errorsMap[err.field] = message;
        });
        setValidationErrors(errorsMap);
        // Removed toast here as per user request, errors are shown inline
      } else {
        toast.error(error.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands/${selectedLicense.id}`, session?.accessToken, {
        method: "DELETE",
      });
      if (data && data.status === "success") {
        toast.success("License deleted successfully");
        closeDeleteWithAnim();
        refreshLicenses();
      } else {
        toast.error(data.message || "Failed to delete license");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting license");
    } finally {
      setLoading(false);
    }
  };

  const sortedLicenses = React.useMemo(() => {
    return [...licenses].sort((a, b) => {
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
  }, [licenses, sortBy, sortOrder]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-x-hidden px-8 py-6"
    >
      {/* 1. TOP BAR */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="animate-header">
            <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">License Manager</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your product licenses and partners.</p>
            </div>
          </div>
          </div>

          <div className="animate-header flex items-center gap-3">
            {hasPermission("License Create") && (
              <button
                onClick={handleOpenCreate}
                className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add License</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TOOLBAR */}
        <div className="animate-toolbar sticky top-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-700 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="website">Website</option>
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
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">List</span>
            </button>
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="relative min-h-[400px] mt-6">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
              <p className="text-slate-400 font-bold text-sm animate-pulse tracking-widest uppercase">
                Loading licenses...
              </p>
            </div>
          ) : sortedLicenses.length === 0 ? (
            <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ImageIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No licenses found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
                Manage your product licenses and partners by adding your first license today.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                Add Your First License
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedLicenses.map((license) => (
                    <div
                      key={license.id}
                      className="license-item group relative bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Compact Header */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Elegant squircle avatar */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLicenseGradient(license.name)} text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0 transform transition-transform duration-300 group-hover:scale-105`}>
                          {license.name.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        
                        {/* Title & Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {license.is_featured ? (
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-amber-200/20 dark:border-amber-900/20 animate-pulse">
                                  Featured
                                </span>
                              ) : null}
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${license.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/20 dark:border-green-900/20" : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/20 dark:border-slate-700/20"}`}
                              >
                                {license.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words leading-tight">
                              {license.name}
                            </h3>
                          </div>
                          
                          {license.website ? (
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 min-w-0">
                              <Globe className="w-3 h-3 text-slate-450 shrink-0" />
                              <a href={license.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 truncate text-[10px] font-medium font-sans">
                                {license.website.replace(/^https?:\/\/(www\.)?/, '')}
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-350 dark:text-slate-600 mt-1 min-w-0 italic select-none">
                              <Globe className="w-3 h-3 text-slate-300 dark:text-slate-750 shrink-0" />
                              <span>No website</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description Block */}
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed min-h-[2.5rem]">
                          {license.description || <span className="text-slate-355 dark:text-slate-600 italic select-none">No description provided</span>}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-700/50 mt-auto">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg">
                          {license.products_count || 0} Products
                        </span>
                        <div className="flex gap-1">
                          {hasPermission("License Update") && (
                            <button onClick={() => handleOpenEdit(license)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-slate-700/50 rounded-xl transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("License Delete") && (
                            <button onClick={() => handleOpenDelete(license)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-slate-700/50 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
                        <th className="p-4 pl-8 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">License</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Products</th>
                        <th className="p-4 pr-8 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLicenses.map((license) => (
                        <tr key={license.id} className="group border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getLicenseGradient(license.name)} text-white flex items-center justify-center font-black text-sm shadow-md`}>
                                {license.name.trim().charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white">{license.name}</div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {license.website}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${license.is_active ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}>
                              {license.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">
                            {license.products_count || 0}
                          </td>
                           <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2">
                              {hasPermission("License Update") && (
                                <button onClick={() => handleOpenEdit(license)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission("License Delete") && (
                                <button onClick={() => handleOpenDelete(license)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

        {/* 4. PAGINATION */}
        {!loading && licenses.length > 0 && (
          <div className="animate-toolbar mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-white font-bold">{licenses.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span> licenses
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(lastPage)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === lastPage || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                disabled={currentPage === lastPage}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DRAWER / SIDE PANEL FORM --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            ref={formOverlayRef}
            className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm"
            onClick={closeFormWithAnim}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div
              ref={formContentRef}
              className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Drawer Header */}
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {formMode === "create"
                      ? "Add License"
                      : "Edit License"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure license details and assets.
                  </p>
                </div>
                <button
                  onClick={closeFormWithAnim}
                  className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <FormInput
                    label="License Name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
                    }}
                    placeholder="e.g. Sony"
                    error={validationErrors.name}
                  />

                  <FormInput
                    label="Website"
                    value={formData.website}
                    onChange={(e) => {
                      setFormData({ ...formData, website: e.target.value });
                      if (validationErrors.website) setValidationErrors({ ...validationErrors, website: null });
                    }}
                    placeholder="https://sony.com"
                    error={validationErrors.website}
                    icon={<Globe className="w-4 h-4" />}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormSwitch
                      label="Featured"
                      checked={!!formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked ? 1 : 0 })}
                    />

                    <FormSwitch
                      label="Active"
                      checked={!!formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked ? 1 : 0 })}
                    />
                  </div>

                  <FormTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the license..."
                    rows={4}
                    icon={<Info className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex gap-3">
                <button
                  type="button"
                  onClick={closeFormWithAnim}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  type="button"
                  disabled={!formData.name || loading}
                  className={`flex items-center justify-center gap-2 flex-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all transform active:scale-95 ${(!formData.name || loading) ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{formMode === "create" ? "Creating..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{formMode === "create" ? "Create License" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            ref={deleteOverlayRef}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={!loading ? closeDeleteWithAnim : undefined}
          />
          <div
            ref={deleteContentRef}
            className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-red-50 to-transparent dark:from-red-900/10 pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10 rotate-3 transform transition-transform hover:rotate-6">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Delete License?
              </h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  You are about to permanently delete <span className="text-slate-900 dark:text-white font-bold italic underline decoration-red-500/30 underline-offset-4">"{selectedLicense?.name}"</span>.
                </p>
                
                {selectedLicense?.products_count > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Affects {selectedLicense.products_count} Products</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  disabled={loading}
                  onClick={handleDeleteConfirm}
                  className="w-full py-4 rounded-2xl text-sm font-black text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Yes, Delete License</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                
                <button
                  disabled={loading}
                  onClick={closeDeleteWithAnim}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 shadow-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                >
                  No, Keep it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LicenseManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LicenseContent />
    </Suspense>
  );
}