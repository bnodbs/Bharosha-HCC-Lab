"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const rangeSchema = z.object({
  parameterId: z.string().min(1, "Parameter is required"),
  gender: z.enum(["MALE", "FEMALE", "ALL"]),
  minAge: z.union([z.number().int().nonnegative(), z.literal("")]).optional(),
  maxAge: z.union([z.number().int().nonnegative(), z.literal("")]).optional(),
  ageUnit: z.enum(["DAYS", "MONTHS", "YEARS"]),
  minValue: z.union([z.number(), z.literal("")]).optional(),
  maxValue: z.union([z.number(), z.literal("")]).optional(),
  textValue: z.string().optional(),
  isCritical: z.boolean(),
  isActive: z.boolean(),
}).refine((data) => {
    const min = data.minAge === "" ? undefined : data.minAge;
    const max = data.maxAge === "" ? undefined : data.maxAge;
    if (min !== undefined && max !== undefined) {
        return min <= max;
    }
    return true;
}, { message: "Min Age cannot be greater than Max Age", path: ["maxAge"] })
  .refine((data) => {
    const min = data.minValue === "" ? undefined : data.minValue;
    const max = data.maxValue === "" ? undefined : data.maxValue;
    if (min !== undefined && max !== undefined) {
        return min <= max;
    }
    return true;
}, { message: "Min Value cannot be greater than Max Value", path: ["maxValue"] });

export default function EditRangeForm({ tests, existingRange }: { tests: any[], existingRange?: any }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof rangeSchema>>({
    resolver: zodResolver(rangeSchema),
    defaultValues: {
      parameterId: existingRange?.parameterId || "",
      gender: existingRange?.gender || "ALL",
      minAge: existingRange?.minAge ?? "",
      maxAge: existingRange?.maxAge ?? "",
      ageUnit: existingRange?.ageUnit || "YEARS",
      minValue: existingRange?.minValue !== null && existingRange?.minValue !== undefined ? Number(existingRange.minValue) : "",
      maxValue: existingRange?.maxValue !== null && existingRange?.maxValue !== undefined ? Number(existingRange.maxValue) : "",
      textValue: existingRange?.textValue || "",
      isCritical: existingRange?.isCritical || false,
      isActive: existingRange ? existingRange.isActive : true,
    },
  });

  async function onSubmit(values: z.infer<typeof rangeSchema>) {
    setIsLoading(true);
    setError(null);

    const payload = {
        ...values,
        minAge: values.minAge === "" ? undefined : values.minAge,
        maxAge: values.maxAge === "" ? undefined : values.maxAge,
        minValue: values.minValue === "" ? undefined : values.minValue,
        maxValue: values.maxValue === "" ? undefined : values.maxValue,
        textValue: values.textValue === "" ? undefined : values.textValue,
    };

    try {
      const url = existingRange ? `/api/reference-ranges/${existingRange.id}` : "/api/reference-ranges";
      const method = existingRange ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save range");
      }

      router.push("/dashboard/reference-ranges");
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

      {existingRange && (
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="isActive"
            {...form.register("isActive")}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-900">
            Active Reference Range
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Parameter *</label>
          <select
            {...form.register("parameterId")}
            disabled={!!existingRange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white disabled:bg-gray-100"
          >
            <option value="">Select Parameter</option>
            {tests.map(test => (
               test.parameters.length > 0 && (
                   <optgroup key={test.id} label={`${test.code} - ${test.name}`}>
                       {test.parameters.map((param: any) => (
                           <option key={param.id} value={param.id}>{param.name}</option>
                       ))}
                   </optgroup>
               )
            ))}
          </select>
          {form.formState.errors.parameterId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.parameterId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Sex *</label>
          <select
            {...form.register("gender")}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
          >
            <option value="ALL">Universal (All Genders)</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age Unit</label>
          <select
            {...form.register("ageUnit")}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
          >
            <option value="YEARS">Years</option>
            <option value="MONTHS">Months</option>
            <option value="DAYS">Days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
          <input
            type="number"
            {...form.register("minAge", { valueAsNumber: true, setValueAs: v => v === "" ? "" : parseInt(v, 10) })}
            placeholder="0"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
          <input
            type="number"
            {...form.register("maxAge", { valueAsNumber: true, setValueAs: v => v === "" ? "" : parseInt(v, 10) })}
            placeholder="e.g. 100"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
          />
          {form.formState.errors.maxAge && <p className="text-red-500 text-xs mt-1">{form.formState.errors.maxAge.message}</p>}
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reference Values</h3>
        <p className="text-sm text-gray-500 mb-4">Provide either a numeric range OR a textual reference value.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lower Limit (Numeric)</label>
            <input
                type="number"
                step="any"
                {...form.register("minValue", { valueAsNumber: true, setValueAs: v => v === "" ? "" : parseFloat(v) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upper Limit (Numeric)</label>
            <input
                type="number"
                step="any"
                {...form.register("maxValue", { valueAsNumber: true, setValueAs: v => v === "" ? "" : parseFloat(v) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
            {form.formState.errors.maxValue && <p className="text-red-500 text-xs mt-1">{form.formState.errors.maxValue.message}</p>}
            </div>

            <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Textual Reference (Qualitative)</label>
            <input
                type="text"
                {...form.register("textValue")}
                placeholder="e.g. Negative, Non-reactive"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
            </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/reference-ranges")}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? "Saving..." : existingRange ? "Update Range" : "Create Range"}
        </button>
      </div>
    </form>
  );
}
