"use client";

import React, { useState, useRef, Suspense } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import useSWR from "swr";
import { useSession, signOut } from "next-auth/react";
import { fetcher as globalFetcher } from "../../../../lib/fetcher";
import { sanitizeHtml } from "../../../../lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  UploadCloud,
  X,
  Layers,
  Loader2,
  Smartphone,
  AlertCircle,
  Trash2,
  Plus,
  Box,
  ScanBarcode,
  Flame,
  Star,
  TrendingUp,
  Globe,
  Tag,
  Search,
  MoveLeft,
  MoveRight,
  Eye,
  FileText,
  Image as ImageIcon,
  Check,
  ShoppingCart,
  Pencil,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
} from "lucide-react";
import { FormInput, FormSelect, FormTextarea, FormCheckbox, FormSwitch } from "@/components/forms/reusable-fields";
import { Button } from "@/components/ui/button";

const ProductRelationshipSelector = ({
  title,
  description,
  selectedIds,
  onUpdate,
  searchTerm,
  onSearchChange,
  results,
  productDetailsMap, // Add map of product details
}) => {
  const toggleProduct = (product) => {
    const id = product.id;
    if (selectedIds.includes(id)) {
      onUpdate(selectedIds.filter((item) => item !== id));
    } else {
      onUpdate([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by name or code..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white text-sm"
          />
        </div>

        {/* Search Results */}
        {searchTerm.length > 2 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">
              Search Results
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
              {results.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No products found.
                </p>
              ) : (
                results.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {product.primary_image_path ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/${product.primary_image_path}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {product.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProduct(product)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedIds.includes(product.id)
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                      }`}
                    >
                      {selectedIds.includes(product.id) ? "Remove" : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Selected Products */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-400">
            Selected Products ({selectedIds.length})
          </p>
          {selectedIds.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No products selected yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {selectedIds.map((id) => {
                const product = productDetailsMap[id];
                if (!product) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {product.primary_image_path ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}/${product.primary_image_path}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {product.code}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProduct(product)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ErrorText = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1 text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="w-3.5 h-3.5" />
      <span className="text-xs text-red-500">{message}</span>
    </div>
  );
};

function CreateProductContent() {
  const containerRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const productId = searchParams.get("productId");
  const isEditMode = !!productId;
  const { data: session } = useSession();
  const DRAFT_KEY = React.useMemo(() => 
    session?.user?.id ? `igen_temp_product_create_draft_${session.user.id}` : "igen_temp_product_create_draft",
    [session?.user?.id]
  );
  const DRAFTS_LIST_KEY = React.useMemo(() => 
    session?.user?.id ? `igen_product_drafts_${session.user.id}` : "igen_product_drafts",
    [session?.user?.id]
  );

  const STEPS = [
    { id: "general", label: "General Info", icon: FileText },
    { id: "media", label: "Media Gallery", icon: ImageIcon },
    { id: "variants", label: "Pricing & Variants", icon: Layers },
    { id: "specs", label: "Specs & Features", icon: Smartphone },
    { id: "related", label: "Related Items", icon: Box },
  ];

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync activeTab with URL 'step' parameter
  const queryStep = searchParams.get("step");
  const initialTab = STEPS.find((s) => s.id === queryStep) ? queryStep : "general";
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [stepperOrientation, setStepperOrientation] = useState("vertical");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const saveDropdownRef = useRef(null);


  // Sync sidebar collapsed state from localStorage (matches layout.js)
  React.useEffect(() => {
    const handleResize = () => {
      // Logic for horizontal stepper removed as requested
    };
    
    const checkSidebar = () => {
      setSidebarCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    };

    handleResize();
    checkSidebar();
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("storage", checkSidebar);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("storage", checkSidebar);
    };
  }, []);

  // Handle click outside for save dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target)) {
        setIsSaveDropdownOpen(false);
      }
    };
    if (isSaveDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSaveDropdownOpen]);


  const setActiveTab = (tabId) => {
    // Auto-save pending key features
    if (activeTab === "specs") {
      if (featureInput.trim()) {
        const featText = featureInput.trim();
        if (!selectedFeatures.find(f => f.name.toLowerCase() === featText.toLowerCase())) {
          setSelectedFeatures(prev => [...prev, { id: `new-${Date.now()}`, name: featText }]);
        }
        setFeatureInput("");
      }
      if (tagInput.trim()) {
        const tagText = tagInput.trim();
        if (!selectedTags.find(t => t.name.toLowerCase() === tagText.toLowerCase())) {
          setSelectedTags(prev => [...prev, { id: `new-${Date.now()}`, name: tagText }]);
        }
        setTagInput("");
      }
    }

    setActiveTabState(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", tabId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // MAIN DATA STORE
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    type: "physical",
    status: "draft",
    short_description: "",
    full_description: "",
    is_featured: false,
    is_trending: false,
    is_new_arrival: false,
    is_active: true,
    bundled_product_ids: [],
    compatible_product_ids: [],
    condition: "new",
  });

  // MEDIA STATE
  const mediaInputRef = useRef(null);
  const [productImages, setProductImages] = useState([]);
  const [isMediaDragging, setIsMediaDragging] = useState(false);

  // VARIANTS STATE
  const [variants, setVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({
    variant_name: "",
    sku: "",
    barcode: "",
    imei: "",
    warranty_period: "",
    storage_size: "",
    ram_size: "",
    color: "",
    price: "",
    sales_price: "",
    stock_quantity: "",
    low_stock_threshold: "5",
    is_offer: false,
    offer_price: "",
    is_trending: false,
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
  });

  // PRODUCT SETUP TYPE (Direct vs Variant)
  const [productSetupType, setProductSetupType] = useState(null); // 'direct' | 'variant' | null
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const updateDirectVariant = (field, value) => {
    setVariants(prev => {
      const updated = [...prev];
      if (updated.length === 0) {
        updated.push({
          variant_name: "Default",
          sku: "",
          barcode: "",
          imei: "",
          warranty_period: "",
          storage_size: "",
          ram_size: "",
          color: "",
          price: "",
          sales_price: "",
          stock_quantity: "",
          low_stock_threshold: "5",
          is_offer: false,
          offer_price: "",
          is_trending: false,
          is_active: true,
          is_featured: false,
          is_new_arrival: false,
        });
      }
      updated[0] = {
        ...updated[0],
        variant_name: "Default",
        [field]: value
      };
      return updated;
    });
  };

  const handleSwitchSetupType = () => {
    if (window.confirm("Are you sure you want to switch setup types? Switching will reset your current variant configurations.")) {
      if (productSetupType === "direct") {
        setProductSetupType("variant");
        setVariants([]);
      } else {
        setProductSetupType("direct");
        setVariants([
          {
            variant_name: "Default",
            sku: "",
            barcode: "",
            imei: "",
            warranty_period: "",
            storage_size: "",
            ram_size: "",
            color: "",
            price: "",
            sales_price: "",
            stock_quantity: "",
            low_stock_threshold: "5",
            is_offer: false,
            offer_price: "",
            is_trending: false,
            is_active: true,
            is_featured: false,
            is_new_arrival: false,
          }
        ]);
      }
    }
  };

  const directVariant = variants[0] || {
    variant_name: "Default",
    sku: "",
    barcode: "",
    imei: "",
    warranty_period: "",
    storage_size: "",
    ram_size: "",
    color: "",
    price: "",
    sales_price: "",
    stock_quantity: "",
    low_stock_threshold: "5",
    is_offer: false,
    offer_price: "",
    is_trending: false,
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
  };

  // INPUT BUFFERS
  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [specInput, setSpecInput] = useState({
    specification_name: "",
    specification_value: "",
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [specifications, setSpecifications] = useState([]);

  // Tag/Feature autocomplete
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showFeatureSuggestions, setShowFeatureSuggestions] = useState(false);

  // Variant Editing State
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [expandedVariantId, setExpandedVariantId] = useState(null);

  // --- API FETCHING ---
  const fetcher = async (url) => {
    const data = await globalFetcher(url, session?.accessToken);
    return data;
  };

  const { data: categoriesData } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/categories/active/list`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session.accessToken),
  );

  const { data: brandsData } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/brands/active/list`,
          session.accessToken,
        ]
      : null,
    ([url]) => fetcher(url),
  );

  const { data: tagsData } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/get/tags`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session.accessToken),
  );

  const { data: subCategoriesData } = useSWR(
    session?.accessToken && formData.category_id
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/sub-categories/active/list?category_id=${formData.category_id}`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session.accessToken),
  );

  const { data: featuresData } = useSWR(
    session?.accessToken
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/get/features`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session.accessToken),
  );

  const categories = categoriesData?.data || [];
  const subCategories = subCategoriesData?.data || [];
  const brands = brandsData?.data || [];
  const availableTags = tagsData?.data || [];
  const availableFeatures = featuresData?.data || [];

  const isPhoneCategory = React.useMemo(() => {
    if (!formData.category_id || !categories) return false;
    const cat = categories.find(c => String(c.id) === String(formData.category_id));
    const name = cat?.name?.toLowerCase() || "";
    return (name.includes("phone") || name.includes("mobile")) && !name.includes("accessor");
  }, [formData.category_id, categories]);

  const completionPercentage = React.useMemo(() => {
    let score = 0;
    let total = 7;
    
    if (formData.name) score++;
    if (formData.category_id) score++;
    if (formData.brand_id) score++;
    if (formData.type) score++;
    if (productImages.some(img => img.isPrimary)) score++;
    if (selectedFeatures.length > 0) score++;
    if (variants.length > 0 && variants.every(v => v.sku && v.price && v.stock_quantity !== "" && (!isPhoneCategory || (v.storage_size && v.ram_size)))) score++;
    
    return Math.round((score / total) * 100);
  }, [formData, productImages, isEditMode, selectedFeatures, variants, isPhoneCategory]);

  const isFormValid =
    formData.name &&
    formData.category_id &&
    formData.brand_id &&
    formData.type &&
    selectedFeatures.length > 0 &&
    variants.length > 0 &&
    variants.every(
      (v) =>
        v.sku &&
        v.price &&
        v.stock_quantity !== "" &&
        (!isPhoneCategory || (v.storage_size && v.ram_size))
    );

  const isStepComplete = (stepId) => {
    switch (stepId) {
      case "general":
        return !!(formData.name && formData.category_id && formData.brand_id && formData.type);
      case "media":
        return productImages.some(img => img.isPrimary);
      case "variants":
        return variants.length > 0 && variants.every(
          (v) => v.sku && v.price && v.stock_quantity !== "" && (!isPhoneCategory || (v.storage_size && v.ram_size))
        );
      case "specs":
        return selectedFeatures.length > 0;
      default:
        return true;
    }
  };

  // --- UN-SAVED CHANGES GUARD & AUTO-SAVE ---
  const [initialData, setInitialData] = useState(null);

  // Capture initial state for change tracking
  React.useEffect(() => {
    if (!initialData && !isLoading) {
      if (!isEditMode || (isEditMode && formData.name)) {
        setInitialData(
          JSON.stringify({
            formData,
            variants,
            specifications,
            selectedTags,
            selectedFeatures,
          })
        );
      }
    }
  }, [isEditMode, formData.name, isLoading, initialData, variants, specifications, selectedTags, selectedFeatures]);

  const isDirty = React.useMemo(() => {
    if (!initialData) return false;
    return (
      initialData !==
      JSON.stringify({
        formData,
        variants,
        specifications,
        selectedTags,
        selectedFeatures,
      })
    );
  }, [formData, variants, specifications, selectedTags, selectedFeatures, initialData]);

  // Browser Navigation Guard
  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isLoading) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isLoading]);

  // Auto-save logic (only in Create mode)
  React.useEffect(() => {
    if (isEditMode || !isDirty) return;

    const timer = setTimeout(() => {
      const draft = {
        formData,
        variants,
        specifications,
        selectedTags,
        selectedFeatures,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, variants, specifications, selectedTags, selectedFeatures, isEditMode, isDirty]);

  // Restore logic
  React.useEffect(() => {
    if (isEditMode || draftId) return;

    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        toast("You have an unsaved draft", {
          description: `Last updated: ${new Date(draft.updatedAt).toLocaleString()}`,
          duration: 10000,
          action: {
            label: "Restore",
            onClick: () => {
              setFormData(draft.formData);
              setVariants(draft.variants);
              setSpecifications(draft.specifications);
              setSelectedTags(draft.selectedTags);
              setSelectedFeatures(draft.selectedFeatures);
              setInitialData(JSON.stringify({
                formData: draft.formData,
                variants: draft.variants,
                specifications: draft.specifications,
                selectedTags: draft.selectedTags,
                selectedFeatures: draft.selectedFeatures,
              }));
              setIsDirty(false);
              toast.success("Draft restored!");
            },
          },
          cancel: {
            label: "Discard",
            onClick: () => localStorage.removeItem(DRAFT_KEY),
          },
        });
      } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, [isEditMode, draftId]);

  // Product Relationship Search State
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productDetailsMap, setProductDetailsMap] = useState({}); // Stores details for all fetched/selected products

  // Debounce product search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearchTerm]);

  // Fetch products for relationship search
  const { data: searchResponse } = useSWR(
    session?.accessToken && debouncedProductSearch.length > 2
      ? [
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products?search=${debouncedProductSearch}`,
          session.accessToken,
        ]
      : null,
    ([url]) => globalFetcher(url, session?.accessToken)
  );

  React.useEffect(() => {
    if (searchResponse?.data?.data) {
      const results = searchResponse.data.data;
      setProductSearchResults(results);
      
      // Update details map with new results
      setProductDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(p => {
          next[p.id] = p;
        });
        return next;
      });
    }
  }, [searchResponse]);

  // Load draft from localStorage
  React.useEffect(() => {
    if (draftId) {
      try {
        const drafts = JSON.parse(
          localStorage.getItem("igen_product_drafts") || "[]",
        );
        const draft = drafts.find((d) => d.id === draftId);
        if (draft) {
          setFormData(draft.formData);
          setVariants(draft.variants);
          setSpecifications(draft.specifications);
          setSelectedTags(draft.selectedTags);
          setSelectedFeatures(draft.selectedFeatures);
          if (draft.variants && draft.variants.length <= 1) {
            setProductSetupType("direct");
          } else {
            setProductSetupType("variant");
          }
          toast.info("Draft loaded from local storage");
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, [draftId]);

  // Load product data for editing
  React.useEffect(() => {
    if (productId && session?.accessToken) {
      const fetchProduct = async () => {
        try {
          const data = await globalFetcher(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${productId}`,
            session.accessToken
          );
          const product = data.data;

          // Pre-fill form data
          setFormData({
            name: product.name || "",
            code: product.code || "",
            category_id: product.category_id || "",
            subcategory_id: product.subcategory_id || "",
            brand_id: product.brand_id || "",
            type: product.type || "physical",
            status: product.is_active ? "published" : "draft",
            short_description: product.short_description || "",
            full_description: product.full_description || "",
            is_featured: product.is_featured || false,
            is_trending: product.is_trending || false,
            is_new_arrival: product.is_new_arrival || false,
            is_active: product.is_active || false,
            bundled_product_ids: product.bundled_products?.map(p => p.id) || [],
            compatible_product_ids: product.compatible_products?.map(p => p.id) || [],
          });

          // Load variants
          if (product.variants && product.variants.length > 0) {
            setVariants(product.variants.map(v => ({
              ...v,
              variant_name: v.variant_name || "",
            })));
            
            if (product.variants.length <= 1) {
              setProductSetupType("direct");
            } else {
              setProductSetupType("variant");
            }
            
            // Set global condition from the first variant
            if (product.variants[0]?.condition) {
              setFormData(prev => ({
                ...prev,
                condition: product.variants[0].condition
              }));
            }
          } else {
            setProductSetupType("direct");
          }

          // Load specifications
          if (product.specifications && product.specifications.length > 0) {
            setSpecifications(product.specifications);
          }

          // Load tags
          if (product.tags && product.tags.length > 0) {
            setSelectedTags(product.tags);
          }

          // Load features
          if (product.features && product.features.length > 0) {
            setSelectedFeatures(product.features);
          }

          // Load images (both primary and gallery) into a unified list
          const loadedImages = [];
          if (product.primary_image_path) {
            loadedImages.push({
              id: `primary-${Date.now()}`,
              file: null,
              previewUrl: getImageUrl(product.primary_image_path),
              isPrimary: true,
              isExisting: true,
              existingUrl: product.primary_image_path
            });
          }
          if (product.images && product.images.length > 0) {
            product.images.forEach((img, idx) => {
              loadedImages.push({
                id: `gallery-${img.id || idx}-${Date.now()}`,
                file: null,
                previewUrl: getImageUrl(img.image_path),
                isPrimary: false,
                isExisting: true,
                existingUrl: img.image_path
              });
            });
          }
          setProductImages(loadedImages);

          // Build details map for existing relationships
          const existingDetails = {};
          if (product.bundled_products) {
            product.bundled_products.forEach(p => existingDetails[p.id] = p);
          }
          if (product.compatible_products) {
            product.compatible_products.forEach(p => existingDetails[p.id] = p);
          }

          setProductDetailsMap(prev => ({
            ...prev,
            ...existingDetails
          }));

          toast.success("Product loaded for editing");
        } catch (error) {
          console.error("Error loading product:", error);
          toast.error("Failed to load product data");
        }
      };

      fetchProduct();
    }
  }, [productId, session]);

  // Helper function to get full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "");
    return `${baseUrl}/${path}`;
  };

  // --- HELPER: Price Formatter ---
  const formatPrice = (price) => {
    if (!price) return "0.00";
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // --- UNSAVED CHANGES WARNING ---
  React.useEffect(() => {
    const isDirty =
      formData.name !== "" ||
      formData.short_description !== "" ||
      formData.full_description !== "" ||
      variants.length > 0 ||
      specifications.length > 0 ||
      selectedTags.length > 0 ||
      selectedFeatures.length > 0 ||
      productImages.length > 0;

    const handleBeforeUnload = (e) => {
      if (isDirty && !isLoading) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    formData,
    variants,
    specifications,
    selectedTags,
    selectedFeatures,
    productImages,
    isLoading,
  ]);

  // Filter suggestions based on input
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.find((t) => t.id === tag.id),
  );

  const filteredFeatures = availableFeatures.filter(
    (feature) =>
      feature.name.toLowerCase().includes(featureInput.toLowerCase()) &&
      !selectedFeatures.find((f) => f.id === feature.id),
  );

  // --- ANIMATIONS HANDLED VIA NATIVE CSS FOR SMOOTH TRANSLATION ---

  // --- LOGIC HANDLERS ---

  // Code Generator
  const generateCode = () => {
    const code = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9 -]/g, "")
      .replace(/\\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 20);
    setFormData((prev) => ({ ...prev, code }));
  };

  // Image Handlers
  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map((file) => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: false,
      isExisting: false,
    }));

    setProductImages((prev) => {
      const updated = [...prev, ...newImages];
      if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimaryImage = (id) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const handleRemoveMediaImage = (id) => {
    setProductImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const moveMediaImage = (index, direction) => {
    setProductImages((prev) => {
      const next = [...prev];
      if (direction === "left" && index > 0) {
        [next[index], next[index - 1]] = [next[index - 1], next[index]];
      } else if (direction === "right" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next;
    });
  };

  // Tag Handler with autocomplete
  const handleAddTag = (tag) => {
    const tagToAdd = typeof tag === "string" ? { id: `new-${Date.now()}`, name: tag } : tag;
    if (!selectedTags.find((t) => t.name.toLowerCase() === tagToAdd.name.toLowerCase())) {
      setSelectedTags([...selectedTags, tagToAdd]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const handleTagInputChange = (value) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  // Feature Handler with autocomplete
  const handleAddFeature = (feature) => {
    const featureToAdd = typeof feature === "string" ? { id: `new-${Date.now()}`, name: feature } : feature;
    if (!selectedFeatures.find((f) => f.name.toLowerCase() === featureToAdd.name.toLowerCase())) {
      setSelectedFeatures([...selectedFeatures, featureToAdd]);
    }
    setFeatureInput("");
    setShowFeatureSuggestions(false);
  };

  const handleFeatureInputChange = (value) => {
    setFeatureInput(value);
    setShowFeatureSuggestions(value.length > 0);
  };

  // Specification Handler
  const handleAddSpec = () => {
    if (specInput.specification_name && specInput.specification_value) {
      setSpecifications([...specifications, specInput]);
      setSpecInput({ specification_name: "", specification_value: "" });
    }
  };

  // Variant Handler
  const addVariant = () => {
    if (
      !currentVariant.sku ||
      !currentVariant.price ||
      currentVariant.stock_quantity === "" ||
      !currentVariant.color ||
      (isPhoneCategory && (!currentVariant.storage_size || !currentVariant.ram_size))
    ) {
      toast.error(`Please fill in all required variant fields (SKU, Price, Stock, Color${isPhoneCategory ? ", Storage, RAM" : ""})`);
      return;
    }

    const variantToAdd = { ...currentVariant };
    if (variantToAdd.ram_size && !variantToAdd.ram_size.toUpperCase().endsWith("GB")) {
      variantToAdd.ram_size = `${variantToAdd.ram_size}GB`;
    }

    if (editingVariantId) {
      setVariants(variants.map(v => v.id === editingVariantId ? { ...variantToAdd, id: editingVariantId } : v));
      setEditingVariantId(null);
      toast.success("Variant updated");
    } else {
      setVariants([...variants, { ...variantToAdd, id: Date.now() }]);
      toast.success("Variant added");
    }

    setCurrentVariant({
      variant_name: "",
      condition: "new",
      sku: "",
      barcode: "",
      imei: "",
      warranty_period: "",
      storage_size: "",
      ram_size: "",
      color: "",
      price: "",
      sales_price: "",
      stock_quantity: "",
      low_stock_threshold: "5",
      is_offer: false,
      offer_price: "",
      is_trending: false,
      is_active: true,
      is_featured: false,
      is_new_arrival: false,
    });
  };

  const editVariant = (variant) => {
    setEditingVariantId(variant.id);
    
    // Clean RAM size: strip 'GB' so numeric input can display it
    const variantToEdit = { ...variant };
    if (variantToEdit.ram_size && typeof variantToEdit.ram_size === "string") {
      variantToEdit.ram_size = variantToEdit.ram_size.replace(/GB$/i, "");
    }
    
    setCurrentVariant(variantToEdit);
    // Scroll to variant form
    const element = document.getElementById("variant-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const copyVariant = (variant) => {
    const { id, sku, barcode, imei, ...rest } = variant;
    // Clean RAM size for the input field
    const cleanedVariant = { ...rest, sku: "", barcode: "", imei: "" };
    if (cleanedVariant.ram_size && typeof cleanedVariant.ram_size === "string") {
      cleanedVariant.ram_size = cleanedVariant.ram_size.replace(/GB$/i, "");
    }
    setCurrentVariant(cleanedVariant);
    setEditingVariantId(null); // Ensure we are adding a new variant, not editing
    // Scroll to variant form
    const element = document.getElementById("variant-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast.info("Variant data copied to form");
  };

  const cancelEditVariant = () => {
    setEditingVariantId(null);
    setCurrentVariant({
      variant_name: "",
      condition: "new",
      sku: "",
      barcode: "",
      imei: "",
      warranty_period: "",
      storage_size: "",
      ram_size: "",
      color: "",
      price: "",
      sales_price: "",
      stock_quantity: "",
      low_stock_threshold: "5",
      is_offer: false,
      offer_price: "",
      is_trending: false,
      is_active: true,
      is_featured: false,
    });
  };

  // Build FormData for API
  const buildFormData = () => {
    const data = new FormData();

    // Basic fields
    data.append("name", sanitizeHtml(formData.name));
    data.append("code", sanitizeHtml(formData.code));
    data.append("category_id", formData.category_id);
    if (formData.subcategory_id) {
      data.append("subcategory_id", formData.subcategory_id);
    }
    data.append("brand_id", formData.brand_id);
    data.append("type", formData.type);
    data.append("status", formData.status);
    data.append("short_description", sanitizeHtml(formData.short_description));
    data.append("full_description", sanitizeHtml(formData.full_description));
    data.append("is_trending", formData.is_trending ? "1" : "0");
    data.append("is_active", formData.is_active ? "1" : "0");
    data.append("is_featured", formData.is_featured ? "1" : "0");
    data.append("is_new_arrival", formData.is_new_arrival ? "1" : "0");
    data.append("condition", formData.condition || "new");

    // Images (Unified primary and gallery uploads)
    const primaryImg = productImages.find(img => img.isPrimary);
    if (primaryImg) {
      if (primaryImg.file) {
        data.append("primary_image_path", primaryImg.file);
      } else if (primaryImg.isExisting) {
        data.append("primary_image_path", primaryImg.existingUrl);
      }
    }

    // New gallery images upload
    const newGalleryFiles = productImages.filter(img => !img.isPrimary && img.file);
    newGalleryFiles.forEach((img) => {
      data.append("images[]", img.file);
    });

    // Existing gallery images retained
    const existingGalleryPaths = productImages.filter(img => !img.isPrimary && img.isExisting).map(img => img.existingUrl);
    data.append("existing_images", existingGalleryPaths.join(","));

    // Features (comma-separated names)
    if (selectedFeatures.length > 0) {
      data.append(
        "feature_name",
        selectedFeatures.map((f) => f.name).join(","),
      );
    }

    // Tags (comma-separated)
    if (selectedTags.length > 0) {
      data.append("tags", selectedTags.map((t) => t.name).join(","));
    }

    // Specifications
    specifications.forEach((spec, index) => {
      data.append(
        `specifications[${index}][specification_name]`,
        spec.specification_name,
      );
      data.append(
        `specifications[${index}][specification_value]`,
        spec.specification_value,
      );
    });

    // Variants
    variants.forEach((variant, index) => {
      data.append(`variants[${index}][variant_name]`, variant.variant_name || "");
      data.append(`variants[${index}][sku]`, variant.sku);
      data.append(`variants[${index}][barcode]`, variant.barcode || "");
      data.append(`variants[${index}][imei]`, variant.imei || "");
      data.append(`variants[${index}][warranty_period]`, variant.warranty_period || "");
      data.append(
        `variants[${index}][storage_size]`,
        variant.storage_size || "",
      );
      data.append(`variants[${index}][ram_size]`, variant.ram_size || "");
      data.append(`variants[${index}][color]`, variant.color || "");
      data.append(`variants[${index}][price]`, variant.price);
      data.append(
        `variants[${index}][sales_price]`,
        variant.sales_price || variant.price,
      );
      data.append(
        `variants[${index}][stock_quantity]`,
        variant.stock_quantity || "0",
      );
      data.append(
        `variants[${index}][low_stock_threshold]`,
        variant.low_stock_threshold || "5",
      );
      data.append(`variants[${index}][is_offer]`, variant.is_offer ? "1" : "0");
      data.append(`variants[${index}][offer_price]`, variant.offer_price || "");
      data.append(
        `variants[${index}][is_trending]`,
        variant.is_trending ? "1" : "0",
      );
      data.append(
        `variants[${index}][is_active]`,
        variant.is_active ? "1" : "0",
      );
      data.append(
        `variants[${index}][is_featured]`,
        variant.is_featured ? "1" : "0",
      );
      data.append(
        `variants[${index}][is_new_arrival]`,
        variant.is_new_arrival ? "1" : "0",
      );
    });

    // Product Relationships
    if (formData.bundled_product_ids.length > 0) {
      data.append("bundled_product_ids", formData.bundled_product_ids.join(","));
    }
    if (formData.compatible_product_ids.length > 0) {
      data.append("compatible_product_ids", formData.compatible_product_ids.join(","));
    }

    return data;
  };

  // Save Function
  // Save Draft to LocalStorage
  const handleSaveDraft = () => {
    try {
      const draftId = `draft-${Date.now()}`;
      const draftData = {
        id: draftId,
        name: formData.name || "Untitled Product",
        code: formData.code || "DRAFT-" + Date.now(),
        status: "draft",
        is_local_draft: true,
        formData,
        variants,
        specifications,
        selectedTags,
        selectedFeatures,
        createdAt: new Date().toISOString(),
      };

      const existingDrafts = JSON.parse(
        localStorage.getItem(DRAFTS_LIST_KEY) || "[]",
      );
      const otherDrafts = existingDrafts.filter((d) => d.id !== draftId);
      localStorage.setItem(
        DRAFTS_LIST_KEY,
        JSON.stringify([draftData, ...otherDrafts]),
      );

      localStorage.removeItem(DRAFT_KEY);
      toast.success("Draft saved to local storage!");
      // Set isLoading to true briefly to bypass the beforeunload warning
      setIsLoading(true);
      router.push("/app/products");
    } catch (error) {
      console.error("Draft save error:", error);
      toast.error("Failed to save draft locally. Storage might be full.");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    // Sync any pending tag/feature input first
    const updatedFeatures = [...selectedFeatures];
    if (featureInput.trim()) {
      const featText = featureInput.trim();
      if (!updatedFeatures.find(f => f.name.toLowerCase() === featText.toLowerCase())) {
        const newFeat = { id: `new-${Date.now()}`, name: featText };
        updatedFeatures.push(newFeat);
        setSelectedFeatures(updatedFeatures);
      }
      setFeatureInput("");
    }

    const updatedTags = [...selectedTags];
    if (tagInput.trim()) {
      const tagText = tagInput.trim();
      if (!updatedTags.find(t => t.name.toLowerCase() === tagText.toLowerCase())) {
        const newTag = { id: `new-${Date.now()}`, name: tagText };
        updatedTags.push(newTag);
        setSelectedTags(updatedTags);
      }
      setTagInput("");
    }

    // Comprehensive client-side validation check
    const validationList = [];
    if (!formData.name) validationList.push({ stepId: "general", stepLabel: "General Info", field: "name", message: "Product Name is required" });
    if (!formData.category_id) validationList.push({ stepId: "general", stepLabel: "General Info", field: "category_id", message: "Product Category is required" });
    if (!formData.brand_id) validationList.push({ stepId: "general", stepLabel: "General Info", field: "brand_id", message: "Product Brand is required" });
    if (!formData.type) validationList.push({ stepId: "general", stepLabel: "General Info", field: "type", message: "Product Type is required" });
    
    if (!productImages.some(img => img.isPrimary)) {
      validationList.push({ stepId: "media", stepLabel: "Media Gallery", field: "primary_image", message: "Primary Image is required" });
    }
    
    if (variants.length === 0) {
      validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: "variants", message: "Please add at least one variant" });
    } else {
      variants.forEach((v, idx) => {
        const prefix = productSetupType === "direct" ? "Product" : `Variant "${v.variant_name || 'Default'}"`;
        if (!v.sku) validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.sku`, message: `${prefix} SKU is required` });
        if (!v.price) {
          validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.price`, message: `${prefix} Price is required` });
        } else if (Number(v.price) < 0) {
          validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.price`, message: `${prefix} Price must be non-negative` });
        }
        if (v.stock_quantity === undefined || v.stock_quantity === "") {
          validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.stock_quantity`, message: `${prefix} Stock Quantity is required` });
        } else if (Number(v.stock_quantity) < 0) {
          validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.stock_quantity`, message: `${prefix} Stock Quantity must be non-negative` });
        }
        if (isPhoneCategory) {
          if (!v.storage_size) validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.storage_size`, message: `${prefix} Storage is required for Phones` });
          if (!v.ram_size) validationList.push({ stepId: "variants", stepLabel: "Pricing & Variants", field: `variants.${idx}.ram_size`, message: `${prefix} RAM is required for Phones` });
        }
      });
    }
    
    if (updatedFeatures.length === 0) {
      validationList.push({ stepId: "specs", stepLabel: "Specs & Features", field: "features", message: "At least one Key Feature is required" });
    }

    if (validationList.length > 0) {
      setValidationErrors(validationList);
      setShowValidationModal(true);
      toast.error("Please complete the required product fields.");
      setIsLoading(false);
      return;
    }

    setValidationErrors([]);
    setShowValidationModal(false);

    const loadingToast = toast.loading(
      isEditMode ? "Updating product..." : "Creating product..."
    );

    try {
      const formDataPayload = buildFormData();

      if (isEditMode) {
        formDataPayload.append("_method", "PUT");
      }

      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products/${productId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/products`;

      // RAW FETCH FOR MAXIMUM VISIBILITY IN NETWORK TAB
      const response = await fetch(url, {
        method: "POST",
        body: formDataPayload,
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          Accept: "application/json",
          // Note: Don't set Content-Type for FormData, browser does it automatically with boundary
        },
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Create an error object similar to what globalFetcher would throw
        const error = new Error(responseData?.message || "Server Validation Error");
        error.status = response.status;
        error.info = responseData;
        throw error;
      }

      const data = responseData;

      // If it was a draft, remove it from localStorage
      if (draftId) {
        try {
          const drafts = JSON.parse(
            localStorage.getItem(DRAFTS_LIST_KEY) || "[]",
          );
          const updatedDrafts = drafts.filter((d) => d.id !== draftId);
          localStorage.setItem(
            DRAFTS_LIST_KEY,
            JSON.stringify(updatedDrafts),
          );
        } catch (e) {
          console.error("Error removing draft:", e);
        }
      }

      localStorage.removeItem(DRAFT_KEY);

      toast.success(
        `Product ${isEditMode ? "updated" : "created"} successfully!`,
        { id: loadingToast }
      );
      router.push("/app/products");
    } catch (error) {
      console.error("❌ SUBMISSION ERROR:", error);
      
      if (error.info?.errors) {
        const backendErrors = {};
        const errors = error.info.errors;
        
        // Handle both array and object formats for errors
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            backendErrors[err.field || err.key] = err.messages ? err.messages[0] : err.message;
          });
        } else {
          // Standard Laravel format: { field: [messages] } or { field: message }
          Object.keys(errors).forEach((key) => {
            const val = errors[key];
            backendErrors[key] = Array.isArray(val) ? val[0] : val;
          });
        }
        setErrors(backendErrors);
        toast.error("Please correct the highlighted errors", { id: loadingToast });
      } else {
        toast.error(error.message || "An unexpected error occurred", { id: loadingToast });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!productSetupType && !isEditMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-all duration-300">
        <div className="max-w-md w-full bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl dark:shadow-slate-950/50 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Select Product Setup Type
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose the catalog configuration for your product.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option 1: Direct Product */}
            <button
              type="button"
              onClick={() => {
                setProductSetupType("direct");
                setVariants([
                  {
                    variant_name: "Default",
                    sku: "",
                    barcode: "",
                    imei: "",
                    warranty_period: "",
                    storage_size: "",
                    ram_size: "",
                    color: "",
                    price: "",
                    sales_price: "",
                    stock_quantity: "",
                    low_stock_threshold: "5",
                    is_offer: false,
                    offer_price: "",
                    is_trending: false,
                    is_active: true,
                    is_featured: false,
                    is_new_arrival: false,
                  }
                ]);
              }}
              className="group w-full flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-top-1"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Direct Product
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Standard single item. Direct SKU, pricing, and properties without variants.
                </p>
              </div>
            </button>

            {/* Option 2: Variant Product */}
            <button
              type="button"
              onClick={() => {
                setProductSetupType("variant");
              }}
              className="group w-full flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-top-2"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Variant Product
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Configurable items. Multiple variations of color, size, storage, each with pricing.
                </p>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/app/products")}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Back to Products List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-900 pb-20 font-sans text-slate-900 dark:text-slate-100"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes premiumFadeUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: premiumFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          will-change: transform, opacity;
        }
      `}} />
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-12 transition-all">
        {/* 1. HEADER & ACTIONS */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 min-w-0 tracking-tight">
                <span>{isEditMode ? "Edit Product" : "Create Product"}</span>
                {formData.name && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
                    <span className="truncate text-indigo-600 dark:text-indigo-400 font-bold">
                      {formData.name}
                    </span>
                  </>
                )}
              </h1>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${
                  formData.status === "published"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-550 border-amber-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    formData.status === "published" ? "bg-emerald-500 animate-pulse" : "bg-amber-550 animate-pulse"
                  }`} />
                  {formData.status} Mode
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SPLIT ACTION BUTTON */}
            <div className="relative flex items-stretch group" ref={saveDropdownRef}>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-l-lg text-xs font-bold tracking-wide uppercase transition-all active:scale-[0.98] disabled:scale-100 cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isEditMode ? "Update" : "Publish"}</span>
              </button>
              
              <button
                onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
                disabled={isLoading}
                className="px-3 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-250 dark:disabled:bg-slate-900 text-white rounded-r-lg border-l border-white/10 transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSaveDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isSaveDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <button
                    onClick={() => {
                      handleSaveDraft();
                      setIsSaveDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border-b border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-indigo-500" />
                    Save Draft
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to discard your progress? This will clear your local draft.")) {
                        localStorage.removeItem(DRAFT_KEY);
                        router.push("/app/products");
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-red-605 hover:bg-red-50 dark:hover:bg-red-955/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* ERROR BANNER */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-fade-up">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">
              Please fix the validation errors highlighted below.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* CREATION PROGRESS STEPPER */}
          <div className="md:col-span-4 lg:col-span-3 lg:sticky lg:top-24 self-start z-30 block">
            <div className="bg-white dark:bg-[#111322] border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-lg dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all overflow-hidden relative">
              {/* Glassmorphic Background Glows */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="hidden md:block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">
                Creation Progress
              </h3>
              
              {/* Horizontal Scroll on Mobile, Vertical on Desktop */}
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                {STEPS.map((step, idx) => {
                  const isCompleted = STEPS.findIndex(s => s.id === activeTab) > idx;
                  const isActive = activeTab === step.id;
                  const isCurrentStepComplete = isStepComplete(step.id);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveTab(step.id)}
                      className={`relative flex-none md:w-full flex items-center gap-3.5 p-3 rounded-xl transition-all duration-300 group whitespace-nowrap text-left cursor-pointer border
                        ${isActive 
                          ? "bg-indigo-50/50 dark:bg-gradient-to-r dark:from-indigo-500/[0.08] dark:via-purple-500/[0.04] dark:to-transparent border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                          : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 border
                        ${isActive 
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 dark:border-indigo-500/30 text-white shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                          : isCompleted 
                            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400" 
                            : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:border-slate-300 dark:group-hover:border-slate-600"}`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : <step.icon className="w-4 h-4" />}
                      </div>

                      <div className="flex flex-col items-start min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[13px] font-semibold truncate ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100"}`}>
                            {step.label}
                          </span>
                          {!isCurrentStepComplete && (
                            <span className="relative flex h-2 w-2 shrink-0" title="Incomplete Fields">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-semibold uppercase mt-0.5 ${isActive ? "text-indigo-500 dark:text-indigo-500" : "text-slate-400 dark:text-slate-600"}`}>
                          {isActive ? "Current Step" : isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6 lg:space-y-8 min-w-0">
            {/* TAB CONTENT: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-fade-up">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <FormInput
                      label="Product Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Apple iPhone 15 Pro"
                      error={errors.name}
                      required
                    />

                    <FormInput
                      label="Product Code"
                      value={formData.code}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, code: val });
                        if (productSetupType === "direct" && !isSkuManuallyEdited) {
                          updateDirectVariant("sku", val);
                        }
                      }}
                      placeholder="APL-IP15P-TIT"
                      error={errors.code}
                      suffix={
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateCode}
                          className="h-11 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                          Generate
                        </Button>
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormSelect
                        label="Category"
                        value={formData.category_id}
                        onChange={(val) => setFormData({ ...formData, category_id: val, subcategory_id: "" })}
                        options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                        placeholder="Select Category"
                        error={errors.category_id}
                        required
                      />
                      
                      <FormSelect
                        label="Subcategory"
                        value={formData.subcategory_id}
                        onChange={(val) => setFormData({ ...formData, subcategory_id: val })}
                        options={subCategories.map(sub => ({ label: sub.name, value: sub.id }))}
                        placeholder={formData.category_id ? (subCategories.length > 0 ? "Select Subcategory" : "No Subcategories Available") : "Select Category First"}
                        error={errors.subcategory_id}
                        disabled={!formData.category_id || subCategories.length === 0}
                      />

                      <FormSelect
                        label="Brand"
                        value={formData.brand_id}
                        onChange={(val) => setFormData({ ...formData, brand_id: val })}
                        options={brands.map(brand => ({ label: brand.name, value: brand.id }))}
                        placeholder="Select Brand"
                        error={errors.brand_id}
                        required
                      />
                    </div>

                    <FormTextarea
                      label="Short Description (Excerpt)"
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      placeholder="Brief summary for list views..."
                      error={errors.short_description}
                      description={`${formData.short_description.length}/160`}
                      maxLength={160}
                    />

                    <FormTextarea
                      label="Full Description"
                      value={formData.full_description}
                      onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                      placeholder="Write your full product description here..."
                      error={errors.full_description}
                      rows={8}
                    />

                    {/* Badges */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">
                        Product Badges
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <FormCheckbox
                          label="Featured"
                          checked={formData.is_featured}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              is_featured: !!checked,
                            })
                          }
                          className="border-none p-0 bg-transparent shadow-none"
                        />
                        <FormCheckbox
                          label="Trending"
                          checked={formData.is_trending}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              is_trending: !!checked,
                            })
                          }
                          className="border-none p-0 bg-transparent shadow-none"
                        />
                        <FormCheckbox
                          label="New Arrival"
                          checked={formData.is_new_arrival}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              is_new_arrival: !!checked,
                            })
                          }
                          className="border-none p-0 bg-transparent shadow-none"
                        />
                        <FormCheckbox
                          label="Active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              is_active: !!checked,
                            })
                          }
                          className="border-none p-0 bg-transparent shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div />
                  <button
                    onClick={() => setActiveTab("media")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Next Step <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEDIA */}
            {activeTab === "media" && (
              <div className="space-y-6 animate-fade-up">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Media & Gallery
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Upload your product images and choose which one is the main display photo.
                      </p>
                    </div>
                  </div>

                  {/* Dropzone Area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsMediaDragging(true); }}
                    onDragLeave={() => setIsMediaDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsMediaDragging(false);
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                      if (files.length > 0) {
                        const newImages = files.map((file) => ({
                          id: `new-${Date.now()}-${Math.random()}`,
                          file,
                          previewUrl: URL.createObjectURL(file),
                          isPrimary: false,
                          isExisting: false,
                        }));
                        setProductImages((prev) => {
                          const updated = [...prev, ...newImages];
                          if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
                            updated[0].isPrimary = true;
                          }
                          return updated;
                        });
                      }
                    }}
                    onClick={() => mediaInputRef.current?.click()}
                    className={`p-10 text-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 relative ${
                      isMediaDragging
                        ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 scale-[1.01]"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <input
                      ref={mediaInputRef}
                      type="file"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <UploadCloud className={`w-12 h-12 transition-transform duration-300 ${isMediaDragging ? "text-indigo-500 scale-110" : "text-slate-400 dark:text-slate-550"}`} />
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                        Drag & Drop or Click to Upload
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PNG, JPG, JPEG or WEBP formats up to 5MB each. Recommended dimension: 1200x1200px.
                      </p>
                    </div>
                  </div>

                  <ErrorText message={errors.primary_image_path || errors.primary_image} />

                  {/* Images List Grid */}
                  {productImages.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        Uploaded Photos ({productImages.length})
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-400 font-medium normal-case">
                          Hover to set primary, reorder or remove
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {productImages.map((img, idx) => (
                          <div
                            key={img.id}
                            className={`relative aspect-square group rounded-2xl overflow-hidden border transition-all duration-300 ${
                              img.isPrimary
                                ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-350 dark:hover:border-slate-650"
                            }`}
                          >
                            <img
                              src={img.previewUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-3 select-none">
                              {/* Top row actions (Set Primary status) */}
                              <div className="w-full flex justify-between items-start">
                                {img.isPrimary ? (
                                  <div className="px-2 py-1 bg-amber-500 text-white text-[9px] font-bold rounded flex items-center gap-1 shadow-sm">
                                    <Star className="w-2.5 h-2.5 fill-current" /> Main
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(img.id)}
                                    className="px-2 py-1 bg-white hover:bg-indigo-550 text-slate-700 hover:text-indigo-600 text-[9px] font-bold rounded shadow-sm transition-all"
                                  >
                                    Set Main
                                  </button>
                                )}
                              </div>

                              {/* Center row actions (Delete & Move) */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => moveMediaImage(idx, "left")}
                                  disabled={idx === 0}
                                  className="p-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                                  title="Move Left"
                                >
                                  <MoveLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMediaImage(img.id)}
                                  className="p-1.5 bg-white dark:bg-slate-800 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shadow-sm"
                                  title="Delete Image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveMediaImage(idx, "right")}
                                  disabled={idx === productImages.length - 1}
                                  className="p-1.5 bg-white dark:bg-slate-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                                  title="Move Right"
                                >
                                  <MoveRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-[10px] text-white/80 font-medium">
                                #{idx + 1}
                              </div>
                            </div>

                            {/* Always visible Primary badge/indicator */}
                            {img.isPrimary && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600/90 text-white text-[9px] font-bold rounded backdrop-blur-sm shadow flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-current text-amber-400" /> Primary
                              </div>
                            )}

                            {/* Thumbnail number when not hovered */}
                            {!img.isPrimary && (
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 text-white text-[9px] font-medium rounded backdrop-blur-sm">
                                #{idx + 1}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab("general")}
                    className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all active:scale-95"
                  >
                    <MoveLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setActiveTab("variants")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Next Step <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SPECS & FEATURES */}
            {activeTab === "specs" && (
              <div className="space-y-6 animate-fade-up">
                {/* Features with Autocomplete */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Key Features <span className="text-red-500">*</span>
                  </h3>
                  <div className="relative mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        placeholder="Type to search or add features..."
                        value={featureInput}
                        onChange={(e) =>
                          handleFeatureInputChange(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && featureInput.trim()) {
                            e.preventDefault();
                            handleAddFeature(featureInput.trim());
                          }
                        }}
                        onFocus={() =>
                          setShowFeatureSuggestions(featureInput.length > 0)
                        }
                      />
                      <button
                        onClick={() => {
                          if (featureInput.trim()) {
                            handleAddFeature(featureInput.trim());
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showFeatureSuggestions && filteredFeatures.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredFeatures.map((feature) => (
                          <button
                            key={feature.id}
                            onClick={() => handleAddFeature(feature)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
                          >
                            {feature.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ErrorText message={errors.feature_name} />
                  <div className="flex flex-wrap gap-2">
                    {selectedFeatures.map((feat) => (
                      <span
                        key={feat.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium"
                      >
                        {feat.name}
                        <button
                          onClick={() =>
                            setSelectedFeatures(
                              selectedFeatures.filter((f) => f.id !== feat.id),
                            )
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags with Autocomplete */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Product Tags
                  </h3>
                  <div className="relative mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        placeholder="Type to search or add tags..."
                        value={tagInput}
                        onChange={(e) => handleTagInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            e.preventDefault();
                            handleAddTag(tagInput.trim());
                          }
                        }}
                        onFocus={() =>
                          setShowTagSuggestions(tagInput.length > 0)
                        }
                      />
                      <button
                        onClick={() => {
                          if (tagInput.trim()) {
                            handleAddTag(tagInput.trim());
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showTagSuggestions && filteredTags.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTag(tag)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ErrorText message={errors.tags} />
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        {tag.name}
                        <button
                          onClick={() =>
                            setSelectedTags(
                              selectedTags.filter((t) => t.id !== tag.id),
                            )
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specs Table */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    Technical Specifications
                  </h3>
                  <div className="flex gap-4 mb-6 items-end">
                    <FormInput
                      label="Spec Label"
                      placeholder="e.g. Display"
                      value={specInput.specification_name}
                      onChange={(e) => setSpecInput({ ...specInput, specification_name: e.target.value })}
                      containerClassName="flex-1"
                    />
                    <FormInput
                      label="Value"
                      placeholder="e.g. 6.1-inch OLED"
                      value={specInput.specification_value}
                      onChange={(e) => setSpecInput({ ...specInput, specification_value: e.target.value })}
                      containerClassName="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSpec}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-4 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-4 py-3">Specification</th>
                          <th className="px-4 py-3">Value</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {specifications.map((spec, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                              {spec.specification_name}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {spec.specification_value}
                              <ErrorText message={errors[`specifications.${idx}.specification_name`] || errors[`specifications.${idx}.specification_value`]} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() =>
                                  setSpecifications(
                                    specifications.filter((_, i) => i !== idx),
                                  )
                                }
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab("variants")}
                    className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all active:scale-95"
                  >
                    <MoveLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setActiveTab("related")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Next Step <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: RELATED ITEMS */}
            {activeTab === "related" && (
              <div className="space-y-6 animate-fade-up">
                <ProductRelationshipSelector
                  title="Related Products"
                  description="Select products that are similar or compatible with this one."
                  selectedIds={formData.compatible_product_ids}
                  onUpdate={(ids) =>
                    setFormData({ ...formData, compatible_product_ids: ids })
                  }
                  searchTerm={productSearchTerm}
                  onSearchChange={setProductSearchTerm}
                  results={productSearchResults}
                  productDetailsMap={productDetailsMap}
                />

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab("specs")}
                    className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all active:scale-95"
                  >
                    <MoveLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isEditMode ? "Update Product" : "Publish Product"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: VARIANTS */}
            {activeTab === "variants" && (
              <div className="space-y-6 animate-fade-up">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                        {productSetupType === "direct" ? "Product Pricing & Inventory" : "Manage Variants"} <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {productSetupType === "direct" 
                          ? "Configure the pricing, inventory stock, and product properties." 
                          : "Configure multiple variations (sizes, colors, RAM/storage size, etc.) for this product."}
                      </p>
                    </div>
                    <div className="shrink-0 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-slate-200/50 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (productSetupType !== "direct") {
                            if (window.confirm("Are you sure you want to switch to Direct Product? This will reset custom variants.")) {
                              setProductSetupType("direct");
                              setVariants([
                                {
                                  variant_name: "Default",
                                  sku: formData.code || "",
                                  barcode: "",
                                  imei: "",
                                  warranty_period: "",
                                  storage_size: "",
                                  ram_size: "",
                                  color: "",
                                  price: "",
                                  sales_price: "",
                                  stock_quantity: "",
                                  low_stock_threshold: "5",
                                  is_offer: false,
                                  offer_price: "",
                                  is_trending: false,
                                  is_active: true,
                                  is_featured: false,
                                  is_new_arrival: false,
                                }
                              ]);
                            }
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          productSetupType === "direct"
                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Direct Setup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (productSetupType !== "variant") {
                            if (window.confirm("Are you sure you want to switch to Variant Product? This will reset direct pricing properties.")) {
                              setProductSetupType("variant");
                              setVariants([]);
                            }
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          productSetupType === "variant"
                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Variant Setup</span>
                      </button>
                    </div>
                  </div>

                  {productSetupType === "direct" ? (
                    /* SIMPLIFIED DIRECT PRODUCT FORM */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput
                          label="SKU"
                          placeholder="e.g. IP15P-256-NT"
                          value={directVariant.sku || ""}
                          onChange={(e) => updateDirectVariant("sku", e.target.value)}
                          error={errors[`variants.0.sku`]}
                          required
                        />
                        <FormInput
                          label="Barcode"
                          placeholder="e.g. 195949000123"
                          value={directVariant.barcode || ""}
                          onChange={(e) => updateDirectVariant("barcode", e.target.value.replace(/\D/g, ""))}
                        />
                        <FormInput
                          label="Warranty Period"
                          placeholder="e.g. 1 Year"
                          value={directVariant.warranty_period || ""}
                          onChange={(e) => updateDirectVariant("warranty_period", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput
                          label="Price"
                          type="number"
                          min="0"
                          placeholder="149900"
                          value={directVariant.price || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                              updateDirectVariant("price", val);
                            }
                          }}
                          prefix="Rs."
                          error={errors[`variants.0.price`]}
                          required
                        />
                        <FormInput
                          label="Sales Price"
                          type="number"
                          min="0"
                          placeholder="144900"
                          value={directVariant.sales_price || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                              updateDirectVariant("sales_price", val);
                            }
                          }}
                          prefix="Rs."
                          error={errors[`variants.0.sales_price`]}
                        />
                        <FormInput
                          label="Stock Quantity"
                          type="number"
                          min="0"
                          placeholder="50"
                          value={directVariant.stock_quantity !== undefined ? directVariant.stock_quantity : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                              updateDirectVariant("stock_quantity", val);
                            }
                          }}
                          error={errors[`variants.0.stock_quantity`]}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput
                          label="Color"
                          placeholder="Natural Titanium"
                          value={directVariant.color || ""}
                          onChange={(e) => updateDirectVariant("color", e.target.value)}
                          error={errors[`variants.0.color`]}
                        />
                        
                        <FormInput
                          label="Low Stock Alert"
                          type="number"
                          min="0"
                          placeholder="5"
                          value={directVariant.low_stock_threshold !== undefined ? directVariant.low_stock_threshold : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                              updateDirectVariant("low_stock_threshold", val);
                            }
                          }}
                        />

                        {isPhoneCategory && (
                          <FormInput
                            label="IMEI"
                            placeholder="IMEI Number"
                            value={directVariant.imei || ""}
                            onChange={(e) => updateDirectVariant("imei", e.target.value)}
                          />
                        )}
                      </div>

                      {isPhoneCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Storage"
                            placeholder="256GB"
                            value={directVariant.storage_size || ""}
                            onChange={(e) => updateDirectVariant("storage_size", e.target.value)}
                            error={errors[`variants.0.storage_size`]}
                            required
                          />
                          <FormInput
                            label="RAM"
                            type="number"
                            placeholder="8"
                            value={directVariant.ram_size || ""}
                            onChange={(e) => (e.target.value === "" || Number(e.target.value) >= 0) && updateDirectVariant("ram_size", e.target.value)}
                            suffix={<span className="text-xs font-medium text-slate-400 mt-3.5 block">GB</span>}
                            error={errors[`variants.0.ram_size`]}
                            required
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <FormCheckbox
                            label="On Offer"
                            checked={!!directVariant.is_offer}
                            onCheckedChange={(checked) => updateDirectVariant("is_offer", !!checked)}
                            className="border-none p-0 bg-transparent shadow-none"
                          />
                          {directVariant.is_offer && (
                            <FormInput
                              type="number"
                              min="0"
                              placeholder="799.00"
                              value={directVariant.offer_price || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                                  updateDirectVariant("offer_price", val);
                                }
                              }}
                              prefix="Rs."
                              containerClassName="flex-1 sm:w-40"
                              hideLabel
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Variant Adder */}
                  <div
                    id="variant-form"
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      editingVariantId
                        ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/5"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    } mb-6`}
                  >
                    {editingVariantId && (
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Pencil className="w-4 h-4" />
                          <span className="text-sm font-semibold">Editing Variant</span>
                        </div>
                        <button
                          onClick={cancelEditVariant}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
                        >
                          Cancel Editing
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <FormInput
                        label="Variant Name"
                        placeholder="e.g. Summer Edition"
                        value={currentVariant.variant_name}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, variant_name: e.target.value })}
                        description="(Optional)"
                      />
                      <FormInput
                        label="SKU"
                        placeholder="IP15P-256-NT"
                        value={currentVariant.sku}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                        error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.sku`] : null}
                        required
                      />
                      <FormInput
                        label="Barcode"
                        placeholder="195949000123"
                        value={currentVariant.barcode}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, barcode: e.target.value.replace(/\D/g, "") })}
                      />
                      {isPhoneCategory && (
                        <FormInput
                          label="IMEI"
                          placeholder="IMEI Number"
                          value={currentVariant.imei}
                          onChange={(e) => setCurrentVariant({ ...currentVariant, imei: e.target.value })}
                        />
                      )}
                      <FormInput
                        label="Warranty Period"
                        placeholder="e.g. 1 Year"
                        value={currentVariant.warranty_period}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, warranty_period: e.target.value })}
                      />
                      {isPhoneCategory && (
                        <>
                          <FormInput
                            label="Storage"
                            placeholder="256GB"
                            value={currentVariant.storage_size}
                            onChange={(e) => setCurrentVariant({ ...currentVariant, storage_size: e.target.value })}
                            error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.storage_size`] : null}
                            required
                          />
                          <FormInput
                            label="RAM"
                            type="number"
                            placeholder="8"
                            value={currentVariant.ram_size}
                            onChange={(e) => (e.target.value === "" || Number(e.target.value) >= 0) && setCurrentVariant({ ...currentVariant, ram_size: e.target.value })}
                            suffix={<span className="text-xs font-medium text-slate-400 mt-3.5 block">GB</span>}
                            error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.ram_size`] : null}
                            required
                          />
                        </>
                      )}
                      <FormInput
                        label="Color"
                        placeholder="Natural Titanium"
                        value={currentVariant.color}
                        onChange={(e) => setCurrentVariant({ ...currentVariant, color: e.target.value })}
                        error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.color`] : null}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <FormInput
                        label="Price"
                        type="number"
                        min="0"
                        placeholder="149900"
                        value={currentVariant.price}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                            setCurrentVariant({ ...currentVariant, price: val });
                          }
                        }}
                        prefix="Rs."
                        error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.price`] : null}
                        required
                      />
                      <FormInput
                        label="Sales Price"
                        type="number"
                        min="0"
                        placeholder="144900"
                        value={currentVariant.sales_price}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                            setCurrentVariant({ ...currentVariant, sales_price: val });
                          }
                        }}
                        prefix="Rs."
                        error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.sales_price`] : null}
                      />
                      <FormInput
                        label="Stock Quantity"
                        type="number"
                        min="0"
                        placeholder="50"
                        value={currentVariant.stock_quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                            setCurrentVariant({ ...currentVariant, stock_quantity: val });
                          }
                        }}
                        error={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.stock_quantity`] : null}
                        required
                      />
                      <FormInput
                        label="Low Stock Alert"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={currentVariant.low_stock_threshold}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                            setCurrentVariant({ ...currentVariant, low_stock_threshold: val });
                          }
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-6">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <FormCheckbox
                          label="On Offer"
                          checked={currentVariant.is_offer}
                          onCheckedChange={(checked) => setCurrentVariant({ ...currentVariant, is_offer: !!checked })}
                          className="border-none p-0 bg-transparent shadow-none"
                        />
                        {currentVariant.is_offer && (
                          <FormInput
                            type="number"
                            min="0"
                            placeholder="799.00"
                            value={currentVariant.offer_price}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (!val.includes("-") && Number(val) >= 0)) {
                                setCurrentVariant({ ...currentVariant, offer_price: val });
                              }
                            }}
                            prefix="Rs."
                            containerClassName="flex-1 sm:w-40"
                            hideLabel
                          />
                        )}
                      </div>

                      </div>

                    <div className="flex gap-3">
                      {editingVariantId && (
                        <button
                          onClick={cancelEditVariant}
                          className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-medium transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={addVariant}
                        className="flex-[2] py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                      >
                        {editingVariantId ? (
                          <>
                            <Check className="w-4 h-4" />
                            Update Variant
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Variant
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Variants List */}
                  {variants.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400">
                        Added Variants ({variants.length})
                      </h4>
                      {variants.map((variant, idx) => (
                        <div
                          key={variant.id}
                          className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 overflow-hidden ${
                            expandedVariantId === variant.id
                              ? "border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                              : Object.keys(errors).some(key => key.startsWith(`variants.${idx}.`))
                                ? "border-red-500 shadow-lg shadow-red-500/10 ring-1 ring-red-500/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                          }`}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() =>
                              setExpandedVariantId(
                                expandedVariantId === variant.id
                                  ? null
                                  : variant.id,
                              )
                            }
                            className="flex items-center justify-between p-4 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-slate-900 dark:text-white leading-tight">
                                  {variant.variant_name || variant.condition}
                                </h5>
                                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                                    {variant.sku}
                                  </p>
                                  {Object.keys(errors).some(key => key.startsWith(`variants.${idx}.`)) && (
                                    <div className="flex items-center gap-1 mt-1 text-red-500">
                                      <AlertCircle className="w-3 h-3" />
                                      <span className="text-[9px] font-semibold uppercase">Has Validation Errors</span>
                                    </div>
                                  )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 mr-2">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                  Rs {formatPrice(variant.price)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  • {variant.stock_quantity} in stock
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editVariant(variant);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="Edit Variant"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyVariant(variant);
                                }}
                                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                title="Copy Variant"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVariants(
                                    variants.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete Variant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="ml-2 text-slate-400">
                                {expandedVariantId === variant.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Accordion Content */}
                          {expandedVariantId === variant.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Barcode
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                                    {variant.barcode || "N/A"}
                                  </p>
                                </div>
                                  {isPhoneCategory && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-medium text-slate-400 uppercase">
                                        IMEI
                                      </p>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                                        {variant.imei || "N/A"}
                                      </p>
                                    </div>
                                  )}
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Warranty
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">
                                    {variant.warranty_period || "N/A"}
                                  </p>
                                </div>
                                  {isPhoneCategory && (
                                    <>
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                                          Storage
                                        </p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                          {variant.storage_size || "N/A"}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                                          RAM
                                        </p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300">
                                          {variant.ram_size || "N/A"}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Color
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">
                                    {variant.color || "N/A"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Sales Price
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">
                                    Rs {formatPrice(variant.sales_price || variant.price)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Low Stock Alert
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">
                                    {variant.low_stock_threshold} units
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Offer Price
                                  </p>
                                  <p className="text-xs text-amber-600 font-semibold">
                                    {variant.is_offer
                                      ? `Rs ${formatPrice(variant.offer_price)}`
                                      : "No Offer"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    Badges
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {variant.is_trending && (
                                      <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[8px] font-medium rounded uppercase">
                                        Trending
                                      </span>
                                    )}
                                    {variant.is_featured && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-medium rounded uppercase">
                                        Featured
                                      </span>
                                    )}
                                    {variant.is_active ? (
                                      <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-medium rounded uppercase">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[8px] font-medium rounded uppercase">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveTab("media")}
                    className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all active:scale-95"
                  >
                    <MoveLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Next Step <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FIXED BOTTOM STATS & ERRORS */}
      <div className="fixed bottom-4 left-6 right-6 z-[100] flex items-center justify-between pointer-events-none">
        {/* Error FAB (Bottom Left) */}
        {Object.keys(errors).length > 0 ? (
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-full shadow-2xl animate-in zoom-in slide-in-from-bottom-5 duration-300 border border-red-500/50">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center font-semibold text-xs">
              {Object.keys(errors).length}
            </div>
            <span className="text-xs font-semibold uppercase tracking-tight">Issues Detected</span>
            <button 
              onClick={() => {
                const firstErrorField = Object.keys(errors)[0];
                const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
                if (element) {
                   element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   element.focus?.();
                }
              }}
              className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>
        ) : <div />}

        {/* Stats Pill (Bottom Right) */}
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-full shadow-xl text-[10px] font-medium text-slate-500 dark:text-slate-400 transition-all duration-300">
          <span className="hidden sm:inline shrink-0 uppercase opacity-60">Status:</span>
          <span className="shrink-0">VARIANTS: <span className="text-slate-900 dark:text-white font-semibold">{variants.length}</span></span>
          <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          <span className="shrink-0">IMAGES: <span className="text-slate-900 dark:text-white font-semibold">{productImages.length}</span></span>
          <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          <span className="hidden lg:flex items-center gap-1 min-w-0">
            CATEGORY: <span className="text-slate-900 dark:text-white uppercase font-semibold truncate max-w-[100px]">{categories.find(c => String(c.id) === String(formData.category_id))?.name || "N/A"}</span>
            {formData.subcategory_id && subCategories.length > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">/</span>
                <span className="text-indigo-600 dark:text-indigo-400 uppercase font-bold truncate max-w-[100px]">{subCategories.find(s => String(s.id) === String(formData.subcategory_id))?.name}</span>
              </>
            )}
            <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          </span>
          <span className="shrink-0">SPECS: <span className="text-slate-900 dark:text-white font-semibold">{specifications.length}</span></span>
          {isDirty && (
            <>
              <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
              <span className="flex items-center gap-1 text-amber-500 whitespace-nowrap">
                <AlertCircle className="w-3 h-3" /> <span className="hidden sm:inline">Unsaved</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to discard this draft? All unsaved changes will be lost.")) {
                    localStorage.removeItem(DRAFT_KEY);
                    setFormData({
                      name: "",
                      code: "",
                      category_id: "",
                      subcategory_id: "",
                      brand_id: "",
                      type: "physical",
                      status: "draft",
                      short_description: "",
                      full_description: "",
                      is_featured: false,
                      is_trending: false,
                      is_new_arrival: false,
                      is_active: true,
                      bundled_product_ids: [],
                      compatible_product_ids: [],
                    });
                    setVariants([]);
                    setSpecifications([]);
                    setSelectedTags([]);
                    setSelectedFeatures([]);
                    setGalleryImageFiles([]);
                    setGalleryImagePreviews([]);
                    setHeroImageFile(null);
                    setHeroImagePreview(null);
                    setInitialData(null);
                    setIsDirty(false);
                    toast.success("Draft discarded and form reset.");
                  }
                }}
                className="ml-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 rounded-md transition-colors font-semibold uppercase"
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>

      {/* GORGEOUS FLOATING VALIDATION CHECKLIST MODAL */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 dark:text-white">Required Information</h3>
              </div>
              <button 
                onClick={() => setShowValidationModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                To publish this product, please provide the following required details. Click any item below to jump directly to that field:
              </p>
              <div className="space-y-2">
                {validationErrors.map((err, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveTab(err.stepId);
                      setShowValidationModal(false);
                      setTimeout(() => {
                        const el = document.getElementsByName(err.field)[0] || document.getElementById(err.field);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.focus?.();
                        } else if (err.field.startsWith("variants.")) {
                          const formEl = document.getElementById("variant-form");
                          if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 100);
                    }}
                    className="w-full flex items-start gap-3 p-3 bg-slate-50 hover:bg-indigo-50/30 dark:bg-slate-900/30 dark:hover:bg-indigo-950/10 border border-slate-100 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-950/20 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {err.stepLabel}
                      </span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {err.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Got it, Let's fix it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CreateProductContent />
    </Suspense>
  );
}
