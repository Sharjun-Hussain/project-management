
import React from "react";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import SidebarClient from "./SidebarClient";
import { authOptions } from "@/lib/auth";
// We pass icon names as strings to avoid "Functions cannot be passed directly to Client Components" errors

// --- MENU DATA ---
const ALL_MENU_GROUPS = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", icon: "LayoutDashboard", href: "/app" },
    ],
  },
  {
    label: "Project Management",
    items: [
      {
        title: "Projects",
        icon: "ShoppingBag",
        href: "/app/projects",
        permission: "Product Index",
        submenu: [
          { title: "All Projects", href: "/app/projects" },
          { title: "Add Project", href: "/app/projects/new" },
        ],
      },
      { title: "VPS Hosting", icon: "Layers", href: "/app/vps", permission: "Category Index" },
      { title: "Domains", icon: "Globe", href: "/app/domains", permission: "SubCategory Index" },
      { title: "Purchased Licenses", icon: "Tag", href: "/app/licenses", permission: "Brand Index" },
    ],
  },
  {
    label: "Renewals & Alerts",
    items: [
      { title: "Renewals", icon: "ShoppingCart", href: "/app/renewals", permission: "Order Index" },
      { title: "Review Alerts", icon: "MessageSquare", href: "/app/alerts", permission: "Review Index" },
      { title: "Support Tickets", icon: "Mail", href: "/app/support", permission: "Contact Index" },
      { title: "System Alerts", icon: "Bell", href: "/app/system-alerts", permission: "Review Index" },
    ],
  },
  {
    label: "Client Management",
    items: [
      { title: "Clients", icon: "Users", href: "/app/clients", permission: "Customer Index" },
      // { title: "Staff", icon: "ShieldCheck", href: "/app/users", permission: "Admin User Index" },
    ],
  },
  // {
  //   label: "Administration",
  //   items: [
  //     { title: "Settings", icon: "Settings", href: "/app/settings", permission: "Setting Index" },
  //     { title: "Activity Logs", icon: "History", href: "/app/logs", permission: "Activity Log Index" },
  //     // { title: "Roles", icon: "ShieldCheck", href: "/app/roles", permission: "Role Index" },
  //     // { title: "Permissions", icon: "Lock", href: "/app/permissions", permission: "Permission Index" },
  //   ],
  // },
];

const SidebarServer = async ({ isOpen }) => {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";

  // RBAC Filtering
  const userRoles = session?.user?.roles || [];
  const isAdmin = userRoles.some(role => role.name === "Admin" || role.name === "Super Admin");

  const filteredGroups = ALL_MENU_GROUPS.map(group => {
    const filteredItems = group.items.filter(item => {
      if (isAdmin) return true;

      // If item has no permission specified, show it to everyone (or define default behavior)
      if (!item.permission) return true;

      // Check if user has the specific permission
      // In this system, permissions seem to be attached to roles.
      // We'll check if any of the user's roles have the required permission.
      return userRoles.some(role =>
        role.permissions?.some(p => p.name === item.permission)
      );
    });

    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  return (
    <SidebarClient
      menuGroups={filteredGroups}
      initialCollapsed={isCollapsed}
      session={session}
      isOpen={isOpen}
    />
  );
};

export default SidebarServer;
