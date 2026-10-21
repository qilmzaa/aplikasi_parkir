import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../lib/api';
import { cn } from '../lib/cn';
import Logo from '../components/Logo';
import { Button, Field, Input } from '../components/ui';

const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin1', password: 'admin123', color: 'bg-indigo-500' },
  { role: 'Petugas', username: 'petugas1', password: 'petugas123', color: 'bg-emerald-500' },
  { role: 'Owner', username: 'owner1', password: 'owner123', color: 'bg-amber-500' },
];

export default function LoginPage() {
  const { user, homePath, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homePath} replace />;

  function validate() {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = 'Username wajib diisi';
    if (!form.password) nextErrors.password = 'Password wajib diisi';
    else if (form.password.length < 6) nextErrors.password = 'Password minimal 6 karakter';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const loggedUser = await login(form.username.trim(), form.password);
      toast.success(`Selamat datang, ${loggedUser.nama_lengkap}!`, 'Login berhasil');
      const destinations = { admin: '/admin', petugas: '/petugas', owner: '/owner' };
      navigate(destinations[loggedUser.role] || '/', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, 'Tidak dapat terhubung ke server.');
      setServerError(message);
      toast.error(message, 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account) {
    setForm({ username: account.username, password: account.password });
    setErrors({});
    setServerError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* Panel ilustrasi */}
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950" />
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10">
          <Logo light />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-xl py-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
            <Sparkles size={14} className="text-amber-300" />
            Sistem parkir modern & terintegrasi
          </div>

          <h1 className="max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight xl:text-[46px]">
            Kelola parkir lebih
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent"> cepat, rapi,</span>
            {' '}dan transparan.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-indigo-100/75">
            Satu aplikasi untuk mengatur kendaraan masuk, pembayaran, kapasitas area,
            hingga laporan pendapatan harian.
          </p>

          {/* Mockup dashboard parkir */}
          <div className="relative mt-10 max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-white/5 blur-xl" />
            <div className="relative rotate-[-1.5deg] rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="rounded-2xl bg-white p-4 text-slate-800 shadow-xl dark:bg-slate-900 dark:text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                      <CarFront size={19} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-white">Kendaraan Aktif</p>
                      <p className="text-[9px] text-slate-400">Diperbarui real-time</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">LIVE</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Area A - Motor', value: '12 / 50', width: 'w-1/4', color: 'bg-emerald-500' },
                    { label: 'Area B - Mobil', value: '8 / 30', width: 'w-1/3', color: 'bg-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="mt-1 text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{item.value}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className={cn('h-full rounded-full', item.width, item.color)} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-3 text-white">
                  <div>
                    <p className="text-[9px] text-indigo-100">Pendapatan hari ini</p>
                    <p className="text-base font-extrabold">Rp 1.240.000</p>
                  </div>
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                    <WalletCards size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-5 -top-6 animate-slide-up rounded-2xl border border-white/20 bg-white p-3 text-slate-800 shadow-xl [animation-delay:150ms]">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold">Pembayaran sukses</p>
                  <p className="text-[9px] text-slate-400">B 1234 XYZ · Rp 6.000</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-5 text-xs font-medium text-indigo-100/60">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Hak akses berbasis role</span>
          <span className="flex items-center gap-1.5"><Building2 size={14} /> Multi area parkir</span>
        </div>
      </section>

      {/* Panel form */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative w-full max-w-[430px] animate-slide-up">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <CarFront size={20} />
            </div>
          </div>

          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <ShieldCheck size={13} />
              Portal Aplikasi Parkir
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Selamat datang kembali
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Masuk menggunakan akun yang telah diberikan administrator.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span className="mt-0.5 block h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Username" htmlFor="username" error={errors.username} required>
              <div className="relative">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className={cn('h-12 pl-10', errors.username && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/10')}
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password} required>
              <div className="relative">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className={cn('h-12 px-10', errors.password && 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="mt-2 w-full justify-between px-5"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke dashboard'}</span>
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="mt-7">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun demo</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="group rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
                >
                  <span className={cn('mb-1.5 block h-1.5 w-6 rounded-full', account.color)} />
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">{account.role}</span>
                  <span className="block truncate text-[9px] text-slate-400">{account.username}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Klik akun demo untuk mengisi form secara otomatis.
            </p>
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} ParkirGuys · Tugas UKK RPL
          </p>
        </div>
      </section>
    </div>
  );
}
