import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-float p-8 text-center space-y-6 animate-fade-in">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-subtle">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Processamento Seguro Cakto
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pagamento realizado! 🎉
          </h1>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Estamos verificando sua assinatura.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Assim que o pagamento for confirmado, seu plano será atualizado.
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3 text-left">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <span>
            A ativação costuma ocorrer em poucos minutos para PIX e Cartão de Crédito.
          </span>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="primary"
          size="lg"
          className="w-full justify-center font-bold shadow-card"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Voltar para o OrçaCerto
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
