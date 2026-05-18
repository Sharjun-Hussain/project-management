import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
      headers: { 'Accept': 'application/json' }
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
