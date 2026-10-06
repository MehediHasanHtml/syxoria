/**
 * French company numbers. A SIREN (9 digits) names a company, a SIRET (14) one of its
 * establishments; both end with a Luhn check digit, so typos are caught before any lookup.
 */

export const digitsOf = (value: string) => value.replace(/\D/g, "").slice(0, 14);

/** "852379148" → "852 379 148", "85237914800020" → "852 379 148 00020" */
export function formatCompanyNumber(value: string) {
  const d = digitsOf(value);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9)].filter(Boolean).join(" ");
}

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export type NumberCheck = { ok: true; kind: "SIREN" | "SIRET" } | { ok: false; reason: "empty" | "length" | "checksum" };

export function checkCompanyNumber(value: string): NumberCheck {
  const d = digitsOf(value);
  if (!d) return { ok: false, reason: "empty" };
  if (d.length !== 9 && d.length !== 14) return { ok: false, reason: "length" };
  if (!luhn(d)) return { ok: false, reason: "checksum" };
  return { ok: true, kind: d.length === 9 ? "SIREN" : "SIRET" };
}
