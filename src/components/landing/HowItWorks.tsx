import React from 'react';
import { PenTool, Palette, Send, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Crie',
      subtitle: 'Preencha os dados do cliente e do serviço.',
      description: 'Em menos de 1 minuto, selecione o cliente ou adicione um novo, insira os serviços com valores e use IA para refinar a descrição.',
      icon: <PenTool className="w-6 h-6 text-brand-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    },
    {
      number: '02',
      title: 'Personalize',
      subtitle: 'Escolha o modelo, adicione sua logo e condições.',
      description: 'Escolha entre 3 modelos profissionais (Moderno, Elegante ou Minimalista), configure suas cores, prazo, garantia e chave PIX.',
      icon: <Palette className="w-6 h-6 text-brand-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    },
    {
      number: '03',
      title: 'Envie',
      subtitle: 'Gere o orçamento e envie diretamente pelo WhatsApp.',
      description: 'Gere um PDF impecável com 1 clique e compartilhe por WhatsApp com uma mensagem profissional já pronta e personalizada.',
      icon: <Send className="w-6 h-6 text-brand-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Simplicidade Extrema
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Como funciona o OrçaCerto?
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Criado para quem não tem tempo a perder com sistemas complicados. Três passos para seu negócio decolar:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative p-8 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 hover:shadow-card transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-slate-200 dark:text-slate-700 font-mono">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <h4 className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">
                  {step.subtitle}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
                <span>Rápido e sem burocracia</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
