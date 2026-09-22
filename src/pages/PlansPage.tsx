import React, { useState } from 'react';
import { PricingSection } from '../components/landing/PricingSection';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { CheckCircle2, CreditCard, Sparkles, ShieldCheck } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    setSelectedPlanForCheckout(planName);
  };

  const handleSimulateSubscription = () => {
    const planType = selectedPlanForCheckout?.toLowerCase().includes('premium') ? 'premium' : 'pro';
    updateUser({ plan: planType as any });
    setSelectedPlanForCheckout(null);
    success(`Plano ${selectedPlanForCheckout} ativado! 🎉`, 'Assinatura atualizada com sucesso no ambiente de demonstração.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Current plan banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Assinatura & Cobrança
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Planos OrçaCerto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Seu plano atual é o <strong className="text-slate-900 dark:text-white uppercase font-bold">Plano {user?.plan || 'PRO'}</strong>.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Assinatura Ativa</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <PricingSection onSelectPlan={handleSelectPlan} />
      </div>

      {/* Checkout Preview Modal */}
      <Modal
        isOpen={Boolean(selectedPlanForCheckout)}
        onClose={() => setSelectedPlanForCheckout(null)}
        title={`Assinar Plano ${selectedPlanForCheckout}`}
        description="Ambiente de demonstração preparado para integração futura com Stripe ou Mercado Pago."
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Upgrade Instantâneo
            </p>
            <p>
              Todos os recursos do plano {selectedPlanForCheckout} serão liberados imediatamente para sua conta.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-850">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Forma de pagamento:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <CreditCard className="w-4 h-4" /> Cartão / PIX Recorrente
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-750">
              <span className="text-slate-500">Cobrança:</span>
              <span className="font-bold text-slate-900 dark:text-white">Mensal, sem fidelidade</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPlanForCheckout(null)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSimulateSubscription}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirmar Assinatura
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
