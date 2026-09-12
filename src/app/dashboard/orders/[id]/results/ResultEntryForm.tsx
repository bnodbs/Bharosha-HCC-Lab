"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function ResultEntryForm({ orderId, items }: { orderId: string, items: any[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with existing values mapped to result IDs
  const defaultValues: Record<string, string> = {};
  items.forEach(item => {
      item.results.forEach((r: any) => {
          defaultValues[r.id] = r.value || "";
      });
  });

  const { register, handleSubmit } = useForm({ defaultValues });

  const onSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    setError(null);

    // Transform form data into array payload
    const results = Object.keys(data).map(id => ({
        id,
        value: data[id]
    }));

    try {
      const response = await fetch(`/api/orders/${orderId}/results`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ results }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Failed to save results");
      }

      router.refresh();
      alert("Results saved successfully!");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getFlagColor = (flag: string | null) => {
      if (flag === "HIGH") return "text-red-600 font-bold bg-red-50 px-2 py-1 rounded";
      if (flag === "LOW") return "text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded";
      if (flag === "ABNORMAL") return "text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded";
      return "text-gray-500";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="m-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {items.map(item => (
          <div key={item.id} className="border-b last:border-b-0">
             <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                 <h3 className="font-bold text-gray-800">{item.test.name} <span className="text-gray-500 font-normal ml-2">({item.test.code})</span></h3>
                 <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'COMPLETED' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                     {item.status}
                 </span>
             </div>

             <div className="p-6">
                 <table className="w-full text-left">
                     <thead>
                         <tr className="text-sm text-gray-500 border-b">
                             <th className="pb-3 w-1/3 font-medium">Parameter</th>
                             <th className="pb-3 w-1/3 font-medium">Result</th>
                             <th className="pb-3 w-1/6 font-medium">Unit</th>
                             <th className="pb-3 w-1/6 font-medium text-right">Reference Range</th>
                         </tr>
                     </thead>
                     <tbody>
                         {item.results.map((result: any) => (
                             <tr key={result.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                 <td className="py-4">
                                     <span className="font-medium text-gray-900 block">{result.parameter.name}</span>
                                     {result.parameter.shortName && <span className="text-xs text-gray-500">({result.parameter.shortName})</span>}
                                 </td>
                                 <td className="py-4 flex items-center gap-3">
                                     {result.parameter.dataType === 'NUMERIC' && (
                                         <input
                                            type="number"
                                            step="any"
                                            {...register(result.id)}
                                            className="border rounded p-2 w-full max-w-[200px] focus:ring-blue-500 focus:border-blue-500"
                                         />
                                     )}
                                     {result.parameter.dataType === 'TEXT' && (
                                         <input
                                            type="text"
                                            {...register(result.id)}
                                            className="border rounded p-2 w-full max-w-[200px] focus:ring-blue-500 focus:border-blue-500"
                                         />
                                     )}
                                     {result.parameter.dataType === 'POSITIVE_NEGATIVE' && (
                                         <select
                                            {...register(result.id)}
                                            className="border rounded p-2 w-full max-w-[200px] focus:ring-blue-500 focus:border-blue-500 bg-white"
                                         >
                                             <option value=""></option>
                                             <option value="Positive">Positive</option>
                                             <option value="Negative">Negative</option>
                                         </select>
                                     )}
                                     {result.parameter.dataType === 'SELECT' && (
                                         <input
                                            type="text"
                                            {...register(result.id)}
                                            placeholder="Enter choice..."
                                            className="border rounded p-2 w-full max-w-[200px] focus:ring-blue-500 focus:border-blue-500"
                                         />
                                     )}
                                     {result.parameter.dataType === 'BOOLEAN' && (
                                         <select
                                            {...register(result.id)}
                                            className="border rounded p-2 w-full max-w-[200px] focus:ring-blue-500 focus:border-blue-500 bg-white"
                                         >
                                             <option value=""></option>
                                             <option value="True">True</option>
                                             <option value="False">False</option>
                                         </select>
                                     )}

                                     {result.abnormalFlag && result.abnormalFlag !== "NORMAL" && (
                                         <span className={getFlagColor(result.abnormalFlag)}>{result.abnormalFlag}</span>
                                     )}
                                 </td>
                                 <td className="py-4 text-sm text-gray-600">
                                     {result.parameter.unit || '-'}
                                 </td>
                                 <td className="py-4 text-sm text-gray-600 text-right">
                                     {result.applicableRangeDisplay}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      ))}

      <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 border-t rounded-b-lg">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Results"}
          </button>
      </div>
    </form>
  );
}
