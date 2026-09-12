"use client";

import { useState } from "react";

export default function ExportForm() {
  const [exportType, setExportType] = useState("patients");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setError(null);

    try {
        const params = new URLSearchParams({ type: exportType });
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const url = `/api/export?${params.toString()}`;

        // Use standard window location assignment to trigger native browser download
        // This avoids holding large blobs in memory for massive DB queries
        window.location.href = url;

    } catch (err: any) {
        setError(err.message || "Failed to trigger export");
    } finally {
        setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <form onSubmit={handleExport} className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Data to Export *</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
          >
            <option value="patients">Patients Registry</option>
            <option value="orders">Laboratory Orders</option>
            <option value="results">Test Results</option>
            <option value="auditlogs">System Audit Logs</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <button
          type="submit"
          disabled={isExporting}
          className="w-full md:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 flex justify-center items-center"
        >
          {isExporting ? (
              <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
              </>
          ) : (
              "Download CSV Export"
          )}
        </button>
      </div>
    </form>
  );
}
