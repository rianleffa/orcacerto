import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Loader2, AlertCircle } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { syncSupabaseUser } = useAuth();
  const { success, error } = useToast();
  const [statusMessage, setStatusMessage] = useState('Finalizando autenticação...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const handleOAuthCallback = async () => {
      const sb = getSupabaseClient() || supabase;
      const isEmailConfirmation = new URLSearchParams(window.location.search).get('flow') === 'confirmation';

      // 1. Verificar parâmetros de erro na URL (query ou hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.substring(1) : ''
      );

      const errCode = urlParams.get('error') || urlParams.get('error_code') || hashParams.get('error') || hashParams.get('error_code');
      const errDescription = urlParams.get('error_description') || hashParams.get('error_description');

      if (errCode || errDescription) {
        console.error('[AuthCallback] Erro retornado pelo provedor OAuth:', { errCode, errDescription });
        let friendlyMsg = isEmailConfirmation
          ? 'Não foi possível confirmar este e-mail. O link pode ter expirado ou já ter sido utilizado.'
          : 'Não foi possível completar a autenticação.';
        if (errCode === 'access_denied' || errDescription?.includes('access_denied')) {
          friendlyMsg = 'Você cancelou o login com o Google.';
        } else if (errDescription?.includes('provider is not enabled')) {
          friendlyMsg = 'O login com Google ainda não está habilitado nas configurações do Supabase.';
        } else if (errDescription?.includes('invalid_client') || errDescription?.includes('OAuth client was not found')) {
          friendlyMsg = 'Erro de configuração: O Client ID do Google configurado no Supabase não foi encontrado no Google Cloud Console.';
        } else if (errDescription?.includes('redirect_uri_mismatch')) {
          friendlyMsg = 'Erro de configuração: A URL de redirecionamento (Redirect URI) não coincide com a cadastrada no Google Cloud Console.';
        } else if (errDescription) {
          friendlyMsg = errDescription;
        }

        if (!isCancelled) {
          sessionStorage.removeItem('orcacerto_auth_redirect');
          setErrorMessage(friendlyMsg);
          error('Erro na Autenticação', friendlyMsg);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
        return;
      }

      if (!isSupabaseConfigured() || !sb) {
        const msg = 'Configuração do Supabase não encontrada no ambiente.';
        if (!isCancelled) {
          setErrorMessage(msg);
          error('Erro de Configuração', msg);
          setTimeout(() => navigate('/login', { replace: true }), 2500);
        }
        return;
      }

      // Função de redirecionamento para o dashboard
      const proceedToApp = (account: any) => {
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {}

        localStorage.removeItem('orcacerto_budgets');
        localStorage.removeItem('orcacerto_clients');
        localStorage.removeItem('orcacerto_company');

        const hasCompletedOnboarding =
          Boolean(account.onboarding_completed) ||
          Boolean(account.phone && account.phone.trim().length > 0) ||
          Boolean(account.company_name && account.company_name !== 'Minha Empresa') ||
          localStorage.getItem(`orcacerto_onboarded_${account.id}`) === 'true';

        const requestedPath = sessionStorage.getItem('orcacerto_auth_redirect');
        sessionStorage.removeItem('orcacerto_auth_redirect');
        const safeRedirect = requestedPath &&
          /^\/(dashboard|orcamentos|clientes|relatorios|perfil|configuracoes|planos)(\/|$)/.test(requestedPath)
          ? requestedPath
          : '/dashboard';

        if (!hasCompletedOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(safeRedirect, { replace: true });
        }
      };

      try {
        setStatusMessage(isEmailConfirmation ? 'Validando o link de confirmação...' : 'Validando sua sessão...');

        // 2. Ouvinte de estado caso o Supabase troque a sessão em segundo plano
        let resolved = false;
        const { data: authListener } = sb.auth.onAuthStateChange(async (event, currentSession) => {
          if (resolved || isCancelled) return;
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && currentSession?.user) {
            resolved = true;
            try {
              setStatusMessage('Sincronizando perfil...');
              const account = await syncSupabaseUser(currentSession.user);
              if (!isCancelled) {
                success(
                  isEmailConfirmation ? 'E-mail confirmado!' : 'Bem-vindo!',
                  isEmailConfirmation
                    ? 'Sua conta foi confirmada e já está pronta para uso.'
                    : `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`
                );
                proceedToApp(account);
              }
            } catch (sErr) {
              console.warn('[AuthCallback] Erro ao sincronizar via listener:', sErr);
            }
          }
        });

        // 3. Verificar se a sessão já foi obtida pelo cliente Supabase (detectSessionInUrl)
        const { data: initialSession } = await sb.auth.getSession();
        if (initialSession?.session?.user && !resolved) {
          resolved = true;
          authListener.subscription.unsubscribe();
          setStatusMessage('Sincronizando seu perfil...');
          const account = await syncSupabaseUser(initialSession.session.user);
          if (!isCancelled) {
            success(
              isEmailConfirmation ? 'E-mail confirmado!' : 'Bem-vindo!',
              isEmailConfirmation
                ? 'Sua conta foi confirmada e já está pronta para uso.'
                : `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`
            );
            proceedToApp(account);
          }
          return;
        }

        // 4. Se não há sessão ainda, tentar trocar o código PKCE explicitamente
        const code = urlParams.get('code');
        if (code && !resolved) {
          try {
            const { data: exchangeData, error: exchangeErr } = await sb.auth.exchangeCodeForSession(code);
            if (!exchangeErr && exchangeData?.user && !resolved) {
              resolved = true;
              authListener.subscription.unsubscribe();
              setStatusMessage('Sincronizando perfil...');
              const account = await syncSupabaseUser(exchangeData.user);
              if (!isCancelled) {
                success(
                  isEmailConfirmation ? 'E-mail confirmado!' : 'Bem-vindo!',
                  isEmailConfirmation
                    ? 'Sua conta foi confirmada e já está pronta para uso.'
                    : `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`
                );
                proceedToApp(account);
              }
              return;
            }
          } catch (e) {
            console.warn('[AuthCallback] exchangeCode aviso:', e);
          }
        }

        // 5. Fallback via getUser caso exchangeCode já tenha sido feito
        if (!resolved) {
          const { data: userData } = await sb.auth.getUser();
          if (userData?.user && !resolved) {
            resolved = true;
            authListener.subscription.unsubscribe();
            setStatusMessage('Sincronizando perfil...');
            const account = await syncSupabaseUser(userData.user);
            if (!isCancelled) {
              success('Bem-vindo!', `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`);
              proceedToApp(account);
            }
            return;
          }
        }

        // 6. Timeout de segurança de 3 segundos para aguardar o listener
        setTimeout(() => {
          if (!resolved && !isCancelled) {
            authListener.subscription.unsubscribe();
            // Verifica uma última vez getSession antes de desistir
            sb.auth.getSession().then(({ data: finalCheck }) => {
              if (finalCheck?.session?.user && !isCancelled) {
                syncSupabaseUser(finalCheck.session.user).then((acc) => {
                  proceedToApp(acc);
                });
              } else if (!isCancelled) {
                setErrorMessage('Não foi possível confirmar a sessão. Tente novamente.');
                error('Falha de Autenticação', 'Sessão expirada ou não encontrada.');
                navigate('/login', { replace: true });
              }
            });
          }
        }, 3000);
      } catch (err: any) {
        console.error('[AuthCallback] Exceção inesperada:', err);
        if (!isCancelled) {
          const msg = err?.message || 'Falha ao processar o retorno do login.';
          setErrorMessage(msg);
          error('Erro na Autenticação', msg);
          setTimeout(() => navigate('/login', { replace: true }), 2500);
        }
      }
    };

    handleOAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [navigate, syncSupabaseUser, success, error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto shadow-card">
          {errorMessage ? (
            <AlertCircle className="w-8 h-8 text-rose-100" />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {errorMessage ? 'Falha na Autenticação' : 'Conectando ao OrçaCerto'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {errorMessage ? errorMessage : statusMessage}
          </p>
        </div>

        {errorMessage && (
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            Voltar para o Login
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
