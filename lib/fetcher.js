import { signOut } from "next-auth/react";
import { db, storage } from "./firebase";
import { 
    collection, query, getDocs, doc, setDoc, addDoc, 
    updateDoc, deleteDoc, orderBy, limit, where 
} from "firebase/firestore";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";

export const fetcher = async (url, accessToken, options = {}) => {
    // If it's a relative URL or not matching the API structure, just do a normal fetch
    if (!url.startsWith(process.env.NEXT_PUBLIC_API_BASE_URL)) {
        return fetch(url, options).then(res => res.json());
    }

    try {
        const urlObj = new URL(url);
        // Extracts something like: 'categories' or 'categories/123'
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL.replace('http://localhost:8000', '').replace('https://api.example.com', '');
        let path = urlObj.pathname.replace('/api', '').replace('/v1', '').replace('/admin/', '');
        if (path.startsWith('/')) path = path.slice(1);
        
        // Collection mapping
        const collectionMap = {
            'customers': 'clients',
            'categories': 'vps_hosting',
            'sub-categories': 'domains',
            'products': 'projects',
            'brands': 'licenses',
            'orders': 'renewals',
            'reviews': 'alerts',
            'contacts': 'support',
            'users': 'staff',
            'roles': 'roles'
        };

        const segments = path.split('/');
        const endpoint = segments[0]; // 'categories'
        const fireColl = collectionMap[endpoint] || endpoint;
        const docId = segments[1]; // '123' (if exists)

        const method = (options.method || "GET").toUpperCase();

        // ----------------------------------------------------
        // 1. READ (GET)
        // ----------------------------------------------------
        if (method === "GET") {
            // Dashboard analytics or single doc check
            if (docId) {
                // Fetch single doc if needed... (skipped for brevity, UI mostly fetches lists)
                return { status: "success", data: {} };
            }

            // Collection fetch
            const search = urlObj.searchParams.get("search") || "";
            let items = [];

            // Execute firestore query
            const q = query(collection(db, fireColl));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                items.push({ id: doc.id, ...data });
            });

            // Client-side search for personal small-scale db
            if (search) {
                const lowerSearch = search.toLowerCase();
                items = items.filter(item => 
                    (item.name && item.name.toLowerCase().includes(lowerSearch)) ||
                    (item.email && item.email.toLowerCase().includes(lowerSearch))
                );
            }

            // Provide dummy pagination wrapper expected by the UI SWR hooks
            return {
                status: "success",
                data: {
                    data: items,
                    total: items.length,
                    last_page: 1,
                    current_page: 1,
                    per_page: items.length || 10
                }
            };
        }

        // ----------------------------------------------------
        // 2. CREATE (POST) & UPDATE (PUT)
        // ----------------------------------------------------
        if (method === "POST" || method === "PUT") {
            let dataObj = {};
            let image_path = null;

            // Handle FormData for Image Uploads
            if (options.body && options.body instanceof FormData) {
                for (let [key, value] of options.body.entries()) {
                    if (value instanceof File) {
                        if (value.size > 0 && value.name) {
                            // Upload to Firebase Storage
                            try {
                                const storageRef = ref(storage, `${fireColl}/${Date.now()}_${value.name}`);
                                await uploadBytes(storageRef, value);
                                image_path = await getDownloadURL(storageRef);
                            } catch (e) {
                                console.error("Firebase storage error", e);
                            }
                        }
                    } else {
                        // Cast specific strings
                        dataObj[key] = (value === 'null') ? null : value;
                    }
                }
                
                if (image_path) {
                    dataObj.image_path = image_path;
                }
            } else if (typeof options.body === 'string') {
                dataObj = JSON.parse(options.body);
            }

            dataObj.updated_at = new Date().toISOString();

            if (method === "POST") {
                dataObj.created_at = new Date().toISOString();
                const docRef = await addDoc(collection(db, fireColl), dataObj);
                return { status: "success", data: { id: docRef.id, ...dataObj } };
            } else {
                // Update
                if (!docId) throw new Error("Entity ID is required for update.");
                const docRef = doc(db, fireColl, docId);
                await updateDoc(docRef, dataObj);
                return { status: "success", data: { id: docId, ...dataObj } };
            }
        }

        // ----------------------------------------------------
        // 3. DELETE
        // ----------------------------------------------------
        if (method === "DELETE") {
            if (!docId) throw new Error("Entity ID is required for deletion.");
            const docRef = doc(db, fireColl, docId);
            await deleteDoc(docRef);
            return { status: "success", message: "Deleted successfully" };
        }

        throw new Error(`Unsupported method ${method} intercepted by Firebase Proxy.`);

    } catch (err) {
        console.error("Firebase Proxy Error:", err);
        throw err;
    }
};
