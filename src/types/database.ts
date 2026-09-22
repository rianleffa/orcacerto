export type BudgetStatus = 
  | 'draft'      // 🟡 Rascunho
  | 'sent'       // 🔵 Enviado
  | 'viewed'     // 👁️ Visualizado
  | 'pending'    // ⏳ Aguardando aprovação
  | 'approved'   // 🟢 Aprovado
  | 'rejected'   // 🔴 Recusado
  | 'expired';   // ⚪ Expirado

export type PaymentMethod = 'pix' | 'money' | 'card' | 'boleto' | 'transfer';

export type TemplateId = 'modern' | 'elegant' | 'minimalist';

export type PlanType = 'free' | 'professional' | 'premium' | 'pro';

export type SubscriptionStatus = 'inactive' | 'pending' | 'active' | 'canceled' | 'expired';

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number; // percentage or fixed
  total: number;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  document?: string; // CPF or CNPJ
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  budget_number: string; // e.g. "#000123"
  title: string;
  client_id: string;
  client: Client;
  items: BudgetItem[];
  subtotal: number;
  discount_total: number;
  total: number;
  validity_days: number;
  payment_method: PaymentMethod;
  payment_terms?: string; // e.g. "50% entrada, 50% na entrega"
  execution_time?: string; // e.g. "3 a 5 dias úteis"
  notes?: string;
  warranty?: string; // e.g. "90 dias de garantia"
  template_id: TemplateId;
  primary_color: string;
  show_signature: boolean;
  signature_name?: string;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  approved_at?: string;
  views_count?: number;
  last_follow_up?: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  name: string;
  document?: string; // CNPJ ou CPF
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  website?: string;
  instagram?: string;
  logo_url?: string;
  primary_color: string;
  default_template: TemplateId;
  default_whatsapp_message: string;
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'budget_approved' | 'budget_viewed' | 'budget_expiring' | 'follow_up' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone: string;
  document?: string;
  plan: PlanType;
  monthly_budget_limit: number;
  paid_subscription: boolean;
  subscription_status?: SubscriptionStatus;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  cakto_customer_id?: string;
  cakto_transaction_id?: string;
  created_at: string;
}
