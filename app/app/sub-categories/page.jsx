"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "../hooks/useDebounce";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  CircleDashed,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  Info,
  Layers,
} from "lucide-react";
import { Suspense } from "react";
import { FormInput, FormTextarea, FormSelect, FormSwitch } from "@/components/forms/reusable-fields";

const getCategoryGradient = (name) => {
  const gradients = [
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-fuchsia-500",
  ];
  
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

function SubCategoryContent() {
  const containerRef = useRef(null);
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

  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const searchParams = useSearchParams();
  
  // --- PAGINATION & SEARCH STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    is_active: 1,
    description: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // --- API FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };

  // Fetch subcategories
  const { data: apiResponse, error, isLoading } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]
      : null,
    ([url]) => fetcher(url),
    {
      keepPreviousData: true,
    }
  );

  // Fetch categories list (for parent selection dropdown)
  const { data: categoriesResponse } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories?page=1&limit=100`, session.accessToken]
      : null,
    ([url]) => fetcher(url)
  );

  const subCategories = apiResponse?.data?.data || [];
  const totalPages = apiResponse?.data?.last_page || 1;
  const totalItems = apiResponse?.data?.total || 0;
  const parentCategories = categoriesResponse?.data?.data || [];

  // Map categories for reusable FormSelect dropdown options
  const parentCategoryOptions = parentCategories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

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
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }
      );

      // Toolbar fades in
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  // ------------------------------------------------------------------
  // 2. GRID/LIST SWITCH ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isLoading || loading) return;
    
    gsap.killTweensOf(".category-item");

    gsap.fromTo(
      ".category-item",
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
      }
    );
  }, [viewMode, subCategories, isLoading]);

  // ------------------------------------------------------------------
  // 3. FORM DRAWER ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isFormOpen && formContentRef.current) {
      gsap.fromTo(
        formOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(
        formContentRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.6, ease: "power4.out" }
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
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        deleteContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" }
      );
    }
  }, [isDeleteOpen]);

  // --- HANDLERS ---

  const closeFormWithAnim = () => {
    if (!formContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsFormOpen(false) });
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
    setFormData({
      name: "",
      slug: "",
      category_id: parentCategories[0]?.id || "",
      is_active: 1,
      description: "",
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (subCat) => {
    setFormMode("edit");
    setSelectedSubCategory(subCat);
    setFormData({
      name: subCat.name,
      slug: subCat.slug,
      category_id: subCat.category_id,
      is_active: subCat.is_active ? 1 : 0,
      description: subCat.description || "",
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (subCat) => {
    setSelectedSubCategory(subCat);
    setIsDeleteOpen(true);
  };

  // Quick link action hook
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreate();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, parentCategories]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: val
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
    }));
    if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      const url =
        formMode === "create"
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories/${selectedSubCategory.id}`;

      const method = formMode === "create" ? "POST" : "PUT";

      const data = await globalFetcher(url, session?.accessToken, {
        method,
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!data) {
        throw new Error("Something went wrong");
      }

      toast.success(
        formMode === "create"
          ? "Sub category created successfully"
          : "Sub category updated successfully"
      );
      
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]);
      closeFormWithAnim();
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
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const data = await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories/${selectedSubCategory.id}`,
        session?.accessToken,
        {
          method: "DELETE",
        }
      );

      if (!data) {
        throw new Error("Failed to delete");
      }

      toast.success("Sub category deleted successfully");
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]);
      closeDeleteWithAnim();
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting sub category");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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
              <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">Sub Category Manager</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage product sub-categories and catalog organization.</p>
            </div>
          </div>
          </div>

          <div className="animate-header flex items-center gap-3">
            {hasPermission("SubCategory Create") && (
              <button
                onClick={handleOpenCreate}
                className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Sub Category</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TOOLBAR */}
        <div className="animate-toolbar sticky top-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between will-change-transform">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all"
              placeholder="Search sub categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
            >
              <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="mt-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-red-200 dark:border-red-900/50 rounded-3xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load sub categories</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Please try again later.</p>
            </div>
          ) : subCategories.length === 0 ? (
            <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Layers className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No sub categories found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
                Organize your catalog hierarchically by adding your first sub category under a parent category.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                Add Your First Sub Category
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {subCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="category-item group relative bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/80 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Compact Header */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Elegant squircle avatar */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(cat.name)} text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0 transform transition-transform duration-300 group-hover:scale-105`}>
                          {cat.name.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        
                        {/* Title & Badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${cat.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/20 dark:border-green-900/20" : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/20 dark:border-slate-700/20"}`}
                              >
                                {cat.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words leading-tight">
                              {cat.name}
                            </h3>
                          </div>
                          {cat.category && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 min-w-0 flex-wrap">
                              <span className="bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100/50 dark:border-indigo-900/20 flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                                {cat.category.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description Block */}
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 mb-4 leading-relaxed min-h-[2.5rem] font-medium">
                          {cat.description || <span className="text-slate-350 dark:text-slate-600 italic select-none">No description provided</span>}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 dark:border-slate-700/50 mt-auto">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/30 dark:border-slate-800/40">
                          {cat.products_count || 0} Products
                        </span>
                        <div className="flex gap-1">
                          {hasPermission("SubCategory Update") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(cat);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("SubCategory Delete") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(cat);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-5 pl-8 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Sub Category
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Parent Category
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right pr-8">
                          Products
                        </th>
                        <th className="p-5 pr-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {subCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="category-item group hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors duration-200"
                        >
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {cat.name}
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                  {cat.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {cat.category?.name || "-"}
                          </td>
                          <td className="p-4">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                cat.is_active
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {cat.is_active ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <CircleDashed className="w-3 h-3" />
                              )}
                              {cat.is_active ? "Active" : "Inactive"}
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-350 pr-8 text-sm">
                            {cat.products_count || 0}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {hasPermission("SubCategory Update") && (
                                <button
                                  onClick={() => handleOpenEdit(cat)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission("SubCategory Delete") && (
                                <button
                                  onClick={() => handleOpenDelete(cat)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                                >
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

              {/* PAGINATION */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{subCategories.length}</span> of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
                    {formMode === "create" ? "Add Sub Category" : "Edit Sub Category"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure sub category details.
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
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-tiny-scrollbar">
                <div className="space-y-4">
                  <FormInput
                    label="Sub Category Name"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Wireless Headphones"
                    error={validationErrors.name}
                    icon={<Tag className="w-4 h-4" />}
                  />

                  <FormSwitch
                    label="Active"
                    checked={!!formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked ? 1 : 0 })}
                  />

                  <FormSelect
                    label="Parent Category"
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    options={parentCategoryOptions}
                  />

                  <FormTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description for this sub category..."
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
                  disabled={!formData.name || !formData.category_id || loading}
                  className={`flex items-center justify-center gap-2 flex-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all transform active:scale-95 ${(!formData.name || !formData.category_id || loading) ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{formMode === "create" ? "Creating..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{formMode === "create" ? "Add Sub Category" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE DIALOG --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            ref={deleteOverlayRef}
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md"
            onClick={!loading ? closeDeleteWithAnim : undefined}
          />
          <div
            ref={deleteContentRef}
            className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-slate-100 dark:border-slate-700 font-sans"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-red-50 to-transparent dark:from-red-900/10 pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10 rotate-3 transform transition-transform hover:rotate-6">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Delete Sub Category?
              </h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  You are about to permanently delete <span className="text-slate-900 dark:text-white font-bold italic underline decoration-red-500/30 underline-offset-4">"{selectedSubCategory?.name}"</span>.
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Permanent Action</span>
                </div>
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
                      <span>Yes, Delete Sub Category</span>
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

export default function SubCategoryManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SubCategoryContent />
    </Suspense>
  );
}
