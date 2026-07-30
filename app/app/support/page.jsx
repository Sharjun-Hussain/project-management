"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { fetcher as globalFetcher } from "../../../lib/fetcher";
import { toast } from "sonner";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  MessageCircle,
  Send,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  Reply,
  Check,
  Download,
} from "lucide-react";
import { exportToCSV } from "@/app/lib/exportUtils";

export default function SupportTicketsPage() {
  const { data: session } = useSession();
  const containerRef = useRef(null);

  // --- STATE ---
  const [support, setSupportTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // --- FILTER STATES ---
  const [activeTab, setActiveTab] = useState("All"); // All, Pending, Replied

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // --- REFS ---
  const tableRef = useRef(null);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // --- DATA FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data.data;
  };

  const params = {
    page: currentPage,
    per_page: itemsPerPage,
  };
  if (searchTerm) params.search = searchTerm;
  if (activeTab !== "All") params.status = activeTab.toLowerCase();

  const queryParams = new URLSearchParams(params).toString();

  const { data: swrData, error: swrError, isLoading: swrLoading, mutate } = useSWR(
    session?.accessToken
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/contacts?${queryParams}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    if (swrData) {
      setSupportTickets(swrData.data || []);
      setCurrentPage(swrData.current_page || 1);
      setLastPage(swrData.last_page || 1);
      setTotalPages(swrData.total || 0);
      setLoading(false);
    }
    if (swrError) {
      toast.error(swrError.message || "Failed to fetch support");
      setLoading(false);
    }
    if (swrLoading) {
      setLoading(true);
    }
  }, [swrData, swrError, swrLoading]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, itemsPerPage]);

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }
      );
      tl.fromTo(
        ".animate-stat",
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05 },
        "-=0.6"
      );
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      );
    },
    { scope: containerRef }
  );

  useGSAP(() => {
    if (tableRef.current && !loading) {
      gsap.fromTo(
        ".support_ticket-row",
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.02,
          ease: "expo.out",
          clearProps: "all",
        }
      );
    }
  }, [support, loading]);

  useGSAP(() => {
    if (selectedSupportTicket && drawerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        drawerRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power4.out" }
      );
    }
  }, [selectedSupportTicket]);

  // --- HANDLERS ---
  const handleCloseDrawer = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setSelectedSupportTicket(null);
        setReplyMessage("");
      }
    });
    tl.to(drawerRef.current, {
      x: "100%",
      duration: 0.3,
      ease: "power3.in",
    }).to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setIsSendingReply(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/contacts/${selectedSupportTicket.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ reply_message: replyMessage }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        toast.success("Reply sent successfully");
        mutate(); // Refresh the list
        handleCloseDrawer();
      } else {
        toast.error(result.message || "Failed to send reply");
      }
    } catch (error) {
      toast.error("An error occurred while sending the reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleExport = () => {
    const headerMap = {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      status: "Status",
      created_at: "Date",
    };
    exportToCSV(support, "Support Tickets", headerMap);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
      case "replied":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "seen":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans px-8 py-6 text-slate-900 dark:text-white overflow-x-hidden relative"
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="animate-header">
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Support Tickets</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage and reply to customer support_tickets professionally.</p>
            </div>
          </div>
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

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Total Support Tickets",
            val: totalPages.toString(),
            icon: MessageCircle,
            color: "text-indigo-600",
          },
          {
            label: "Pending Replies",
            val: support.filter(c => c.status === "pending" || c.status === "seen").length.toString(),
            icon: Clock,
            color: "text-amber-600",
          },
          {
            label: "Replied",
            val: support.filter(c => c.status === "replied").length.toString(),
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="animate-stat bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${stat.color}`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TOOLBAR */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 mb-6 relative z-20">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-3">
          {/* Tab Filters */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto scrollbar-hide">
            {["All", "Pending", "Replied"].map((tab) => (
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
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONTACT TABLE */}
      <div className="animate-toolbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Loading messages...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" ref={tableRef}>
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 pl-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Received At
                  </th>
                  <th className="p-4 pr-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {support.length > 0 ? (
                  support.map((support_ticket) => (
                    <tr
                      key={support_ticket.id}
                      onClick={() => setSelectedSupportTicket(support_ticket)}
                      className="support_ticket-row hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                              {support_ticket.name}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {support_ticket.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {support_ticket.subject}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${getStatusColor(support_ticket.status)}`}
                        >
                          {support_ticket.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(support_ticket.created_at)}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                    >
                      No messages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. PAGINATION FOOTER */}
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
              <option value={15}>15</option>
              <option value={50}>50</option>
            </select>
            <span className="hidden sm:inline ml-2">
              {support.length > 0 ? (
                <>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentPage * itemsPerPage,
                      totalPages,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalPages}
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
            <button
              onClick={() => setCurrentPage(Math.min(lastPage, currentPage + 1))}
              disabled={currentPage === lastPage || lastPage === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- DETAILS DRAWER --- */}
      {selectedSupportTicket && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDrawer}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16">
            <div
              ref={drawerRef}
              className="w-screen max-w-xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Message Details</h2>
                    <p className="text-xs text-slate-500 tracking-tight">Received {formatDate(selectedSupportTicket.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Support Ticket Info */}
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">From</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedSupportTicket.name}</p>
                      <p className="text-xs text-slate-500">{selectedSupportTicket.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusColor(selectedSupportTicket.status)}`}>
                        {selectedSupportTicket.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Subject</h3>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                    {selectedSupportTicket.subject}
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Message</h3>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm italic text-sm">
                    {selectedSupportTicket.message || "No message content."}
                  </div>
                </div>

                {/* Reply Section */}
                {selectedSupportTicket.is_replied ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Reply</h3>
                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {selectedSupportTicket.replied_by?.name?.[0] || 'A'}
                        </div>
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          {selectedSupportTicket.replied_by?.name || "Admin"}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {formatDate(selectedSupportTicket.replied_at)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {selectedSupportTicket.reply_message}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Send a Professional Reply</h3>
                    <div className="relative group">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        className="w-full h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm group-hover:border-indigo-300"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-medium">
                        Professional CRM Reply Mode
                      </div>
                    </div>
                    <button
                      onClick={handleReplySubmit}
                      disabled={isSendingReply || !replyMessage.trim()}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                    >
                      {isSendingReply ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSendingReply ? "Sending..." : "Send Reply"}</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400">
                      Customer will receive this reply via email immediately.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
