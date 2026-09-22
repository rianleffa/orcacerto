import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, User, Mail, Lock, Building, Phone, CreditCard } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const { updateCompany } = useData();
  const { success, error, info } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !companyName || !phone) {
      error('Campos obrigatórios', 'Por favor preencha nome, e-mail, empresa e telefone.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name,
        email,
        password,
        companyName,
        phone,
        document,
      });

      // Update initial company state
      updateCompany({
        name: companyName,
        email,
        phone,
        whatsapp: phone.replace(/\D/g, ''),
        document,
      });

      success('Conta criada com sucesso!', 'Vamos configurar os dados da sua empresa.');
      navigate('/onboarding');
    } catch {
      error('Erro ao cadastrar', 'Tente novamente com outro e-mail.');
    } finally {
      setLoading(false);
    }
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
          Crie sua conta grátis
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Comece agora mesmo a emitir orçamentos profissionais.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seu Nome Completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                required
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Nome da Sua Empresa / Marca"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Silva Reformas"
                required
                leftIcon={<Building className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                label="Telefone / WhatsApp"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                required
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="CPF ou CNPJ (Opcional)"
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="000.000.000-00"
                leftIcon={<CreditCard className="w-4 h-4" />}
              />

              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={googleLoading}
                className="w-full py-3 text-sm font-bold shadow-md"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Cadastrar e Configurar
              </Button>
            </div>
          </form>

          {/* Divider */}
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
            onClick={async () => {
              setGoogleLoading(true);
              try {
                info('Conectando ao Google...', 'Aguarde o redirecionamento seguro.');
                const res = await loginWithGoogle();
                if (res?.error) {
                  error('Erro no Google', res.error);
                  setGoogleLoading(false);
                } else {
                  success('Bem-vindo!', 'Cadastro com Google realizado.');
                  navigate('/dashboard');
                }
              } catch (err: any) {
                error('Erro no Google', err?.message || 'Falha ao conectar com o Google.');
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>{googleLoading ? 'Conectando ao Google...' : 'Cadastrar com Google'}</span>
          </button>


          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
