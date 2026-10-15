import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Budget, Client, CompanyProfile, AppNotification, BudgetStatus } from '../types/database';
import { initialCompany } from '../lib/mockData';
import { generateBudgetNumber } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FREE_ACCESS_ENABLED } from '../lib/accessMode';
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

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
  createBudget: (data: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'budget_number'>) => Promise<Budget | null>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  duplicateBudget: (id: string) => Promise<Budget | null>;
  updateBudgetStatus: (id: string, status: BudgetStatus) => Promise<void>;
  getBudget: (id: string) => Budget | undefined;
  getBudgetAsync: (id: string) => Promise<Budget | null>;
  // Clients
  createClient: (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  // Company
  updateCompany: (updates: Partial<CompanyProfile>) => Promise<void>;
  // Notifications
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'user_id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || '';

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
    const saved = localStorage.getItem(`orcacerto_budgets_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (!user) return [];
    const saved = localStorage.getItem(`orcacerto_clients_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    if (!user) return initialCompany;
    const saved = localStorage.getItem(`orcacerto_company_${user.id}`);
    return saved ? JSON.parse(saved) : getCleanUserCompany(user);
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Calculate Monthly Usage (Free plan limit: 3 budgets per month)
  const monthlyUsage = useMemo<MonthlyUsageInfo>(() => {
    const baseDate = new Date();
    if (simulatedMonthOffset) {
      baseDate.setMonth(baseDate.getMonth() + simulatedMonthOffset);
    }
    const currentPeriodKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`;
    const periodLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(baseDate);

    const isFree = FREE_ACCESS_ENABLED ? false : (!user || user.plan === 'free');
    const limit = FREE_ACCESS_ENABLED ? Infinity : (isFree ? 3 : Infinity);

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
    const isLimitReached = !FREE_ACCESS_ENABLED && isFree && count >= 3;
    const isLastBudget = !FREE_ACCESS_ENABLED && isFree && count === 2;

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
      localStorage.setItem(`orcacerto_budgets_${user.id}`, JSON.stringify(budgets));
    }
  }, [budgets, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`orcacerto_clients_${user.id}`, JSON.stringify(clients));
    }
  }, [clients, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`orcacerto_company_${user.id}`, JSON.stringify(company));
    }
  }, [company, user?.id]);

  // Load real data from Supabase whenever active user changes
  useEffect(() => {
    let isCancelled = false;

    if (!user) {
      setCompany(initialCompany);
      setBudgets([]);
      setClients([]);
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
              .select('*, client:clients(*), items:budget_items(*)')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
          ]);

          if (!isCancelled) {
            // 1. Processa Empresa
            if (compRes.status === 'fulfilled' && !compRes.value.error && compRes.value.data) {
              setCompany(compRes.value.data);
              localStorage.setItem(`orcacerto_company_${user.id}`, JSON.stringify(compRes.value.data));
            } else if (compRes.status === 'fulfilled' && !compRes.value.error) {
              const savedCompany = localStorage.getItem(`orcacerto_company_${user.id}`);
              const freshCompany = savedCompany ? JSON.parse(savedCompany) : getCleanUserCompany(user);
              setCompany(freshCompany);
              localStorage.setItem(`orcacerto_company_${user.id}`, JSON.stringify(freshCompany));
            } else {
              const savedCompany = localStorage.getItem(`orcacerto_company_${user.id}`);
              setCompany(savedCompany ? JSON.parse(savedCompany) : getCleanUserCompany(user));
            }

            // 2. Processa Clientes
            if (clientsRes.status === 'fulfilled' && !clientsRes.value.error) {
              const remoteClients = clientsRes.value.data || [];
              setClients(remoteClients);
              localStorage.setItem(`orcacerto_clients_${user.id}`, JSON.stringify(remoteClients));
            } else {
              const savedClients = localStorage.getItem(`orcacerto_clients_${user.id}`);
              setClients(savedClients ? JSON.parse(savedClients) : []);
            }

            // 3. Processa Orçamentos
            if (budgetsRes.status === 'fulfilled' && !budgetsRes.value.error) {
              const remoteBudgets = budgetsRes.value.data || [];
              const savedBudgetsStr = localStorage.getItem(`orcacerto_budgets_${user.id}`);
              const savedBudgets: any[] = savedBudgetsStr ? JSON.parse(savedBudgetsStr) : [];
              const formattedBudgets = remoteBudgets.map((b: any) => {
                const localMatch = savedBudgets.find((s: any) => s.id === b.id);
                const items = (Array.isArray(b.items) && b.items.length > 0)
                  ? b.items
                  : (Array.isArray(b.budget_items) && b.budget_items.length > 0)
                    ? b.budget_items
                    : (localMatch && Array.isArray(localMatch.items))
                      ? localMatch.items
                      : [];
                return { ...b, items };
              });
              setBudgets(formattedBudgets);
              localStorage.setItem(`orcacerto_budgets_${user.id}`, JSON.stringify(formattedBudgets));
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
  }, [user?.id]);

  const openUpgradeModal = () => {
    if (!FREE_ACCESS_ENABLED) setIsUpgradeModalOpen(true);
  };
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  // Budget Actions
  const createBudget = async (data: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'budget_number'>): Promise<Budget | null> => {
    // Keep the former free-plan limit available behind the global access flag.
    if (!FREE_ACCESS_ENABLED && monthlyUsage.isLimitReached) {
      openUpgradeModal();
      return null;
    }

    const newBudgetId = generateUUID();
    const newNumber = generateBudgetNumber(budgets.length + 1);
    const budgetDate = new Date();
    if (simulatedMonthOffset) {
      budgetDate.setMonth(budgetDate.getMonth() + simulatedMonthOffset);
    }
    const now = budgetDate.toISOString();
    const newBudget: Budget = {
      ...data,
      id: newBudgetId,
      user_id: userId,
      budget_number: newNumber,
      created_at: now,
      updated_at: now,
      views_count: 0,
      items: (data.items || []).map((item) => ({
        ...item,
        id: item.id && item.id.length > 20 && item.id.includes('-') ? item.id : generateUUID(),
      })),
    };

    // Persist to Supabase if real user
    if (isPersistentUser(user?.id) && supabase) {
      const payload: Record<string, any> = {
        id: newBudgetId,
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
      if (data.client_id) {
        payload.client_id = data.client_id;
      }
      const { error: budgetError } = await supabase.from('budgets').insert(payload);
      throwOnSupabaseError(budgetError, 'Não foi possível salvar o orçamento');

      if (newBudget.items.length > 0) {
        const itemRows = newBudget.items.map((item, index) => ({
          id: item.id,
          budget_id: newBudgetId,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          discount: Number(item.discount) || 0,
          total: Number(item.total) || 0,
          sort_order: index,
        }));
        const { error: itemsError } = await supabase.from('budget_items').insert(itemRows);
        if (itemsError) {
          const { error: rollbackError } = await supabase.from('budgets').delete().eq('id', newBudgetId);
          if (rollbackError) {
            console.error('[DataContext] Não foi possível reverter o orçamento sem itens:', rollbackError);
          }
          throwOnSupabaseError(itemsError, 'Não foi possível salvar os itens do orçamento');
        }
      }
    }

    setBudgets((prev) => [newBudget, ...prev]);

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

  const updateBudget = async (id: string, updates: Partial<Budget>): Promise<void> => {
    const now = new Date().toISOString();
    const savedUpdates: Partial<Budget> = { ...updates, updated_at: now };

    if (isPersistentUser(user?.id) && supabase) {
      const dbUpdates: Record<string, unknown> = { updated_at: now };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.discount_total !== undefined) dbUpdates.discount_total = updates.discount_total;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.validity_days !== undefined) dbUpdates.validity_days = updates.validity_days;
      if (updates.payment_method !== undefined) dbUpdates.payment_method = updates.payment_method;
      if (updates.payment_terms !== undefined) dbUpdates.payment_terms = updates.payment_terms;
      if (updates.execution_time !== undefined) dbUpdates.execution_time = updates.execution_time;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.warranty !== undefined) dbUpdates.warranty = updates.warranty;
      if (updates.template_id !== undefined) dbUpdates.template_id = updates.template_id;
      if (updates.primary_color !== undefined) dbUpdates.primary_color = updates.primary_color;
      if (updates.show_signature !== undefined) dbUpdates.show_signature = updates.show_signature;
      if (updates.signature_name !== undefined) dbUpdates.signature_name = updates.signature_name;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      if (updates.items) {
        const { data: storedItems, error: storedItemsError } = await supabase
          .from('budget_items')
          .select('id')
          .eq('budget_id', id);
        throwOnSupabaseError(storedItemsError, 'Não foi possível verificar os itens atuais');

        const normalizedItems = updates.items.map((item) => ({
          ...item,
          id: item.id && item.id.length > 20 && item.id.includes('-') ? item.id : generateUUID(),
        }));
        const itemRows = normalizedItems.map((item, index) => ({
          id: item.id,
          budget_id: id,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          discount: Number(item.discount) || 0,
          total: Number(item.total) || 0,
          sort_order: index,
        }));

        if (itemRows.length > 0) {
          const { error: upsertError } = await supabase
            .from('budget_items')
            .upsert(itemRows, { onConflict: 'id' });
          throwOnSupabaseError(upsertError, 'Não foi possível salvar os itens do orçamento');
        }

        const desiredIds = new Set(itemRows.map((item) => item.id));
        const staleIds = (storedItems || []).map((item) => item.id).filter((itemId) => !desiredIds.has(itemId));
        if (staleIds.length > 0) {
          const { error: deleteItemsError } = await supabase.from('budget_items').delete().in('id', staleIds);
          throwOnSupabaseError(deleteItemsError, 'Não foi possível remover os itens excluídos');
        }
        savedUpdates.items = normalizedItems;
      }

      const { data: savedBudget, error: budgetError } = await supabase
        .from('budgets')
        .update(dbUpdates)
        .eq('id', id)
        .select('id');
      throwOnSupabaseError(budgetError, 'Não foi possível atualizar o orçamento');
      if (!savedBudget?.length) throw new Error('O orçamento não existe ou não pertence a esta conta.');
    }

    setBudgets((prev) => prev.map((budget) =>
      budget.id === id ? { ...budget, ...savedUpdates, updated_at: now } : budget
    ));
  };

  const deleteBudget = async (id: string): Promise<void> => {
    if (isPersistentUser(user?.id) && supabase) {
      const { data, error } = await supabase.from('budgets').delete().eq('id', id).select('id');
      throwOnSupabaseError(error, 'Não foi possível excluir o orçamento');
      if (!data?.length) throw new Error('O orçamento não existe ou não pertence a esta conta.');
    }

    setBudgets((prev) => prev.filter((budget) => budget.id !== id));
  };

  const duplicateBudget = async (id: string): Promise<Budget | null> => {
    if (!FREE_ACCESS_ENABLED && monthlyUsage.isLimitReached) {
      openUpgradeModal();
      return null;
    }

    const existing = budgets.find((b) => b.id === id);
    if (!existing) return null;

    const newBudgetId = generateUUID();
    const newNumber = generateBudgetNumber(budgets.length + 1);
    const budgetDate = new Date();
    if (simulatedMonthOffset) {
      budgetDate.setMonth(budgetDate.getMonth() + simulatedMonthOffset);
    }
    const now = budgetDate.toISOString();
    const duplicatedItems = (existing.items || []).map((it) => ({
      ...it,
      id: generateUUID(),
    }));

    const duplicated: Budget = {
      ...existing,
      id: newBudgetId,
      budget_number: newNumber,
      title: `${existing.title} (Cópia)`,
      status: 'draft',
      items: duplicatedItems,
      created_at: now,
      updated_at: now,
      sent_at: undefined,
      approved_at: undefined,
      views_count: 0,
    };

    if (isPersistentUser(user?.id) && supabase) {
      const payload: Record<string, unknown> = {
        id: newBudgetId,
        user_id: user.id,
        budget_number: newNumber,
        title: duplicated.title,
        subtotal: duplicated.subtotal,
        discount_total: duplicated.discount_total || 0,
        total: duplicated.total,
        validity_days: duplicated.validity_days || 10,
        payment_method: duplicated.payment_method || 'pix',
        payment_terms: duplicated.payment_terms || null,
        execution_time: duplicated.execution_time || null,
        notes: duplicated.notes || null,
        warranty: duplicated.warranty || null,
        template_id: duplicated.template_id || 'modern',
        primary_color: duplicated.primary_color || '#10b981',
        show_signature: duplicated.show_signature ?? true,
        signature_name: duplicated.signature_name || null,
        status: 'draft',
      };
      if (duplicated.client_id) payload.client_id = duplicated.client_id;

      const { error: budgetError } = await supabase.from('budgets').insert(payload);
      throwOnSupabaseError(budgetError, 'Não foi possível duplicar o orçamento');

      if (duplicatedItems.length > 0) {
        const itemRows = duplicatedItems.map((item, index) => ({
          id: item.id,
          budget_id: newBudgetId,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          discount: Number(item.discount) || 0,
          total: Number(item.total) || 0,
          sort_order: index,
        }));
        const { error: itemsError } = await supabase.from('budget_items').insert(itemRows);
        if (itemsError) {
          const { error: rollbackError } = await supabase.from('budgets').delete().eq('id', newBudgetId);
          if (rollbackError) {
            console.error('[DataContext] Não foi possível reverter a duplicação incompleta:', rollbackError);
          }
          throwOnSupabaseError(itemsError, 'Não foi possível duplicar os itens do orçamento');
        }
      }
    }

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

  const updateBudgetStatus = async (id: string, status: BudgetStatus): Promise<void> => {
    const now = new Date().toISOString();
    if (isPersistentUser(user?.id) && supabase) {
      const dbUpdates: Record<string, any> = { status, updated_at: now };
      if (status === 'sent') dbUpdates.sent_at = now;
      if (status === 'approved') dbUpdates.approved_at = now;
      const { data, error } = await supabase.from('budgets').update(dbUpdates).eq('id', id).select('id');
      throwOnSupabaseError(error, 'Não foi possível atualizar o status do orçamento');
      if (!data?.length) throw new Error('O orçamento não existe ou não pertence a esta conta.');
    }

    setBudgets((prev) => prev.map((budget) => {
      if (budget.id !== id) return budget;
      const updates: Partial<Budget> = { status, updated_at: now };
      if (status === 'sent' && !budget.sent_at) updates.sent_at = now;
      if (status === 'approved' && !budget.approved_at) updates.approved_at = now;
      return { ...budget, ...updates };
    }));
  };

  const getBudget = (id: string): Budget | undefined => {
    if (!id) return undefined;
    return budgets.find((b) => b.id === id);
  };

  const getBudgetAsync = async (id: string): Promise<Budget | null> => {
    if (!id) return null;
    const inMemory = budgets.find((b) => b.id === id);
    if (inMemory && inMemory.items && inMemory.items.length > 0) return inMemory;

    if (isSupabaseConfigured() && supabase && user?.id && !user.id.startsWith('usr_')) {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*, client:clients(*), items:budget_items(*)')
          .eq('id', id)
          .maybeSingle();

        if (data && !error) {
          const formatted: Budget = {
            ...data,
            items: Array.isArray(data.items) && data.items.length > 0
              ? data.items
              : (Array.isArray((data as any).budget_items) ? (data as any).budget_items : (inMemory?.items || [])),
          };
          setBudgets((prev) => {
            const exists = prev.some((b) => b.id === formatted.id);
            return exists ? prev.map((b) => (b.id === formatted.id ? formatted : b)) : [formatted, ...prev];
          });
          return formatted;
        }
      } catch (err) {
        console.warn('[DataContext] Falha ao buscar orçamento direto no Supabase:', err);
      }
    }
    return inMemory || null;
  };

  // Client Actions
  const createClient = async (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Client> => {
    const newClientId = generateUUID();
    const now = new Date().toISOString();
    const newClient: Client = {
      ...data,
      id: newClientId,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    if (isPersistentUser(user?.id) && supabase) {
      const { error } = await supabase.from('clients').insert({
        id: newClientId,
        user_id: user.id,
        name: data.name,
        document: data.document || null,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        address: data.address || null,
        notes: data.notes || null,
      });
      throwOnSupabaseError(error, 'Não foi possível salvar o cliente');
    }

    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<void> => {
    const now = new Date().toISOString();
    if (isPersistentUser(user?.id) && supabase && id.includes('-')) {
      const dbUpdates: Record<string, unknown> = { updated_at: now };
      for (const field of ['name', 'document', 'email', 'phone', 'whatsapp', 'address', 'notes'] as const) {
        if (updates[field] !== undefined) dbUpdates[field] = updates[field];
      }
      const { data, error } = await supabase.from('clients').update(dbUpdates).eq('id', id).select('id');
      throwOnSupabaseError(error, 'Não foi possível atualizar o cliente');
      if (!data?.length) throw new Error('O cliente não existe ou não pertence a esta conta.');
    }

    setClients((prev) => prev.map((client) =>
      client.id === id ? { ...client, ...updates, updated_at: now } : client
    ));
    setBudgets((prev) => prev.map((budget) => budget.client_id === id
      ? { ...budget, client: { ...budget.client, ...updates, updated_at: now } }
      : budget
    ));
  };

  const deleteClient = async (id: string): Promise<void> => {
    if (isPersistentUser(user?.id) && supabase && id.includes('-')) {
      const { data, error } = await supabase.from('clients').delete().eq('id', id).select('id');
      throwOnSupabaseError(error, 'Não foi possível excluir o cliente');
      if (!data?.length) throw new Error('O cliente não existe ou não pertence a esta conta.');
    }

    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const getClient = (id: string): Client | undefined => {
    return clients.find((c) => c.id === id);
  };

  // Company Actions
  const updateCompany = async (updates: Partial<CompanyProfile>) => {
    const now = new Date().toISOString();
    if (isPersistentUser(user?.id) && supabase) {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        updated_at: now,
      };
      for (const field of [
        'name', 'document', 'phone', 'whatsapp', 'email', 'address', 'website', 'instagram',
        'logo_url', 'primary_color', 'default_template', 'default_whatsapp_message', 'pix_key', 'pix_key_type',
      ] as const) {
        if (updates[field] !== undefined) payload[field] = updates[field];
      }
      const { error } = await supabase.from('companies').upsert(payload, { onConflict: 'user_id' });
      throwOnSupabaseError(error, 'Não foi possível salvar os dados da empresa');
    }

    setCompany((previous) => ({ ...previous, ...updates, updated_at: now }));
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
        getBudgetAsync,
        createClient,
        updateClient,
        deleteClient,
        getClient,
        updateCompany,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

function throwOnSupabaseError(error: { message: string } | null, action: string): void {
  if (error) {
    throw new Error(`${action}: ${error.message}`);
  }
}

function isPersistentUser(userId: string | undefined): userId is string {
  return Boolean(userId && !userId.startsWith('usr_') && isSupabaseConfigured() && supabase);
}

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
