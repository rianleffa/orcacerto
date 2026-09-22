// Cakto Payment Integration Links & Helpers
// "Não criar checkout próprio. Não tentar reproduzir a página de pagamento da Cakto. Ao clicar no botão, abrir o checkout externo da Cakto."

export const CAKTO_LINKS = {
  professional: 'https://pay.cakto.com.br/3dxjonu_1127919',
  premium: 'https://pay.cakto.com.br/mj8by3j_1127942',
} as const;

export interface SubscriptionIntent {
  plan: 'professional' | 'premium';
  user_id?: string;
  email?: string;
  created_at: string;
}

export function openCaktoCheckout(plan: 'professional' | 'premium', userContext?: { id?: string; email?: string }): void {
  const url = CAKTO_LINKS[plan];
  
  // Register subscription intent
  try {
    const intent: SubscriptionIntent = {
      plan,
      user_id: userContext?.id,
      email: userContext?.email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('orcacerto_last_subscription_intent', JSON.stringify(intent));
  } catch (err) {
    console.warn('Could not store subscription intent:', err);
  }

  // Open external checkout in a new tab securely (target="_blank", rel="noopener noreferrer")
  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
