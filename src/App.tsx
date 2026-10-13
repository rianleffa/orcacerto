import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-loaded pages for optimal bundle performance
const LandingPage = React.lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] py-12">
    <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

export function App() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (
        (search.includes('code=') || hash.includes('access_token=')) &&
        !pathname.includes('/auth/callback')
      ) {
        window.location.replace(`/auth/callback${search}${hash}`);
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public / Landing Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/cadastro" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
                  <Route path="/pagamento/cancelado" element={<PaymentCanceledPage />} />

                  {/* Protected Routes (Require Authentication) */}
                  <Route element={<ProtectedRoute />}>
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

                      {/* Navigation Route Aliases */}
                      <Route path="/tarefas" element={<Navigate to="/orcamentos" replace />} />
                      <Route path="/projetos" element={<Navigate to="/orcamentos" replace />} />
                      <Route path="/agenda" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/financeiro" element={<Navigate to="/relatorios" replace />} />
                      <Route path="/documentos" element={<Navigate to="/orcamentos" replace />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
