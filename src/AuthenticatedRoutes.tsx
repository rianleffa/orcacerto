import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { FREE_ACCESS_ENABLED } from './lib/accessMode';

const LoginPage = React.lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BudgetsPage = React.lazy(() => import('./pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));
const CreateBudgetPage = React.lazy(() => import('./pages/CreateBudgetPage').then((m) => ({ default: m.CreateBudgetPage })));
const BudgetDetailPage = React.lazy(() => import('./pages/BudgetDetailPage').then((m) => ({ default: m.BudgetDetailPage })));
const ClientsPage = React.lazy(() => import('./pages/ClientsPage').then((m) => ({ default: m.ClientsPage })));
const ClientDetailPage = React.lazy(() => import('./pages/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const PlansPage = React.lazy(() => import('./pages/PlansPage').then((m) => ({ default: m.PlansPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PaymentSuccessPage = React.lazy(() => import('./pages/PaymentSuccessPage').then((m) => ({ default: m.PaymentSuccessPage })));
const PaymentCanceledPage = React.lazy(() => import('./pages/PaymentCanceledPage').then((m) => ({ default: m.PaymentCanceledPage })));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] py-12" aria-label="Carregando página">
    <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

export const AuthenticatedRoutes: React.FC = () => (
  <AuthProvider>
    <DataProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/pagamento/sucesso" element={FREE_ACCESS_ENABLED ? <Navigate to="/dashboard" replace /> : <PaymentSuccessPage />} />
            <Route path="/pagamento/cancelado" element={FREE_ACCESS_ENABLED ? <Navigate to="/dashboard" replace /> : <PaymentCanceledPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/orcamentos" element={<BudgetsPage />} />
                <Route path="/orcamentos/novo" element={<CreateBudgetPage />} />
                <Route path="/orcamentos/editar/:id" element={<CreateBudgetPage />} />
                <Route path="/orcamentos/:id" element={<BudgetDetailPage />} />
                <Route path="/clientes" element={<ClientsPage />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/planos" element={<PlansPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />

                <Route path="/tarefas" element={<Navigate to="/orcamentos" replace />} />
                <Route path="/projetos" element={<Navigate to="/orcamentos" replace />} />
                <Route path="/agenda" element={<Navigate to="/dashboard" replace />} />
                <Route path="/financeiro" element={<Navigate to="/relatorios" replace />} />
                <Route path="/documentos" element={<Navigate to="/orcamentos" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </DataProvider>
  </AuthProvider>
);

export default AuthenticatedRoutes;
