import React, { useState } from 'react';
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
  Sparkles,
  MessageSquare,
  Clock,
  Share2,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { BudgetStatus, PaymentMethod } from '../types/database';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { BudgetTemplateRenderer } from '../components/templates/BudgetTemplateRenderer';
import { generateBudgetPdf } from '../components/pdf/PDFGenerator';
import { formatCurrency, formatDate } from '../lib/utils';
import { generateWhatsAppUrl, buildBudgetDefaultWhatsAppMessage } from '../lib/whatsapp';
import { generateFollowUpMessage } from '../lib/aiService';
import { useToast } from '../components/common/Toast';
import confetti from 'canvas-confetti';

export const BudgetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBudget, updateBudgetStatus, deleteBudget, duplicateBudget, company } = useData();
  const { success, error, info } = useToast();

  const budget = getBudget(id || '');

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPdfSuccessModalOpen, setIsPdfSuccessModalOpen] = useState(false);

  // Follow-up generator state
  const [followUpType, setFollowUpType] = useState<'first' | 'second'>('first');
  const [customFollowUpMsg, setCustomFollowUpMsg] = useState('');

  if (!budget) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 my-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Orçamento não encontrado</h2>
        <p className="text-sm text-slate-500 mt-2">O orçamento que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/orcamentos')} variant="primary" className="mt-6">
          Voltar para Orçamentos
        </Button>
      </div>
    );
  }

  // Handle status update
  const handleStatusChange = (newStatus: BudgetStatus) => {
    updateBudgetStatus(budget.id, newStatus);
    if (newStatus === 'approved') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      success('Parabéns! Negócio Fechado 🎉', `Orçamento ${budget.budget_number} foi aprovado com sucesso!`);
    } else {
      info('Status atualizado', `Status alterado para ${newStatus}`);
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
        success('PDF gerado com sucesso!', 'Seu arquivo já foi baixado para o computador.');
      }
    } catch (err) {
      error('Falha ao gerar PDF', 'Utilize a opção de impressão do navegador.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Send WhatsApp (Section 18)
  const handleSendWhatsApp = () => {
    const text = buildBudgetDefaultWhatsAppMessage(budget, company);
    const url = generateWhatsAppUrl(budget.client?.whatsapp || budget.client?.phone || '', text);
    window.open(url, '_blank');
    if (budget.status === 'draft') {
      updateBudgetStatus(budget.id, 'sent');
    }
    success('WhatsApp aberto!', 'Mensagem enviada com link e resumo da proposta.');
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
  const handleConfirmDuplicate = () => {
    const duplicated = duplicateBudget(budget.id);
    setIsDuplicateModalOpen(false);
    if (duplicated) {
      success('Orçamento duplicado com sucesso!', `Novo orçamento ${duplicated.budget_number} criado.`);
      navigate(`/orcamentos/${duplicated.id}`);
    }
  };

  // Delete
  const handleConfirmDelete = () => {
    deleteBudget(budget.id);
    setIsDeleteModalOpen(false);
    success('Orçamento excluído', 'O documento foi removido do seu histórico.');
    navigate('/orcamentos');
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
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/orcamentos')}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar
          </Button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {budget.budget_number}
              </h1>
              <Badge status={budget.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cliente: <strong className="text-slate-700 dark:text-slate-200">{budget.client?.name}</strong> • Criado em {formatDate(budget.created_at, 'short')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            onClick={() => setIsDuplicateModalOpen(true)}
            variant="outline"
            size="sm"
            icon={<Copy className="w-4 h-4" />}
          >
            Duplicar
          </Button>

          <Button
            onClick={handleGeneratePdf}
            loading={pdfGenerating}
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            Gerar PDF
          </Button>

          <Button
            onClick={handleSendWhatsApp}
            variant="primary"
            size="sm"
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none font-semibold shadow-sm"
            icon={<Send className="w-4 h-4" />}
          >
            Enviar pelo WhatsApp
          </Button>
        </div>
      </div>

      {/* Timeline Bar (Section 19) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Management Controls */}
        <div className="lg:col-span-4 space-y-6">
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
        <div className="lg:col-span-8 bg-slate-200 dark:bg-slate-900/60 p-3 sm:p-6 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-float overflow-hidden">
          <BudgetTemplateRenderer budget={budget} company={company} />
        </div>
      </div>

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
            Você pode compartilhar o PDF baixado ou enviar diretamente a mensagem padrão com link para o cliente no WhatsApp.
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
