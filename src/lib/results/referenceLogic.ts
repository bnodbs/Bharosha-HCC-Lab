import { ReferenceRange, GenderApplicability, AgeUnit, ResultFlag } from "@prisma/client";
import { Prisma } from "@prisma/client";

export function resolveReferenceRange(
  ranges: ReferenceRange[],
  patientAgeInYears: number | null,
  patientGender: string
): ReferenceRange | null {
  if (!ranges || ranges.length === 0) return null;

  // Map patient gender to Enum
  const pGenderStr = patientGender.toUpperCase();
  let pGender: GenderApplicability = GenderApplicability.ALL;
  if (pGenderStr.startsWith('M')) pGender = GenderApplicability.MALE;
  if (pGenderStr.startsWith('F')) pGender = GenderApplicability.FEMALE;

  const applicableRanges = ranges.filter(range => {
    // Check gender
    if (range.gender !== GenderApplicability.ALL && range.gender !== pGender) {
      return false;
    }

    // Check age bounds if patient age is known and range has bounds
    if (patientAgeInYears !== null) {
       // For simplicity in this logic, we assume patient age is primarily entered in years.
       // Convert range bounds to years if necessary for comparison.
       let minAgeY = range.minAge;
       let maxAgeY = range.maxAge;

       if (range.minAge !== null) {
           if (range.ageUnit === 'DAYS') minAgeY = range.minAge / 365;
           if (range.ageUnit === 'MONTHS') minAgeY = range.minAge / 12;
       }

       if (range.maxAge !== null) {
           if (range.ageUnit === 'DAYS') maxAgeY = range.maxAge / 365;
           if (range.ageUnit === 'MONTHS') maxAgeY = range.maxAge / 12;
       }

       if (minAgeY !== null && patientAgeInYears < minAgeY) return false;
       if (maxAgeY !== null && patientAgeInYears > maxAgeY) return false;
    }

    return true;
  });

  // If multiple apply (e.g. an ALL and a MALE specific), prefer the most specific one
  applicableRanges.sort((a, b) => {
    // Prefer specific gender over ALL
    if (a.gender !== GenderApplicability.ALL && b.gender === GenderApplicability.ALL) return -1;
    if (b.gender !== GenderApplicability.ALL && a.gender === GenderApplicability.ALL) return 1;
    return 0;
  });

  return applicableRanges[0] || null;
}

export function evaluateNumericResult(
  value: number,
  range: ReferenceRange | null
): ResultFlag {
  if (!range) return ResultFlag.NORMAL;

  const lower = range.lowerLimit ? Number(range.lowerLimit) : null;
  const upper = range.upperLimit ? Number(range.upperLimit) : null;

  if (lower !== null && value < lower) return ResultFlag.LOW;
  if (upper !== null && value > upper) return ResultFlag.HIGH;

  return ResultFlag.NORMAL;
}

export function formatRangeDisplay(range: ReferenceRange | null): string {
    if (!range) return "";
    if (range.lowerLimit !== null && range.upperLimit !== null) {
        return `${range.lowerLimit} - ${range.upperLimit} ${range.unit || ''}`;
    }
    if (range.lowerLimit !== null) return `>= ${range.lowerLimit} ${range.unit || ''}`;
    if (range.upperLimit !== null) return `<= ${range.upperLimit} ${range.unit || ''}`;
    return range.textValue || "";
}
