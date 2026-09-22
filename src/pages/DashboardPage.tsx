import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Send,
  Eye,
  Copy,
  Download,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import { generateWhatsAppUrl, buildBudgetDefaultWhatsAppMessage } from '../lib/whatsapp';
import { useToast } from '../components/common/Toast';
import confetti from 'canvas-confetti';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { budgets, company, duplicateBudget, updateBudgetStatus, monthlyUsage, openUpgradeModal } = useData();
  const { success, info } = useToast();

  const [followUpDismissed, setFollowUpDismissed] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Empreendedor';

  const handleCreateClick = () => {
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
    } else {
      navigate('/orcamentos/novo');
    }
  };

  // Metrics calculation
  const totalBudgetsCount = budgets.length;
  const pendingBudgets = budgets.filter((b) => b.status === 'pending' || b.status === 'sent');
  const approvedBudgets = budgets.filter((b) => b.status === 'approved');
  const totalInNegotiation = pendingBudgets.reduce((acc, curr) => acc + curr.total, 0);
  const totalApprovedValue = approvedBudgets.reduce((acc, curr) => acc + curr.total, 0);

  // Approval rate calculation
  const closedCount = approvedBudgets.length + budgets.filter((b) => b.status === 'rejected').length;
  const approvalRate = closedCount > 0 ? Math.round((approvedBudgets.length / closedCount) * 100) : 67;

  // Follow-up candidate (budget in pending status for 2+ days)
  const followUpBudget = budgets.find((b) => b.status === 'pending');

  const handleDuplicate = (id: string) => {
    const duplicated = duplicateBudget(id);
    if (duplicated) {
      success('Orçamento duplicado!', `Cópia criada como ${duplicated.budget_number}`);
      navigate(`/orcamentos/${duplicated.id}`);
    }
  };

  const handleQuickApprove = (id: string, budgetNum: string) => {
    updateBudgetStatus(id, 'approved');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
    success('Negócio Fechado! 🎉', `Orçamento ${budgetNum} marcado como Aprovado.`);
  };

  const handleSendWhatsApp = (budget: typeof budgets[0]) => {
    const text = buildBudgetDefaultWhatsAppMessage(budget, company);
    const url = generateWhatsAppUrl(budget.client?.whatsapp || budget.client?.phone || '', text);
    window.open(url, '_blank');
    info('WhatsApp aberto', 'Mensagem pronta carregada no aplicativo.');
  };

  const handleQuickFollowUp = (budget: typeof budgets[0]) => {
    const clientFirst = budget.client?.name?.split(' ')[0] || 'Cliente';
    const text = `Olá, ${clientFirst}! Tudo bem? 👋\n\nPassando apenas para saber se conseguiu analisar o orçamento ${budget.budget_number} (${formatCurrency(budget.total)}) que te enviei.\n\nFicou alguma dúvida? Fico à disposição para fecharmos!`;
    const url = generateWhatsAppUrl(budget.client?.whatsapp || budget.client?.phone || '', text);
    window.open(url, '_blank');
    info('Lembrete aberto', 'Mensagem de acompanhamento enviada para o WhatsApp.');
    setFollowUpDismissed(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Vamos fechar mais um negócio hoje?
          </p>
        </div>

        <Button
          onClick={handleCreateClick}
          variant="primary"
          size="lg"
          className="font-bold shadow-card shrink-0 hover:scale-105 transition-transform"
          icon={<Plus className="w-5 h-5" />}
        >
          + Criar orçamento
        </Button>
      </div>

      {/* Free Plan 3-Budget Usage Progress Indicator (Section 10) or Paid Unlimited Indicator (Section 15) */}
      {monthlyUsage.isFree ? (
        <div
          className={`p-5 rounded-3xl border transition-all ${
            monthlyUsage.isLimitReached
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          } shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
        >
          <div className="space-y-1.5 flex-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Seus orçamentos ({monthlyUsage.periodLabel})
              </span>
              {monthlyUsage.isLimitReached ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                  3 de 3 utilizados
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Plano Gratuito
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {monthlyUsage.count} de 3 utilizados
            </p>

            {/* Progress Bar (Section 10) */}
            <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  monthlyUsage.isLimitReached ? 'bg-rose-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, (monthlyUsage.count / 3) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            {monthlyUsage.isLimitReached ? (
              <Button
                onClick={openUpgradeModal}
                variant="primary"
                size="sm"
                className="bg-brand-500 font-bold shrink-0 shadow-sm"
                icon={<Sparkles className="w-4 h-4" />}
              >
                Faça upgrade para continuar
              </Button>
            ) : (
              <Button
                onClick={openUpgradeModal}
                variant="outline"
                size="sm"
                className="shrink-0 text-xs font-semibold"
              >
                Conhecer planos ilimitados
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Seus orçamentos
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                Orçamentos ilimitados
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 uppercase">
                  Plano {user?.plan === 'premium' ? 'Premium' : 'Profissional'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900/40">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Orçamentos este mês
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalBudgetsCount}
            </p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aguardando aprovação
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {pendingBudgets.length}
            </p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aprovados / Fechados
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {approvedBudgets.length}
            </p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Valor em negociação
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalInNegotiation)}
            </p>
          </div>
        </Card>
      </div>

      {/* Gamificação Leve (Section 28) & Follow-up (Section 20) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gamification summary */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Seu Desempenho
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold mt-2">Visão Geral do Mês</h3>
            <p className="text-xs text-slate-400 mt-1">
              {totalBudgetsCount} orçamentos criados • {approvedBudgets.length} negócios fechados
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Taxa de aprovação:</span>
                <span className="text-2xl font-black text-emerald-400">{approvalRate}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Total fechado: <strong className="text-white">{formatCurrency(totalApprovedValue)}</strong>
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={() => navigate('/relatorios')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Ver relatório completo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Follow-up Smart Alert (Section 20) */}
        <div className="lg:col-span-2">
          {followUpBudget && !followUpDismissed ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-brand-500/30 dark:border-brand-500/20 shadow-subtle h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    💡 Hora de fazer um follow-up
                  </div>
                  <button
                    onClick={() => setFollowUpDismissed(true)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Dispensar
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {followUpBudget.client?.name} ainda não respondeu ao orçamento {followUpBudget.budget_number}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Valor: <strong>{formatCurrency(followUpBudget.total)}</strong> • Enviado há alguns dias. Clientes que recebem um lembrete fecham 3x mais!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => handleQuickFollowUp(followUpBudget)}
                  variant="primary"
                  size="sm"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none font-semibold"
                  icon={<MessageSquare className="w-4 h-4" />}
                >
                  Enviar lembrete pelo WhatsApp
                </Button>
                <Button
                  onClick={() => navigate(`/orcamentos/${followUpBudget.id}`)}
                  variant="outline"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                >
                  Ver orçamento
                </Button>
              </div>
            </div>
          ) : (
            <Card className="h-full flex flex-col justify-center items-center text-center p-8 bg-white dark:bg-slate-900">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Seus follow-ups estão em dia!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Nenhum orçamento pendente precisando de atenção imediata neste momento.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Latest Budgets Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Últimos orçamentos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhe o status e realize ações rápidas de envio
            </p>
          </div>

          <Button
            onClick={() => navigate('/orcamentos')}
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Ver todos ({budgets.length})
          </Button>
        </div>

        {budgets.length === 0 ? (
          <EmptyState onAction={() => navigate('/orcamentos/novo')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Orçamento</th>
                  <th className="py-3 px-6">Valor</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {budgets.slice(0, 6).map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/orcamentos/${b.id}`)}
                  >
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {b.client?.name || 'Cliente sem nome'}
                      </p>
                      <span className="text-xs text-slate-400 truncate max-w-[200px] block mt-0.5">
                        {b.title}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {b.budget_number}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(b.total)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(b.created_at, 'short')}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={b.status} />
                    </td>
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()} // Prevent row click
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendWhatsApp(b)}
                          title="Enviar pelo WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/orcamentos/${b.id}`)}
                          title="Visualizar orçamento"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(b.id)}
                          title="Duplicar orçamento"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {b.status !== 'approved' && (
                          <button
                            onClick={() => handleQuickApprove(b.id, b.budget_number)}
                            title="Marcar como Aprovado"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
