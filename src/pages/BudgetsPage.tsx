import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Send,
  Eye,
  Copy,
  Trash2,
  Download,
  Filter,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { BudgetStatus, Budget } from '../types/database';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import { generateWhatsAppUrl, buildBudgetDefaultWhatsAppMessage } from '../lib/whatsapp';
import { useToast } from '../components/common/Toast';

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { budgets, company, deleteBudget, duplicateBudget } = useData();
  const { success, info } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: 'Todos' },
    { id: 'draft', label: 'Rascunhos' },
    { id: 'sent', label: 'Enviados' },
    { id: 'pending', label: 'Aguardando' },
    { id: 'approved', label: 'Aprovados' },
    { id: 'rejected', label: 'Recusados' },
  ];

  // Filtering
  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch =
      b.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.budget_number.toLowerCase().includes(search.toLowerCase()) ||
      b.title.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const handleDuplicate = (id: string) => {
    const dup = duplicateBudget(id);
    if (dup) {
      success('Orçamento duplicado!', `Cópia criada como ${dup.budget_number}`);
      navigate(`/orcamentos/${dup.id}`);
    }
  };

  const handleSendWhatsApp = (b: Budget) => {
    const text = buildBudgetDefaultWhatsAppMessage(b, company);
    const url = generateWhatsAppUrl(b.client?.whatsapp || b.client?.phone || '', text);
    window.open(url, '_blank');
    info('WhatsApp aberto', 'Mensagem enviada com link e resumo da proposta.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Meus orçamentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie, duplique e acompanhe todos os seus orçamentos em tempo real.
          </p>
        </div>

        <Button
          onClick={() => navigate('/orcamentos/novo')}
          variant="primary"
          size="md"
          className="font-bold shadow-sm shrink-0"
          icon={<Plus className="w-4 h-4" />}
        >
          + Novo orçamento
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar cliente, serviço ou número do orçamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Counter tag */}
          <span className="text-xs text-slate-500 dark:text-slate-400 self-center">
            {filteredBudgets.length} de {budgets.length} orçamento(s)
          </span>
        </div>

        {/* Filter status tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        {filteredBudgets.length === 0 ? (
          <EmptyState
            title="Nenhum orçamento encontrado"
            description="Tente ajustar sua busca ou crie um novo orçamento para começar."
            actionText="+ Criar novo orçamento"
            onAction={() => navigate('/orcamentos/novo')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-6">Orçamento</th>
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Valor Total</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredBudgets.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/orcamentos/${b.id}`)}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {b.budget_number}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {b.client?.name || 'Cliente'}
                      </p>
                      <span className="text-xs text-slate-400 block truncate max-w-[220px]">
                        {b.title}
                      </span>
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSendWhatsApp(b)}
                          title="Enviar pelo WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/orcamentos/${b.id}`)}
                          title="Visualizar"
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

                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir o orçamento ${b.budget_number}?`)) {
                              deleteBudget(b.id);
                              success('Orçamento excluído');
                            }
                          }}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
