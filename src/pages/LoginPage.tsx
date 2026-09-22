import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, ArrowRight, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginDemo, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('carlos@eletrovolt.com.br');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard or previous route
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Check URL hash/params for Supabase OAuth return errors
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);

    const authError = params.get('error_description') || params.get('error');
    if (authError) {
      let friendlyMsg = 'Não foi possível completar o login com o Google.';
      if (authError.includes('access_denied') || authError.includes('cancelled') || authError.includes('canceled')) {
        friendlyMsg = 'O login com Google foi cancelado.';
      } else if (authError.includes('expired')) {
        friendlyMsg = 'A sessão do login expirou. Por favor, tente novamente.';
      }
      setErrorMessage(friendlyMsg);
      error('Autenticação com Google', friendlyMsg);
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email) {
      error('Preencha o e-mail');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        success('Bem-vindo de volta!', 'Login realizado com sucesso.');
        navigate('/dashboard');
      } else {
        setErrorMessage('Credenciais incorretas. Verifique seu e-mail e senha.');
        error('Falha no login', 'Verifique suas credenciais.');
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
    try {
      info('Conectando ao Google...', 'Aguarde o redirecionamento seguro.');
      const res = await loginWithGoogle();
      if (res?.error) {
        setErrorMessage(res.error);
        error('Erro ao conectar com Google', res.error);
        setGoogleLoading(false);
      } else {
        // In local demo fallback mode or when redirected
        success('Login com Google concluído!', 'Redirecionando para o painel...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Falha ao conectar com serviço Google.';
      setErrorMessage(msg);
      error('Erro no Login Google', msg);
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    success('Acesso Rápido de Demonstração', 'Entrando como Carlos Eduardo (EletroVolt).');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xl shadow-card group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Orça<span className="text-brand-500">Certo</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Acesse sua conta
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
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

          {/* Form: Email & Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span>Lembrar de mim</span>
              </label>
              <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={googleLoading}
              className="w-full py-3 text-sm font-bold shadow-sm"
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
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>{googleLoading ? 'Iniciando com Google...' : 'Continuar com Google'}</span>
          </button>

          {/* 1-Click Quick Demo Option */}
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Modo Demonstração</span>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Entrar com 1 clique →
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            Ainda não tem conta?{' '}
            <Link
              to="/cadastro"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
