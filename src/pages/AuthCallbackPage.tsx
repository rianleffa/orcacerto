import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Loader2, AlertCircle } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { syncSupabaseUser, updateUser } = useAuth();
  const { success, error } = useToast();
  const [statusMessage, setStatusMessage] = useState('Finalizando autenticação...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const handleOAuthCallback = async () => {
      // 1. Verificar parâmetros de erro na URL (query ou hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.substring(1) : ''
      );

      const errCode = urlParams.get('error') || hashParams.get('error');
      const errDescription = urlParams.get('error_description') || hashParams.get('error_description');

      if (errCode || errDescription) {
        console.error('[AuthCallback] Erro retornado pelo provedor OAuth:', { errCode, errDescription });
        let friendlyMsg = 'Não foi possível completar o login com o Google.';
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
          setErrorMessage(friendlyMsg);
          error('Erro na Autenticação', friendlyMsg);
          setTimeout(() => navigate('/login', { replace: true }), 4000);
        }
        return;
      }

      if (!isSupabaseConfigured() || !supabase) {
        const msg = 'Configuração do Supabase não encontrada no ambiente.';
        if (!isCancelled) {
          setErrorMessage(msg);
          error('Erro de Configuração', msg);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
        return;
      }

      try {
        setStatusMessage('Validando sessão com o Google...');

        // 2. Verificar se já temos sessão ativa (por exemplo, via detectSessionInUrl)
        let authUser: any = null;
        const code = urlParams.get('code');

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            authUser = sessionData.session.user;
          }
        } catch (sErr) {
          console.warn('[AuthCallback] getSession inicial aviso:', sErr);
        }

        // Se ainda não temos authUser e há código na URL, faz a troca PKCE
        if (!authUser && code) {
          try {
            const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr && exchangeData?.user) {
              authUser = exchangeData.user;
            } else if (exchangeErr) {
              console.warn('[AuthCallback] exchangeCodeForSession resultado:', exchangeErr.message);
            }
          } catch (exchangeErr) {
            console.warn('[AuthCallback] exchangeCodeForSession aviso:', exchangeErr);
          }
        }

        // 3. Fallback: Obter usuário verificado pelo getUser() se necessário
        if (!authUser) {
          try {
            const { data: userData, error: userErr } = await supabase.auth.getUser();
            if (!userErr && userData?.user) {
              authUser = userData.user;
            }
          } catch (e) {
            console.warn('[AuthCallback] getUser aviso:', e);
          }
        }

        // Função auxiliar de redirecionamento seguro
        const proceedToApp = (account: any) => {
          window.history.replaceState(null, '', window.location.pathname);
          localStorage.removeItem('orcacerto_budgets');
          localStorage.removeItem('orcacerto_clients');
          localStorage.removeItem('orcacerto_company');

          const hasCompletedOnboarding = 
            Boolean(account.onboarding_completed) ||
            Boolean(account.phone && account.phone.trim().length > 0) ||
            Boolean(account.company_name && account.company_name !== 'Minha Empresa') ||
            localStorage.getItem(`orcacerto_onboarded_${account.id}`) === 'true';

          if (!hasCompletedOnboarding) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        };

        if (authUser) {
          setStatusMessage('Sincronizando seu perfil...');
          const account = await syncSupabaseUser(authUser);

          if (!isCancelled) {
            success('Bem-vindo!', `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`);
            proceedToApp(account);
          }
        } else {
          // Aguardar evento do onAuthStateChange caso a sessão esteja sendo restaurada assincronamente
          let timeoutId: any = null;
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && currentSession?.user) {
              if (timeoutId) clearTimeout(timeoutId);
              authListener.subscription.unsubscribe();
              if (!isCancelled) {
                setStatusMessage('Sincronizando perfil...');
                const account = await syncSupabaseUser(currentSession.user);
                success('Bem-vindo!', `Olá, ${account.first_name || account.name}! Login realizado com sucesso.`);
                proceedToApp(account);
              }
            }
          });

          // Timeout de segurança de 6 segundos
          timeoutId = setTimeout(() => {
            if (!isCancelled) {
              authListener.subscription.unsubscribe();
              setErrorMessage('Tempo limite esgotado ao aguardar confirmação da sessão.');
              error('Falha de Autenticação', 'Não foi possível confirmar sua sessão. Tente novamente.');
              navigate('/login', { replace: true });
            }
          }, 6000);
        }
      } catch (err: any) {
        console.error('[AuthCallback] Exceção inesperada:', err);
        if (!isCancelled) {
          const msg = err?.message || 'Falha ao processar o retorno do login.';
          setErrorMessage(msg);
          error('Erro na Autenticação', msg);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
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
