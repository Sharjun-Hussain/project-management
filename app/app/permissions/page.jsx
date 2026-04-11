"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
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
  Key,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";

export default function PermissionsPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const containerRef = useRef(null);
  const [permissions, setPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  
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
  const [selectedPermission, setSelectedPermission] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    group_name: "",
  });

  // --- SWR FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data.data;
  };

  const queryParams = new URLSearchParams({
    page: currentPage,
    search: searchTerm,
  }).toString();

  const { data: swrData, error: swrError, isLoading: swrLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (swrData) {
      setPermissions(swrData.data || []);
      setCurrentPage(swrData.current_page || 1);
      setLastPage(swrData.last_page || 1);
      setTotalPages(swrData.total || 0);
      setLoading(false);
    }
    if (swrError) {
      toast.error(swrError.message);
      setLoading(false);
    }
    if (swrLoading) {
      setLoading(true);
    }
  }, [swrData, swrError, swrLoading]);

  // Helper to refresh data
  const refreshPermissions = () => {
    mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions?${queryParams}`);
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
    gsap.killTweensOf(".permission-item");

    // Animate items in with a satisfying "pop" and stagger
    gsap.fromTo(
      ".permission-item",
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
  }, [viewMode, permissions, searchTerm]);

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
    setSelectedPermission(null);
    setFormData({
      name: "",
      group_name: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (permission) => {
    setFormMode("edit");
    setSelectedPermission(permission);
    setFormData({ 
      name: permission.name,
      group_name: permission.group_name || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (permission) => {
    setSelectedPermission(permission);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedPermission
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions/${selectedPermission.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions`;
      const method = selectedPermission ? "PUT" : "POST";

      const data = await globalFetcher(url, session?.accessToken, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (data && data.status === "success") {
        toast.success(selectedPermission ? "Permission updated" : "Permission created");
        closeFormWithAnim();
        refreshPermissions();
      } else {
        toast.error(data?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions/${selectedPermission.id}`, session?.accessToken, {
        method: "DELETE",
      });
      if (data && data.status === "success") {
        toast.success("Permission deleted");
        closeDeleteWithAnim();
        refreshPermissions();
      } else {
        toast.error(data?.message || "Failed to delete permission");
      }
    } catch (error) {
      toast.error("An error occurred while deleting permission");
    }
  };

  const sortedPermissions = React.useMemo(() => {
    return [...permissions].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle nulls
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";

      // Convert to lowercase for string comparison
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [permissions, sortBy, sortOrder]);

  const filteredPermissions = sortedPermissions; // Filtering is now handled by the API, sorting is client-side

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
              Permissions Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage user permissions and access controls.
            </p>
          </div>

          <div className="animate-header flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Permission</span>
            </button>
          </div>
        </div>

          <div className="animate-toolbar sticky top-4 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between will-change-transform">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-700 mr-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sort By</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="created_at">Date Created</option>
                  <option value="name">Name</option>
                  <option value="group_name">Group</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 dark:text-slate-400"
                  title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-300 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
              >
                <LayoutGrid className="w-4 h-4" />{" "}
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
              >
                <ListIcon className="w-4 h-4" />{" "}
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">List</span>
              </button>
            </div>
          </div>

        {/* 3. CONTENT AREA */}
        <div className="mt-8 min-h-[500px]">
          {loading ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-header">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Loading permissions...
              </h3>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-header">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No permissions found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="permission-item group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-500 ease-out cursor-pointer flex flex-col h-full will-change-transform"
                    >
                      {/* Icon Area */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 mb-4 flex items-center justify-center">
                        <Key className="w-16 h-16 text-amber-600 dark:text-amber-400 transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                      </div>

                      {/* Text Area */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                          {permission.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                          <span>{permission.guard_name}</span>
                        </div>
                      </div>

                      {/* Footer / Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {new Date(permission.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(permission);
                            }}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(permission);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                        <th className="p-5 pl-8 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Permission
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Guard Name
                        </th>
                        <th className="p-5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="p-5 pr-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredPermissions.map((permission) => (
                        <tr
                          key={permission.id}
                          className="permission-item group hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors duration-200"
                        >
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center">
                                <Key className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {permission.name}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {permission.guard_name}
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {new Date(permission.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2 transition-opacity duration-200">
                              <button
                                onClick={() => handleOpenEdit(permission)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(permission)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
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

        {/* 4. PAGINATION */}
        {!loading && permissions.length > 0 && (
          <div className="animate-toolbar mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-white font-bold">{permissions.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span> permissions
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
                  if (
                    pageNum === 1 ||
                    pageNum === lastPage ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
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
                      ? "Add Permission"
                      : "Edit Permission"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure permission details.
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-tiny-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Group Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="e.g. Organization Management"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Permission Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="e.g. Organization Delete"
                    />
                  </div>
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
                  className="flex-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95"
                >
                  {formMode === "create" ? "Create Permission" : "Save Changes"}
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
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={closeDeleteWithAnim}
          />
          <div
            ref={deleteContentRef}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Delete Permission?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                "{selectedPermission?.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteWithAnim}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
