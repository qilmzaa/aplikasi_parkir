import { Printer, ScanLine } from 'lucide-react';
import Barcode from './Barcode';
import Modal from './Modal';
import { Button } from './ui';

/**
 * Label barcode kendaraan untuk ditempel di kendaraan/kartu parkir.
 * Barcode berisi plat nomor, sehingga dapat langsung discan petugas.
 */
export default function BarcodeLabelModal({ open, onClose, vehicle }) {
  if (!vehicle) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Barcode Kendaraan"
      description="Cetak label ini dan tempelkan pada kendaraan atau kartu parkir."
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          <Button onClick={() => setTimeout(() => window.print(), 80)}>
            <Printer size={16} />
            Cetak Barcode
          </Button>
        </>
      )}
    >
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div
          id="barcode-print"
          className="mx-auto w-full max-w-[330px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-slate-900 print:max-w-none print:rounded-none print:border-0 print:p-0"
        >
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em]">
            <ScanLine size={13} />
            ParkirGuys
          </div>
          <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Barcode Kendaraan
          </p>

          <div className="mt-2">
            <Barcode value={vehicle.plat_nomor} height={58} width={1.9} fontSize={12} displayValue={false} />
          </div>

          <p className="mt-1 font-mono text-sm font-extrabold tracking-wider">{vehicle.plat_nomor}</p>
          <p className="mt-0.5 text-[9px] text-slate-500">
            {vehicle.pemilik} · {vehicle.jenis_kendaraan} · {vehicle.warna}
          </p>
          <p className="mt-1.5 border-t border-dashed border-slate-300 pt-1.5 text-[7px] uppercase tracking-wider text-slate-400">
            Scan untuk transaksi masuk otomatis
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Barcode berisi <span className="font-mono font-bold">{vehicle.plat_nomor}</span>. Jika plat nomor diubah,
        cetak ulang label kendaraan.
      </p>
    </Modal>
  );
}
