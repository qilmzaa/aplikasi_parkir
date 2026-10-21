const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_ID_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const ROLE_LABEL = {
  admin: 'Admin',
  petugas: 'Petugas',
  owner: 'Owner',
};

export const JENIS_LABEL = {
  motor: 'Motor',
  mobil: 'Mobil',
  lainnya: 'Lainnya',
};

/** Format angka menjadi Rupiah tanpa desimal: Rp 5.000. */
export function formatRupiah(value) {
  const number = Number(value || 0);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(number);
  return `Rp ${formatted}`;
}

/** Parse DATETIME MySQL "YYYY-MM-DD HH:mm:ss" tanpa menggeser zona waktu. */
export function parseDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = String(value).replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format tanggal Indonesia: 21 Okt 2026 08:15. */
export function formatDateTime(value) {
  const date = parseDateTime(value);
  if (!date) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hour}:${minute}`;
}

/** Format tanggal ringkas: 21 Okt 2026. */
export function formatDate(value) {
  const date = parseDateTime(value);
  if (!date) return '-';
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Label sumbu grafik: 21 Okt. */
export function formatShortDate(value) {
  const date = parseDateTime(value);
  if (!date) return '-';
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]}`;
}

/** Format tanggal panjang untuk header: Rabu, 21 Oktober 2026. */
export function formatLongDate(value = new Date()) {
  const date = value instanceof Date ? value : parseDateTime(value);
  if (!date) return '-';
  return `${DAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** Tanggal lokal YYYY-MM-DD untuk input date. */
export function toInputDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function firstDayOfMonth() {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function todayInput() {
  return toInputDate(new Date());
}

/** Menghitung selisih dari waktu_masuk untuk kendaraan yang masih parkir. */
export function elapsedText(startValue) {
  const start = parseDateTime(startValue);
  if (!start) return '-';
  const minutes = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} jam ${rest} mnt`;
}

/** Perkiraan biaya berjalan berdasarkan tarif per jam. */
export function estimatedCost(startValue, tarifPerJam) {
  const start = parseDateTime(startValue);
  if (!start) return 0;
  const minutes = Math.max(0, Math.ceil((Date.now() - start.getTime()) / 60000));
  const hours = Math.max(1, Math.ceil(minutes / 60));
  return hours * Number(tarifPerJam || 0);
}

export function capitalize(value) {
  if (!value) return '-';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

/** Persentase keterisian yang dibatasi 0-100. */
export function occupancyPercent(terisi, kapasitas) {
  if (!kapasitas) return 0;
  return Math.min(100, Math.round((Number(terisi) / Number(kapasitas)) * 100));
}

/** Warna progress berdasarkan tingkat keterisian. */
export function occupancyColor(percent) {
  if (percent >= 90) return 'bg-rose-500';
  if (percent >= 65) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
