"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  Palette,
  LayoutGrid,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  Heading,
} from "lucide-react";
import { Layout } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const INITIAL_HEADER = {
  id: "promises_header",
  type: "header",
  titleStart: `Our ${process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium"}`,
  titleHighlight: "Promise",
  subtitle: "We don't just sell products; we provide a seamless experience from checkout to unboxing.",
};

const INITIAL_CARDS = [
  { id: "promises_card_1", type: "card", title: "Island-wide Delivery", description: "Next-day delivery to Eastern Province & Island-wide.", icon: "truck", color: "blue" },
  { id: "promises_card_2", type: "card", title: "Official Warranty", description: "1 Year Apple Care / Company Warranty on all devices.", icon: "shield", color: "green" },
  { id: "promises_card_3", type: "card", title: "Flexible Payments", description: "Pay in installments with Koko, Mintpay, or Credit Cards.", icon: "card", color: "purple" },
  { id: "promises_card_4", type: "card", title: "Expert Support", description: "24/7 technical support via WhatsApp and Hotline.", icon: "headphone", color: "orange" },
];

const INITIAL_STATS = [
  { id: "promises_stat_1", type: "stat", value: "15k+", label: "ORDERS SHIPPED" },
  { id: "promises_stat_2", type: "stat", value: "4.9/5", label: "CUSTOMER RATING" },
  { id: "promises_stat_3", type: "stat", value: "100%", label: "GENUINE PRODUCTS" },
  { id: "promises_stat_4", type: "stat", value: "24/7", label: "SUPPORT TEAM" },
];

export default function PromisesManager() {
  const { data: session } = useSession();
  const [headerData, setHeaderData] = useState(INITIAL_HEADER);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch");

        const sections = data?.data?.home || {};

        // 1. Map header
        const headerSec = sections.promises_header || [];
        if (headerSec.length > 0) {
          const mapped = {};
          headerSec.forEach(i => mapped[i.key] = i.value);
          setHeaderData(prev => ({
            ...prev,
            titleStart: mapped.title_start || prev.titleStart,
            titleHighlight: mapped.title_highlight || prev.titleHighlight,
            subtitle: mapped.subtitle || prev.subtitle,
          }));
        }

        // 2. Map cards
        const updatedCards = INITIAL_CARDS.map(card => {
          const cardSec = sections[card.id] || [];
          if (cardSec.length > 0) {
            const mapped = {};
            cardSec.forEach(i => mapped[i.key] = i.value);
            return {
              ...card,
              title: mapped.title || card.title,
              description: mapped.description || card.description,
              icon: mapped.icon || card.icon,
              color: mapped.color || card.color,
            };
          }
          return card;
        });
        setCards(updatedCards);

        // 3. Map stats
        const updatedStats = INITIAL_STATS.map(stat => {
          const statSec = sections[stat.id] || [];
          if (statSec.length > 0) {
            const mapped = {};
            statSec.forEach(i => mapped[i.key] = i.value);
            return {
              ...stat,
              value: mapped.value || stat.value,
              label: mapped.label || stat.label,
            };
          }
          return stat;
        });
        setStats(updatedStats);

      } catch (err) {
        console.warn("CMS defaults used for promises section", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const handleUpdate = (e) => {
    if (!selectedItem) return;
    const { name, value } = e.target;
    setSelectedItem(prev => ({ ...prev, [name]: value }));

    if (selectedItem.type === "header") {
      setHeaderData(prev => ({ ...prev, [name]: value }));
    } else if (selectedItem.type === "card") {
      setCards(prev => prev.map(c => (c.id === selectedItem.id ? { ...c, [name]: value } : c)));
    } else if (selectedItem.type === "stat") {
      setStats(prev => prev.map(s => (s.id === selectedItem.id ? { ...s, [name]: value } : s)));
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

      // 1. Header
      const headerFields = [
        { key: "title_start", value: headerData.titleStart, type: "text" },
        { key: "title_highlight", value: headerData.titleHighlight, type: "text" },
        { key: "subtitle", value: headerData.subtitle, type: "textarea" },
      ];
      headerFields.forEach(f => {
        formData.append(`contents[${index}][page]`, "home");
        formData.append(`contents[${index}][section]`, "promises_header");
        formData.append(`contents[${index}][key]`, f.key);
        formData.append(`contents[${index}][type]`, f.type);
        formData.append(`contents[${index}][value]`, f.value || "");
        index++;
      });

      // 2. Cards
      cards.forEach(card => {
        const fields = [
          { key: "title", value: card.title, type: "text" },
          { key: "description", value: card.description, type: "textarea" },
          { key: "icon", value: card.icon, type: "text" },
          { key: "color", value: card.color, type: "text" },
        ];
        fields.forEach(f => {
          formData.append(`contents[${index}][page]`, "home");
          formData.append(`contents[${index}][section]`, card.id);
          formData.append(`contents[${index}][key]`, f.key);
          formData.append(`contents[${index}][type]`, f.type);
          formData.append(`contents[${index}][value]`, f.value || "");
          index++;
        });
      });

      // 3. Stats
      stats.forEach(stat => {
        const fields = [
          { key: "value", value: stat.value, type: "text" },
          { key: "label", value: stat.label, type: "text" },
        ];
        fields.forEach(f => {
          formData.append(`contents[${index}][page]`, "home");
          formData.append(`contents[${index}][section]`, stat.id);
          formData.append(`contents[${index}][key]`, f.key);
          formData.append(`contents[${index}][type]`, f.type);
          formData.append(`contents[${index}][value]`, f.value || "");
          index++;
        });
      });

      const res = await fetch(`${API_BASE}/admin/cms/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderIcon = (iconName, className) => {
    switch (iconName) {
      case "truck": return <Truck className={className} />;
      case "shield": return <ShieldCheck className={className} />;
      case "card": return <CreditCard className={className} />;
      case "headphone": return <Headphones className={className} />;
      default: return <CheckCircle2 className={className} />;
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case "blue": return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "green": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "purple": return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      case "orange": return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getBorderColor = (color) => {
    switch (color) {
      case "blue": return "border-blue-500 ring-blue-500/20";
      case "green": return "border-emerald-500 ring-emerald-500/20";
      case "purple": return "border-purple-500 ring-purple-500/20";
      case "orange": return "border-orange-500 ring-orange-500/20";
      default: return "border-indigo-500 ring-indigo-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading CMS data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Promises & Stats</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage the trust indicators and business stats.</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex-1 p-8 md:p-16 overflow-x-hidden flex flex-col items-center">
          <div className="max-w-[1200px] w-full">
            <div onClick={() => setSelectedItem(headerData)} className={`text-center mb-16 p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedItem?.id === "promises_header" ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10" : "border-transparent hover:border-slate-300 dark:hover:border-slate-800"}`}>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {headerData.titleStart} <span className="text-indigo-600 dark:text-indigo-400">{headerData.titleHighlight}</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">{headerData.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {cards.map((card) => (
                <div key={card.id} onClick={() => setSelectedItem(card)} className={`p-8 rounded-3xl cursor-pointer transition-all border shadow-sm hover:shadow-md bg-white dark:bg-slate-900 ${selectedItem?.id === card.id ? `${getBorderColor(card.color)} ring-2` : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${getColorClasses(card.color)}`}>{renderIcon(card.icon, "w-7 h-7")}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
                {stats.map((stat) => (
                  <div key={stat.id} onClick={() => setSelectedItem(stat)} className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedItem?.id === stat.id ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out z-20 absolute right-0 lg:relative ${selectedItem ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:hidden"}`}>
        {selectedItem ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Editing {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}</span>
                <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{selectedItem.title || selectedItem.label || "Settings"}</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedItem.type === "header" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title Start</label><input name="titleStart" value={headerData.titleStart} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block text-indigo-500">Highlight</label><input name="titleHighlight" value={headerData.titleHighlight} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-indigo-600 outline-none" /></div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Subtitle</label><textarea name="subtitle" value={headerData.subtitle} onChange={handleUpdate} rows={4} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none resize-none" /></div>
                </div>
              )}
              {selectedItem.type === "card" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> Icon</label><select name="icon" value={selectedItem.icon} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none"><option value="truck">Truck</option><option value="shield">Shield</option><option value="card">Credit Card</option><option value="headphone">Headphone</option></select></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3" /> Accent</label><select name="color" value={selectedItem.color} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none"><option value="blue">Blue</option><option value="green">Green</option><option value="purple">Purple</option><option value="orange">Orange</option></select></div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Card Title</label><input name="title" value={selectedItem.title} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label><textarea name="description" value={selectedItem.description} onChange={handleUpdate} rows={3} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none resize-none" /></div>
                </div>
              )}
              {selectedItem.type === "stat" && (
                <div className="space-y-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Stat Value</label><input name="value" value={selectedItem.value} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Label</label><input name="label" value={selectedItem.label} onChange={handleUpdate} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" /></div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-3">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setSelectedItem(null)} className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"><CheckCircle2 className="w-4 h-4" /> Done</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><Layout className="w-8 h-8 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Promises Manager</h3>
            <p className="text-sm mt-2 max-w-[200px]">Select any element to edit its content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
