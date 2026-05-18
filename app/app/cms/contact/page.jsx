"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Save, Image as ImageIcon, Type, X, CheckCircle2,
  MousePointer2, Heading, Upload, RefreshCw, AlertCircle,
  Mail, Phone, MapPin,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

// Contact hero: title + subtitle + image
const CONTACT_HERO_FIELDS = [
  { key: "title", label: "Contact Hero Title", type: "text" },
  { key: "subtitle", label: "Contact Hero Subtitle", type: "textarea" },
  { key: "link_text", label: "Button Text", type: "text" },
  { key: "link_url", label: "Button Link", type: "link" },
  { key: "image", label: "Contact Hero Image", type: "image" },
];

// Contact info fields stored as page=contact, section=info
const CONTACT_INFO_FIELDS = [
  { key: "address", label: "Address", type: "text", icon: "map" },
  { key: "phone", label: "Phone", type: "text", icon: "phone" },
  { key: "email", label: "Email", type: "text", icon: "mail" },
];

const ALL_FIELDS = [...CONTACT_HERO_FIELDS, ...CONTACT_INFO_FIELDS];

const CardIcon = ({ icon }) => {
  if (icon === "map") return <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
  if (icon === "phone") return <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
  return <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
};

export default function ContactPageManager() {
  const { data: session } = useSession();
  const [heroFields, setHeroFields] = useState({ title: "Get In Touch.", subtitle: "We're here to help. Reach us and we'll get back to you as soon as possible.", link_text: "Send a Message", link_url: "/contact-us", image: "" });
  const [infoFields, setInfoFields] = useState({ address: "123 Main Street, Colombo 03, Sri Lanka", phone: "+94 77 123 4567", email: `info@${(process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium").toLowerCase().replace(/\s+/g, '')}.com` });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/cms`, { headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" } });
        const data = await res.json();
        const heroItems = data?.data?.contact?.hero || [];
        const infoItems = data?.data?.contact?.info || [];
        if (heroItems.length > 0) {
          const mapped = {};
          heroItems.forEach((item) => { mapped[item.key] = item.value; });
          setHeroFields((prev) => ({ ...prev, ...mapped }));
          if (mapped.image) {
            const imageUrl = mapped.image.startsWith("http")
              ? mapped.image
              : `${STORAGE_BASE}/${mapped.image}`;
            setImagePreview(imageUrl);
          }
        }
        if (infoItems.length > 0) {
          const mapped = {};
          infoItems.forEach((item) => { mapped[item.key] = item.value; });
          setInfoFields((prev) => ({ ...prev, ...mapped }));
        }
      } catch { /* use defaults */ }
      finally { setIsLoading(false); }
    })();
  }, [session]);

  const isHeroKey = (key) => CONTACT_HERO_FIELDS.some((f) => f.key === key);

  const handleFieldChange = (key, value) => {
    if (isHeroKey(key)) setHeroFields((prev) => ({ ...prev, [key]: value }));
    else setInfoFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setHeroFields((prev) => ({ ...prev, image: file.name }));
  };

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true); setSaveSuccess(false); setError(null);
    try {
      const formData = new FormData();
      let idx = 0;
      // Hero fields
      CONTACT_HERO_FIELDS.forEach((field) => {
        // Only proceed if it's not an image OR an image with a new file
        if (field.type === "image" && !imageFile) return;

        formData.append(`contents[${idx}][page]`, "contact");
        formData.append(`contents[${idx}][section]`, "hero");
        formData.append(`contents[${idx}][key]`, field.key);
        formData.append(`contents[${idx}][type]`, field.type);
        if (field.type === "image") {
          formData.append(`contents[${idx}][value]`, imageFile);
        } else {
          formData.append(`contents[${idx}][value]`, heroFields[field.key] || "");
        }
        idx++;
      });
      // Info fields
      CONTACT_INFO_FIELDS.forEach((field) => {
        formData.append(`contents[${idx}][page]`, "contact");
        formData.append(`contents[${idx}][section]`, "info");
        formData.append(`contents[${idx}][key]`, field.key);
        formData.append(`contents[${idx}][type]`, "text");
        formData.append(`contents[${idx}][value]`, infoFields[field.key] || "");
        idx++;
      });

      const res = await fetch(`${API_BASE}/admin/cms/update`, { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setSaveSuccess(true); setImageFile(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center"><RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" /><p className="text-slate-600 dark:text-slate-400 font-medium">Loading…</p></div>
    </div>
  );

  const currentField = ALL_FIELDS.find((f) => f.key === selectedKey);
  const currentValue = selectedKey ? (isHeroKey(selectedKey) ? heroFields[selectedKey] : infoFields[selectedKey]) : "";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center"><Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
              Contact Page — CMS
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Click any card to edit. Saves hero + info sections to the API.</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4" /> Saved!</span>}
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50">
              {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
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

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          {/* Hero Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">1. Hero Section (contact · hero)</h3>
            <div className="relative w-full rounded-3xl overflow-hidden" style={{ minHeight: "360px" }}>
              <img src={imagePreview || "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2074&auto=format&fit=crop"} alt="Contact Hero" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/60 to-black/20" />
              <div className="relative z-10 p-12 md:p-20 flex flex-col justify-center" style={{ minHeight: "360px" }}>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4 max-w-2xl">{heroFields.title}</h1>
                <p className="text-lg text-slate-300 font-medium max-w-lg leading-relaxed mb-8">{heroFields.subtitle}</p>
                <span className="inline-flex w-fit items-center gap-2 bg-white text-slate-900 px-7 py-3.5 rounded-full font-bold text-sm shadow-xl">
                  <Mail className="w-4 h-4" /> {heroFields.link_text || "Send a Message"}
                </span>
              </div>
            </div>
            {/* Hero field cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CONTACT_HERO_FIELDS.map((field) => (
                <div key={field.key} onClick={() => setSelectedKey(field.key)} className={`bg-white dark:bg-slate-900 rounded-2xl p-5 cursor-pointer border-2 transition-all duration-200 ${selectedKey === field.key ? "border-indigo-500 ring-4 ring-indigo-500/15 shadow-lg" : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {field.type === "image" ? <ImageIcon className="w-4 h-4 text-indigo-500" /> : field.key === "title" ? <Heading className="w-4 h-4 text-indigo-500" /> : <Type className="w-4 h-4 text-indigo-500" />}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label}</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{field.type}</span>
                  </div>
                  {field.type === "image" ? (
                    <div className="flex items-center gap-3">
                      {imagePreview ? <img src={imagePreview} alt="Hero" className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" /> : <div className="w-16 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400" /></div>}
                      <p className="text-xs font-mono text-slate-500 truncate">{heroFields.image || "No image set"}</p>
                    </div>
                  ) : (
                    <p className={`text-sm text-slate-700 dark:text-slate-300 line-clamp-2 ${field.key === "title" ? "font-bold" : ""}`}>{heroFields[field.key] || <span className="italic text-slate-400">Empty</span>}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">2. Contact Info Cards (contact · info)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONTACT_INFO_FIELDS.map((field) => (
                <div key={field.key} onClick={() => setSelectedKey(field.key)} className={`bg-white dark:bg-slate-900 rounded-2xl p-6 cursor-pointer border-2 transition-all duration-200 ${selectedKey === field.key ? "border-indigo-500 ring-4 ring-indigo-500/15 shadow-lg" : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"}`}>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                    <CardIcon icon={field.icon} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{field.label}</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{infoFields[field.key] || <span className="italic text-slate-400 font-normal text-sm">Empty</span>}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EDITOR SIDEBAR */}
      <div className={`w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out z-20 absolute right-0 lg:relative ${selectedKey ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:hidden"}`}>
        {selectedKey && currentField ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  contact · {isHeroKey(selectedKey) ? "hero" : "info"} · {currentField.key}
                </span>
                <h2 className="font-bold text-slate-900 dark:text-white">{currentField.label}</h2>
              </div>
              <button onClick={() => setSelectedKey(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {currentField.type === "image" ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Image Upload</label>
                  {imagePreview && <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-sm font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <Upload className="w-4 h-4" />{imageFile ? imageFile.name : "Choose New Image"}
                  </button>
                  {imageFile && <p className="text-xs text-emerald-600 font-medium">✓ Ready: {imageFile.name}</p>}
                </div>
              ) : currentField.type === "textarea" ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Content</label>
                  <textarea rows={5} value={currentValue} onChange={(e) => handleFieldChange(currentField.key, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 dark:text-white" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Content</label>
                  <input type="text" value={currentValue} onChange={(e) => handleFieldChange(currentField.key, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-semibold" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSaving ? "Saving…" : "Save to API"}
              </button>
              <button onClick={() => setSelectedKey(null)} className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:opacity-90">
                <CheckCircle2 className="w-4 h-4" /> Done Editing
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><MousePointer2 className="w-8 h-8 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nothing Selected</h3>
            <p className="text-sm mt-2 max-w-[200px]">Click a field card or info card to start editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
