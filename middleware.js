import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-url', req.nextUrl.href);
        requestHeaders.set('x-pathname', req.nextUrl.pathname);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Allow all authenticated users to access the dashboard and common components
                if (pathname === "/app") return !!token;

                const roles = token?.user?.roles || [];
                const isAdmin = roles.some(r => r.name === "Admin" || r.name === "Super Admin");

                // Sensitive routes that require Admin/Super Admin status
                const adminOnlyRoutes = [
                    "/app/users",
                    "/app/roles",
                    "/app/permissions",
                    "/app/settings",
                    "/app/logs"
                ];

                if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
                    return isAdmin;
                }

                // CMS management routes
                if (pathname.startsWith("/app/cms")) {
                    const hasCmsPermission = isAdmin || roles.some(r => r.permissions?.some(p => p.name === "manage-cms"));
                    return hasCmsPermission;
                }

                // Products, Orders, etc. (Generally available to Staff with permissions)
                // But since this is a simple check, we'll allow all authenticated staff for now,
                // or we could refine it further if we had a full permission mapping here.

                return !!token;
            },
        },
        pages: {
            signIn: "/login",
        },
    });

export const config = {
    matcher: ["/app/:path*"],
};

