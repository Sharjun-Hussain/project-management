"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { sanitizeHtml } from "../../../lib/utils";
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
  Users,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  UserPlus,
  Camera,
  Lock,
  User,
  Check,
} from "lucide-react";

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
      className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
        checked || indeterminate
          ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20"
          : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
      }`}
    >
      {checked && !indeterminate && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
      {indeterminate && <div className="w-2 h-0.5 bg-white rounded-full" />}
    </button>
  );
};

export default function UsersPage() {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();
  const containerRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [loading, setLoading] = useState(true);
  const [allRoles, setAllRoles] = useState([]);

  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.some(role => role.name === "Admin" || role.name === "Super Admin");

  const hasPermission = (permissionName) => {
    if (isAdmin) return true;
    return userRoles.some(role => 
      role.permissions?.some(p => p.name === permissionName)
    );
  };

  // --- PAGINATION & SORTING STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("invite"); // 'invite' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    role: "", // Changed from role_id to role
    profile_image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // --- SWR FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data.data;
  };

  const queryParams = new URLSearchParams({
    page: currentPage,
    search: searchTerm,
  }).toString();

  const { data: usersData, error: usersError, isLoading: usersLoading } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users?${queryParams}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const { data: rolesData } = useSWR(
    session?.accessToken ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/roles/list` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Canvas toBlob failed"));
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Basic validation
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Max 5MB allowed.");
        return;
      }

      setLoading(true);
      try {
        // 2. Compress image
        const compressedFile = await compressImage(file);
        setFormData({ ...formData, profile_image: compressedFile });

        // 3. Preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Compression failed:", error);
        toast.error("Failed to process image");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (usersData) {
      setUsers(usersData.data || []);
      setCurrentPage(usersData.current_page || 1);
      setLastPage(usersData.last_page || 1);
      setTotalPages(usersData.total || 0);
      setLoading(false);
    }
    if (usersError) {
      toast.error(usersError.message);
      setLoading(false);
    }
    if (usersLoading) {
      setLoading(true);
    }
  }, [usersData, usersError, usersLoading]);

  useEffect(() => {
    if (rolesData) {
      setAllRoles(rolesData || []);
    }
  }, [rolesData]);

  const refreshUsers = () => {
    mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users?${queryParams}`);
  };

  // --- SELECTION HANDLERS ---
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = users.length > 0 && selectedIds.length === users.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < users.length;

  // --- ANIMATIONS ---
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".animate-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 });
    tl.fromTo(".animate-toolbar", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4");
    tl.fromTo(".user-item", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, clearProps: "all" }, "-=0.3");
  }, { scope: containerRef, dependencies: [users, viewMode] });

  const openFormWithAnim = () => {
    setIsFormOpen(true);
    gsap.fromTo(formOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(formContentRef.current, { x: "100%" }, { x: 0, duration: 0.6, ease: "power4.out" });
  };

  const closeFormWithAnim = () => {
    const tl = gsap.timeline({ onComplete: () => setIsFormOpen(false) });
    tl.to(formContentRef.current, { x: "100%", duration: 0.4, ease: "power3.in" })
      .to(formOverlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const closeDeleteWithAnim = () => {
    const tl = gsap.timeline({ onComplete: () => setIsDeleteOpen(false) });
    tl.to(deleteContentRef.current, { scale: 0.95, opacity: 0, duration: 0.2, ease: "power2.in" })
      .to(deleteOverlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  const handleOpenInvite = () => {
    setFormMode("invite");
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      password_confirmation: "",
      role: "",
      profile_image: null,
    });
    setImagePreview(null);
    openFormWithAnim();
  };

  const handleOpenEdit = (user) => {
    setFormMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username || "",
      password: "",
      password_confirmation: "",
      role: user.roles?.[0]?.name || "", // Assuming role name is needed
      profile_image: null,
    });
    setImagePreview(user.image || null);
    openFormWithAnim();
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = formMode === "edit"
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users/${selectedUser.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`;
      const method = formMode === "edit" ? "POST" : "POST"; // Use POST with _method=PUT for multipart if needed, or just POST for create

      const body = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== "") {
          const value = typeof formData[key] === "string" ? sanitizeHtml(formData[key]) : formData[key];
          body.append(key, value);
        }
      });
      
      if (formMode === "edit") {
        body.append("_method", "PUT");
      }

      const data = await globalFetcher(url, session?.accessToken, {
        method: "POST",
        body,
      });
      if (data && data.status === "success") {
        toast.success(formMode === "edit" ? "User updated" : "Invitation sent");
        closeFormWithAnim();
        refreshUsers();
      } else {
        toast.error(data?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users/${selectedUser.id}`, session?.accessToken, {
        method: "DELETE",
      });
      if (data && data.status === "success") {
        toast.success("User removed");
        closeDeleteWithAnim();
        refreshUsers();
      } else {
        toast.error(data?.message || "Failed to remove user");
      }
    } catch (error) {
      toast.error("An error occurred while removing user");
    }
  };

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
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
  }, [users, sortBy, sortOrder]);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50/50 dark:bg-slate-900 px-4 sm:px-8 py-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="animate-header">
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Users
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
              Manage team members, invite new users, and assign roles.
            </p>
          </div>

          {hasPermission("Admin User Create") && (
            <button
              onClick={handleOpenInvite}
              className="animate-header group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Invite User
            </button>
          )}
        </div>

        {/* 2. TOOLBAR */}
        <div className="animate-toolbar sticky top-4 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
                placeholder="Search users..."
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
                <option value="created_at">Date Joined</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
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
        <div className="relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <CircleDashed className="w-12 h-12 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
              </div>
              <p className="text-slate-400 font-bold text-sm animate-pulse tracking-widest uppercase">
                Loading users...
              </p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center mt-1">
                We couldn't find any users matching your search criteria.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedUsers.map((user) => (
                <div
                  key={user.id}
                  className="user-item group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 mb-4 flex items-center justify-center">
                    <img
                      src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.roles?.map((role) => (
                        <span key={role.id} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50">
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      {hasPermission("Admin User Update") && (
                        <button onClick={() => handleOpenEdit(user)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission("Admin User Delete") && (
                        <button onClick={() => handleOpenDelete(user)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all">
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
                  <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
                    <th className="p-4 px-6 w-12 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="p-4 px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="p-4 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Roles</th>
                    <th className="p-4 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined Date</th>
                    <th className="p-4 px-6 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className="group border-b border-slate-100/50 dark:border-slate-700/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer">
                      <td className="p-4 px-6 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedIds.includes(user.id)}
                            onChange={() => toggleSelectItem(user.id)}
                          />
                        </div>
                      </td>
                      <td className="p-4 px-2">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <span key={role.id} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 px-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 px-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {hasPermission("Admin User Update") && (
                            <button onClick={() => handleOpenEdit(user)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("Admin User Delete") && (
                            <button onClick={() => handleOpenDelete(user)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90">
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
        </div>

        {/* 4. PAGINATION FOOTER */}
        {!loading && users.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                {users.length > 0 ? (
                  <>
                    <span className="opacity-40">Showing</span>
                    <span className="text-slate-900 dark:text-white mx-1">{users.length}</span>
                    <span className="opacity-40">of</span>
                    <span className="text-slate-900 dark:text-white ml-1">{totalPages}</span>
                    <span className="ml-1 opacity-40 uppercase tracking-widest">Users</span>
                  </>
                ) : (
                  <span>0 results</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1 mx-1">
                {[...Array(Math.min(5, lastPage))].map((_, i) => {
                  const pageNum = i + 1;
                  // Simple window logic
                  let displayNum = pageNum;
                  if (lastPage > 5) {
                    if (currentPage > 3) displayNum = currentPage - 2 + i;
                    if (displayNum > lastPage) return null;
                  }
                  
                  return (
                    <button
                      key={displayNum}
                      onClick={() => setCurrentPage(displayNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === displayNum 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-90"
                      }`}
                    >
                      {displayNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === lastPage}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
                   toast.success(`Bulk delete initiated for ${selectedIds.length} users`);
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

      {/* --- DRAWER / SIDE PANEL FORM --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div ref={formOverlayRef} onClick={closeFormWithAnim} className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div ref={formContentRef} className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                        {formMode === "invite" ? "Invite User" : "Edit User"}
                      </h2>
                    </div>
                    <button onClick={closeFormWithAnim} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {formMode === "invite" ? "Send an invitation to a new team member." : "Update user details and role assignments."}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-tiny-scrollbar">
                  {/* Profile Image Upload */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center group-hover:border-indigo-500 transition-all">
                        {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <Camera className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 rounded-lg shadow-lg text-white group-hover:scale-110 transition-transform">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-3 text-center">Profile Member</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Username</label>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all"
                          placeholder="johndoe123"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all"
                        placeholder="john@example.com"
                        disabled={formMode === "edit"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="password"
                          value={formData.password_confirmation}
                          onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Assign Roles</label>
                    <div className="grid grid-cols-2 gap-3">
                      {allRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.id })}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            formData.role === role.id
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm"
                              : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                             formData.role === role.id ? "border-indigo-600" : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {formData.role === role.id && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                          </div>
                          <span className="text-xs font-semibold">{role.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
                  <button onClick={closeFormWithAnim} className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} type="button" className="flex-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95">
                    {formMode === "invite" ? "Send Invitation" : "Update User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE DIALOG --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div ref={deleteOverlayRef} onClick={closeDeleteWithAnim} className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" />
          <div ref={deleteContentRef} className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Remove User?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                Are you sure you want to remove <span className="text-slate-900 dark:text-white font-bold">{selectedUser?.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4 w-full">
                <button onClick={closeDeleteWithAnim} className="flex-1 py-4 px-6 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                  Remove User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
