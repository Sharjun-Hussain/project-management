"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useDebounce } from "../hooks/useDebounce";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  X,
  MoreHorizontal,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Layers,
  Download,
  Tag,
  Box,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { exportToCSV } from "@/app/lib/exportUtils";

// --- HELPER: Image URL ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // Assuming the API base URL is like https://api.com/api/v1
  // We want https://api.com/
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "");
  return `${baseUrl}/${path}`;
};

// --- HELPER: Price Formatter ---
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// --- COMPONENT: DELETE MODAL ---
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(modalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(contentRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, delay: 0.1, ease: "back.out(1.7)" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div ref={contentRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 mx-auto">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isDeleting} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: PRODUCT SHEET ---
const ProductSheet = ({ product: initialProduct, onClose, hasPermission }) => {
  const sheetRef = useRef(null);
  const router = useRouter()
  const contentRef = useRef(null);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteVariant, setDeleteVariant] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate } = useSWRConfig();

  // --- FETCH DETAILED DATA ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };

  const { data: apiResponse, isLoading } = useSWR(
    session?.accessToken && initialProduct?.id
      ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${initialProduct.id}`, session.accessToken]
      : null,
    ([url]) => fetcher(url)
  );

  // Use fetched data if available, otherwise fallback to initial data (for smooth transition)
  const productData = apiResponse?.data || initialProduct;

  // Calculate stock from variants if available in detailed data
  const stock = productData.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || productData.stock || 0;

  // Ensure price is a number
  const price = parseFloat(productData.price || productData.variants?.[0]?.price || 0);

  useGSAP(() => {
    gsap.fromTo(
      sheetRef.current,
      { x: "100%" },
      { x: "0%", duration: 0.5, ease: "power3.out" }
    );
    gsap.fromTo(
      ".sheet-animate",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, delay: 0.2 }
    );
  }, []);

  const handleClose = () => {
    gsap.to(sheetRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  const handleDeleteVariant = async () => {
    if (!deleteVariant) return;
    setIsDeleting(true);
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/variants/${deleteVariant.id}`, session?.accessToken, {
        method: "DELETE",
      });

      toast.success("Variant deleted successfully");
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${initialProduct.id}`, session.accessToken]);
      // Also revalidate the main products list to update stock/price if needed
      mutate(key => typeof key === 'string' && key.includes('/admin/products?'));
      setDeleteVariant(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteModal
        isOpen={!!deleteVariant}
        onClose={() => setDeleteVariant(null)}
        onConfirm={handleDeleteVariant}
        title="Delete Variant?"
        message={`Are you sure you want to delete "${deleteVariant?.variant_name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          onClick={handleClose}
          className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity opacity-100"
        />

        <div
          ref={sheetRef}
          className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Product Details
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${(productData.status === "published" || productData.is_active)
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                    }`}
                >
                  {productData.status || (productData.is_active ? "published" : "draft")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {productData.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 space-y-6"
          >
            {isLoading && !apiResponse ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="sheet-animate bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-6">
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                    {productData.primary_image_path || productData.image ? (
                      <img
                        src={getImageUrl(productData.primary_image_path || productData.image)}
                        className="w-full h-full object-cover"
                        alt="Product"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Price</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          Rs {formatPrice(price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Stock</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {stock}
                          </p>
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${stock > 10 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {hasPermission("Product Update") && (
                        <Link
                          href={`/app/products/new?productId=${productData.id}`}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold  transition-colors text-center"
                        >
                          Edit Product
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="sheet-animate flex gap-6 border-b border-slate-200 dark:border-slate-700 px-2 overflow-x-auto">
                  {["overview", "variants", "gallery", "related", "buy_together"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-bold transition-colors relative capitalize whitespace-nowrap ${activeTab === tab
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {tab.replace("_", " ")}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content: Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="sheet-animate bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          Basic Information
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        <div className="flex justify-between p-4 text-sm">
                          <span className="text-slate-500">Code</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {productData.code}
                          </span>
                        </div>
                        <div className="flex justify-between p-4 text-sm">
                          <span className="text-slate-500">Brand</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {productData.brand?.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between p-4 text-sm">
                          <span className="text-slate-500">Condition</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {productData.condition || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between p-4 text-sm">
                          <span className="text-slate-500">Type</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {productData.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Specifications */}
                    {productData.specifications?.length > 0 && (
                      <div className="sheet-animate bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            Specifications
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                          {productData.specifications.map((spec) => (
                            <div key={spec.id} className="flex justify-between p-4 text-sm">
                              <span className="text-slate-500">{spec.specification_name}</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-right">
                                {spec.specification_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {productData.features?.length > 0 && (
                      <div className="sheet-animate bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Features</h3>
                        </div>
                        <ul className="space-y-2">
                          {productData.features.map((feature) => (
                            <li key={feature.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                              <span>{feature.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {productData.tags?.length > 0 && (
                      <div className="sheet-animate">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 px-1">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {productData.tags.map((tag) => (
                            <span key={tag.id} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {productData.full_description && (
                      <div className="sheet-animate bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 overflow-hidden w-full">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Description</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words whitespace-pre-wrap">
                          {productData.full_description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Variants (Accordion Style) */}
                {activeTab === "variants" && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      {hasPermission("Product Variant Create") && (
                        <button
                          onClick={() => router.push(`/app/products/new?productId=${productData.id}&step=variants`)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Variant
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {productData.variants?.map((variant) => (
                        <details
                          key={variant.id}
                          className="sheet-animate group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                        >
                          <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                {variant.storage_size?.replace(/"/g, "") || "V"}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {variant.variant_name?.replace(/"/g, "")}
                                </h4>
                                <p className="text-xs text-slate-500 font-mono">{variant.sku?.replace(/"/g, "")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold  text-slate-900 dark:text-white text-sm">Rs {formatPrice(variant.price)}</p>
                                <p className={`text-[2px] font-bold ${variant.stock_quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {variant.stock_quantity} in stock
                                </p>
                              </div>
                              {hasPermission("Product Variant Delete") && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeleteVariant(variant);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                            </div>
                          </summary>

                          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{variant.storage_size?.replace(/"/g, "") || "N/A"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RAM</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{variant.ram_size?.replace(/"/g, "") || "N/A"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{variant.color?.replace(/"/g, "") || "N/A"}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Barcode</p>
                                <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{variant.barcode?.replace(/"/g, "") || "N/A"}</p>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pricing</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Regular Price:</span>
                                    <span className="font-medium">Rs {formatPrice(variant.price)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Sales Price:</span>
                                    <span className="font-medium">Rs {formatPrice(variant.sales_price)}</span>
                                  </div>
                                  {variant.is_offer && (
                                    <div className="flex justify-between text-xs text-amber-600 font-bold">
                                      <span>Offer Price:</span>
                                      <span>Rs {formatPrice(variant.offer_price)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <div className="flex flex-wrap gap-2">
                                  {variant.is_active && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Active</span>}
                                  {variant.is_trending && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Trending</span>}
                                  {variant.is_featured && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Featured</span>}
                                  {variant.is_offer && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Offer</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </details>
                      ))}
                      {(!productData.variants || productData.variants.length === 0) && (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          No variants found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Gallery */}
                {activeTab === "gallery" && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      {hasPermission("Product Update") && (
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                          <Plus className="w-3 h-3" /> Add Image
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {productData.images?.map((img) => (
                        <div
                          key={img.id}
                          className="sheet-animate aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 relative group"
                        >
                          <img
                            src={getImageUrl(img.image_path)}
                            className="w-full h-full object-cover"
                            alt="Gallery"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {hasPermission("Product Update") && (
                              <button className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!productData.images || productData.images.length === 0) && (
                        <div className="col-span-full py-10 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                          No gallery images.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Related Products */}
                {activeTab === "related" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm px-1 sheet-animate">Related Products</h3>
                    {productData.compatible_products?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {productData.compatible_products.map((product) => (
                          <div key={product.id} className="sheet-animate bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden mb-2 relative">
                              {product.primary_image_path ? (
                                <img src={getImageUrl(product.primary_image_path)} className="w-full h-full object-cover" alt={product.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2">{product.name}</h4>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sheet-animate p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        No related products found.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Buy Together */}
                {activeTab === "buy_together" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm px-1 sheet-animate">Frequently Bought Together</h3>
                    {productData.bundled_products?.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {productData.bundled_products.map((product) => (
                          <div key={product.id} className="sheet-animate bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2 shadow-xs hover:shadow-sm transition-shadow">
                            <div className="aspect-square rounded-md bg-slate-100 dark:bg-slate-700 overflow-hidden mb-1.5 relative">
                              {product.primary_image_path ? (
                                <img src={getImageUrl(product.primary_image_path)} className="w-full h-full object-cover" alt={product.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-[10px] leading-tight line-clamp-2">{product.name}</h4>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sheet-animate p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        No frequently bought together products found.
                      </div>
                    )}
                  </div>
                )}


              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ProductsPage() {
  const containerRef = useRef(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localDrafts, setLocalDrafts] = useState([]);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { mutate } = useSWRConfig();
  const DRAFTS_KEY = useMemo(() =>
    session?.user?.id ? `igen_product_drafts_${session.user.id}` : "igen_product_drafts",
    [session?.user?.id]
  );

  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.some(role => role.name === "Admin" || role.name === "Super Admin");

  const hasPermission = (permissionName) => {
    if (isAdmin) return true;
    return userRoles.some(role =>
      role.permissions?.some(p => p.name === permissionName)
    );
  };

  // --- FILTER STATES ---
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  // Reset page when filters/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, conditionFilter, categoryFilter, brandFilter]);

  // --- API FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };

  // Load local drafts
  useEffect(() => {
    if (!session?.user?.id) return;
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || "[]");
    setLocalDrafts(drafts);
  }, [DRAFTS_KEY, session]);

  const handleDeleteLocalDraft = (id) => {
    const updatedDrafts = localDrafts.filter((d) => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    setLocalDrafts(updatedDrafts);
    toast.success("Local draft removed");
  };

  // Fetch Categories & Brands for Filter
  const { data: categoriesRes } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories/active/list`, session.accessToken] : null,
    ([url]) => fetcher(url)
  );
  const categories = categoriesRes?.data || [];

  const { data: brandsRes } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands/active/list`, session.accessToken] : null,
    ([url]) => fetcher(url)
  );
  const brands = brandsRes?.data || [];

  // Build API Query
  const buildApiUrl = () => {
    let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products?page=${currentPage}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
    if (statusFilter !== "all") url += `&status=${statusFilter}`;
    if (conditionFilter !== "all") url += `&condition=${conditionFilter}`;
    if (categoryFilter !== "all") url += `&category_id=${categoryFilter}`;
    if (brandFilter !== "all") url += `&brand_id=${brandFilter}`;
    return url;
  };

  const { data: apiResponse, error, isLoading } = useSWR(
    session?.accessToken ? [buildApiUrl(), session.accessToken] : null,
    ([url]) => fetcher(url),
    { keepPreviousData: true }
  );

  const productsData = apiResponse?.data?.data || [];
  const totalPages = apiResponse?.data?.last_page || 1;
  const totalItems = apiResponse?.data?.total || 0;

  // Transform Data
  const products = useMemo(() => {
    const apiProducts = productsData.map((p) => {
      // Calculate total stock from variants
      const totalStock = p.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;

      // Get price from first variant or default
      const price = p.variants?.[0]?.price || 0;

      return {
        ...p,
        stock: totalStock,
        price: parseFloat(price),
        image: getImageUrl(p.primary_image_path),
        status: p.is_active ? "published" : "draft", // Map boolean to string for UI
      };
    });

    // Merge local drafts if on first page and no search
    if (currentPage === 1 && !debouncedSearch) {
      const formattedDrafts = localDrafts.map((d) => ({
        ...d,
        stock: d.variants?.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0), 0) || 0,
        price: parseFloat(d.variants?.[0]?.price || 0),
        image: null, // Local drafts don't have persistent image URLs
        status: "draft",
        is_local_draft: true,
      }));
      return [...formattedDrafts, ...apiProducts];
    }

    return apiProducts;
  }, [productsData, localDrafts, currentPage, debouncedSearch]);

  // Calculate dynamic stats from current view products
  const { lowStockCount, outOfStockCount, avgPrice } = useMemo(() => {
    if (products.length === 0) return { lowStockCount: 0, outOfStockCount: 0, avgPrice: 0 };

    let lowStock = 0;
    let outOfStock = 0;
    let totalPrice = 0;

    products.forEach(p => {
      if (p.stock === 0) outOfStock++;
      else if (p.stock < 10) lowStock++;
      totalPrice += p.price;
    });

    return {
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      avgPrice: totalPrice / products.length
    };
  }, [products]);

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-up",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.05 }
      );
    },
    { scope: containerRef }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50";
      case "draft":
        return "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
      default:
        return "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";
    }
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50";
      case "used":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50";
      case "refurbished":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50";
      default:
        return "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    }
  };

  const getStockColor = (count) => {
    if (count === 0) return "bg-red-500";
    if (count < 10) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    if (deleteProduct.is_local_draft) {
      handleDeleteLocalDraft(deleteProduct.id);
      setDeleteProduct(null);
      return;
    }

    setIsDeleting(true);
    try {
      const data = await globalFetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${deleteProduct.id}`, session?.accessToken, {
        method: "DELETE",
      });

      toast.success("Product deleted successfully");
      mutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products?page=${currentPage}&search=${debouncedSearch}`, session.accessToken]);
      setDeleteProduct(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const productsToExport = products.map(p => ({
      ...p,
      category_name: p.category?.name || "N/A",
      brand_name: p.brand?.name || "N/A",
    }));

    const headerMap = {
      code: "Code",
      name: "Product Name",
      price: "Price",
      stock: "Stock",
      category_name: "Category",
      brand_name: "Brand",
      status: "Status",
    };

    exportToCSV(productsToExport, "Products", headerMap);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white relative"
      onClick={() => {
        if (showFilterMenu) setShowFilterMenu(false);
      }}
    >
      <DeleteModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {/* RENDER SHEET IF PRODUCT SELECTED */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          hasPermission={hasPermission}
        />
      )}

      {/* 1. HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10 p-6 md:p-8 pb-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="animate-up">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Products
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage inventory, pricing, and product details.
            </p>
          </div>
          <div className="animate-up flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            {hasPermission("Product Create") && (
              <Link
                href="/app/products/new"
                className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Product</span>
              </Link>
            )}
          </div>
        </div>

        {/* 2. STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Products",
              val: totalItems.toLocaleString(),
              icon: Package,
              color: "text-indigo-600",
            },
            {
              label: "Low Stock ",
              val: lowStockCount.toString(),
              icon: AlertTriangle,
              color: "text-amber-600",
            },
            {
              label: "Out of Stock ",
              val: outOfStockCount.toString(),
              icon: XCircle,
              color: "text-red-600",
            },
            {
              label: "Avg Price ",
              val: `Rs ${formatPrice(avgPrice)}`,
              icon: DollarSign,
              color: "text-emerald-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="animate-up bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  {stat.val}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* 3. TOOLBAR */}
        <div className="animate-up sticky top-4 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all"
              placeholder="Search by name, SKU..."
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto p-1">
            {/* MORE FILTERS DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showFilterMenu || statusFilter !== "all" || conditionFilter !== "all" || categoryFilter !== "all" || brandFilter !== "all"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent"
                  }`}
              >
                <div className="relative">
                  <Filter className="w-4 h-4" />
                  {(statusFilter !== "all" || conditionFilter !== "all" || categoryFilter !== "all" || brandFilter !== "all") && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full border border-white dark:border-slate-800"></span>
                  )}
                </div>
                Filters
              </button>

              {showFilterMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 md:right-auto md:left-0 lg:right-0 lg:left-auto w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-30 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[80vh]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Filter Products</h4>
                    {(statusFilter !== "all" || conditionFilter !== "all" || categoryFilter !== "all" || brandFilter !== "all") && (
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setConditionFilter("all");
                          setCategoryFilter("all");
                          setBrandFilter("all");
                        }}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">
                      Brand
                    </label>
                    <select
                      value={brandFilter}
                      onChange={(e) => setBrandFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="all">All Brands</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="all">All Statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  {/* Condition Filter */}
                  <div className="mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">
                      Condition
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all", label: "All" },
                        { id: "new", label: "New" },
                        { id: "used", label: "Used" },
                        { id: "refurbished", label: "Refurbished" },
                      ].map((cond) => (
                        <button
                          key={cond.id}
                          onClick={() => setConditionFilter(cond.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${conditionFilter === cond.id
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                            }`}
                        >
                          {cond.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex bg-slate-100/50 dark:bg-slate-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${viewMode === "list"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. CONTENT AREA */}
        <div className="min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-red-200 dark:border-red-900/50 rounded-3xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Failed to load products
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Please try again later.
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="animate-up flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center px-6">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 font-medium">
                Start building your catalog by adding your first product with its variants and specifications.
              </p>
              {hasPermission("Product Create") && (
                <button
                  onClick={() => router.push("/app/products/new")}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Create Your First Product
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-4 pl-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Condition
                        </th>
                        <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="p-4 pr-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          onClick={() => {
                            if (product.is_local_draft) {
                              router.push(`/app/products/new?draftId=${product.id}`);
                            } else {
                              setSelectedProduct(product);
                            }
                          }}
                          className="product-item group hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                        >
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {product.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {product.brand?.name || "No Brand"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                            {product.code}
                          </td>
                          <td className="p-4">
                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {product.stock} in stock
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getStockColor(
                                    product.stock
                                  )}`}
                                  style={{
                                    width: `${Math.min(product.stock, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                            Rs {formatPrice(product.price)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border capitalize ${getConditionColor(product.condition)}`}>
                              {product.condition || "N/A"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                product.status
                              )}`}
                            >
                              {product.is_local_draft ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Local Draft
                                </>
                              ) : (
                                <>
                                  {product.status === "published" && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  {product.status}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {hasPermission("Product Delete") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteProduct(product);
                                }}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (product.is_local_draft) {
                          router.push(`/app/products/new?draftId=${product.id}`);
                        } else {
                          setSelectedProduct(product);
                        }
                      }}
                      className="product-item group bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-3 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-900/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden mb-3 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={product.name}
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {hasPermission("Product Delete") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProduct(product);
                              }}
                              className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <span
                            className={`backdrop-blur-md px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                              product.status
                            )}`}
                          >
                            {product.is_local_draft ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Local Draft
                              </span>
                            ) : (
                              product.status
                            )}
                          </span>
                          {product.condition && (
                            <span className="backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold border bg-white/10 text-white border-white/20 capitalize">
                              {product.condition}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="px-1 pb-2">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {product.name}
                          </h3>
                          <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                            Rs {formatPrice(product.price)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                            {product.code}
                          </span>
                          <span>{product.brand?.name || "No Brand"}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-700">
                          <div
                            className={`w-2 h-2 rounded-full ${getStockColor(
                              product.stock
                            )}`}
                          ></div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : "Out of stock"}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {products.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalItems}
                  </span>{" "}
                  results
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
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNum
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
    </div>
  );
}
