import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

type Period = 'day' | 'week' | 'month';

interface AdminMetrics {
  totalUsers: number;
  accesses: number;
  uniqueUsers: number;
  anonymousVisitors: number;
  newUsers: number;
  lastAccess: string | null;
}

interface ChartBucket {
  label: string;
  accesses: number;
  uniqueUsers: number;
  anonymousVisitors: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  lastAccess: string | null;
  city: string | null;
  state: string | null;
}

interface AdminDashboard {
  period: Period;
  metrics: AdminMetrics;
  chart: ChartBucket[];
  users: AdminUser[];
  userCount: number;
  page: number;
  pageSize: number;
}

const PERIODS: Array<{ value: Period; label: string; caption: string }> = [
  { value: 'day', label: 'Dia', caption: 'hoje' },
  { value: 'week', label: 'Semana', caption: 'na semana' },
  { value: 'month', label: 'Mês', caption: 'no mês' },
];

const formatDate = (value: string | null | undefined, includeTime = false) => {
  if (!value) return 'Ainda não registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', includeTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' });
};

const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat('pt-BR').format(value || 0);

const AccessChart: React.FC<{ rows: ChartBucket[] }> = ({ rows }) => {
  const width = 960;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 42, left: 44 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const largestValue = Math.max(1, ...rows.flatMap((row) => [row.accesses, row.uniqueUsers, row.anonymousVisitors]));
  const xAt = (index: number) => margin.left + (index * plotWidth) / Math.max(rows.length - 1, 1);
  const yAt = (value: number) => margin.top + plotHeight - (value / largestValue) * plotHeight;
  const accessPoints = rows.map((row, index) => `${xAt(index)},${yAt(row.accesses)}`).join(' ');
  const uniquePoints = rows.map((row, index) => `${xAt(index)},${yAt(row.uniqueUsers)}`).join(' ');
  const anonymousPoints = rows.map((row, index) => `${xAt(index)},${yAt(row.anonymousVisitors)}`).join(' ');
  const labelStride = Math.max(1, Math.ceil(rows.length / 7));

  if (rows.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Ainda não há acessos registrados neste período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        className="min-w-[680px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de acessos e usuários únicos no período selecionado"
      >
        <title>Acessos e usuários únicos por intervalo</title>
        {[0, 1, 2, 3, 4].map((step) => {
          const y = margin.top + (step * plotHeight) / 4;
          const label = Math.round(largestValue * (1 - step / 4));
          return (
            <g key={step}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} className="stroke-slate-100 dark:stroke-slate-800" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{label}</text>
            </g>
          );
        })}
        <polyline points={accessPoints} fill="none" className="stroke-brand-600" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={uniquePoints} fill="none" className="stroke-sky-500" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={anonymousPoints} fill="none" className="stroke-amber-500" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {rows.map((row, index) => (
          <g key={`${row.label}-${index}`}>
            <circle cx={xAt(index)} cy={yAt(row.accesses)} r="3.5" className="fill-brand-600" />
            <circle cx={xAt(index)} cy={yAt(row.uniqueUsers)} r="3.5" className="fill-sky-500" />
            <circle cx={xAt(index)} cy={yAt(row.anonymousVisitors)} r="3.5" className="fill-amber-500" />
            {(index % labelStride === 0 || index === rows.length - 1) && (
              <text x={xAt(index)} y={height - 12} textAnchor="middle" className="fill-slate-400 text-[11px]">
                {row.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ title, value, detail, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(value)}</p>
        <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </span>
    </div>
  </div>
);

export const AdminPage: React.FC = () => {
  const [period, setPeriod] = React.useState<Period>('week');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [dashboard, setDashboard] = React.useState<AdminDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [denied, setDenied] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    const loadDashboard = async () => {
      setLoading(true);
      setDenied(false);
      setErrorMessage('');

      if (!isSupabaseConfigured()) {
        setErrorMessage('O Supabase não está configurado neste ambiente.');
        setLoading(false);
        return;
      }

      try {
        // Validate the current session against Supabase Auth before requesting
        // the dashboard. Database authorization remains the actual gate.
        const { data: authData, error: authError } = await client.auth.getUser();
        if (!active) return;
        if (authError || !authData.user) {
          setDenied(true);
          setLoading(false);
          return;
        }

        const { data, error } = await client.rpc('get_admin_dashboard', {
          p_period: period,
          p_search: search,
          p_page: page,
        });
        if (!active) return;

        if (error) {
          if (error.code === '42501' || error.message.toLowerCase().includes('acesso administrativo')) {
            setDenied(true);
          } else if (error.code === 'PGRST202' || error.code === '42P01' || error.code === '42703') {
            setErrorMessage('A configuração do painel ainda não foi aplicada ao Supabase. Aplique o script supabase/admin_dashboard.sql.');
          } else {
            setErrorMessage('Não foi possível carregar os dados administrativos. Tente novamente.');
          }
          setLoading(false);
          return;
        }

        setDashboard(data as AdminDashboard);
      } catch {
        if (active) setErrorMessage('Não foi possível conectar ao Supabase. Verifique a conexão e tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = window.setTimeout(() => void loadDashboard(), search ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [period, search, page, refreshKey]);

  const activePeriod = PERIODS.find((item) => item.value === period) || PERIODS[1];
  const metrics = dashboard?.metrics;
  const firstUser = dashboard && dashboard.userCount > 0 ? (dashboard.page - 1) * dashboard.pageSize + 1 : 0;
  const lastUser = dashboard ? Math.min(dashboard.page * dashboard.pageSize, dashboard.userCount) : 0;
  const pageCount = dashboard ? Math.max(1, Math.ceil(dashboard.userCount / dashboard.pageSize)) : 1;

  if (denied) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6">
        <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">Acesso restrito</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Esta conta não tem permissão administrativa para consultar o painel.
          </p>
          <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800">
            <ArrowLeft className="h-4 w-4" /> Voltar ao OrçaCerto
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.16em]">OrçaCerto</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Painel administrativo</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Usuários e acessos registrados pelo Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" /> Voltar ao app
            </Link>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
          </div>
        </header>

        {errorMessage && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            Período dos indicadores
          </div>
          <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto" role="group" aria-label="Filtrar período">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setPeriod(item.value);
                  setPage(1);
                }}
                aria-pressed={period === item.value}
                className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-colors sm:flex-none ${period === item.value ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Métricas do painel">
          <StatCard title="Total de usuários" value={metrics?.totalUsers || 0} detail="Contas ativas no Supabase" icon={<Users className="h-5 w-5" />} accent="bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" />
          <StatCard title={`Acessos ${activePeriod.caption}`} value={metrics?.accesses || 0} detail="Sessões de navegador registradas" icon={<Activity className="h-5 w-5" />} accent="bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" />
          <StatCard title={`Visitantes únicos ${activePeriod.caption}`} value={metrics?.uniqueUsers || 0} detail="Contas + navegadores sem login" icon={<UserCheck className="h-5 w-5" />} accent="bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" />
          <StatCard title={`Sem login ${activePeriod.caption}`} value={metrics?.anonymousVisitors || 0} detail="Visitantes anônimos únicos" icon={<Activity className="h-5 w-5" />} accent="bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" />
          <StatCard title={`Novos cadastros ${activePeriod.caption}`} value={metrics?.newUsers || 0} detail="Data real de criação no Auth" icon={<UserPlus className="h-5 w-5" />} accent="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" />
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Acessos e usuários únicos</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {period === 'day' ? 'Por hora, hoje' : period === 'week' ? 'Por dia, nesta semana' : 'Por dia, neste mês'}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Acessos</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Visitantes únicos</span>
              <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Sem login</span>
              <span className="inline-flex items-center gap-1.5 text-slate-400"><Clock3 className="h-3.5 w-3.5" /> Último acesso: {formatDate(metrics?.lastAccess, true)}</span>
            </div>
          </div>
          {loading && !dashboard ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">Carregando métricas…</div>
          ) : (
            <AccessChart rows={dashboard?.chart || []} />
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            Visitantes sem login usam um ID aleatório salvo no navegador. Não coletamos IP nem inferimos localização. A contagem começa após a implantação; o histórico anterior não foi reconstruído.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Usuários cadastrados</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nome, e-mail, cadastro, localização informada e último acesso.</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar nome, e-mail ou local"
                aria-label="Buscar usuário por nome, e-mail, cidade ou estado"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Usuário</th>
                  <th className="px-5 py-3 font-bold">Cidade / Estado</th>
                  <th className="px-5 py-3 font-bold">Cadastro</th>
                  <th className="px-5 py-3 font-bold">Último acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && !dashboard ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">Carregando usuários…</td></tr>
                ) : dashboard?.users.length ? dashboard.users.map((person) => (
                  <tr key={person.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{person.name || 'Sem nome'}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{person.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {person.city || person.state ? (
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[person.city, person.state].filter(Boolean).join(' · ')}</span>
                      ) : <span className="text-slate-400">Não informado</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{formatDate(person.createdAt)}</td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{formatDate(person.lastAccess, true)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum usuário encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dashboard ? `Exibindo ${formatNumber(firstUser)}–${formatNumber(lastUser)} de ${formatNumber(dashboard.userCount)} usuários` : ' '} 
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} aria-label="Página anterior" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">Página {page} de {pageCount}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount || loading} aria-label="Próxima página" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPage;
