import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Plus,
  Trash2,
  Sparkles,
  CreditCard,
  Settings,
  Eye,
  Check,
  ArrowRight,
  ShieldCheck,
  Clock,
  Palette,
  FileCheck2,
  ChevronDown,
  Loader2,
  QrCode,
  Layout,
  Zap,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BudgetItem, Client, PaymentMethod, TemplateId, Budget } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { BudgetTemplateRenderer } from '../components/templates/BudgetTemplateRenderer';
import { formatCurrency, generateBudgetNumber } from '../lib/utils';
import { improveDescriptionWithAI } from '../lib/aiService';
import { useToast } from '../components/common/Toast';

export const CreateBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, company, createBudget, createClient, budgets, monthlyUsage, openUpgradeModal } = useData();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [isThirdBudgetModalOpen, setIsThirdBudgetModalOpen] = useState(false);
  const [createdBudgetId, setCreatedBudgetId] = useState<string | null>(null);

  // Check if limit already reached before allowing editor to load (Section 7, 8, 13)
  useEffect(() => {
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
      navigate('/dashboard');
    }
  }, [monthlyUsage.isLimitReached, openUpgradeModal, navigate]);

  // Mobile tab state: 'form' or 'preview'
  const [activeMobileTab, setActiveMobileTab] = useState<'form' | 'preview'>('form');

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);

  // New Client Form inside modal
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Budget general details
  const [title, setTitle] = useState('Instalação e Serviços Especializados');
  const [validityDays, setValidityDays] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentTerms, setPaymentTerms] = useState('50% de entrada no início e 50% na conclusão');
  const [executionTime, setExecutionTime] = useState('2 a 3 dias úteis');
  const [warranty, setWarranty] = useState('90 dias de garantia');
  const [notes, setNotes] = useState('Materiais com certificado de qualidade. Atendimento em conformidade com normas técnicas.');
  const [templateId, setTemplateId] = useState<TemplateId>(company.default_template || 'modern');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color || '#10b981');
  const [showSignature, setShowSignature] = useState(true);
  const [signatureName, setSignatureName] = useState(user?.name || company.name);

  // Items
  const [items, setItems] = useState<BudgetItem[]>([
    {
      id: 'item_1',
      description: 'Mão de obra especializada para execução dos serviços solicitados',
      quantity: 1,
      unit_price: 1200,
      discount: 0,
      total: 1200,
    },
    {
      id: 'item_2',
      description: 'Fornecimento de materiais de primeira linha e insumos para instalação',
      quantity: 1,
      unit_price: 350,
      discount: 0,
      total: 350,
    },
  ]);

  // AI loading state per item index
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null);

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0);
  const discountTotal = items.reduce((acc, curr) => acc + (curr.discount || 0), 0);
  const total = Math.max(0, subtotal - discountTotal);

  // Selected Client Object
  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'temp_cli',
    user_id: user?.id || 'usr_01',
    name: 'Nome do Cliente',
    phone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Draft budget for real-time preview
  const previewBudget: Budget = {
    id: 'preview_draft',
    user_id: user?.id || 'usr_01',
    budget_number: generateBudgetNumber(budgets.length + 483),
    title,
    client_id: selectedClientId,
    client: currentClient,
    items,
    subtotal,
    discount_total: discountTotal,
    total,
    validity_days: validityDays,
    payment_method: paymentMethod,
    payment_terms: paymentTerms,
    execution_time: executionTime,
    notes,
    warranty,
    template_id: templateId,
    primary_color: primaryColor,
    show_signature: showSignature,
    signature_name: signatureName,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Items manipulation
  const handleAddItem = () => {
    const newItem: BudgetItem = {
      id: `item_${Date.now()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };
    // Recalculate item total
    const qty = Number(target.quantity) || 0;
    const price = Number(target.unit_price) || 0;
    const disc = Number(target.discount) || 0;
    target.total = Math.max(0, qty * price - disc);

    updated[index] = target;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      error('Atenção', 'O orçamento precisa ter pelo menos um item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // AI Description Improvement (Section 13)
  const handleImproveWithAI = async (index: number) => {
    const currentDesc = items[index].description;
    if (!currentDesc.trim()) {
      info('Dica', 'Digite uma descrição básica (ex: "elétrica" ou "pintura") para a IA aprimorar.');
      return;
    }

    setAiLoadingIdx(index);
    try {
      const improved = await improveDescriptionWithAI(currentDesc);
      handleUpdateItem(index, 'description', improved);
      success('Descrição aprimorada com IA ✨', 'Texto reescrito com vocabulário técnico e persuasivo.');
    } catch {
      error('Não foi possível aprimorar a descrição');
    } finally {
      setAiLoadingIdx(null);
    }
  };

  // Add new client modal submit
  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const created = createClient({
      name: newClientName,
      document: newClientDoc,
      email: newClientEmail,
      phone: newClientPhone,
      whatsapp: newClientPhone.replace(/\D/g, ''),
      address: newClientAddress,
    });

    setSelectedClientId(created.id);
    setIsNewClientModalOpen(false);
    success('Cliente cadastrado com sucesso!', `${created.name} foi selecionado para o orçamento.`);

    // Reset fields
    setNewClientName('');
    setNewClientDoc('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  // Save budget
  const handleSaveBudget = (status: 'draft' | 'pending' | 'sent' = 'pending') => {
    if (!selectedClientId) {
      error('Cliente necessário', 'Por favor selecione ou crie um cliente para este orçamento.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      error('Item sem descrição', 'Preencha a descrição de todos os itens do orçamento.');
      return;
    }

    const isThirdCreation = monthlyUsage.isFree && monthlyUsage.count === 2;

    const created = createBudget({
      user_id: user?.id || 'usr_01',
      title: title || 'Orçamento de Serviços',
      client_id: selectedClientId,
      client: currentClient,
      items,
      subtotal,
      discount_total: discountTotal,
      total,
      validity_days: validityDays,
      payment_method: paymentMethod,
      payment_terms: paymentTerms,
      execution_time: executionTime,
      notes,
      warranty,
      template_id: templateId,
      primary_color: primaryColor,
      show_signature: showSignature,
      signature_name: signatureName,
      status,
    });

    if (!created) {
      return;
    }

    if (isThirdCreation) {
      setCreatedBudgetId(created.id);
      setIsThirdBudgetModalOpen(true);
      return;
    }

    success('Orçamento criado com sucesso! 🎉', `Orçamento ${created.budget_number} registrado.`);
    navigate(`/orcamentos/${created.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Editor Profissional
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Novo orçamento
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preencha os dados e visualize o documento em tempo real ao lado.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            onClick={() => handleSaveBudget('draft')}
            variant="outline"
            size="sm"
          >
            Salvar Rascunho
          </Button>

          <Button
            onClick={() => handleSaveBudget('pending')}
            variant="primary"
            size="md"
            className="font-bold shadow-sm"
            icon={<Check className="w-4 h-4" />}
          >
            Finalizar & Visualizar
          </Button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Section 10) */}
      <div className="lg:hidden flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
        <button
          onClick={() => setActiveMobileTab('form')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeMobileTab === 'form'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          1. Preencher Formulário
        </button>
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeMobileTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          2. Ver Prévia do Documento
        </button>
      </div>

      {/* 3rd Budget Warning Banner (Section 11) */}
      {monthlyUsage.isLastBudget && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 fill-current" />
            <div>
              <p className="font-bold">⚡ Último orçamento gratuito</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Você está utilizando seu último orçamento gratuito deste mês ({monthlyUsage.periodLabel}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openUpgradeModal}
            className="font-bold underline text-amber-900 dark:text-amber-200 hover:text-amber-700 shrink-0"
          >
            Ver planos ilimitados
          </button>
        </div>
      )}

      {/* Main Split Grid (Section 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Steps */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* ETAPA 1 — CLIENTE (Section 11) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Dados do Cliente
                </h3>
              </div>

              <Button
                onClick={() => setIsNewClientModalOpen(true)}
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                + Novo cliente
              </Button>
            </div>

            {/* Select existing client */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Selecionar cliente cadastrado:
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document ? `(${c.document})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Display active client preview badge */}
            {currentClient && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{currentClient.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-slate-500 dark:text-slate-400">
                  {currentClient.phone && <span>WhatsApp: {currentClient.phone}</span>}
                  {currentClient.email && <span>Email: {currentClient.email}</span>}
                  {currentClient.address && <span className="w-full">Endereço: {currentClient.address}</span>}
                </div>
              </div>
            )}
          </div>

          {/* ETAPA 2 — SERVIÇOS & ITENS (Section 12 & 13) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Serviços e Produtos
                </h3>
              </div>

              <Input
                label=""
                placeholder="Título do orçamento (ex: Reforma Elétrica)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-[240px] text-xs py-1.5"
              />
            </div>

            {/* Dynamic Items list */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-750 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Item #{idx + 1}
                    </span>

                    {/* AI Improvement Button (Section 13) */}
                    <button
                      type="button"
                      onClick={() => handleImproveWithAI(idx)}
                      disabled={aiLoadingIdx === idx}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition-colors border border-emerald-300/50 dark:border-emerald-800"
                    >
                      {aiLoadingIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>✨ Melhorar descrição com IA</span>
                    </button>
                  </div>

                  {/* Description textarea */}
                  <div>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      placeholder="Descreva o serviço ou produto com clareza..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* Quantity, Unit Price, Discount, Total row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Qtd:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Valor Unit. (R$):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Desconto (R$):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(e) => handleUpdateItem(idx, 'discount', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Subtotal:
                        </label>
                        <p className="font-bold text-slate-900 dark:text-white text-xs pt-1.5">
                          {formatCurrency(item.total)}
                        </p>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors mt-2"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={handleAddItem}
              variant="outline"
              size="sm"
              className="w-full justify-center py-2.5 text-xs font-semibold"
              icon={<Plus className="w-4 h-4" />}
            >
              + Adicionar outro serviço ou material
            </Button>
          </div>

          {/* ETAPA 3 — CONDIÇÕES & PAGAMENTO (Section 14) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Condições do Orçamento
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Forma de Pagamento Principal:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="pix">PIX (Instantâneo)</option>
                  <option value="card">Cartão de Crédito</option>
                  <option value="money">Dinheiro à Vista</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="transfer">Transferência / TED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Validade da Proposta (Dias):
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value) || 7)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prazo de Execução"
                placeholder="Ex: 2 a 3 dias úteis"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                leftIcon={<Clock className="w-4 h-4" />}
              />

              <Input
                label="Garantia Oferecida"
                placeholder="Ex: 90 dias de garantia"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Condições e Parcelamento"
              placeholder="Ex: 50% de entrada no início e 50% na conclusão"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Observações Adicionais (opcional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações importantes para o cliente..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ETAPA 4 — MODELO & PERSONALIZAÇÃO (Section 15) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Modelo e Personalização
              </h3>
            </div>

            {/* Template options */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Escolha o Modelo do Orçamento:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'modern', label: 'Modelo Moderno' },
                  { id: 'elegant', label: 'Modelo Elegante' },
                  { id: 'minimalist', label: 'Modelo Minimalista' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplateId(tmpl.id as TemplateId)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      templateId === tmpl.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signature option */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span>Incluir linha de assinatura visual no rodapé</span>
              </label>
            </div>

            {showSignature && (
              <Input
                label="Nome do Responsável pela Assinatura"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
              />
            )}
          </div>
        </div>

        {/* Right Column: Live Real-Time Budget Preview (Section 10 & 16) */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-24 space-y-4 ${
            activeMobileTab === 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              Visualização em Tempo Real
            </span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
              {templateId === 'modern' ? 'Modelo Moderno' : templateId === 'elegant' ? 'Modelo Elegante' : 'Modelo Minimalista'}
            </span>
          </div>

          {/* Document container */}
          <div className="bg-slate-200 dark:bg-slate-900/60 p-2 sm:p-4 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-card max-h-[82vh] overflow-y-auto">
            <BudgetTemplateRenderer budget={previewBudget} company={company} />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Subtotal: {formatCurrency(subtotal)}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Total Final: {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      <Modal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        title="+ Cadastrar Novo Cliente"
        description="Adicione rapidamente um novo cliente para vincular ao orçamento."
      >
        <form onSubmit={handleCreateClientSubmit} className="space-y-4">
          <Input
            label="Nome do Cliente ou Razão Social"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Ex: Ana Paula Martins"
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp / Telefone"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="(11) 98888-7777"
              required
            />

            <Input
              label="CPF ou CNPJ (opcional)"
              value={newClientDoc}
              onChange={(e) => setNewClientDoc(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail (opcional)"
              type="email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              placeholder="cliente@email.com"
            />

            <Input
              label="Endereço (opcional)"
              value={newClientAddress}
              onChange={(e) => setNewClientAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={() => setIsNewClientModalOpen(false)}
              variant="ghost"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Check className="w-4 h-4" />}
            >
              Salvar e Selecionar
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3rd Budget Completed Notice Modal (Section 12) */}
      <Modal
        isOpen={isThirdBudgetModalOpen}
        onClose={() => {
          setIsThirdBudgetModalOpen(false);
          if (createdBudgetId) navigate(`/orcamentos/${createdBudgetId}`);
        }}
        title="🎉 Você criou seu terceiro orçamento!"
        description="Você atingiu o limite de orçamentos do plano gratuito deste mês."
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Você atingiu o limite do plano gratuito. Para criar novos orçamentos, escolha um plano.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
            <Button
              onClick={() => {
                setIsThirdBudgetModalOpen(false);
                openUpgradeModal();
              }}
              variant="primary"
              size="md"
              className="font-bold"
              icon={<Sparkles className="w-4 h-4" />}
            >
              Ver planos
            </Button>
            <Button
              onClick={() => {
                setIsThirdBudgetModalOpen(false);
                if (createdBudgetId) navigate(`/orcamentos/${createdBudgetId}`);
              }}
              variant="outline"
              size="md"
            >
              Continuar para o orçamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
