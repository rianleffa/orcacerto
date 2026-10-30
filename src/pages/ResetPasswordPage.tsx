import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Lock } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured, supabase } from '../lib/supabase';
import { getPasswordConfirmationError, getPasswordValidationError } from '../lib/authValidation';

type RecoveryStatus = 'checking' | 'ready' | 'invalid';
const RECOVERY_SESSION_KEY = 'orcacerto_password_recovery_session';

const hasValidRecoveryMarker = (userId: string): boolean => {
  try {
    const marker = JSON.parse(sessionStorage.getItem(RECOVERY_SESSION_KEY) || 'null') as {
      userId?: string;
      issuedAt?: number;
    } | null;
    return Boolean(
      marker?.userId === userId &&
      typeof marker.issuedAt === 'number' &&
      Date.now() - marker.issuedAt <= 15 * 60 * 1000
    );
  } catch {
    return false;
  }
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword, logout } = useAuth();
  const flow = searchParams.get('flow');
  const recoveryRequested = flow === 'recovery' ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery');
  const hasCallbackError = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('error') ||
    new URLSearchParams(window.location.search).has('error_code') ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).has('error') ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).has('error_code')
  );
  const [status, setStatus] = useState<RecoveryStatus>(() =>
    isSupabaseConfigured() && recoveryRequested && !hasCallbackError ? 'checking' : 'invalid'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabaseClient() || supabase;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const authError = params.get('error') || params.get('error_code') || hashParams.get('error') || hashParams.get('error_code');
    if (!isSupabaseConfigured() || !sb || !recoveryRequested || authError) return;

    const { data: listener } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        sessionStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({
          userId: session.user.id,
          issuedAt: Date.now(),
        }));
        setStatus('ready');
        window.history.replaceState(window.history.state, '', window.location.pathname);
      }
    });

    const validateRecoverySession = async () => {
      try {
        const { data, error } = await sb.auth.getSession();
        if (cancelled) return;

        if (!error && data.session?.user && hasValidRecoveryMarker(data.session.user.id)) {
          setStatus('ready');
          // Remove the one-time code and flow marker after Supabase accepted the link.
          window.history.replaceState(window.history.state, '', window.location.pathname);
          return;
        }

        window.setTimeout(async () => {
          if (cancelled) return;
          try {
            const { data: retry } = await sb.auth.getSession();
            if (!cancelled && retry.session?.user && hasValidRecoveryMarker(retry.session.user.id)) {
              setStatus('ready');
              window.history.replaceState(window.history.state, '', window.location.pathname);
            } else if (!cancelled) {
              setStatus('invalid');
            }
          } catch {
            if (!cancelled) setStatus('invalid');
          }
        }, 500);
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    };

    void validateRecoverySession();
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [flow, recoveryRequested]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    const confirmationError = getPasswordConfirmationError(password, confirmPassword);
    if (confirmationError) {
      setErrorMessage(confirmationError);
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setErrorMessage(result.error || 'Não foi possível atualizar a senha. Solicite um novo link.');
        return;
      }
      await logout();
      navigate('/login', {
        replace: true,
        state: { message: 'Senha atualizada. Entre usando sua nova senha.' },
      });
    } catch {
      setErrorMessage('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
    } finally {
      setLoading(false);
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
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">Criar nova senha</h1>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          Escolha uma senha segura para sua conta.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float space-y-6">
          {status === 'checking' && (
            <div className="text-center text-sm text-slate-600 dark:text-slate-300" role="status">
              Validando seu link seguro...
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4 text-center" role="alert">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
              <div className="space-y-2">
                <h2 className="font-bold text-slate-900 dark:text-white">Link inválido ou expirado</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Solicite um novo link de recuperação e abra-o no mesmo navegador.
                </p>
              </div>
              <Link to="/recuperar-senha" className="inline-flex items-center justify-center gap-2 font-bold text-brand-700 dark:text-brand-400 hover:underline">
                Solicitar novo link
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <>
              {errorMessage && (
                <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Nova senha"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres, letra e número"
                  autoComplete="new-password"
                  required
                  helper="Use pelo menos 8 caracteres, com letras e números."
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Input
                  label="Confirme a nova senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Button type="submit" variant="primary" loading={loading} className="w-full min-h-12" icon={<CheckCircle2 className="w-4 h-4" />}>
                  Salvar nova senha
                </Button>
              </form>
            </>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400">
            <ArrowLeft className="w-4 h-4" /> Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
