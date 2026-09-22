import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BudgetStatus, PaymentMethod } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string, style: 'short' | 'long' | 'relative' = 'short'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (style === 'relative') {
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  }

  if (style === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatPhone(phone?: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function formatDocument(doc?: string): string {
  if (!doc) return '';
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export function generateBudgetNumber(index: number = 1): string {
  const pad = String(index).padStart(6, '0');
  return `#${pad}`;
}

export function getStatusDetails(status: BudgetStatus): {
  label: string;
  badgeClass: string;
  dotColor: string;
  iconName: string;
} {
  switch (status) {
    case 'draft':
      return {
        label: 'Rascunho',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40',
        dotColor: 'bg-amber-500',
        iconName: 'Edit3',
      };
    case 'sent':
      return {
        label: 'Enviado',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40',
        dotColor: 'bg-blue-500',
        iconName: 'Send',
      };
    case 'viewed':
      return {
        label: 'Visualizado',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/40',
        dotColor: 'bg-purple-500',
        iconName: 'Eye',
      };
    case 'pending':
      return {
        label: 'Aguardando aprovação',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40',
        dotColor: 'bg-sky-500',
        iconName: 'Clock',
      };
    case 'approved':
      return {
        label: 'Aprovado',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40',
        dotColor: 'bg-emerald-500',
        iconName: 'CheckCircle2',
      };
    case 'rejected':
      return {
        label: 'Recusado',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40',
        dotColor: 'bg-rose-500',
        iconName: 'XCircle',
      };
    case 'expired':
      return {
        label: 'Expirado',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/40',
        dotColor: 'bg-slate-400',
        iconName: 'AlertCircle',
      };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    pix: 'PIX (Instantâneo)',
    money: 'Dinheiro à Vista',
    card: 'Cartão de Crédito/Débito',
    boleto: 'Boleto Bancário',
    transfer: 'Transferência / TED',
  };
  return map[method] || method;
}
