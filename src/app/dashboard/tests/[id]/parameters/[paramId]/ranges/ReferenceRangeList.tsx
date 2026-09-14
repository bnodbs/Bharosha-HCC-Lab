"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const rangeSchema = z.object({
  gender: z.enum(["ALL", "MALE", "FEMALE"]),
  minAge: z.coerce.number().int().min(0).optional().or(z.literal("")),
  maxAge: z.coerce.number().int().min(0).optional().or(z.literal("")),
  ageUnit: z.enum(["DAYS", "MONTHS", "YEARS"]),
  lowerLimit: z.coerce.number().optional().or(z.literal("")),
  upperLimit: z.coerce.number().optional().or(z.literal("")),
  unit: z.string().optional(),
  textValue: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine(data => {
  const minA = data.minAge === "" ? undefined : data.minAge as number;
  const maxA = data.maxAge === "" ? undefined : data.maxAge as number;
  if (minA !== undefined && maxA !== undefined) {
    return minA <= maxA;
  }
  return true;
}, {
  message: "Min Age cannot be greater than Max Age",
  path: ["minAge"],
}).refine(data => {
  const lower = data.lowerLimit === "" ? undefined : data.lowerLimit as number;
  const upper = data.upperLimit === "" ? undefined : data.upperLimit as number;
  if (lower !== undefined && upper !== undefined) {
    return lower <= upper;
  }
  return true;
}, {
  message: "Lower Limit cannot be greater than Upper Limit",
  path: ["lowerLimit"],
});

export default function ReferenceRangeList({
  testId,
  parameterId,
  ranges,
  isAdmin,
  dataType,
  globalUnit
}: {
  testId: string;
  parameterId: string;
  ranges: any[];
  isAdmin: boolean;
  dataType: string;
  globalUnit: string | null;
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof rangeSchema>>({
    resolver: zodResolver(rangeSchema),
    defaultValues: {
      gender: "ALL",
      minAge: "",
      maxAge: "",
      ageUnit: "YEARS",
      lowerLimit: "",
      upperLimit: "",
      unit: globalUnit || "",
      textValue: "",
      description: "",
      isActive: true,
    }
  });

  const openAddModal = () => {
    form.reset({
      gender: "ALL",
      minAge: "",
      maxAge: "",
      ageUnit: "YEARS",
      lowerLimit: "",
      upperLimit: "",
      unit: globalUnit || "",
      textValue: "",
      description: "",
      isActive: true,
    });
    setEditingRange(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (range: any) => {
    form.reset({
      gender: range.gender,
      minAge: range.minAge ?? "",
      maxAge: range.maxAge ?? "",
      ageUnit: range.ageUnit,
      lowerLimit: range.lowerLimit ?? "",
      upperLimit: range.upperLimit ?? "",
      unit: range.unit || "",
      textValue: range.textValue || "",
      description: range.description || "",
      isActive: range.isActive,
    });
    setEditingRange(range);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (rangeId: string) => {
    if (!confirm("Are you sure you want to completely delete this range? (Use edit to deactivate it instead if you want to keep historical records)")) return;

    try {
      await fetch(`/api/parameters/${parameterId}/ranges/${rangeId}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      alert("Failed to delete range");
    }
  };

  const onSubmit = async (values: z.infer<typeof rangeSchema>) => {
    setIsLoading(true);
    setError(null);

    const payload = {
      ...values,
      minAge: values.minAge === "" ? null : values.minAge,
      maxAge: values.maxAge === "" ? null : values.maxAge,
      lowerLimit: values.lowerLimit === "" ? null : values.lowerLimit,
      upperLimit: values.upperLimit === "" ? null : values.upperLimit,
    };

    try {
      const url = editingRange
        ? `/api/parameters/${parameterId}/ranges/${editingRange.id}`
        : `/api/parameters/${parameterId}/ranges`;

      const method = editingRange ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save range");
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAge = (min: number | null, max: number | null, unit: string) => {
    if (min === null && max === null) return "All Ages";
    if (min !== null && max === null) return `>= ${min} ${unit}`;
    if (min === null && max !== null) return `<= ${max} ${unit}`;
    return `${min} - ${max} ${unit}`;
  };

  const formatValue = (range: any) => {
    if (dataType === 'NUMERIC') {
      if (range.lowerLimit !== null && range.upperLimit !== null) {
        return `${range.lowerLimit} - ${range.upperLimit} ${range.unit || ''}`;
      }
      if (range.lowerLimit !== null) return `>= ${range.lowerLimit} ${range.unit || ''}`;
      if (range.upperLimit !== null) return `<= ${range.upperLimit} ${range.unit || ''}`;
      return "No limits set";
    }
    return range.textValue || "No text value set";
  };

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm text-sm"
          >
            + Add Range
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border rounded">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-sm font-semibold text-gray-700">Gender</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Age Range</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Reference Value</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Description</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
              {isAdmin && <th className="p-3 text-sm font-semibold text-gray-700 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {ranges.map((range) => (
              <tr key={range.id} className={`border-b hover:bg-gray-50 ${!range.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="p-3 text-sm font-medium text-gray-900">{range.gender}</td>
                <td className="p-3 text-sm text-gray-700">{formatAge(range.minAge, range.maxAge, range.ageUnit)}</td>
                <td className="p-3 text-sm font-mono text-gray-800 bg-gray-50 rounded">{formatValue(range)}</td>
                <td className="p-3 text-sm text-gray-500">{range.description || '-'}</td>
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${range.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {range.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="p-3 text-sm text-right space-x-3">
                    <button onClick={() => openEditModal(range)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(range.id)} className="text-red-600 hover:underline">Del</button>
                  </td>
                )}
              </tr>
            ))}
            {ranges.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center text-gray-500">
                  No reference ranges defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold mb-4">{editingRange ? 'Edit Reference Range' : 'Add Reference Range'}</h3>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Applicability *</label>
                  <select {...form.register("gender")} className="w-full border rounded p-2 bg-white">
                    <option value="ALL">ALL (Any Gender)</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age (Inclusive)</label>
                  <input type="number" {...form.register("minAge")} className="w-full border rounded p-2" placeholder="e.g. 0" />
                  {form.formState.errors.minAge && <p className="text-red-500 text-xs mt-1">{form.formState.errors.minAge.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age (Inclusive)</label>
                  <input type="number" {...form.register("maxAge")} className="w-full border rounded p-2" placeholder="e.g. 18" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Unit *</label>
                  <select {...form.register("ageUnit")} className="w-full border rounded p-2 bg-white">
                    <option value="YEARS">Years</option>
                    <option value="MONTHS">Months</option>
                    <option value="DAYS">Days</option>
                  </select>
                </div>

                {dataType === "NUMERIC" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lower Limit</label>
                      <input type="number" step="0.0001" {...form.register("lowerLimit")} className="w-full border rounded p-2" />
                      {form.formState.errors.lowerLimit && <p className="text-red-500 text-xs mt-1">{form.formState.errors.lowerLimit.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upper Limit</label>
                      <input type="number" step="0.0001" {...form.register("upperLimit")} className="w-full border rounded p-2" />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit (Override)</label>
                      <input type="text" {...form.register("unit")} className="w-full border rounded p-2" placeholder={globalUnit || ""} />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Text Value</label>
                    <input type="text" {...form.register("textValue")} className="w-full border rounded p-2" placeholder="e.g. Negative, Absent" />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                  <textarea {...form.register("description")} className="w-full border rounded p-2" rows={2} placeholder="Optional notes for this range" />
                </div>
              </div>

              <div className="mt-4 flex items-center">
                  <input
                      type="checkbox"
                      id="isActive"
                      {...form.register("isActive")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Range is Active
                  </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {isLoading ? 'Saving...' : 'Save Range'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
