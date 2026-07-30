"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Star,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

// --- MOCK DATA ---
const PRODUCT = {
  id: "iphone-15-pro",
  title: "iPhone 15 Pro Max",
  brand: "Apple",
  price: 425000,
  originalPrice: 450000,
  rating: 4.9,
  reviews: 128,
  description:
    "The first iPhone to feature an aerospace-grade titanium design, using the same alloy that spacecraft use for missions to Mars.",
  colors: [
    { name: "Natural Titanium", class: "bg-[#Bfb7ad]" },
    { name: "Blue Titanium", class: "bg-[#2f3844]" },
    { name: "White Titanium", class: "bg-[#f2f1ed]" },
    { name: "Black Titanium", class: "bg-[#181819]" },
  ],
  storage: ["256GB", "512GB", "1TB"],
  images: [
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1696446700466-419c83669146?auto=format&fit=crop&q=80&w=1000",
  ],
  specs: {
    Chip: "A17 Pro chip",
    Display: "6.7-inch Super Retina XDR",
    Camera: "48MP Main | Ultra Wide | Telephoto",
    Battery: "Up to 29 hours video playback",
  },
};

export default function ProjectPage() {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const mainImageRef = useRef(null);

  // --- ANIMATIONS ---
  useGSAP(() => {
    // Fade in main image when it changes
    gsap.fromTo(
      mainImageRef.current,
      { opacity: 0.8, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
    );
  }, [activeImage]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-20">
      {/* BREADCRUMBS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>{" "}
          /
          <Link href="/shop" className="hover:text-slate-900">
            Phones
          </Link>{" "}
          /<span className="text-slate-900 font-bold">{PRODUCT.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* --- LEFT: GALLERY --- */}
          <div className="space-y-4 lg:sticky lg:top-24 h-fit">
            {/* Main Image */}
            <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative border border-slate-100">
              <img
                ref={mainImageRef}
                src={PRODUCT.images[activeImage]}
                alt={PRODUCT.title}
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                In Stock
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {PRODUCT.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === idx
                      ? "border-blue-600 ring-2 ring-blue-600/20"
                      : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <img
                    src={img}
                    alt="Thumbnail"
                    className="w-full h-full object-cover bg-slate-50"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* --- RIGHT: DETAILS --- */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">
                {PRODUCT.brand}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-slate-900">
                  {PRODUCT.rating}
                </span>
                <span className="text-slate-400">
                  ({PRODUCT.reviews} Reviews)
                </span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">
              {PRODUCT.title}
            </h1>

            <div className="flex items-end gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-3xl font-bold text-slate-900">
                  Rs. {PRODUCT.price.toLocaleString()}
                </span>
                <p className="text-sm text-slate-400">Includes all taxes</p>
              </div>
              {PRODUCT.originalPrice && (
                <div className="mb-1">
                  <span className="text-lg text-slate-400 line-through font-medium">
                    Rs. {PRODUCT.originalPrice.toLocaleString()}
                  </span>
                  <span className="ml-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Save Rs.{" "}
                    {(PRODUCT.originalPrice - PRODUCT.price).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 leading-relaxed mb-8">
              {PRODUCT.description}
            </p>

            {/* Color Selector */}
            <div className="mb-8">
              <span className="block text-sm font-bold text-slate-900 mb-3">
                Color:{" "}
                <span className="text-slate-500 font-normal">
                  {PRODUCT.colors[selectedColor].name}
                </span>
              </span>
              <div className="flex flex-wrap gap-3">
                {PRODUCT.colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedColor === idx
                        ? "border-blue-600 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full shadow-sm ${color.class}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Selector */}
            <div className="mb-8">
              <span className="block text-sm font-bold text-slate-900 mb-3">
                Storage
              </span>
              <div className="grid grid-cols-3 gap-3">
                {PRODUCT.storage.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedStorage(size)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      selectedStorage === size
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty & Add to Cart */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-slate-200 rounded-xl px-2 h-14">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button className="flex-1 bg-slate-900 text-white rounded-xl h-14 font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98]">
                <ShoppingBag className="w-5 h-5" /> Add to Cart
              </button>
              <button className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    1 Year Warranty
                  </h4>
                  <p className="text-xs text-slate-500">Official Apple Care</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <Truck className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Free Delivery
                  </h4>
                  <p className="text-xs text-slate-500">Colombo & Suburbs</p>
                </div>
              </div>
            </div>

            {/* Specs Accordion (Simple List for now) */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-bold text-lg mb-4">
                Technical Specifications
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {Object.entries(PRODUCT.specs).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-lg">
                    <dt className="text-xs text-slate-500 uppercase font-bold mb-1">
                      {key}
                    </dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE STICKY BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 lg:hidden z-40 flex items-center justify-between gap-4 pb-safe">
        <div>
          <p className="text-xs text-slate-500">Total Price</p>
          <p className="font-bold text-lg text-slate-900">
            Rs. {(PRODUCT.price * qty).toLocaleString()}
          </p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg">
          Add to Cart
        </button>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
}
