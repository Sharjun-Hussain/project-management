"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Printer,
  X,
  Check,
  User as UserIcon,
  Landmark,
  Banknote,
  CreditCard as CardIcon,
  Package,
  Loader2,
  User,
  MapPin,
  Send,
  CreditCard,
  RotateCcw,
  Ban,
} from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { getImageUrl } from "../../../lib/utils";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import PackingSlip from "../../components/PackingSlip";
import { exportToCSV } from "@/app/lib/exportUtils";


const getAvatarUrl = (user) => {
  if (user?.profile_image) {
    return getImageUrl(user.profile_image);
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random&color=fff&bold=true`;
};

export default function InteractiveOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("order_id");
  const orderNumberParam = searchParams.get("order_number");
  const { data: session } = useSession();
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const hasAutoOpened = useRef(false);

  // Auto-open order if order_id is in URL — only once on initial load
  useEffect(() => {
    if (orderIdParam && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setSelectedOrder({ id: orderIdParam });
    }
  }, [orderIdParam]);

  // --- FILTER STATES ---
  const [activeTab, setActiveTab] = useState("All");

  // Date Filter State
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [dateRange, setDateRange] = useState({ label: "All Time", days: null });

  // "More Filters" State
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilters, setStatusFilters] = useState([]); // Stores selected statuses like 'Paid', 'Shipped'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Drawer Actions State
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Shipment & Cancellation States
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [shippingData, setShippingData] = useState({
    courier_name: "Prompt Express",
    tracking_number: "",
    courier_phone: "",
    estimated_delivery_at: "",
    shipping_cost: "",
    shipping_notes: "",
  });
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printSize, setPrintSize] = useState("a4"); // 'a4' or 'thermal'

  // --- REFS ---
  const tableRef = useRef(null);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // --- API FETCHING ---
  const { data: ordersResponse, isLoading, mutate } = useSWR(
    session?.accessToken
      ? [
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?page=${currentPage}&per_page=${itemsPerPage}`,
        session?.accessToken,
      ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken),
    { revalidateOnFocus: false }
  );

  const { data: orderDetailsResponse, isLoading: isDetailsLoading } = useSWR(
    session?.accessToken && selectedOrder?.id
      ? [
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${selectedOrder.id}`,
        session?.accessToken,
      ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken)
  );

  const orderDetails = orderDetailsResponse?.data || null;

  const orders = useMemo(() => ordersResponse?.data?.data || [], [ordersResponse]);
  const totalItems = ordersResponse?.data?.total || 0;
  const totalPages = ordersResponse?.data?.last_page || 1;

  // Auto-open by order_number once orders are loaded — only once
  useEffect(() => {
    if (orderNumberParam && orders.length > 0 && !hasAutoOpened.current) {
      const match = orders.find(o => o.order_number === orderNumberParam);
      if (match) {
        hasAutoOpened.current = true;
        setSelectedOrder(match);
      }
    }
  }, [orderNumberParam, orders]);

  // --- FILTER LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search filter (Order Number or Customer Name)
      const matchesSearch = searchTerm
        ? order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // 2. Active Tab (Fulfillment Status)
      const matchesTab =
        activeTab === "All" ||
        order.order_status?.toLowerCase() === activeTab.toLowerCase();

      // 3. Date Range Filter
      let matchesDate = true;
      if (dateRange.days !== null) {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange.days === 0) {
          // Today: Check if it's the same calendar day
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else {
          // Last X days
          matchesDate = diffDays <= dateRange.days;
        }
      }

      // 4. More Filters (Payment & Fulfillment statuses from menu)
      let matchesStatusFilters = true;
      if (statusFilters.length > 0) {
        const pStatus = (order.latest_payment?.payment_status || order.payment_status || "").toLowerCase();
        const fStatus = (order.order_status || "").toLowerCase();

        matchesStatusFilters = statusFilters.some((filter) => {
          const f = filter.toLowerCase();
          return pStatus === f || fStatus === f || (f === "fulfilled" && fStatus === "completed");
        });
      }

      return matchesSearch && matchesTab && matchesDate && matchesStatusFilters;
    });
  }, [orders, searchTerm, activeTab, dateRange, statusFilters]);

  const paginatedOrders = filteredOrders;

  // Reset page when filters change
  useEffect(
    () => setCurrentPage(1),
    [searchTerm, activeTab, dateRange, statusFilters],
  );

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      // Initial Load
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4",
      );
    },
    { scope: containerRef },
  );

  // Row Transitions
  useGSAP(() => {
    if (tableRef.current) {
      gsap.fromTo(
        ".order-row",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.02,
          ease: "expo.out",
          clearProps: "all",
        },
      );
    }
  }, [paginatedOrders]);

  // Drawer Animation
  useGSAP(() => {
    if (selectedOrder && drawerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.fromTo(
        drawerRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power4.out" },
      );
    }
  }, [selectedOrder]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    setShowActionsMenu(false);
    const tl = gsap.timeline({ onComplete: () => setSelectedOrder(null) });
    tl.to(drawerRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
    }).to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  const handleDateSelect = (label, days) => {
    setDateRange({ label, days });
    setShowDateMenu(false);
  };

  const toggleStatusFilter = (status) => {
    if (statusFilters.includes(status)) {
      setStatusFilters(statusFilters.filter((s) => s !== status));
    } else {
      setStatusFilters([...statusFilters, status]);
    }
  };

  const performDrawerAction = (action) => {
    setShowActionsMenu(false);
    if (action === "Cancel Order") {
      setShowCancellationModal(true);
    } else if (action === "Print Packing Slip") {
      printPackingSlip();
    } else {
      toast.info(`${action} initiated for ${selectedOrder?.order_number}`);
    }
  };

  const printPackingSlip = () => {
    const order = orderDetails || selectedOrder;
    if (!order) return;
    const isThermal = printSize === "thermal";
    const isA5 = printSize === "a5";
    const pageSize = isThermal ? "80mm auto" : isA5 ? "A5" : "A4";
    const qrValue = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${order.order_number}`;
    const qrSize = isThermal ? 80 : isA5 ? 80 : 96;
    const itemsHtml = (order.items || []).map((item) => `
      <tr>
        <td style="padding:8px 4px;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:700">${item.product_name}</div>
          <div style="font-size:10px;color:#94a3b8;font-style:italic">${item.variant_name}</div>
        </td>
        <td style="padding:8px 4px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;font-size:11px;color:#64748b">${item.sku}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">${item.quantity}</td>
      </tr>
    `).join("");
    const address = order.delivery_address || {};
    const addrHtml = [address.address_line_1, address.address_line_2, `${address.city || ""}, ${address.state || ""} ${address.postal_code || ""}`.trim(), address.country].filter(Boolean).join("<br/>");
    const totalQty = (order.items || []).reduce((a, i) => a + i.quantity, 0);
    const paymentStatus = order.order_status || "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Packing Slip - ${order.order_number}</title>
  <style>
    @page { size: ${pageSize}; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; background: white; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #1e293b; padding-bottom:12px; margin-bottom:12px; }
    .brand { font-size:22px; font-weight:900; color:#4f46e5; text-transform:uppercase; letter-spacing:-0.5px; }
    .brand-sub { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:3px; margin-top:2px; }
    .slip-title { text-align:right; }
    .slip-title h2 { font-size:18px; font-weight:700; text-transform:uppercase; }
    .slip-title .order-num { font-family:monospace; font-size:13px; margin-top:4px; color:#475569; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:16px; }
    .section-label { font-size:9px; font-weight:900; text-transform:uppercase; color:#94a3b8; margin-bottom:6px; letter-spacing:1px; }
    .address-name { font-weight:700; font-size:14px; margin-bottom:4px; }
    .address-detail { color:#475569; line-height:1.6; }
    .meta { display:flex; justify-content:space-between; padding:4px 0; }
    .meta-label { color:#64748b; }
    .badge { font-weight:700; font-size:9px; border:1px solid #1e293b; border-radius:4px; padding:1px 5px; text-transform:uppercase; display:inline-block; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    thead tr { border-top:2px solid #1e293b; border-bottom:2px solid #1e293b; background:#f8fafc; }
    thead th { padding:6px 4px; font-size:9px; font-weight:900; text-transform:uppercase; color:#475569; }
    thead th:first-child { text-align:left; }
    thead th:last-child { text-align:right; }
    thead th:nth-child(2) { text-align:center; }
    .footer { display:flex; justify-content:space-between; align-items:flex-end; border-top:2px solid #1e293b; padding-top:12px; }
    .footer-note { font-size:9px; color:#94a3b8; max-width:60%; line-height:1.5; font-style:italic; }
    .qr-cell { text-align:center; }
    .qr-label { font-family:monospace; font-size:8px; color:#94a3b8; margin-top:4px; }
    ${isThermal ? ".header,.grid,.footer{flex-direction:column;} .slip-title{text-align:left;margin-top:12px;} .grid{grid-template-columns:1fr;} .footer-note{max-width:100%;} .qr-cell{margin-bottom:12px;}" : ""}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">IGEN MOBILES</div>
      <div class="brand-sub">Premium Tech Solutions</div>
    </div>
    <div class="slip-title">
      <h2>Packing Slip</h2>
      <div class="order-num">#${order.order_number}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="section-label">📦 Ship To</div>
      <div class="address-name">${address.full_name || order.user?.name || ""}</div>
      <div class="address-detail">${addrHtml}</div>
      <div style="margin-top:6px;font-family:monospace;font-size:11px;">📞 ${address.phone || order.customer?.phone || ""}</div>
    </div>
    <div>
      <div class="section-label">🗒 Order Details</div>
      <div class="meta"><span class="meta-label">Date:</span><strong>${new Date(order.created_at).toLocaleDateString()}</strong></div>
      <div class="meta"><span class="meta-label">Items:</span><strong>${totalQty} Units</strong></div>
      <div class="meta"><span class="meta-label">Status:</span><span class="badge">${paymentStatus}</span></div>
      ${order.payments?.[0] ? `<div class="meta"><span class="meta-label">Payment:</span><strong>${(order.payments[0].payment_method || "").replace(/_/g, " ")}</strong></div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>SKU</th><th style="text-align:right">Qty</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="footer">
    <p class="footer-note">Thank you for choosing IGEN MOBILES. Please inspect items upon receipt. Returns must be initiated within 7 days in original packaging.</p>
    <div class="qr-cell">
      <canvas id="qrCanvas"></canvas>
      <div class="qr-label">${order.order_number}</div>
    </div>
  </div>

  <script>
    QRCode.toCanvas(document.getElementById('qrCanvas'), '${qrValue}', { width: ${qrSize}, margin: 0 }, function(err){});
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleVerifyPayment = async (orderId) => {
    try {
      if (!session?.accessToken) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${orderId}/verify`,
        session.accessToken,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: "Payment verified manually by admin.",
          }),
        },
      );

      toast.success("Payment verified successfully");
      mutate(); // Refresh the list
      // Mutate the sidebar count specifically
      globalMutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?order_status=pending&per_page=1`, session?.accessToken]);
      router.refresh(); // Refresh overall layout (sidebar)

      // Update local state for immediate feedback
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          latest_payment: {
            ...(prev.latest_payment || {}),
            payment_status: "completed"
          }
        }));
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify payment");
    }
  };

  const handleUpdateOrderStatus = async (status, data = {}) => {
    try {
      setIsSubmitting(true);
      if (!session?.accessToken) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${selectedOrder.id}/order-status`,
        session.accessToken,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_status: status,
            ...data,
          }),
        },
      );

      toast.success(
        status === "shipped"
          ? "Order marked as shipped"
          : "Order cancelled successfully",
      );
      mutate(); // Refresh the list
      // Mutate the sidebar count specifically
      globalMutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?order_status=pending&per_page=1`, session?.accessToken]);
      router.refresh(); // Refresh overall layout (sidebar)
      setShowShipmentModal(false);
      setShowCancellationModal(false);

      // Update local state for immediate feedback
      if (selectedOrder) {
        setSelectedOrder((prev) => ({
          ...prev,
          order_status: status,
        }));
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || `Failed to update order to ${status}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const orders = ordersResponse?.data?.data || ordersResponse?.data || [];
    const headerMap = {
      order_number: "Order #",
      "user.name": "Customer",
      total_amount: "Amount",
      order_status: "Status",
      created_at: "Date",
      "latest_payment.payment_status": "Payment",
    };
    exportToCSV(orders, "Orders", headerMap);
  };

  // --- HELPERS ---
  const getPaymentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "pending":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
      case "refunded":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200";
    }
  };

  const getFulfillmentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "fulfilled":
      case "completed":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";
      case "shipped":
        return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50";
      case "processing":
        return "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50";
      case "unfulfilled":
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50";
      case "returned":
      case "cancelled":
        return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200";
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-x-hidden relative px-8 py-6 space-y-6"
      onClick={() => {
        // Global click to close menus if open (simple implementation)
        if (showDateMenu) setShowDateMenu(false);
        if (showFilterMenu) setShowFilterMenu(false);
      }}
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-header">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage and fulfill your store orders.
          </p>
        </div>
        <div className="animate-header flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>

        </div>
      </div>

      {/* 2. ADVANCED FILTERS TOOLBAR */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-3">
          {/* Tab Filters */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto scrollbar-hide">
            {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* DATE FILTER DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateMenu(!showDateMenu);
                  setShowFilterMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold transition-colors ${showDateMenu ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateRange.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${showDateMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showDateMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                  {[
                    { label: "All Time", days: null },
                    { label: "Today", days: 0 },
                    { label: "Last 7 Days", days: 7 },
                    { label: "Last 30 Days", days: 30 },
                    { label: "Last 90 Days", days: 90 },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateSelect(item.label, item.days);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${dateRange.label === item.label ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      {item.label}
                      {dateRange.label === item.label && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MORE FILTERS DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterMenu(!showFilterMenu);
                  setShowDateMenu(false);
                }}
                className={`p-2 border rounded-lg transition-all ${showFilterMenu ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600"}`}
              >
                <div className="relative">
                  <Filter className="w-4 h-4" />
                  {statusFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full border border-white"></span>
                  )}
                </div>
              </button>

              {showFilterMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Payment Status
                  </h4>
                  <div className="space-y-1 mb-3">
                    {["Paid", "Pending", "Refunded", "Failed"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={statusFilters.includes(status)}
                          onChange={() => toggleStatusFilter(status)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{status}</span>
                      </label>
                    ))}
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Fulfillment
                  </h4>
                  <div className="space-y-1">
                    {["Fulfilled", "Unfulfilled", "Shipped"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={statusFilters.includes(status)}
                          onChange={() => toggleStatusFilter(status)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDERS TABLE */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] z-10 relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse" ref={tableRef}>
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 pl-6">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payment
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fulfillment
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                      <p className="text-sm font-medium">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="order-row hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer group"
                  >
                    <td
                      className="p-4 pl-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white text-sm">
                      #{order.order_number}
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                          <img
                            src={getAvatarUrl(order.user)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {order.user?.name || "Unknown Customer"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white">
                      LKR {parseFloat(order.total_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const method = (order.latest_payment?.payment_method || order.payments?.[0]?.payment_method || "").toLowerCase();
                          if (method.includes("bank")) return <Landmark className="w-3.5 h-3.5 text-blue-500" />;
                          if (method.includes("cash") || method.includes("cod")) return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
                          return <CardIcon className="w-3.5 h-3.5 text-indigo-500" />;
                        })()}
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                          {(order.latest_payment?.payment_method || order.payments?.[0]?.payment_method || "N/A").replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPaymentColor(order.latest_payment?.payment_status)}`}
                      >
                        {order.latest_payment?.payment_status || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getFulfillmentColor(order.order_status)}`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        No orders found matching your filters.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setActiveTab("All");
                          setDateRange({ label: "All Time", days: null });
                          setStatusFilters([]);
                        }}
                        className="mt-2 text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2">
              {filteredOrders.length > 0 ? (
                <>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredOrders.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredOrders.length}
                  </span>
                </>
              ) : (
                <span>0 results</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page Numbers */}
            {[...Array(Math.min(3, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- ORDER DETAILS DRAWER --- */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setShowActionsMenu(false)}
        >
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16 z-[101]">
            <div
              ref={drawerRef}
              className="w-screen max-w-5xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      #{selectedOrder.order_number}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getPaymentColor(selectedOrder.payment_status || selectedOrder.latest_payment?.payment_status)}`}
                    >
                      {selectedOrder.payment_status || selectedOrder.latest_payment?.payment_status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getFulfillmentColor(selectedOrder.order_status)}`}
                    >
                      {selectedOrder.order_status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(selectedOrder.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} via {selectedOrder.checkout_session_id ? "Online" : "Manual"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/30 custom-tiny-scrollbar">
                {/* CUSTOMER PROFILE CARD */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Customer
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={getAvatarUrl(selectedOrder.user)}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedOrder.user?.name || "Unknown"}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <MapPin className="w-3.5 h-3.5" /> {selectedOrder.customer?.city || "Unknown City"}
                      </div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Ph: {selectedOrder.customer?.phone || "N/A"}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Shipping
                    </h3>
                    <address className="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="block text-slate-900 dark:text-white font-bold">
                        {orderDetails?.delivery_address?.full_name || selectedOrder.user?.name}
                      </span>
                      {orderDetails?.delivery_address?.address_line_1}
                      <br />
                      {orderDetails?.delivery_address?.address_line_2}
                      <br />
                      {orderDetails?.delivery_address?.city}, {orderDetails?.delivery_address?.country}
                      {orderDetails?.delivery_address?.postal_code && (
                        <span className="block mt-1 text-xs opacity-75">
                          Postal: {orderDetails.delivery_address.postal_code}
                        </span>
                      )}
                    </address>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Payment
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                        <span className="font-medium dark:text-slate-200">
                          LKR {parseFloat(selectedOrder.subtotal).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                        <span className="font-medium dark:text-slate-200">
                          LKR {parseFloat(selectedOrder.shipping_fee).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                        <span className="font-bold text-slate-900 dark:text-white">Total</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          LKR {parseFloat(selectedOrder.total_amount).toLocaleString()}
                        </span>
                      </div>

                      {orderDetails?.payments?.[0] && (
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Details</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Method</span>
                            <span className="capitalize">{orderDetails.payments[0].payment_method.replace(/_/g, " ")}</span>
                          </div>
                          {orderDetails.payments[0].transaction_id && (
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-slate-500">Transaction ID</span>
                              <span className="font-mono">{orderDetails.payments[0].transaction_id}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ITEMS LIST */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 px-1">
                    Order Items
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isDetailsLoading ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400">Loading items...</p>
                      </div>
                    ) : orderDetails?.items?.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {orderDetails.items.map((item) => (
                          <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/${item.product?.primary_image_path}`}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.product_name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Variant: {item.variant_name} • SKU: {item.sku}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  LKR {parseFloat(item.unit_price).toLocaleString()} × {item.quantity}
                                </span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                  LKR {parseFloat(item.total_price).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400">
                        <p className="text-sm">No items found for this order.</p>
                      </div>
                    )}
                  </div>
                </div>

                {orderDetails?.cancellation_reason && (
                  <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50">
                    <h3 className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase mb-1">Cancellation Reason</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300">{orderDetails.cancellation_reason}</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer & MORE ACTIONS POPUP */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 relative">
                {/* More Actions — commented out
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(!showActionsMenu);
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    More Actions <ChevronDown className="w-3 h-3" />
                  </button>

                  {showActionsMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => performDrawerAction("Refund Items")}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium flex items-center gap-3"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Refund Items
                      </button>
                    </div>
                  )}
                </div>
                */}

                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setPrintSize("a4")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${printSize === "a4" ? "bg-white dark:bg-slate-600 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPrintSize("a5")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${printSize === "a5" ? "bg-white dark:bg-slate-600 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    A5
                  </button>
                  <button
                    onClick={() => setPrintSize("thermal")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${printSize === "thermal" ? "bg-white dark:bg-slate-600 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    80mm
                  </button>
                </div>

                <button
                  onClick={printPackingSlip}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Slip
                </button>

                {/* Conditional Action Buttons */}
                {(() => {
                  const paymentStatus = (selectedOrder.payment_status || selectedOrder.latest_payment?.payment_status)?.toLowerCase();
                  const isPaid = paymentStatus === "paid" || paymentStatus === "completed";
                  const isCancelled = selectedOrder.order_status?.toLowerCase() === "cancelled";
                  const isShipped = ["shipped", "delivered", "fulfilled", "completed"].includes(selectedOrder.order_status?.toLowerCase());

                  if (isCancelled) return null;

                  if (!isPaid) {
                    return (
                      <>
                        <button
                          onClick={() => setShowCancellationModal(true)}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Ban className="w-4 h-4" /> Cancel Order
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(selectedOrder.id)}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Verify Payment
                        </button>
                      </>
                    );
                  }

                  if (!isShipped) {
                    return (
                      <button
                        onClick={() => setShowShipmentModal(true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" /> Fulfill Order
                      </button>
                    );
                  }

                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SHIPMENT MODAL */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto custom-tiny-scrollbar">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowShipmentModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Fulfill Order #{selectedOrder?.order_number}
              </h3>
              <button
                onClick={() => setShowShipmentModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Courier Name
                  </label>
                  <input
                    type="text"
                    value={shippingData.courier_name}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        courier_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Prompt Express"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={shippingData.tracking_number}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        tracking_number: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="IGEN-LX-XXXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Courier Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingData.courier_phone}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        courier_phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="077XXXXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Est. Delivery (Optional)
                  </label>
                  <input
                    type="date"
                    value={shippingData.estimated_delivery_at}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        estimated_delivery_at: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Shipping Cost
                  </label>
                  <input
                    type="number"
                    value={shippingData.shipping_cost}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        shipping_cost: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. 1200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Shipping Notes (Optional)
                </label>
                <textarea
                  value={shippingData.shipping_notes}
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      shipping_notes: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Handle with care..."
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowShipmentModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateOrderStatus("shipped", {
                  ...shippingData,
                  shipping_cost: shippingData.shipping_cost ? Number(shippingData.shipping_cost) : 0
                })}
                disabled={
                  isSubmitting ||
                  !shippingData.courier_name ||
                  !shippingData.tracking_number
                }
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Mark as Shipped
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {showCancellationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto custom-tiny-scrollbar">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowCancellationModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/20">
              <h3 className="text-xl font-bold text-rose-900 dark:text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" /> Cancel Order
              </h3>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-full transition-colors text-rose-600"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to cancel order{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  #{selectedOrder?.order_number}
                </span>? This action cannot be undone.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-rose-500 transition-colors resize-none"
                  placeholder="e.g. Out of stock or customer requested"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowCancellationModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                disabled={isSubmitting}
              >
                Keep Order
              </button>
              <button
                onClick={() =>
                  handleUpdateOrderStatus("cancelled", {
                    cancellation_reason: cancellationReason,
                  })
                }
                disabled={isSubmitting || !cancellationReason}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA */}
      <div className="print:block hidden">
        {selectedOrder && (
          <PackingSlip order={orderDetails || selectedOrder} variant={printSize} />
        )}
      </div>
    </div>
  );
}
