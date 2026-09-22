import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('carlos@eletrovolt.com.br');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Preencha o e-mail');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      success('Bem-vindo de volta!', 'Login realizado com sucesso.');
      navigate('/dashboard');
    } catch {
      error('Falha no login', 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
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
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float">
          {/* 1-Click Quick Demo Button */}
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Modo Demonstração Instantâneo</span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
              Deseja testar sem digitar? Acesse agora com 1 clique:
            </p>
            <Button
              type="button"
              onClick={handleDemoLogin}
              variant="primary"
              size="sm"
              className="w-full mt-3 font-semibold"
            >
              Entrar direto na Demonstração
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                Ou acesse com e-mail
              </span>
            </div>
          </div>

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
              className="w-full py-3 mt-2 text-sm font-bold"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar no OrçaCerto
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
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
