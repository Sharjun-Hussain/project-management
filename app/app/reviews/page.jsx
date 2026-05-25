"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  Package,
  ThumbsUp,
  ThumbsDown,
  Filter,
  SlidersHorizontal,
  Download,
} from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { getImageUrl } from "../../../lib/utils";
import { toast } from "sonner";
import { exportToCSV } from "@/app/lib/exportUtils";

// --- HELPERS ---
const getAvatarUrl = (user) => {
  if (user?.profile_image) return getImageUrl(user.profile_image);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=6366f1&color=fff&bold=true`;
};

const StarDisplay = ({ rating, size = "sm" }) => {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700"}`}
        />
      ))}
    </div>
  );
};

const RatingBadge = ({ rating }) => {
  const colors =
    rating >= 4
      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
      : rating === 3
        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors}`}>
      <Star className="w-3 h-3 fill-current" />
      {rating}
    </span>
  );
};

const StatusBadge = ({ isApproved }) => {
  return isApproved ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
      approved
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
      pending
    </span>
  );
};

export default function ReviewsPage() {
  const { data: session } = useSession();
  const { mutate: globalMutate } = useSWRConfig();
  const containerRef = useRef(null);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // --- STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(null); // 1-5 or null
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // --- API ---
  const apiUrl = session?.accessToken
    ? [
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reviews?page=${currentPage}&per_page=${itemsPerPage}&search=${searchTerm}${activeTab !== "all" ? `&status=${activeTab}` : ""}${ratingFilter ? `&rating=${ratingFilter}` : ""}`,
      session.accessToken,
    ]
    : null;

  const { data: reviewsResponse, isLoading, mutate } = useSWR(
    apiUrl,
    ([url]) => globalFetcher(url, session?.accessToken),
    { revalidateOnFocus: false }
  );

  const reviews = useMemo(() => reviewsResponse?.data?.data || [], [reviewsResponse]);
  const totalItems = reviewsResponse?.data?.total || 0;
  const totalPages = reviewsResponse?.data?.last_page || 1;

  useEffect(() => setCurrentPage(1), [searchTerm, activeTab, ratingFilter]);

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      gsap.fromTo(".animate-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power4.out" });
      gsap.fromTo(".animate-toolbar", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power4.out" });
    },
    { scope: containerRef }
  );

  useGSAP(() => {
    if (selectedReview && drawerRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(drawerRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power4.out" });
    }
  }, [selectedReview]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    const tl = gsap.timeline({ onComplete: () => { setSelectedReview(null); setReplyText(""); } });
    tl.to(drawerRef.current, { x: "100%", duration: 0.3, ease: "power3.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  const handleUpdateStatus = async (reviewId, isApproved) => {
    setIsUpdatingStatus(true);
    // Optimistically determine the next status
    const nextApprovedStatus = !isApproved;
    try {
      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reviews/${reviewId}/toggle-status`,
        session?.accessToken,
        { method: "PATCH", headers: { "Content-Type": "application/json" } }
      );
      toast.success(`Review status toggled successfully`);
      mutate();
      if (selectedReview?.id === reviewId) {
        setSelectedReview((prev) => ({ ...prev, is_approved: nextApprovedStatus }));
      }
    } catch (err) {
      toast.error(err.message || "Failed to update review status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reviews/${selectedReview.id}/reply`,
        session?.accessToken,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reply: replyText }) }
      );
      toast.success("Reply posted successfully");
      setReplyText("");
      mutate();
      setSelectedReview((prev) => ({ ...prev, admin_reply: replyText }));
    } catch (err) {
      toast.error(err.message || "Failed to post reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleExport = () => {
    const headerMap = {
      "user.name": "Customer",
      "product.name": "Product",
      rating: "Rating",
      review: "Review",
      is_approved: "Approved",
      created_at: "Date",
    };
    exportToCSV(reviews, "Reviews", headerMap);
  };

  // --- KPI STATS ---
  const stats = useMemo(() => {
    const allReviews = reviewsResponse?.data?.data || [];
    const avgRating = allReviews.length
      ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
      : "—";
    const pending = (reviewsResponse?.data?.total_pending) ?? allReviews.filter((r) => !r.is_approved).length;
    return { total: totalItems, avgRating, pending };
  }, [reviewsResponse, totalItems]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-x-hidden relative px-8 py-6 space-y-6"
      onClick={() => { if (showFilterMenu) setShowFilterMenu(false); }}
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-header">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
            Reviews
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage customer product reviews and ratings.
          </p>
        </div>
        <div className="animate-header">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="animate-header grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg. Rating</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgRating}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 p-2">
          {/* Status Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto scrollbar-hide gap-1">
            {["all", "pending", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize ${activeTab === tab ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reviews..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* Rating Filter */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${ratingFilter ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 bg-white dark:bg-slate-800"}`}
              >
                <Filter className="w-3.5 h-3.5" />
                {ratingFilter ? `${ratingFilter} Star` : "Filter"}
              </button>
              {showFilterMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Rating</p>
                  <button
                    onClick={() => { setRatingFilter(null); setShowFilterMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!ratingFilter ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                  >
                    All Ratings
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRatingFilter(r); setShowFilterMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${ratingFilter === r ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      <StarDisplay rating={r} />
                      {r} {r === 1 ? "Star" : "Stars"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. REVIEWS TABLE */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Review</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                      <p className="text-sm font-medium">Loading reviews...</p>
                    </div>
                  </td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    onClick={() => setSelectedReview(review)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                  >
                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(review.user)}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                          alt=""
                        />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {review.user?.name || "Anonymous"}
                        </span>
                      </div>
                    </td>
                    {/* Product */}
                    <td className="p-4 max-w-[180px]">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {review.product?.name || review.product_name || "—"}
                      </p>
                      {review.variant?.name && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{review.variant.name}</p>
                      )}
                    </td>
                    {/* Rating */}
                    <td className="p-4">
                      <RatingBadge rating={review.rating} />
                    </td>
                    {/* Review Snippet */}
                    <td className="p-4 max-w-[260px]">
                      {review.title && (
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-0.5">{review.title}</p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {review.review || review.body || "—"}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <StatusBadge isApproved={review.is_approved} />
                    </td>
                    {/* Date */}
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(review.id, review.is_approved); }}
                          className={`p-1.5 rounded-lg transition-colors ${review.is_approved ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30" : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                          title={review.is_approved ? "Reject" : "Approve"}
                        >
                          {review.is_approved ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No reviews found.</p>
                      {(searchTerm || activeTab !== "all" || ratingFilter) && (
                        <button
                          onClick={() => { setSearchTerm(""); setActiveTab("all"); setRatingFilter(null); }}
                          className="mt-2 text-indigo-600 text-sm font-bold hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-300"
            >
              {[10, 20, 50].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            {totalItems > 0 && (
              <span className="hidden sm:inline ml-2 font-medium">
                <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}</span>
                {" "}of{" "}
                <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. REVIEW DETAILS DRAWER */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={handleCloseDrawer}
          />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16">
            <div
              ref={drawerRef}
              className="w-screen max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-800"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarDisplay rating={selectedReview.rating} size="lg" />
                    <StatusBadge isApproved={selectedReview.is_approved} />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(selectedReview.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/30">

                {/* Customer Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Customer</h3>
                  <div className="flex items-center gap-3">
                    <img src={getAvatarUrl(selectedReview.user)} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-700" alt="" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedReview.user?.name || "Anonymous"}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{selectedReview.user?.email || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Product Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Product
                  </h3>
                  <div className="flex items-center gap-3">
                    {selectedReview.product?.primary_image_path ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/${selectedReview.product.primary_image_path}`}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-700 bg-slate-100"
                        alt=""
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedReview.product?.name || selectedReview.product_name || "—"}</p>
                      {selectedReview.variant?.name && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{selectedReview.variant.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Review</h3>
                  {selectedReview.title && (
                    <p className="font-bold text-slate-900 dark:text-white text-base mb-2">{selectedReview.title}</p>
                  )}
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {selectedReview.review || selectedReview.body || "No written review."}
                  </p>
                </div>

                {/* Admin Reply */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Admin Reply
                  </h3>
                  {selectedReview.admin_reply ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4">
                      <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">{selectedReview.admin_reply}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply to this review..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors resize-none dark:text-white"
                      />
                      <button
                        onClick={handleReply}
                        disabled={!replyText.trim() || isReplying}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Post Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReview.id, selectedReview.is_approved)}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${selectedReview.is_approved ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"}`}
                >
                  {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedReview.is_approved ? <ThumbsDown className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />)}
                  {selectedReview.is_approved ? "Reject" : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
