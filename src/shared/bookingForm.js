export const FIO_MAX_LENGTH = 22;

const FIO_CHAR_PATTERN = /[\p{L}\s.\-]/u;

export function filterFioInput(value) {
  return [...value]
    .filter((char) => FIO_CHAR_PATTERN.test(char))
    .join("")
    .slice(0, FIO_MAX_LENGTH);
}

export function isValidFio(value) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= FIO_MAX_LENGTH;
}

const PHONE_INPUT_PATTERN = /[^\d+\s\-()]/g;
export const PHONE_MAX_LENGTH = 18;

export function filterPhoneInput(value) {
  return value.replace(PHONE_INPUT_PATTERN, "").slice(0, PHONE_MAX_LENGTH);
}

function normalizeRussianPhoneDigits(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("7")) {
    return digits;
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  return null;
}

export function isValidPhone(value) {
  const normalized = normalizeRussianPhoneDigits(value);
  if (!normalized) return false;
  // +7 и 10 цифр; первая цифра абонента — 3–9 (мобильные и городские РФ)
  return /^7[3-9]\d{9}$/.test(normalized);
}

export function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  let rest = digits;

  if (rest.startsWith("8")) {
    rest = `7${rest.slice(1)}`;
  } else if (!rest.startsWith("7") && rest.length > 0) {
    rest = `7${rest}`;
  }

  const national = rest.startsWith("7") ? rest.slice(1) : rest;
  const p1 = national.slice(0, 3);
  const p2 = national.slice(3, 6);
  const p3 = national.slice(6, 8);
  const p4 = national.slice(8, 10);

  let formatted = "+7";
  if (p1) formatted += ` (${p1}`;
  if (p1.length === 3) formatted += ")";
  if (p2) formatted += ` ${p2}`;
  if (p3) formatted += `-${p3}`;
  if (p4) formatted += `-${p4}`;

  return formatted;
}

export function buildBookingUrl({ roomId, date } = {}) {
  const params = new URLSearchParams();
  if (roomId) {
    params.set("roomId", String(roomId));
  }
  if (date) {
    params.set("date", String(date));
  }
  const query = params.toString();
  return query ? `/booking?${query}` : "/booking";
}

export function formatRoomNumber(name, fallback = "") {
  if (!name) return fallback;
  const trimmed = String(name).trim();
  const match = trimmed.match(/(\d+[а-яa-zА-ЯA-Z]?)\s*$/u);
  if (match) return match[1];
  const stripped = trimmed.replace(/^аудитория\s+/iu, "").trim();
  return stripped || fallback;
}
