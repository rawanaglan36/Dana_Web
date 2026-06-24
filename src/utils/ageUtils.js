/**
 * Calculate age in years and months from a birthDate string or Date object.
 * @param {string|Date} birthDate
 * @returns {{ years: number, months: number } | null}
 */
export function calculateAge(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  // Use UTC values to avoid timezone-shift issues
  const birthY = birth.getUTCFullYear();
  const birthM = birth.getUTCMonth();
  const birthD = birth.getUTCDate();

  const now = new Date();
  const nowY = now.getUTCFullYear();
  const nowM = now.getUTCMonth();
  const nowD = now.getUTCDate();

  let years = nowY - birthY;
  let months = nowM - birthM;

  // Adjust if the birth day hasn't occurred yet this month
  if (nowD < birthD) {
    months -= 1;
  }

  // Adjust if months went negative
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months };
}

/**
 * Format age as a string like "3 yrs 2 mo" or "2 mo" (if under 1 year).
 * Supports both English and Arabic via optional labels.
 * @param {{ years: number, months: number } | null} age
 * @param {{ yr: string, mo: string }} labels  - optional label overrides
 * @returns {string}
 */
export function formatAge(age, labels = {}) {
  if (!age) return '';

  const yrLabel = labels.yr ?? 'yr';
  const moLabel = labels.mo ?? 'mo';

  if (age.years === 0) {
    return `${age.months} ${moLabel}`;
  }
  if (age.months === 0) {
    return `${age.years} ${yrLabel}`;
  }
  return `${age.years} ${yrLabel} ${age.months} ${moLabel}`;
}
