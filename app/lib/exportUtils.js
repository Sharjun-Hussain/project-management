/**
 * Exports data to a CSV file.
 * @param {Array} data - Array of objects to export.
 * @param {string} filename - The name of the downloaded file (without extension).
 * @param {Object} headerMap - A map of object keys to CSV header labels.
 *                             Example: { id: "ID", name: "User Name" }
 */
export const exportToCSV = (data, filename, headerMap) => {
  if (!data || !data.length) {
    if (typeof window !== "undefined") {
      const { toast } = require("sonner");
      toast.error("No data available to export");
    }
    return;
  }

  const keys = Object.keys(headerMap);
  const headerRow = Object.values(headerMap).join(",");

  const rows = data.map((item) => {
    return keys
      .map((key) => {
        // Handle nested paths like "user.name"
        let val = key.split(".").reduce((obj, i) => obj?.[i], item);
        
        if (val === null || val === undefined) val = "";
        
        // Sanitize for CSV: escape quotes and wrap in quotes
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + headerRow + "\n" + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `${filename}_${date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof window !== "undefined") {
    const { toast } = require("sonner");
    toast.success(`${filename} export started`);
  }
};
