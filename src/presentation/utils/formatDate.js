// One date format for the whole app, following the interface language.
// Arabic keeps Latin digits (as the rest of the UI does) and uses month names
// so dates are never ambiguous: "5 نوفمبر 2026، 2:07 م" / "5 Nov 2026, 14:07".

const LOCALES = { ar: "ar-u-nu-latn", en: "en-GB" };
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function localeFor(language) {
  return LOCALES[String(language || "en").slice(0, 2)] || LOCALES.en;
}

// "2026-11-05" is a calendar date, not a moment: build it in local time so it
// never shifts a day because of the timezone.
function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const match = value.match(DATE_ONLY);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, language) {
  const date = value ? toDate(value) : null;
  if (!date) return "";
  return new Intl.DateTimeFormat(localeFor(language), { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value, language) {
  const date = value ? toDate(value) : null;
  if (!date) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date);
}
