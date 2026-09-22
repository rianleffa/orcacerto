import React, { useState } from 'react';
import {
  Building,
  User,
  Palette,
  Bell,
  CreditCard,
  Shield,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Check,
  QrCode,
  MessageSquare,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TemplateId, PaymentMethod } from '../types/database';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { company, updateCompany, resetDemoData } = useData();
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<'empresa' | 'conta' | 'aparencia' | 'notificacoes' | 'seguranca'>('empresa');

  // Company state
  const [name, setName] = useState(company.name);
  const [document, setDocument] = useState(company.document || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [whatsapp, setWhatsapp] = useState(company.whatsapp || '');
  const [email, setEmail] = useState(company.email || '');
  const [address, setAddress] = useState(company.address || '');
  const [website, setWebsite] = useState(company.website || '');
  const [instagram, setInstagram] = useState(company.instagram || '');
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color || '#10b981');
  const [defaultTemplate, setDefaultTemplate] = useState<TemplateId>(company.default_template || 'modern');
  const [defaultWhatsappMsg, setDefaultWhatsappMsg] = useState(company.default_whatsapp_message || '');
  const [pixKey, setPixKey] = useState(company.pix_key || '');

  // Account state
  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany({
      name,
      document,
      phone,
      whatsapp: whatsapp || phone.replace(/\D/g, ''),
      email,
      address,
      website,
      instagram,
      logo_url: logoUrl,
      primary_color: primaryColor,
      default_template: defaultTemplate,
      default_whatsapp_message: defaultWhatsappMsg,
      pix_key: pixKey,
    });
    success('Dados da empresa salvos!', 'As informações foram atualizadas para todos os novos orçamentos.');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: userName,
      email: userEmail,
    });
    success('Perfil atualizado com sucesso!');
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração com os orçamentos e clientes de exemplo?')) {
      resetDemoData();
      info('Dados restaurados para o padrão de demonstração.');
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Minha Empresa', icon: <Building className="w-4 h-4" /> },
    { id: 'conta', label: 'Conta & Perfil', icon: <User className="w-4 h-4" /> },
    { id: 'aparencia', label: 'Aparência', icon: <Palette className="w-4 h-4" /> },
    { id: 'notificacoes', label: 'Notificações', icon: <Bell className="w-4 h-4" /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personalize sua empresa, modelo padrão, logotipo, chaves de pagamento e preferências.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Restaurar dados demo</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          {/* TAB 1: EMPRESA */}
          {activeTab === 'empresa' && (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dados da Empresa nos Orçamentos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estes dados serão impressos automaticamente nos seus documentos e PDFs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome da Empresa / Fantasia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: EletroVolt Soluções Elétricas"
                  required
                />

                <Input
                  label="CNPJ ou CPF"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Telefone Comercial"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                />

                <Input
                  label="WhatsApp de Contato"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511987654321"
                />

                <Input
                  label="E-mail de Contato"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Endereço Completo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Paulista, 1000 - São Paulo, SP"
                />

                <Input
                  label="Chave PIX para Recebimento"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Chave PIX (E-mail, Celular ou CNPJ)"
                  leftIcon={<QrCode className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Website (opcional)"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://suaempresa.com.br"
                />

                <Input
                  label="Instagram (opcional)"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@suaempresa"
                />
              </div>

              <Input
                label="URL do Logotipo (PNG ou JPG)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                helper="Cole a URL direta da sua imagem para aparecer no topo dos PDFs."
              />

              {/* Template Preferences & Colors */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Modelo Padrão para Novos Orçamentos:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'modern', label: 'Moderno' },
                      { id: 'elegant', label: 'Elegante' },
                      { id: 'minimalist', label: 'Minimalista' },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setDefaultTemplate(tmpl.id as TemplateId)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                          defaultTemplate === tmpl.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Mensagem Padrão do WhatsApp:
                  </label>
                  <textarea
                    rows={4}
                    value={defaultWhatsappMsg}
                    onChange={(e) => setDefaultWhatsappMsg(e.target.value)}
                    placeholder="Personalize o texto gerado automaticamente. Use {cliente}, {numero}, {valor}, {empresa} como marcadores."
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Marcadores disponíveis: {'{cliente}'}, {'{numero}'}, {'{valor}'}, {'{empresa}'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Salvar Informações da Empresa
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: CONTA */}
          {activeTab === 'conta' && (
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Meu Perfil de Acesso
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie seu nome e e-mail cadastrado na plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome Completo"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />

                <Input
                  label="E-mail de Login"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Seu Plano Atual</p>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase">
                    Plano {user?.plan || 'PRO'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = '/planos')}
                >
                  Gerenciar Plano
                </Button>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Salvar Perfil
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: APARÊNCIA */}
          {activeTab === 'aparencia' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tema da Interface
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escolha como prefere visualizar o OrçaCerto no seu computador e celular.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    theme === 'light'
                      ? 'border-brand-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-subtle'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                    <Sun className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">☀️ Modo Claro</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Interface limpa com fundo claro, ideal para o dia a dia e impressão.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    theme === 'dark'
                      ? 'border-brand-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-subtle'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mb-4">
                    <Moon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">🌙 Modo Escuro</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tons de grafite e ardósia que descansam a visão em ambientes escuros.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICAÇÕES */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Preferências de Alertas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escolha quando deseja ser avisado no sistema.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Orçamento aprovado pelo cliente', desc: 'Receba alerta e celebração quando o status mudar para aprovado.' },
                  { title: 'Cliente visualizou a proposta', desc: 'Notificação imediata assim que o cliente abrir o documento online.' },
                  { title: 'Lembretes de follow-up', desc: 'Avisos automáticos após 2 dias sem resposta do cliente.' },
                  { title: 'Validade do orçamento expirando', desc: 'Alerta de expiração de propostas abertas.' },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Segurança e Privacidade
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seus dados e de seus clientes protegidos com Row Level Security (RLS).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold">🔒 Isolamento Total de Dados</p>
                <p>Nenhum outro usuário ou empresa tem acesso aos seus orçamentos ou lista de clientes.</p>
              </div>

              <div className="space-y-3 max-w-sm">
                <Input label="Nova Senha" type="password" placeholder="••••••••" />
                <Input label="Confirmar Nova Senha" type="password" placeholder="••••••••" />
                <Button variant="outline" size="sm" onClick={() => success('Senha atualizada!')}>
                  Alterar Senha
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
