"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Upload,
  User,
  MapPin,
  Layout,
  X,
  Search,
  Edit3,
  Loader2,
  Type,
  ImageIcon,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { gsap } from "gsap";
import { Info } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

export default function HappyCustomersManager() {
  const { data: session } = useSession();
  const [header, setHeader] = useState({
    label: "OUR COMMUNITY",
    titleStart: "Happy",
    titleEnd: "Customers.",
    description: "Join thousands of satisfied tech enthusiasts who have upgraded their digital lifestyle.",
  });
  const [customers, setCustomers] = useState([]);
  const [previews, setPreviews] = useState({});
  const [initialMaxIndex, setInitialMaxIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Design States (following Category page)
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null); // For Drawer
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fileInputs = useRef({});
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/admin/cms`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        });
        const apiData = await res.json();
        if (!res.ok) throw new Error(apiData.message || "Failed to fetch");

        const sections = apiData?.data?.home || {};

        // 1. Map Header
        const headerSec = sections["collections_header"] || [];
        if (headerSec.length > 0) {
          const mappedHeader = {};
          headerSec.forEach(i => mappedHeader[i.key] = i.value);
          setHeader(prev => ({ ...prev, ...mappedHeader }));
        }

        // 2. Map Customers
        const customerList = [];
        const newPreviews = {};
        let maxIdx = -1;

        Object.keys(sections).forEach(sectionName => {
          if (sectionName.startsWith("collections_customer_")) {
            const sec = sections[sectionName];
            let mapped = { id: sectionName.replace("collections_", "") };
            
            const idxMatch = sectionName.match(/\d+$/);
            if (idxMatch) {
              const idxNum = parseInt(idxMatch[0]);
              if (idxNum > maxIdx) maxIdx = idxNum;
            }

            if (Array.isArray(sec)) {
              sec.forEach(i => mapped[i.key] = i.value);
            } else if (typeof sec === "object") {
              mapped = { ...mapped, ...sec };
            }

            if (mapped.image && !mapped.image.startsWith("http")) {
              mapped.image = `${STORAGE_BASE}/${mapped.image}`;
            }
            customerList.push(mapped);
            newPreviews[mapped.id] = mapped.image;
          }
        });

        setInitialMaxIndex(maxIdx);

        customerList.sort((a, b) => {
          const numA = parseInt(a.id.split("_")[1]);
          const numB = parseInt(b.id.split("_")[1]);
          return numA - numB;
        });

        if (customerList.length === 0) {
          setCustomers(Array.from({ length: 4 }).map((_, i) => ({
            id: `customer_${Date.now()}_${i}`,
            title: "Customer Name",
            badge: "City, Country",
            image: "https://images.unsplash.com/photo-1519085185750-7407a274359c?auto=format&fit=crop&q=80&w=300"
          })));
        } else {
          setCustomers(customerList);
          setPreviews(newPreviews);
        }
      } catch (err) {
        console.warn("CMS defaults used", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // Drawer Animation (from category page)
  useEffect(() => {
    if (isFormOpen && formContentRef.current) {
      gsap.fromTo(formOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(formContentRef.current, { x: "100%" }, { x: "0%", duration: 0.5, ease: "power4.out" });
    }
  }, [isFormOpen]);

  const closeForm = () => {
    gsap.to(formContentRef.current, { x: "100%", duration: 0.4, ease: "power3.in", onComplete: () => setIsFormOpen(false) });
    gsap.to(formOverlayRef.current, { opacity: 0, duration: 0.3 });
  };

  const handleAdd = () => {
    const newId = `customer_${Date.now()}`;
    const randomImgIdx = Math.floor(Math.random() * 70) + 1;
    const newMember = {
      id: newId,
      title: "New Customer",
      badge: "Location",
      image: `https://i.pravatar.cc/300?img=${randomImgIdx}`
    };
    setCustomers(prev => [...prev, newMember]);
    // Open edit drawer for new member
    setSelectedId(newId);
    setIsFormOpen(true);
  };

  const handleRemove = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setIsFormOpen(false);
  };

  const handleUpdate = (id, field, value) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleImageChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpdate(id, "imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [id]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      let index = 0;

      const append = (section, key, value, type) => {
        formData.append(`contents[${index}][page]`, "home");
        formData.append(`contents[${index}][section]`, section);
        formData.append(`contents[${index}][key]`, key);
        formData.append(`contents[${index}][type]`, type);
        if (value instanceof File) {
          formData.append(`contents[${index}][value]`, value);
        } else {
          formData.append(`contents[${index}][value]`, value || "");
        }
        index++;
      };

      append("collections_header", "label", header.label, "text");
      append("collections_header", "titleStart", header.titleStart, "text");
      append("collections_header", "titleEnd", header.titleEnd, "text");
      append("collections_header", "description", header.description, "textarea");

      customers.forEach((c, i) => {
        const sectionId = `collections_customer_${i}`;
        append(sectionId, "title", c.title, "text");
        append(sectionId, "badge", c.badge, "text");
        if (c.imageFile) {
          append(sectionId, "image", c.imageFile, "image");
        } else if (c.image) {
          const path = c.image.split(STORAGE_BASE + "/")[1] || c.image;
          append(sectionId, "image", path, "text");
        }
      });

      // CLEANUP: If we have fewer customers now than before, clear the old slots
      if (initialMaxIndex >= customers.length) {
        for (let i = customers.length; i <= initialMaxIndex; i++) {
          const sectionId = `collections_customer_${i}`;
          append(sectionId, "title", "", "text"); // This will cause frontend to ignore the slot
          append(sectionId, "badge", "", "text");
          append(sectionId, "image", "", "text");
        }
      }

      const res = await fetch(`${API_BASE}/admin/cms/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Save failed");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.badge || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const selectedMember = useMemo(() => {
    if (selectedId === "header") return null;
    return customers.find(c => c.id === selectedId);
  }, [customers, selectedId]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white px-8 py-6 overflow-x-hidden">

      {/* 1. TOP HEADER (Following Category Design) */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Happy Customers</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your community gallery and customer testimonials.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              onClick={handleAdd}
              className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* 2. TOOLBAR (Following Category Design) */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-transparent rounded-xl text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-slate-500"}`}>
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-slate-500"}`}>
              <ListIcon className="w-4 h-4" /> List
            </button>
          </div>
        </div>

        {saveSuccess && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-8 flex items-center gap-2 text-sm font-semibold border border-emerald-100"><CheckCircle2 className="w-5 h-5" /> Changes saved and published to frontend.</div>}

        {/* 3. BRANDING SECTION (Integrated into Flow) */}
        <div className="mb-12 group">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600" /> Section Branding
            </h2>
            <button onClick={() => { setSelectedId("header"); setIsFormOpen(true); }} className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1">
              <Edit3 className="w-4 h-4" /> Edit Branding
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => { setSelectedId("header"); setIsFormOpen(true); }}>
            <div className="flex-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">{header.label}</span>
              <h3 className="text-3xl font-bold mb-3">{header.titleStart} <span className="text-slate-400">{header.titleEnd}</span></h3>
              <p className="text-slate-500 max-w-2xl leading-relaxed">{header.description}</p>
            </div>
            <div className="hidden md:block p-4 border border-slate-100 rounded-2xl group-hover:bg-white shadow-sm"><Edit3 className="w-6 h-6 text-slate-300 group-hover:text-indigo-600" /></div>
          </div>
        </div>

        {/* 4. CUSTOMER POOL (Grid/List View) */}
        <div className="px-2 mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Community Library ({filteredCustomers.length})</h2></div>

        {viewMode === "grid" ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
            {filteredCustomers.map((cat, idx) => (
              <div
                key={cat.id}
                onClick={() => { setSelectedId(cat.id); setIsFormOpen(true); }}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700 relative">
                    <img 
                      src={previews[cat.id] || cat.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={cat.title} 
                      onError={(e) => {
                        const randomIdx = Math.floor(Math.random() * 70) + 1;
                        e.target.src = `https://i.pravatar.cc/300?img=${randomIdx}`;
                      }}
                    />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{cat.title || "Untitled"}</h4>
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium truncate">
                    <MapPin className="w-3 h-3" />
                    <span>{cat.badge || "No location"}</span>
                  </div>
                </div>

                <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); handleRemove(cat.id); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}

            <button onClick={handleAdd} className="h-[72px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-300 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group px-4">
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Add Customer</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-5 pl-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Slot</th>
                  <th className="p-5 pr-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredCustomers.map((cat, idx) => (
                  <tr key={cat.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => { setSelectedId(cat.id); setIsFormOpen(true); }}>
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                          <img 
                            src={previews[cat.id] || cat.image} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              const randomIdx = Math.floor(Math.random() * 70) + 1;
                              e.target.src = `https://i.pravatar.cc/300?img=${randomIdx}`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{cat.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{cat.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-500">{cat.badge}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">#{idx + 1}</span></td>
                    <td className="p-4 pr-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(cat.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SIDE DRAWER FORM (Following Category Page Design) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div ref={formOverlayRef} className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div ref={formContentRef} className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700">

              {/* Drawer Header */}
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {selectedId === "header" 
                      ? "Edit Branding" 
                      : (selectedMember?.title === "New Customer" ? "Add Customer" : "Edit Customer")
                    }
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Configure community display settings.</p>
                </div>
                <button onClick={closeForm} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {selectedId === "header" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        Section Label <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          value={header.label}
                          onChange={(e) => setHeader({ ...header, label: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm"
                          placeholder="e.g., OUR COMMUNITY"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        Primary Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          value={header.titleStart}
                          onChange={(e) => setHeader({ ...header, titleStart: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm"
                          placeholder="e.g., Happy"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        Accent Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          value={header.titleEnd}
                          onChange={(e) => setHeader({ ...header, titleEnd: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm"
                          placeholder="e.g., Customers."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        Story Description <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <Info className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <textarea
                          value={header.description}
                          onChange={(e) => setHeader({ ...header, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm resize-none min-h-[120px] leading-relaxed"
                          placeholder="Describe the community impact..."
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedMember ? (
                  <div className="space-y-8">
                    <div className="space-y-4 flex flex-col items-center">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest self-start ml-1">
                        Customer Photo <span className="text-red-500">*</span>
                      </label>
                      <div onClick={() => fileInputs.current[selectedMember.id]?.click()} className="group relative w-32 h-32 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all overflow-hidden shadow-inner">
                        {previews[selectedMember.id] || selectedMember.image ? (
                          <>
                            <img src={previews[selectedMember.id] || selectedMember.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity"><Upload className="w-5 h-5 mb-1" /><span className="text-[8px] font-bold uppercase tracking-wider">Change</span></div>
                          </>
                        ) : (
                          <><ImageIcon className="w-8 h-8 text-slate-200 mb-1" /><span className="text-[8px] font-bold text-slate-400 uppercase">Upload</span></>
                        )}
                        <input type="file" ref={el => fileInputs.current[selectedMember.id] = el} className="hidden" onChange={(e) => handleImageChange(selectedMember.id, e)} accept="image/*" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            value={selectedMember.title}
                            onChange={(e) => handleUpdate(selectedMember.id, "title", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm"
                            placeholder="e.g., John Doe"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                          Location Details <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                          <input
                            value={selectedMember.badge}
                            onChange={(e) => handleUpdate(selectedMember.id, "badge", e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none transition-all focus:border-indigo-500 shadow-sm"
                            placeholder="e.g., New York, USA"
                          />
                        </div>
                      </div>
                    </div>

                    {selectedMember?.title !== "New Customer" && (
                        <button onClick={() => { handleRemove(selectedMember.id); closeForm(); }} className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors mt-12"><Trash2 className="w-5 h-5" /> Remove from Library</button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
                <button onClick={closeForm} className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={closeForm} className="flex-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-tiny-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-tiny-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-tiny-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
