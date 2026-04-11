"use client";

import { useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useDebounce } from "../hooks/useDebounce";
import useSWR, { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import {
  Ticket,
  Plus,
  Search,
  Copy,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  Percent,
  DollarSign,
  Wand2,
  Scissors,
  BarChart3,
  Clock,
  Package,
  Layers,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Globe,
  Tag,
  Info,
  Filter,
} from "lucide-react";
import { Suspense, useRef, useState, useEffect } from "react";
import { Calendar as CalendarComponent } from "../../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
// --- MOCK PRODUCT DATA (For Search) ---
const MOCK_PRODUCTS_DB = [
  {
    id: 101,
    name: "Samsung Galaxy S24 Ultra",
    image: "https://placehold.co/50",
  },
  { id: 102, name: "iPhone 15 Pro Max", image: "https://placehold.co/50" },
  { id: 103, name: "Sony WH-1000XM5", image: "https://placehold.co/50" },
  { id: 104, name: "MacBook Air M3", image: "https://placehold.co/50" },
  { id: 105, name: "Nike Air Jordan 1", image: "https://placehold.co/50" },
];

// --- MOCK COUPONS ---


function CouponsContent() {
  const containerRef = useRef(null);
  const formSheetRef = useRef(null);
  const formOverlayRef = useRef(null);
  const { data: session } = useSession();

  // --- STATE ---
  const { mutate } = useSWRConfig();

  // --- API FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterType, setFilterType] = useState("All"); // percentage, fixed, tiered

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
  const [productQuery, setProductQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchParams = useSearchParams();

  // --- API DATA ---
  const { data: apiResponse, error, isLoading } = useSWR(
    session?.accessToken
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`, session.accessToken]
      : null,
    ([url]) => fetcher(url),
    {
      keepPreviousData: true,
    }
  );

  const coupons = (apiResponse?.data?.data || []).map(item => ({
    id: item.id,
    code: item.code,
    type: item.type === 'tiered_percentage' ? 'Tiered' : (item.type === 'percentage' ? 'Percentage' : 'Fixed'),
    value: item.value || (item.tiers?.length ? `Up to ${Math.max(...item.tiers.map(t => parseFloat(t.percentage)))}%` : 0),
    minSpend: parseFloat(item.min_purchase_amount || 0),
    usage: item.used_count || 0,
    limit: item.usage_limit || "∞",
    status: item.is_active ? "Active" : "Inactive",
    expiry: new Date(item.expiry_date).toLocaleDateString(),
    description: item.description || item.name,
    appliesTo: "all",
    productIds: [],
  }));

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "percentage", // percentage, fixed, tiered_percentage
    value: "",
    min_purchase_amount: "",
    start_date: "",
    expiry_date: "",
    usage_limit: "",
    usage_limit_per_user: "",
    tiers: [{ min_amount: "", max_amount: "", percentage: "" }],
    appliesTo: "all",
    is_active: true
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
    { scope: containerRef },
  );

  useGSAP(() => {
    if (isSheetOpen) {
      gsap.fromTo(formOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(formSheetRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" });
    }
  }, [isSheetOpen]);

  // --- HANDLERS ---

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, code: result });
  };

  // Product Selection Handlers
  const addProduct = (product) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductQuery("");
    setShowProductDropdown(false);
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Tier Handlers
  const addTier = () => {
    setFormData({
      ...formData,
      tiers: [...formData.tiers, { min_amount: "", max_amount: "", percentage: "" }]
    });
  };

  const removeTier = (index) => {
    const newTiers = [...formData.tiers];
    newTiers.splice(index, 1);
    setFormData({ ...formData, tiers: newTiers });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...formData.tiers];
    newTiers[index][field] = value;
    setFormData({ ...formData, tiers: newTiers });
  };

  const handleEdit = (coupon) => {
    setIsEditMode(true);
    setEditingCouponId(coupon.id);
    
    // Find original coupon data from API response to get exact fields
    const rawCoupon = apiResponse?.data?.data?.find(c => c.id === coupon.id);
    if (!rawCoupon) return;

    setFormData({
        code: rawCoupon.code,
        name: rawCoupon.name,
        description: rawCoupon.description || "",
        type: rawCoupon.type,
        value: rawCoupon.value || "",
        min_purchase_amount: rawCoupon.min_purchase_amount || "",
        start_date: rawCoupon.start_date?.split('T')[0] || "",
        expiry_date: rawCoupon.expiry_date?.split('T')[0] || "",
        usage_limit: rawCoupon.usage_limit || "",
        usage_limit_per_user: rawCoupon.usage_limit_per_user || "",
        tiers: rawCoupon.tiers?.length ? rawCoupon.tiers.map(t => ({
            min_amount: t.min_amount,
            max_amount: t.max_amount,
            percentage: t.percentage
        })) : [{ min_amount: "", max_amount: "", percentage: "" }],
        appliesTo: "all", // TODO: Update when API supports product links
        is_active: rawCoupon.is_active
    });
    
    setIsSheetOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const payload = {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            type: formData.type,
            start_date: formData.start_date,
            expiry_date: formData.expiry_date,
            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : null,
            is_active: formData.is_active,
            // products logic if needed later
        };

        if (formData.type === 'tiered_percentage') {
            payload.tiers = formData.tiers.map(t => ({
                min_amount: parseFloat(t.min_amount),
                max_amount: parseFloat(t.max_amount),
                percentage: parseFloat(t.percentage)
            }));
        } else {
            payload.value = parseFloat(formData.value);
            payload.min_purchase_amount = parseFloat(formData.min_purchase_amount);
        }

        const url = isEditMode 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${editingCouponId}`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`;
            
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await globalFetcher(url, session?.accessToken, {
            method: method,
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res && res.status === 'success') {
            toast.success(`Coupon ${isEditMode ? 'updated' : 'created'} successfully`);
            handleCloseSheet();
            mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`, session?.accessToken]);
        }
    } catch (err) {
        if (err.info && err.info.errors) {
            const errorsMap = {};
            err.info.errors.forEach(e => {
                errorsMap[e.field] = e.messages[0];
            });
            setValidationErrors(errorsMap);
        } else {
            toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} coupon`);
        }
    } finally {
        setIsSubmitting(false);
    }
};

  const handleCloseSheet = () => {
    const tl = gsap.timeline({ onComplete: () => {
        setIsSheetOpen(false);
        setValidationErrors({});
    } });
    tl.to(formSheetRef.current, { x: "100%", duration: 0.3, ease: "power3.in" });
    tl.to(formOverlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
  };

  // Handle Quick Action from Header
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsSheetOpen(true);
      // Clean up URL to prevent re-opening on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
        await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${deletingId}`, session?.accessToken, {
            method: 'DELETE'
        });
        toast.success("Coupon deleted successfully");
        mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons`, session?.accessToken]);
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
    const matchesStatus = filterStatus === "All" || coupon.status === filterStatus;
    const matchesType = filterType === "All" || coupon.type === filterType;
    const matchesSearch = 
        (coupon.code || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (coupon.description || "").toLowerCase().includes(debouncedSearch.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "Expired":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
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
            Manage discount codes and product-specific offers.
          </p>
        </div>
          <button
            onClick={() => {
                setIsEditMode(false);
                setFormData({
                    code: "",
                    name: "",
                    description: "",
                    type: "percentage",
                    value: "",
                    min_purchase_amount: "",
                    start_date: "",
                    expiry_date: "",
                    usage_limit: "",
                    usage_limit_per_user: "",
                    tiers: [{ min_amount: "", max_amount: "", percentage: "" }],
                    appliesTo: "all",
                    is_active: true
                });
                setValidationErrors({});
                setIsSheetOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Create Coupon
        </button>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Total Redemptions
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">1,443</h4>
          </div>
        </div>
        <div className="animate-header bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Discount Volume
            </p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Rs. 1.2M</h4>
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
            placeholder="Search coupons (code or description)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
          <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filters</span>
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
            <div key={i} className="h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      ) : filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              onClick={() => setSelectedCouponId(coupon.id)}
              className="coupon-card bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white font-mono tracking-wide">
                      {coupon.code}
                    </h3>
                    <button
                      onClick={() => handleCopy(coupon.code, coupon.id)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {copiedId === coupon.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {coupon.description}
                  </p>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(coupon.status)}`}
                >
                  {coupon.status}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Discount
                    </p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {coupon.type === "Percentage"
                        ? `${coupon.value}% OFF`
                        : (coupon.type === "Tiered" ? coupon.value : `Rs. ${coupon.value} OFF`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Applies To
                    </p>
                    <div className="flex justify-end mt-1">
                      {coupon.appliesTo === "specific" ? (
                        <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">
                          <Package className="w-3 h-3" />{" "}
                          {coupon.productIds.length} Products
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                          <Layers className="w-3 h-3" /> Site-wide
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Usage</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {coupon.usage} / {coupon.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${(coupon.usage / (coupon.limit === "∞" ? 10000 : coupon.limit)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5" /> Expires:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {coupon.expiry}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(coupon.id); }}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-header flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Ticket className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No coupons created yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
            Boost your sales by creating your first discount code or tiered promotion.
          </p>
          <button
            onClick={() => {
                setIsEditMode(false);
                setFormData({
                    code: "",
                    name: "",
                    description: "",
                    type: "percentage",
                    value: "",
                    min_purchase_amount: "",
                    start_date: "",
                    expiry_date: "",
                    usage_limit: "",
                    usage_limit_per_user: "",
                    tiers: [{ min_amount: "", max_amount: "", percentage: "" }],
                    appliesTo: "all",
                    is_active: true
                });
                setIsSheetOpen(true);
            }}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
            Create Your First Coupon
          </button>
        </div>
      )}

      {/* 6. DETAILS SHEET */}
      {selectedCouponId && (
        <CouponDetailsSheet 
            couponId={selectedCouponId} 
            onClose={() => setSelectedCouponId(null)} 
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
      )}

      {/* 5. CREATE/EDIT SHEET */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            ref={formOverlayRef}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleCloseSheet}
          />
          
          <div 
            ref={formSheetRef}
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-950/95 z-10 backdrop-blur transition-colors">
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {isEditMode ? "Edit Coupon" : "Create Coupon"}
              </h3>
              <button 
                onClick={handleCloseSheet}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Code & Basic Status Section */}
              <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors mb-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 relative group">
                    <div className="flex-1 relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            required
                            type="text"
                            value={formData.code}
                            onChange={(e) => {
                                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                if (validationErrors.code) setValidationErrors({ ...validationErrors, code: null });
                            }}
                            placeholder="e.g. SUMMER2026"
                            className={`w-full bg-white dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-mono font-medium uppercase outline-none transition-all ${validationErrors.code ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 shadow-sm text-slate-900 dark:text-white"}`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={generateCode}
                        className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center translate-y-px"
                    >
                        <Wand2 className="w-5 h-5" />
                    </button>
                  </div>
                  {validationErrors.code && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.code}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: formData.is_active ? 0 : 1 })}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formData.is_active ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Status</span>
                        {formData.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, appliesTo: formData.appliesTo === "all" ? "specific" : "all" })}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formData.appliesTo === "all" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">
                            {formData.appliesTo === "all" ? "Site-wide" : "Specific"}
                        </span>
                        {formData.appliesTo === "all" ? <Layers className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </button>
                </div>
              </div>

              {/* Name & Description */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Coupon Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
                        }}
                        placeholder="e.g. Summer Sale 2026"
                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all ${validationErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"}`}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Description</label>
                  <div className="relative group">
                    <Info className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Special discount for our summer collection..."
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUCT SELECTION LOGIC */}
              {formData.appliesTo === "specific" && (
                <div className="space-y-4 p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Select Products</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        autoFocus
                        value={productQuery}
                        onChange={(e) => {
                          setProductQuery(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-indigo-500 outline-none dark:text-white shadow-sm font-medium"
                      />
                      {/* Dropdown */}
                      {showProductDropdown && productQuery && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                          {MOCK_PRODUCTS_DB.filter((p) =>
                            p.name.toLowerCase().includes(productQuery.toLowerCase())
                          ).map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => addProduct(prod)}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-3 transition-colors dark:text-slate-200 font-medium"
                            >
                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                              {prod.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center gap-2 bg-white dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-medium border border-indigo-100 dark:border-indigo-800/50 transition-all shadow-sm"
                        >
                          {prod.name}
                          <button
                            type="button"
                            onClick={() => removeProduct(prod.id)}
                            className="text-indigo-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Value & Type */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["percentage", "fixed", "tiered_percentage"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type })}
                          className={`py-3 text-[11px] font-bold rounded-xl border transition-all uppercase tracking-tight shadow-sm ${
                            formData.type === type
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

                {formData.type === "tiered_percentage" ? (
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                        Discount Tiers
                      </label>
                      <button
                        type="button"
                        onClick={addTier}
                        className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 active:scale-95"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.tiers.map((tier, index) => (
                        <div
                          key={index}
                          className="flex gap-2 items-end animate-in slide-in-from-right-2 fade-in duration-300 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                          <div className="flex-1 space-y-1.5">
                            <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500 ml-1">
                              Min (Rs)
                            </p>
                            <input
                              type="number"
                              placeholder="0"
                              value={tier.min_amount}
                              onChange={(e) => updateTier(index, "min_amount", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all font-bold hide-spinner"
                            />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500 ml-1">
                              Max (Rs)
                            </p>
                            <input
                              type="number"
                              placeholder="∞"
                              value={tier.max_amount}
                              onChange={(e) => updateTier(index, "max_amount", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all font-bold hide-spinner"
                            />
                          </div>
                          <div className="w-20 space-y-1.5">
                            <p className="text-[11px] uppercase font-semibold text-slate-400 dark:text-slate-500 ml-1">
                              Disc %
                            </p>
                            <input
                              type="number"
                              placeholder="%"
                              value={tier.percentage}
                              onChange={(e) => updateTier(index, "percentage", e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 dark:text-white transition-all font-bold hide-spinner"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                        Discount Value <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                          {formData.type === "percentage" ? (
                            <Percent className="w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                        </div>
                        <input
                          required
                          type="number"
                          value={formData.value}
                          onChange={(e) => {
                            setFormData({ ...formData, value: e.target.value });
                            if (validationErrors.value) setValidationErrors({ ...validationErrors, value: null });
                          }}
                          placeholder="0"
                          className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all hide-spinner ${validationErrors.value ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"}`}
                        />
                      </div>
                      {validationErrors.value && (
                        <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors.value}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Min Spend</label>
                       <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <input
                            type="number"
                            value={formData.min_purchase_amount}
                            onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                            placeholder="0"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all hide-spinner"
                        />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Limits */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Total Limit
                  </label>
                  <div className="relative group">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 10) {
                          setFormData({ ...formData, usage_limit: val });
                          if (validationErrors.usage_limit) setValidationErrors({ ...validationErrors, usage_limit: null });
                        }
                      }}
                      placeholder="∞"
                      className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all hide-spinner ${validationErrors.usage_limit ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 shadow-sm"}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                       <span className={`text-[10px] font-bold ${formData.usage_limit.length >= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {formData.usage_limit.length}/10
                       </span>
                    </div>
                  </div>
                  {validationErrors.usage_limit && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.usage_limit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Per User <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input
                        required
                        type="number"
                        value={formData.usage_limit_per_user}
                        onChange={(e) => {
                            setFormData({ ...formData, usage_limit_per_user: e.target.value });
                            if (validationErrors.usage_limit_per_user) setValidationErrors({ ...validationErrors, usage_limit_per_user: null });
                        }}
                        placeholder="1"
                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all hide-spinner ${validationErrors.usage_limit_per_user ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 shadow-sm"}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold border rounded-xl px-4 py-2.5 h-[46px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800",
                          !formData.start_date && "text-muted-foreground",
                          validationErrors.start_date && "border-red-500 focus:ring-red-500"
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
                        selected={formData.start_date ? parseISO(formData.start_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ ...formData, start_date: format(date, "yyyy-MM-dd") });
                            if (validationErrors.start_date) setValidationErrors({ ...validationErrors, start_date: null });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.start_date && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.start_date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold border rounded-xl px-4 py-2.5 h-[46px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800",
                          !formData.expiry_date && "text-muted-foreground",
                          validationErrors.expiry_date && "border-red-500 focus:ring-red-500"
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
                        selected={formData.expiry_date ? parseISO(formData.expiry_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ ...formData, expiry_date: format(date, "yyyy-MM-dd") });
                            if (validationErrors.expiry_date) setValidationErrors({ ...validationErrors, expiry_date: null });
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsDeleteDialogOpen(false)} />
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2 font-mono uppercase tracking-tight">Delete Coupon?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8 leading-relaxed">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="py-3.5 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function CouponDetailsSheet({ couponId, onClose, onEdit, onDelete }) {
  const { data: session } = useSession();
  
  const { data: apiResponse, isLoading } = useSWR(
    session?.accessToken && couponId
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/coupons/${couponId}`, session.accessToken]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken)
  );

  const coupon = apiResponse?.data;

  // Animation
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  
  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(sheetRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" });
  }, []);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(sheetRef.current, { x: "100%", duration: 0.3, ease: "power3.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
  };

  if (!coupon && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
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
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{coupon.code}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${coupon.is_active ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                                {coupon.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{coupon.name}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Type</p>
                                    <p className="font-medium text-slate-900 dark:text-slate-200 capitalize">{coupon.type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Value</p>
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                                        {coupon.type === 'tiered_percentage' 
                                            ? 'Tiered' 
                                            : (coupon.type === 'percentage' ? `${parseFloat(coupon.value)}%` : `Rs. ${parseFloat(coupon.value)}`)}
                                    </p>
                                </div>
                            </div>
                            {coupon.description && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Description</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">{coupon.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tiers Section (Only for tiered_percentage) */}
                    {coupon.type === 'tiered_percentage' && coupon.tiers && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-500" /> Discount Tiers
                            </h3>
                            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left transition-colors">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Min Spend</th>
                                            <th className="px-4 py-3">Max Spend</th>
                                            <th className="px-4 py-3 text-right">Discount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                                        {coupon.tiers.map(tier => (
                                            <tr key={tier.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Rs. {parseFloat(tier.min_amount).toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Rs. {parseFloat(tier.max_amount).toLocaleString()}</td>
                                                <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-right">{parseFloat(tier.percentage)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Limits & Dates */}
                    <div className="space-y-4">
                         <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> Limits & Dates
                        </h3>
                        <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                             <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 transition-colors">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Usage</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{coupon.used_count} / {coupon.usage_limit}</p>
                                </div>
                                <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                     <div className="h-full bg-emerald-500" style={{ width: `${(coupon.used_count / coupon.usage_limit) * 100}%` }}></div>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Start Date</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">{new Date(coupon.start_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Expiry Date</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">{new Date(coupon.expiry_date).toLocaleDateString()}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
                    <button onClick={handleClose} className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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

