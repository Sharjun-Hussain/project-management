"use client";

import { useGSAP } from "@gsap/react";
import { format, parseISO } from "date-fns";
import { gsap } from "gsap";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  Filter,
  Layers,
  Loader2,
  Percent,
  Plus,
  Search,
  Tag,
  Ticket,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { FormInput, FormSwitch } from "@/components/forms/reusable-fields";
import { Button } from "../../../components/ui/button";
import { Calendar as CalendarComponent } from "../../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { cn } from "../../../lib/utils";
import { useDebounce } from "../hooks/useDebounce";

function CouponsContent() {
  const containerRef = useRef(null);
  const formSheetRef = useRef(null);
  const formOverlayRef = useRef(null);
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  // --- ROLE PERMISSIONS ---
  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.some(
    (role) => role.name === "Admin" || role.name === "Super Admin",
  );

  const hasPermission = useCallback(
    (permissionName) => {
      if (isAdmin) return true;
      return userRoles.some((role) =>
        role.permissions?.some((p) => p.name === permissionName),
      );
    },
    [isAdmin, userRoles],
  );

  // --- STATE ---
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterType, setFilterType] = useState("All"); // Percentage, Fixed, Tiered

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const searchParams = useSearchParams();

  // --- API DATA ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };

  const { data: apiResponse, isLoading } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`,
          session.accessToken,
        ]
      : null,
    ([url]) => fetcher(url),
    {
      keepPreviousData: true,
    },
  );

  const rawCoupons = apiResponse?.data?.data || [];

  const coupons = rawCoupons.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    type:
      item.discount_type === "percentage"
        ? "Percentage"
        : item.discount_type === "fixed"
          ? "Fixed"
          : "Tiered",
    value:
      item.discount_type === "tiered_percentage"
        ? null
        : parseFloat(item.discount_value),
    minSpend: parseFloat(item.min_purchase || 0),
    status: item.is_active ? "Active" : "Inactive",
    expiry: item.expiry_date
      ? new Date(item.expiry_date).toLocaleDateString()
      : "No Expiry",
    tiers: item.tiers,
    descriptionText:
      item.description ||
      `Rs. ${parseFloat(item.min_purchase).toLocaleString()} min spend`,
  }));

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage", // percentage, fixed, tiered_percentage
    discount_value: "",
    min_purchase: "",
    start_date: "",
    expiry_date: "",
    usage_limit: "",
    usage_limit_per_user: "1",
    is_active: true,
    tiers: [{ min_amount: "", max_amount: "", percentage: "" }],
  });

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );
      tl.fromTo(
        ".coupon-card",
        { y: 20, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          clearProps: "all",
        },
        "-=0.4",
      );
    },
    { scope: containerRef, dependencies: [isLoading] },
  );

  useGSAP(() => {
    if (isSheetOpen) {
      gsap.fromTo(
        formOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.fromTo(
        formSheetRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.4, ease: "power3.out" },
      );
    }
  }, [isSheetOpen]);

  // --- HANDLERS ---

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, code: result });
  };

  const handleEdit = (coupon) => {
    setIsEditMode(true);
    setEditingCouponId(coupon.id);

    const rawCoupon = rawCoupons.find((c) => c.id === coupon.id);
    if (!rawCoupon) return;

    setFormData({
      code: rawCoupon.code,
      name: rawCoupon.name || "",
      description: rawCoupon.description || "",
      discount_type: rawCoupon.discount_type,
      discount_value: rawCoupon.discount_value || "",
      min_purchase: rawCoupon.min_purchase || "",
      start_date: rawCoupon.start_date
        ? rawCoupon.start_date.split("T")[0]
        : "",
      expiry_date: rawCoupon.expiry_date
        ? rawCoupon.expiry_date.split("T")[0]
        : "",
      usage_limit: rawCoupon.usage_limit || "",
      usage_limit_per_user: rawCoupon.usage_limit_per_user || "1",
      is_active: rawCoupon.is_active,
      tiers:
        Array.isArray(rawCoupon.tiers) && rawCoupon.tiers.length > 0
          ? rawCoupon.tiers.map((t, idx) => ({
              id: `tier-edit-${idx}`,
              min_amount: t.min_amount || t.minSpend || "",
              max_amount: t.max_amount || t.maxSpend || "",
              percentage: t.percentage || t.value || "",
            }))
          : [
              {
                id: "tier-edit-0",
                min_amount: "",
                max_amount: "",
                percentage: "",
              },
            ],
    });

    setIsSheetOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim() || null,
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        min_purchase: parseFloat(formData.min_purchase) || 0.0,
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : null,
        expiry_date: formData.expiry_date
          ? new Date(formData.expiry_date).toISOString()
          : null,
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit, 10)
          : null,
        usage_limit_per_user: formData.usage_limit_per_user
          ? parseInt(formData.usage_limit_per_user, 10)
          : 1,
        is_active: formData.is_active,
      };

      if (formData.discount_type === "tiered_percentage") {
        payload.discount_value = null;
        payload.tiers = formData.tiers.map((t) => ({
          min_amount: parseFloat(t.min_amount) || 0,
          max_amount: t.max_amount ? parseFloat(t.max_amount) : null,
          percentage: parseFloat(t.percentage) || 0,
        }));
      } else {
        payload.discount_value = parseFloat(formData.discount_value);
        payload.tiers = null;
      }

      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${editingCouponId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await globalFetcher(url, session?.accessToken, {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res?.success) {
        toast.success(
          `Coupon ${isEditMode ? "updated" : "created"} successfully`,
        );
        handleCloseSheet();
        mutate([
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`,
          session?.accessToken,
        ]);
      }
    } catch (err) {
      if (err.info?.errors) {
        const errorsMap = {};
        err.info.errors.forEach((e) => {
          errorsMap[e.field] = e.messages[0];
        });
        setValidationErrors(errorsMap);
      } else {
        toast.error(
          err.message || `Failed to ${isEditMode ? "update" : "create"} coupon`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSheet = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsSheetOpen(false);
        setValidationErrors({});
      },
    });
    tl.to(formSheetRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
    });
    tl.to(formOverlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
  };

  // Handle Quick Action from Header
  useEffect(() => {
    if (
      searchParams.get("action") === "create" &&
      hasPermission("Coupon Create")
    ) {
      setIsSheetOpen(true);
      // Clean up URL to prevent re-opening on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, hasPermission]);

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${deletingId}`,
        session?.accessToken,
        {
          method: "DELETE",
        },
      );
      toast.success("Coupon deleted successfully");
      mutate([
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`,
        session?.accessToken,
      ]);
      if (selectedCouponId === deletingId) setSelectedCouponId(null);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesStatus =
      filterStatus === "All" || coupon.status === filterStatus;
    const matchesType = filterType === "All" || coupon.type === filterType;
    const matchesSearch =
      (coupon.code || "")
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      (coupon.name || "").toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "Inactive":
        return "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-6 font-sans text-slate-900 dark:text-white pb-20"
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-header">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Coupons
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage discount codes, promotions, and multi-tier campaigns.
          </p>
        </div>
        {hasPermission("Coupon Create") && (
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setFormData({
                code: "",
                name: "",
                description: "",
                discount_type: "percentage",
                discount_value: "",
                min_purchase: "",
                start_date: "",
                expiry_date: "",
                usage_limit: "",
                usage_limit_per_user: "1",
                is_active: true,
                tiers: [
                  {
                    id: "tier-init-0",
                    min_amount: "",
                    max_amount: "",
                    percentage: "",
                  },
                ],
              });
              setValidationErrors({});
              setIsSheetOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Create Coupon
          </button>
        )}
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="animate-header bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Active Coupons
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
              {coupons.filter((c) => c.status === "Active").length}
            </h4>
          </div>
        </div>
        <div className="animate-header bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Total Coupons
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
              {coupons.length}
            </h4>
          </div>
        </div>
      </div>

      {/* 2.5 TOOLBAR */}
      <div className="animate-header sticky top-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
        <div className="relative w-full sm:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
            placeholder="Search coupon codes or names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Filters
            </span>
          </div>

          <div className="flex items-center gap-1 px-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1 px-2 border-l border-slate-200 dark:border-slate-700">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
            >
              <option value="All">All Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed</option>
              <option value="Tiered">Tiered</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. COUPON GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse"
            />
          ))}
        </div>
      ) : filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            return (
              /* biome-ignore lint/a11y/useSemanticElements: nesting buttons inside a button is invalid */
              <div
                key={coupon.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCouponId(coupon.id);
                  }
                }}
                onClick={() => setSelectedCouponId(coupon.id)}
                className="coupon-card relative flex items-stretch bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer text-left h-36"
              >
                {/* Left Ticket Stub (Discount value) */}
                <div className="w-32 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-r border-dashed border-slate-200 dark:border-slate-700 p-4 shrink-0 select-none relative">
                  {/* Semicircle Ticket Notches */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 z-10" />
                  <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 z-10" />

                  {coupon.type === "Percentage" && (
                    <Percent className="w-4 h-4 mb-1 opacity-70" />
                  )}
                  {coupon.type === "Fixed" && (
                    <DollarSign className="w-4 h-4 mb-1 opacity-70" />
                  )}
                  {coupon.type === "Tiered" && (
                    <Layers className="w-4 h-4 mb-1 opacity-70" />
                  )}

                  <span className="text-lg font-extrabold tracking-tight">
                    {coupon.type === "Percentage"
                      ? `${coupon.value}%`
                      : coupon.type === "Fixed"
                        ? `Rs. ${coupon.value}`
                        : "TIERED"}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-0.5">
                    {coupon.type === "Tiered" ? "Discount" : "OFF"}
                  </span>
                </div>

                {/* Right Ticket Body */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  {/* Top: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-wider truncate">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(coupon.code, coupon.id);
                        }}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                      >
                        {copiedId === coupon.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${getStatusColor(coupon.status)}`}
                    >
                      {coupon.status}
                    </div>
                  </div>

                  {/* Middle: Name & Description */}
                  <div className="min-w-0 my-1">
                    {coupon.name && (
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                        {coupon.name}
                      </h4>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                      {coupon.descriptionText}
                    </p>
                  </div>

                  {/* Bottom: Expiry Date & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                      <Clock className="w-3 h-3" />
                      <span>Exp: {coupon.expiry}</span>
                    </div>

                    {/* Actions on card hover */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasPermission("Coupon Edit") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(coupon);
                          }}
                          className="p-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {hasPermission("Coupon Delete") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(coupon.id);
                          }}
                          className="p-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Ticket className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No coupons created yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
            Boost your sales by creating your first discount code or promotion
            campaign.
          </p>
          {hasPermission("Coupon Create") && (
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setFormData({
                  code: "",
                  name: "",
                  description: "",
                  discount_type: "percentage",
                  discount_value: "",
                  min_purchase: "",
                  start_date: "",
                  expiry_date: "",
                  usage_limit: "",
                  usage_limit_per_user: "1",
                  is_active: true,
                  tiers: [
                    {
                      id: "tier-init-empty-0",
                      min_amount: "",
                      max_amount: "",
                      percentage: "",
                    },
                  ],
                });
                setIsSheetOpen(true);
              }}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Create Your First Coupon
            </button>
          )}
        </div>
      )}

      {/* 6. DETAILS SHEET */}
      {selectedCouponId && (
        <CouponDetailsSheet
          couponId={selectedCouponId}
          onClose={() => setSelectedCouponId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          hasPermission={hasPermission}
        />
      )}

      {/* 5. CREATE/EDIT SHEET */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <button
            type="button"
            ref={formOverlayRef}
            aria-label="Close form drawer"
            className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm cursor-default"
            onClick={handleCloseSheet}
          />

          <div
            ref={formSheetRef}
            className="absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-950 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-950/95 z-10 backdrop-blur transition-colors">
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {isEditMode ? "Edit Coupon" : "Create Coupon"}
              </h3>
              <button
                type="button"
                onClick={handleCloseSheet}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto p-8 space-y-6"
            >
              {/* Code & Basic Status Section */}
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormInput
                      label="Coupon Code"
                      required
                      value={formData.code}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        });
                        if (validationErrors.code)
                          setValidationErrors({
                            ...validationErrors,
                            code: null,
                          });
                      }}
                      placeholder="e.g. SUMMER2026"
                      error={validationErrors.code}
                      icon={<Tag className="w-4 h-4" />}
                      className="font-mono uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="h-[46px] px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center mb-1"
                  >
                    <Wand2 className="w-5 h-5" />
                  </button>
                </div>

                <FormInput
                  label="Campaign / Coupon Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Summer Clearance Tiered Promo"
                />

                <div className="space-y-1">
                  <label
                    htmlFor="description"
                    className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Short details about the offer limits or minimum spends..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                  />
                </div>

                <FormSwitch
                  label="Active Status"
                  checked={!!formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              {/* Value & Type */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Discount Type
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {["percentage", "fixed", "tiered_percentage"].map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, discount_type: type })
                          }
                          className={`py-3 text-[10px] font-bold rounded-xl border transition-all uppercase tracking-tight shadow-sm ${
                            formData.discount_type === type
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {formData.discount_type !== "tiered_percentage" ? (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <label
                        htmlFor="discount_value"
                        className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1"
                      >
                        Discount Value <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                          {formData.discount_type === "percentage" ? (
                            <Percent className="w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                        </div>
                        <input
                          id="discount_value"
                          required
                          type="number"
                          step="0.01"
                          value={formData.discount_value}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              discount_value: e.target.value,
                            });
                            if (validationErrors.discount_value)
                              setValidationErrors({
                                ...validationErrors,
                                discount_value: null,
                              });
                          }}
                          placeholder="0"
                          className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all hide-spinner ${validationErrors.discount_value ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"}`}
                        />
                      </div>
                      {validationErrors.discount_value && (
                        <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.discount_value}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="min_purchase"
                        className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1"
                      >
                        Min Spend
                      </label>
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <input
                          id="min_purchase"
                          type="number"
                          step="0.01"
                          value={formData.min_purchase}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              min_purchase: e.target.value,
                            })
                          }
                          placeholder="0"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all hide-spinner"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                        Discount Tiers
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `tier-added-${Date.now()}`;
                          setFormData({
                            ...formData,
                            tiers: [
                              ...formData.tiers,
                              {
                                id: newId,
                                min_amount: "",
                                max_amount: "",
                                percentage: "",
                              },
                            ],
                          });
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Tier
                      </button>
                    </div>

                    {formData.tiers.map((tier, idx) => {
                      const tierKey = tier.id || `tier-map-${idx}`;
                      return (
                        <div
                          key={tierKey}
                          className="flex gap-2 items-end p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                          <div className="flex-1">
                            <label
                              htmlFor={`tier-min-${idx}`}
                              className="text-[9px] font-bold text-slate-400 uppercase block mb-1"
                            >
                              Min Spend (Rs)
                            </label>
                            <input
                              id={`tier-min-${idx}`}
                              type="number"
                              value={tier.min_amount}
                              onChange={(e) => {
                                const newTiers = [...formData.tiers];
                                newTiers[idx].min_amount = e.target.value;
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              placeholder="0"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:bg-white dark:focus:bg-slate-800 outline-none text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor={`tier-max-${idx}`}
                              className="text-[9px] font-bold text-slate-400 uppercase block mb-1"
                            >
                              Max Spend (Rs)
                            </label>
                            <input
                              id={`tier-max-${idx}`}
                              type="number"
                              value={tier.max_amount}
                              onChange={(e) => {
                                const newTiers = [...formData.tiers];
                                newTiers[idx].max_amount = e.target.value;
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              placeholder="No limit"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:bg-white dark:focus:bg-slate-800 outline-none text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="w-20">
                            <label
                              htmlFor={`tier-pct-${idx}`}
                              className="text-[9px] font-bold text-slate-400 uppercase block mb-1"
                            >
                              Disc %
                            </label>
                            <input
                              id={`tier-pct-${idx}`}
                              type="number"
                              value={tier.percentage}
                              onChange={(e) => {
                                const newTiers = [...formData.tiers];
                                newTiers[idx].percentage = e.target.value;
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              placeholder="%"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:bg-white dark:focus:bg-slate-800 outline-none text-slate-900 dark:text-white"
                            />
                          </div>
                          {formData.tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newTiers = formData.tiers.filter(
                                  (_, i) => i !== idx,
                                );
                                setFormData({ ...formData, tiers: newTiers });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Start & Expiry Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Start Date
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold border rounded-xl px-4 py-2.5 h-[46px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800",
                          !formData.start_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {formData.start_date ? (
                          format(parseISO(formData.start_date), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          formData.start_date
                            ? parseISO(formData.start_date)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFormData({
                              ...formData,
                              start_date: format(date, "yyyy-MM-dd"),
                            });
                          } else {
                            setFormData({ ...formData, start_date: "" });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Expiry Date
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold border rounded-xl px-4 py-2.5 h-[46px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800",
                          !formData.expiry_date && "text-muted-foreground",
                          validationErrors.expiry_date &&
                            "border-red-500 focus:ring-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {formData.expiry_date ? (
                          format(parseISO(formData.expiry_date), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          formData.expiry_date
                            ? parseISO(formData.expiry_date)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFormData({
                              ...formData,
                              expiry_date: format(date, "yyyy-MM-dd"),
                            });
                            if (validationErrors.expiry_date)
                              setValidationErrors({
                                ...validationErrors,
                                expiry_date: null,
                              });
                          } else {
                            setFormData({ ...formData, expiry_date: "" });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.expiry_date && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.expiry_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Total Usage Limit"
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                  placeholder="Unlimited"
                  icon={<Users className="w-4 h-4" />}
                />
                <FormInput
                  label="Limit Per User"
                  type="number"
                  required
                  value={formData.usage_limit_per_user}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usage_limit_per_user: e.target.value,
                    })
                  }
                  placeholder="1"
                  icon={<Users className="w-4 h-4" />}
                />
              </div>
            </form>

            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 transition-colors">
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSave}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}{" "}
                {isEditMode ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-default"
            onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 font-mono uppercase tracking-tight">
              Delete Coupon?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to delete this coupon? This action cannot be
              undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="py-3.5 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponDetailsSheet({
  couponId,
  onClose,
  onEdit,
  onDelete,
  hasPermission,
}) {
  const { data: session } = useSession();

  const { data: apiResponse, isLoading } = useSWR(
    session?.accessToken && couponId
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${couponId}`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken),
  );

  const coupon = apiResponse?.data;

  // Animation
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 },
    );
    gsap.fromTo(
      sheetRef.current,
      { x: "100%" },
      { x: "0%", duration: 0.4, ease: "power3.out" },
    );
  }, []);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(sheetRef.current, { x: "100%", duration: 0.3, ease: "power3.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
  };

  if (!coupon && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        ref={overlayRef}
        aria-label="Close details drawer"
        className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm cursor-default"
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-slate-50 dark:bg-slate-950 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800"
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start sticky top-0 z-10 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {coupon.code}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${coupon.is_active ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}
                  >
                    {coupon.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {coupon.name && (
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {coupon.name}
                  </h3>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Main Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-indigo-500" /> Coupon Details
                </h3>
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  {coupon.description && (
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Description
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {coupon.description}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Type
                      </p>
                      <div className="font-medium text-slate-900 dark:text-slate-200 capitalize">
                        {coupon.discount_type.replace("_", " ")}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Value
                      </p>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                        {coupon.discount_type === "percentage"
                          ? `${parseFloat(coupon.discount_value)}%`
                          : coupon.discount_type === "fixed"
                            ? `Rs. ${parseFloat(coupon.discount_value)}`
                            : "Tiered"}
                      </div>
                    </div>
                  </div>
                  {coupon.discount_type !== "tiered_percentage" && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Minimum Spend
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Rs.{" "}
                        {parseFloat(coupon.min_purchase || 0).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {coupon.discount_type === "tiered_percentage" && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">
                        Discount Tiers
                      </p>
                      <div className="space-y-1.5">
                        {(
                          (Array.isArray(coupon.tiers)
                            ? coupon.tiers
                            : JSON.parse(coupon.tiers || "[]")) || []
                        ).map((t, idx) => {
                          const itemKey = `tier-detail-${idx}`;
                          return (
                            <div
                              key={itemKey}
                              className="flex justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg"
                            >
                              <span>
                                Min Rs.{" "}
                                {parseFloat(
                                  t.min_amount || t.minSpend || 0,
                                ).toLocaleString()}{" "}
                                {t.max_amount || t.maxSpend
                                  ? `to Rs. ${parseFloat(t.max_amount || t.maxSpend).toLocaleString()}`
                                  : "and above"}
                              </span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {parseFloat(t.percentage || t.value || 0)}% OFF
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates & Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" /> Timing &
                  Restrictions
                </h3>
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Start Date
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {coupon.start_date
                          ? new Date(coupon.start_date).toLocaleDateString()
                          : "Immediate"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Expiry Date
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {coupon.expiry_date
                          ? new Date(coupon.expiry_date).toLocaleDateString()
                          : "No Expiry"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Total Usage Limit
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {coupon.usage_limit ? coupon.usage_limit : "Unlimited"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Limit Per User
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {coupon.usage_limit_per_user
                          ? coupon.usage_limit_per_user
                          : "1"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors flex justify-end gap-2">
              {hasPermission("Coupon Edit") && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onEdit(coupon);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Edit
                </button>
              )}
              {hasPermission("Coupon Delete") && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onDelete(coupon.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CouponsContent />
    </Suspense>
  );
}
