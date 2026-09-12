"use client";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            Print Report
        </button>
    );
}
