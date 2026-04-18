const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * GET /api/v1/admin/settings
 * Returns: { status, message, data: { key: value, ... } }
 */
export async function getSettings(token) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch settings");
    return json.data; // flat { key: value } object
}

/**
 * POST /api/v1/admin/settings
 * Accepts FormData with arbitrary key-value pairs (files supported).
 * Returns: { status, message, data: { key: value, ... } }
 */
export async function saveSettings(token, formData) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            // NOTE: Do NOT set Content-Type — browser sets it automatically with boundary for FormData
        },
        body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to save settings");
    return json.data;
}

/**
 * GET /api/v1/admin/system/database-export
 * Returns: Blob (SQL file)
 */
export async function exportDatabaseBackup(token) {
    const res = await fetch(`${API_BASE}/admin/system/database-export`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/sql", // Or application/octet-stream
        },
    });
    
    if (!res.ok) {
        let errorMsg = "Failed to export database";
        try {
            const json = await res.json();
            errorMsg = json.message || errorMsg;
        } catch (e) {
            // Not JSON
        }
        throw new Error(errorMsg);
    }
    
    return await res.blob();
}
