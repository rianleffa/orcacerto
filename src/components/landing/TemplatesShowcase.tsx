import React, { useState } from 'react';
import { ModernTemplate } from '../templates/ModernTemplate';
import { ElegantTemplate } from '../templates/ElegantTemplate';
import { MinimalistTemplate } from '../templates/MinimalistTemplate';
import { initialBudgets, initialCompany } from '../../lib/mockData';
import { TemplateId } from '../../types/database';
import { Layout, Check, Sparkles } from 'lucide-react';

export const TemplatesShowcase: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('modern');

  const templates: { id: TemplateId; name: string; tag: string; desc: string }[] = [
    {
      id: 'modern',
      name: 'Modelo Moderno',
      tag: 'Mais popular',
      desc: 'Visual contemporâneo, cores vivas e organização perfeita para serviços técnicos e residenciais.',
    },
    {
      id: 'elegant',
      name: 'Modelo Elegante',
      tag: 'Sofisticado',
      desc: 'Tipografia refinada, estilo clássico com moldura e acabamento de alto padrão para consultorias e obras finas.',
    },
    {
      id: 'minimalist',
      name: 'Modelo Minimalista',
      tag: 'Direto ao ponto',
      desc: 'Design limpo, tipografia monoespelhada, foco total na clareza dos itens e valores.',
    },
  ];

  const sampleBudget = initialBudgets[0];

  return (
    <section id="modelos" className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Design de Alto Nível
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Modelos profissionais prontos para usar
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Escolha o modelo que melhor representa a identidade do seu negócio e impressione seus clientes.
          </p>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border ${
                activeTemplate === t.id
                  ? 'bg-brand-500 text-white border-brand-600 shadow-md scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>{t.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                  activeTemplate === t.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Live Preview of active template */}
        <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float max-w-4xl mx-auto overflow-hidden">
          <div className="transform scale-[0.98] sm:scale-100 origin-top transition-all">
            {activeTemplate === 'modern' && (
              <ModernTemplate budget={sampleBudget} company={initialCompany} />
            )}
            {activeTemplate === 'elegant' && (
              <ElegantTemplate budget={sampleBudget} company={initialCompany} />
            )}
            {activeTemplate === 'minimalist' && (
              <MinimalistTemplate budget={sampleBudget} company={initialCompany} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
