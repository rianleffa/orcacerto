import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { InteractiveSimulator } from '../components/landing/InteractiveSimulator';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Benefits } from '../components/landing/Benefits';
import { TemplatesShowcase } from '../components/landing/TemplatesShowcase';
import { PricingSection } from '../components/landing/PricingSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { Button } from '../components/common/Button';
import { ArrowRight, Play, CheckCircle2, Shield, Zap } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-100/60 via-transparent to-transparent dark:from-brand-950/20 pointer-events-none blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>O gerador de orçamentos mais rápido do Brasil</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">100% Grátis para começar</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Faça seu orçamento.<br />
              <span className="bg-gradient-to-r from-brand-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Feche seu negócio.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Crie orçamentos profissionais em poucos minutos, envie pelo WhatsApp e acompanhe tudo em um só lugar.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={() => navigate('/orcamentos/novo')}
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold shadow-card hover:scale-105 transition-transform"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Criar meu orçamento
              </Button>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-subtle transition-all gap-2"
              >
                <Play className="w-4 h-4 text-emerald-500 fill-current" />
                Ver como funciona
              </a>
            </div>

            {/* Trust bullet badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>PDF profissional em 1 clique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>Envio direto no WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>Sem complicação de ERP</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Demonstration */}
          <div className="mt-14 sm:mt-18">
            <InteractiveSimulator />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Benefits Section */}
      <Benefits />

      {/* Templates Showcase */}
      <TemplatesShowcase />

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer & Final CTA */}
      <LandingFooter />
    </div>
  );
};
