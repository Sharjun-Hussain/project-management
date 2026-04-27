"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  Smartphone,
  Headphones,
  Tablet,
  Watch,
  Laptop,
  RotateCcw,
  X,
  Layout,
  Link as LinkIcon,
  ImageIcon,
  Grid,
  RefreshCw,
  AlertCircle,
  Upload,
  MousePointer2,
  Edit3,
  MapPin,
  ExternalLink,
  Zap,
  Menu,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";
import gsap from "gsap";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

const INITIAL_DATA = {
  navLinks: [
    { id: 1, label: "SHOP", href: "/shop" },
    { id: 2, label: "PHONES", href: "/shop/phones" },
    { id: 3, label: "ACCESSORIES", href: "/shop/accessories" },
    { id: 4, label: "REFURBISHED", href: "/shop/refurbished" },
  ],
  categories: [
    { id: "c1", label: "Smartphones", href: "/shop/smartphones", icon: "smartphone" },
    { id: "c2", label: "Refurbished", href: "/shop/refurbished", icon: "refresh" },
    { id: "c3", label: "Tablets", href: "/shop/tablets", icon: "tablet" },
    { id: "c4", label: "Audio", href: "/shop/audio", icon: "headphones" },
    { id: "c5", label: "Accessories", href: "/shop/accessories", icon: "watch" },
  ],
  promo1: {
    id: "promo1",
    title: "iPhone 16 Pro",
    subtitle: "Titanium design.",
    badge: "NEW ARRIVAL",
    image: "https://images.unsplash.com/photo-1696446702302-3f749a21228e?q=80&w=2070&auto=format&fit=crop",
    link: "/product/iphone-16",
    theme: "light",
  },
  promo2: {
    id: "promo2",
    title: "Premium Audio",
    subtitle: "Immersive sound experience.",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1976&auto=format&fit=crop",
    link: "/collections/audio",
    theme: "dark",
  },
};

export default function HeaderManager() {
  const { data: session } = useSession();
  const [data, setData] = useState(INITIAL_DATA);
  const [previews, setPreviews] = useState({ promo1: "", promo2: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const drawerOverlayRef = useRef(null);
  const drawerContentRef = useRef(null);
  const fileInputs = useRef({});

  // --- CMS FETCH ---
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
        const newData = { ...INITIAL_DATA };
        const newPreviews = { ...previews };

        const mapSection = (sectionName) => {
          const sec = sections[sectionName] || [];
          if (sec.length === 0) return null;
          const mapped = {};
          if (Array.isArray(sec)) {
              sec.forEach((i) => (mapped[i.key] = i.value));
          } else {
              Object.assign(mapped, sec);
          }
          return mapped;
        };

        // 1. Navigation
        for (let i = 1; i <= 4; i++) {
          const link = mapSection(`header_nav_link_${i}`);
          if (link) newData.navLinks[i - 1] = { ...newData.navLinks[i - 1], ...link };
        }

        // 2. Categories
        for (let i = 1; i <= 5; i++) {
          const cat = mapSection(`header_category_${i}`);
          if (cat) newData.categories[i - 1] = { ...newData.categories[i - 1], ...cat };
        }

        // 3. Promos
        ["promo1", "promo2"].forEach((id) => {
          const promo = mapSection(`header_${id}`);
          if (promo) {
            if (promo.image && !promo.image.startsWith("http")) {
              promo.image = `${STORAGE_BASE}/${promo.image}`;
            }
            newData[id] = { ...newData[id], ...promo };
            newPreviews[id] = promo.image;
          }
        });

        setData(newData);
        setPreviews(newPreviews);
      } catch (err) {
        console.warn("CMS defaults used", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // --- DRAWER ANIMATION ---
  useEffect(() => {
    if (isDrawerOpen && drawerContentRef.current) {
      gsap.fromTo(drawerOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(drawerContentRef.current, { x: "100%" }, { x: "0%", duration: 0.5, ease: "power4.out" });
    }
  }, [isDrawerOpen]);

  const closeDrawer = () => {
    gsap.to(drawerContentRef.current, { x: "100%", duration: 0.4, ease: "power3.in", onComplete: () => setIsDrawerOpen(false) });
    gsap.to(drawerOverlayRef.current, { opacity: 0, duration: 0.3 });
  };

  const openDrawer = (id) => {
    setSelectedId(id);
    setIsDrawerOpen(true);
  };

  // --- DATA HANDLERS ---
  const handleUpdate = (id, field, value) => {
    setData(prev => {
        if (typeof id === "number") {
            return { ...prev, navLinks: prev.navLinks.map(l => l.id === id ? { ...l, [field]: value } : l) };
        }
        if (id.startsWith("c")) {
            return { ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, [field]: value } : c) };
        }
        return { ...prev, [id]: { ...prev[id], [field]: value } };
    });
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

      data.navLinks.forEach((link, i) => {
        append(`header_nav_link_${i + 1}`, "label", link.label, "text");
        append(`header_nav_link_${i + 1}`, "href", link.href, "link");
      });

      data.categories.forEach((cat, i) => {
        append(`header_category_${i + 1}`, "label", cat.label, "text");
        append(`header_category_${i + 1}`, "href", cat.href, "link");
        append(`header_category_${i + 1}`, "icon", cat.icon, "text");
      });

      ["promo1", "promo2"].forEach((id) => {
        const p = data[id];
        append(`header_${id}`, "title", p.title, "text");
        append(`header_${id}`, "subtitle", p.subtitle, "text");
        if (id === "promo1") append(`header_${id}`, "badge", p.badge, "text");
        append(`header_${id}`, "link", p.link, "link");
        append(`header_${id}`, "theme", p.theme, "text");
        if (p.imageFile) append(`header_${id}`, "image", p.imageFile, "image");
      });

      const res = await fetch(`${API_BASE}/admin/cms/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" },
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

  // --- FILTERS ---
  const filteredCategories = useMemo(() => {
    return data.categories.filter(c => (c.label || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data.categories, searchTerm]);

  const selectedMember = useMemo(() => {
    if (!selectedId) return null;
    if (typeof selectedId === "number") return data.navLinks.find(l => l.id === selectedId);
    if (selectedId.startsWith("c")) return data.categories.find(c => c.id === selectedId);
    return data[selectedId];
  }, [selectedId, data]);

  const renderIcon = (name, className) => {
    const props = { className };
    switch (name) {
      case "smartphone": return <Smartphone {...props} />;
      case "headphones": return <Headphones {...props} />;
      case "tablet": return <Tablet {...props} />;
      case "watch": return <Watch {...props} />;
      case "laptop": return <Laptop {...props} />;
      case "refresh": return <RotateCcw {...props} />;
      default: return <Grid {...props} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Header...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white">
      {/* 1. TOP UTILITY BAR */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Menu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Navigation System</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Live Connection Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Sync Successful</span>
            </div>
          )}
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="group relative flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500" />
            {isSaving ? "Uploading..." : <><Save className="w-4 h-4" /> Save Configuration</>}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-12">
        {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                <AlertCircle className="w-5 h-5" /> {error}
            </div>
        )}

        {/* 2. MAIN CATEGORIES GRID */}
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Mega Menu Categories</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Configure the main shopping categories shown in the dropdown.</p>
                </div>
                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredCategories.map((cat) => (
                    <div 
                        key={cat.id} 
                        onClick={() => openDrawer(cat.id)}
                        className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                            {renderIcon(cat.icon, "w-6 h-6 text-slate-400 group-hover:text-white transition-colors")}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{cat.label}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">{cat.href}</p>
                    </div>
                ))}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 3. NAVIGATION LINKS */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Main Top Links</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Direct access links shown at the top of the homepage.</p>
                </div>
                <div className="space-y-3">
                    {data.navLinks.map((link, i) => (
                        <div 
                            key={link.id}
                            onClick={() => openDrawer(link.id)}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-indigo-500 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-bold text-slate-300 w-6">0{i+1}</div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{link.label}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-slate-400 px-3 py-1 bg-slate-50 dark:bg-slate-950 rounded-lg">{link.href}</span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. PROMO CARDS */}
            <section className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Menu Spotlight</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Rich visual cards contained within the mega menu panel.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 h-full min-h-[300px]">
                    {["promo1", "promo2"].map(id => {
                        const p = data[id];
                        return (
                            <div 
                                key={id}
                                onClick={() => openDrawer(id)}
                                className="relative rounded-3xl overflow-hidden group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-xl"
                            >
                                <img src={previews[id] || p.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className={`absolute inset-0 p-6 flex flex-col justify-end ${p.theme === 'dark' ? 'bg-black/60' : 'bg-white/40 backdrop-blur-[2px]'}`}>
                                    {p.badge && <span className="self-start px-2 py-0.5 bg-indigo-600 text-[8px] font-bold text-white rounded mb-2 uppercase tracking-widest transition-transform group-hover:-translate-y-1">{p.badge}</span>}
                                    <h3 className={`text-xl font-bold leading-tight tracking-tight uppercase ${p.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
                                    <p className={`text-[10px] font-bold opacity-70 ${p.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{p.subtitle}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
      </div>

      {/* 5. SIDE DRAWER EDITOR */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div ref={drawerOverlayRef} className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={closeDrawer} />
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                <div ref={drawerContentRef} className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
                    
                    {/* Header */}
                    <div className="px-8 py-8 border-b border-slate-100 dark:border-slate-800 flex items-end justify-between bg-slate-50/50 dark:bg-slate-950/50">
                        <div>
                            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-1 block">Live Configuration</span>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                {typeof selectedId === "number" ? "Nav Link" : selectedId.startsWith("c") ? "Category" : "Spotlight"}
                            </h2>
                        </div>
                        <button onClick={closeDrawer} className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* NAV LINK FORM */}
                        {typeof selectedId === "number" && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visible Label</label>
                                    <div className="relative group">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input 
                                            value={selectedMember.label || ""}
                                            onChange={e => handleUpdate(selectedId, "label", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all shadow-sm focus:bg-white dark:focus:bg-slate-900"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination URL</label>
                                    <div className="relative group">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input 
                                            value={selectedMember.href || ""}
                                            onChange={e => handleUpdate(selectedId, "href", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all shadow-sm focus:bg-white dark:focus:bg-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CATEGORY FORM */}
                        {typeof selectedId === "string" && selectedId.startsWith("c") && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Icon Style</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {["smartphone", "headphones", "tablet", "laptop", "watch", "refresh", "grid"].map(icon => (
                                            <button 
                                                key={icon}
                                                onClick={() => handleUpdate(selectedId, "icon", icon)}
                                                className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedMember.icon === icon ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-50 dark:border-slate-800 text-slate-300 hover:bg-slate-50'}`}
                                            >
                                                {renderIcon(icon, "w-6 h-6")}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Label</label>
                                        <input 
                                            value={selectedMember.label || ""}
                                            onChange={e => handleUpdate(selectedId, "label", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deep Link</label>
                                        <input 
                                            value={selectedMember.href || ""}
                                            onChange={e => handleUpdate(selectedId, "href", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROMO FORM */}
                        {typeof selectedId === "string" && selectedId.startsWith("promo") && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block mb-4">Card Presentation</label>
                                    <div 
                                        onClick={() => fileInputs.current[selectedId]?.click()}
                                        className="group relative aspect-[16/10] rounded-[32px] bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden shadow-inner"
                                    >
                                        {previews[selectedId] || selectedMember.image ? (
                                            <>
                                                <img src={previews[selectedId] || selectedMember.image} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity"><Upload className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Update Graphic</span></div>
                                            </>
                                        ) : (
                                            <><ImageIcon className="w-10 h-10 text-slate-200 mb-2" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Asset</span></>
                                        )}
                                        <input type="file" onChange={e => handleImageChange(selectedId, e)} ref={el => fileInputs.current[selectedId] = el} className="hidden" accept="image/*" />
                                    </div>
                                </div>

                                <div className="flex gap-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {["light", "dark"].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => handleUpdate(selectedId, "theme", t)}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedMember.theme === t ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:bg-white/50'}`}
                                        >
                                            {t} Theme
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Heading</label>
                                        <input 
                                            value={selectedMember.title || ""}
                                            onChange={e => handleUpdate(selectedId, "title", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                        <textarea 
                                            value={selectedMember.subtitle || ""}
                                            onChange={e => handleUpdate(selectedId, "subtitle", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold min-h-[100px] resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Link</label>
                                        <input 
                                            value={selectedMember.link || ""}
                                            onChange={e => handleUpdate(selectedId, "link", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex gap-4">
                        <button onClick={closeDrawer} className="flex-1 py-4 font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 transition-colors">Dismiss</button>
                        <button onClick={closeDrawer} className="flex-2 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] py-4 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all">Submit Changes</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #1E293B; }
      `}</style>
    </div>
  );
}
