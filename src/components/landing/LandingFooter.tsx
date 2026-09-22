import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Heart } from 'lucide-react';
import { Button } from '../common/Button';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden">
      {/* Final CTA Banner */}
      <div className="border-b border-slate-800 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            Sem cartão de crédito necessário
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Seu próximo orçamento pode ser mais profissional.
          </h2>
          <p className="text-lg text-slate-300 font-medium">
            <span className="text-emerald-400">Crie.</span> <span className="text-white">Envie.</span> <span className="text-emerald-400">Acompanhe.</span> <span className="text-white font-bold">Feche.</span>
          </p>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/cadastro')}
              size="lg"
              variant="primary"
              className="px-8 py-4 text-base font-bold shadow-float hover:scale-105 transition-transform"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Começar agora — é grátis
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Orça<span className="text-brand-500">Certo</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              "Faça seu orçamento. Feche seu negócio."
            </p>
            <p className="text-[11px] text-slate-500">
              A ferramenta de orçamentos mais rápida e moderna do Brasil para MEIs, autônomos e prestadores de serviços.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Produto
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#beneficios" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#modelos" className="hover:text-white transition-colors">Modelos de PDF</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos e Preços</a></li>
            </ul>
          </div>

          {/* Institutional links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Institucional
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre o OrçaCerto</Link></li>
              <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade & LGPD</Link></li>
              <li><a href="mailto:suporte@orcacerto.com.br" className="hover:text-white transition-colors">Contato e Suporte</a></li>
            </ul>
          </div>

          {/* Security & Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Segurança & Confiabilidade
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seus dados protegidos com criptografia de ponta a ponta e servidores em nuvem de alta disponibilidade.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md">
              <span>● Sistema 100% Operacional</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} OrçaCerto. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com foco no empreendedor brasileiro
          </p>
        </div>
      </div>
    </footer>
  );
};
