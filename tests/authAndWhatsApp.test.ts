import { describe, expect, it } from 'vitest';
import { getAuthRedirectUrl } from '../src/lib/authRedirect';
import { generateWhatsAppUrl } from '../src/lib/whatsapp';

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
});

describe('preparação da mensagem do WhatsApp', () => {
  it('normaliza telefone brasileiro e codifica a mensagem', () => {
    expect(generateWhatsAppUrl('11987654321', 'Olá, Ana! Valor: R$ 12,50'))
      .toBe('https://wa.me/5511987654321?text=Ol%C3%A1%2C%20Ana!%20Valor%3A%20R%24%2012%2C50');
  });

  it('permite abrir a mensagem sem telefone preenchido', () => {
    expect(generateWhatsAppUrl('', 'Olá'))
      .toBe('https://wa.me/?text=Ol%C3%A1');
  });
});
