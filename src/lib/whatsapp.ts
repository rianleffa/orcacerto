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

export async function generateFollowUpMessage(
  type: 'first' | 'second' | 'discount',
  clientName: string,
  budgetNumber: string,
  totalValue: string
): Promise<string> {
  const firstName = clientName.split(' ')[0];

  if (type === 'first') {
    return `Olá, ${firstName}! Tudo bem? 👋\n\nPassando apenas para saber se você conseguiu analisar o orçamento ${budgetNumber} no valor de ${totalValue} que te enviei recentemente.\n\nFicou alguma dúvida sobre os itens ou prazos? Fico à disposição!`;
  }

  if (type === 'second') {
    return `Olá, ${firstName}! Como estão as coisas por aí? 😊\n\nEstou organizando a agenda de atendimentos das próximas semanas e gostaria de verificar se daremos seguimento ao orçamento ${budgetNumber}.\n\nSe precisar ajustar alguma condição ou item, me avise que adequamos para você!`;
  }

  return `Olá, ${firstName}! 🚀\n\nTenho uma boa notícia: consigo uma condição especial para fecharmos o orçamento ${budgetNumber} esta semana!\n\nPodemos conversar sobre as opções de pagamento?`;
}

