"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {Search,
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
  Ban, ShoppingCart} from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { getImageUrl } from "../../../lib/utils";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PackingSlip from "../../components/PackingSlip";
import { exportToCSV } from "@/app/lib/exportUtils";


const getAvatarUrl = (user) => {
  if (user?.profile_image) {
    return getImageUrl(user.profile_image);
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=random&color=fff&bold=true`;
};

export default function InteractiveRenewalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const renewalIdParam = searchParams.get("renewal_id");
  const renewalNumberParam = searchParams.get("renewal_number");
  const { data: session } = useSession();
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const hasAutoOpened = useRef(false);

  // Auto-open renewal if renewal_id is in URL — only once on initial load
  useEffect(() => {
    if (renewalIdParam && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setSelectedRenewal({ id: renewalIdParam });
    }
  }, [renewalIdParam]);

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
  const { data: renewalsResponse, isLoading, mutate } = useSWR(
    session?.accessToken
      ? [
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?page=${currentPage}&per_page=${itemsPerPage}`,
        session?.accessToken,
      ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken),
    { revalidateOnFocus: false }
  );

  const { data: renewalDetailsResponse, isLoading: isDetailsLoading } = useSWR(
    session?.accessToken && selectedRenewal?.id
      ? [
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${selectedRenewal.id}`,
        session?.accessToken,
      ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken)
  );

  const renewalDetails = renewalDetailsResponse?.data || null;

  const renewals = useMemo(() => renewalsResponse?.data?.data || [], [renewalsResponse]);
  const totalItems = renewalsResponse?.data?.total || 0;
  const totalPages = renewalsResponse?.data?.last_page || 1;

  // Auto-open by renewal_number once renewals are loaded — only once
  useEffect(() => {
    if (renewalNumberParam && renewals.length > 0 && !hasAutoOpened.current) {
      const match = renewals.find(o => o.renewal_number === renewalNumberParam);
      if (match) {
        hasAutoOpened.current = true;
        setSelectedRenewal(match);
      }
    }
  }, [renewalNumberParam, renewals]);

  // --- FILTER LOGIC ---
  const filteredRenewals = useMemo(() => {
    return renewals.filter((renewal) => {
      // 1. Search filter (Renewal Number or Customer Name)
      const matchesSearch = searchTerm
        ? renewal.renewal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (renewal.user?.name || renewal.User?.name)?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // 2. Active Tab (Fulfillment Status)
      const matchesTab =
        activeTab === "All" ||
        renewal.renewal_status?.toLowerCase() === activeTab.toLowerCase();

      // 3. Date Range Filter
      let matchesDate = true;
      if (dateRange.days !== null) {
        const renewalDate = new Date(renewal.created_at || renewal.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - renewalDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange.days === 0) {
          // Today: Check if it's the same calendar day
          matchesDate = renewalDate.toDateString() === now.toDateString();
        } else {
          // Last X days
          matchesDate = diffDays <= dateRange.days;
        }
      }

      // 4. More Filters (Payment & Fulfillment statuses from menu)
      let matchesStatusFilters = true;
      if (statusFilters.length > 0) {
        const pStatus = (renewal.latest_payment?.payment_status || renewal.payment_status || "").toLowerCase();
        const fStatus = (renewal.renewal_status || "").toLowerCase();

        matchesStatusFilters = statusFilters.some((filter) => {
          const f = filter.toLowerCase();
          return pStatus === f || fStatus === f || (f === "fulfilled" && fStatus === "completed");
        });
      }

      return matchesSearch && matchesTab && matchesDate && matchesStatusFilters;
    });
  }, [renewals, searchTerm, activeTab, dateRange, statusFilters]);

  const paginatedRenewals = filteredRenewals;

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
        ".renewal-row",
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
  }, [paginatedRenewals]);

  // Drawer Animation
  useGSAP(() => {
    if (selectedRenewal && drawerRef.current) {
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
  }, [selectedRenewal]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    setShowActionsMenu(false);
    const tl = gsap.timeline({ onComplete: () => setSelectedRenewal(null) });
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
    if (action === "Cancel Renewal") {
      setShowCancellationModal(true);
    } else if (action === "Print Packing Slip") {
      printPackingSlip();
    } else {
      toast.info(`${action} initiated for ${selectedRenewal?.renewal_number}`);
    }
  };

  const printPackingSlip = () => {
    const renewal = renewalDetails || selectedRenewal;
    if (!renewal) return;
    const defaultShopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium";
    const isThermal = printSize === "thermal";
    const isA5 = printSize === "a5";
    const pageSize = isThermal ? "80mm auto" : isA5 ? "A5" : "A4";
    const qrValue = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${renewal.renewal_number}`;
    const qrSize = isThermal ? 72 : 88;

    const address = renewal.delivery_address || {};
    const recipientName = address.full_name || renewal.user?.name || renewal.User?.name || "Customer";
    const phone = address.phone || renewal.user?.phone || renewal.User?.phone || "";
    const addrLines = [
      address.address_line_1,
      address.address_line_2,
      [address.city, address.state].filter(Boolean).join(", "),
      address.postal_code,
      address.country,
    ].filter(Boolean);

    const renewalDate = (renewal.created_at || renewal.createdAt) ? new Date(renewal.created_at || renewal.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
    const paymentMethod = (renewal.payment_method || renewal.payments?.[0]?.payment_method || renewal.latest_payment?.payment_method || "N/A").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const paymentStatus = (renewal.payment_status || renewal.payments?.[0]?.payment_status || renewal.latest_payment?.payment_status || renewal.renewal_status || "Pending").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    const items = renewal.items || [];
    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const subtotal = items.reduce((s, i) => s + ((i.unit_price || i.price || 0) * (i.quantity || 0)), 0);
    const discount = parseFloat(renewal.discount_amount || 0);
    const shipping = parseFloat(renewal.shipping_cost || 0);
    const grandTotal = parseFloat(renewal.total_amount || subtotal - discount + shipping);

    const itemsHtml = items.map((item, idx) => `
      <tr class="${idx % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="td-main">
          <div class="item-name">${item.product_name || "Product"}</div>
          ${item.variant_name ? `<div class="item-variant">${item.variant_name}</div>` : ""}
          ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ""}
        </td>
        <td class="td-center">${item.quantity || 1}</td>
        <td class="td-right">Rs. ${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
        <td class="td-right td-bold">Rs. ${((item.unit_price || item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    const thermalOverride = isThermal ? `
      .page { padding: 6mm; }
      .header { flex-direction: column; align-items: flex-start; gap: 6px; }
      .brand-block, .renewal-block { width: 100%; }
      .renewal-block { text-align: left; brenewal-left: none; padding-left: 0; margin-top: 8px; padding-top: 8px; brenewal-top: 1px dashed #cbd5e1; }
      .info-grid { grid-template-columns: 1fr; gap: 10px; }
      .summary-row { font-size: 10px; }
      .summary-total { font-size: 12px; }
      .footer { flex-direction: column; gap: 12px; }
      .footer-note { max-width: 100%; }
      .qr-block { align-self: center; }
      td, th { font-size: 10px; padding: 5px 3px; }
    ` : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Packing Slip — ${renewal.renewal_number}</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @page { size: ${pageSize}; margin: 0; }
    * { box-sizing: brenewal-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }

    .page { padding: 10mm; max-width: 100%; }

    /* ── HEADER ── */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; margin-bottom: 12px; brenewal-bottom: 3px solid #000; }
    .brand-name { font-size: 24px; font-weight: 900; color: #000; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1; }
    .brand-tagline { font-size: 9px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
    .renewal-block { text-align: right; brenewal-left: 2px solid #000; padding-left: 14px; }
    .slip-label { font-size: 9px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 3px; }
    .renewal-number { font-size: 16px; font-weight: 800; color: #000; font-variant-numeric: tabular-nums; }
    .renewal-date { font-size: 10px; font-weight: 600; color: #000; margin-top: 3px; }

    /* ── INFO GRID ── */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .info-card { background: #fff; brenewal: 2px solid #000; brenewal-radius: 4px; padding: 12px; }
    .info-card-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #000; margin-bottom: 8px; brenewal-bottom: 1px solid #000; padding-bottom: 4px; }
    .recipient-name { font-size: 14px; font-weight: 800; color: #000; margin-bottom: 4px; }
    .address-line { font-size: 11px; font-weight: 600; color: #000; line-height: 1.7; }
    .phone-line { font-size: 11px; color: #000; margin-top: 5px; font-weight: 700; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; brenewal-bottom: 1px dashed #000; font-size: 11px; }
    .meta-row:last-child { brenewal-bottom: none; }
    .meta-key { font-weight: 700; color: #000; }
    .meta-val { font-weight: 700; color: #000; }
    .status-pill { display: inline-block; padding: 2px 8px; brenewal-radius: 2px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: #fff; color: #000; brenewal: 1.5px solid #000; }

    /* ── ITEMS TABLE ── */
    table { width: 100%; brenewal-collapse: collapse; margin-bottom: 16px; brenewal: 2px solid #000; }
    thead tr { background: #000; }
    thead th { padding: 8px 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; brenewal: 1px solid #000; }
    thead th:first-child { text-align: left; }
    .td-main { padding: 10px 8px; vertical-align: top; brenewal-bottom: 1px solid #000; brenewal-right: 1px solid #000; }
    .td-center { padding: 10px 8px; text-align: center; vertical-align: top; brenewal-bottom: 1px solid #000; brenewal-right: 1px solid #000; font-weight: 700; }
    .td-right { padding: 10px 8px; text-align: right; vertical-align: top; brenewal-bottom: 1px solid #000; brenewal-right: 1px solid #000; font-weight: 700; }
    .td-bold { font-weight: 800; }
    .row-even { background: #fff; }
    .row-odd { background: #fff; }
    .item-name { font-weight: 800; font-size: 12px; color: #000; }
    .item-variant { font-size: 10px; font-weight: 600; color: #000; margin-top: 2px; }
    .item-sku { font-size: 9px; font-weight: 600; color: #000; font-family: monospace; margin-top: 2px; }

    /* ── SUMMARY ── */
    .summary-block { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .summary-table { width: 250px; brenewal: 2px solid #000; brenewal-radius: 0px; background: #fff; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 11px; brenewal-bottom: 1px solid #000; }
    .summary-row:last-child { brenewal-bottom: none; }
    .summary-key { font-weight: 700; color: #000; }
    .summary-val { font-weight: 800; color: #000; }
    .summary-total { background: #000; color: #fff; display: flex; justify-content: space-between; padding: 8px 12px; font-size: 13px; font-weight: 900; brenewal-top: 2px solid #000; text-transform: uppercase; }

    /* ── FOOTER ── */
    .footer { display: flex; justify-content: space-between; align-items: flex-end; brenewal-top: 3px solid #000; padding-top: 12px; }
    .footer-note { font-size: 10px; font-weight: 600; color: #000; max-width: 60%; line-height: 1.6; }
    .footer-note strong { font-weight: 800; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; }
    .qr-block { text-align: center; }
    .qr-label { font-size: 8px; font-weight: 800; color: #000; margin-top: 4px; font-family: monospace; text-transform: uppercase; }

    ${thermalOverride}
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="brand-block">
      <div class="brand-name">${defaultShopName}</div>
      <div class="brand-tagline">Official Invoice & Packing Slip</div>
    </div>
    <div class="renewal-block">
      <div class="slip-label">Packing Slip</div>
      <div class="renewal-number">#${renewal.renewal_number}</div>
      <div class="renewal-date">${renewalDate}</div>
    </div>
  </div>

  <!-- INFO GRID -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-label">Ship To</div>
      <div class="recipient-name">${recipientName}</div>
      <div class="address-line">${addrLines.join("<br/>")}</div>
      ${phone ? `<div class="phone-line">&#9990; ${phone}</div>` : ""}
    </div>
    <div class="info-card">
      <div class="info-card-label">Renewal Info</div>
      <div class="meta-row"><span class="meta-key">Renewal #</span><span class="meta-val">${renewal.renewal_number}</span></div>
      <div class="meta-row"><span class="meta-key">Date</span><span class="meta-val">${renewalDate}</span></div>
      <div class="meta-row"><span class="meta-key">Items</span><span class="meta-val">${totalQty} unit${totalQty !== 1 ? "s" : ""}</span></div>
      <div class="meta-row"><span class="meta-key">Payment</span><span class="meta-val">${paymentMethod}</span></div>
      <div class="meta-row"><span class="meta-key">Status</span><span class="meta-val"><span class="status-pill">${paymentStatus}</span></span></div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary-block">
    <div class="summary-table">
      ${subtotal > 0 ? `<div class="summary-row"><span class="summary-key">Subtotal</span><span class="summary-val">Rs. ${subtotal.toLocaleString()}</span></div>` : ""}
      ${discount > 0 ? `<div class="summary-row"><span class="summary-key">Discount</span><span class="summary-val">− Rs. ${discount.toLocaleString()}</span></div>` : ""}
      ${shipping > 0 ? `<div class="summary-row"><span class="summary-key">Shipping</span><span class="summary-val">Rs. ${shipping.toLocaleString()}</span></div>` : ""}
      <div class="summary-total"><span>Grand Total</span><span>Rs. ${grandTotal.toLocaleString()}</span></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-note">
      <strong>Thank you for shopping with ${defaultShopName}!</strong>
      Please inspect your items upon receipt. Returns &amp; exchanges must be initiated within 7 days of delivery in original, undamaged packaging. Contact us at support@${defaultShopName.toLowerCase().replace(/\s+/g, '')}.com for any queries.
    </div>
    <div class="qr-block">
      <canvas id="qrCanvas"></canvas>
      <div class="qr-label">Scan to track renewal</div>
    </div>
  </div>

</div>
<script>
  QRCode.toCanvas(document.getElementById('qrCanvas'), '${qrValue}', { width: ${qrSize}, margin: 1 }, function(){});
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;


    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleVerifyPayment = async (renewalId) => {
    try {
      if (!session?.accessToken) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${renewalId}/verify`,
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
      globalMutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?renewal_status=pending&per_page=1`, session?.accessToken]);
      router.refresh(); // Refresh overall layout (sidebar)

      // Update local state for immediate feedback
      if (selectedRenewal?.id === renewalId) {
        setSelectedRenewal(prev => ({
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

  const handleUpdateRenewalStatus = async (status, data = {}) => {
    try {
      setIsSubmitting(true);
      if (!session?.accessToken) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      await globalFetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders/${selectedRenewal.id}/renewal-status`,
        session.accessToken,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            renewal_status: status,
            ...data,
          }),
        },
      );

      toast.success(
        status === "shipped"
          ? "Renewal marked as shipped"
          : "Renewal cancelled successfully",
      );
      mutate(); // Refresh the list
      // Mutate the sidebar count specifically
      globalMutate([`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?renewal_status=pending&per_page=1`, session?.accessToken]);
      router.refresh(); // Refresh overall layout (sidebar)
      setShowShipmentModal(false);
      setShowCancellationModal(false);

      // Update local state for immediate feedback
      if (selectedRenewal) {
        setSelectedRenewal((prev) => ({
          ...prev,
          renewal_status: status,
        }));
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || `Failed to update renewal to ${status}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const renewals = renewalsResponse?.data?.data || renewalsResponse?.data || [];
    const headerMap = {
      renewal_number: "Renewal #",
      "user.name": "Customer",
      total_amount: "Amount",
      renewal_status: "Status",
      created_at: "Date",
      "latest_payment.payment_status": "Payment",
    };
    exportToCSV(renewals, "Renewals", headerMap);
  };

  // --- HELPERS ---
  const getPaymentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 brenewal-emerald-200 dark:brenewal-emerald-800/50";
      case "pending":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 brenewal-amber-200 dark:brenewal-amber-800/50";
      case "refunded":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 brenewal-slate-200 dark:brenewal-slate-700";
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 brenewal-red-200 dark:brenewal-red-800/50";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 brenewal-gray-200";
    }
  };

  const getFulfillmentColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "fulfilled":
      case "completed":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 brenewal-blue-200 dark:brenewal-blue-800/50";
      case "shipped":
        return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 brenewal-indigo-200 dark:brenewal-indigo-800/50";
      case "processing":
        return "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 brenewal-sky-200 dark:brenewal-sky-800/50";
      case "unfulfilled":
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 brenewal-yellow-200 dark:brenewal-yellow-800/50";
      case "returned":
      case "cancelled":
        return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 brenewal-rose-200 dark:brenewal-rose-800/50";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 brenewal-slate-200";
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
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 brenewal brenewal-indigo-100 dark:brenewal-indigo-800/50 shadow-sm py-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Renewals</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage and fulfill your store renewals.</p>
            </div>
          </div>
        </div>
        <div className="animate-header flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>

        </div>
      </div>

      {/* 2. ADVANCED FILTERS TOOLBAR */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 rounded-2xl shadow-sm brenewal brenewal-slate-200 dark:brenewal-slate-700 p-1 relative z-20">
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
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-lg text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:brenewal-indigo-500 outline-none transition-colors"
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
                className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 brenewal rounded-lg text-xs font-bold transition-colors ${showDateMenu ? "brenewal-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30" : "brenewal-slate-200 dark:brenewal-slate-700 text-slate-600 dark:text-slate-300 hover:brenewal-indigo-300"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateRange.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${showDateMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showDateMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl brenewal brenewal-slate-100 dark:brenewal-slate-700 p-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
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
                className={`p-2 brenewal rounded-lg transition-all ${showFilterMenu ? "brenewal-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "brenewal-slate-200 dark:brenewal-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600"}`}
              >
                <div className="relative">
                  <Filter className="w-4 h-4" />
                  {statusFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full brenewal brenewal-white"></span>
                  )}
                </div>
              </button>

              {showFilterMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl brenewal brenewal-slate-100 dark:brenewal-slate-700 p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
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
                          className="rounded brenewal-slate-300 text-indigo-600 focus:ring-indigo-500"
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
                          className="rounded brenewal-slate-300 text-indigo-600 focus:ring-indigo-500"
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
      <div className="animate-toolbar bg-white dark:bg-slate-800 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] z-10 relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left brenewal-collapse" ref={tableRef}>
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 brenewal-b brenewal-slate-200 dark:brenewal-slate-700">
              <tr>
                <th className="p-4 pl-6">
                  <input
                    type="checkbox"
                    className="rounded brenewal-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Renewal
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
                      <p className="text-sm font-medium">Loading renewals...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedRenewals.length > 0 ? (
                paginatedRenewals.map((renewal) => (
                  <tr
                    key={renewal.id}
                    onClick={() => setSelectedRenewal(renewal)}
                    className="renewal-row hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer group"
                  >
                    <td
                      className="p-4 pl-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="rounded brenewal-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white text-sm">
                      #{renewal.renewal_number}
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(renewal.created_at || renewal.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                          <Image
                            src={getAvatarUrl(renewal.user || renewal.User)}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            alt="Customer Avatar"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {(renewal.user?.name || renewal.User?.name) || "Unknown Customer"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-900 dark:text-white">
                      LKR {parseFloat(renewal.total_amount).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const method = (renewal.payment_method || renewal.latest_payment?.payment_method || renewal.payments?.[0]?.payment_method || "").toLowerCase();
                          if (method.includes("bank")) return <Landmark className="w-3.5 h-3.5 text-blue-500" />;
                          if (method.includes("cash") || method.includes("cod")) return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
                          return <CardIcon className="w-3.5 h-3.5 text-indigo-500" />;
                        })()}
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                          {(renewal.payment_method || renewal.latest_payment?.payment_method || renewal.payments?.[0]?.payment_method || "N/A").replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold brenewal ${getPaymentColor(renewal.payment_status || renewal.latest_payment?.payment_status)}`}
                      >
                        {renewal.payment_status || renewal.latest_payment?.payment_status || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold brenewal ${getFulfillmentColor(renewal.renewal_status)}`}
                      >
                        {renewal.renewal_status}
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
                        No renewals found matching your filters.
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
        <div className="brenewal-t brenewal-slate-200 dark:brenewal-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-lg px-2 py-1 focus:brenewal-indigo-500 outline-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2">
              {filteredRenewals.length > 0 ? (
                <>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredRenewals.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {filteredRenewals.length}
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
              className="p-2 rounded-lg brenewal brenewal-slate-200 dark:brenewal-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page Numbers */}
            {[...Array(Math.min(3, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 brenewal brenewal-slate-200 dark:brenewal-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg brenewal brenewal-slate-200 dark:brenewal-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- ORDER DETAILS DRAWER --- */}
      {selectedRenewal && (
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
              className="w-screen max-w-5xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full brenewal-l brenewal-slate-100 dark:brenewal-slate-700"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 brenewal-b brenewal-slate-100 dark:brenewal-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      #{selectedRenewal.renewal_number}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold brenewal ${getPaymentColor(selectedRenewal.payment_status || selectedRenewal.latest_payment?.payment_status)}`}
                    >
                      {selectedRenewal.payment_status || selectedRenewal.latest_payment?.payment_status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold brenewal ${getFulfillmentColor(selectedRenewal.renewal_status)}`}
                    >
                      {selectedRenewal.renewal_status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(selectedRenewal.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} via {selectedRenewal.checkout_session_id ? "Online" : "Manual"}
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
                <div className="bg-white dark:bg-slate-800 rounded-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 shadow-sm p-5 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Customer
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <Image
                      src={getAvatarUrl(selectedRenewal.user || selectedRenewal.User)}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-2xl object-cover brenewal brenewal-slate-100 dark:brenewal-slate-700"
                      alt="Customer Avatar"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {(selectedRenewal.user?.name || selectedRenewal.User?.name) || "Unknown"}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <MapPin className="w-3.5 h-3.5" /> {selectedRenewal.customer?.city || selectedRenewal.shipping_address || "Unknown City"}
                      </div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Ph: {selectedRenewal.customer?.phone || selectedRenewal.shipping_phone || "N/A"}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Shipping
                    </h3>
                    <address className="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="block text-slate-900 dark:text-white font-bold">
                        {renewalDetails?.delivery_address?.full_name || selectedRenewal.user?.name || selectedRenewal.User?.name}
                      </span>
                      {renewalDetails?.delivery_address?.address_line_1}
                      <br />
                      {renewalDetails?.delivery_address?.address_line_2}
                      <br />
                      {renewalDetails?.delivery_address?.city}, {renewalDetails?.delivery_address?.country}
                      {renewalDetails?.delivery_address?.postal_code && (
                        <span className="block mt-1 text-xs opacity-75">
                          Postal: {renewalDetails.delivery_address.postal_code}
                        </span>
                      )}
                    </address>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Payment
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                        <span className="font-medium dark:text-slate-200">
                          LKR {parseFloat(selectedRenewal.subtotal).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                        <span className="font-medium dark:text-slate-200">
                          LKR {parseFloat(selectedRenewal.shipping_fee).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between brenewal-t brenewal-slate-100 dark:brenewal-slate-700 pt-2 mt-2">
                        <span className="font-bold text-slate-900 dark:text-white">Total</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          LKR {parseFloat(selectedRenewal.total_amount).toLocaleString()}
                        </span>
                      </div>

                      {(selectedRenewal?.payment_method || renewalDetails?.payments?.[0]) && (
                        <div className="mt-4 pt-4 brenewal-t brenewal-dashed brenewal-slate-100 dark:brenewal-slate-700">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Details</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Method</span>
                            <span className="capitalize">{(selectedRenewal?.payment_method || renewalDetails?.payments?.[0]?.payment_method || "").replace(/_/g, " ")}</span>
                          </div>
                          {(selectedRenewal?.transaction_id || renewalDetails?.payments?.[0]?.transaction_id) && (
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-slate-500">Transaction ID</span>
                              <span className="font-mono">{selectedRenewal?.transaction_id || renewalDetails?.payments?.[0]?.transaction_id}</span>
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
                    Renewal Items
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 overflow-hidden">
                    {isDetailsLoading ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400">Loading items...</p>
                      </div>
                    ) : renewalDetails?.items?.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {renewalDetails.items.map((item) => (
                          <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                              {(item.product?.primary_image_path || item.Product?.primary_image_path) ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/${(item.product?.primary_image_path || item.Product?.primary_image_path).replace(/^\/+/, "")}`}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                  alt="Product Image"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600">
                                  <Package className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.product_name || item.Product?.name || "Deleted Product (No longer exists)"}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Variant: {item.variant_name || item.ProductVariant?.variant_name || "N/A"} • SKU: {item.sku || item.ProductVariant?.sku || item.Product?.code || "N/A"}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  LKR {parseFloat(item.unit_price || item.price || 0).toLocaleString()} × {item.quantity}
                                </span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                  LKR {parseFloat(item.total_price || ((item.unit_price || item.price || 0) * (item.quantity || 1))).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-slate-400">
                        <p className="text-sm">No items found for this renewal.</p>
                      </div>
                    )}
                  </div>
                </div>

                {renewalDetails?.cancellation_reason && (
                  <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 brenewal brenewal-rose-100 dark:brenewal-rose-800/50">
                    <h3 className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase mb-1">Cancellation Reason</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300">{renewalDetails.cancellation_reason}</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer & MORE ACTIONS POPUP */}
              <div className="p-5 brenewal-t brenewal-slate-100 dark:brenewal-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 relative">
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
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl brenewal brenewal-slate-100 dark:brenewal-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
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
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 brenewal brenewal-slate-200 dark:brenewal-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Slip
                </button>

                {/* Conditional Action Buttons */}
                {(() => {
                  const paymentStatus = (selectedRenewal.payment_status || selectedRenewal.latest_payment?.payment_status)?.toLowerCase();
                  const isPaid = paymentStatus === "paid" || paymentStatus === "completed";
                  const isCancelled = selectedRenewal.renewal_status?.toLowerCase() === "cancelled";
                  const isShipped = ["shipped", "delivered", "fulfilled", "completed"].includes(selectedRenewal.renewal_status?.toLowerCase());

                  if (isCancelled) return null;

                  if (!isPaid) {
                    return (
                      <>
                        <button
                          onClick={() => setShowCancellationModal(true)}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 brenewal brenewal-red-200 dark:brenewal-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Ban className="w-4 h-4" /> Cancel Renewal
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(selectedRenewal.id)}
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
                        <Package className="w-4 h-4" /> Fulfill Renewal
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
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 brenewal-b brenewal-slate-100 dark:brenewal-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Fulfill Renewal #{selectedRenewal?.renewal_number}
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
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors"
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
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors"
                    placeholder="FE-LX-XXXXXX"
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
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors"
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
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors"
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
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors"
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
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-indigo-500 transition-colors resize-none"
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
                onClick={() => handleUpdateRenewalStatus("shipped", {
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
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl brenewal brenewal-slate-200 dark:brenewal-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 brenewal-b brenewal-slate-100 dark:brenewal-slate-700 flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/20">
              <h3 className="text-xl font-bold text-rose-900 dark:text-rose-400 flex items-center gap-2">
                <Ban className="w-5 h-5" /> Cancel Renewal
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
                Are you sure you want to cancel renewal{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  #{selectedRenewal?.renewal_number}
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
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 brenewal brenewal-slate-200 dark:brenewal-slate-700 rounded-xl text-sm outline-none focus:brenewal-rose-500 transition-colors resize-none"
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
                Keep Renewal
              </button>
              <button
                onClick={() =>
                  handleUpdateRenewalStatus("cancelled", {
                    cancellation_reason: cancellationReason,
                  })
                }
                disabled={isSubmitting || !cancellationReason}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel Renewal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA */}
      <div className="print:block hidden">
        {selectedRenewal && (
          <PackingSlip renewal={renewalDetails || selectedRenewal} variant={printSize} />
        )}
      </div>
    </div>
  );
}
