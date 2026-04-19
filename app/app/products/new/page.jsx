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
} from "lucide-react";

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

const CustomCheckbox = ({ id, checked, onCheckedChange }) => {
  return (
    <div className="relative w-5 h-5 shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
      />
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          checked
            ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20"
            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-400"
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
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
    { id: "buy_together", label: "Buy Together", icon: ShoppingCart },
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
      if (window.innerWidth < 768) {
        setStepperOrientation("horizontal");
      } else {
        setStepperOrientation("vertical");
      }
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
  const heroInputRef = useRef(null);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);

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
  const brands = brandsData?.data || [];
  const availableTags = tagsData?.data || [];
  const availableFeatures = featuresData?.data || [];

  const isPhoneCategory = React.useMemo(() => {
    if (!formData.category_id || !categories) return false;
    const cat = categories.find(c => String(c.id) === String(formData.category_id));
    const name = cat?.name?.toLowerCase() || "";
    return (name.includes("phone") || name.includes("mobile")) && !name.includes("accessor");
  }, [formData.category_id, categories]);

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
        v.color &&
        (!isPhoneCategory || (v.storage_size && v.ram_size))
    );

  const isStepComplete = (stepId) => {
    switch (stepId) {
      case "general":
        return !!(formData.name && formData.category_id && formData.brand_id && formData.type);
      case "media":
        return !!(heroImageFile || (isEditMode && formData.primary_image_path));
      case "variants":
        return variants.length > 0 && variants.every(
          (v) => v.sku && v.price && v.stock_quantity !== "" && v.color && (!isPhoneCategory || (v.storage_size && v.ram_size))
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
            
            // Set global condition from the first variant
            if (product.variants[0]?.condition) {
              setFormData(prev => ({
                ...prev,
                condition: product.variants[0].condition
              }));
            }
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

          // Load primary image
          if (product.primary_image_path) {
            const imageUrl = getImageUrl(product.primary_image_path);
            setHeroImagePreview(imageUrl);
          }

          // Load gallery images
          if (product.images && product.images.length > 0) {
            const galleryUrls = product.images.map(img => getImageUrl(img.image_path));
            setGalleryImagePreviews(galleryUrls);
          }

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
      heroImageFile !== null ||
      galleryImageFiles.length > 0;

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
    heroImageFile,
    galleryImageFiles,
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

  // --- ANIMATIONS ---
  useGSAP(
    () => {
      gsap.fromTo(
        ".animate-fade-up",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, clearProps: "all" },
      );
    },
    { scope: containerRef, dependencies: [activeTab] },
  );

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
  const handleHeroUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroImageFile(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveHeroImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeroImageFile(null);
    setHeroImagePreview(null);
    if (heroInputRef.current) {
      heroInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    setGalleryImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGalleryImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const moveGalleryImage = (index, direction) => {
    const newFiles = [...galleryImageFiles];
    const newPreviews = [...galleryImagePreviews];

    if (direction === "left" && index > 0) {
      [newFiles[index], newFiles[index - 1]] = [
        newFiles[index - 1],
        newFiles[index],
      ];
      [newPreviews[index], newPreviews[index - 1]] = [
        newPreviews[index - 1],
        newPreviews[index],
      ];
    } else if (direction === "right" && index < newFiles.length - 1) {
      [newFiles[index], newFiles[index + 1]] = [
        newFiles[index + 1],
        newFiles[index],
      ];
      [newPreviews[index], newPreviews[index + 1]] = [
        newPreviews[index + 1],
        newPreviews[index],
      ];
    }

    setGalleryImageFiles(newFiles);
    setGalleryImagePreviews(newPreviews);
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

    // Images
    if (heroImageFile) {
      data.append("primary_image_path", heroImageFile);
    }
    galleryImageFiles.forEach((file) => {
      data.append("images[]", file);
    });

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

    // Basic validation
    if (
      !formData.name ||
      !formData.category_id ||
      !formData.brand_id
    ) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (variants.length === 0) {
      toast.error("Please add at least one variant");
      setIsLoading(false);
      return;
    }

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

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-900 pb-20 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* 1. HEADER & ACTIONS */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-all rounded-xl mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="shrink-0 whitespace-nowrap">{isEditMode ? "Edit" : "Create"}</span>
                  {formData.name && (
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-slate-300 dark:text-slate-600 font-light shrink-0">|</span>
                      <span className="truncate text-indigo-600 dark:text-indigo-400 font-semibold">
                        {formData.name}
                      </span>
                    </div>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${formData.status === "published" ? "bg-green-500" : "bg-amber-500"}`}
                  ></span>
                  {formData.status} Mode
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Orientation Toggle (Hidden on Mobile) */}
              <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200 dark:border-slate-600 mr-1">
                <button
                  onClick={() => setStepperOrientation("horizontal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stepperOrientation === "horizontal"
                      ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => setStepperOrientation("vertical")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stepperOrientation === "vertical"
                      ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Vertical
                </button>
              </div>

              {/* SPLIT ACTION BUTTON */}
              <div className="relative flex items-stretch group" ref={saveDropdownRef}>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !isFormValid}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-l-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:scale-100 uppercase tracking-tight sm:tracking-normal"
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
                  className="px-2 sm:px-3 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 dark:disabled:bg-slate-900 text-white rounded-r-xl border-l border-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSaveDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isSaveDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <button
                      onClick={() => {
                        handleSaveDraft();
                        setIsSaveDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700"
                    >
                      <Save className="w-4 h-4 text-indigo-500" />
                      Save as Draft
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to discard your progress? This will clear your local draft.")) {
                          localStorage.removeItem(DRAFT_KEY);
                          router.push("/app/products");
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Discard Draft
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE STEP INDICATOR (Show only on < 768px) */}
          <div className="md:hidden mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-4">
               <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">
                     Step {STEPS.findIndex(s => s.id === activeTab) + 1} of {STEPS.length}
                  </span>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                     {STEPS.find(s => s.id === activeTab)?.label}
                  </span>
               </div>
               <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                    style={{ width: `${((STEPS.findIndex(s => s.id === activeTab) + 1) / STEPS.length) * 100}%` }}
                  />
               </div>
            </div>
          </div>

          {/* WIZARD STEPPER */}
          {stepperOrientation === "horizontal" && (
            <div className="relative flex items-center justify-between w-full max-w-5xl mx-auto px-4 py-8 pb-12">
              {/* Background Line */}
              <div className="absolute top-[52px] left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-700 -translate-y-1/2 z-0" />
              
              {/* Progress Line */}
              <div 
                className="absolute top-[52px] left-0 h-[2px] bg-indigo-600 transition-all duration-500 -translate-y-1/2 z-0"
                style={{ width: `${(STEPS.findIndex(s => s.id === activeTab) / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, idx) => {
                const isCompleted = STEPS.findIndex(s => s.id === activeTab) > idx;
                const isActive = activeTab === step.id;
                
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group">
                    <button
                      onClick={() => setActiveTab(step.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 
                        ${isActive ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-110" : 
                          isCompleted ? "bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600" : 
                          "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"}`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : <step.icon className="w-4 h-4" />}
                      {!isStepComplete(step.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                    <div className="absolute top-12 flex flex-col items-center whitespace-nowrap">
                        <span className={`text-[10px] font-medium uppercase tracking-widest transition-colors duration-300
                        ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 transition-all">
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
          {/* VERTICAL STEPPER (Side Navigation) */}
          <div className={`md:col-span-4 lg:col-span-3 lg:sticky lg:top-24 self-start z-30 ${stepperOrientation === "horizontal" ? "hidden md:block" : "block"}`}>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all overflow-hidden">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">
                Creation Progress
              </h3>
              <div className="space-y-1.5">
                {STEPS.map((step, idx) => {
                  const isCompleted = STEPS.findIndex(s => s.id === activeTab) > idx;
                  const isActive = activeTab === step.id;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveTab(step.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group
                        ${isActive ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100/50" : 
                          "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0
                        ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : 
                          isCompleted ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : 
                          "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"}`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <step.icon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex flex-col items-start truncate min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[13px] font-medium truncate ${isActive ? "text-indigo-600" : "text-slate-600 dark:text-slate-300"}`}>{step.label}</span>
                          {!isStepComplete(step.id) && (
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        {isActive && <span className="text-[8px] font-medium opacity-70 uppercase tracking-tighter">Current Step</span>}
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
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                        placeholder="e.g. Apple iPhone 15 Pro"
                      />
                      <ErrorText message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Product Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                              setFormData({ ...formData, code: e.target.value })
                            }
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600 dark:text-slate-300 text-sm"
                            placeholder="APL-IP15P-TIT"
                          />
                          <button
                            onClick={generateCode}
                            className="px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold"
                          >
                            Generate
                          </button>
                        </div>
                        <ErrorText message={errors.code} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Product Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        >
                          <option value="physical">Physical Product</option>
                          <option value="digital">Digital Asset</option>
                          <option value="service">Service</option>
                        </select>
                        <ErrorText message={errors.type} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.condition}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              condition: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        >
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                        <ErrorText message={errors.condition} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category_id: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <ErrorText message={errors.category_id} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Brand <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.brand_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand_id: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        >
                          <option value="">Select Brand</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                        <ErrorText message={errors.brand_id} />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Short Description (Excerpt)
                      </label>
                      <textarea
                        rows="2"
                        value={formData.short_description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            short_description: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:text-white"
                        placeholder="Brief summary for list views..."
                        maxLength="160"
                      ></textarea>
                      <ErrorText message={errors.short_description} />
                      <p className="text-[10px] text-right text-slate-400">
                        {formData.short_description.length}/160
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Full Description
                      </label>
                      <textarea
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm dark:text-white"
                        placeholder="Write your full product description here..."
                        value={formData.full_description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_description: e.target.value,
                          })
                        }
                        rows="8"
                      ></textarea>
                      <ErrorText message={errors.full_description} />
                    </div>

                    {/* Badges */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-2 block">
                        Product Badges
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <CustomCheckbox
                            id="is_featured"
                            checked={formData.is_featured}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                is_featured: !!checked,
                              })
                            }
                          />
                          <span className="text-sm">Featured</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <CustomCheckbox
                            id="is_trending"
                            checked={formData.is_trending}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                is_trending: !!checked,
                              })
                            }
                          />
                          <span className="text-sm">Trending</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <CustomCheckbox
                            id="is_new_arrival"
                            checked={formData.is_new_arrival}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                is_new_arrival: !!checked,
                              })
                            }
                          />
                          <span className="text-sm">New Arrival</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <CustomCheckbox
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                is_active: !!checked,
                              })
                            }
                          />
                          <span className="text-sm">Active</span>
                        </label>
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
                {/* Hero Image */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Primary Image
                  </h3>
                  <div className="flex gap-6 items-start">
                    <div className="w-40 h-40 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center relative overflow-hidden group">
                      {heroImagePreview ? (
                        <>
                          <img
                            src={heroImagePreview}
                            alt="Hero"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={handleRemoveHeroImage}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <div className="text-center p-2">
                            <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <span className="text-[10px] font-medium text-slate-400">
                              Click to Upload
                            </span>
                          </div>
                          <input
                            ref={heroInputRef}
                            type="file"
                            onChange={handleHeroUpload}
                            className="hidden"
                            accept="image/*"
                          />
                        </label>
                      )}
                      
                      {/* Hidden input for when image is already present but user wants to change it by clicking the image */}
                      {heroImagePreview && (
                        <label className="absolute inset-0 cursor-pointer">
                          <input
                            ref={heroInputRef}
                            type="file"
                            onChange={handleHeroUpload}
                            className="hidden"
                            accept="image/*"
                            title=""
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        This is the main image used on category pages and search
                        results.
                      </p>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>• Recommended Size: 1200x1200px</p>
                          <p>• Max File Size: 5MB</p>
                          <p>• Format: JPG, PNG, WEBP</p>
                        </div>
                        <ErrorText message={errors.primary_image_path || errors.primary_image} />
                      </div>
                    </div>
                  </div>

                {/* Gallery */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Gallery Images
                    </h3>
                    <label className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                      + Add Images
                      <input
                        type="file"
                        multiple
                        onChange={handleGalleryUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>

                  {galleryImagePreviews.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">
                        No extra images added yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {galleryImagePreviews.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => moveGalleryImage(idx, "left")}
                              className="p-1 bg-white dark:bg-slate-800 rounded hover:bg-indigo-50 dark:hover:bg-slate-700"
                            >
                              <MoveLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setGalleryImageFiles(
                                  galleryImageFiles.filter((_, i) => i !== idx),
                                );
                                setGalleryImagePreviews(
                                  galleryImagePreviews.filter(
                                    (_, i) => i !== idx,
                                  ),
                                );
                              }}
                              className="p-1 bg-white dark:bg-slate-800 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveGalleryImage(idx, "right")}
                              className="p-1 bg-white dark:bg-slate-800 rounded hover:bg-indigo-50 dark:hover:bg-slate-700"
                            >
                              <MoveRight className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm font-medium">
                            #{idx + 1}
                          </div>
                        </div>
                      ))}
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
                  <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-400">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        placeholder="e.g. Display"
                        value={specInput.specification_name}
                        onChange={(e) =>
                          setSpecInput({
                            ...specInput,
                            specification_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-400">
                        Value <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                        placeholder="e.g. 6.1-inch OLED"
                        value={specInput.specification_value}
                        onChange={(e) =>
                          setSpecInput({
                            ...specInput,
                            specification_value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={handleAddSpec}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl h-[38px]"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
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
                    onClick={() => setActiveTab("buy_together")}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Next Step <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {activeTab === "buy_together" && (
              <div className="space-y-6 animate-fade-up">
                <ProductRelationshipSelector
                  title="Buy Together Products"
                  description="Select products that are frequently bought together with this one (e.g. accessories)."
                  selectedIds={formData.bundled_product_ids}
                  onUpdate={(ids) =>
                    setFormData({ ...formData, bundled_product_ids: ids })
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
                    onClick={() => setActiveTab("buy_together")}
                    className="flex items-center gap-2 px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all active:scale-95"
                  >
                    <MoveLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !isFormValid}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">
                    Manage Variants <span className="text-red-500">*</span>
                  </h3>

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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Variant Name <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={currentVariant.variant_name}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              variant_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="e.g. Summer Edition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={currentVariant.sku}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              sku: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="IP15P-256-NT"
                        />
                        <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.sku`] : null} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Barcode
                        </label>
                        <input
                          type="text"
                          value={currentVariant.barcode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setCurrentVariant({
                              ...currentVariant,
                              barcode: val,
                            });
                          }}
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="195949000123"
                        />
                      </div>
                      {isPhoneCategory && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                            IMEI
                          </label>
                          <input
                            type="text"
                            value={currentVariant.imei}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                imei: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="IMEI Number"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Warranty Period
                        </label>
                        <input
                          type="text"
                          value={currentVariant.warranty_period}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              warranty_period: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="e.g. 1 Year"
                        />
                      </div>
                      {isPhoneCategory && (
                        <>
                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                              Storage <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={currentVariant.storage_size}
                              onChange={(e) =>
                                setCurrentVariant({
                                  ...currentVariant,
                                  storage_size: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                              placeholder="256GB"
                            />
                            <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.storage_size`] : null} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                              RAM <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={currentVariant.ram_size}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || Number(val) >= 0) {
                                    setCurrentVariant({
                                      ...currentVariant,
                                      ram_size: val,
                                    });
                                  }
                                }}
                                className="w-full px-3 py-2 pr-10 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                                GB
                              </span>
                            </div>
                            <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.ram_size`] : null} />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Color <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={currentVariant.color}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              color: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="Natural Titanium"
                        />
                        <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.color`] : null} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={currentVariant.price}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                price: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pl-10 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="149900"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                            Rs
                          </span>
                        </div>
                        <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.price`] : null} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Sales Price
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={currentVariant.sales_price}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                sales_price: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pl-10 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="144900"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                            Rs
                          </span>
                        </div>
                        <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.sales_price`] : null} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={currentVariant.stock_quantity}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              stock_quantity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="50"
                        />
                        <ErrorText message={editingVariantId ? errors[`variants.${variants.findIndex(v => v.id === editingVariantId)}.stock_quantity`] : null} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                          Low Stock Alert
                        </label>
                        <input
                          type="number"
                          value={currentVariant.low_stock_threshold}
                          onChange={(e) =>
                            setCurrentVariant({
                              ...currentVariant,
                              low_stock_threshold: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <CustomCheckbox
                          id="variant_is_offer"
                          checked={currentVariant.is_offer}
                          onCheckedChange={(checked) =>
                            setCurrentVariant({
                              ...currentVariant,
                              is_offer: !!checked,
                            })
                          }
                        />
                        <span className="text-sm">On Offer</span>
                      </label>
                      {currentVariant.is_offer && (
                        <div className="relative">
                          <input
                            type="number"
                            value={currentVariant.offer_price}
                            onChange={(e) =>
                              setCurrentVariant({
                                ...currentVariant,
                                offer_price: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 pl-10 border dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="799.00"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                            Rs
                          </span>
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <CustomCheckbox
                          id="variant_is_trending"
                          checked={currentVariant.is_trending}
                          onCheckedChange={(checked) =>
                            setCurrentVariant({
                              ...currentVariant,
                              is_trending: !!checked,
                            })
                          }
                        />
                        <span className="text-sm">Trending</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <CustomCheckbox
                          id="variant_is_featured"
                          checked={currentVariant.is_featured}
                          onCheckedChange={(checked) =>
                            setCurrentVariant({
                              ...currentVariant,
                              is_featured: !!checked,
                            })
                          }
                        />
                        <span className="text-sm">Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <CustomCheckbox
                          id="variant_is_new_arrival"
                          checked={currentVariant.is_new_arrival}
                          onCheckedChange={(checked) =>
                            setCurrentVariant({
                              ...currentVariant,
                              is_new_arrival: !!checked,
                            })
                          }
                        />
                        <span className="text-sm">New Arrival</span>
                      </label>
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
          <span className="shrink-0">IMAGES: <span className="text-slate-900 dark:text-white font-semibold">{galleryImagePreviews.length + (heroImagePreview ? 1 : 0)}</span></span>
          <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          <span className="hidden lg:flex items-center gap-1 min-w-0">
            CATEGORY: <span className="text-slate-900 dark:text-white uppercase font-semibold truncate max-w-[100px]">{categories.find(c => String(c.id) === String(formData.category_id))?.name || "N/A"}</span>
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
