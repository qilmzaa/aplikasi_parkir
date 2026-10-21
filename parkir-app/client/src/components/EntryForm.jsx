import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MapPin, Tags } from 'lucide-react';
import api, { getErrorMessage } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { formatRupiah, JENIS_LABEL, occupancyPercent } from '../lib/format';
import { Button, Field, Select } from './ui';
import { cn } from '../lib/cn';

/**
 * Form transaksi masuk yang dipakai ulang di modal dashboard dan halaman penuh.
 * Tarif ditentukan otomatis dari jenis kendaraan di backend.
 */
export default function EntryForm({ options, onSuccess, onCancel, submitLabel = 'Proses Kendaraan Masuk' }) {
  const toast = useToast();
  const [idKendaraan, setIdKendaraan] = useState('');
  const [idArea, setIdArea] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const vehicles = options?.kendaraan || [];
  const areas = options?.areas || [];
  const tarifList = options?.tarif || [];

  const vehicle = useMemo(
    () => vehicles.find((item) => String(item.id_kendaraan) === String(idKendaraan)),
    [vehicles, idKendaraan],
  );
  const area = useMemo(
    () => areas.find((item) => String(item.id_area) === String(idArea)),
    [areas, idArea],
  );
  const tarif = useMemo(
    () => tarifList.find((item) => item.jenis_kendaraan === vehicle?.jenis_kendaraan),
    [tarifList, vehicle],
  );

  const areaFull = area ? Number(area.terisi) >= Number(area.kapasitas) : false;
  const vehicleParked = Boolean(vehicle?.sedang_parkir);
  const canSubmit = Boolean(vehicle && area && !areaFull && !vehicleParked && tarif);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!idKendaraan || !idArea) {
      setError('Pilih kendaraan dan area parkir terlebih dahulu.');
      return;
    }
    if (vehicleParked) {
      setError('Kendaraan ini masih berada di area parkir.');
      return;
    }
    if (areaFull) {
      setError('Area yang dipilih sudah penuh. Pilih area lain.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/transaksi/masuk', {
        id_kendaraan: Number(idKendaraan),
        id_area: Number(idArea),
      });
      const receipt = response.data.data;
      toast.success(
        `${receipt.plat_nomor} berhasil masuk di ${receipt.nama_area}.`,
        'Transaksi masuk berhasil',
      );
      setIdKendaraan('');
      setIdArea('');
      onSuccess?.(receipt);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Field label="Kendaraan" htmlFor="entry-vehicle" required hint="Kendaraan yang masih parkir tidak dapat dipilih.">
        <Select
          id="entry-vehicle"
          value={idKendaraan}
          onChange={(event) => {
            setIdKendaraan(event.target.value);
            setError('');
          }}
        >
          <option value="">Pilih kendaraan...</option>
          {vehicles.map((item) => (
            <option key={item.id_kendaraan} value={item.id_kendaraan} disabled={item.sedang_parkir}>
              {item.plat_nomor} · {JENIS_LABEL[item.jenis_kendaraan] || item.jenis_kendaraan} · {item.pemilik}
              {item.sedang_parkir ? ' (sedang parkir)' : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Area Parkir" htmlFor="entry-area" required>
        <Select
          id="entry-area"
          value={idArea}
          onChange={(event) => {
            setIdArea(event.target.value);
            setError('');
          }}
        >
          <option value="">Pilih area parkir...</option>
          {areas.map((item) => {
            const full = Number(item.terisi) >= Number(item.kapasitas);
            return (
              <option key={item.id_area} value={item.id_area} disabled={full}>
                {item.nama_area} · {item.terisi}/{item.kapasitas} {full ? '(penuh)' : ''}
              </option>
            );
          })}
        </Select>
      </Field>

      {vehicle && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ringkasan Tarif</p>
              <p className="mt-1 font-mono text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
                {vehicle.plat_nomor}
              </p>
              <p className="mt-0.5 text-xs capitalize text-slate-500 dark:text-slate-400">
                {JENIS_LABEL[vehicle.jenis_kendaraan] || vehicle.jenis_kendaraan} · {vehicle.warna} · {vehicle.pemilik}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tarif / jam</p>
              <p className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {tarif ? formatRupiah(tarif.tarif_per_jam) : '-'}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <Tags size={14} className="text-indigo-500" />
              Tarif otomatis berdasarkan jenis
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <Clock3 size={14} className="text-indigo-500" />
              Durasi dihitung saat keluar
            </div>
          </div>
        </div>
      )}

      {area && (
        <div className={cn(
          'rounded-xl border px-3.5 py-3 text-xs',
          areaFull
            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
        )}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-bold">
              <MapPin size={14} />
              {area.nama_area}
            </span>
            <span>{area.terisi} / {area.kapasitas} terisi</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60 dark:bg-slate-950/30">
            <div
              className={cn('h-full rounded-full', areaFull ? 'bg-rose-500' : 'bg-emerald-500')}
              style={{ width: `${occupancyPercent(area.terisi, area.kapasitas)}%` }}
            />
          </div>
        </div>
      )}

      {vehicleParked && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          Kendaraan ini masih parkir. Proses keluar terlebih dahulu sebelum melakukan transaksi baru.
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>Batal</Button>
        )}
        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          {!submitting && <ArrowRight size={16} />}
          {submitLabel}
        </Button>
      </div>

      {canSubmit && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={13} />
          Semua data siap diproses.
        </p>
      )}
    </form>
  );
}
