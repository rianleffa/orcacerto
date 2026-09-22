import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Budget, Client, CompanyProfile, AppNotification, BudgetStatus } from '../types/database';
import { initialBudgets, initialClients, initialCompany, initialNotifications } from '../lib/mockData';
import { generateBudgetNumber } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface MonthlyUsageInfo {
  count: number;
  limit: number;
  remaining: number;
  isFree: boolean;
  isLimitReached: boolean;
  isLastBudget: boolean;
  periodLabel: string;
  usagePeriodKey: string;
}

interface DataContextType {
  budgets: Budget[];
  clients: Client[];
  company: CompanyProfile;
  notifications: AppNotification[];
  // Monthly Usage & Freemium limits
  monthlyUsage: MonthlyUsageInfo;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  // Budgets
  createBudget: (data: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'budget_number'>) => Budget | null;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  duplicateBudget: (id: string) => Budget | null;
  updateBudgetStatus: (id: string, status: BudgetStatus) => void;
  getBudget: (id: string) => Budget | undefined;
  // Clients
  createClient: (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  // Company
  updateCompany: (updates: Partial<CompanyProfile>) => void;
  // Notifications
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>) => void;
  // Reset demo data
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'user_01';

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('orcacerto_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialBudgets;
      }
    }
    return initialBudgets;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('orcacerto_clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialClients;
      }
    }
    return initialClients;
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('orcacerto_company');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialCompany;
      }
    }
    return initialCompany;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('orcacerto_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialNotifications;
      }
    }
    return initialNotifications;
  });

  // Calculate Monthly Usage (Free plan limit: 3 budgets per month)
  // Section 6 & 14: Count strictly budgets created by this user in the current calendar month
  const monthlyUsage = useMemo<MonthlyUsageInfo>(() => {
    const now = new Date();
    const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const periodLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now);

    const isFree = !user || user.plan === 'free';
    const limit = isFree ? 3 : Infinity;

    // Filter budgets created in current month/year
    const count = budgets.filter((b) => {
      if (!b.created_at) return false;
      const bDate = new Date(b.created_at);
      if (isNaN(bDate.getTime())) return false;
      const bPeriod = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}`;
      return bPeriod === currentPeriodKey;
    }).length;

    const remaining = isFree ? Math.max(0, limit - count) : Infinity;
    const isLimitReached = isFree && count >= 3;
    const isLastBudget = isFree && count === 2;

    return {
      count,
      limit: isFree ? 3 : 999999,
      remaining,
      isFree,
      isLimitReached,
      isLastBudget,
      periodLabel,
      usagePeriodKey: currentPeriodKey,
    };
  }, [budgets, user]);

  // Save to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('orcacerto_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('orcacerto_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('orcacerto_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('orcacerto_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured() && supabase && user) {
      // Async fetch from Supabase tables if connected
    }
  }, [user]);

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  // Budget Actions
  const createBudget = (data: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'budget_number'>): Budget | null => {
    // ENFORCE 3-BUDGET LIMIT FOR FREE PLAN (Section 6, 7 & 8)
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
      return null;
    }

    const newNumber = generateBudgetNumber(budgets.length + 483);
    const now = new Date().toISOString();
    const newBudget: Budget = {
      ...data,
      id: `bud_${Date.now()}`,
      user_id: userId,
      budget_number: newNumber,
      created_at: now,
      updated_at: now,
      views_count: 0,
    };

    setBudgets((prev) => [newBudget, ...prev]);

    addNotification({
      title: 'Novo orçamento criado',
      message: `Orçamento ${newNumber} criado para ${newBudget.client?.name || 'Cliente'}`,
      type: 'system',
      is_read: false,
      link: `/orcamentos/${newBudget.id}`,
    });

    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    const now = new Date().toISOString();
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updated_at: now } : b))
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const duplicateBudget = (id: string): Budget | null => {
    // Check limit before duplicating if on free plan
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
      return null;
    }

    const existing = budgets.find((b) => b.id === id);
    if (!existing) return null;

    const newNumber = generateBudgetNumber(budgets.length + 484);
    const now = new Date().toISOString();
    const duplicated: Budget = {
      ...existing,
      id: `bud_${Date.now()}`,
      budget_number: newNumber,
      title: `${existing.title} (Cópia)`,
      status: 'draft',
      created_at: now,
      updated_at: now,
      sent_at: undefined,
      approved_at: undefined,
      views_count: 0,
    };

    setBudgets((prev) => [duplicated, ...prev]);

    addNotification({
      title: 'Orçamento duplicado',
      message: `Orçamento ${existing.budget_number} duplicado como ${newNumber}`,
      type: 'system',
      is_read: false,
      link: `/orcamentos/${duplicated.id}`,
    });

    return duplicated;
  };

  const updateBudgetStatus = (id: string, status: BudgetStatus) => {
    const now = new Date().toISOString();
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updates: Partial<Budget> = { status, updated_at: now };
        if (status === 'sent' && !b.sent_at) updates.sent_at = now;
        if (status === 'approved' && !b.approved_at) updates.approved_at = now;
        return { ...b, ...updates };
      })
    );
  };

  const getBudget = (id: string): Budget | undefined => {
    return budgets.find((b) => b.id === id);
  };

  // Client Actions
  const createClient = (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Client => {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...data,
      id: `cli_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const now = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: now } : c))
    );
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.client_id === id) {
          return {
            ...b,
            client: { ...b.client, ...updates, updated_at: now },
          };
        }
        return b;
      })
    );
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const getClient = (id: string): Client | undefined => {
    return clients.find((c) => c.id === id);
  };

  // Company Actions
  const updateCompany = (updates: Partial<CompanyProfile>) => {
    setCompany((prev) => ({ ...prev, ...updates }));
  };

  // Notification Actions
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const resetDemoData = () => {
    setBudgets(initialBudgets);
    setClients(initialClients);
    setCompany(initialCompany);
    setNotifications(initialNotifications);
    localStorage.removeItem('orcacerto_budgets');
    localStorage.removeItem('orcacerto_clients');
    localStorage.removeItem('orcacerto_company');
    localStorage.removeItem('orcacerto_notifications');
  };

  return (
    <DataContext.Provider
      value={{
        budgets,
        clients,
        company,
        notifications,
        monthlyUsage,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        createBudget,
        updateBudget,
        deleteBudget,
        duplicateBudget,
        updateBudgetStatus,
        getBudget,
        createClient,
        updateClient,
        deleteClient,
        getClient,
        updateCompany,
        markAsRead,
        markAllAsRead,
        addNotification,
        resetDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
