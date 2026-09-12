"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const settingsSchema = z.object({
  labName: z.string().min(1, "Lab Name is required").max(100),
  address: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  headerText: z.string().max(300).optional().nullable(),
  footerText: z.string().max(300).optional().nullable(),
  technicianName: z.string().max(100).optional().nullable(),
  technicianQualification: z.string().max(100).optional().nullable(),
  technicianRegistrationNumber: z.string().max(100).optional().nullable(),
  technicianSig: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
});

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      labName: initialData?.labName || "",
      address: initialData?.address || "",
      contactPhone: initialData?.contactPhone || "",
      contactEmail: initialData?.contactEmail || "",
      logoUrl: initialData?.logoUrl || "",
      headerText: initialData?.headerText || "",
      footerText: initialData?.footerText || "",
      technicianName: initialData?.technicianName || "",
      technicianQualification: initialData?.technicianQualification || "",
      technicianRegistrationNumber: initialData?.technicianRegistrationNumber || "",
      technicianSig: initialData?.technicianSig || "",
    },
  });

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings");
      }

      setSuccess("Settings updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 bg-gray-50 p-2 rounded">Laboratory Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Name *</label>
              <input
                type="text"
                {...form.register("labName")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
              {form.formState.errors.labName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.labName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                {...form.register("address")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                {...form.register("contactPhone")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                {...form.register("contactEmail")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
               {form.formState.errors.contactEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.contactEmail.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
              <input
                type="url"
                {...form.register("logoUrl")}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
               {form.formState.errors.logoUrl && <p className="text-red-500 text-xs mt-1">{form.formState.errors.logoUrl.message}</p>}
               <p className="text-xs text-gray-500 mt-1">Provide a direct link to an image file. Leave empty to use text layout.</p>
            </div>
          </div>
      </div>

      <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 bg-gray-50 p-2 rounded">Report Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Header Text</label>
              <input
                type="text"
                {...form.register("headerText")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Footer Text</label>
              <textarea
                {...form.register("footerText")}
                rows={2}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>
          </div>
      </div>

      <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 bg-gray-50 p-2 rounded">Authorized Technician</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician Name</label>
              <input
                type="text"
                {...form.register("technicianName")}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                {...form.register("technicianQualification")}
                placeholder="e.g. B.Sc MLT"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                {...form.register("technicianRegistrationNumber")}
                placeholder="e.g. NHPC: 1234"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image URL (Optional)</label>
              <input
                type="url"
                {...form.register("technicianSig")}
                placeholder="https://example.com/signature.png"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
              {form.formState.errors.technicianSig && <p className="text-red-500 text-xs mt-1">{form.formState.errors.technicianSig.message}</p>}
               <p className="text-xs text-gray-500 mt-1">Provide a direct link to a transparent signature image.</p>
            </div>
          </div>
      </div>

      <div className="flex justify-end border-t pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
