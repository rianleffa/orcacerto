import React from 'react';
import { PricingSection } from '../components/landing/PricingSection';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const { monthlyUsage, openUpgradeModal } = useData();

  const isFree = !user || user.plan === 'free';
  const planLabel = isFree
    ? 'Gratuito'
    : user.plan === 'premium'
    ? 'Premium'
    : 'Profissional';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Current plan banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Assinatura & Cobrança
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Planos OrçaCerto
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Seu plano atual é o <strong className="text-slate-900 dark:text-white uppercase font-bold">Plano {planLabel}</strong>.
          </p>

          {isFree ? (
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{monthlyUsage.count} de 3 orçamentos utilizados este mês</span>
                <span className={monthlyUsage.isLimitReached ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                  {monthlyUsage.isLimitReached ? 'Limite atingido' : `${monthlyUsage.remaining} restantes`}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    monthlyUsage.isLimitReached ? 'bg-rose-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${Math.min(100, (monthlyUsage.count / 3) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Orçamentos ilimitados liberados</span>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col sm:items-end gap-2">
          {isFree ? (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <Zap className="w-4 h-4 text-amber-500 fill-current" />
                <span>Plano Básico Gratuito</span>
              </div>
              <Button
                onClick={openUpgradeModal}
                variant="primary"
                size="sm"
                className="font-bold text-xs shadow-sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Fazer upgrade
              </Button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Assinatura Ativa</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <PricingSection />
      </div>
    </div>
  );
};

export default PlansPage;
