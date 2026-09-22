import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  FileCheck2,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Client } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatPhone, formatDate, formatDocument } from '../lib/utils';
import { useToast } from '../components/common/Toast';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, budgets, createClient, deleteClient } = useData();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New client form states
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate client metrics
  const getClientStats = (clientId: string) => {
    const clientBudgets = budgets.filter((b) => b.client_id === clientId);
    const totalNegotiated = clientBudgets.reduce((acc, curr) => acc + curr.total, 0);
    const approvedCount = clientBudgets.filter((b) => b.status === 'approved').length;
    const lastBudget = clientBudgets[0];

    return {
      count: clientBudgets.length,
      totalNegotiated,
      approvedCount,
      lastBudgetNumber: lastBudget?.budget_number || '—',
      lastBudgetDate: lastBudget?.created_at ? formatDate(lastBudget.created_at, 'short') : '—',
    };
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.document?.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      error('Preencha o nome do cliente');
      return;
    }

    const created = createClient({
      name,
      document,
      email,
      phone,
      whatsapp: phone.replace(/\D/g, ''),
      address,
      notes,
    });

    setIsModalOpen(false);
    success('Cliente adicionado com sucesso!', `${created.name} já pode receber orçamentos.`);

    // Reset
    setName('');
    setDocument('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mantenha os contatos e o histórico financeiro dos seus clientes organizados.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="md"
          className="font-bold shadow-sm shrink-0"
          icon={<Plus className="w-4 h-4" />}
        >
          + Novo cliente
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, e-mail ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {filteredClients.length} cliente(s)
        </span>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        {filteredClients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Nenhum cliente encontrado"
            description="Cadastre seus clientes para associá-los rapidamente a orçamentos profissionais."
            actionText="+ Cadastrar novo cliente"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-850/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Contato</th>
                  <th className="py-3 px-6">Último Orçamento</th>
                  <th className="py-3 px-6">Total Negociado</th>
                  <th className="py-3 px-6">Negócios Fechados</th>
                  <th className="py-3 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredClients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/clientes/${client.id}`)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {client.name}
                        </p>
                        {client.document && (
                          <span className="text-xs text-slate-400 block font-mono">
                            {formatDocument(client.document)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                        {client.phone && <p>{formatPhone(client.phone)}</p>}
                        {client.email && <p className="text-slate-400 truncate max-w-[180px]">{client.email}</p>}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">
                          {stats.lastBudgetNumber}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
                          {stats.lastBudgetDate}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(stats.totalNegotiated)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          {stats.approvedCount} aprovado(s)
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/clientes/${client.id}`)}
                            variant="ghost"
                            size="sm"
                            icon={<ChevronRight className="w-4 h-4" />}
                          >
                            Ver
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="+ Novo Cliente"
        description="Cadastre um cliente para agilizar o preenchimento de futuros orçamentos."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo ou Razão Social"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João da Silva ou Studio XP"
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-8888"
              required
            />

            <Input
              label="CPF ou CNPJ"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />

            <Input
              label="Endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Observações internas do cliente (opcional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências de horário, detalhes do local, histórico..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={<Check className="w-4 h-4" />}>
              Cadastrar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
