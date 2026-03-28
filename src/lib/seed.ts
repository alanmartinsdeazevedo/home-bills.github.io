import { supabase } from '@/lib/supabase'

interface SeedCategory {
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
}

interface SeedCard {
  name: string
  fechamento_dia: number
  vencimento_dia: number
  color: string
}

const EXPENSE_CATEGORIES: SeedCategory[] = [
  { name: 'Cartão Carrefour', color: '#dc2626', icon: '🛒', type: 'expense' },
  { name: 'Cartão Assaí', color: '#b91c1c', icon: '🛒', type: 'expense' },
  { name: 'Cartão Nubank', color: '#7c3aed', icon: '💳', type: 'expense' },
  { name: 'Cartão Hiper', color: '#d97706', icon: '💳', type: 'expense' },
  { name: 'Cartão Santander', color: '#ef4444', icon: '💳', type: 'expense' },
  { name: 'Cartão Sams Club', color: '#0284c7', icon: '💳', type: 'expense' },
  { name: 'Água CAERN', color: '#0ea5e9', icon: '💧', type: 'expense' },
  { name: 'Energia COSERN', color: '#eab308', icon: '⚡', type: 'expense' },
  { name: 'Internet Alares', color: '#6366f1', icon: '🌐', type: 'expense' },
  { name: 'Parcela Casa', color: '#92400e', icon: '🏠', type: 'expense' },
  { name: 'Cartão Mãe', color: '#ec4899', icon: '💳', type: 'expense' },
  { name: 'IPTU', color: '#78716c', icon: '🏛️', type: 'expense' },
  { name: 'Geladeira Casas BH', color: '#14b8a6', icon: '🧊', type: 'expense' },
  { name: 'Riachuelo', color: '#f43f5e', icon: '👗', type: 'expense' },
  { name: 'Taco', color: '#fb923c', icon: '🌮', type: 'expense' },
  { name: 'Mercado', color: '#22c55e', icon: '🛍️', type: 'expense' },
  { name: 'Combustível', color: '#f97316', icon: '⛽', type: 'expense' },
  { name: 'Saúde/Dentista', color: '#10b981', icon: '🏥', type: 'expense' },
  { name: 'Lazer', color: '#a855f7', icon: '🎉', type: 'expense' },
  { name: 'Pets', color: '#84cc16', icon: '🐾', type: 'expense' },
  { name: 'Casa/Manutenção', color: '#64748b', icon: '🔧', type: 'expense' },
  { name: 'Serviços', color: '#06b6d4', icon: '⚙️', type: 'expense' },
  { name: 'Outros', color: '#94a3b8', icon: '📦', type: 'expense' },
]

const INCOME_CATEGORIES: SeedCategory[] = [
  { name: 'Salário Alan', color: '#16a34a', icon: '💼', type: 'income' },
  { name: 'Salário Mi', color: '#15803d', icon: '💼', type: 'income' },
  { name: 'PL/PJ Alan', color: '#059669', icon: '💰', type: 'income' },
  { name: 'Pis Mi', color: '#0d9488', icon: '💰', type: 'income' },
  { name: 'Férias', color: '#0891b2', icon: '🏖️', type: 'income' },
  { name: '13º Salário', color: '#2563eb', icon: '🎁', type: 'income' },
  { name: 'Freelance/Serviço', color: '#7c3aed', icon: '💻', type: 'income' },
  { name: 'Venda/Devolução/Estorno', color: '#db2777', icon: '↩️', type: 'income' },
  { name: 'Caixinha/Empréstimo', color: '#d97706', icon: '🏦', type: 'income' },
  { name: 'Outros Receita', color: '#64748b', icon: '➕', type: 'income' },
]

const CREDIT_CARDS: SeedCard[] = [
  { name: 'Carrefour', fechamento_dia: 1, vencimento_dia: 10, color: '#dc2626' },
  { name: 'Santander', fechamento_dia: 3, vencimento_dia: 10, color: '#ef4444' },
  { name: 'Nubank', fechamento_dia: 4, vencimento_dia: 14, color: '#7c3aed' },
  { name: 'Assaí', fechamento_dia: 3, vencimento_dia: 9, color: '#b91c1c' },
  { name: 'Hiper', fechamento_dia: 4, vencimento_dia: 10, color: '#d97706' },
  { name: 'Sams Club', fechamento_dia: 1, vencimento_dia: 15, color: '#0284c7' },
]

export async function seedUserData(userId: string): Promise<void> {
  // Check if user already has credit cards (seed already ran)
  const { data: existingCards } = await supabase
    .from('credit_cards')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existingCards && existingCards.length > 0) {
    // Already seeded
    return
  }

  // Seed categories
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  const categoriesToInsert = allCategories.map((cat) => ({
    user_id: userId,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    type: cat.type,
  }))

  const { error: catError } = await supabase
    .from('categories')
    .insert(categoriesToInsert)

  if (catError) {
    console.error('Erro ao criar categorias:', catError)
  }

  // Seed credit cards
  const cardsToInsert = CREDIT_CARDS.map((card) => ({
    user_id: userId,
    name: card.name,
    fechamento_dia: card.fechamento_dia,
    vencimento_dia: card.vencimento_dia,
    color: card.color,
    is_active: true,
  }))

  const { error: cardError } = await supabase
    .from('credit_cards')
    .insert(cardsToInsert)

  if (cardError) {
    console.error('Erro ao criar cartões:', cardError)
  }

  // Criar grupo familiar para o novo usuário
  const { data: household } = await supabase
    .from('households')
    .insert({ name: 'Minha Família', owner_id: userId })
    .select()
    .single()

  // Adicionar usuário como dono do grupo familiar
  if (household) {
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: userId,
        role: 'owner',
      })

    if (memberError) {
      console.error('Erro ao adicionar membro ao grupo familiar:', memberError)
    }
  }
}
