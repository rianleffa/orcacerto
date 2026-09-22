import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Plus,
  Send,
  Eye,
  FileCheck2,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { formatCurrency, formatPhone, formatDocument, formatDate } from '../lib/utils';
import { generateWhatsAppUrl } from '../lib/whatsapp';
import { useToast } from '../components/common/Toast';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient, budgets, deleteClient } = useData();
  const { success } = useToast();

  const client = getClient(id || '');

  if (!client) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 my-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cliente não encontrado</h2>
        <Button onClick={() => navigate('/clientes')} variant="primary" className="mt-4">
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  // Filter budgets for this client
  const clientBudgets = budgets.filter((b) => b.client_id === client.id);
  const totalNegotiated = clientBudgets.reduce((acc, curr) => acc + curr.total, 0);
  const approvedBudgets = clientBudgets.filter((b) => b.status === 'approved');
  const totalApproved = approvedBudgets.reduce((acc, curr) => acc + curr.total, 0);

  const handleOpenWhatsApp = () => {
    const text = `Olá, ${client.name.split(' ')[0]}! Tudo bem? Fico à disposição para o que precisar.`;
    const url = generateWhatsAppUrl(client.whatsapp || client.phone || '', text);
    window.open(url, '_blank');
  };

  const handleDeleteClient = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${client.name}?`)) {
      deleteClient(client.id);
      success('Cliente removido');
      navigate('/clientes');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/clientes')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar
          </Button>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {client.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente desde {formatDate(client.created_at, 'short')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenWhatsApp}
            variant="outline"
            size="sm"
            className="text-emerald-600 border-emerald-300 dark:border-emerald-800"
            icon={<Phone className="w-4 h-4" />}
          >
            WhatsApp
          </Button>

          <Button
            onClick={() => navigate('/orcamentos/novo')}
            variant="primary"
            size="sm"
            className="font-bold shadow-sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Novo orçamento para este cliente
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Orçamentos gerados</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {clientBudgets.length}
            </p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total em negociação</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalNegotiated)}
            </p>
          </div>
        </Card>

        <Card hover className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total aprovado / fechado</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalApproved)}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact info card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Ficha do Cliente
          </h3>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            {client.document && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CPF/CNPJ: <strong>{formatDocument(client.document)}</strong></span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tel: <strong>{formatPhone(client.phone)}</strong></span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Email: <strong>{client.email}</strong></span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Endereço: <strong>{client.address}</strong></span>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Observações
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-xl">
                {client.notes}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleDeleteClient}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Excluir este cliente
            </button>
          </div>
        </div>

        {/* Budgets History */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Histórico de Orçamentos ({clientBudgets.length})
            </h3>
          </div>

          {clientBudgets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum orçamento emitido para este cliente ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-6">Orçamento</th>
                    <th className="py-3 px-6">Serviço</th>
                    <th className="py-3 px-6">Valor</th>
                    <th className="py-3 px-6">Data</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {clientBudgets.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/orcamentos/${b.id}`)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {b.budget_number}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        {b.title}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.total)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDate(b.created_at, 'short')}
                      </td>
                      <td className="py-4 px-6">
                        <Badge status={b.status} />
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => navigate(`/orcamentos/${b.id}`)}
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
