import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, Clock3, Info, MapPin, RefreshCw, ScanLine, Tags } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { formatRupiah, JENIS_LABEL, occupancyColor, occupancyPercent } from '../../lib/format';
import EntryForm from '../../components/EntryForm';
import ReceiptModal from '../../components/ReceiptModal';
import { Button, Card, ErrorState, Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';

export default function TransaksiMasukPage() {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/transaksi/opsi');
      setOptions(response.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Gagal memuat opsi transaksi.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Transaksi Kendaraan Masuk</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pilih kendaraan dan area. Tarif dihitung otomatis berdasarkan jenis kendaraan.
            </p>
          </div>
          <Link to="/petugas/scan" className="btn btn-secondary h-10 w-fit px-4">
            <ScanLine size={16} />
            Scan Barcode
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CarFront size={21} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Form Kendaraan Masuk</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Pastikan data kendaraan dan area sudah benar.</p>
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-28" />
              <Skeleton className="h-10 w-48" />
            </div>
          )}
          {!loading && error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && options && (
            <EntryForm
              options={options}
              onSuccess={(receipt) => {
                setLastReceipt(receipt);
                load();
              }}
            />
          )}
        </Card>

        <div className="space-y-5">
          {lastReceipt && (
            <Card className="border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Transaksi terakhir</p>
                  <p className="mt-1 font-mono text-sm font-extrabold text-emerald-800 dark:text-emerald-300">{lastReceipt.plat_nomor}</p>
                  <p className="mt-0.5 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">{lastReceipt.nama_area}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setReceiptOpen(true)}>Lihat Struk</Button>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Tarif Aktif</h3>
              <Tags size={17} className="text-indigo-500" />
            </div>
            <div className="mt-4 space-y-2.5">
              {(options?.tarif || []).map((tarif) => (
                <div key={tarif.id_tarif} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-950/40">
                  <span className="text-sm font-semibold capitalize text-slate-600 dark:text-slate-300">
                    {JENIS_LABEL[tarif.jenis_kendaraan] || tarif.jenis_kendaraan}
                  </span>
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{formatRupiah(tarif.tarif_per_jam)} / jam</span>
                </div>
              ))}
              {!loading && !options?.tarif?.length && (
                <p className="text-sm text-slate-500">Tarif belum diatur oleh admin.</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Kapasitas Area</h3>
              <Button variant="ghost" size="icon" onClick={load} label="Segarkan">
                <RefreshCw size={15} />
              </Button>
            </div>
            <div className="space-y-4">
              {(options?.areas || []).map((area) => {
                const percent = occupancyPercent(area.terisi, area.kapasitas);
                return (
                  <div key={area.id_area}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                        <MapPin size={13} className="text-slate-400" />
                        {area.nama_area}
                      </span>
                      <span className="text-slate-400">{area.terisi}/{area.kapasitas}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={cn('h-full rounded-full', occupancyColor(percent))} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
              {!loading && !options?.areas?.length && <p className="text-sm text-slate-500">Belum ada area parkir.</p>}
            </div>
          </Card>

          <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Catatan operasional</p>
              <p className="mt-1 flex items-center gap-1.5 text-indigo-600/80 dark:text-indigo-300/80">
                <Clock3 size={12} />
                Durasi minimal 1 jam dan dibulatkan ke atas saat kendaraan keluar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={lastReceipt}
      />
    </div>
  );
}
