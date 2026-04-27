import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;
        const roles = token?.user?.roles || [];
        const isAdmin = roles.some(r => r.name === "Admin" || r.name === "Super Admin");

        // 1. Define sensitive routes
        const adminOnlyRoutes = [
            "/app/users",
            "/app/roles",
            "/app/permissions",
            "/app/settings",
            "/app/logs"
        ];

        // 2. Perform Authorization Checks
        let isAuthorized = true;

        if (pathname === "/app") {
            isAuthorized = !!token;
        } else if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
            isAuthorized = isAdmin;
        } else if (pathname.startsWith("/app/cms")) {
            const hasCmsPermission = isAdmin || roles.some(r => r.permissions?.some(p => p.name === "manage-cms"));
            isAuthorized = hasCmsPermission;
        }

        // 3. Redirect to 403 if not authorized but logged in
        if (!isAuthorized && !!token) {
            return NextResponse.redirect(new URL("/app/403", req.url));
        }

        // 4. Proceed with headers for authorized requests
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
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/app/:path*"],
};

