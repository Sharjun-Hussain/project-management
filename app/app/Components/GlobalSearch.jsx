"use client";

import React, { useRef, useEffect } from "react";
import { Search, Box, Layers, Tag, Ticket, Loader2, ArrowRight, X, ShoppingCart, Users, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getImageUrl } from "../../../lib/utils";

const SECTIONS = [
  { title: "Products", key: "products", icon: Box, type: "products" },
  { title: "Categories", key: "categories", icon: Layers, type: "categories" },
  { title: "Subcategories", key: "subCategories", icon: Layers, type: "subCategories" },
  { title: "Brands", key: "brands", icon: Tag, type: "brand" },
  { title: "Coupons", key: "coupons", icon: Ticket, type: "coupons" },
  { title: "Orders", key: "orders", icon: ShoppingCart, type: "orders" },
  { title: "Customers", key: "customers", icon: Users, type: "customers" },
  { title: "Reviews", key: "reviews", icon: MessageSquare, type: "reviews" },
  { title: "Inquiries", key: "contacts", icon: MessageSquare, type: "contacts" },
  { title: "Settings", key: "settings", icon: SettingsIcon, type: "settings" },
];

export default function GlobalSearch() {
  const { 
    searchTerm, 
    setSearchTerm, 
    results, 
    isLoading, 
    isOpen, 
    setIsOpen,
    clearSearch 
  } = useSearch();
  
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Create flat list of results for keyboard navigation
  const flatResults = SECTIONS.reduce((acc, section) => {
    const items = results[section.key] || [];
    const sliced = items.slice(0, 4).map(v => ({ ...v, type: section.type }));
    return [...acc, ...sliced];
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setIsOpen]);

  // Reset active index when searchTerm or results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, results]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        router.push(getLink(flatResults[activeIndex].type, flatResults[activeIndex]));
        clearSearch();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const hasResults = flatResults.length > 0;

  const getLink = (type, item) => {
    switch(type) {
      case 'products': return `/app/products`;
      case 'categories': return `/app/categories`;
      case 'subCategories': return `/app/sub-categories`;
      case 'brand': return `/app/brand`;
      case 'coupons': return `/app/coupons`;
      case 'orders': return `/app/projects`;
      case 'customers': return `/app/clients`;
      case 'reviews': return `/app/reviews`;
      case 'contacts': return `/app/contacts`;
      case 'settings': return item.url || `/app/settings`;
      default: return `/app`;
    }
  };

  const ResultSection = ({ title, items, icon: Icon, type, offset }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 px-3 mb-2">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
        </div>
        <div className="space-y-1">
          {items.slice(0, 4).map((item, idx) => (
            <Link
              key={item.id}
              href={getLink(type, item)}
              onClick={clearSearch}
              onMouseEnter={() => setActiveIndex(offset + idx)}
              className={`flex items-center justify-between group p-2.5 rounded-xl transition-all border ${
                activeIndex === offset + idx 
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.image || item.logo ? (
                  <img 
                    src={getImageUrl(item.image || item.logo)} 
                    alt="" 
                    className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-900" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.name || item.order_number || item.email || item.code}
                  </div>
                  {(item.category || item.subject) && (
                    <div className="text-[10px] text-slate-400">
                      {typeof item.category === 'object' && item.category !== null ? item.category.name : (item.category || item.subject)}
                    </div>
                  )}
                  {item.type && <div className="text-[10px] text-slate-400 capitalize">{item.type}</div>}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}
          {items.length > 4 && type !== 'settings' && (
             <Link 
                href={`/app/${type}`} 
                onClick={clearSearch}
                className="block text-center py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
             >
                See all {title.toLowerCase()}
             </Link>
          )}
        </div>
      </div>
    );
  };

  let cumulativeOffset = 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 focus-within:ring-2 ring-indigo-500/20 ring-offset-2 dark:ring-offset-slate-800 transition-all ${isOpen ? 'ring-2' : ''}`}
      >
        <Search className={`w-4 h-4 ${isLoading ? 'hidden' : 'block'}`} />
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search everywhere..."
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          className="bg-transparent border-none outline-none text-sm w-48 lg:w-80 placeholder:text-slate-400 dark:text-white"
        />
        <div className="hidden lg:flex items-center gap-1 opacity-50 mr-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] font-sans">Ctrl</kbd>
          <span className="text-[10px]">+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] font-sans">K</kbd>
        </div>
        {searchTerm && (
          <button onClick={clearSearch} className="hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 lg:w-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {isLoading && !hasResults ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Searching your dashboard...</p>
              </div>
            ) : hasResults ? (
              <>
                {SECTIONS.map((section) => {
                  const items = results[section.key] || [];
                  if (items.length === 0) return null;
                  const offset = cumulativeOffset;
                  cumulativeOffset += Math.min(items.length, 4);
                  
                  return (
                    <React.Fragment key={section.key}>
                      <ResultSection 
                        title={section.title} 
                        items={items} 
                        icon={section.icon} 
                        type={section.type} 
                        offset={offset} 
                      />
                      {offset + Math.min(items.length, 4) < flatResults.length && (
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No results found for "{searchTerm}"</p>
                <p className="text-xs mt-1">Try searching for products, categories, or brands.</p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                   <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-[10px] text-slate-500 font-sans">ESC</kbd>
                   <span className="text-[10px] text-slate-400">to close</span>
                </div>
             </div>
             <span className="text-[10px] text-slate-400">Press enter to see all</span>
          </div>
        </div>
      )}
    </div>
  );
}
