import { Budget, CompanyProfile } from '../types/database';
import { formatCurrency } from './utils';

export function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // If Brazilian 10 or 11 digits without country code, add 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function buildBudgetDefaultWhatsAppMessage(
  budget: Budget,
  company: CompanyProfile
): string {
  const clientName = budget.client?.name ? budget.client.name.split(' ')[0] : 'Cliente';
  const budgetNum = budget.budget_number;
  const formattedVal = formatCurrency(budget.total);

  if (company.default_whatsapp_message) {
    return company.default_whatsapp_message
      .replace(/{cliente}/g, clientName)
      .replace(/{numero}/g, budgetNum)
      .replace(/{valor}/g, formattedVal)
      .replace(/{empresa}/g, company.name);
  }

  return `Olá, ${clientName}! 👋

Preparei seu orçamento pelo OrçaCerto com todo o detalhamento.

📄 Orçamento: ${budgetNum}
💰 Valor total: ${formattedVal}

Confira os detalhes no documento anexo.

Fico à disposição para qualquer dúvida ou para combinarmos a execução!

Atenciosamente,
${company.name}`;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedMsg = encodeURIComponent(message);
  
  if (!cleanPhone) {
    // Open WhatsApp web with draft message even without recipient phone
    return `https://wa.me/?text=${encodedMsg}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}
