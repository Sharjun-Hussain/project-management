import AdminLayoutClient from "./Components/AdminLayoutClient";
import SidebarServer from "../Components/SidebarServer";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";

// --- SERVER-SIDE METADATA ---
// This ensures that the title and favicon are stable from the first byte of HTML.
export async function generateMetadata() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const BASE_URL = API_BASE ? new URL(API_BASE).origin : "";

  try {
    // If you have a public endpoint, use it here. 
    // Otherwise, this will fetch at request time.
    const res = await fetch(`${API_BASE}/admin/settings`, {
      cache: 'no-store', // or 'force-cache' for build-time if the API is open
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      const title = data.admin_dashboard_title || "Admin Dashboard";
      const favicon = data.site_favicon ? (data.site_favicon.startsWith('http') ? data.site_favicon : `${BASE_URL}/${data.site_favicon}`) : "/favicon.ico";

      return {
        title: title,
        icons: {
          icon: favicon,
          shortcut: favicon,
        }
      };
    }
  } catch (err) {
    console.error("Failed to fetch metadata server-side:", err);
  }

  return {
    title: "Admin Dashboard | Foreign Emporium",
  };
}


export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const currentUrl = headersList.get("x-url");
  const callbackUrl = currentUrl ? encodeURIComponent(currentUrl) : "";

  // Validate the token on the server before rendering the dashboard pages
  if (session?.accessToken) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        cache: 'no-store',
      });
      
      // Previously we redirected to /login?expired=1 here.
      // However, since the homepage is open for everyone and permissions are handled 
      // by the sidebar, we will only log the status and stay in the dashboard.
      if (!res.ok) {
        console.error(`Session check failed for ${session.user?.email} (Status: ${res.status})`);
      }
    } catch (err) {
      // If it's a redirect error triggered by Next.js, we must re-throw it
      if (err.digest?.startsWith("NEXT_REDIRECT")) throw err;
      console.error("Error validating token server-side:", err);
    }
  } else {
    // No session token at all, redirect to login with callbackUrl
    redirect(`/login${callbackUrl ? `?callbackUrl=${callbackUrl}` : ""}`);
  }


  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";

  return (
    <AdminLayoutClient
      initialCollapsed={isCollapsed}
      sidebar={<SidebarServer />}
    >
      {children}
    </AdminLayoutClient>
  );
}