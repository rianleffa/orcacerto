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
  setSimulatedUsageCount: (count: number | null) => void;
  advanceMonthForTesting: (months: number) => void;
  resetTestOverrides: () => void;
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
  const userId = user?.id || '';
  const isDemo = user?.provider === 'demo';

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [simulatedCountOverride, setSimulatedCountOverride] = useState<number | null>(null);
  const [simulatedMonthOffset, setSimulatedMonthOffset] = useState<number>(0);

  const setSimulatedUsageCount = (count: number | null) => {
    setSimulatedCountOverride(count);
  };

  const advanceMonthForTesting = (months: number) => {
    setSimulatedMonthOffset((prev) => prev + months);
  };

  const resetTestOverrides = () => {
    setSimulatedCountOverride(null);
    setSimulatedMonthOffset(0);
  };

  // Helper to build a clean company profile for the authenticated user
  const getCleanUserCompany = (u: typeof user): CompanyProfile => ({
    id: u?.id ? `comp_${u.id}` : 'comp_new',
    user_id: u?.id || '',
    name: u?.company_name && u.company_name !== 'EletroVolt Soluções Elétricas' ? u.company_name : (u?.name ? `Empresa de ${u.name}` : 'Minha Empresa'),
    email: u?.email || '',
    phone: u?.phone || '',
    whatsapp: u?.phone || '',
    document: u?.document || '',
    address: '',
    website: '',
    instagram: '',
    logo_url: '',
    primary_color: '#10b981',
    default_template: 'modern',
    default_whatsapp_message: 'Olá, {cliente}! 👋\n\nPreparei seu orçamento pelo OrçaCerto.\n\n📄 Orçamento {numero}\n💰 Valor total: {valor}\n\nFico à disposição!',
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    if (!user) return [];
    if (isDemo) {
      const saved = localStorage.getItem('orcacerto_budgets_demo');
      return saved ? JSON.parse(saved) : initialBudgets;
    }
    const saved = localStorage.getItem(`orcacerto_budgets_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (!user) return [];
    if (isDemo) {
      const saved = localStorage.getItem('orcacerto_clients_demo');
      return saved ? JSON.parse(saved) : initialClients;
    }
    const saved = localStorage.getItem(`orcacerto_clients_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    if (!user) return initialCompany;
    if (isDemo) {
      const saved = localStorage.getItem('orcacerto_company_demo');
      return saved ? JSON.parse(saved) : initialCompany;
    }
    const saved = localStorage.getItem(`orcacerto_company_${user.id}`);
    return saved ? JSON.parse(saved) : getCleanUserCompany(user);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (isDemo) return initialNotifications;
    return [];
  });

  // Calculate Monthly Usage (Free plan limit: 3 budgets per month)
  const monthlyUsage = useMemo<MonthlyUsageInfo>(() => {
    const baseDate = new Date();
    if (simulatedMonthOffset) {
      baseDate.setMonth(baseDate.getMonth() + simulatedMonthOffset);
    }
    const currentPeriodKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
    const periodLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(baseDate);

    const isFree = !user || user.plan === 'free';
    const limit = isFree ? 3 : Infinity;

    // Filter budgets created in current month/year by this user
    const currentMonthBudgets = budgets.filter((b) => {
      if (b.user_id && user?.id && b.user_id !== user.id) return false;
      if (!b.created_at) return false;
      const bDate = new Date(b.created_at);
      if (isNaN(bDate.getTime())) return false;
      const bPeriod = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}`;
      return bPeriod === currentPeriodKey;
    });

    const calculatedCount = currentMonthBudgets.length;
    const count = simulatedCountOverride !== null ? simulatedCountOverride : calculatedCount;

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
  }, [budgets, user, simulatedCountOverride, simulatedMonthOffset]);

  // Persist state to scoped localStorage
  useEffect(() => {
    if (user?.id) {
      const key = isDemo ? 'orcacerto_budgets_demo' : `orcacerto_budgets_${user.id}`;
      localStorage.setItem(key, JSON.stringify(budgets));
    }
  }, [budgets, user?.id, isDemo]);

  useEffect(() => {
    if (user?.id) {
      const key = isDemo ? 'orcacerto_clients_demo' : `orcacerto_clients_${user.id}`;
      localStorage.setItem(key, JSON.stringify(clients));
    }
  }, [clients, user?.id, isDemo]);

  useEffect(() => {
    if (user?.id) {
      const key = isDemo ? 'orcacerto_company_demo' : `orcacerto_company_${user.id}`;
      localStorage.setItem(key, JSON.stringify(company));
    }
  }, [company, user?.id, isDemo]);

  // Load real data from Supabase whenever active user changes
  useEffect(() => {
    let isCancelled = false;

    if (!user) {
      setCompany(initialCompany);
      setBudgets([]);
      setClients([]);
      return;
    }

    if (isDemo) {
      const savedBudgets = localStorage.getItem('orcacerto_budgets_demo');
      const savedClients = localStorage.getItem('orcacerto_clients_demo');
      const savedCompany = localStorage.getItem('orcacerto_company_demo');
      setBudgets(savedBudgets ? JSON.parse(savedBudgets) : initialBudgets);
      setClients(savedClients ? JSON.parse(savedClients) : initialClients);
      setCompany(savedCompany ? JSON.parse(savedCompany) : initialCompany);
      return;
    }

    // REAL SUPABASE USER:
    if (isSupabaseConfigured() && supabase && user.id) {
      const loadSupabaseUserData = async () => {
        if (!supabase) return;
        try {
          // Busca paralela concorrente de empresas, clientes e orçamentos
          const [compRes, clientsRes, budgetsRes] = await Promise.allSettled([
            supabase
              .from('companies')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('clients')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('budgets')
              .select('*, client:clients(*)')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
          ]);

          if (!isCancelled) {
            // 1. Processa Empresa
            if (compRes.status === 'fulfilled' && compRes.value.data) {
              setCompany(compRes.value.data);
              localStorage.setItem(`orcacerto_company_${user.id}`, JSON.stringify(compRes.value.data));
            } else {
              const freshComp = getCleanUserCompany(user);
              setCompany(freshComp);
              localStorage.setItem(`orcacerto_company_${user.id}`, JSON.stringify(freshComp));
            }

            // 2. Processa Clientes
            if (clientsRes.status === 'fulfilled' && clientsRes.value.data && clientsRes.value.data.length > 0) {
              setClients(clientsRes.value.data);
              localStorage.setItem(`orcacerto_clients_${user.id}`, JSON.stringify(clientsRes.value.data));
            } else {
              const savedClients = localStorage.getItem(`orcacerto_clients_${user.id}`);
              setClients(savedClients ? JSON.parse(savedClients) : []);
            }

            // 3. Processa Orçamentos
            if (budgetsRes.status === 'fulfilled' && budgetsRes.value.data && budgetsRes.value.data.length > 0) {
              setBudgets(budgetsRes.value.data);
              localStorage.setItem(`orcacerto_budgets_${user.id}`, JSON.stringify(budgetsRes.value.data));
            } else {
              const savedBudgets = localStorage.getItem(`orcacerto_budgets_${user.id}`);
              setBudgets(savedBudgets ? JSON.parse(savedBudgets) : []);
            }
          }
        } catch (err) {
          console.warn('[DataContext] Falha ao carregar dados do usuário do Supabase:', err);
        }
      };

      loadSupabaseUserData();
    }

    return () => {
      isCancelled = true;
    };
  }, [user?.id, isDemo]);

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  // Budget Actions
  const createBudget = (data: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'budget_number'>): Budget | null => {
    // ENFORCE 3-BUDGET LIMIT FOR FREE PLAN (Section 6, 7 & 8)
    if (monthlyUsage.isLimitReached) {
      openUpgradeModal();
      return null;
    }

    const newNumber = generateBudgetNumber(budgets.length + (isDemo ? 483 : 1));
    const budgetDate = new Date();
    if (simulatedMonthOffset) {
      budgetDate.setMonth(budgetDate.getMonth() + simulatedMonthOffset);
    }
    const now = budgetDate.toISOString();
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

    // Persist to Supabase if real user
    if (isSupabaseConfigured() && supabase && user?.id && !isDemo) {
      const payload: Record<string, any> = {
        user_id: user.id,
        budget_number: newNumber,
        title: data.title,
        subtotal: data.subtotal,
        discount_total: data.discount_total || 0,
        total: data.total,
        validity_days: data.validity_days || 10,
        payment_method: data.payment_method || 'pix',
        payment_terms: data.payment_terms || null,
        execution_time: data.execution_time || null,
        notes: data.notes || null,
        warranty: data.warranty || null,
        template_id: data.template_id || 'modern',
        primary_color: data.primary_color || '#10b981',
        show_signature: data.show_signature ?? true,
        signature_name: data.signature_name || null,
        status: data.status || 'draft',
      };
      if (data.client_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.client_id)) {
        payload.client_id = data.client_id;
      }
      (async () => {
        try {
          const { data: inserted, error: bErr } = await supabase
            .from('budgets')
            .insert(payload)
            .select('*, client:clients(*)')
            .maybeSingle();

          if (inserted && !bErr) {
            setBudgets((prev) => prev.map((b) => (b.id === newBudget.id ? { ...newBudget, ...inserted } : b)));
          }
        } catch (e) {
          console.warn('[DataContext] Falha ao persistir orçamento no Supabase:', e);
        }
      })();
    }

    if (simulatedCountOverride !== null) {
      setSimulatedCountOverride((prev) => (prev !== null ? prev + 1 : null));
    }

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

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo && id.includes('-')) {
      supabase.from('budgets').update({ ...updates, updated_at: now }).eq('id', id).then();
    }
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo && id.includes('-')) {
      supabase.from('budgets').delete().eq('id', id).then();
    }
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
    const budgetDate = new Date();
    if (simulatedMonthOffset) {
      budgetDate.setMonth(budgetDate.getMonth() + simulatedMonthOffset);
    }
    const now = budgetDate.toISOString();
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

    if (simulatedCountOverride !== null) {
      setSimulatedCountOverride((prev) => (prev !== null ? prev + 1 : null));
    }

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

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo && id.includes('-')) {
      const dbUpdates: Record<string, any> = { status, updated_at: now };
      if (status === 'sent') dbUpdates.sent_at = now;
      if (status === 'approved') dbUpdates.approved_at = now;
      supabase.from('budgets').update(dbUpdates).eq('id', id).then();
    }
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

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo) {
      (async () => {
        try {
          const { data: inserted, error: cErr } = await supabase
            .from('clients')
            .insert({
              user_id: user.id,
              name: data.name,
              document: data.document || null,
              email: data.email || null,
              phone: data.phone || null,
              whatsapp: data.whatsapp || null,
              address: data.address || null,
              notes: data.notes || null,
            })
            .select()
            .maybeSingle();

          if (inserted && !cErr) {
            setClients((prev) => prev.map((c) => (c.id === newClient.id ? inserted : c)));
          }
        } catch (e) {
          console.warn('[DataContext] Falha ao persistir cliente no Supabase:', e);
        }
      })();
    }

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

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo && id.includes('-')) {
      supabase.from('clients').update({ ...updates, updated_at: now }).eq('id', id).then();
    }
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured() && supabase && user?.id && !isDemo && id.includes('-')) {
      supabase.from('clients').delete().eq('id', id).then();
    }
  };

  const getClient = (id: string): Client | undefined => {
    return clients.find((c) => c.id === id);
  };

  // Company Actions
  const updateCompany = async (updates: Partial<CompanyProfile>) => {
    setCompany((prev) => {
      const merged = { ...prev, ...updates };
      localStorage.setItem('orcacerto_company', JSON.stringify(merged));
      return merged;
    });

    if (isSupabaseConfigured() && supabase && user?.id && !user.id.startsWith('demo_')) {
      try {
        const payload: Record<string, any> = {
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.document !== undefined) payload.document = updates.document;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.address !== undefined) payload.address = updates.address;
        if (updates.website !== undefined) payload.website = updates.website;
        if (updates.instagram !== undefined) payload.instagram = updates.instagram;
        if (updates.logo_url !== undefined) payload.logo_url = updates.logo_url;
        if (updates.primary_color !== undefined) payload.primary_color = updates.primary_color;
        if (updates.default_template !== undefined) payload.default_template = updates.default_template;
        if (updates.default_whatsapp_message !== undefined) payload.default_whatsapp_message = updates.default_whatsapp_message;
        if (updates.pix_key !== undefined) payload.pix_key = updates.pix_key;
        if (updates.pix_key_type !== undefined) payload.pix_key_type = updates.pix_key_type;

        await supabase
          .from('companies')
          .upsert(payload, { onConflict: 'user_id' });
      } catch (err) {
        console.error('[DataContext] Erro ao persistir dados da empresa no Supabase:', err);
      }
    }
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
        setSimulatedUsageCount,
        advanceMonthForTesting,
        resetTestOverrides,
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
