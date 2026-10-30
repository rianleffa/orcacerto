import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Printer,
  MessageSquare,
  Clock,
  Share2,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Pencil,
  MessageCircle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { BudgetStatus, PaymentMethod, Budget } from '../types/database';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { BudgetTemplateRenderer } from '../components/templates/BudgetTemplateRenderer';
import { generateBudgetPdf } from '../components/pdf/PDFGenerator';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  generateWhatsAppUrl,
  buildBudgetDefaultWhatsAppMessage,
  generateFollowUpMessage,
} from '../lib/whatsapp';
import { useToast } from '../components/common/Toast';

export const BudgetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBudget, getBudgetAsync, updateBudgetStatus, deleteBudget, duplicateBudget, company } = useData();
  const { success, error, info } = useToast();

  const inMemoryBudget = getBudget(id || '');
  const [asyncBudget, setAsyncBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(!inMemoryBudget);

  const budget = inMemoryBudget || asyncBudget;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(!inMemoryBudget);

    getBudgetAsync(id).then((found) => {
      if (isMounted) {
        if (found) {
          setAsyncBudget(found);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPdfSuccessModalOpen, setIsPdfSuccessModalOpen] = useState(false);

  // Follow-up generator state
  const [followUpType, setFollowUpType] = useState<'first' | 'second'>('first');
  const [customFollowUpMsg, setCustomFollowUpMsg] = useState('');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Carregando orçamento...
        </p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 my-8 max-w-lg mx-auto shadow-subtle space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Orçamento não encontrado</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O orçamento que você está procurando não existe ou foi removido.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button onClick={() => navigate('/orcamentos')} variant="outline" size="sm">
            Voltar para Orçamentos
          </Button>
          <Button onClick={() => navigate('/orcamentos/novo')} variant="primary" size="sm">
            Criar Novo Orçamento
          </Button>
        </div>
      </div>
    );
  }

  // Handle status update
  const handleStatusChange = async (newStatus: BudgetStatus) => {
    try {
      await updateBudgetStatus(budget.id, newStatus);
      if (newStatus === 'approved') {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }).catch(() => {});
        success('Parabéns! Negócio Fechado 🎉', `Orçamento ${budget.budget_number} foi aprovado com sucesso!`);
      } else {
        info('Status atualizado', `Status alterado para ${newStatus}`);
      }
    } catch {
      error('Falha ao atualizar status', 'A alteração não foi confirmada pelo Supabase. Tente novamente.');
    }
  };

  // Generate & Download PDF (Section 17)
  const handleGeneratePdf = async () => {
    setPdfGenerating(true);
    info('Gerando documento PDF profissional...');
    try {
      const fileName = `Orcamento_${budget.budget_number.replace('#', '')}_${budget.client?.name.replace(/\s+/g, '_')}.pdf`;
      const ok = await generateBudgetPdf('budget-document-print', fileName);
      if (ok) {
        setIsPdfSuccessModalOpen(true);
        success('PDF gerado com sucesso!', 'O download do documento foi iniciado.');
      } else {
        error('Falha ao gerar PDF', 'Verifique o logotipo da empresa e tente novamente.');
      }
    } catch {
      error('Falha ao gerar PDF', 'Tente novamente. Se o erro continuar, confira se o logotipo está acessível.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Send WhatsApp (Section 18)
  const handleSendWhatsApp = () => {
    const text = buildBudgetDefaultWhatsAppMessage(budget, company);
    const url = generateWhatsAppUrl(budget.client?.whatsapp || budget.client?.phone || '', text);
    window.open(url, '_blank');
    success('WhatsApp aberto', 'Revise e envie a mensagem. Você pode anexar o PDF baixado à conversa.');
  };

  // Open Follow-up Modal (Section 20)
  const handleOpenFollowUp = async (type: 'first' | 'second') => {
    setFollowUpType(type);
    const msg = await generateFollowUpMessage(
      type,
      budget.client?.name || 'Cliente',
      budget.budget_number,
      formatCurrency(budget.total)
    );
    setCustomFollowUpMsg(msg);
    setIsFollowUpModalOpen(true);
  };

  const handleSendFollowUp = () => {
    const url = generateWhatsAppUrl(budget.client?.whatsapp || budget.client?.phone || '', customFollowUpMsg);
    window.open(url, '_blank');
    setIsFollowUpModalOpen(false);
    success('Lembrete aberto no WhatsApp!', 'Mensagem pronta para envio.');
  };

  // Duplicate (Section 23)
  const handleConfirmDuplicate = async () => {
    try {
      const duplicated = await duplicateBudget(budget.id);
      setIsDuplicateModalOpen(false);
      if (duplicated) {
        success('Orçamento duplicado com sucesso!', `Novo orçamento ${duplicated.budget_number} criado.`);
        navigate(`/orcamentos/${duplicated.id}`);
      }
    } catch {
      error('Falha ao duplicar orçamento', 'Os dados não foram confirmados pelo Supabase. Tente novamente.');
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    try {
      await deleteBudget(budget.id);
      setIsDeleteModalOpen(false);
      success('Orçamento excluído', 'O documento foi removido do seu histórico.');
      navigate('/orcamentos');
    } catch {
      error('Falha ao excluir orçamento', 'A exclusão não foi confirmada pelo Supabase. Tente novamente.');
    }
  };

  // Timeline steps computation (Section 19)
  const timelineSteps = [
    { label: 'Criado', date: budget.created_at, done: true },
    { label: 'Enviado', date: budget.sent_at, done: ['sent', 'viewed', 'pending', 'approved'].includes(budget.status) },
    { label: 'Visualizado', date: budget.sent_at, done: ['viewed', 'approved'].includes(budget.status) || (budget.views_count || 0) > 0 },
    { label: 'Aprovado', date: budget.approved_at, done: budget.status === 'approved' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Budget Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {budget.budget_number}
          </h1>
          <Badge status={budget.status} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cliente: <strong className="text-slate-700 dark:text-slate-200">{budget.client?.name}</strong> • Criado em {formatDate(budget.created_at, 'short')}
        </p>
        {/* Business timeline remains grouped with the budget header. */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Progresso do Negócio
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                    step.done
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {step.date ? formatDate(step.date, 'short') : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Management Controls */}
        <div className="order-2 lg:order-1 lg:col-span-4 lg:col-start-1 lg:row-start-1 space-y-6">
          {/* Status Changer */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Alterar Status
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { status: 'approved' as BudgetStatus, label: '🟢 Marcar como Aprovado' },
                { status: 'pending' as BudgetStatus, label: '⏳ Aguardando aprovação' },
                { status: 'sent' as BudgetStatus, label: '🔵 Marcar como Enviado' },
                { status: 'rejected' as BudgetStatus, label: '🔴 Marcar como Recusado' },
                { status: 'draft' as BudgetStatus, label: '🟡 Retornar para Rascunho' },
              ].map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => handleStatusChange(opt.status)}
                  className={`w-full text-left text-xs font-semibold py-2.5 px-3.5 rounded-xl border transition-all ${
                    budget.status === opt.status
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Assistant (Section 20) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                💡 Mensagens de Follow-up
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O cliente ainda não deu retorno? Escolha uma mensagem pronta e envie em segundos pelo WhatsApp:
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleOpenFollowUp('first')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 transition-all text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span>1º Contato (Cortesia)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  "Olá! Tudo bem? Gostaria de saber se conseguiu analisar o orçamento que enviei..."
                </p>
              </button>

              <button
                onClick={() => handleOpenFollowUp('second')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 transition-all text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span>2º Contato (Disponibilidade)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  "Olá! Passando para verificar se ficou alguma dúvida sobre o orçamento..."
                </p>
              </button>
            </div>
          </div>

          {/* Quick Client Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Contato do Cliente
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{budget.client?.name}</p>
              <p>Telefone: {budget.client?.phone || 'Não informado'}</p>
              <p>Email: {budget.client?.email || 'Não informado'}</p>
              <p>Endereço: {budget.client?.address || 'Não informado'}</p>
            </div>

            <Button
              onClick={() => navigate(`/clientes/${budget.client_id}`)}
              variant="outline"
              size="sm"
              className="w-full mt-2"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Ver perfil completo do cliente
            </Button>
          </div>

          {/* Danger zone delete */}
          <div className="pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir este orçamento
            </button>
          </div>
        </div>

        {/* Right Column: Complete Budget Document Preview */}
        <div className="order-1 lg:order-2 lg:col-span-8 lg:col-start-5 lg:row-start-1 bg-slate-200 dark:bg-slate-900/60 p-3 sm:p-6 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-float overflow-hidden">
          <BudgetTemplateRenderer budget={budget} company={company} />
        </div>
      </div>

      {/* Main budget actions stay below the complete document for review first. */}
      <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">O que deseja fazer com este orçamento?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Confira os dados do documento acima antes de editar, baixar ou compartilhar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
          <Button
            onClick={() => navigate(`/orcamentos/editar/${budget.id}`)}
            variant="outline"
            size="md"
            className="w-full"
            icon={<Pencil className="w-4 h-4" />}
          >
            Editar orçamento
          </Button>

          <Button
            onClick={handleGeneratePdf}
            loading={pdfGenerating}
            variant="outline"
            size="md"
            className="w-full"
            icon={<Download className="w-4 h-4" />}
          >
            Baixar PDF
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            variant="primary"
            size="md"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-none font-bold shadow-sm"
            icon={<MessageCircle className="w-4 h-4" />}
          >
            Enviar pelo WhatsApp
          </Button>

          <Button
            onClick={() => navigate('/orcamentos')}
            variant="outline"
            size="md"
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar aos orçamentos
          </Button>

          <Button
            onClick={() => setIsDuplicateModalOpen(true)}
            variant="outline"
            size="md"
            className="w-full"
            icon={<Copy className="w-4 h-4" />}
          >
            Duplicar orçamento
          </Button>
        </div>
      </section>

      {/* Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Enviar Follow-up pelo WhatsApp"
        description="Ajuste o texto conforme desejar antes de abrir a conversa com o cliente."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Mensagem para {budget.client?.name}:
            </label>
            <textarea
              rows={5}
              value={customFollowUpMsg}
              onChange={(e) => setCustomFollowUpMsg(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => setIsFollowUpModalOpen(false)} variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button
              onClick={handleSendFollowUp}
              variant="primary"
              size="sm"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none font-semibold"
              icon={<Send className="w-4 h-4" />}
            >
              Enviar pelo WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Success Action Modal (Section 17) */}
      <Modal
        isOpen={isPdfSuccessModalOpen}
        onClose={() => setIsPdfSuccessModalOpen(false)}
        title="PDF gerado com sucesso! 🎉"
        description="O documento do orçamento foi gerado em alta resolução."
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            O PDF foi baixado. Abra o WhatsApp para enviar a mensagem com o resumo do orçamento e anexe o arquivo à conversa, se necessário.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                setIsPdfSuccessModalOpen(false);
                handleSendWhatsApp();
              }}
              variant="primary"
              size="sm"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none"
              icon={<Send className="w-4 h-4" />}
            >
              Enviar pelo WhatsApp
            </Button>
            <Button
              onClick={() => setIsPdfSuccessModalOpen(false)}
              variant="outline"
              size="sm"
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Duplicate confirmation modal (Section 23) */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicar este orçamento?"
        description="Será criada uma cópia idêntica deste orçamento com um novo número e status Rascunho, pronta para ser ajustada para outro cliente."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={() => setIsDuplicateModalOpen(false)} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDuplicate} variant="primary" size="sm" icon={<Copy className="w-4 h-4" />}>
            Sim, duplicar orçamento
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir este orçamento?"
        description="Esta ação removerá o orçamento do sistema. Os dados do cliente continuarão salvos."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={() => setIsDeleteModalOpen(false)} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}>
            Sim, excluir definitivamente
          </Button>
        </div>
      </Modal>
    </div>
  );
};
