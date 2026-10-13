import React, { Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

const LandingPage = React.lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthenticatedRoutes = React.lazy(() => import('./AuthenticatedRoutes'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] py-12" aria-label="Carregando página">
    <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      {pathname === '/' ? <LandingPage /> : <AuthenticatedRoutes />}
    </Suspense>
  );
};

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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
