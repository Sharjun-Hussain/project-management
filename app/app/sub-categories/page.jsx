"use client";

import React, { useState, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";

// --- MOCK DATA ---
const INITIAL_SUB_CATEGORIES = [
  {
    id: 1,
    name: "Running Shoes",
    slug: "running-shoes",
    parent: "Shoes",
    count: 45,
    status: "Active",
  },
  {
    id: 2,
    name: "Gaming Laptops",
    slug: "gaming-laptops",
    parent: "Laptops",
    count: 23,
    status: "Active",
  },
  {
    id: 3,
    name: "Wireless Earbuds",
    slug: "wireless-earbuds",
    parent: "Audio",
    count: 67,
    status: "Active",
  },
  {
    id: 4,
    name: "DSLR Cameras",
    slug: "dslr-cameras",
    parent: "Cameras",
    count: 12,
    status: "Draft",
  },
  {
    id: 5,
    name: "Smart Watches",
    slug: "smart-watches",
    parent: "Wearables",
    count: 89,
    status: "Active",
  },
];

export default function SubCategoryManagementPage() {
  const containerRef = useRef(null);
  const [categories, setCategories] = useState(INITIAL_SUB_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  // --- MODAL STATES ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- REFS ---
  const formOverlayRef = useRef(null);
  const formContentRef = useRef(null);
  const deleteOverlayRef = useRef(null);
  const deleteContentRef = useRef(null);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent: "Shoes", // Default parent
    status: "Active",
    description: "",
  });

  // ------------------------------------------------------------------
  // 1. PAGE LOAD ANIMATION
  // ------------------------------------------------------------------
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Header elements slide down smoothly
      tl.fromTo(
        ".animate-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 },
      );

      // Toolbar fades in
      tl.fromTo(
        ".animate-toolbar",
        { y: 10, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        "-=0.4",
      );
    },
    { scope: containerRef },
  );

  // ------------------------------------------------------------------
  // 2. GRID/LIST SWITCH ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    // Kill any existing animations on these items to prevent glitches
    gsap.killTweensOf(".category-item");

    // Animate items in with a satisfying "pop" and stagger
    gsap.fromTo(
      ".category-item",
      {
        y: 20,
        opacity: 0,
        scale: 0.95,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.04,
        ease: "expo.out",
        clearProps: "all",
      },
    );
  }, [viewMode, categories, searchTerm]);

  // ------------------------------------------------------------------
  // 3. FORM DRAWER ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isFormOpen && formContentRef.current) {
      // Overlay Fade
      gsap.fromTo(
        formOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
      // Drawer Slide
      gsap.fromTo(
        formContentRef.current,
        { x: "100%" },
        { x: "0%", duration: 0.6, ease: "power4.out" },
      );
    }
  }, [isFormOpen]);

  // ------------------------------------------------------------------
  // 4. DELETE MODAL ANIMATION
  // ------------------------------------------------------------------
  useGSAP(() => {
    if (isDeleteOpen && deleteContentRef.current) {
      gsap.fromTo(
        deleteOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
      );
      gsap.fromTo(
        deleteContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.4)" },
      );
    }
  }, [isDeleteOpen]);

  // --- HANDLERS WITH EXIT ANIMATIONS ---

  const closeFormWithAnim = () => {
    if (!formContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsFormOpen(false) });

    // Slide out slightly faster than slide in
    tl.to(formContentRef.current, {
      x: "100%",
      duration: 0.4,
      ease: "power3.in",
    }).to(formOverlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
  };

  const closeDeleteWithAnim = () => {
    if (!deleteContentRef.current) return;
    const tl = gsap.timeline({ onComplete: () => setIsDeleteOpen(false) });

    tl.to(deleteContentRef.current, {
      scale: 0.95,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    }).to(deleteOverlayRef.current, { opacity: 0, duration: 0.2 }, "<");
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormData({
      name: "",
      slug: "",
      parent: "Shoes",
      status: "Active",
      description: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormMode("edit");
    setSelectedCategory(category);
    setFormData({ ...category, description: "Sample description..." });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formMode === "create") {
      const newId = Math.max(...categories.map((c) => c.id)) + 1;
      setCategories([
        ...categories,
        { id: newId, count: 0, ...formData },
      ]);
    } else {
      setCategories(
        categories.map((c) =>
          c.id === selectedCategory.id ? { ...c, ...formData } : c,
        ),
      );
    }
    closeFormWithAnim();
  };

  const handleDeleteConfirm = () => {
    setCategories(categories.filter((c) => c.id !== selectedCategory.id));
    closeDeleteWithAnim();
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: val
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
    }));
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900 dark:text-white overflow-x-hidden px-8 py-6"
    >
      {/* 1. TOP BAR */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="animate-header">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Sub Category Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Manage your product sub-categories and organization.
            </p>
          </div>

          <div className="animate-header flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 will-change-transform"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Sub Category</span>
            </button>
          </div>
        </div>

        {/* 2. TOOLBAR */}
        <div className="animate-toolbar sticky top-4 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-2xl p-2 flex flex-col sm:flex-row gap-3 items-center justify-between will-change-transform">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute  inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-transparent rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-white focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-900 transition-all"
              placeholder="Search sub categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
            >
              <LayoutGrid className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
            >
              <ListIcon className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="mt-8 min-h-[500px]">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-header">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No sub categories found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="category-item group relative bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-500 ease-out cursor-pointer flex flex-col h-full will-change-transform"
                    >
                      {/* Text Area */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                            {cat.name}
                          </h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.status === "Active" ? "text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50" : "text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700"}`}
                          >
                            {cat.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                          <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                            {cat.slug}
                          </span>
                          {cat.parent && (
                            <span className="text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-indigo-400 dark:bg-indigo-500"></span>{" "}
                              {cat.parent}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer / Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50 mt-auto">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                          {cat.count} products
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(cat);
                            }}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDelete(cat);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-5 pl-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Sub Category
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Parent Category
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="p-5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                          Items
                        </th>
                        <th className="p-5 pr-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="category-item group hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors duration-200"
                        >
                          <td className="p-4 pl-8">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {cat.name}
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                  {cat.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {cat.parent}
                          </td>
                          <td className="p-4">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cat.status === "Active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}
                            >
                              {cat.status === "Active" ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <CircleDashed className="w-3 h-3" />
                              )}
                              {cat.status}
                            </div>
                          </td>
                          <td className="p-4 text-right text-sm font-bold text-slate-700 dark:text-slate-300">
                            {cat.count}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(cat)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- DRAWER / SIDE PANEL FORM --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            ref={formOverlayRef}
            className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm"
            onClick={closeFormWithAnim}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
            <div
              ref={formContentRef}
              className="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col h-full border-l border-slate-100 dark:border-slate-700"
            >
              {/* Drawer Header */}
              <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {formMode === "create"
                      ? "Add Sub Category"
                      : "Edit Sub Category"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Configure sub category details.
                  </p>
                </div>
                <button
                  onClick={closeFormWithAnim}
                  className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-tiny-scrollbar">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Sub Category Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="e.g. Running Shoes"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formData.slug}
                        className="w-full bg-slate-100 dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:border-indigo-500 outline-none appearance-none"
                      >
                        <option className="dark:bg-slate-800" value="Active">Active</option>
                        <option className="dark:bg-slate-800" value="Draft">Draft</option>
                        <option className="dark:bg-slate-800" value="Hidden">Hidden</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Parent Category
                    </label>
                    <select
                      value={formData.parent}
                      onChange={(e) =>
                        setFormData({ ...formData, parent: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:border-indigo-500 outline-none"
                    >
                      <option className="dark:bg-slate-800" value="Shoes">Shoes</option>
                      <option className="dark:bg-slate-800" value="Laptops">Laptops</option>
                      <option className="dark:bg-slate-800" value="Audio">Audio</option>
                      <option className="dark:bg-slate-800" value="Cameras">Cameras</option>
                      <option className="dark:bg-slate-800" value="Wearables">Wearables</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      Description
                    </label>
                    <textarea
                      rows="4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                      placeholder="Add a description for this sub category..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex gap-3">
                <button
                  type="button"
                  onClick={closeFormWithAnim}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="flex-[2] py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95"
                >
                  {formMode === "create" ? "Create Sub Category" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE DIALOG --- */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            ref={deleteOverlayRef}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            onClick={closeDeleteWithAnim}
          />
          <div
            ref={deleteContentRef}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Delete Sub Category?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                "{selectedCategory?.name}"
              </span>
              ? All products within this sub category will be uncategorized.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteWithAnim}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
