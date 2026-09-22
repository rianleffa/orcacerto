import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CreateBudgetPage } from './pages/CreateBudgetPage';
import { BudgetDetailPage } from './pages/BudgetDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { PlansPage } from './pages/PlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCanceledPage } from './pages/PaymentCanceledPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public / Landing Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
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
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
