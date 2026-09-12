"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  referredBy: z.string().optional(),
  notes: z.string().optional(),
  testIds: z.array(z.string()).min(1, "Please select at least one test."),
});

export default function OrderForm({ patientId, defaultReferredBy, tests }: { patientId: string, defaultReferredBy: string, tests: any[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referredBy: defaultReferredBy,
      notes: "",
      testIds: [],
    },
  });

  const selectedTestIds = form.watch("testIds");

  const filteredTests = useMemo(() => {
    if (!searchQuery) return tests;
    const lowerQuery = searchQuery.toLowerCase();
    return tests.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.code.toLowerCase().includes(lowerQuery) ||
        t.category.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, tests]);

  // Group filtered tests by category
  const groupedFiltered = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const t of filteredTests) {
        if (!groups[t.category]) groups[t.category] = [];
        groups[t.category].push(t);
    }
    return groups;
  }, [filteredTests]);

  const toggleTest = (id: string) => {
    const current = new Set(form.getValues("testIds"));
    if (current.has(id)) {
        current.delete(id);
    } else {
        current.add(id);
    }
    form.setValue("testIds", Array.from(current), { shouldValidate: true });
  };

  const removeSelectedTest = (id: string) => {
      const current = new Set(form.getValues("testIds"));
      current.delete(id);
      form.setValue("testIds", Array.from(current), { shouldValidate: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    const payload = {
        patientId,
        ...values
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      router.push(`/dashboard/orders/${data.order.id}/results`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Referring Doctor</label>
          <input
            type="text"
            {...form.register("referredBy")}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
          <input
            type="text"
            {...form.register("notes")}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>
      </div>

      <div className="border-t pt-4">
         <h3 className="text-lg font-medium text-gray-900 mb-4">Select Tests</h3>
         {form.formState.errors.testIds && <p className="text-red-500 text-sm mb-4">{form.formState.errors.testIds.message}</p>}

         <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
                <input
                    type="text"
                    placeholder="Search test by name, code, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border mb-4"
                />

                <div className="border rounded bg-gray-50 max-h-[400px] overflow-y-auto p-4 space-y-4">
                    {Object.keys(groupedFiltered).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No tests found matching search.</p>
                    ) : (
                        Object.keys(groupedFiltered).map(category => (
                            <div key={category}>
                                <h4 className="font-semibold text-gray-700 text-sm border-b pb-1 mb-2">{category}</h4>
                                <div className="space-y-1">
                                    {groupedFiltered[category].map(test => (
                                        <label key={test.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTestIds.includes(test.id)}
                                                onChange={() => toggleTest(test.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{test.code} - {test.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="md:w-1/3 flex flex-col">
                <div className="bg-blue-50 border border-blue-200 rounded p-4 flex-1">
                    <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-3">
                        Selected Tests ({selectedTestIds.length})
                    </h4>
                    {selectedTestIds.length === 0 ? (
                        <p className="text-sm text-blue-600 italic">No tests selected yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {selectedTestIds.map(id => {
                                const test = tests.find(t => t.id === id);
                                return (
                                    <li key={id} className="text-sm bg-white border border-blue-100 p-2 rounded flex justify-between items-center shadow-sm">
                                        <span className="font-medium text-gray-800">{test?.code}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSelectedTest(id)}
                                            className="text-red-500 hover:text-red-700 font-bold px-2"
                                        >
                                            &times;
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
         </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || selectedTestIds.length === 0}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Order"}
        </button>
      </div>
    </form>
  );
}
