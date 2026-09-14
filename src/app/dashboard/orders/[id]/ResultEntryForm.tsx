"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveReferenceRange, formatRangeDisplay } from "@/lib/results/referenceLogic";

export default function ResultEntryForm({
  order,
  isEditable
}: {
  order: any;
  isEditable: boolean;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state with existing results
  const [results, setResults] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    order.items.forEach((item: any) => {
        item.results.forEach((res: any) => {
            initial[`${item.id}_${res.parameterId}`] = res.value;
        });
    });
    return initial;
  });

  const handleInputChange = (itemId: string, paramId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [`${itemId}_${paramId}`]: value
    }));
  };

  const handleSave = async (isFinalize: boolean = false) => {
    setIsSaving(true);
    setError(null);

    // Format payload
    const payload = {
        results: Object.entries(results).map(([key, value]) => {
            const [orderItemId, parameterId] = key.split('_');
            return {
                orderItemId,
                parameterId,
                value
            };
        }).filter(r => r.value.trim() !== ""),
        status: isFinalize ? "COMPLETED" : "PARTIAL"
    };

    try {
      const response = await fetch(`/api/orders/${order.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save results");

      alert(isFinalize ? "Results finalized!" : "Results saved successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
       {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {order.items.map((item: any) => (
        <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800">{item.test.name}</h2>
             <span className="text-xs font-mono text-gray-500">{item.test.code}</span>
          </div>

          <div className="p-0">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-white border-b">
                   <th className="p-4 text-sm font-semibold text-gray-600 w-1/3">Parameter</th>
                   <th className="p-4 text-sm font-semibold text-gray-600 w-1/3">Result</th>
                   <th className="p-4 text-sm font-semibold text-gray-600 w-1/3">Reference Range</th>
                 </tr>
               </thead>
               <tbody>
                 {item.test.parameters.map((param: any) => {
                    const applicableRange = resolveReferenceRange(
                        param.referenceRanges,
                        order.patient.age,
                        order.patient.gender
                    );
                    const rangeDisplay = formatRangeDisplay(applicableRange);
                    const valKey = `${item.id}_${param.id}`;
                    const currentValue = results[valKey] || "";

                    // Find if it was previously saved to show flag
                    const savedResult = item.results.find((r: any) => r.parameterId === param.id);

                    return (
                        <tr key={param.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-sm text-gray-800">
                                {param.name}
                                {param.unit && <span className="text-gray-500 ml-1 block text-xs">{param.unit}</span>}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    {param.dataType === 'NUMERIC' || param.dataType === 'TEXT' ? (
                                        <input
                                            type={param.dataType === 'NUMERIC' ? 'number' : 'text'}
                                            step={param.dataType === 'NUMERIC' ? 'any' : undefined}
                                            value={currentValue}
                                            onChange={(e) => handleInputChange(item.id, param.id, e.target.value)}
                                            disabled={!isEditable || order.status === 'COMPLETED'}
                                            className="w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
                                            placeholder="Enter result"
                                        />
                                    ) : param.dataType === 'POSITIVE_NEGATIVE' ? (
                                        <select
                                            value={currentValue}
                                            onChange={(e) => handleInputChange(item.id, param.id, e.target.value)}
                                            disabled={!isEditable || order.status === 'COMPLETED'}
                                            className="w-full border-gray-300 rounded shadow-sm focus:ring-blue-500 text-sm p-2 border bg-white"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Negative">Negative</option>
                                            <option value="Positive">Positive</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={currentValue}
                                            onChange={(e) => handleInputChange(item.id, param.id, e.target.value)}
                                            disabled={!isEditable || order.status === 'COMPLETED'}
                                            className="w-full border-gray-300 rounded shadow-sm text-sm p-2 border"
                                        />
                                    )}

                                    {savedResult && savedResult.flag !== 'NORMAL' && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            savedResult.flag === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {savedResult.flag}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600 font-mono">
                                {rangeDisplay || <span className="text-gray-400 italic">Not set</span>}
                            </td>
                        </tr>
                    )
                 })}
               </tbody>
             </table>
          </div>
        </div>
      ))}

      {isEditable && order.status !== 'COMPLETED' && (
        <div className="flex justify-end gap-4 mt-6 bg-white p-4 rounded border shadow-sm">
            <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium disabled:opacity-50"
            >
                {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50"
            >
                {isSaving ? "Processing..." : "Complete & Verify Order"}
            </button>
        </div>
      )}
    </div>
  );
}
