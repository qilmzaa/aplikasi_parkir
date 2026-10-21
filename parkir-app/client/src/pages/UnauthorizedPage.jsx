import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UnauthorizedPage() {
  const { homePath, user } = useAuth();

  return (
    <div className="grid min-h-[65vh] place-items-center">
      <div className="w-full max-w-lg text-center">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute inset-0 scale-150 rounded-full bg-rose-200/50 blur-2xl dark:bg-rose-500/10" />
          <div className="relative grid h-24 w-24 place-items-center rounded-3xl border border-rose-100 bg-white text-rose-500 shadow-card dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-400">
            <ShieldAlert size={44} strokeWidth={1.6} />
          </div>
        </div>
        <p className="text-6xl font-black tracking-tighter text-slate-200 dark:text-slate-800">403</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Akses ditolak</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Halaman ini tidak tersedia untuk role <span className="font-bold text-slate-700 dark:text-slate-200">{user?.role}</span>.
          Silakan kembali ke dashboard sesuai hak akses Anda.
        </p>
        <Link
          to={homePath}
          className="btn btn-primary mt-6 inline-flex h-10 px-5"
        >
          <ArrowLeft size={16} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
