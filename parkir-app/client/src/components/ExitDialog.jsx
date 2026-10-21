import { useState } from 'react';
import { ArrowUpRight, Calculator, Clock3, MapPin } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { elapsedText, estimatedCost, formatRupiah, formatDateTime, JENIS_LABEL } from '../lib/format';
import Modal from './Modal';
import { Button } from './ui';

/** Dialog konfirmasi transaksi keluar + estimasi biaya berjalan. */
export default function ExitDialog({ open, onClose, transaction, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const estimate = transaction ? estimatedCost(transaction.waktu_masuk, transaction.tarif_per_jam) : 0;

  async function handleExit() {
    if (!transaction) return;
    setLoading(true);
    try {
      const response = await api.post(`/transaksi/keluar/${transaction.id_parkir}`);
      toast.success(
        `Pembayaran ${formatRupiah(response.data.data.biaya_total)} berhasil diproses.`,
        'Kendaraan keluar',
      );
      onSuccess?.(response.data.data);
      onClose?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Proses Kendaraan Keluar"
      description="Total akhir dihitung otomatis oleh stored procedure saat dikonfirmasi."
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant="success" onClick={handleExit} loading={loading}>
            <ArrowUpRight size={16} />
            Konfirmasi Keluar
          </Button>
        </>
      )}
    >
      {transaction && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kendaraan</p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-wider text-slate-900 dark:text-white">
              {transaction.plat_nomor}
            </p>
            <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
              {JENIS_LABEL[transaction.jenis_kendaraan] || transaction.jenis_kendaraan} · {transaction.warna} · {transaction.pemilik}
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><MapPin size={14} /> Area</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{transaction.nama_area}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Clock3 size={14} /> Waktu masuk</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDateTime(transaction.waktu_masuk)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Clock3 size={14} /> Durasi berjalan</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{elapsedText(transaction.waktu_masuk)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400">Tarif per jam</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatRupiah(transaction.tarif_per_jam)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Calculator size={13} />
                Estimasi biaya
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{formatRupiah(estimate)}</p>
            </div>
            <p className="max-w-[130px] text-right text-[10px] leading-relaxed text-emerald-600/80 dark:text-emerald-400/80">
              Dihitung minimal 1 jam dan dibulatkan ke atas.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
