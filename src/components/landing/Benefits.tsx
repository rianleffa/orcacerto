import React from 'react';
import { FileCheck, MessageSquare, BarChart3, Users, History, Sparkles } from 'lucide-react';

export const Benefits: React.FC = () => {
  const benefits = [
    {
      title: 'Orçamentos profissionais',
      description: 'Crie documentos bonitos, claros e organizados que transmitem autoridade imediata ao seu cliente.',
      icon: <FileCheck className="w-6 h-6 text-brand-500" />,
    },
    {
      title: 'Envio pelo WhatsApp',
      description: 'Compartilhe o orçamento diretamente com seu cliente com mensagem formatada em 1 clique.',
      icon: <MessageSquare className="w-6 h-6 text-emerald-500" />,
    },
    {
      title: 'Acompanhamento',
      description: 'Saiba quais orçamentos foram enviados, aprovados ou recusados sem precisar de planilhas complexas.',
      icon: <BarChart3 className="w-6 h-6 text-sky-500" />,
    },
    {
      title: 'Clientes',
      description: 'Tenha o cadastro e contatos de todos os seus clientes organizados em um lugar só.',
      icon: <Users className="w-6 h-6 text-indigo-500" />,
    },
    {
      title: 'Histórico',
      description: 'Nunca perca um orçamento novamente. Consulte valores antigos e duplique orçamentos com rapidez.',
      icon: <History className="w-6 h-6 text-amber-500" />,
    },
    {
      title: 'Sua marca',
      description: 'Adicione sua logo, suas cores, chave PIX e personalize os modelos para valorizar seu serviço.',
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    },
  ];

  return (
    <section id="beneficios" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Vantagens Exclusivas
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Tudo para transformar uma ideia em negócio fechado.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Chega de orçamentos improvisados em bloco de notas ou mensagens soltas no WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-5">
                {b.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {b.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
