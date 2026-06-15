"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Upload,
  Plus,
  Trash2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const STORAGE_BASE = API_BASE?.replace("/api/v1", "");

export default function HeroManagerPage() {
  const { data: session } = useSession();

  const [slides, setSlides] = useState([]);
  const [selectedSlideId, setSelectedSlideId] = useState(null);

  // Per-slot image files
  const [imageFiles, setImageFiles] = useState({});
  // Per-slot local preview URLs
  const [imagePreviews, setImagePreviews] = useState({});

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const selectedSlide = slides.find(s => s.id === selectedSlideId);

  // --- FETCH CMS DATA ON MOUNT ---
  useEffect(() => {
    if (!session?.accessToken) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/cms`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        });
        const data = await res.json();

        if (data?.data?.home_hero_slides && Array.isArray(data.data.home_hero_slides)) {
          // ensure absolute URLs for images from backend
          const parsedSlides = data.data.home_hero_slides.map(slide => ({
            ...slide,
            image: slide.image ? (slide.image.startsWith("http") ? slide.image : `${STORAGE_BASE}${slide.image}`) : ""
          }));
          setSlides(parsedSlides);
        } else {
            // Default 3 slides if none exist
            setSlides([
                { id: "slide_1", image: "/banner-1.png", alt: "Foreign Emporium Banner 1", link: "" },
                { id: "slide_2", image: "/banner-2.png", alt: "Foreign Emporium Banner 2", link: "" },
                { id: "slide_3", image: "/banner-3.png", alt: "Foreign Emporium Banner 3", link: "" }
            ]);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    })();
  }, [session]);

  const handleAddSlide = () => {
    const newId = `slide_${Date.now()}`;
    setSlides(prev => [...prev, { id: newId, image: "", alt: "New Banner", link: "" }]);
    setSelectedSlideId(newId);
  };

  const handleRemoveSlide = (id) => {
    setSlides(prev => prev.filter(s => s.id !== id));
    if (selectedSlideId === id) setSelectedSlideId(null);
    setImageFiles(prev => { const n = {...prev}; delete n[id]; return n; });
    setImagePreviews(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  // --- UPDATE HANDLER ---
  const handleUpdate = (e) => {
    if (!selectedSlideId) return;
    const { name, value } = e.target;
    setSlides((prev) =>
      prev.map((item) =>
        item.id === selectedSlideId ? { ...item, [name]: value } : item
      )
    );
  };

  // --- IMAGE FILE PICKER ---
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedSlideId) return;
    const previewUrl = URL.createObjectURL(file);

    setImageFiles((prev) => ({ ...prev, [selectedSlideId]: file }));
    setImagePreviews((prev) => ({ ...prev, [selectedSlideId]: previewUrl }));

    // Update the grid item's displayed image
    setSlides((prev) =>
      prev.map((item) =>
        item.id === selectedSlideId ? { ...item, image: previewUrl } : item
      )
    );
  };

  // --- SAVE TO API ---
  const handleSave = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      
      // Clean up slides data for saving (remove full domain from images if needed, but backend doesn't care)
      // The backend will overwrite the image path if a file is uploaded for that slide.
      formData.append("slidesData", JSON.stringify(slides));

      // Append files
      Object.keys(imageFiles).forEach(slideId => {
          formData.append(`image_${slideId}`, imageFiles[slideId]);
      });

      const res = await fetch(`${API_BASE}/admin/cms/hero`, {
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
      setImageFiles({}); // Clear files since they are uploaded
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
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading CMS data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* 1. MAIN PREVIEW AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Hero Slider Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage the banners shown in the homepage hero slider.
            </p>
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
              {isSaving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" /> Save Slider</>
              )}
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-8 max-w-[1000px] mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Slides ({slides.length})</h2>
                <button 
                    onClick={handleAddSlide}
                    className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Slide
                </button>
            </div>

          <div className="space-y-4">
            {slides.map((item, index) => {
              const displayImage = imagePreviews[item.id] || item.image || "/placeholder-image.png";
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSlideId(item.id)}
                  className={`
                    relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 flex items-center bg-white dark:bg-slate-900 p-4 gap-4
                    ${
                      selectedSlideId === item.id
                        ? "border-indigo-500 ring-4 ring-indigo-500/20 scale-[0.99]"
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }
                  `}
                >
                    <div className="font-bold text-slate-400 w-8 text-center">{index + 1}</div>
                    <div className="w-40 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 relative">
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={item.alt}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                  
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                            {item.alt || "Untitled Slide"}
                        </h3>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSlide(item.id); }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
                        title="Remove Slide"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              );
            })}
            
            {slides.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No slides added yet.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. EDITOR SIDEBAR */}
      <div
        className={`
          w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 
          flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out z-20 absolute right-0 lg:relative
          ${selectedSlideId ? "translate-x-0" : "translate-x-full lg:translate-x-0 lg:hidden"}
        `}
      >
        {selectedSlide ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Editing Slide
                </span>
                <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {selectedSlide.alt || "Untitled"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSlideId(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Image — with file upload */}
                <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Slide Image (Desktop aspect ~ 17:9)
                </label>
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-2 bg-slate-100 dark:bg-slate-800 relative">
                    {(imagePreviews[selectedSlide.id] || selectedSlide.image) ? (
                        <img
                            src={imagePreviews[selectedSlide.id] || selectedSlide.image}
                            className="w-full h-full object-cover"
                            alt="Preview"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    {imageFiles[selectedSlide.id] ? imageFiles[selectedSlide.id].name : "Upload New Image"}
                </button>
                </div>

                <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Type className="w-3 h-3" /> Image Alt Text / Label
                    </label>
                    <input
                    type="text"
                    name="alt"
                    value={selectedSlide.alt || ""}
                    onChange={handleUpdate}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? "Saving…" : "Save to API"}
                  </button>
                  <button
                    onClick={() => setSelectedSlideId(null)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Done
                  </button>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              No Slide Selected
            </h3>
            <p className="text-sm mt-2 max-w-[200px]">
              Click on a slide from the list to start editing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
