"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { sanitizeHtml } from "../../../lib/utils";
import { toast } from "sonner";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {Search,
  Plus,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  CircleDashed,
  Shield,
  Eye,
  Key,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter, ShieldCheck} from "lucide-react";

export default function RolesPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const containerRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState([]);

  // --- PAGINATION & SORTING STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);
  const viewOverlayRef = useRef(null);
  const viewContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    is_protected: false,
    permissions: [],
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

  const { data: rolesData, error: rolesError, isLoading: rolesLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const { data: permissionsData } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/permissions/list` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Permissions change less frequently
    }
  );

  useEffect(() => {
    if (rolesData) {
      setRoles(rolesData.data || []);
      setCurrentPage(rolesData.current_page || 1);
      setLastPage(rolesData.last_page || 1);
      setTotalPages(rolesData.total || 0);
      setLoading(false);
    }
    if (rolesError) {
      toast.error(rolesError.message);
      setLoading(false);
    }
    if (rolesLoading) {
      setLoading(true);
    }
  }, [rolesData, rolesError, rolesLoading]);

  useEffect(() => {
    if (permissionsData) {
      setAllPermissions(permissionsData || []);
    }
  }, [permissionsData]);

  // Helper to refresh data
  const refreshRoles = () => {
    mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles?${queryParams}`);
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
    gsap.killTweensOf(".role-item");

    // Animate items in with a satisfying "pop" and stagger
    gsap.fromTo(
      ".role-item",
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
  }, [viewMode, roles, searchTerm]);

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

  // ------------------------------------------------------------------
  // 5. VIEW DRAWER ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isViewOpen && viewContentRef.current) {
      // Overlay Fade
      gsap.fromTo(
        viewOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
      // Drawer Slide
      gsap.fromTo(
        viewContentRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.6, ease: "power4.out" },
      );
    }
  }, [isViewOpen]);

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

  const closeViewWithAnim = () => {
    if (!viewContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsViewOpen(false) });

    tl.to(viewContentRef.current, {
      x: "100%",
      duration: 0.4,
      ease: "power3.in",
    }).to(viewOverlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedRole(null);
    setFormData({
      name: "",
      is_protected: false,
      permissions: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (role) => {
    setFormMode("edit");
    setSelectedRole(role);
    setFormData({
      name: role.name,
      is_protected: role.is_protected === 1 || role.is_protected === true,
      permissions: role.permissions ? role.permissions.map(p => p.id) : [],
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (role) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleOpenView = async (role) => {
    setSelectedRole(role);
    setIsViewOpen(true);
    setLoadingDetails(true);
    setRoleDetails(null);

    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles/${role.id}`, session?.accessToken);
      if (data && data.status === "success") {
        setRoleDetails(data.data);
      } else {
        toast.error(data?.message || "Failed to fetch role details");
      }
    } catch (error) {
      toast.error("An error occurred while fetching role details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedRole
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles/${selectedRole.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles`;
      const method = selectedRole ? "PUT" : "POST";

      const data = await globalFetcher(url, session?.accessToken, {
        method,
        body: JSON.stringify({
          name: sanitizeHtml(formData.name),
          is_protected: formData.is_protected,
          permissions: formData.permissions,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data && data.status === "success") {
        toast.success(selectedRole ? "Role updated" : "Role created");
        closeFormWithAnim();
        refreshRoles();
      } else {
        toast.error(data?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles/${selectedRole.id}`, session?.accessToken, {
        method: "DELETE",
      });
      if (data && data.status === "success") {
        toast.success("Role deleted");
        closeDeleteWithAnim();
        refreshRoles();
      } else {
        toast.error(data?.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error("An error occurred while deleting role");
    }
  };

  const sortedRoles = React.useMemo(() => {
    return [...roles].sort((a, b) => {
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
  }, [roles, sortBy, sortOrder]);

  const filteredRoles = sortedRoles; // Filtering handled by API, sorting client-side

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
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">Roles Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage user roles and access levels.</p>
            </div>
          </div>
          </div>

          <div className="animate-header flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        {/* 2. TOOLBAR */}
        <div className="animate-toolbar sticky top-4 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between will-change-transform">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
                placeholder="Search roles..."
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
                Loading roles...
              </h3>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-header">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No roles found
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
                  {filteredRoles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => handleOpenView(role)}
                      className="role-item group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-500 ease-out cursor-pointer flex flex-col h-full will-change-transform"
                    >
                      {/* Icon Area */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 mb-4 flex items-center justify-center">
                        <Shield className="w-16 h-16 text-indigo-600 dark:text-indigo-400 transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                      </div>

                      {/* Text Area */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                          {role.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                          <span>{role.guard_name}</span>
                        </div>
                      </div>

                      {/* Footer / Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {new Date(role.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenView(role);
                            }}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(role);
                            }}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(role);
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
                          Role
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
                      {filteredRoles.map((role) => (
                        <tr
                          key={role.id}
                          onClick={() => handleOpenView(role)}
                          className="role-item group hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors duration-200 cursor-pointer"
                        >
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {role.name}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {role.guard_name}
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {new Date(role.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2 transition-opacity duration-200">
                              <button
                                onClick={() => handleOpenView(role)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(role)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(role)}
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
        {!loading && roles.length > 0 && (
          <div className="animate-toolbar mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-white font-bold">{roles.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span> roles
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
                      ? "Add Role"
                      : "Edit Role"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure role details.
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
                      Role Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="e.g. Admin"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <label className="text-sm font-bold text-slate-900 dark:text-white block">Protected Role</label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Protected roles cannot be deleted easily.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_protected: !formData.is_protected })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_protected ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_protected ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="pt-4">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-4">
                      Permissions
                    </label>
                    
                    <div className="space-y-6">
                      {Object.entries(
                        allPermissions.reduce((acc, p) => {
                          const group = p.group_name || "General";
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(p);
                          return acc;
                        }, {})
                      ).map(([group, perms]) => {
                        const groupIds = perms.map(p => p.id);
                        const isAllSelected = groupIds.every(id => formData.permissions.includes(id));
                        
                        return (
                          <div key={group} className="space-y-3">
                            <div className="flex items-center justify-between pl-1">
                              <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{group}</h5>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAllSelected) {
                                    setFormData({
                                      ...formData,
                                      permissions: formData.permissions.filter(id => !groupIds.includes(id))
                                    });
                                  } else {
                                    const newPermissions = [...new Set([...formData.permissions, ...groupIds])];
                                    setFormData({ ...formData, permissions: newPermissions });
                                  }
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {isAllSelected ? "Deselect All" : "Select All"}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {perms.map((p) => (
                                <label
                                  key={p.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                    formData.permissions.includes(p.id)
                                      ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50"
                                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.permissions.includes(p.id)}
                                    onChange={() => {
                                      if (formData.permissions.includes(p.id)) {
                                        setFormData({
                                          ...formData,
                                          permissions: formData.permissions.filter(id => id !== p.id)
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          permissions: [...formData.permissions, p.id]
                                        });
                                      }
                                    }}
                                  />
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    formData.permissions.includes(p.id)
                                      ? "bg-indigo-600 border-indigo-600"
                                      : "bg-transparent border-slate-300 dark:border-slate-600"
                                  }`}>
                                    {formData.permissions.includes(p.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                  {formMode === "create" ? "Create Role" : "Save Changes"}
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
              Delete Role?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                "{selectedRole?.name}"
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
      {/* --- VIEW ROLE DETAILS DRAWER --- */}
      {isViewOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            ref={viewOverlayRef}
            className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm"
            onClick={closeViewWithAnim}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div
              ref={viewContentRef}
              className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Drawer Header */}
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Role Details
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Viewing permissions for {selectedRole?.name}.
                  </p>
                </div>
                <button
                  onClick={closeViewWithAnim}
                  className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-tiny-scrollbar">
                {/* Role Info Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selectedRole?.name}</h3>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedRole?.guard_name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Created At</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {selectedRole?.created_at ? new Date(selectedRole.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-500" />
                      Assigned Permissions
                    </h4>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                      {roleDetails?.permissions?.length || 0} Total
                    </span>
                  </div>

                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-xs font-medium text-slate-500">Fetching permissions...</p>
                    </div>
                  ) : roleDetails?.permissions?.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group permissions by group_name */}
                      {Object.entries(
                        roleDetails.permissions.reduce((acc, p) => {
                          const group = p.group_name || "General";
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(p);
                          return acc;
                        }, {})
                      ).map(([group, perms]) => (
                        <div key={group} className="space-y-2">
                          <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">{group}</h5>
                          <div className="grid grid-cols-1 gap-2">
                            {perms.map((p) => (
                              <div key={p.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-500">No permissions assigned to this role.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                <button
                  onClick={closeViewWithAnim}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
