import { useState } from 'react';
import { Bike, Car, Pencil, Plus, Tags, Trash2, Truck } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import useDataTable from '../../hooks/useDataTable';
import { formatRupiah } from '../../lib/format';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  IconButton,
  Input,
  Select,
} from '../../components/ui';

const EMPTY_FORM = { jenis_kendaraan: 'motor', tarif_per_jam: '' };
const JENIS_INFO = {
  motor: { icon: Bike, variant: 'emerald', label: 'Motor' },
  mobil: { icon: Car, variant: 'indigo', label: 'Mobil' },
  lainnya: { icon: Truck, variant: 'amber', label: 'Lainnya' },
};

export default function TarifPage() {
  const toast = useToast();
  const table = useDataTable('/tarif', { defaultSort: 'id_tarif', defaultOrder: 'asc' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      jenis_kendaraan: row.jenis_kendaraan,
      tarif_per_jam: String(row.tarif_per_jam),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!form.tarif_per_jam || Number(form.tarif_per_jam) < 0) {
      setFormError('Tarif per jam wajib diisi dengan angka 0 atau lebih.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        jenis_kendaraan: form.jenis_kendaraan,
        tarif_per_jam: Number(form.tarif_per_jam),
      };
      if (editing) {
        await api.put(`/tarif/${editing.id_tarif}`, payload);
        toast.success('Tarif parkir berhasil diperbarui.');
      } else {
        await api.post('/tarif', payload);
        toast.success('Tarif parkir berhasil ditambahkan.');
      }
      setModalOpen(false);
      table.reload();
    } catch (error) {
      const message = getErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tarif/${deleteTarget.id_tarif}`);
      toast.success('Tarif berhasil dihapus.');
      setDeleteTarget(null);
      table.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'jenis_kendaraan',
      label: 'Jenis Kendaraan',
      sortable: true,
      render: (row) => {
        const info = JENIS_INFO[row.jenis_kendaraan] || JENIS_INFO.lainnya;
        const Icon = info.icon;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon size={19} />
            </div>
            <div>
              <p className="font-bold capitalize text-slate-800 dark:text-slate-100">{info.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Tarif standar per jam</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tarif_per_jam',
      label: 'Tarif / Jam',
      sortable: true,
      render: (row) => (
        <span className="text-base font-extrabold text-slate-900 dark:text-white">
          {formatRupiah(row.tarif_per_jam)}
        </span>
      ),
    },
    {
      key: 'keterangan',
      label: 'Keterangan',
      render: (row) => <Badge variant={JENIS_INFO[row.jenis_kendaraan]?.variant || 'slate'}>{JENIS_INFO[row.jenis_kendaraan]?.label || 'Lainnya'}</Badge>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Ubah tarif" onClick={() => openEdit(row)}>
            <Pencil size={16} />
          </IconButton>
          <IconButton
            label="Hapus tarif"
            onClick={() => setDeleteTarget(row)}
            className="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Tarif Parkir</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tentukan tarif per jam untuk setiap jenis kendaraan.
          </p>
        </div>
        <Button onClick={openCreate} className="w-fit">
          <Plus size={17} />
          Tambah Tarif
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(JENIS_INFO).map(([jenis, info]) => {
          const Icon = info.icon;
          const found = table.rows.find((row) => row.jenis_kendaraan === jenis);
          return (
            <Card key={jenis} className="flex items-center gap-3 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon size={21} />
              </div>
              <div>
                <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">{info.label}</p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                  {found ? formatRupiah(found.tarif_per_jam) : 'Belum diatur'}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Cari jenis kendaraan..."
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Tags size={15} />
            Tarif otomatis diterapkan saat kendaraan masuk
          </div>
        </div>

        {table.error ? (
          <ErrorState message={table.error} onRetry={table.reload} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.rows}
              loading={table.loading}
              sort={table.sort}
              order={table.order}
              onSort={table.handleSort}
              rowKey={(row) => row.id_tarif}
              emptyTitle="Tarif belum tersedia"
              emptyDescription="Tambahkan tarif untuk motor, mobil, atau jenis kendaraan lainnya."
              emptyAction={<Button size="sm" onClick={openCreate}><Plus size={15} /> Tambah Tarif</Button>}
            />
            <Pagination meta={table.meta} onPage={table.setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Ubah Tarif' : 'Tambah Tarif'}
        description="Satu jenis kendaraan hanya boleh memiliki satu tarif."
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Batal</Button>
            <Button type="submit" form="tarif-form" loading={saving}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        )}
      >
        <form id="tarif-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}
          <Field label="Jenis Kendaraan" htmlFor="jenis_kendaraan" required>
            <Select
              id="jenis_kendaraan"
              value={form.jenis_kendaraan}
              onChange={(event) => setForm((current) => ({ ...current, jenis_kendaraan: event.target.value }))}
            >
              <option value="motor">Motor</option>
              <option value="mobil">Mobil</option>
              <option value="lainnya">Lainnya</option>
            </Select>
          </Field>
          <Field label="Tarif per Jam" htmlFor="tarif_per_jam" required hint="Masukkan nominal tanpa titik, contoh 5000.">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
              <Input
                id="tarif_per_jam"
                type="number"
                min="0"
                step="500"
                value={form.tarif_per_jam}
                onChange={(event) => setForm((current) => ({ ...current, tarif_per_jam: event.target.value }))}
                placeholder="5000"
                className="pl-10"
              />
            </div>
          </Field>
          <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Tarif yang sudah dipakai transaksi tetap tersimpan pada transaksi lama, tetapi tidak dapat dihapus.
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Tarif"
        message={`Hapus tarif ${deleteTarget?.jenis_kendaraan || ''}? Jika tarif sudah dipakai transaksi, penghapusan akan ditolak oleh sistem.`}
      />
    </div>
  );
}
