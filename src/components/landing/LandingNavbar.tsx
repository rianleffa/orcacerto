import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const LandingNavbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3.5">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none block">
              Orça<span className="text-brand-500">Certo</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Orçamentos Rápidos
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#como-funciona" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Como funciona
          </a>
          <a href="#beneficios" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Benefícios
          </a>
          <a href="#modelos" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Modelos
          </a>
          <a href="#planos" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            Planos
          </a>
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Ir para o App
            </Button>
          ) : (
            <>
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                size="sm"
              >
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/cadastro')}
                variant="primary"
                size="sm"
              >
                Criar conta grátis
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drop menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <a
            href="#como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Como funciona
          </a>
          <a
            href="#beneficios"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Benefícios
          </a>
          <a
            href="#modelos"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Modelos
          </a>
          <a
            href="#planos"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Planos
          </a>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              variant="outline"
              className="w-full justify-center"
            >
              Entrar
            </Button>
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/cadastro');
              }}
              variant="primary"
              className="w-full justify-center"
            >
              Criar conta grátis
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
