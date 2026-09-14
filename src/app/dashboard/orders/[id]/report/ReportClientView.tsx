"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function ReportClientView({ order }: { order: any }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-lg print:shadow-none print:m-0 print:w-full">
      {/* Non-printable Controls */}
      <div className="p-4 bg-gray-100 flex justify-between items-center print:hidden border-b">
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="text-gray-600 hover:text-blue-600 flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-medium"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Printable A4 Container */}
      <div className="p-8 print:p-0 print:pt-4 bg-white">

        {/* Letterhead Placeholder */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bharosha Health Care Center</h1>
          <p className="text-gray-600 font-medium mt-1">Diagnostic Laboratory Report</p>
        </div>

        {/* Patient & Order Demographics */}
        <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded p-4 mb-8 text-sm">
          <div>
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
              <span className="font-bold text-gray-700">Patient Name:</span>
              <span className="font-semibold text-gray-900">{order.patient.firstName} {order.patient.lastName}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
              <span className="font-bold text-gray-700">Age / Sex:</span>
              <span className="text-gray-900">{order.patient.age ? `${order.patient.age}Y` : '-'} / {order.patient.gender}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-gray-700">Address:</span>
              <span className="text-gray-900">{order.patient.address || '-'}</span>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
              <span className="font-bold text-gray-700">Lab ID:</span>
              <span className="font-semibold text-gray-900">{order.patient.patientId}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
              <span className="font-bold text-gray-700">Order No:</span>
              <span className="text-gray-900">{order.orderNumber}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
              <span className="font-bold text-gray-700">Order Date:</span>
              <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-gray-700">Referred By:</span>
              <span className="text-gray-900">{order.referredBy || 'Self'}</span>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="mb-8">
            {order.items.map((item: any) => {
                // If there are no results saved yet, handle cleanly
                const hasResults = item.results && item.results.length > 0;

                return (
                    <div key={item.id} className="mb-8 break-inside-avoid">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide text-center">
                            {item.test.name}
                        </h2>

                        {!hasResults ? (
                            <p className="text-center text-gray-500 italic py-2 text-sm">Result Pending</p>
                        ) : (
                            <table className="w-full text-left text-sm mb-4 border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="py-2 font-bold text-gray-700 w-2/5">Test Description</th>
                                        <th className="py-2 font-bold text-gray-700 w-1/5 text-center">Result</th>
                                        <th className="py-2 font-bold text-gray-700 w-1/5">Unit</th>
                                        <th className="py-2 font-bold text-gray-700 w-1/5">Reference Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.results.map((result: any) => {
                                        const isAbnormal = result.flag === 'LOW' || result.flag === 'HIGH' || result.flag === 'ABNORMAL';
                                        return (
                                            <tr key={result.id} className="border-b border-gray-100 last:border-0">
                                                <td className="py-2 pr-2 text-gray-900">{result.parameter.name}</td>
                                                <td className="py-2 font-medium text-center">
                                                    <span className={isAbnormal ? 'font-bold' : ''}>
                                                        {result.value}
                                                    </span>
                                                    {isAbnormal && (
                                                        <span className="ml-1 text-xs font-bold">
                                                            ({result.flag === 'HIGH' ? 'H' : 'L'})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2 text-gray-600">{result.unit || ''}</td>
                                                <td className="py-2 text-gray-600 whitespace-pre-wrap">{result.referenceRange || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )
            })}
        </div>

        {/* Footer Signatures */}
        <div className="grid grid-cols-2 mt-20 pt-10 border-t border-gray-200 break-inside-avoid">
            <div className="text-center">
                <p className="border-t border-gray-800 inline-block w-48 pt-2 font-bold text-sm">Tested By</p>
                <p className="text-xs text-gray-500 mt-1">Lab Technician</p>
            </div>
            <div className="text-center">
                <p className="border-t border-gray-800 inline-block w-48 pt-2 font-bold text-sm">Verified By</p>
                <p className="text-xs text-gray-500 mt-1">Pathologist / Lab In-Charge</p>
            </div>
        </div>

        {/* End of Report Marker */}
        <p className="text-center text-xs text-gray-400 mt-10 print:mt-12 break-inside-avoid">
            *** End of Report ***
        </p>

      </div>
    </div>
  );
}
