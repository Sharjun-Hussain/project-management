"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {Store,
  CreditCard,
  Users,
  Smartphone,
  Mail,
  Shield,
  Database,
  FileSpreadsheet,
  Download,
  Upload,
  File,
  Check,
  AlertCircle,
  Coins,
  Save,
  Link2,
  Copy,
  CheckCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowLeftRight,
  Eye,
  EyeOff, Settings} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useGlobalSettings } from "../context/GlobalSettingsContext";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getSettings, saveSettings, exportDatabaseBackup } from "../../lib/api/settings";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- SUB-COMPONENTS ---
const SaveBtn = ({ sectionKey, onClick, isSaving }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isSaving}
    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
  >
    <Save className="w-3.5 h-3.5" />
    {isSaving ? "Saving…" : "Save"}
  </button>
);

const SectionHeader = ({ icon: Icon, title, description, colorClass }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
  </div>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
let BASE_URL = "";
try {
  if (API_BASE_URL) {
    BASE_URL = new URL(API_BASE_URL).origin;
  }
} catch (e) {
  console.error("Invalid NEXT_PUBLIC_API_BASE_URL:", API_BASE_URL);
}

const formatUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

const profileDetailsSchema = z.object({
  adminName: z.string().min(2, "Display name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export default function SettingsPage() {
  const containerRef = useRef(null);
  const { data: session } = useSession();
  const { currency, updateCurrency } = useCurrency();
  const { 
    businessName, 
    logoUrl, 
    footerText, 
    adminEmail, 
    adminName, 
    updateSettings,
    refreshSettings,
    accentColorsMap,
    accentColor,
  } = useGlobalSettings();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState("store");
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sectionSaving, setSectionSaving] = useState({});
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedAccentColor, setSelectedAccentColor] = useState("indigo");

  // --- POS INTEGRATION STATE ---
  const [pos, setPos] = useState({
    enabled: false,
    backendUrl: "",
    inboundToken: "",
    webhookSecret: "",
  });
  const [posTestStatus, setPosTestStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [copiedKey, setCopiedKey] = useState(null); // which field was just copied
  const [showPosToken, setShowPosToken] = useState(false);
  const [showPosSecret, setShowPosSecret] = useState(false);

  useEffect(() => {
    if (accentColor) setSelectedAccentColor(accentColor);
  }, [accentColor]);

  // Form A: Profile Details (Read-only by default, toggled with edit button)
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      adminName: "",
      adminEmail: "",
    },
  });

  // Form B: Password Security (Always active, separated button)
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setValue: setPasswordValue,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  // Sync loaded settings from global context to form fields
  useEffect(() => {
    if (adminName) setProfileValue("adminName", adminName);
    if (adminEmail) setProfileValue("adminEmail", adminEmail);
  }, [adminName, adminEmail, setProfileValue]);

  // Logo & Favicon file refs for upload
  const logoFileRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const faviconFileRef = useRef(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  // --- STORE STATE (populated from API) ---
  const [store, setStore] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dashboardTitle: "",
    faviconUrl: null,
    orderIdFormat: "#ORD-{number}",
  });

  const [payments, setPayments] = useState({
    cod: true,
    googlePay: false,
    koko: false,
  });

  const [integrations, setIntegrations] = useState({
    whatsappNumber: "",
    whatsappEnabled: true,
    apiKey: "",
    webhookUrl: "",
  });

  const [smtp, setSmtp] = useState({
    host: "",
    port: "587",
    user: "",
  });

  const [notifications, setNotifications] = useState({
    orderEnabled: true,
    orderEmail: "",
    customerEnabled: true,
    lowStockEnabled: true,
  });

  // --- FETCH SETTINGS ON MOUNT ---
  useEffect(() => {
    if (!session?.accessToken) return;
    const loadSettings = async () => {
      try {
        const data = await getSettings(session.accessToken);
        // Populate all form sections from API data
        setStore((prev) => ({
          ...prev,
          name: data.site_name || "",
          email: data.shop_email || "",
          phone: data.shop_phone || "",
          address: data.shop_address || "",
          dashboardTitle: data.admin_dashboard_title || "",
          faviconUrl: formatUrl(data.site_favicon),
        }));
        setIntegrations((prev) => ({
          ...prev,
          whatsappNumber: data.shop_phone || "",
        }));
        setSmtp((prev) => ({
          ...prev,
          host: data.smtp_host || "",
          port: data.smtp_port || "587",
          user: data.smtp_user || "",
        }));
        // Notifications
        setNotifications((prev) => ({
          ...prev,
          orderEnabled: data.order_notification_enabled === "1",
          orderEmail: data.order_notification_email || "",
          customerEnabled: data.customer_order_notification_enabled === "1",
          lowStockEnabled: data.low_stock_alert_enabled === "1",
        }));
        // POS Integration
        setPos({
          enabled: data.pos_integration_enabled === "true" || data.pos_integration_enabled === "1",
          backendUrl: data.pos_backend_url || "",
          inboundToken: data.pos_inbound_token || "",
          webhookSecret: data.pos_webhook_secret || "",
        });

        // Sync global context fields too
        updateSettings({
          businessName: data.site_name || businessName,
          logoUrl: formatUrl(data.site_logo) || logoUrl,
          footerText: data.footer_text || footerText,
          adminEmail: data.shop_email || adminEmail,
          adminName: data.admin_name || adminName,
        });
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    loadSettings();
  }, [session?.accessToken]);

  // --- LOGO FILE HANDLER ---
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaviconPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const [team, setTeam] = useState([
    {
      id: 1,
      name: "Rusiru Perera",
      role: "Owner",
      email: "rusiru@store.lk",
      avatar: "https://i.pravatar.cc/150?u=1",
    },
    {
      id: 2,
      name: "Fatima R.",
      role: "Manager",
      email: "fatima@store.lk",
      avatar: "https://i.pravatar.cc/150?u=2",
    },
  ]);

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );
      tl.fromTo(
        ".animate-section",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05 },
        "-=0.5",
      );
    },
    { scope: containerRef },
  );



  // --- SCROLL SPY LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "store",
        "payments",
        "integrations",
        "data",
        "smtp",
        "pos",
      ];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveTab(section);
            break;
          } else if (rect.top < 0 && rect.bottom > 100) {
            setActiveTab(section);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- HANDLERS ---
  const scrollToSection = (id) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // --- PER-SECTION SAVE ---
  const saveSection = async (sectionKey, buildFormData) => {
    if (!session?.accessToken) {
      toast.error("Authentication required. Please log in again.");
      console.error("[Settings] No access token found.");
      return;
    }

    setSectionSaving((prev) => ({ ...prev, [sectionKey]: true }));
    try {
      const formData = buildFormData();
      const response = await saveSettings(session.accessToken, formData);
      
      toast.success(`${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} settings saved!`);
      setHasChanges(false);
      refreshSettings();
    } catch (error) {
      console.error(`[Settings] ${sectionKey} save error:`, error);
      toast.error(error.message || `Failed to save ${sectionKey} settings`);
    } finally {
      setSectionSaving((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };

  const onProfileDetailsSubmit = async (data) => {
    if (!session?.accessToken) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    setSectionSaving((prev) => ({ ...prev, profile: true }));
    try {
      // 1. Save general site EAV fallback settings
      const fd = new FormData();
      fd.append("admin_name", data.adminName);
      fd.append("shop_email", data.adminEmail);
      await saveSettings(session.accessToken, fd);

      // 2. Update real logged-in user profile account in the database (PUT /api/v1/admin/profile)
      const profileRes = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: data.adminName,
          email: data.adminEmail
        })
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        throw new Error(errData.message || "Failed to update admin account profile");
      }

      toast.success("Profile details updated successfully!");
      setIsEditingProfile(false);
      setHasChanges(false);
      refreshSettings();
    } catch (error) {
      console.error(`[Settings] Profile details save error:`, error);
      toast.error(error.message || `Failed to save profile details`);
    } finally {
      setSectionSaving((prev) => ({ ...prev, profile: false }));
    }
  };

  const onPasswordSubmit = async (data) => {
    if (!session?.accessToken) {
      toast.error("Authentication required.");
      return;
    }

    setSectionSaving((prev) => ({ ...prev, password: true }));
    try {
      const pwRes = await fetch(`${API_BASE_URL}/admin/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      if (!pwRes.ok) {
        const errData = await pwRes.json();
        throw new Error(errData.message || "Failed to update account password");
      }

      toast.success("Password updated successfully!");
      resetPasswordForm();
      setHasChanges(false);
    } catch (error) {
      console.error(`[Settings] Password update error:`, error);
      toast.error(error.message || `Failed to update password`);
    } finally {
      setSectionSaving((prev) => ({ ...prev, password: false }));
    }
  };

  const handleBackupDownload = async () => {
    if (!session?.accessToken) {
      toast.error("Authentication required.");
      return;
    }

    setIsBackingUp(true);
    const downloadToastId = toast.loading("Preparing database backup...");

    try {
      const blob = await exportDatabaseBackup(session.accessToken);
      
      // Create a link to download the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      link.setAttribute("download", `backup_${timestamp}.sql`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Database backup downloaded successfully!", { id: downloadToastId });
    } catch (error) {
      console.error("[Backup] Download error:", error);
      toast.error(error.message || "Failed to download backup.", { id: downloadToastId });
    } finally {
      setIsBackingUp(false);
    }
  };


  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white px-8 py-6 pb-32"
    >
      {/* 1. PAGE HEADER */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="animate-header">
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage store details, payments, bulk data, and team access.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* 2. SIDEBAR NAVIGATION */}
        <div className="hidden lg:block lg:col-span-3">
          <nav className="sticky top-24 self-start space-y-1 animate-section">
            {[
              { id: "store", label: "General Store", icon: Store },
              { id: "profile", label: "Profile Settings", icon: Users },
              // { id: "payments", label: "Payment Methods", icon: CreditCard },
              // { id: "notifications", label: "Notifications", icon: AlertCircle },
              // { id: "integrations", label: "WhatsApp & API", icon: Smartphone },
              { id: "data", label: "Import / Export", icon: Database },
              { id: "pos", label: "POS Integration", icon: ArrowLeftRight },
              // { id: "smtp", label: "SMTP Email", icon: Mail },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === item.id ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 ring-1 ring-indigo-50 dark:ring-indigo-900/50 translate-x-2" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <item.icon
                  className={`w-4 h-4 ${activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}
                />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 3. SETTINGS CONTENT */}
        <div className="lg:col-span-9 space-y-10">
          {/* A. GENERAL STORE */}
          <section id="store" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={Store}
                title="General Store"
                description="Manage your global business identity and contact details."
                colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              />
              <div className="space-y-8">
                {/* Logo Upload */}
                {/* Compact Media Upload Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-4">
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                        {logoPreview || logoUrl ? (
                          <img src={logoPreview || logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-transform hover:scale-110"
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Logo</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Login & sidebar icon.</p>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    <input
                      ref={faviconFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFaviconChange}
                    />
                    <div className="relative group shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                        {faviconPreview || store.faviconUrl ? (
                          <img src={faviconPreview || store.faviconUrl} alt="Favicon" className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-300">ICO</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => faviconFileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-lg transition-transform hover:scale-110"
                      >
                        <Upload className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Site Favicon</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Browser tab icon.</p>
                    </div>
                  </div>
                </div>

                {/* Brand Accent Color */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                        Brand Accent Color
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Select the primary accent color applied across your shop dashboard.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {accentColorsMap && Object.entries(accentColorsMap).map(([key, value]) => {
                        const isSelected = selectedAccentColor === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedAccentColor(key);
                              // Real-time preview by updating css variables instantly!
                              document.documentElement.style.setProperty("--accent-color", value.primary);
                              document.documentElement.style.setProperty("--accent-hover", value.hover);
                              document.documentElement.style.setProperty("--accent-light", value.light);
                              setHasChanges(true);
                            }}
                            title={value.name}
                            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center relative hover:scale-110 active:scale-95 cursor-pointer ${
                              isSelected ? "ring-2 ring-slate-800 dark:ring-white ring-offset-2 dark:ring-offset-slate-900 scale-105" : "hover:shadow-sm"
                            }`}
                            style={{ backgroundColor: value.primary }}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => {
                        updateSettings({ businessName: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={store.phone}
                      onChange={(e) => {
                        setStore((prev) => ({ ...prev, phone: e.target.value }));
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={store.email}
                      disabled
                      className="w-full bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 outline-none transition-all font-medium cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Dashboard Title
                    </label>
                    <input
                      type="text"
                      value={store.dashboardTitle}
                      onChange={(e) => {
                        setStore((prev) => ({ ...prev, dashboardTitle: e.target.value }));
                        setHasChanges(true);
                      }}
                      placeholder="Admin Dashboard"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Shop Address
                    </label>
                    <textarea
                      rows={2}
                      value={store.address}
                      onChange={(e) => {
                        setStore((prev) => ({ ...prev, address: e.target.value }));
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Global Footer Text
                    </label>
                    <textarea
                      rows={2}
                      value={footerText}
                      onChange={(e) => {
                        updateSettings({ footerText: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
              {/* Section Save */}
              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="store"
                  isSaving={sectionSaving["store"]}
                  onClick={() =>
                    saveSection("store", () => {
                      const fd = new FormData();
                      fd.append("site_name", businessName || "");
                      fd.append("shop_phone", store.phone || "");
                      fd.append("shop_email", store.email || "");
                      fd.append("shop_address", store.address || "");
                      fd.append("admin_dashboard_title", store.dashboardTitle || "");
                      fd.append("footer_text", footerText || "");
                      fd.append("site_accent_color", selectedAccentColor);
                      
                      const logoFile = logoFileRef.current?.files[0];
                      if (logoFile) fd.append("site_logo", logoFile);
                      
                      const faviconFile = faviconFileRef.current?.files[0];
                      if (faviconFile) fd.append("site_favicon", faviconFile);
                      
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>

          {/* NEW SECTION: PROFILE SETTINGS */}
          <section id="profile" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-8">
              
              {/* BLOCK A: PROFILE DETAILS */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <SectionHeader
                    icon={Users}
                    title="Profile Details"
                    description="Your personal information displayed across the system."
                    colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                  />
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Display Name
                    </label>
                    <input
                      type="text"
                      {...registerProfile("adminName")}
                      readOnly={!isEditingProfile}
                      onChange={(e) => {
                        registerProfile("adminName").onChange(e);
                        updateSettings({ adminName: e.target.value });
                        setHasChanges(true);
                      }}
                      className={`w-full border rounded-xl px-4 py-3 text-sm dark:text-white outline-none transition-all font-medium ${
                        isEditingProfile 
                          ? "bg-slate-50 dark:bg-slate-900 border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600" 
                          : "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-500"
                      }`}
                    />
                    {profileErrors.adminName && (
                      <p className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {profileErrors.adminName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Email Address
                    </label>
                    <input
                      type="email"
                      {...registerProfile("adminEmail")}
                      readOnly
                      disabled
                      className="w-full border bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-all font-medium"
                    />
                    {profileErrors.adminEmail && (
                      <p className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {profileErrors.adminEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileValue("adminName", adminName);
                        setProfileValue("adminEmail", adminEmail);
                        setIsEditingProfile(false);
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProfileSubmit(onProfileDetailsSubmit)}
                      disabled={sectionSaving["profile"]}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {sectionSaving["profile"] ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                )}
              </div>

              {/* BLOCK B: SECURITY & PASSWORD */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                <SectionHeader
                  icon={Shield}
                  title="Security & Password"
                  description="Change your login credentials to secure your account."
                  colorClass="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  className="mb-6"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword("currentPassword")}
                      onChange={(e) => {
                        registerPassword("currentPassword").onChange(e);
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition-all font-medium"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword("newPassword")}
                      onChange={(e) => {
                        registerPassword("newPassword").onChange(e);
                        setHasChanges(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500 outline-none transition-all font-medium"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit(onPasswordSubmit)}
                    disabled={sectionSaving["password"]}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {sectionSaving["password"] ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* A2. CURRENCY SETTINGS */}
          {/* 
          <section className="animate-section">
             <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={Coins}
                title="Currency Settings"
                description="Set the default currency for your store."
                colorClass="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
              />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Store Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const selected = e.target.value;
                    let sym = "Rs.";
                    if (selected === "usd") sym = "$";
                    if (selected === "eur") sym = "€";
                    if (selected === "gbp") sym = "£";
                    updateCurrency(selected.toUpperCase(), sym);
                    setHasChanges(true);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all font-medium"
                >
                  <option value="lkr">Sri Lankan Rupee (LKR)</option>
                  <option value="usd">US Dollar (USD)</option>
                  <option value="eur">Euro (EUR)</option>
                  <option value="gbp">British Pound (GBP)</option>
                </select>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="currency"
                  isSaving={sectionSaving["currency"]}
                  onClick={() =>
                    saveSection("currency", () => {
                      const fd = new FormData();
                      fd.append("currency", currency.toLowerCase());
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>
          */}

          {/* B. PAYMENT METHODS */}
          {/* 
          <section id="payments" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={CreditCard}
                title="Payment Methods"
                description="Manage COD, Koko, and Card payments."
                colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-900/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm text-green-600 dark:text-green-400 font-bold">
                      COD
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Cash on Delivery
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Collect payment upon product delivery.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={payments.cod}
                      onChange={() => {
                        setPayments({ ...payments, cod: !payments.cod });
                        setHasChanges(true);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="payments"
                  isSaving={sectionSaving["payments"]}
                  onClick={() =>
                    saveSection("payments", () => {
                      const fd = new FormData();
                      fd.append("cod_enabled", payments.cod ? "1" : "0");
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>
          */}

          {/* C. NOTIFICATIONS */}
          {/* 
          <section id="notifications" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={AlertCircle}
                title="Notifications & Alerts"
                description="Configure email notifications for orders and stock alerts."
                colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Order Notifications</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receive an email whenever a new order is placed.</p>
                    {notifications.orderEnabled && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Notification Email</label>
                        <input 
                          type="email"
                          value={notifications.orderEmail}
                          onChange={(e) => {
                            setNotifications(prev => ({ ...prev, orderEmail: e.target.value }));
                            setHasChanges(true);
                          }}
                          placeholder="admin@gmail.com"
                          className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.orderEnabled}
                      onChange={() => {
                        setNotifications(prev => ({ ...prev, orderEnabled: !prev.orderEnabled }));
                        setHasChanges(true);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Order Notifications</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Send confirmation emails to customers after they place an order.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.customerEnabled}
                      onChange={() => {
                        setNotifications(prev => ({ ...prev, customerEnabled: !prev.customerEnabled }));
                        setHasChanges(true);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Low Stock Alerts</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get notified when product stock levels fall below the threshold.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.lowStockEnabled}
                      onChange={() => {
                        setNotifications(prev => ({ ...prev, lowStockEnabled: !prev.lowStockEnabled }));
                        setHasChanges(true);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="notifications"
                  isSaving={sectionSaving["notifications"]}
                  onClick={() =>
                    saveSection("notifications", () => {
                      const fd = new FormData();
                      fd.append("order_notification_enabled", notifications.orderEnabled ? "1" : "0");
                      fd.append("order_notification_email", notifications.orderEmail || "");
                      fd.append("customer_order_notification_enabled", notifications.customerEnabled ? "1" : "0");
                      fd.append("low_stock_alert_enabled", notifications.lowStockEnabled ? "1" : "0");
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>
          */}

          {/* D. INTEGRATIONS */}
          {/*
          <section id="integrations" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={Smartphone}
                title="Integrations & Automation"
                description="Connect WhatsApp and n8n for automation."
                colorClass="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Admin Mobile Number
                </label>
                <input
                  type="text"
                  value={integrations.whatsappNumber}
                  onChange={(e) => {
                    setIntegrations((prev) => ({ ...prev, whatsappNumber: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-green-500 outline-none transition-all font-medium font-mono"
                />
              </div>
              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="integrations"
                  isSaving={sectionSaving["integrations"]}
                  onClick={() =>
                    saveSection("integrations", () => {
                      const fd = new FormData();
                      fd.append("whatsapp_number", integrations.whatsappNumber || "");
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>
          */}

          {/* D. BULK DATA MANAGEMENT (NEW SECTION) */}
          <section id="data" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={Database}
                title="Bulk Data Management"
                description="Import products and manage system data."
                colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              />

              <div className="max-w-2xl">
                {/* 2. IMPORT DATA */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Import Data
                    </h3>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3" /> Download Template
                    </button>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Click or drag file to upload
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports CSV or Excel (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. SYSTEM DATABASE BACKUP */}
              <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full System Backup</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                        Download a complete SQL dump of your database including products, orders, customers, and system settings.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleBackupDownload}
                    disabled={isBackingUp}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                  >
                    {isBackingUp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Start Database Backup
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* E. SMTP EMAIL (commented out) */}
          {/*
          <section id="smtp" className="animate-section scroll-mt-32">
            ...
          </section>
          */}

          {/* F. POS INTEGRATION */}
          <section id="pos" className="animate-section scroll-mt-32">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              <SectionHeader
                icon={ArrowLeftRight}
                title="POS Integration"
                description="Connect this e-commerce store with your iGen POS system for real-time stock sync and automatic order creation."
                colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              />

              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 mb-6">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Enable POS Sync</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Activates real-time stock updates and automatic sale creation in POS when orders are placed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPos(p => ({ ...p, enabled: !p.enabled })); setHasChanges(true); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    pos.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    pos.enabled ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <div className="space-y-8">

                {/* ── OUTBOUND: What YOU fill in (from POS settings) ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Outbound Connection</h3>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      E-commerce → POS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Copy these values from your POS Settings → E-commerce Integration page and paste them here.
                  </p>

                  <div className="grid grid-cols-1 gap-5">
                    {/* POS Backend URL */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        POS Backend URL
                      </label>
                      <input
                        type="url"
                        value={pos.backendUrl}
                        onChange={e => { setPos(p => ({ ...p, backendUrl: e.target.value })); setHasChanges(true); }}
                        placeholder="https://your-pos-api.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white font-mono focus:border-emerald-500 outline-none transition-all"
                      />
                      <p className="text-[11px] text-slate-400">
                        The base URL of your POS backend server.
                      </p>
                    </div>

                    {/* POS Inbound Token */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        POS Inbound Token
                      </label>
                      <div className="relative">
                        <input
                          type={showPosToken ? "text" : "password"}
                          value={pos.inboundToken}
                          onChange={e => { setPos(p => ({ ...p, inboundToken: e.target.value })); setHasChanges(true); }}
                          placeholder="pos_inbound_xxxxxxxxxxxxxxxx"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm dark:text-white font-mono focus:border-emerald-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPosToken(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPosToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Copy the <strong className="text-slate-600 dark:text-slate-300">Authorization Bearer Client Token</strong> from the POS Inbound Checkout Webhook section.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── INBOUND: What YOUR WEBSITE provides (copy to POS) ── */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-1 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Inbound Credentials</h3>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                      POS → E-commerce
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Copy these values and paste them into your POS Settings → E-commerce Integration page.
                  </p>

                  <div className="grid grid-cols-1 gap-5">

                    {/* E-commerce Webhook URL (read-only copyable) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Client Store Webhook URL
                        <span className="ml-2 text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full normal-case">Copy → Paste in POS</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-nowrap select-all">
                          {typeof window !== "undefined" ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") || window.location.origin.replace("3001", "5000")}/api/webhooks/pos-inventory-sync` : "/api/webhooks/pos-inventory-sync"}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") || ""}/api/webhooks/pos-inventory-sync`;
                            navigator.clipboard.writeText(url);
                            setCopiedKey("webhookUrl");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          {copiedKey === "webhookUrl" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === "webhookUrl" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Paste this into POS → <strong className="text-slate-600 dark:text-slate-300">Client Store Webhook URL</strong> field.
                      </p>
                    </div>

                    {/* POS Webhook Secret (the token POS uses to authenticate stock updates) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Client Store API Authorization Bearer Token
                        <span className="ml-2 text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full normal-case">Copy → Paste in POS</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            readOnly
                            type={showPosSecret ? "text" : "password"}
                            value={pos.webhookSecret}
                            className="w-full bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 font-mono text-xs text-slate-600 dark:text-slate-300 outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPosSecret(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPosSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(pos.webhookSecret);
                            setCopiedKey("webhookSecret");
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          disabled={!pos.webhookSecret}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          {copiedKey === "webhookSecret" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === "webhookSecret" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Paste this into POS → <strong className="text-slate-600 dark:text-slate-300">Client Store API Authorization Bearer Token</strong> field.
                        This is set via <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-[10px]">POS_WEBHOOK_SECRET</code> in your backend <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-[10px]">.env</code>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    disabled={!pos.backendUrl || !pos.inboundToken || posTestStatus === "testing"}
                    onClick={async () => {
                      setPosTestStatus("testing");
                      try {
                        const res = await fetch(`${API_BASE_URL}/admin/settings/pos-test`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.accessToken}`,
                          },
                          body: JSON.stringify({ pos_backend_url: pos.backendUrl, pos_inbound_token: pos.inboundToken }),
                        });
                        const data = await res.json();
                        setPosTestStatus(data.success ? "ok" : "fail");
                        if (data.success) toast.success("POS connection verified!");
                        else toast.error(data.message || "POS connection failed.");
                      } catch (e) {
                        setPosTestStatus("fail");
                        toast.error("Could not reach POS backend.");
                      } finally {
                        setTimeout(() => setPosTestStatus(null), 5000);
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    {posTestStatus === "testing" ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...</>
                    ) : posTestStatus === "ok" ? (
                      <><Wifi className="w-3.5 h-3.5 text-emerald-500" /> Connected</>  
                    ) : posTestStatus === "fail" ? (
                      <><WifiOff className="w-3.5 h-3.5 text-red-500" /> Failed</>
                    ) : (
                      <><Wifi className="w-3.5 h-3.5" /> Test POS Connection</>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Sends a ping to verify the POS backend URL and token are correct before saving.
                  </p>
                </div>
              </div>

              {/* Save */}
              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <SaveBtn
                  sectionKey="pos"
                  isSaving={sectionSaving["pos"]}
                  onClick={() =>
                    saveSection("pos", () => {
                      const fd = new FormData();
                      fd.append("pos_integration_enabled", pos.enabled ? "true" : "false");
                      fd.append("pos_backend_url", pos.backendUrl || "");
                      fd.append("pos_inbound_token", pos.inboundToken || "");
                      return fd;
                    })
                  }
                />
              </div>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}
