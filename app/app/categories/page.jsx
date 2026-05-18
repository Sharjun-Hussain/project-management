"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Tag,
  Info,
} from "lucide-react";
import { Suspense } from "react";
import { FormInput, FormTextarea, FormSwitch } from "@/components/forms/reusable-fields";

function CategoriesContent() {
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
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: 1,
    is_featured: 0,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // --- API FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };
  const { data: apiResponse, error, isLoading } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]
      : null,
    ([url]) => fetcher(url),
    {
      keepPreviousData: true,
    }
  );

  const categories = apiResponse?.data?.data || [];
  const totalPages = apiResponse?.data?.last_page || 1;
  const totalItems = apiResponse?.data?.total || 0;

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
    if (isLoading || loading) return; // Don't animate if loading
    
    // Kill any existing animations
    gsap.killTweensOf(".category-item");

    // Animate items in
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
  }, [viewMode, categories, isLoading]);

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
      description: "",
      is_active: 1,
      is_featured: 0,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormMode("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active ? 1 : 0,
      is_featured: category.is_featured ? 1 : 0,
    });
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDelete = (category) => {
    setSelectedCategory(category);
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
    setValidationErrors({});

    try {
      const url =
        formMode === "create"
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories/${selectedCategory.id}`;

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
          ? "Category created successfully"
          : "Category updated successfully"
      );
      
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories/${selectedCategory.id}`,
        session?.accessToken,
        {
          method: "DELETE",
        }
      );

      if (!data) {
        throw new Error("Failed to delete");
      }

      toast.success("Category deleted successfully");
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]);
      closeDeleteWithAnim();
    } catch (error) {
      toast.error(error.message || "An error occurred while deleting category");
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="animate-header">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Category Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage your product hierarchy and catalog organization.
            </p>
          </div>

          <div className="animate-header flex items-center gap-3">
            {hasPermission("Category Create") && (
              <button
                onClick={handleOpenCreate}
                className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create New</span>
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
              placeholder="Search categories..."
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load categories</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Please try again later.</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No categories found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
                Organize your product catalog by creating your first category hierarchy.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                Create Your First Category
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="category-item group relative bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-lg hover:shadow-indigo-900/5 transition-all duration-500 ease-out cursor-pointer flex flex-col h-full will-change-transform"
                    >
                      {/* Text Area */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">
                            {cat.name}
                          </h3>
                          <div className="flex shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                cat.is_active
                                  ? "text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50 bg-green-50/50"
                                  : "text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 bg-slate-50/50"
                              }`}
                            >
                              {cat.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="bg-slate-100/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {cat.slug}
                          </span>
                          {cat.is_featured && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" /> Featured
                            </span>
                          )}
                        </div>
                        
                        {cat.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Footer / Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          ID: #{cat.id}
                        </span>
                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                          {hasPermission("Category Update") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(cat);
                              }}
                              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission("Category Delete") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(cat);
                              }}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                          Category
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Featured
                        </th>
                        <th className="p-5 pr-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {categories.map((cat) => (
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
                          <td className="p-4">
                            {cat.is_featured ? (
                               <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                                <Star className="w-3 h-3 fill-current" /> Featured
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {hasPermission("Category Update") && (
                                <button
                                  onClick={() => handleOpenEdit(cat)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {hasPermission("Category Delete") && (
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
                  Showing <span className="font-bold text-slate-900 dark:text-white">{categories.length}</span> of{" "}
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
                    {formMode === "create" ? "Create Category" : "Edit Category"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure category details.
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
                    label="Category Name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
                    }}
                    placeholder="e.g. Wireless Headphones"
                    error={validationErrors.name}
                    icon={<Tag className="w-4 h-4" />}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormSwitch
                      label="Featured"
                      checked={!!formData.is_featured}
                      onChange={(checked) => setFormData({ ...formData, is_featured: checked ? 1 : 0 })}
                    />

                    <FormSwitch
                      label="Active"
                      checked={!!formData.is_active}
                      onChange={(checked) => setFormData({ ...formData, is_active: checked ? 1 : 0 })}
                    />
                  </div>

                  <FormTextarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description for this category..."
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
                    <span>{formMode === "create" ? "Create Category" : "Save Changes"}</span>
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
            className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-slate-100 dark:border-slate-700 font-sans"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-red-50 to-transparent dark:from-red-900/10 pointer-events-none" />
            
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10 rotate-3 transform transition-transform hover:rotate-6">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Delete Category?
              </h3>
              
              <div className="space-y-4 mb-8">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  You are about to permanently delete <span className="text-slate-900 dark:text-white font-bold italic underline decoration-red-500/30 underline-offset-4">"{selectedCategory?.name}"</span>.
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
                      <span>Yes, Delete Category</span>
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

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}

