// This fetcher acts as a Firebase proxy, intercepting REST-style API calls
// and translating them into Firestore / Firebase Storage operations.
// It only runs client-side (Firebase SDK is not available on the server).

import {
    collection, query, getDocs, doc, addDoc,
    updateDoc, deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Lazy import: getDb/getStorage only when actually called (client-side)
function getFirebaseModules() {
    // Dynamic require to avoid SSR crashes
    const { db, storage } = require("./firebase");
    return { db, storage };
}

// Collection name mapping: REST endpoint -> Firestore collection
const COLLECTION_MAP = {
    customers: "clients",
    categories: "vps_hosting",
    "sub-categories": "domains",
    products: "projects",
    brands: "licenses",
    orders: "renewals",
    reviews: "alerts",
    contacts: "support",
    users: "staff",
    roles: "roles",
};

function resolveCollection(url) {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname
            .replace(/^\/api/, "")
            .replace(/^\/v1/, "")
            .replace(/^\/admin\//, "");
        if (path.startsWith("/")) path = path.slice(1);

        const segments = path.split("/");
        const endpoint = segments[0];
        const docId = segments[1] || null;
        const fireColl = COLLECTION_MAP[endpoint] || endpoint;
        const searchParam = urlObj.searchParams.get("search") || "";

        return { fireColl, docId, searchParam };
    } catch {
        return { fireColl: null, docId: null, searchParam: "" };
    }
}

export const fetcher = async (url, accessToken, options = {}) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Pass through non-API URLs directly (shouldn't happen often)
    if (!url || !apiBase || !url.startsWith(apiBase)) {
        return fetch(url, options).then((r) => r.json());
    }

    const { fireColl, docId, searchParam } = resolveCollection(url);
    if (!fireColl) throw new Error("Could not determine Firestore collection.");

    const { db, storage } = getFirebaseModules();
    if (!db) throw new Error("Firebase is not initialized. Check your environment variables.");

    const method = (options?.method || "GET").toUpperCase();

    // ── GET ──────────────────────────────────────────────────────────
    if (method === "GET") {
        if (docId) {
            // Single document fetch — return empty for now (UI rarely needs this)
            return { status: "success", data: {} };
        }

        const snap = await getDocs(query(collection(db, fireColl)));
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (searchParam) {
            const q = searchParam.toLowerCase();
            items = items.filter(
                (item) =>
                    (item.name && item.name.toLowerCase().includes(q)) ||
                    (item.company_name && item.company_name.toLowerCase().includes(q)) ||
                    (item.email && item.email.toLowerCase().includes(q))
            );
        }

        return {
            status: "success",
            data: {
                data: items,
                total: items.length,
                last_page: 1,
                current_page: 1,
                per_page: items.length || 10,
            },
        };
    }

    // ── POST / PUT ────────────────────────────────────────────────────
    if (method === "POST" || method === "PUT") {
        let dataObj = {};
        let image_path = null;

        if (options.body instanceof FormData) {
            for (const [key, value] of options.body.entries()) {
                if (value instanceof File && value.size > 0) {
                    try {
                        const storageRef = ref(storage, `${fireColl}/${Date.now()}_${value.name}`);
                        await uploadBytes(storageRef, value);
                        image_path = await getDownloadURL(storageRef);
                    } catch (e) {
                        console.error("Storage upload error:", e);
                    }
                } else {
                    dataObj[key] = value === "null" ? null : value;
                }
            }
            if (image_path) dataObj.image_path = image_path;
        } else if (typeof options.body === "string") {
            try { dataObj = JSON.parse(options.body); } catch { dataObj = {}; }
        }

        dataObj.updated_at = new Date().toISOString();

        if (method === "POST") {
            dataObj.created_at = new Date().toISOString();
            const docRef = await addDoc(collection(db, fireColl), dataObj);
            return { status: "success", data: { id: docRef.id, ...dataObj } };
        } else {
            if (!docId) throw new Error("ID required for update.");
            await updateDoc(doc(db, fireColl, docId), dataObj);
            return { status: "success", data: { id: docId, ...dataObj } };
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (method === "DELETE") {
        if (!docId) throw new Error("ID required for delete.");
        await deleteDoc(doc(db, fireColl, docId));
        return { status: "success", message: "Deleted successfully." };
    }

    throw new Error(`Unsupported method: ${method}`);
};
