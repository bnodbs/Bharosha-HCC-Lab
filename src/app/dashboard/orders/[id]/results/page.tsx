import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ResultEntryForm from "./ResultEntryForm";
import { getReferenceRange } from "@/lib/referenceRanges/lookup";

export default async function ResultEntryPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
    redirect("/dashboard");
  }

  const order = await prisma.labOrder.findUnique({
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

  if (!order) notFound();

  // Prepare age for lookup
  let patientAgeInDays: number | undefined = undefined;
  if (order.patient.dateOfBirth) {
      const diffTime = Math.abs(new Date().getTime() - new Date(order.patient.dateOfBirth).getTime());
      patientAgeInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (order.patient.age) {
      patientAgeInDays = order.patient.age * 365;
  }

  // Inject current/applicable reference ranges for rendering
  const itemsWithReferences = await Promise.all(order.items.map(async (item) => {
      const resultsWithRefs = await Promise.all(item.results.map(async (result) => {

          let applicableRangeDisplay = "---";

          // If the result already has a snapshot (it was saved previously), show the snapshot
          if (result.refTextValue || result.refMinValue !== null || result.refMaxValue !== null) {
              if (result.refTextValue) applicableRangeDisplay = result.refTextValue;
              else applicableRangeDisplay = `${result.refMinValue !== null ? Number(result.refMinValue) : '---'} to ${result.refMaxValue !== null ? Number(result.refMaxValue) : '---'}`;
          } else {
             // Look it up live if not saved yet
             const liveRange = await getReferenceRange(result.parameterId, patientAgeInDays, order.patient.gender);
             if (liveRange) {
                 if (liveRange.textValue) applicableRangeDisplay = liveRange.textValue;
                 else applicableRangeDisplay = `${liveRange.minValue !== null ? Number(liveRange.minValue) : '---'} to ${liveRange.maxValue !== null ? Number(liveRange.maxValue) : '---'}`;
             }
          }

          return {
              ...result,
              applicableRangeDisplay
          };
      }));

      // Sort results by orderIndex of their parameters
      resultsWithRefs.sort((a, b) => a.parameter.orderIndex - b.parameter.orderIndex);

      return {
          ...item,
          results: resultsWithRefs
      };
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Result Entry</h2>
                <p className="text-gray-500 mt-1">Order: <span className="font-semibold text-gray-900">{order.orderNumber}</span></p>
            </div>
            <div className={`px-3 py-1 rounded font-bold text-sm ${
                order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                order.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
            }`}>
                {order.status}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
          <div>
            <span className="block text-gray-500">Patient Name</span>
            <span className="font-semibold text-gray-900">{order.patient.firstName} {order.patient.lastName}</span>
          </div>
          <div>
            <span className="block text-gray-500">Lab ID</span>
            <span className="font-semibold text-blue-600">{order.patient.patientId}</span>
          </div>
          <div>
            <span className="block text-gray-500">Age / Sex</span>
            <span className="font-semibold text-gray-900">{order.patient.age ? `${order.patient.age}y` : 'N/A'} / {order.patient.gender}</span>
          </div>
          <div>
            <span className="block text-gray-500">Referred By</span>
            <span className="font-semibold text-gray-900">{order.referredBy || 'Self'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <ResultEntryForm orderId={order.id} items={itemsWithReferences} />
      </div>
    </div>
  );
}
