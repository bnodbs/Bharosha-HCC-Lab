import { prisma } from "@/lib/prisma";

export async function getReferenceRange(
  parameterId: string,
  patientAgeInDays?: number,
  patientSex?: string
) {
  const activeRanges = await prisma.referenceRange.findMany({
    where: {
      parameterId,
      isActive: true,
    }
  });

  if (!activeRanges || activeRanges.length === 0) {
    return null;
  }

  // Filter by sex
  const normalizedSex = patientSex?.toUpperCase() === 'FEMALE' ? 'FEMALE' : (patientSex?.toUpperCase() === 'MALE' ? 'MALE' : 'ALL');

  const sexMatchedRanges = activeRanges.filter(range => {
    return !range.gender || range.gender === 'ALL' || range.gender === normalizedSex;
  });

  if (sexMatchedRanges.length === 0) {
    return null;
  }

  // Filter by age if provided
  let applicableRanges = sexMatchedRanges;

  if (patientAgeInDays !== undefined && patientAgeInDays !== null) {
    applicableRanges = sexMatchedRanges.filter(range => {
      // If range has no age bounds, it applies to all ages
      if (range.minAge === null && range.maxAge === null) return true;

      // Convert range bounds to days for comparison
      let minAgeDays = 0;
      let maxAgeDays = Infinity;

      if (range.minAge !== null) {
        if (range.ageUnit === 'YEARS') minAgeDays = range.minAge * 365;
        else if (range.ageUnit === 'MONTHS') minAgeDays = range.minAge * 30;
        else minAgeDays = range.minAge; // DAYS
      }

      if (range.maxAge !== null) {
        if (range.ageUnit === 'YEARS') maxAgeDays = range.maxAge * 365;
        else if (range.ageUnit === 'MONTHS') maxAgeDays = range.maxAge * 30;
        else maxAgeDays = range.maxAge; // DAYS
      }

      return patientAgeInDays >= minAgeDays && patientAgeInDays <= maxAgeDays;
    });
  }

  if (applicableRanges.length === 0) {
    return null;
  }

  // Prefer the most specific range:
  // 1. Specific sex (MALE/FEMALE) over ALL
  // 2. Specific age bounds over no bounds
  applicableRanges.sort((a, b) => {
    // Score specificity (higher is better)
    let scoreA = 0;
    let scoreB = 0;

    if (a.gender !== 'ALL' && a.gender !== null) scoreA += 10;
    if (b.gender !== 'ALL' && b.gender !== null) scoreB += 10;

    if (a.minAge !== null || a.maxAge !== null) scoreA += 5;
    if (b.minAge !== null || b.maxAge !== null) scoreB += 5;

    return scoreB - scoreA;
  });

  return applicableRanges[0];
}
