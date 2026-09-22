import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { openCaktoCheckout } from '../../lib/cakto';
import { Check, Zap, Sparkles, ExternalLink, Loader2 } from 'lucide-react';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, closeUpgradeModal, monthlyUsage } = useData();
  const { user } = useAuth();

  const [redirectingPlan, setRedirectingPlan] = useState<'professional' | 'premium' | null>(null);

  const handleCheckout = (plan: 'professional' | 'premium') => {
    setRedirectingPlan(plan);
    openCaktoCheckout(plan, { id: user?.id, email: user?.email });
    setTimeout(() => {
      setRedirectingPlan(null);
    }, 2500);
  };

  return (
    <Modal
      isOpen={isUpgradeModalOpen}
      onClose={closeUpgradeModal}
      maxWidth="2xl"
    >
      <div className="space-y-6 pt-1 pb-2">
        {/* Header with Title & Text (Section 9) */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Limite do Plano Gratuito Atingido
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            Seu próximo orçamento pode fechar seu próximo negócio. 🚀
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Você já utilizou os 3 orçamentos gratuitos disponíveis este mês. Assine um plano para continuar criando e enviando seus orçamentos.
          </p>
        </div>

        {/* 3/3 Usage Progress Bar (Section 9) */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              3/3 orçamentos utilizados ({monthlyUsage.periodLabel})
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              100% utilizado
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500 w-full" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Seus orçamentos criados continuam salvos e acessíveis. Faça upgrade para desbloquear novas criações imediatamente.
          </p>
        </div>

        {/* Paid Plans Selection (Section 9) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
            Escolha seu plano
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            {/* PLANO PROFISSIONAL (MAIS ESCOLHIDO) */}
            <div className="relative rounded-2xl p-5 border-2 border-brand-500 bg-white dark:bg-slate-900 shadow-float flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                MAIS ESCOLHIDO
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Profissional
                </h4>
                <div className="flex items-baseline gap-1 mt-1 mb-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    R$ 29,90
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    /mês
                  </span>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <strong>Orçamentos ilimitados</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>PDF 100% personalizado com logo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Integração direta com WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Alertas de Follow-up inteligente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Melhorar descrição com IA ✨</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>3 modelos exclusivos</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => handleCheckout('professional')}
                disabled={redirectingPlan !== null}
                variant="primary"
                className="w-full justify-center text-xs font-bold py-3"
                icon={
                  redirectingPlan === 'professional' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )
                }
              >
                {redirectingPlan === 'professional'
                  ? 'Redirecionando para pagamento...'
                  : 'Assinar Profissional'}
              </Button>
            </div>

            {/* PLANO PREMIUM */}
            <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Premium
                </h4>
                <div className="flex items-baseline gap-1 mt-1 mb-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    R$ 59,90
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    /mês
                  </span>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <strong>Tudo do plano Profissional</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>IA avançada ilimitada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Relatórios de desempenho e conversão</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Assinatura digital avançada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Personalização avançada de cores e layout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Prioridade no suporte via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span>Estrutura preparada para automações futuras</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => handleCheckout('premium')}
                disabled={redirectingPlan !== null}
                variant="outline"
                className="w-full justify-center text-xs font-bold py-3"
                icon={
                  redirectingPlan === 'premium' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )
                }
              >
                {redirectingPlan === 'premium'
                  ? 'Redirecionando para pagamento...'
                  : 'Assinar Premium'}
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={closeUpgradeModal}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Continuar visualizando orçamentos existentes
          </button>
        </div>
      </div>
    </Modal>
  );
};
