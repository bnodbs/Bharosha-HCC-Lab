import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";
import Link from "next/link";
export default async function ReportPreviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const rawOrder = await prisma.labOrder.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        items: {
          include: {
            test: true,
            results: {
              include: {
                parameter: true
              }
            }
          }
        }
      }
  });

  if (!rawOrder) notFound();

  const sortedItems = [...rawOrder.items].sort((a, b) => a.test.displayOrder - b.test.displayOrder);

  const reportItems = sortedItems.map(item => {
      const sortedResults = [...item.results].sort((a, b) => a.parameter.orderIndex - b.parameter.orderIndex);
      return {
          ...item,
          results: sortedResults
      };
  });

  const order = {
      ...rawOrder,
      items: reportItems
  };

  let settings = await prisma.laboratorySettings.findFirst();
  if (!settings) {
      settings = {
          id: 'default',
          labName: 'Bharosha Health Care Center Diagnostic Lab',
          address: 'Kathmandu, Nepal',
          contactPhone: '+977-1-4000000',
          contactEmail: 'lab@bharoshahcc.com',
          logoUrl: null,
          headerText: null,
          footerText: null,
          technicianName: 'Authorized Signatory',
          technicianSig: null,
          createdAt: new Date(),
          updatedAt: new Date()
      };
  }
  const { patient } = order;

  // Check if any results actually exist
  const hasResults = order.items.some((item: any) =>
      item.results.some((r: any) => r.status === 'COMPLETED')
  );

  if (!hasResults) {
      return (
          <div className="max-w-4xl mx-auto mt-10 text-center space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-2">No Results Available</h2>
                  <p>No laboratory results have been entered for this order yet.</p>
                  <div className="mt-6 flex justify-center space-x-4">
                      <Link href={`/dashboard/orders/${order.id}/results`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          Go to Result Entry
                      </Link>
                      <Link href={`/dashboard/patients/${patient.id}`} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                          Back to Patient
                      </Link>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-[210mm] mx-auto min-h-[297mm] bg-white shadow-lg print:shadow-none print:m-0 print:p-0">

      {/* Non-Printable Controls */}
      <div className="p-4 bg-gray-100 border-b flex justify-between items-center print:hidden rounded-t-lg">
          <div className="flex space-x-3 items-center">
              <Link href={`/dashboard/orders/${order.id}/results`} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium">
                  &larr; Back to Results
              </Link>
              {order.status === 'PARTIAL' && (
                  <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-300">
                      DRAFT / INCOMPLETE
                  </span>
              )}
          </div>
          <PrintButton />
      </div>

      {/* A4 Printable Container */}
      <div className="p-8 print:p-0">

          {/* Header / Letterhead */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">{settings.labName}</h1>
              {settings.address && <p className="text-sm text-gray-600 mt-1">{settings.address}</p>}
              {(settings.contactPhone || settings.contactEmail) && (
                  <p className="text-xs text-gray-500 mt-1">
                      {settings.contactPhone && <span>Tel: {settings.contactPhone} </span>}
                      {settings.contactPhone && settings.contactEmail && <span>| </span>}
                      {settings.contactEmail && <span>Email: {settings.contactEmail}</span>}
                  </p>
              )}
              <h2 className="text-lg font-bold text-gray-800 mt-4 uppercase">Laboratory Report</h2>
          </div>

          {/* Patient Details */}
          <div className="border border-gray-300 rounded p-4 mb-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Patient Name:</span>
                  <span className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Date:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Age / Sex:</span>
                  <span>{patient.age ? `${patient.age}y` : 'N/A'} / {patient.gender}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Order No:</span>
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Lab ID:</span>
                  <span className="font-medium text-gray-900">{patient.patientId}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Address:</span>
                  <span>{patient.address || 'N/A'}</span>
              </div>
              <div className="flex">
                  <span className="w-24 font-bold text-gray-700">Ref. By:</span>
                  <span>{order.referredBy || 'Self'}</span>
              </div>
          </div>

          {/* Test Results Area */}
          <div className="space-y-8 min-h-[500px]">
              {order.items.map((item: any) => {
                  // Skip tests that have absolutely no results entered yet
                  const enteredResults = item.results.filter((r: any) => r.status === 'COMPLETED');
                  if (enteredResults.length === 0) return null;

                  return (
                      <div key={item.id} className="break-inside-avoid">
                          <h3 className="text-md font-bold text-gray-900 bg-gray-100 py-1 px-2 border-l-4 border-gray-800 mb-3 uppercase">
                              {item.test.name}
                          </h3>
                          <table className="w-full text-sm text-left mb-2">
                              <thead>
                                  <tr className="border-b-2 border-gray-200">
                                      <th className="py-2 px-2 font-bold w-1/3">Investigation</th>
                                      <th className="py-2 px-2 font-bold w-1/4">Result</th>
                                      <th className="py-2 px-2 font-bold w-1/6">Unit</th>
                                      <th className="py-2 px-2 font-bold w-1/4 text-right">Reference Range</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {enteredResults.map((result: any) => {
                                      const isAbnormal = result.abnormalFlag && result.abnormalFlag !== 'NORMAL';

                                      let refDisplay = '---';
                                      if (result.refTextValue) {
                                          refDisplay = result.refTextValue;
                                      } else if (result.refMinValue !== null || result.refMaxValue !== null) {
                                          refDisplay = `${result.refMinValue !== null ? result.refMinValue : '---'} - ${result.refMaxValue !== null ? result.refMaxValue : '---'}`;
                                      }

                                      return (
                                          <tr key={result.id} className="border-b border-dashed border-gray-200 last:border-b-0">
                                              <td className="py-2 px-2 text-gray-800 font-medium">
                                                  {result.parameter.name}
                                              </td>
                                              <td className="py-2 px-2">
                                                  <span className={`${isAbnormal ? 'font-bold' : 'font-medium'}`}>
                                                      {result.value}
                                                  </span>
                                                  {isAbnormal && (
                                                      <span className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                                                          ({result.abnormalFlag})
                                                      </span>
                                                  )}
                                              </td>
                                              <td className="py-2 px-2 text-gray-600">
                                                  {result.unit || result.parameter.unit || ''}
                                              </td>
                                              <td className="py-2 px-2 text-gray-600 text-right">
                                                  {refDisplay}
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  );
              })}
          </div>

          {/* Footer Area */}
          <div className="mt-16 pt-4 flex justify-between items-end">
              <div className="text-xs text-gray-500">
                  <p>Report generated on: {new Date().toLocaleString()}</p>
                  <p className="mt-1">*** End of Report ***</p>
              </div>
              <div className="text-center w-48">
                  <div className="border-b border-gray-400 h-16 mb-2 flex items-end justify-center pb-2">
                      {/* Signature placeholder */}
                      {settings.technicianSig ? (
                          <span className="text-gray-400 italic text-sm">Signature Image Area</span>
                      ) : (
                          <span className="text-gray-300 italic text-sm">(Signature)</span>
                      )}
                  </div>
                  <p className="text-sm font-bold text-gray-800">{settings.technicianName || 'Laboratory Technician'}</p>
              </div>
          </div>

      </div>
    </div>
  );
}
