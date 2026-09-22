import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PaymentCanceledPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-float p-8 text-center space-y-6 animate-fade-in">
        {/* Canceled Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-subtle">
          <XCircle className="w-9 h-9" />
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
            Checkout não concluído
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pagamento não concluído
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Seu pagamento não foi finalizado. Você pode tentar novamente quando quiser.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => navigate('/planos')}
            variant="primary"
            size="lg"
            className="w-full justify-center font-bold shadow-card"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Voltar para planos
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="md"
            className="w-full justify-center text-xs font-semibold"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Ir para o Painel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceledPage;
