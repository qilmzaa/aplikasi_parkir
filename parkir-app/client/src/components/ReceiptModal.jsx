import { useState } from 'react';
import { CarFront, Printer } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, formatRupiah, JENIS_LABEL } from '../lib/format';
import Barcode from './Barcode';
import Modal from './Modal';
import { Button } from './ui';

function ReceiptRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[12px] leading-5">
      <span className={strong ? 'font-bold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={`text-right ${strong ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

/** Tampilan struk 80mm, sekaligus target CSS print (#receipt-print). */
export function ReceiptCard({ receipt }) {
  if (!receipt) return null;
  const isFinished = receipt.status === 'keluar';
  const ticketCode = receipt.kode_tiket || `PKR-${String(receipt.id_parkir).padStart(6, '0')}`;

  return (
    <div
      id="receipt-print"
      className="mx-auto w-full max-w-[360px] rounded-2xl border border-dashed border-slate-300 bg-white p-5 font-mono text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <div className="text-center">
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full border-2 border-slate-900">
          <CarFront size={22} />
        </div>
        <h2 className="text-base font-extrabold tracking-[0.18em]">PARKIRGUYS</h2>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          Jl. Raya Parkir No. 88, Indonesia<br />
          Telp. (021) 555-0199
        </p>
        <div className="my-3 border-t border-dashed border-slate-400" />
        <p className="text-[11px] font-bold tracking-[0.2em]">STRUK PARKIR</p>
        <p className="mt-0.5 text-[10px] text-slate-500">No. {String(receipt.id_parkir).padStart(6, '0')}</p>
      </div>

      <div className="my-2.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
        <Barcode value={ticketCode} height={42} width={1.25} fontSize={9} displayValue={false} />
        <p className="mt-0.5 text-center text-[8px] font-bold tracking-[0.14em] text-slate-500">
          {ticketCode} · SCAN SAAT KELUAR
        </p>
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="space-y-1.5">
        <ReceiptRow label="Plat Nomor" value={receipt.plat_nomor} strong />
        <ReceiptRow label="Jenis" value={JENIS_LABEL[receipt.jenis_kendaraan] || receipt.jenis_kendaraan} />
        <ReceiptRow label="Pemilik" value={receipt.pemilik} />
        <ReceiptRow label="Area" value={receipt.nama_area} />
        <ReceiptRow label="Petugas" value={receipt.nama_petugas} />
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="space-y-1.5">
        <ReceiptRow label="Masuk" value={formatDateTime(receipt.waktu_masuk)} />
        <ReceiptRow label="Keluar" value={isFinished ? formatDateTime(receipt.waktu_keluar) : 'Belum keluar'} />
        <ReceiptRow label="Durasi" value={receipt.durasi_jam ? `${receipt.durasi_jam} jam` : '-'} />
        <ReceiptRow label="Tarif / jam" value={formatRupiah(receipt.tarif_per_jam)} />
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="flex items-end justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider">Total Bayar</span>
        <span className="text-xl font-extrabold">{isFinished ? formatRupiah(receipt.biaya_total) : '-'}</span>
      </div>

      <div className="mt-3 flex justify-center">
        <span className={`rounded border px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] ${
          isFinished
            ? 'border-slate-900 text-slate-900'
            : 'border-slate-400 text-slate-500'
        }`}>
          {isFinished ? 'LUNAS' : 'KENDARAAN MASIH PARKIR'}
        </span>
      </div>

      <div className="my-3 border-t border-dashed border-slate-400" />

      <div className="text-center text-[9px] leading-4 text-slate-500">
        <p>Terima kasih telah menggunakan layanan parkir kami.</p>
        <p>Simpan struk ini sebagai bukti pembayaran.</p>
        <p className="mt-1 font-bold">*** PARKIRGUYS ***</p>
      </div>
    </div>
  );
}

export default function ReceiptModal({ open, onClose, receipt }) {
  const toast = useToast();
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (!receipt) return;
    setPrinting(true);
    try {
      await api.post(`/transaksi/${receipt.id_parkir}/cetak`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Aktivitas cetak gagal dicatat.'));
    } finally {
      setPrinting(false);
      setTimeout(() => window.print(), 80);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Struk Parkir"
      description="Periksa rincian sebelum mencetak struk."
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          <Button onClick={handlePrint} loading={printing}>
            <Printer size={16} />
            Cetak Struk
          </Button>
        </>
      )}
    >
      <ReceiptCard receipt={receipt} />
    </Modal>
  );
}
