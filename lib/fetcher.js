import { signOut } from "next-auth/react";

export const fetcher = async (url, accessToken, options = {}) => {
    let res;
    
    try {
        res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });
    } catch (err) {
        // Network errors or CORS errors (often caused by Laravel returning 401 without CORS headers)
        if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
            // We cannot be 100% sure it's an auth error vs network disconnect,
            // but we throw it normally so SWR handles it instead of failing silently.
            throw new Error("Network or API Connection Error. Please try again.");
        }
        throw err;
    }

    if (res.status === 401 || res.status === 419) {
        // Session expired or unauthenticated
        console.warn(`Fetcher triggering automatic logout due to status ${res.status} from: ${url}`);
        // Clear NextAuth session and securely redirect
        signOut({ callbackUrl: "/login?expired=1", redirect: true });
        
        // Return a never-resolving promise so SWR stays in the "isLoading" state 
        // infinitely. This prevents the "Failed to Load" UI from flashing right before redirect.
        return new Promise(() => { });
    }

    let data;
    try {
        data = await res.json();
    } catch (e) {
        throw new Error("Invalid server response format");
    }

    if (!res.ok) {
        const error = new Error(data?.message || "An error occurred");
        error.status = res.status;
        error.info = data;
        throw error;
    }
    
    return data;
};
