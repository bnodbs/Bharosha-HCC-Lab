"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  referredBy: z.string().optional(),
  notes: z.string().optional(),
  testIds: z.array(z.string()).min(1, "At least one test must be selected"),
});

export default function NewOrderForm({
  patient,
  tests,
}: {
  patient: any;
  tests: any[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Group tests by category for display
  const testsByCategory = tests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, any[]>);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referredBy: patient.referredBy || "",
      notes: "",
      testIds: [],
    },
  });

  const selectedTests = form.watch("testIds");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          ...values,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      router.push(`/dashboard/orders/${data.order.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestToggle = (testId: string) => {
    const current = new Set(form.getValues("testIds"));
    if (current.has(testId)) {
      current.delete(testId);
    } else {
      current.add(testId);
    }
    form.setValue("testIds", Array.from(current), { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Patient Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="block text-sm text-gray-500">Name</span>
            <span className="font-semibold">{patient.firstName} {patient.lastName}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Lab ID</span>
            <span className="font-semibold text-blue-600">{patient.patientId}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Age / Sex</span>
            <span className="font-semibold">{patient.age ? `${patient.age}Y` : 'N/A'} / {patient.gender}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referring Doctor / Source</label>
            <input
              type="text"
              {...form.register("referredBy")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="e.g. Dr. Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes / Clinical Indication</label>
            <input
              type="text"
              {...form.register("notes")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="Optional notes"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-bold text-gray-800">Select Tests</h2>
          <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {selectedTests.length} Selected
          </span>
        </div>

        {form.formState.errors.testIds && (
          <p className="text-red-500 text-sm mb-4">{form.formState.errors.testIds.message}</p>
        )}

        <div className="space-y-6">
          {Object.entries(testsByCategory).map(([category, categoryTests]) => (
            <div key={category}>
              <h3 className="text-md font-bold text-gray-700 mb-3 bg-gray-50 p-2 rounded">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-2">
                {(categoryTests as any[]).map((test) => (
                  <label
                    key={test.id}
                    className={`flex items-start p-3 border rounded cursor-pointer transition-colors ${selectedTests.includes(test.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleTestToggle(test.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span className="font-medium text-gray-900 block">{test.name}</span>
                      <span className="text-gray-500 text-xs">{test.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Creating Order..." : "Create Order"}
        </button>
      </div>
    </form>
  );
}
