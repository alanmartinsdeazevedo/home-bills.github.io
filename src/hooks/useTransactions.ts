'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, Category, PaymentMethod, TransactionType } from '@/lib/types'

interface AddTransactionData {
  type: TransactionType
  amount: number
  category_id: string | null
  description: string
  date: string
  payment_method: PaymentMethod
  credit_card_id: string | null
  is_installment: boolean
  installment_total: number | null
  notes: string | null
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  categories: Category[]
  loading: boolean
  fetchTransactions: (month: number, year: number) => Promise<void>
  addTransaction: (data: AddTransactionData) => Promise<{ error: string | null }>
  deleteTransaction: (id: string) => Promise<void>
  deleteInstallmentGroup: (groupId: string) => Promise<void>
  togglePaid: (id: string, isPaid: boolean) => Promise<void>
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = useCallback(async (month: number, year: number) => {
    setLoading(true)
    try {
      // Build date range for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(*), credit_cards(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions((data as Transaction[]) || [])

      // Also fetch categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories((cats as Category[]) || [])
    } catch (err) {
      console.error('Erro ao buscar transações:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addTransaction = useCallback(
    async (data: AddTransactionData): Promise<{ error: string | null }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'Usuário não autenticado' }

      try {
        if (data.is_installment && data.installment_total && data.installment_total > 1) {
          // Create installment group
          const groupId = crypto.randomUUID()
          const baseDate = new Date(data.date + 'T12:00:00')

          const records = []
          for (let i = 1; i <= data.installment_total; i++) {
            const installDate = new Date(baseDate)
            installDate.setMonth(baseDate.getMonth() + (i - 1))

            records.push({
              user_id: user.id,
              type: data.type,
              amount: data.amount,
              category_id: data.category_id,
              description: data.description,
              date: installDate.toISOString().split('T')[0],
              payment_method: data.payment_method,
              credit_card_id: data.credit_card_id,
              is_installment: true,
              installment_current: i,
              installment_total: data.installment_total,
              installment_group_id: groupId,
              is_paid: false,
              notes: data.notes,
            })
          }

          const { error } = await supabase.from('transactions').insert(records)
          if (error) return { error: error.message }
        } else {
          const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            type: data.type,
            amount: data.amount,
            category_id: data.category_id,
            description: data.description,
            date: data.date,
            payment_method: data.payment_method,
            credit_card_id: data.credit_card_id,
            is_installment: false,
            installment_current: null,
            installment_total: null,
            installment_group_id: null,
            is_paid: false,
            notes: data.notes,
          })
          if (error) return { error: error.message }
        }

        return { error: null }
      } catch (err) {
        return { error: String(err) }
      }
    },
    []
  )

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const deleteInstallmentGroup = useCallback(async (groupId: string) => {
    await supabase
      .from('transactions')
      .delete()
      .eq('installment_group_id', groupId)
    setTransactions((prev) =>
      prev.filter((t) => t.installment_group_id !== groupId)
    )
  }, [])

  const togglePaid = useCallback(async (id: string, isPaid: boolean) => {
    await supabase
      .from('transactions')
      .update({ is_paid: isPaid })
      .eq('id', id)
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_paid: isPaid } : t))
    )
  }, [])

  return {
    transactions,
    categories,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    deleteInstallmentGroup,
    togglePaid,
  }
}
