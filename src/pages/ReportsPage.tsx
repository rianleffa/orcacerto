import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Calendar,
  Send,
  Clock,
  Award,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card } from '../components/common/Card';
import { formatCurrency } from '../lib/utils';

export const ReportsPage: React.FC = () => {
  const { budgets } = useData();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  // Filter budgets by chosen period days
  const periodDays = Number(period);
  const cutoffTime = Date.now() - 1000 * 60 * 60 * 24 * periodDays;

  const relevantBudgets = budgets.filter((b) => {
    const time = new Date(b.created_at).getTime();
    return !isNaN(time) ? time >= cutoffTime : true;
  });

  const createdCount = relevantBudgets.length;
  const sentCount = relevantBudgets.filter((b) => ['sent', 'viewed', 'pending', 'approved'].includes(b.status)).length;
  const approvedCount = relevantBudgets.filter((b) => b.status === 'approved').length;
  const rejectedCount = relevantBudgets.filter((b) => b.status === 'rejected').length;

  const totalValue = relevantBudgets.reduce((acc, curr) => acc + curr.total, 0);
  const approvedValue = relevantBudgets
    .filter((b) => b.status === 'approved')
    .reduce((acc, curr) => acc + curr.total, 0);

  const approvalRate = createdCount > 0 ? Math.round((approvedCount / createdCount) * 100) : 0;
  const avgTicket = approvedCount > 0 ? Math.round(approvedValue / approvedCount) : 0;

  // Breakdown by template
  const templateBreakdown = [
    { label: 'Moderno', count: relevantBudgets.filter((b) => b.template_id === 'modern').length },
    { label: 'Elegante', count: relevantBudgets.filter((b) => b.template_id === 'elegant').length },
    { label: 'Minimalista', count: relevantBudgets.filter((b) => b.template_id === 'minimalist').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Desempenho Comercial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas essenciais para entender sua conversão e faturamento.
          </p>
        </div>

        {/* Period Selector (7d, 30d, 90d) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: '7', label: 'Últimos 7 dias' },
            { id: '30', label: 'Últimos 30 dias' },
            { id: '90', label: 'Últimos 90 dias' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Orçamentos Criados</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {createdCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {sentCount} enviados a clientes
          </span>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Negócios Aprovados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {approvedCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {rejectedCount} recusados no período
          </span>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Fechado</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(approvedValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            De {formatCurrency(totalValue)} orçados
          </span>
        </Card>

        <Card hover className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Taxa de Conversão</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {approvalRate}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Ticket médio: {formatCurrency(avgTicket)}
          </span>
        </Card>
      </div>

      {/* Visual Progress Funnel (Section 35) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Funil de Orçamentos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento de cada fase da negociação
            </p>
          </div>

          <div className="space-y-4">
            {/* Created */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">1. Criados</span>
                <span className="text-slate-900 dark:text-white">{createdCount} (100%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Sent */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">2. Enviados / Apresentados</span>
                <span className="text-slate-900 dark:text-white">
                  {sentCount} ({createdCount > 0 ? Math.round((sentCount / createdCount) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${createdCount > 0 ? (sentCount / createdCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Approved */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">3. Aprovados (Negócio Fechado)</span>
                <span className="text-emerald-600 font-bold">
                  {approvedCount} ({approvalRate}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Template Preferences */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Modelos Mais Utilizados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Templates escolhidos para suas propostas
            </p>
          </div>

          <div className="space-y-4">
            {templateBreakdown.map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.label}</h4>
                  <span className="text-xs text-slate-400">{t.count} orçamento(s) gerados</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                    {createdCount > 0 ? Math.round((t.count / createdCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
