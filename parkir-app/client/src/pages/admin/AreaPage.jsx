import { useState } from 'react';
import { Gauge, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import useDataTable from '../../hooks/useDataTable';
import { occupancyColor, occupancyPercent } from '../../lib/format';
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
} from '../../components/ui';
import { cn } from '../../lib/cn';

const EMPTY_FORM = { nama_area: '', kapasitas: '', terisi: '0' };

export default function AreaPage() {
  const toast = useToast();
  const table = useDataTable('/area', { defaultSort: 'id_area', defaultOrder: 'asc' });
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
      nama_area: row.nama_area,
      kapasitas: String(row.kapasitas),
      terisi: String(row.terisi),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!form.nama_area.trim()) {
      setFormError('Nama area wajib diisi.');
      return;
    }
    if (!form.kapasitas || Number(form.kapasitas) < 1) {
      setFormError('Kapasitas minimal 1 kendaraan.');
      return;
    }
    if (Number(form.terisi) > Number(form.kapasitas)) {
      setFormError('Jumlah terisi tidak boleh melebihi kapasitas.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nama_area: form.nama_area.trim(),
        kapasitas: Number(form.kapasitas),
        terisi: Number(form.terisi || 0),
      };
      if (editing) {
        await api.put(`/area/${editing.id_area}`, payload);
        toast.success('Area parkir berhasil diperbarui.');
      } else {
        await api.post('/area', payload);
        toast.success('Area parkir berhasil ditambahkan.');
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
      await api.delete(`/area/${deleteTarget.id_area}`);
      toast.success('Area parkir berhasil dihapus.');
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
      key: 'nama_area',
      label: 'Nama Area',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <MapPin size={17} />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.nama_area}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Area #{row.id_area}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'kapasitas',
      label: 'Kapasitas',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
          <Gauge size={15} className="text-slate-400" />
          {row.kapasitas}
        </span>
      ),
    },
    {
      key: 'terisi',
      label: 'Keterisian',
      sortable: true,
      render: (row) => {
        const percent = occupancyPercent(row.terisi, row.kapasitas);
        return (
          <div className="w-44">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">{row.terisi} / {row.kapasitas}</span>
              <span className="font-bold text-slate-500 dark:text-slate-400">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn('h-full rounded-full transition-all duration-500', occupancyColor(percent))}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const percent = occupancyPercent(row.terisi, row.kapasitas);
        if (Number(row.terisi) >= Number(row.kapasitas)) return <Badge variant="rose" dot>Penuh</Badge>;
        if (percent >= 65) return <Badge variant="amber" dot>Hampir penuh</Badge>;
        return <Badge variant="emerald" dot>Tersedia</Badge>;
      },
    },
    {
      key: 'aksi',
      label: 'Aksi',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton label="Ubah area" onClick={() => openEdit(row)}>
            <Pencil size={16} />
          </IconButton>
          <IconButton
            label="Hapus area"
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
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Area Parkir</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atur kapasitas dan pantau keterisian setiap area secara langsung.
          </p>
        </div>
        <Button onClick={openCreate} className="w-fit">
          <Plus size={17} />
          Tambah Area
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Cari nama area..."
            className="w-full sm:max-w-xs"
          />
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
              rowKey={(row) => row.id_area}
              emptyTitle="Area parkir belum ada"
              emptyDescription="Tambahkan area agar kendaraan dapat mulai diparkir."
              emptyAction={<Button size="sm" onClick={openCreate}><Plus size={15} /> Tambah Area</Button>}
            />
            <Pagination meta={table.meta} onPage={table.setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Ubah Area Parkir' : 'Tambah Area Parkir'}
        description="Kapasitas menentukan batas maksimal kendaraan di area ini."
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Batal</Button>
            <Button type="submit" form="area-form" loading={saving}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        )}
      >
        <form id="area-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {formError}
            </div>
          )}
          <Field label="Nama Area" htmlFor="nama_area" required>
            <Input
              id="nama_area"
              value={form.nama_area}
              onChange={(event) => setForm((current) => ({ ...current, nama_area: event.target.value }))}
              placeholder="Contoh: Area C - Motor"
              maxLength={50}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kapasitas" htmlFor="kapasitas" required>
              <Input
                id="kapasitas"
                type="number"
                min="1"
                value={form.kapasitas}
                onChange={(event) => setForm((current) => ({ ...current, kapasitas: event.target.value }))}
                placeholder="50"
              />
            </Field>
            <Field label="Terisi" htmlFor="terisi" hint="Biasanya 0 untuk area baru.">
              <Input
                id="terisi"
                type="number"
                min="0"
                value={form.terisi}
                onChange={(event) => setForm((current) => ({ ...current, terisi: event.target.value }))}
                placeholder="0"
              />
            </Field>
          </div>
          <div className="rounded-xl bg-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            Sistem akan menolak kendaraan masuk jika jumlah terisi sudah mencapai kapasitas.
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Area Parkir"
        message={`Hapus area "${deleteTarget?.nama_area || ''}"? Area yang sudah memiliki transaksi tidak dapat dihapus.`}
      />
    </div>
  );
}
