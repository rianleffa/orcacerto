import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Mail } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, normalizeEmail } from '../lib/authValidation';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!isValidEmail(email)) {
      setErrorMessage('Informe um endereço de e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(normalizeEmail(email));
      if (result.success) {
        setSent(true);
      } else {
        setErrorMessage(result.error || 'Não foi possível solicitar a recuperação. Tente novamente.');
      }
    } catch {
      setErrorMessage('Não foi possível solicitar a recuperação. Confira sua conexão e tente novamente.');
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
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recuperar senha</h1>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          Enviaremos um link seguro para o e-mail da sua conta.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float space-y-6">
          {errorMessage && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {sent ? (
            <div role="status" aria-live="polite" className="space-y-4 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-2">
                <h2 className="font-bold text-slate-900 dark:text-white">Verifique sua caixa de entrada</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Se houver uma conta associada a <span className="font-semibold break-all">{normalizeEmail(email)}</span>, enviaremos um link para redefinir a senha. Confira também o spam.
                </p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-400 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="E-mail da conta"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full min-h-12" icon={<Mail className="w-4 h-4" />}>
                Enviar link de recuperação
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400">
                <ArrowLeft className="w-4 h-4" /> Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
