"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDebounce } from "../hooks/useDebounce";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [results, setResults] = useState({
        products: [],
        categories: [],
        subCategories: [],
        brands: [],
        coupons: [],
        orders: [],
        customers: [],
        reviews: [],
        contacts: [],
        settings: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Static settings dictionary
    const settingsList = [
        { id: 'stg1', name: 'General Settings', type: 'settings', category: 'General', url: '/app/settings?tab=general' },
        { id: 'stg2', name: 'Tax Config', type: 'settings', category: 'General', url: '/app/settings?tab=tax' },
        { id: 'stg3', name: 'Payment Methods', type: 'settings', category: 'Payment', url: '/app/settings?tab=payment' },
        { id: 'stg4', name: 'Store Details', type: 'settings', category: 'Store', url: '/app/settings?tab=store' }
    ];

    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
                setResults({ products: [], categories: [], subCategories: [], brands: [], coupons: [], orders: [], customers: [], reviews: [], contacts: [], settings: [] });
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const token = session?.accessToken;
                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

                if (!token) return;

                // Find settings locally
                const searchLower = debouncedSearchTerm.toLowerCase();
                const matchedSettings = settingsList.filter(s => s.name.toLowerCase().includes(searchLower) || s.category.toLowerCase().includes(searchLower));

                // Fetch from multiple endpoints in parallel
                const [prodRes, catRes, subCatRes, brandRes, couponRes, ordRes, custRes, revRes, contRes] = await Promise.all([
                    fetch(`${baseUrl}/admin/products?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/categories/active/list?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/sub-categories?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/brands/active/list?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/coupons?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/orders?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/customers?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/reviews?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`${baseUrl}/admin/contacts?search=${debouncedSearchTerm}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                ]);

                setResults({
                    products: prodRes?.data?.data || [],
                    categories: catRes?.data || [],
                    subCategories: subCatRes?.data?.data || [],
                    brands: brandRes?.data || [],
                    coupons: couponRes?.data?.data || [],
                    orders: ordRes?.data?.data || [],
                    customers: custRes?.data?.data || [],
                    reviews: revRes?.data || [],
                    contacts: contRes?.data || [],
                    settings: matchedSettings
                });
            } catch (error) {
                console.error("Global search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedSearchTerm, session]);

    const clearSearch = () => {
        setSearchTerm("");
        setResults({ products: [], categories: [], subCategories: [], brands: [], coupons: [], orders: [], customers: [], reviews: [], contacts: [], settings: [] });
        setIsOpen(false);
    };

    return (
        <SearchContext.Provider
            value={{
                searchTerm,
                setSearchTerm,
                results,
                isLoading,
                isOpen,
                setIsOpen,
                clearSearch
            }}
        >
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return context;
};
