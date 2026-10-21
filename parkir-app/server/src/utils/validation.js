import AppError from './AppError.js';

/** Membersihkan input teks. */
export function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Memastikan field wajib tersedia dan tidak kosong. */
export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new AppError(400, `Field wajib belum lengkap: ${missing.join(', ')}`, 'VALIDATION_ERROR');
  }
}

/** Validasi angka bulat positif. */
export function positiveInt(value, label, { min = 1, max = 999999 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new AppError(400, `${label} tidak valid`, 'VALIDATION_ERROR');
  }
  return number;
}

/** Validasi angka >= 0. */
export function nonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(400, `${label} tidak valid`, 'VALIDATION_ERROR');
  }
  return number;
}

/** Validasi nilai enum. */
export function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new AppError(400, `${label} harus salah satu dari: ${allowed.join(', ')}`, 'VALIDATION_ERROR');
  }
  return value;
}

/** Validasi format tanggal YYYY-MM-DD dan memastikan tanggal benar-benar ada. */
export function dateOnly(value, label) {
  const raw = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError(400, `${label} harus berformat YYYY-MM-DD`, 'VALIDATION_ERROR');
  }
  const parsed = new Date(`${raw}T00:00:00`);
  const normalized = Number.isNaN(parsed.getTime())
    ? ''
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  if (normalized !== raw) {
    throw new AppError(400, `${label} bukan tanggal yang valid`, 'VALIDATION_ERROR');
  }
  return raw;
}

/** Mengubah req.params.id menjadi integer positif. */
export function routeId(value, label = 'ID') {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(400, `${label} tidak valid`, 'VALIDATION_ERROR');
  }
  return number;
}

/** Escape karakter khusus untuk CSV. */
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n\r;]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}
