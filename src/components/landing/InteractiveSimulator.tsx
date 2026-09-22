import React, { useState } from 'react';
import { Send, CheckCircle2, Sparkles, ArrowRight, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { formatCurrency } from '../../lib/utils';
import { generateWhatsAppUrl } from '../../lib/whatsapp';

export const InteractiveSimulator: React.FC = () => {
  const [clientName, setClientName] = useState('João da Silva');
  const [serviceName, setServiceName] = useState('Instalação elétrica residencial');
  const [amount, setAmount] = useState(1850);
  const [copied, setCopied] = useState(false);

  const sampleBudgetNumber = '#000482';

  const handleSendWhatsApp = () => {
    const text = `Olá, ${clientName}! 👋\n\nPreparei seu orçamento pelo OrçaCerto:\n\n📄 Orçamento ${sampleBudgetNumber}\n💼 Serviço: ${serviceName}\n💰 Valor total: ${formatCurrency(amount)}\n\nFico à disposição para tirar qualquer dúvida e fecharmos!`;
    const url = generateWhatsAppUrl('11999999999', text);
    window.open(url, '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-float overflow-hidden transition-all">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <p className="text-sm font-semibold">
            Experimente agora em tempo real: <span className="text-emerald-400 font-normal">Cliente → Serviço → Valor → WhatsApp</span>
          </p>
        </div>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2.5 py-1 rounded-full border border-emerald-500/30">
          Simulador Interativo
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left: Input controls */}
        <div className="lg:col-span-5 p-6 sm:p-8 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              1. Nome do Cliente
            </span>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              2. Serviço ou Produto
            </span>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Ex: Instalação elétrica residencial"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              3. Valor (R$)
            </span>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">R$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                step="50"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick service presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">Exemplos rápidos:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '⚡ Elétrica Residencial', val: 1850, srv: 'Instalação elétrica residencial' },
                { label: '🎨 Pintura de Apartamento', val: 3200, srv: 'Pintura geral interna 2 demãos' },
                { label: '❄️ Instalação de Ar-Cond.', val: 650, srv: 'Instalação de Ar Split 12.000 BTUs' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setServiceName(p.srv);
                    setAmount(p.val);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Tudo é formatado automaticamente em layout profissional e pronto para WhatsApp.</span>
          </div>
        </div>

        {/* Right: Live Interactive Card */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  O
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">OrçaCerto</h4>
                  <p className="text-[11px] text-slate-400">Orçamento profissional gerado</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {sampleBudgetNumber}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1">Hoje</span>
              </div>
            </div>

            {/* Content summary */}
            <div className="my-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Cliente:</span>
                <p className="text-base font-bold text-slate-900 dark:text-white">{clientName || 'Cliente'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Serviço:</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {serviceName || 'Serviço prestado'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Quantidade: 1 • Mão de obra inclusa</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>

              {/* Total calculation banner */}
              <div className="flex items-center justify-between p-4 bg-emerald-500 text-white rounded-xl shadow-md">
                <div>
                  <span className="text-xs text-emerald-100 font-medium">VALOR TOTAL</span>
                  <p className="text-2xl font-black tracking-tight">{formatCurrency(amount)}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                    Aguardando aprovação
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique para testar o envio com mensagem formatada:
            </p>
            <Button
              onClick={handleSendWhatsApp}
              variant="primary"
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white border-none shadow-md"
              icon={<Send className="w-4 h-4" />}
            >
              Enviar pelo WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
