import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Image, Phone, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { company, updateCompany } = useData();
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState(company.name || user?.company_name || 'Minha Empresa');
  const [phone, setPhone] = useState(company.phone || user?.phone || '');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color || '#10b981');
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');

  const colorOptions = [
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Azul Real', hex: '#2563eb' },
    { label: 'Grafite', hex: '#0f172a' },
    { label: 'Roxo Moderno', hex: '#7c3aed' },
    { label: 'Laranja Quente', hex: '#ea580c' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      updateCompany({
        name: companyName,
        phone,
        whatsapp: phone.replace(/\D/g, ''),
        primary_color: primaryColor,
        logo_url: logoUrl,
      });
      updateUser({
        company_name: companyName,
        phone,
      });
      success('Empresa configurada!', 'Tudo pronto para criar seu primeiro orçamento.');
      setStep(4); // Final screen
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Step indicator */}
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Configuração Inicial {step <= 3 ? `• Etapa ${step} de 3` : '• Concluído'}
          </span>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= i ? 'w-10 bg-brand-500' : 'w-4 bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Vamos configurar seu OrçaCerto.
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Qual é o nome que deve aparecer no topo de todos os seus orçamentos?
                </p>
              </div>

              <Input
                label="Nome da sua Empresa ou Serviço"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: EletroVolt Soluções Elétricas"
                required
                autoFocus
              />

              <div className="pt-4 flex justify-end">
                <Button onClick={handleNext} variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Identidade Visual & Cor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Escolha a cor principal dos seus orçamentos e insira o link da logo (opcional).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Cor de destaque dos orçamentos:
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPrimaryColor(c.hex)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        primaryColor === c.hex
                          ? 'border-slate-900 dark:border-white ring-2 ring-brand-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="URL da Logomarca (opcional)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-logo.png"
                helper="Se não tiver agora, geramos uma insígnia profissional com a inicial da sua empresa."
              />

              <div className="pt-4 flex justify-between">
                <Button onClick={() => setStep(1)} variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                  Voltar
                </Button>
                <Button onClick={handleNext} variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Telefone & WhatsApp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Seu cliente verá este número para retorno e confirmação de propostas.
                </p>
              </div>

              <Input
                label="Telefone / WhatsApp Comercial"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                required
                autoFocus
              />

              <div className="pt-4 flex justify-between">
                <Button onClick={() => setStep(2)} variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                  Voltar
                </Button>
                <Button onClick={handleNext} variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                  Finalizar Configuração
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 animate-fade-in py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Tudo pronto!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Sua conta está configurada com sucesso.<br />
                  <strong>Vamos criar seu primeiro orçamento?</strong>
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/orcamentos/novo')}
                  variant="primary"
                  size="lg"
                  className="w-full justify-center font-bold"
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  Criar primeiro orçamento
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs text-slate-500"
                >
                  Ir para o painel principal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
