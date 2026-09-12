import { prisma } from "@/lib/prisma";

export async function logAuditAction(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Deliberately not throwing to prevent blocking the main business logic
  }
}

// Common Action Types for consistency
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE', // Soft deactivate typically
  RESTORE: 'RESTORE',
  SUBMIT_RESULTS: 'SUBMIT_RESULTS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

// Common Entity Types
export const AuditEntity = {
  PATIENT: 'PATIENT',
  LAB_ORDER: 'LAB_ORDER',
  TEST_MASTER: 'TEST_MASTER',
  TEST_PARAMETER: 'TEST_PARAMETER',
  REFERENCE_RANGE: 'REFERENCE_RANGE',
  LAB_SETTINGS: 'LAB_SETTINGS',
};
