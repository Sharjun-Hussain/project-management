"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";
import {
  Search, Plus, Edit3, Trash2, X, Loader2, Users, User,
  Building, Mail, Phone, MapPin, Briefcase, Star, ChevronDown,
  MoreHorizontal, Filter, SlidersHorizontal, ArrowUpDown,
  CheckCircle2, CircleDashed, AlertCircle, Download,
} from "lucide-react";

const COLLECTION = "clients";

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGE_CONFIG = {
  Lead:    { color: "text-amber-600",   bg: "bg-amber-50   dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-700",  dot: "bg-amber-400"   },
  Active:  { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-700", dot: "bg-emerald-400" },
  Churned: { color: "text-slate-500",   bg: "bg-slate-100  dark:bg-slate-800",     border: "border-slate-200 dark:border-slate-600",  dot: "bg-slate-400"   },
};

const AVATAR_COLORS = [
  ["from-blue-500","to-indigo-600"],
  ["from-violet-500","to-purple-600"],
  ["from-emerald-500","to-teal-600"],
  ["from-orange-400","to-amber-500"],
  ["from-pink-500","to-rose-600"],
  ["from-cyan-400","to-blue-500"],
];
const avatarColor = (name = "") => {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const EMPTY_FORM = { company_name:"", contact_person:"", email:"", phone:"", address:"", industry:"", status:"Lead" };

// ─── Star Button ─────────────────────────────────────────────────────────────
const StarBtn = ({ starred, onToggle }) => (
  <button onClick={onToggle}
    className={`p-1.5 rounded-md transition-colors ${starred ? "text-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-amber-400"}`}>
    <Star className="w-3.5 h-3.5" fill={starred ? "currentColor" : "none"} />
  </button>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STAGE_CONFIG[status] || STAGE_CONFIG.Lead;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "sm" }) => {
  const [from, to] = avatarColor(name);
  const sz = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return (
    <div className={`${sz} rounded-lg bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-black shrink-0 shadow-sm`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
};

// ─── Form Field ───────────────────────────────────────────────────────────────
const FormField = ({ label, icon: Icon, required, isTextArea, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 ${isTextArea ? "top-2.5" : "top-1/2 -translate-y-1/2"} w-4 h-4 text-slate-400 pointer-events-none`} />}
      {children}
    </div>
  </div>
);

const inputCls = (hasIcon = true) =>
  `w-full ${hasIcon ? "pl-9" : "pl-3"} pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 transition-all dark:text-white placeholder:text-slate-400`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const headerRef = useRef(null);
  const tableRef  = useRef(null);
  const drawerRef = useRef(null);
  const overlayRef= useRef(null);

  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterStage,setFilterStage]= useState("All");
  const [starred,    setStarred]    = useState({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formMode,   setFormMode]   = useState("create");
  const [editId,     setEditId]     = useState(null);
  const [formData,   setFormData]   = useState({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStage]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, COLLECTION), orderBy("created_at","desc"));
      const snap = await getDocs(q);
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error("Failed to load: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  // ── Animations ───────────────────────────────────────────────────────────
  useGSAP(() => {
    gsap.fromTo(headerRef.current, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power4.out" });
  });

  useGSAP(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(tableRef.current.querySelectorAll(".row-anim"),
        { x: -12, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power3.out" }
      );
    }
  }, [loading, clients.length]);

  // ── Drawer helpers ────────────────────────────────────────────────────────
  const openDrawer = (mode, client = null) => {
    setFormMode(mode);
    setEditId(client?.id || null);
    setFormData(client ? {
      company_name:   client.company_name   || "",
      contact_person: client.contact_person || "",
      email:          client.email          || "",
      phone:          client.phone          || "",
      address:        client.address        || "",
      industry:       client.industry       || "",
      status:         client.status         || "Lead",
    } : { ...EMPTY_FORM });
    setDrawerOpen(true);
  };

  useGSAP(() => {
    if (drawerOpen && drawerRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(drawerRef.current,  { x: "100%" }, { x: "0%", duration: 0.4, ease: "power4.out" });
    }
  }, [drawerOpen]);

  const closeDrawer = () => {
    if (!drawerRef.current) { setDrawerOpen(false); return; }
    gsap.to(drawerRef.current,  { x: "100%", duration: 0.3, ease: "power3.in", onComplete: () => setDrawerOpen(false) });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return toast.error("Company name is required.");
    setSaving(true);
    try {
      const payload = { ...formData, updated_at: new Date().toISOString() };
      if (formMode === "create") {
        await addDoc(collection(db, COLLECTION), { ...payload, created_at: new Date().toISOString() });
        toast.success("Client added!");
      } else {
        await updateDoc(doc(db, COLLECTION, editId), payload);
        toast.success("Client updated!");
      }
      closeDrawer();
      await loadClients();
    } catch (e) {
      toast.error("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (client) => {
    if (!confirm(`Delete "${client.company_name}"?`)) return;
    try {
      await deleteDoc(doc(db, COLLECTION, client.id));
      toast.success("Deleted.");
      setClients((p) => p.filter((c) => c.id !== client.id));
    } catch (e) {
      toast.error("Error: " + e.message);
    }
  };

  // ── Filter & search ───────────────────────────────────────────────────────
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.company_name?.toLowerCase().includes(q) ||
      c.contact_person?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchStage = filterStage === "All" || c.status === filterStage;
    return matchSearch && matchStage;
  });

  const stages = ["All", "Lead", "Active", "Churned"];
  const counts = stages.reduce((acc, s) => {
    acc[s] = s === "All" ? clients.length : clients.filter((c) => c.status === s).length;
    return acc;
  }, {});

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const field = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F1117] font-sans pb-20">

      {/* ── Top Bar ── */}
      <div ref={headerRef} className="bg-white dark:bg-[#161B27] border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm h-20">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-[#2C79F5]/10 flex items-center justify-center border border-[#2C79F5]/20">
            <Users className="w-5 h-5 text-[#2C79F5]" />
          </div>
          <div>
            <h1 className="text-[22px] tracking-tight font-extrabold text-slate-900 dark:text-white leading-none mb-1">
              Client Directory
            </h1>
            <p className="text-[12px] font-medium text-slate-400">
              Manage agencies, customers, and partners
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="pl-9 pr-4 py-2.5 text-[13px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#2C79F5] focus:ring-1 focus:ring-[#2C79F5]/50 dark:text-white w-64 transition-all"
            />
          </div>
          <button
            onClick={() => openDrawer("create")}
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-extrabold text-white bg-[#2C79F5] hover:bg-[#1a6ae0] rounded-xl shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-8 px-8 space-y-6">
        {/* ── Pipeline stage tabs ── */}
        <div className="flex gap-2">
          {stages.map((s) => {
            const cfg = STAGE_CONFIG[s] || {};
            return (
              <button
                key={s}
                onClick={() => setFilterStage(s)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all border ${
                  filterStage === s
                    ? "bg-white dark:bg-[#161B27] border-slate-300 dark:border-slate-600 shadow-sm text-slate-900 dark:text-white"
                    : "bg-slate-50/50 dark:bg-[#0F1117] border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                {s !== "All" && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                {s}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filterStage === s ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "bg-slate-200/50 dark:bg-slate-800/30 text-slate-400"}`}>
                  {counts[s]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Table ── */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-32 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2C79F5]" />
              <span className="text-slate-500 font-medium text-sm">Loading clients…</span>
            </div>
          ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-bold text-slate-600 dark:text-slate-400">
              {search || filterStage !== "All" ? "No matching clients" : "No clients yet"}
            </h3>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              {search || filterStage !== "All" ? "Try a different filter or search term." : "Add your first client to get started."}
            </p>
            {(!search && filterStage === "All") && (
              <button onClick={() => openDrawer("create")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C79F5] text-white rounded-xl font-bold text-[13px] shadow hover:bg-[#1a6ae0] transition-all">
                <Plus className="w-4 h-4" /> Add First Client
              </button>
            )}
          </div>
          ) : (
            <div className="bg-white dark:bg-[#161B27] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-5 pl-8 text-xs font-bold text-slate-500 uppercase w-[5%]"></th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase w-[30%]">Company</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase w-[25%]">Contact</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase w-[15%]">Industry</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase w-[15%]">Stage</th>
                    <th className="p-5 pr-8 w-[10%]"></th>
                  </tr>
                </thead>
                <tbody ref={tableRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.map((client) => (
                    <tr key={client.id} className="row-anim group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-100 cursor-pointer">
                      <td className="p-4 pl-8">
                        <StarBtn
                          starred={!!starred[client.id]}
                          onToggle={() => setStarred((p) => ({ ...p, [client.id]: !p[client.id] }))}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={client.company_name} />
                          <div className="min-w-0">
                            <div className="font-bold text-[14px] text-slate-900 dark:text-white truncate">
                              {client.company_name}
                            </div>
                            {client.address && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{client.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                            {client.contact_person || <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </div>
                          {(client.email || client.phone) && (
                            <div className="text-[11px] font-medium text-slate-400 mt-0.5 space-y-0.5">
                              {client.email && <div>{client.email}</div>}
                              {client.phone && <div>{client.phone}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          {client.industry ? (
                            <><Briefcase className="w-3.5 h-3.5 text-slate-400"/> {client.industry}</>
                          ) : "—"}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={client.status || "Lead"} />
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDrawer("edit", client)}
                            className="p-2 rounded-lg text-slate-400 hover:text-[#2C79F5] hover:bg-[#2C79F5]/10 font-bold text-[13px] transition-colors"
                          >
                            <Edit3 className="w-4 h-4"/>
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-[13px] transition-colors"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Pagination */}
              {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                <span className="text-[12px] text-slate-500 font-bold">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} clients
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Side Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div ref={overlayRef} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={closeDrawer}/>
          <div ref={drawerRef} className="relative w-full max-w-md bg-white dark:bg-[#161B27] shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {formMode === "create" ? "Add new client" : "Edit client"}
                </h2>
              </div>
              <button onClick={closeDrawer} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Stage selector strip */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex gap-2">
              {Object.entries(STAGE_CONFIG).map(([s, cfg]) => (
                <button
                  key={s}
                  onClick={() => field("status", s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                    formData.status === s
                      ? `${cfg.color} ${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-current/30`
                      : "text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{s}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-tiny-scrollbar">
              <FormField label="Company / Entity Name" icon={Building} required>
                <input
                  required value={formData.company_name} onChange={(e) => field("company_name", e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Contact Person" icon={User}>
                <input
                  value={formData.contact_person} onChange={(e) => field("contact_person", e.target.value)}
                  placeholder="Full name"
                  className={inputCls()}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email" icon={Mail}>
                  <input
                    type="email" value={formData.email} onChange={(e) => field("email", e.target.value)}
                    placeholder="email@company.com"
                    className={inputCls()}
                  />
                </FormField>
                <FormField label="Phone" icon={Phone}>
                  <input
                    value={formData.phone} onChange={(e) => field("phone", e.target.value)}
                    placeholder="+1 234 567 890"
                    className={inputCls()}
                  />
                </FormField>
              </div>
              <FormField label="Industry" icon={Briefcase}>
                <input
                  value={formData.industry} onChange={(e) => field("industry", e.target.value)}
                  placeholder="e.g. Retail, SaaS, Healthcare"
                  className={inputCls()}
                />
              </FormField>
              <FormField label="Address" icon={MapPin} isTextArea>
                <textarea
                  value={formData.address} onChange={(e) => field("address", e.target.value)}
                  rows={3} placeholder="Street, City, Country…"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#2C79F5] focus:ring-2 focus:ring-[#2C79F5]/20 transition-all dark:text-white resize-none"
                />
              </FormField>
            </form>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button type="button" onClick={closeDrawer}
                className="flex-1 py-2.5 text-[13px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!formData.company_name || saving}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-xl text-white transition-all ${
                  !formData.company_name || saving
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-[#2C79F5] hover:bg-[#1a6ae0] shadow-sm shadow-blue-500/30 active:scale-95"
                }`}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving…</> : (formMode === "create" ? "Save client" : "Update client")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
