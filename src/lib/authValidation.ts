export const MIN_PASSWORD_LENGTH = 8;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(normalizeEmail(email));

export const getPasswordValidationError = (password: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[A-Za-zÀ-ÿ]/u.test(password) || !/\d/u.test(password)) {
    return 'Use pelo menos uma letra e um número na senha.';
  }
  return null;
};

export const getPasswordConfirmationError = (
  password: string,
  confirmation: string
): string | null => password === confirmation ? null : 'As senhas informadas não coincidem.';

interface AuthErrorLike {
  code?: string;
  message?: string;
}

export const isEmailConfirmationError = (error: AuthErrorLike | null | undefined): boolean => {
  const code = error?.code?.toLowerCase() || '';
  const message = error?.message?.toLowerCase() || '';
  return code === 'email_not_confirmed' || message.includes('email not confirmed');
};

export const getAuthErrorMessage = (
  error: AuthErrorLike | null | undefined,
  fallback: string
): string => {
  const code = error?.code?.toLowerCase() || '';
  const message = error?.message?.toLowerCase() || '';

  if (isEmailConfirmationError(error)) {
    return 'Confirme seu e-mail antes de entrar. Você pode solicitar um novo link de confirmação abaixo.';
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  }
  if (code === 'email_address_not_authorized' || message.includes('email address not authorized')) {
    return 'O Supabase não está autorizado a enviar para este endereço. Configure um SMTP personalizado no painel do Supabase.';
  }
  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit exceeded')) {
    return 'O limite de envio de e-mails foi atingido. Aguarde alguns minutos e tente novamente.';
  }
  if (code === 'weak_password' || message.includes('password should be at least')) {
    return 'A senha não atende aos requisitos configurados no Supabase. Use uma senha mais forte.';
  }
  if (code === 'user_already_exists' || message.includes('user already registered')) {
    return 'Não foi possível criar a conta. Tente entrar ou recuperar a senha para este e-mail.';
  }
  if (message.includes('already confirmed') || message.includes('already verified')) {
    return 'Este e-mail já está confirmado. Tente entrar normalmente.';
  }
  if (code === 'redirect_uri_not_allowed' || message.includes('redirect url')) {
    return 'A URL de retorno não está permitida. Confira Auth → URL Configuration no Supabase.';
  }
  if (message.includes('fetch') || message.includes('network')) {
    return 'Não foi possível conectar ao serviço de autenticação. Confira sua conexão e tente novamente.';
  }

  return error?.message || fallback;
};
