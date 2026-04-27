"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  ImageIcon,
  Check,
  X,
  Layout,
  Tag,
  RefreshCw,
  AlertCircle,
  Upload,
  User,
  MapPin,
  CheckCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

const INITIAL_DATA = {
  header: {
    label: "OUR COMMUNITY",
    titleStart: "Happy",
    titleEnd: "Customers.",
    description: "Join thousands of satisfied tech enthusiasts who have upgraded their digital lifestyle with Igen. Real people, real stories.",
  },
  cards: Array.from({ length: 12 }).map((_, i) => ({
    id: `customer_${i}`,
    title: `Customer ${i + 1}`,
    badge: "COLOMBO, LK",
    image: "https://images.unsplash.com/photo-1519085185750-7407a274359c?auto=format&fit=crop&q=80&w=600",
  })).reduce((acc, card) => ({ ...acc, [card.id]: card }), {}),
};

export default function HappyCustomersManager() {
  const { data: session } = useSession();
  const [data, setData] = useState(INITIAL_DATA);
  const [previews, setPreviews] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputs = useRef({});

  // --- FETCH CMS DATA ---
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
        const newPreviews = {};

        const mapSection = (sectionName) => {
          const sec = sections[sectionName] || [];
          if (sec.length === 0) return null;
          const mapped = {};
          sec.forEach((i) => (mapped[i.key] = i.value));
          return mapped;
        };

        // 1. Header
        const header = mapSection("collections_header");
        if (header) {
          newData.header = { ...newData.header, ...header };
        }

        // 2. Cards (Handle 12 customers)
        Object.keys(newData.cards).forEach((id) => {
          const card = mapSection(`collections_${id}`);
          if (card) {
            if (card.image && !card.image.startsWith("http")) {
              card.image = `${STORAGE_BASE}/${card.image}`;
            }
            newData.cards[id] = { ...newData.cards[id], ...card };
            newPreviews[id] = card.image;
          }
        });

        setData(newData);
        setPreviews(newPreviews);
      } catch (err) {
        console.warn("CMS defaults used for happy customers", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // --- HANDLERS ---
  const handleHeaderUpdate = (field, value) => {
    setData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const handleCardUpdate = (cardId, field, value) => {
    setData((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: { ...prev.cards[cardId], [field]: value },
      },
    }));
  };

  const handleImageChange = (cardId, e) => {
    const file = e.target.files[0];
    if (file) {
      handleCardUpdate(cardId, "imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [cardId]: reader.result }));
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

      // 1. Header
      append("collections_header", "label", data.header.label, "text");
      append("collections_header", "titleStart", data.header.titleStart, "text");
      append("collections_header", "titleEnd", data.header.titleEnd, "text");
      append("collections_header", "description", data.header.description, "textarea");

      // 2. Cards
      Object.keys(data.cards).forEach((id) => {
        const card = data.cards[id];
        append(`collections_${id}`, "title", card.title, "text");
        append(`collections_${id}`, "badge", card.badge, "text");
        if (card.imageFile) {
          append(`collections_${id}`, "image", card.imageFile, "image");
        }
      });

      const res = await fetch(`${API_BASE}/admin/cms/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Save failed");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading Community CMS…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-white">
      {/* 1. LEFT PANEL: PREVIEW & LIST */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-50 shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold">Happy Customers Manager</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Update photos and stories of our community.</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4" /> Live!
              </span>
            )}
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50">
              {isSaving ? "Publishing..." : <><Save className="w-4 h-4" /> Publish Changes</>}
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* --- CONTENT MANAGER --- */}
        <div className="flex-1 p-8 overflow-x-hidden flex flex-col items-center">
          <div className="max-w-4xl w-full space-y-8">
            
            {/* A. HEADER SECTION */}
            <div onClick={() => setSelectedId("header")} className={`group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 transition-all cursor-pointer ${selectedId === "header" ? "border-indigo-500 shadow-2xl scale-[1.02]" : "border-slate-100 dark:border-slate-800 hover:border-indigo-200"}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full mb-3 inline-block">{data.header.label}</span>
                    <h2 className="text-4xl font-black">{data.header.titleStart} <span className="text-slate-400">{data.header.titleEnd}</span></h2>
                </div>
                <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors"><Layout className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" /></div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-100 dark:border-indigo-900 pl-4">{data.header.description}</p>
            </div>

            {/* B. CUSTOMER LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {Object.values(data.cards).map((card) => (
                <div 
                    key={card.id} 
                    onClick={() => setSelectedId(card.id)}
                    className={`group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer border-4 transition-all shadow-md ${selectedId === card.id ? "border-indigo-500 ring-8 ring-indigo-500/10 scale-105 z-10" : "border-white dark:border-slate-900 hover:border-indigo-100 dark:hover:border-indigo-900/50"}`}
                >
                    <img src={previews[card.id] || card.image} className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {card.badge}</span>
                        <h4 className="text-white font-bold text-lg group-hover:text-indigo-300 transition-colors">{card.title}</h4>
                    </div>
                    {selectedId === card.id && <div className="absolute top-4 right-4 bg-indigo-500 text-white p-2 rounded-full shadow-lg"><User className="w-4 h-4" /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: EDITOR SIDEBAR */}
      {selectedId && (
        <div className="fixed inset-0 z-[60] lg:relative lg:inset-auto w-full lg:w-[450px] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl lg:bg-white lg:dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Global Editor</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize">{selectedId === "header" ? "Community Branding" : "Customer Slot"}</h2>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {selectedId === "header" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section Label</label>
                    <input value={data.header.label} onChange={(e) => handleHeaderUpdate("label", e.target.value)} className="modern-input text-indigo-600 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title Start</label>
                        <input value={data.header.titleStart} onChange={(e) => handleHeaderUpdate("titleStart", e.target.value)} className="modern-input" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title End</label>
                        <input value={data.header.titleEnd} onChange={(e) => handleHeaderUpdate("titleEnd", e.target.value)} className="modern-input text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Community Story</label>
                    <textarea value={data.header.description} onChange={(e) => handleHeaderUpdate("description", e.target.value)} className="modern-input h-40 resize-none leading-relaxed" />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Photo</label>
                    <div 
                        onClick={() => fileInputs.current[selectedId]?.click()} 
                        className="group relative aspect-[3/4] rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 transition-all overflow-hidden"
                    >
                      {previews[selectedId] ? (
                        <>
                          <img src={previews[selectedId]} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"><Upload className="w-8 h-8 mb-2" /><span className="text-xs font-black uppercase">Replace Photo</span></div>
                        </>
                      ) : (
                        <><Upload className="w-10 h-10 text-slate-300 mb-2" /><span className="text-xs font-bold text-slate-400">Upload Customer Moment</span></>
                      )}
                      <input 
                        type="file" 
                        ref={el => fileInputs.current[selectedId] = el} 
                        onChange={(e) => handleImageChange(selectedId, e)} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"><User className="w-4 h-4" /></span>
                            <input value={data.cards[selectedId].title} onChange={(e) => handleCardUpdate(selectedId, "title", e.target.value)} className="modern-input pl-11 font-bold" placeholder="Full name" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location / Remark</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500"><MapPin className="w-4 h-4" /></span>
                            <input value={data.cards[selectedId].badge} onChange={(e) => handleCardUpdate(selectedId, "badge", e.target.value)} className="modern-input pl-11 font-medium" placeholder="Colombo, LK" />
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <button 
                onClick={() => setSelectedId(null)} 
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-[1.5rem] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <Check className="w-5 h-5" /> Confirm Update
              </button>
            </div>
        </div>
      )}

      <style jsx>{`
        .modern-input { @apply w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all shadow-inner; }
      `}</style>
    </div>
  );
}
