import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  FileText,
  Home,
  FileCheck2,
  Users,
  BarChart2,
  Settings,
  Plus,
  Bell,
  Sun,
  Moon,
  LogOut,
  Building,
  User,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { formatDate } from '../../lib/utils';
import { UpgradeModal } from '../subscription/UpgradeModal';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, company, monthlyUsage, openUpgradeModal } = useData();
  const { theme, toggleTheme } = useTheme();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { label: 'Início', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Orçamentos', path: '/orcamentos', icon: <FileCheck2 className="w-4 h-4" /> },
    { label: 'Clientes', path: '/clientes', icon: <Users className="w-4 h-4" /> },
    { label: 'Relatórios', path: '/relatorios', icon: <BarChart2 className="w-4 h-4" /> },
    { label: 'Configurações', path: '/configuracoes', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const handleCreateBudgetClick = () => {
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
    } else {
      navigate('/orcamentos/novo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-20 md:pb-0">
      {/* Desktop Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Orça<span className="text-brand-500">Certo</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Primary Action Button */}
            <Button
              onClick={handleCreateBudgetClick}
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex font-bold shadow-sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Novo orçamento
            </Button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-float border border-slate-200 dark:border-slate-800 p-4 z-50 animate-slide-up">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notificações</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Marcar lidas
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Nenhuma notificação recente.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setNotifOpen(false);
                            }
                          }}
                          className={`py-2.5 px-2 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                            !n.is_read ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {formatDate(n.created_at, 'relative')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu do usuário"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-300 dark:border-brand-800 shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || 'Foto do usuário'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px]">
                    {company.name || user?.email}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-float border border-slate-200 dark:border-slate-800 p-2 z-50 animate-slide-up">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold uppercase">
                      Plano {user?.plan || 'Gratuito'}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/perfil"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Meu Perfil
                    </Link>
                    <Link
                      to="/configuracoes"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Configurações
                    </Link>
                    <Link
                      to="/planos"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Building className="w-4 h-4 text-slate-400" />
                      Planos e Assinatura
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (Section 30) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            location.pathname === '/dashboard' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </Link>

        <Link
          to="/orcamentos"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            location.pathname.startsWith('/orcamentos') && location.pathname !== '/orcamentos/novo'
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400'
          }`}
        >
          <FileCheck2 className="w-5 h-5" />
          <span>Orçamentos</span>
        </Link>

        {/* Central highlighted button (+) */}
        <button
          onClick={handleCreateBudgetClick}
          className="w-12 h-12 -mt-5 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-white dark:border-slate-900"
          title="Criar novo orçamento"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <Link
          to="/clientes"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            location.pathname.startsWith('/clientes') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Clientes</span>
        </Link>

        <Link
          to="/configuracoes"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            location.pathname.startsWith('/configuracoes') ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Perfil</span>
        </Link>
      </nav>

      {/* Global Upgrade Modal when 3/3 limit is reached */}
      <UpgradeModal />
    </div>
  );
};
