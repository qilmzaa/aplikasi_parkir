import {
  BarChart3,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  List,
  MapPin,
  ReceiptText,
  ScanLine,
  Tags,
  Users,
} from 'lucide-react';

export const NAV_BY_ROLE = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Kelola User', path: '/admin/users', icon: Users },
    { label: 'Tarif Parkir', path: '/admin/tarif', icon: Tags },
    { label: 'Area Parkir', path: '/admin/area', icon: MapPin },
    { label: 'Kendaraan', path: '/admin/kendaraan', icon: CarFront },
    { label: 'Log Aktivitas', path: '/admin/log', icon: ClipboardList },
  ],
  petugas: [
    { label: 'Dashboard', path: '/petugas', icon: LayoutDashboard, exact: true },
    { label: 'Scan Barcode', path: '/petugas/scan', icon: ScanLine },
    { label: 'Transaksi Masuk', path: '/petugas/masuk', icon: CarFront },
    { label: 'Kendaraan Aktif', path: '/petugas/aktif', icon: List },
    { label: 'Cetak Struk', path: '/petugas/struk', icon: ReceiptText },
  ],
  owner: [
    { label: 'Dashboard', path: '/owner', icon: LayoutDashboard, exact: true },
    { label: 'Rekap Transaksi', path: '/owner/rekap', icon: BarChart3 },
  ],
};

export function findNavByPath(role, pathname) {
  const items = NAV_BY_ROLE[role] || [];
  return items.find((item) => (
    item.exact ? pathname === item.path : pathname.startsWith(item.path)
  ));
}

export const ROLE_THEME = {
  admin: {
    label: 'Administrator',
    gradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    soft: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  },
  petugas: {
    label: 'Petugas Parkir',
    gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  owner: {
    label: 'Owner',
    gradient: 'from-amber-500 via-orange-600 to-rose-700',
    soft: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
};
