import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Required because the root layout fetches settings with cache: 'no-store'
// This prevents DYNAMIC_SERVER_USAGE build errors across all child routes
export const dynamic = 'force-dynamic';
import { ThemeProvider } from "./components/theme-provider";
import AllProvider from "./app/providers/allProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- DYNAMIC METADATA FETCH ---
export async function generateMetadata() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const BASE_URL = API_BASE ? new URL(API_BASE).origin : "";

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data || {};
      const title = data.admin_dashboard_title || "Admin Dashboard";
      const cleanFavicon = data.site_favicon.startsWith('/') ? data.site_favicon : `/${data.site_favicon}`;
      const favicon = data.site_favicon.startsWith('http') ? data.site_favicon : `${BASE_URL}${cleanFavicon}`;

      return {
        title: title,
        description: "Developed By : Inzeedo",
        icons: {
          icon: favicon,
          shortcut: favicon,
        }
      };
    }
  } catch (err) {
    console.error("Root metadata fetch failed:", err);
  }

  return {
    title: "Admin Dashboard | Foreign Emporium",
    description: "Developed By : Inzeedo",
  };
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const ACCENT_COLORS = {
                    indigo: { primary: "#6366f1", hover: "#4f46e5", light: "#eef2ff" },
                    blue: { primary: "#3b82f6", hover: "#2563eb", light: "#eff6ff" },
                    rose: { primary: "#f43f5e", hover: "#e11d48", light: "#fff1f2" },
                    emerald: { primary: "#10b981", hover: "#059669", light: "#ecfdf5" },
                    amber: { primary: "#f59e0b", hover: "#d97706", light: "#fef3c7" },
                    purple: { primary: "#a855f7", hover: "#9333ea", light: "#faf5ff" },
                    orange: { primary: "#f97316", hover: "#ea580c", light: "#fff7ed" },
                    teal: { primary: "#0d9488", hover: "#0f766e", light: "#f0fdfa" },
                  };
                  const colorKey = localStorage.getItem("accent_color") || "indigo";
                  const colors = ACCENT_COLORS[colorKey] || ACCENT_COLORS.indigo;
                  document.documentElement.style.setProperty("--accent-color", colors.primary);
                  document.documentElement.style.setProperty("--accent-hover", colors.hover);
                  document.documentElement.style.setProperty("--accent-light", colors.light);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AllProvider session={session}>
            {children}
            <Toaster position="top-center" richColors />
          </AllProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
