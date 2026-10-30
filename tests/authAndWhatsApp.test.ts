import { describe, expect, it } from 'vitest';
import {
  getAuthRedirectUrl,
  getEmailConfirmationRedirectUrl,
  getPasswordRecoveryRedirectUrl,
} from '../src/lib/authRedirect';
import {
  getAuthErrorMessage,
  getPasswordConfirmationError,
  getPasswordValidationError,
  isEmailConfirmationError,
  isValidEmail,
  normalizeEmail,
} from '../src/lib/authValidation';
import {
  CONFIRMATION_RESEND_COOLDOWN_SECONDS,
  getCooldownSecondsRemaining,
} from '../src/lib/confirmationResend';
import { buildBudgetDefaultWhatsAppMessage, generateWhatsAppUrl } from '../src/lib/whatsapp';
import { Budget, CompanyProfile } from '../src/types/database';

describe('redirecionamento de autenticação', () => {
  it('mantém o callback no domínio que iniciou o OAuth', () => {
    expect(getAuthRedirectUrl('https://orcacerto.vercel.app'))
      .toBe('https://orcacerto.vercel.app/auth/callback');
    expect(getAuthRedirectUrl('http://localhost:3000'))
      .toBe('http://localhost:3000/auth/callback');
  });

  it('rejeita origens que não são HTTP(S)', () => {
    expect(() => getAuthRedirectUrl('file:///tmp/orcacerto'))
      .toThrow('A origem atual não é compatível com autenticação web.');
  });

  it('usa rotas explícitas para confirmar e recuperar acesso', () => {
    expect(getEmailConfirmationRedirectUrl('https://orcacerto.vercel.app'))
      .toBe('https://orcacerto.vercel.app/auth/callback?flow=confirmation');
    expect(getPasswordRecoveryRedirectUrl('http://localhost:3000'))
      .toBe('http://localhost:3000/redefinir-senha?flow=recovery');
  });
});

describe('validação de credenciais', () => {
  it('normaliza e aceita endereços de provedores diferentes, incluindo Gmail', () => {
    expect(normalizeEmail('  Nome+teste@GMAIL.com ')).toBe('nome+teste@gmail.com');
    expect(isValidEmail('nome+teste@gmail.com')).toBe(true);
    expect(isValidEmail('pessoa@outlook.com')).toBe(true);
    expect(isValidEmail('e-mail-inválido')).toBe(false);
  });

  it('exige tamanho mínimo, letras e números e confirma a repetição da senha', () => {
    expect(getPasswordValidationError('curta1')).toContain('8 caracteres');
    expect(getPasswordValidationError('somenteletras')).toContain('letra e um número');
    expect(getPasswordValidationError('SenhaSegura123')).toBeNull();
    expect(getPasswordConfirmationError('SenhaSegura123', 'outraSenha123'))
      .toBe('As senhas informadas não coincidem.');
    expect(getPasswordConfirmationError('SenhaSegura123', 'SenhaSegura123')).toBeNull();
  });

  it('identifica conta sem confirmação e erros de envio do SMTP padrão', () => {
    expect(isEmailConfirmationError({ code: 'email_not_confirmed' })).toBe(true);
    expect(getAuthErrorMessage({ code: 'email_address_not_authorized' }, 'falha'))
      .toContain('SMTP personalizado');
    expect(getAuthErrorMessage({ code: 'over_email_send_rate_limit' }, 'falha'))
      .toContain('limite de envio');
    expect(getAuthErrorMessage({ message: 'Error sending confirmation email' }, 'falha'))
      .toContain('Verifique o SMTP');
  });

  it('calcula o intervalo restante para evitar reenvios consecutivos', () => {
    const now = 1_800_000_000_000;
    expect(CONFIRMATION_RESEND_COOLDOWN_SECONDS).toBe(60);
    expect(getCooldownSecondsRemaining(now + 60_000, now)).toBe(60);
    expect(getCooldownSecondsRemaining(now + 1, now)).toBe(1);
    expect(getCooldownSecondsRemaining(now - 1, now)).toBe(0);
    expect(getCooldownSecondsRemaining(Number.NaN, now)).toBe(0);
  });
});

describe('preparação da mensagem do WhatsApp', () => {
  it('inclui o resumo persistido do orçamento e substitui o modelo da empresa', () => {
    const budget = {
      budget_number: '#0001',
      title: 'Reforma elétrica',
      client: { name: 'Ana Paula' },
      items: [{
        id: 'item-1',
        description: 'Instalação de tomadas',
        quantity: 2,
        unit_price: 80,
        discount: 10,
        total: 150,
      }],
      subtotal: 160,
      discount_total: 10,
      total: 150,
      validity_days: 10,
      payment_method: 'pix',
      payment_terms: '50% na entrada',
      execution_time: '2 dias úteis',
    } as Budget;
    const company = {
      name: 'Empresa Exemplo',
      default_whatsapp_message: 'Olá, {cliente}! Orçamento {numero}: {valor} — {empresa}.',
    } as CompanyProfile;

    const message = buildBudgetDefaultWhatsAppMessage(budget, company).replace(/\u00a0/g, ' ');

    expect(message).toContain('Olá, Ana! Orçamento #0001: R$ 150,00 — Empresa Exemplo.');
    expect(message).toContain('Instalação de tomadas — 2 × R$ 80,00 (desconto R$ 10,00): R$ 150,00');
    expect(message).toContain('Validade: 10 dias');
    expect(message).toContain('2 dias úteis');
    expect(message).toContain('50% na entrada');
  });

  it('normaliza telefone brasileiro e codifica a mensagem', () => {
    expect(generateWhatsAppUrl('11987654321', 'Olá, Ana! Valor: R$ 12,50'))
      .toBe('https://wa.me/5511987654321?text=Ol%C3%A1%2C%20Ana!%20Valor%3A%20R%24%2012%2C50');
  });

  it('permite abrir a mensagem sem telefone preenchido', () => {
    expect(generateWhatsAppUrl('', 'Olá'))
      .toBe('https://wa.me/?text=Ol%C3%A1');
  });
});
