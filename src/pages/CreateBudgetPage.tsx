import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Plus,
  Trash2,
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
  QrCode,
  Layout,
  Zap,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BudgetItem, Client, PaymentMethod, TemplateId, Budget, BudgetStatus } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { BudgetTemplateRenderer } from '../components/templates/BudgetTemplateRenderer';
import { formatCurrency, generateBudgetNumber } from '../lib/utils';
import {
  calculateBudgetItemTotal,
  calculateBudgetTotals,
  hasValidBudgetAmounts,
} from '../lib/budgetCalculations';
import { useToast } from '../components/common/Toast';

export const CreateBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editBudgetId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(editBudgetId);

  const {
    clients,
    company,
    createBudget,
    updateBudget,
    createClient,
    budgets,
    monthlyUsage,
    openUpgradeModal,
    getBudgetAsync,
  } = useData();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [loadingBudget, setLoadingBudget] = useState(isEditMode);
  const [existingBudgetNumber, setExistingBudgetNumber] = useState('');
  const [existingBudgetStatus, setExistingBudgetStatus] = useState<BudgetStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);

  // Check if limit already reached before allowing editor to load (only in create mode)
  useEffect(() => {
    if (!isEditMode && monthlyUsage.isLimitReached) {
      openUpgradeModal();
      navigate('/dashboard');
    }
  }, [isEditMode, monthlyUsage.isLimitReached, openUpgradeModal, navigate]);

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
  const [title, setTitle] = useState('');
  const [validityDays, setValidityDays] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [executionTime, setExecutionTime] = useState('');
  const [warranty, setWarranty] = useState('');
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState<TemplateId>(company.default_template || 'modern');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color || '#10b981');
  const [showSignature, setShowSignature] = useState(true);
  const [signatureName, setSignatureName] = useState(user?.name || company.name);

  // Items
  const [items, setItems] = useState<BudgetItem[]>([]);

  // Reset the form when switching between creating and editing, then load the
  // persisted items only for the budget being edited.
  useEffect(() => {
    setTitle('');
    setValidityDays(10);
    setPaymentMethod('pix');
    setPaymentTerms('');
    setExecutionTime('');
    setWarranty('');
    setNotes('');
    setTemplateId(company.default_template || 'modern');
    setPrimaryColor(company.primary_color || '#10b981');
    setShowSignature(true);
    setSignatureName(user?.name || company.name);
    setItems([]);
    setExistingBudgetNumber('');
    setExistingBudgetStatus('draft');
    setSelectedClientId(clients[0]?.id || '');
    setLoadingBudget(Boolean(editBudgetId));

    if (!editBudgetId) return;

    let isMounted = true;
    const loadBudgetToEdit = async () => {
      setLoadingBudget(true);
      const b = await getBudgetAsync(editBudgetId);
      if (!isMounted) return;
      if (b) {
        setExistingBudgetNumber(b.budget_number);
        setExistingBudgetStatus(b.status || 'draft');
        setTitle(b.title || '');
        if (b.client_id) setSelectedClientId(b.client_id);
        if (b.validity_days) setValidityDays(b.validity_days);
        if (b.payment_method) setPaymentMethod(b.payment_method);
        if (b.payment_terms !== undefined) setPaymentTerms(b.payment_terms || '');
        if (b.execution_time !== undefined) setExecutionTime(b.execution_time || '');
        if (b.warranty !== undefined) setWarranty(b.warranty || '');
        if (b.notes !== undefined) setNotes(b.notes || '');
        if (b.template_id) setTemplateId(b.template_id);
        if (b.primary_color) setPrimaryColor(b.primary_color);
        if (b.show_signature !== undefined) setShowSignature(b.show_signature);
        if (b.signature_name !== undefined) setSignatureName(b.signature_name || '');
        if (Array.isArray(b.items)) {
          setItems(b.items.map((item) => ({
            ...item,
            total: calculateBudgetItemTotal(item),
          })));
        }
      } else {
        error('Orçamento não encontrado', 'O orçamento selecionado para edição não foi localizado.');
        navigate('/orcamentos');
      }
      setLoadingBudget(false);
    };

    loadBudgetToEdit();
    return () => {
      isMounted = false;
    };
  }, [editBudgetId]);

  // Keep client selection in sync if not set
  useEffect(() => {
    if (!selectedClientId && clients.length > 0 && !isEditMode) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, isEditMode]);

  // Calculations
  const { subtotal, discount_total: discountTotal, total } = calculateBudgetTotals(items);

  // Selected Client Object
  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'temp_cli',
    user_id: user?.id || 'usr_01',
    name: 'Selecione um cliente',
    phone: '',
    whatsapp: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Draft budget for real-time preview
  const previewBudget: Budget = {
    id: editBudgetId || 'preview_draft',
    user_id: user?.id || 'usr_01',
    budget_number: existingBudgetNumber || generateBudgetNumber(budgets.length + 483),
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
    status: isEditMode ? existingBudgetStatus : 'draft',
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
    target.total = calculateBudgetItemTotal(target);

    updated[index] = target;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add new client modal submit
  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    try {
      const created = await createClient({
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
    } catch {
      error('Falha ao salvar cliente', 'Confira sua conexão e tente novamente.');
    }
  };

  // Save budget
  const handleSaveBudget = async (status: BudgetStatus = 'pending') => {
    if (isSaving) return;
    if (!selectedClientId) {
      error('Cliente necessário', 'Por favor selecione ou crie um cliente para este orçamento.');
      return;
    }

    if (items.length === 0) {
      error('Adicione um item', 'Inclua pelo menos um serviço ou material antes de salvar o orçamento.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      error('Item sem descrição', 'Preencha a descrição de todos os itens do orçamento.');
      return;
    }

    if (!hasValidBudgetAmounts(items)) {
      error('Valores inválidos', 'Confira quantidades e valores. Cada item e o subtotal devem respeitar os limites do banco de dados.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && editBudgetId) {
        await updateBudget(editBudgetId, {
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
          status: status === 'draft' ? 'draft' : existingBudgetStatus,
        });

        success('Orçamento atualizado!', `As alterações do orçamento ${existingBudgetNumber} foram salvas.`);
        navigate(`/orcamentos/${editBudgetId}`);
        return;
      }

      const created = await createBudget({
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
        error('Orçamento não salvo', 'Não foi possível confirmar o salvamento. Seus dados continuam preenchidos; tente novamente.');
        return;
      }

      success('Orçamento criado com sucesso! 🎉', `Orçamento ${created.budget_number} registrado.`);
      navigate(`/orcamentos/${created.id}`);
    } catch {
      error('Falha ao salvar orçamento', 'Não foi possível confirmar o salvamento. Seus dados continuam no formulário; confira a conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingBudget) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Carregando dados do orçamento...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Form Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {isEditMode ? 'Edição de Orçamento' : 'Editor Profissional'}
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {isEditMode ? (existingBudgetNumber ? `Editar ${existingBudgetNumber}` : 'Editar orçamento') : 'Novo orçamento'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditMode
              ? 'Atualize os dados e confirme para salvar as alterações do documento.'
              : 'Preencha os dados e visualize o documento em tempo real ao lado.'}
          </p>
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
                {clients.length === 0 && (
                  <option value="">Nenhum cliente cadastrado — Clique em + Novo cliente</option>
                )}
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
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Nenhum serviço ou material adicionado. Use o botão abaixo para incluir um item.
                </p>
              )}
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-750 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Item #{idx + 1}
                    </span>
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
                        min="0"
                        step="0.01"
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
                        step="0.01"
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
                        step="0.01"
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

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors mt-2"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Form actions follow every form section, including template selection. */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <Button
          onClick={() => navigate(isEditMode && editBudgetId ? `/orcamentos/${editBudgetId}` : '/orcamentos')}
          variant="ghost"
          size="md"
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => handleSaveBudget(isEditMode ? existingBudgetStatus : 'pending')}
          variant="primary"
          size="md"
          className="w-full sm:w-auto font-bold shadow-sm"
          icon={<Check className="w-4 h-4" />}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Salvar e Emitir Orçamento'}
        </Button>
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

    </div>
  );
};
