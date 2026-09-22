import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { GoogleIcon } from '../components/common/GoogleIcon';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  Save,
  Camera,
  Check,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [document, setDocument] = useState(user?.document || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      setFirstName(user.first_name || (user.name ? user.name.split(' ')[0] : ''));
      setLastName(user.last_name || (user.name?.includes(' ') ? user.name.substring(user.name.indexOf(' ') + 1) : ''));
      setPhone(user.phone || '');
      setDocument(user.document || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    const parts = val.trim().split(' ');
    setFirstName(parts[0] || '');
    setLastName(parts.length > 1 ? parts.slice(1).join(' ') : '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        name: fullName,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone,
        document,
        avatar_url: avatarUrl,
      });
      success('Perfil atualizado com sucesso!', 'Suas informações e preferências foram salvas.');
    } catch (err: any) {
      error('Erro ao atualizar perfil', err?.message || 'Tente novamente mais tarde.');
    } finally {
      setSaving(false);
    }
  };

  const isGoogle = user?.provider === 'google';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Profile Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Display */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-brand-50 dark:bg-brand-950/60 border-2 border-brand-500/30 flex items-center justify-center shadow-card text-brand-700 dark:text-brand-300 text-3xl font-black">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Foto de Perfil'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span>{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-1.5 rounded-xl shadow-sm">
            {isGoogle ? <GoogleIcon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
        </div>

        {/* User Quick Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {fullName || 'Meu Perfil'}
            </h1>
            {isGoogle ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                <GoogleIcon className="w-3.5 h-3.5" />
                Google Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Conta por E-mail
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 uppercase">
              Plano {user?.plan || 'Gratuito'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Cadastrado em {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
          </p>
        </div>

        <div className="shrink-0 flex gap-2">
          <Link
            to="/configuracoes"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Empresa
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Personal Data */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Informações Pessoais
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Estes dados são associados ao seu perfil e aparecem na identificação do sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input
                label="Nome Completo"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="Ex: Carlos Eduardo Santos"
                required
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Primeiro Nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ex: Carlos"
              required
            />

            <Input
              label="Sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ex: Santos"
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                E-mail da Conta
              </label>
              <div className="relative">
                <Input
                  value={user?.email || ''}
                  disabled
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 cursor-not-allowed"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
                E-mail protegido e validado para prevenir duplicidade de contas.
              </span>
            </div>

            <Input
              label="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 98765-4321"
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Input
              label="CPF ou CNPJ do Titular"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="000.000.000-00"
              leftIcon={<CreditCard className="w-4 h-4" />}
            />

            <div>
              <Input
                label="URL da Foto de Perfil"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                leftIcon={<Camera className="w-4 h-4" />}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isGoogle
                  ? 'Foto sincronizada automaticamente com sua conta Google.'
                  : 'Cole uma URL de imagem para usar como avatar.'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Preferências do Sistema
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize sua experiência de uso na plataforma.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Tema Visual
            </label>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                  theme === 'light'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Tema Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Tema Escuro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            size="lg"
            className="font-bold shadow-card px-8"
            icon={<Save className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
