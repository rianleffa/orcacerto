import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, ArrowRight, Lock, Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { getRememberSession } from '../lib/supabase';
import { isValidEmail, normalizeEmail } from '../lib/authValidation';
import { getConfirmationResendCooldown } from '../lib/confirmationResend';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, resendConfirmation, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(getRememberSession);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(getConfirmationResendCooldown);
  const routeMessage = (location.state as { message?: string } | null)?.message;
  const successMessage = routeMessage || null;
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const search = window.location.search;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
    const authError = params.get('error_description') || params.get('error');
    if (authError) {
      if (authError.includes('access_denied') || authError.includes('cancelled') || authError.includes('canceled')) {
        return 'O login com Google foi cancelado.';
      } else if (authError.includes('expired')) {
        return 'A sessão do login expirou. Por favor, tente novamente.';
      } else if (authError.includes('invalid_client') || authError.includes('client not found')) {
        return 'Erro de configuração: O Client ID do Google configurado no Supabase não foi encontrado no Google Cloud.';
      } else if (authError.includes('redirect_uri_mismatch')) {
        return 'Erro de configuração: A URL de callback não coincide com a autorizada no Google Cloud.';
      }
      return 'Não foi possível completar o login com o Google.';
    }
    return null;
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown(getConfirmationResendCooldown());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // If already logged in, redirect to dashboard or previous route
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clean URL if error was present
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('error') || window.location.search.includes('error'))) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email) {
      error('Preencha o e-mail');
      return;
    }
    if (!isValidEmail(email)) {
      error('E-mail inválido', 'Informe um endereço de e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(normalizeEmail(email), password, rememberMe);
      if (res.success) {
        success('Bem-vindo de volta!', 'Login realizado com sucesso.');
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        const msg = res.error || 'Credenciais incorretas. Verifique seu e-mail e senha.';
        setPendingConfirmation(Boolean(res.requiresEmailConfirmation));
        setErrorMessage(msg);
        error('Falha no login', msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro de conexão ao tentar fazer login.';
      setErrorMessage(msg);
      error('Falha no login', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const requestedPath = (location.state as any)?.from?.pathname;
    sessionStorage.setItem(
      'orcacerto_auth_redirect',
      typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard'
    );
    try {
      info('Conectando ao Google...', 'Aguarde o redirecionamento seguro para a conta Google.');
      const res = await loginWithGoogle(rememberMe);
      if (res?.error) {
        sessionStorage.removeItem('orcacerto_auth_redirect');
        setErrorMessage(res.error);
        error('Autenticação com Google', res.error);
        setGoogleLoading(false);
      }
      // Se não houver erro, o navegador é redirecionado pelo Supabase para a tela do Google.
    } catch (err: any) {
      sessionStorage.removeItem('orcacerto_auth_redirect');
      const msg = err?.message || 'Falha ao conectar com o serviço do Google.';
      setErrorMessage(msg);
      error('Autenticação com Google', msg);
      setGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!isValidEmail(email)) {
      error('E-mail inválido', 'Informe o mesmo endereço utilizado no cadastro.');
      return;
    }
    setResendingConfirmation(true);
    try {
      const result = await resendConfirmation(normalizeEmail(email));
      setResendCooldown(getConfirmationResendCooldown());
      if (result.success) {
        info('Solicitação aceita', 'O Supabase aceitou o pedido de reenvio. A entrega depende do serviço de e-mail configurado; confira também a pasta de spam.');
      } else {
        error('Não foi possível reenviar', result.error || 'Tente novamente em alguns minutos.');
      }
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <main role="main" className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col justify-start sm:justify-center py-8 sm:py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xl shadow-card group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Orça<span className="text-brand-500">Certo</span>
          </span>
        </Link>
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Acesse sua conta
        </h1>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          "Faça seu orçamento. Feche seu negócio."
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {pendingConfirmation && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 space-y-3" role="status">
              <p>Confirme seu e-mail antes de entrar. Você pode solicitar um novo link de confirmação.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={resendingConfirmation}
                onClick={handleResendConfirmation}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reenviar confirmação
              </Button>
            </div>
          )}

          {/* Form: Email & Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={() => setPendingConfirmation(false)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              autoCapitalize="none"
              enterKeyHint="go"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span>Lembrar de mim</span>
              </label>
              <Link to="/recuperar-senha" className="text-brand-600 dark:text-brand-400 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            {!pendingConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendingConfirmation || resendCooldown > 0}
                className="mx-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingConfirmation ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Aguarde ${resendCooldown}s para reenviar` : 'Não recebeu a confirmação? Reenviar e-mail'}
              </button>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={googleLoading}
              className="w-full min-h-12 py-3 text-sm font-bold shadow-sm"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar
            </Button>
          </form>

          {/* Divider: "ou" */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold">
                ou
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full min-h-12 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>{googleLoading ? 'Iniciando com Google...' : 'Continuar com Google'}</span>
          </button>

          <div className="text-center text-xs text-slate-600 dark:text-slate-300 pt-1 font-medium">
            Ainda não tem conta?{' '}
            <Link
              to="/cadastro"
              className="font-bold text-brand-700 dark:text-brand-400 hover:underline"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
