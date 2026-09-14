"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

const paramSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  unit: z.string().optional(),
  dataType: z.enum(["NUMERIC", "TEXT", "SELECT", "POSITIVE_NEGATIVE", "BOOLEAN"]),
  orderIndex: z.coerce.number().int(),
  isActive: z.boolean().optional(),
});

export default function ParameterList({
  testId,
  parameters,
  isAdmin
}: {
  testId: string;
  parameters: any[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof paramSchema>>({
    resolver: zodResolver(paramSchema),
    defaultValues: {
      code: "",
      name: "",
      shortName: "",
      unit: "",
      dataType: "NUMERIC",
      orderIndex: parameters.length,
    }
  });

  const openAddModal = () => {
    form.reset({
      code: "",
      name: "",
      shortName: "",
      unit: "",
      dataType: "NUMERIC",
      orderIndex: parameters.length > 0 ? Math.max(...parameters.map(p => p.orderIndex)) + 1 : 0,
    });
    setEditingParam(null);
    setError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (param: any) => {
    form.reset({
      code: param.code || "",
      name: param.name,
      shortName: param.shortName || "",
      unit: param.unit || "",
      dataType: param.dataType,
      orderIndex: param.orderIndex,
      isActive: param.isActive !== false,
    });
    setEditingParam(param);
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (paramId: string) => {
    if (!confirm("Are you sure you want to deactivate this parameter? It won't be deleted from existing results.")) return;

    try {
      await fetch(`/api/parameters/${paramId}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      alert("Failed to delete parameter");
    }
  };

  const onSubmit = async (values: z.infer<typeof paramSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = editingParam
        ? `/api/parameters/${editingParam.id}`
        : `/api/tests/${testId}/parameters`;

      const method = editingParam ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save parameter");
      }

      setIsAddModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm text-sm"
          >
            + Add Parameter
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border rounded">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-sm font-semibold text-gray-700 w-16">Order</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Code</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Name (Short Name)</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Type</th>
              <th className="p-3 text-sm font-semibold text-gray-700">Unit</th>
              {isAdmin && <th className="p-3 text-sm font-semibold text-gray-700 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {parameters.map((param) => (
              <tr key={param.id} className={`border-b hover:bg-gray-50 ${!param.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="p-3 text-sm text-gray-500">{param.orderIndex}</td>
                <td className="p-3 text-sm font-medium text-gray-900">
                    {param.code || '-'}
                    {!param.isActive && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded block w-max mt-1">INACTIVE</span>}
                </td>
                <td className="p-3 text-sm">
                  {param.name}
                  {param.shortName && <span className="text-gray-500 ml-1">({param.shortName})</span>}
                </td>
                <td className="p-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-mono">
                    {param.dataType}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">{param.unit || '-'}</td>
                {isAdmin && (
                  <td className="p-3 text-sm text-right space-x-3">
                    <Link href={`/dashboard/tests/${testId}/parameters/${param.id}/ranges`} className="text-blue-600 hover:underline">Ranges</Link>
                    <button onClick={() => openEditModal(param)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(param.id)} className="text-red-600 hover:underline">Remove</button>
                  </td>
                )}
              </tr>
            ))}
            {parameters.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center text-gray-500">
                  No parameters defined for this test.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">{editingParam ? 'Edit Parameter' : 'Add Parameter'}</h3>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" {...form.register("name")} className="w-full border rounded p-2" />
                  {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" {...form.register("code")} className="w-full border rounded p-2 uppercase" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                  <input type="text" {...form.register("shortName")} className="w-full border rounded p-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
                  <select {...form.register("dataType")} className="w-full border rounded p-2 bg-white">
                    <option value="NUMERIC">NUMERIC</option>
                    <option value="TEXT">TEXT</option>
                    <option value="SELECT">SELECT</option>
                    <option value="POSITIVE_NEGATIVE">POSITIVE_NEGATIVE</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input type="text" {...form.register("unit")} className="w-full border rounded p-2" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Index (Sort)</label>
                  <input type="number" {...form.register("orderIndex")} className="w-full border rounded p-2" />
                </div>
              </div>

              {editingParam && (
                <div className="mt-4 flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        {...form.register("isActive")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Parameter is Active
                    </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {isLoading ? 'Saving...' : 'Save Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
