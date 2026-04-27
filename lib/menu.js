// --- SHARED MENU DATA FOR SIDEBAR AND MIDDLEWARE ---

export const ALL_MENU_GROUPS = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", icon: "LayoutDashboard", href: "/app" },
      ],
    },
    {
      label: "Product Catalog",
      items: [
        {
          title: "Products",
          icon: "ShoppingBag",
          href: "/app/products",
          permission: "Product Index",
          submenu: [
            { title: "All Products", href: "/app/products" },
            { title: "Add Product", href: "/app/products/new" },
          ],
        },
        { title: "Categories", icon: "Layers", href: "/app/categories", permission: "Category Index" },
        { title: "Brands", icon: "Tag", href: "/app/brand", permission: "Brand Index" },
      ],
    },
    {
      label: "Sales Management",
      items: [
        { title: "Orders", icon: "ShoppingCart", href: "/app/orders", permission: "Order Index" },
        { title: "Reviews", icon: "MessageSquare", href: "/app/reviews", permission: "Review Index" },
        { title: "Inquiries", icon: "Mail", href: "/app/contacts", permission: "Contact Index" },
      ],
    },
    {
      label: "Promotions",
      items: [
        { title: "Coupons", icon: "Tag", href: "/app/coupons", permission: "Coupon Index" },
      ],
    },
    {
      label: "User Management",
      items: [
        { title: "Customers", icon: "Users", href: "/app/customers", permission: "Customer Index" },
        { title: "Staff", icon: "ShieldCheck", href: "/app/users", permission: "Admin User Index" },
      ],
    },
    {
      label: "Design & Content",
      items: [
        {
          title: "Home Page",
          icon: "Monitor",
          href: "/app/cms", // Base path for CMS
          permission: "CMS Index",
          submenu: [
            { title: "Hero Banners", href: "/app/cms/hero" },
            { title: "Collections Grid", href: "/app/cms/collections" },
            { title: "Trending Variants", href: "/app/cms/trending" },
            { title: "Promo Banners", href: "/app/cms/featured-sections" },
            { title: "Promises", href: "/app/cms/promises" },
            { title: "Product Showcase", href: "/app/cms/product-showcase" },
            { title: "FAQs", href: "/app/cms/faqs" },
            { title: "Header", href: "/app/cms/header" },
            { title: "Footer", href: "/app/cms/footer" },
          ],
        },
        {
          title: "Shop Page",
          icon: "Monitor",
          href: "#",
          permission: "CMS Index",
          submenu: [
            { title: "Shop Hero", href: "/app/cms/shop" },
          ],
        },
        {
          title: "Contact Page",
          icon: "Monitor",
          href: "#",
          permission: "CMS Index",
          submenu: [
            { title: "Contact Hero", href: "/app/cms/contact" },
          ],
        },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Settings", icon: "Settings", href: "/app/settings", permission: "Setting Index" },
        { title: "Activity Logs", icon: "History", href: "/app/logs", permission: "Activity Log Index" },
        { title: "Roles", icon: "ShieldCheck", href: "/app/roles", permission: "Role Index" },
        { title: "Permissions", icon: "Lock", href: "/app/permissions", permission: "Permission Index" },
      ],
    },
  ];
