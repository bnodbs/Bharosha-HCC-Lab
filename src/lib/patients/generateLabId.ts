import { prisma } from "@/lib/prisma";

export async function generateLabId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `LAB-${currentYear}-`;

  // We loop to handle any unique constraint collision during generation
  let retries = 3;
  let nextSequence = 1;

  while (retries > 0) {
    const lastPatient = await prisma.patient.findFirst({
      where: {
        patientId: {
          startsWith: prefix,
        },
      },
      orderBy: {
        patientId: "desc",
      },
    });

    if (lastPatient && lastPatient.patientId) {
      const parts = lastPatient.patientId.split('-');
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1;
        }
      }
    }

    const paddedSequence = String(nextSequence).padStart(6, '0');
    const proposedId = `${prefix}${paddedSequence}`;

    // Verify it doesn't exist yet before returning
    const existing = await prisma.patient.findUnique({
      where: { patientId: proposedId }
    });

    if (!existing) {
      return proposedId;
    }

    retries--;
    nextSequence++; // Push sequence forward and retry
  }

  throw new Error("Failed to generate unique Lab ID after multiple attempts.");
}
