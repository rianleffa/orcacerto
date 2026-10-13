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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-xl focus:shadow-float focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>
      <LandingNavbar />

      <main id="main-content" tabIndex={-1} role="main" className="flex-1 focus:outline-none">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-100/60 via-transparent to-transparent dark:from-brand-950/20 pointer-events-none blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span aria-hidden="true" className="flex h-2 w-2 rounded-full bg-emerald-700" />
              <span>O gerador de orçamentos mais rápido do Brasil</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-brand-700 dark:text-brand-300 font-bold">100% Grátis para começar</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Faça seu orçamento.<br />
              <span className="bg-gradient-to-r from-brand-700 via-emerald-700 to-teal-700 bg-clip-text text-transparent dark:from-brand-300 dark:via-emerald-300 dark:to-teal-300">
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
                <Play className="w-4 h-4 text-emerald-700 fill-current" />
                Ver como funciona
              </a>
            </div>

            {/* Trust bullet badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>PDF profissional em 1 clique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Envio direto no WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
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
    </main>

    {/* Footer & Final CTA */}
    <LandingFooter />
    </div>
  );
};
