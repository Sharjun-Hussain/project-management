"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  MapPin,
  Clock,
  Mail,
  CreditCard,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  X,
  Type,
  Link as LinkIcon,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Upload,
} from "lucide-react";
import { Layout } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

// --- INITIAL DATA ---
// NOTE: 'socials' is now an Array of Objects, not a plain Object.
const INITIAL_DATA = {
  brand: {
    description:
      "Sri Lanka's most trusted tech destination. We bring the future of technology to your doorstep with official warranties and premium support.",
    socials: [
      {
        id: "facebook",
        icon: "facebook",
        active: true,
        url: "https://facebook.com/",
      },
      {
        id: "instagram",
        icon: "instagram",
        active: true,
        url: "https://instagram.com/",
      },
      {
        id: "twitter",
        icon: "twitter",
        active: true,
        url: "https://twitter.com/",
      },
      { id: "linkedin", icon: "linkedin", active: false, url: "" },
    ],
  },
  columns: [
    {
      id: "col1",
      title: "Discover",
      links: [
        { id: 1, label: "Shop All", href: "/shop" },
        { id: 2, label: "New Arrivals", href: "/new" },
        { id: 3, label: "Flash Deals", href: "/deals" },
        { id: 4, label: "Bundles", href: "/bundles" },
        { id: 5, label: "Tech Blog", href: "/blog" },
      ],
    },
    {
      id: "col2",
      title: "Help",
      links: [
        { id: 6, label: "Warranty Info", href: "/warranty" },
        { id: 7, label: "Returns", href: "/returns" },
        { id: 8, label: "FAQs", href: "/faqs" },
        { id: 9, label: "Contact Us", href: "/contact" },
      ],
    },
  ],
  store: {
    badge: "Flagship Store",
    city: "Sainthamruthu",
    address: "Main Street, Sainthamruthu.",
    hours: "Open Daily: 10AM - 8PM",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop",
  },
  newsletter: {
    title: "Join the inner circle.",
    subtitle: "Get access to secret sales and restock alerts.",
    placeholder: "Enter email address",
  },
  bottom: {
    copyright: `© 2026 ${process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium"}. All rights reserved.`,
  },
};

export default function FooterManager() {
  const { data: session } = useSession();
  const [data, setData] = useState(INITIAL_DATA);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Previews
  const [previews, setPreviews] = useState({ store: null });
  const storeImgRef = useRef(null);

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

        // 1. Brand
        const brandSec = sections.footer_brand || [];
        if (brandSec.length > 0) {
          const mapped = {};
          brandSec.forEach(i => mapped[i.key] = i.value);
          newData.brand.description = mapped.description || newData.brand.description;
        }

        // 2. Socials
        const socialSec = sections.footer_socials || [];
        if (socialSec.length > 0) {
          const mapped = {};
          socialSec.forEach(i => mapped[i.key] = i.value);
          newData.brand.socials = newData.brand.socials.map(s => {
            const prefix = s.id === "facebook" ? "fb" : s.id === "instagram" ? "ig" : s.id === "twitter" ? "tw" : "li";
            return {
              ...s,
              url: mapped[`${prefix}_url`] || s.url,
              active: mapped[`${prefix}_active`] === "true",
            };
          });
        }

        // 3. Columns
        [1, 2].forEach(num => {
          const colId = `col${num}`;
          const secName = `footer_col_${num}`;
          const colSec = sections[secName] || [];
          if (colSec.length > 0) {
            const mapped = {};
            colSec.forEach(i => mapped[i.key] = i.value);
            const colIdx = num - 1;
            newData.columns[colIdx].title = mapped.title || newData.columns[colIdx].title;

            // Links for this column
            const links = [];
            let l = 1;
            while (sections[`footer_col_${num}_link_${l}`]) {
              const lSec = sections[`footer_col_${num}_link_${l}`];
              const lMapped = {};
              lSec.forEach(i => lMapped[i.key] = i.value);
              links.push({ id: `col${num}_link_${l}`, label: lMapped.label, href: lMapped.href });
              l++;
            }
            if (links.length > 0) newData.columns[colIdx].links = links;
          }
        });

        // 4. Store
        const storeSec = sections.footer_store || [];
        if (storeSec.length > 0) {
          const mapped = {};
          storeSec.forEach(i => mapped[i.key] = i.value);
          if (mapped.image && !mapped.image.startsWith("http")) {
            mapped.image = `${STORAGE_BASE}/${mapped.image}`;
          }
          newData.store = { ...newData.store, ...mapped };
        }

        // 5. Newsletter
        const newsSec = sections.footer_newsletter || [];
        if (newsSec.length > 0) {
          const mapped = {};
          newsSec.forEach(i => mapped[i.key] = i.value);
          newData.newsletter = { ...newData.newsletter, ...mapped };
        }

        // 6. Bottom
        const botSec = sections.footer_bottom || [];
        if (botSec.length > 0) {
          const mapped = {};
          botSec.forEach(i => mapped[i.key] = i.value);
          newData.bottom.copyright = mapped.copyright || newData.bottom.copyright;
        }

        setData(newData);
      } catch (err) {
        console.warn("CMS defaults used for footer", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const handleUpdate = (section, field, value) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleLinkUpdate = (colId, linkId, field, value) => {
    setData((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === colId
          ? {
              ...col,
              links: col.links.map((l) =>
                l.id === linkId ? { ...l, [field]: value } : l,
              ),
            }
          : col,
      ),
    }));
  };

  const handleSocialUpdate = (id, field, value) => {
    setData((prev) => {
      if (!Array.isArray(prev.brand.socials)) return prev;
      return {
        ...prev,
        brand: {
          ...prev.brand,
          socials: prev.brand.socials.map((s) =>
            s.id === id ? { ...s, [field]: value } : s,
          ),
        },
      };
    });
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result }));
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
      let idx = 0;

      const append = (section, key, value, type) => {
        formData.append(`contents[${idx}][page]`, "home");
        formData.append(`contents[${idx}][section]`, section);
        formData.append(`contents[${idx}][key]`, key);
        formData.append(`contents[${idx}][type]`, type);
        if (value instanceof File) {
          formData.append(`contents[${idx}][value]`, value);
        } else {
          formData.append(`contents[${idx}][value]`, value || "");
        }
        idx++;
      };

      // 1. Brand
      append("footer_brand", "description", data.brand.description, "textarea");

      // 2. Socials
      data.brand.socials.forEach(s => {
        const prefix = s.id === "facebook" ? "fb" : s.id === "instagram" ? "ig" : s.id === "twitter" ? "tw" : "li";
        append("footer_socials", `${prefix}_url`, s.url, "link");
        append("footer_socials", `${prefix}_active`, s.active ? "true" : "false", "text");
      });

      // 3. Columns & Links
      data.columns.forEach((col, cIdx) => {
        const num = cIdx + 1;
        append(`footer_col_${num}`, "title", col.title, "text");
        col.links.forEach((link, lIdx) => {
          append(`footer_col_${num}_link_${lIdx + 1}`, "label", link.label, "text");
          append(`footer_col_${num}_link_${lIdx + 1}`, "href", link.href, "link");
        });
      });

      // 4. Store
      append("footer_store", "badge", data.store.badge, "text");
      append("footer_store", "city", data.store.city, "text");
      append("footer_store", "address", data.store.address, "textarea");
      append("footer_store", "hours", data.store.hours, "text");
      const storeFile = storeImgRef.current?.files[0];
      if (storeFile) {
        append("footer_store", "image", storeFile, "image");
      }

      // 5. Newsletter
      append("footer_newsletter", "title", data.newsletter.title, "text");
      append("footer_newsletter", "subtitle", data.newsletter.subtitle, "textarea");

      // 6. Bottom
      append("footer_bottom", "copyright", data.bottom.copyright, "text");

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

  // Helper to render icons
  const getSocialIcon = (id, className) => {
    switch (id) {
      case "facebook":
        return <Facebook className={className} />;
      case "instagram":
        return <Instagram className={className} />;
      case "twitter":
        return <Twitter className={className} />;
      case "linkedin":
        return <Linkedin className={className} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading Footer CMS data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* 1. LEFT PANEL: PREVIEW */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-50 shrink-0 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Footer Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Customize the site footer, links, and store information.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
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
          <div className="mx-8 mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* --- PREVIEW CANVAS --- */}
        <div className="flex-1 p-8 md:p-12 overflow-x-hidden flex flex-col items-center justify-start bg-slate-100 dark:bg-black/80">
          <div className="w-full max-w-[1300px]">
            {/* FOOTER CONTAINER SIMULATION */}
            <div className="bg-black text-slate-400 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800">
              {/* TOP ROW */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
                {/* 1. BRAND INFO */}
                <div
                  onClick={() => setSelectedSection("brand")}
                  className={`
                    md:col-span-4 p-4 -m-4 rounded-xl cursor-pointer transition-all border-2
                    ${selectedSection === "brand" ? "border-indigo-500 bg-white/5" : "border-transparent hover:bg-white/5"}
                  `}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-black text-sm">
                      {(process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">
                      {process.env.NEXT_PUBLIC_SHOP_NAME || "Foreign Emporium"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-6">
                    {data.brand.description}
                  </p>

                  {/* Social Icons Preview - Safe Check Added */}
                  <div className="flex gap-4">
                    {Array.isArray(data.brand.socials) &&
                      data.brand.socials.map(
                        (social) =>
                          social.active && (
                            <div
                              key={social.id}
                              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              {getSocialIcon(social.id, "w-4 h-4")}
                            </div>
                          ),
                      )}
                  </div>
                </div>

                {/* 2. LINK COLUMNS */}
                <div className="md:col-span-4 flex gap-8">
                  {data.columns.map((col) => (
                    <div
                      key={col.id}
                      onClick={() => setSelectedSection(col.id)}
                      className={`
                        flex-1 p-4 -m-4 rounded-xl cursor-pointer transition-all border-2
                        ${selectedSection === col.id ? "border-indigo-500 bg-white/5" : "border-transparent hover:bg-white/5"}
                      `}
                    >
                      <h3 className="text-white font-bold mb-6">{col.title}</h3>
                      <ul className="space-y-4 text-sm">
                        {col.links.map((link) => (
                          <li
                            key={link.id}
                            className="hover:text-white transition-colors"
                          >
                            {link.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* 3. STORE CARD */}
                <div className="md:col-span-4">
                  <div
                    onClick={() => setSelectedSection("store")}
                    className={`
                      relative overflow-hidden rounded-3xl h-full min-h-[220px] p-8 flex flex-col justify-center cursor-pointer transition-all border-2
                      ${selectedSection === "store" ? "border-indigo-500" : "border-slate-800 hover:border-slate-700"}
                    `}
                  >
                    <img
                      src={previews.store || data.store.image}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-blue-900/80 to-purple-900/80 mix-blend-multiply" />
                    <div className="relative z-10">
                      <span className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4">
                        {data.store.badge}
                      </span>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {data.store.city}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-200">
                        <p>{data.store.address}</p>
                        <p className="opacity-80">{data.store.hours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div
                  onClick={() => setSelectedSection("newsletter")}
                  className={`
                    bg-[#111] p-8 rounded-3xl border border-slate-800 flex items-center justify-between gap-4 cursor-pointer transition-all
                    ${selectedSection === "newsletter" ? "ring-2 ring-indigo-500" : "hover:bg-[#151515]"}
                  `}
                >
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg mb-1">
                      {data.newsletter.title}
                    </h4>
                    <p className="text-xs">{data.newsletter.subtitle}</p>
                  </div>
                  <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-[#111] p-8 rounded-3xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-white font-bold text-xs uppercase">
                          Secure
                        </p>
                        <p className="text-[10px] uppercase">Checkout</p>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-white font-bold text-xs uppercase">
                          Flexible
                        </p>
                        <p className="text-[10px] uppercase">Payments</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-slate-200 text-black text-[10px] font-bold px-2 py-1 rounded">
                      VISA
                    </span>
                    <span className="bg-slate-200 text-black text-[10px] font-bold px-2 py-1 rounded">
                      MASTER
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM BAR */}
              <div
                onClick={() => setSelectedSection("bottom")}
                className={`
                  pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs cursor-pointer transition-all
                  ${selectedSection === "bottom" ? "text-indigo-400" : ""}
                `}
              >
                <p>{data.bottom.copyright}</p>
                <div className="flex gap-6">
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Sitemap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: EDITOR SIDEBAR */}
      <div
        className={`
        w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 
        flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out z-50 absolute right-0 lg:relative
        ${selectedSection ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:hidden"}
      `}
      >
        {selectedSection ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Editing
                </span>
                <h2 className="font-bold text-slate-900 dark:text-white capitalize">
                  {selectedSection === "col1"
                    ? "Discover Links"
                    : selectedSection === "brand"
                      ? "Brand & Socials"
                      : selectedSection}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSection(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* --- BRAND & SOCIALS EDITOR --- */}
              {selectedSection === "brand" && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Brand Description
                    </label>
                    <textarea
                      value={data.brand.description}
                      onChange={(e) =>
                        handleUpdate("brand", "description", e.target.value)
                      }
                      className="input-field resize-none h-32"
                    />
                  </div>

                  {/* Social Media Manager */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      Social Connectivity
                    </label>
                    {Array.isArray(data.brand.socials) &&
                      data.brand.socials.map((social) => (
                        <div
                          key={social.id}
                          className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getSocialIcon(
                                social.id,
                                "w-4 h-4 text-slate-500",
                              )}
                              <span className="text-sm font-bold capitalize text-slate-700 dark:text-slate-300">
                                {social.id}
                              </span>
                            </div>
                            {/* Toggle Switch */}
                            <button
                              onClick={() =>
                                handleSocialUpdate(
                                  social.id,
                                  "active",
                                  !social.active,
                                )
                              }
                              className={`w-8 h-4 rounded-full transition-colors relative ${social.active ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"}`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${social.active ? "translate-x-4" : ""}`}
                              ></div>
                            </button>
                          </div>

                          {/* URL Input (Only if active) */}
                          {social.active && (
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-3 h-3 text-slate-400" />
                              <input
                                value={social.url}
                                onChange={(e) =>
                                  handleSocialUpdate(
                                    social.id,
                                    "url",
                                    e.target.value,
                                  )
                                }
                                className="bg-transparent border-b border-slate-300 dark:border-slate-700 w-full text-xs py-1 focus:border-indigo-500 focus:outline-none text-slate-600 dark:text-slate-400 font-mono"
                                placeholder={`https://${social.id}.com/...`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* --- LINKS EDITOR --- */}
              {(selectedSection === "col1" || selectedSection === "col2") && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Column Title
                    </label>
                    <input
                      value={
                        data.columns.find((c) => c.id === selectedSection).title
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((prev) => ({
                          ...prev,
                          columns: prev.columns.map((c) =>
                            c.id === selectedSection ? { ...c, title: val } : c,
                          ),
                        }));
                      }}
                      className="input-field font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase block">
                      Links
                    </label>
                    {data.columns
                      .find((c) => c.id === selectedSection)
                      .links.map((link) => (
                        <div key={link.id} className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <input
                              value={link.label}
                              onChange={(e) =>
                                handleLinkUpdate(
                                  selectedSection,
                                  link.id,
                                  "label",
                                  e.target.value,
                                )
                              }
                              className="input-field py-2 text-xs font-bold"
                              placeholder="Label"
                            />
                            <input
                              value={link.href}
                              onChange={(e) =>
                                handleLinkUpdate(
                                  selectedSection,
                                  link.id,
                                  "href",
                                  e.target.value,
                                )
                              }
                              className="input-field py-2 text-xs font-mono text-slate-500"
                              placeholder="/url"
                            />
                          </div>
                          <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-fit mt-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    <button className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-3 h-3" /> Add Link
                    </button>
                  </div>
                </div>
              )}

              {/* --- STORE EDITOR --- */}
              {selectedSection === "store" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-1">
                      <Upload className="w-3 h-3" /> Store Image
                    </label>
                    <div
                      onClick={() => storeImgRef.current?.click()}
                      className="group relative aspect-video rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden"
                    >
                      {previews.store || data.store.image ? (
                        <>
                          <img
                            src={previews.store || data.store.image}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <Upload className="w-6 h-6 mb-2" />
                            <span className="text-xs font-bold">Replace Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                          <span className="text-[10px] font-bold text-slate-400">
                            Click to Upload
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        ref={storeImgRef}
                        onChange={(e) => handleImageChange(e, "store")}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Badge
                    </label>
                    <input
                      value={data.store.badge}
                      onChange={(e) =>
                        handleUpdate("store", "badge", e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      City Name
                    </label>
                    <input
                      value={data.store.city}
                      onChange={(e) =>
                        handleUpdate("store", "city", e.target.value)
                      }
                      className="input-field font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Address Line
                    </label>
                    <textarea
                      value={data.store.address}
                      onChange={(e) =>
                        handleUpdate("store", "address", e.target.value)
                      }
                      className="input-field resize-none h-20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Opening Hours
                    </label>
                    <input
                      value={data.store.hours}
                      onChange={(e) =>
                        handleUpdate("store", "hours", e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* --- NEWSLETTER EDITOR --- */}
              {selectedSection === "newsletter" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Title
                    </label>
                    <input
                      value={data.newsletter.title}
                      onChange={(e) =>
                        handleUpdate("newsletter", "title", e.target.value)
                      }
                      className="input-field font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Subtitle
                    </label>
                    <textarea
                      value={data.newsletter.subtitle}
                      onChange={(e) =>
                        handleUpdate("newsletter", "subtitle", e.target.value)
                      }
                      className="input-field resize-none h-24"
                    />
                  </div>
                </div>
              )}

              {/* --- BOTTOM EDITOR --- */}
              {selectedSection === "bottom" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Copyright Text
                    </label>
                    <textarea
                      value={data.bottom.copyright}
                      onChange={(e) =>
                        handleUpdate("bottom", "copyright", e.target.value)
                      }
                      className="input-field resize-none h-20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setSelectedSection(null)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <CheckCircle2 className="w-4 h-4" /> Done Editing
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Layout className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              Footer Editor
            </h3>
            <p className="text-sm mt-2 max-w-[200px]">
              Click on any section (Links, Store, Newsletter) to edit.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .input-field {
          @apply w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all;
        }
      `}</style>
    </div>
  );
}
