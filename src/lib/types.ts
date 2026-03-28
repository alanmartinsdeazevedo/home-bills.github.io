export type TransactionType = 'income' | 'expense'
export type PaymentMethod = string

export interface PaymentMethodRecord {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  fechamento_dia: number
  vencimento_dia: number
  color: string
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category_id: string | null
  description: string
  date: string
  payment_method: PaymentMethod
  credit_card_id: string | null
  is_installment: boolean
  installment_current: number | null
  installment_total: number | null
  installment_group_id: string | null
  is_paid: boolean
  notes: string | null
  created_at: string
  updated_at: string
  categories?: Category
  credit_cards?: CreditCard
}

export interface FixedBill {
  id: string
  user_id: string
  name: string
  amount: number
  due_day: number
  category_id: string | null
  is_installment: boolean
  installment_current: number | null
  installment_total: number | null
  is_active: boolean
  created_at: string
}

export interface FixedBillPayment {
  id: string
  user_id: string
  fixed_bill_id: string
  month: number
  year: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

export interface CardBillPayment {
  id: string
  user_id: string
  credit_card_id: string
  month: number
  year: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

export interface Receivable {
  id: string
  user_id: string
  description: string
  person: string
  amount: number
  due_date: string | null
  is_received: boolean
  installment_current: number | null
  installment_total: number | null
  notes: string | null
  created_at: string
}

export interface CardBreakdown {
  card: CreditCard
  total: number
  isPaid: boolean
}

export interface MonthlyTrend {
  month: string
  label: string
  income: number
  expenses: number
  balance: number
}

export interface DashboardData {
  totalIncome: number
  totalExpenses: number
  totalCards: number
  totalFixedBills: number
  balance: number
  cardBreakdown: CardBreakdown[]
  cardsPercentage: number
  fixedBillsPercentage: number
  totalPercentage: number
  monthlyTrend: MonthlyTrend[]
}

// ─── Grupo Familiar ───────────────────────────────────────────

export interface Household {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface HouseholdInvite {
  id: string
  household_id: string
  token: string
  invited_by: string
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
  expires_at: string
}
