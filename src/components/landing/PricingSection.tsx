import React from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

interface PricingProps {
  onSelectPlan?: (plan: string) => void;
}

export const PricingSection: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const navigate = useNavigate();

  const handlePlanClick = (planName: string) => {
    if (onSelectPlan) {
      onSelectPlan(planName);
    } else {
      navigate('/cadastro');
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Ideal para quem está começando e quer testar a ferramenta.',
      features: [
        'Até 3 orçamentos por mês',
        'Geração de PDF profissional',
        'Histórico básico de orçamentos',
        'Envio via link do WhatsApp',
        '1 modelo de orçamento padrão',
      ],
      cta: 'Começar grátis',
      variant: 'outline' as const,
      popular: false,
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 'R$ 29,90',
      period: '/mês',
      description: 'O mais escolhido por MEIs, autônomos e prestadores de serviços.',
      features: [
        'Orçamentos ilimitados',
        'PDF 100% personalizado com sua Logo',
        'Integração direta com WhatsApp',
        'Cadastro completo de Clientes',
        'Alertas de Follow-up inteligente',
        'Melhorar descrição com IA ✨',
        '3 modelos exclusivos (Moderno, Elegante, Minimalista)',
      ],
      cta: 'Assinar Profissional',
      variant: 'primary' as const,
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 59,90',
      period: '/mês',
      description: 'Para pequenas empresas que buscam automação e relatórios completos.',
      features: [
        'Tudo do plano Profissional',
        'IA avançada ilimitada',
        'Relatórios de desempenho e conversão',
        'Assinatura digital avançada',
        'Personalização avançada de cores e layout',
        'Prioridade no suporte via WhatsApp',
        'Estrutura preparada para automação futura',
      ],
      cta: 'Assinar Premium',
      variant: 'outline' as const,
      popular: false,
    },
  ];

  return (
    <section id="planos" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Planos Acessíveis
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Preço justo que se paga no primeiro orçamento fechado
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Sem fidelidade ou contratos engessados. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 transition-all duration-200 flex flex-col justify-between ${
                plan.popular
                  ? 'bg-white dark:bg-slate-900 border-2 border-brand-500 shadow-float ring-4 ring-brand-500/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Mais Escolhido
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 min-h-[36px]">
                  {plan.description}
                </p>

                <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                    O que está incluso:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handlePlanClick(plan.name)}
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full justify-center py-3 text-sm font-semibold rounded-xl"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
