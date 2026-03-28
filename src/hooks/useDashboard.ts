'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  DashboardData,
  Transaction,
  CreditCard,
  FixedBill,
  CardBillPayment,
  FixedBillPayment,
  MonthlyTrend,
} from '@/lib/types'

const MONTHS_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

function getMonthDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  fetchDashboard: (month: number, year: number) => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchDashboard = useCallback(async (month: number, year: number) => {
    setLoading(true)
    try {
      const { startDate, endDate } = getMonthDateRange(month, year)

      // 1. Fetch transactions for the month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      const txList = (transactions as Transaction[]) || []

      // 2. Fetch active fixed bills
      const { data: fixedBills } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('is_active', true)

      const fbList = (fixedBills as FixedBill[]) || []

      // 3. Fetch card bill payments for the month/year
      const { data: cardPayments } = await supabase
        .from('card_bill_payments')
        .select('*')
        .eq('month', month)
        .eq('year', year)

      const cardPayList = (cardPayments as CardBillPayment[]) || []

      // 4. Fetch fixed bill payments for month/year
      const { data: fixedPayments } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('month', month)
        .eq('year', year)

      const fbPayList = (fixedPayments as FixedBillPayment[]) || []

      // 5. Fetch all credit cards
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('is_active', true)
        .order('name')

      const cardList = (cards as CreditCard[]) || []

      // 6. Calculate totals
      const totalIncome = txList
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      // 7. Card breakdown
      const cardBreakdown = cardList.map((card) => {
        // For billing period: transactions where credit_card_id = card.id
        const cardTxs = txList.filter(
          (t) => t.credit_card_id === card.id && t.type === 'expense'
        )
        const total = cardTxs.reduce((sum, t) => sum + t.amount, 0)
        const payment = cardPayList.find((p) => p.credit_card_id === card.id)
        return {
          card,
          total,
          isPaid: payment?.is_paid ?? false,
        }
      })

      const totalCards = cardBreakdown.reduce((sum, c) => sum + c.total, 0)

      // Fixed bills total
      const totalFixedBills = fbList.reduce((sum, b) => sum + b.amount, 0)

      // Other expenses (not credit card)
      const otherExpenses = txList
        .filter((t) => t.type === 'expense' && !t.credit_card_id)
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = totalCards + otherExpenses
      const balance = totalIncome - totalExpenses - totalFixedBills

      const cardsPercentage =
        totalIncome > 0 ? (totalCards / totalIncome) * 100 : 0
      const fixedBillsPercentage =
        totalIncome > 0 ? (totalFixedBills / totalIncome) * 100 : 0
      const totalPercentage =
        totalIncome > 0
          ? ((totalCards + totalFixedBills) / totalIncome) * 100
          : 0

      // 8. Monthly trend (last 6 months)
      const monthlyTrend: MonthlyTrend[] = []
      for (let i = 5; i >= 0; i--) {
        let tMonth = month - i
        let tYear = year
        if (tMonth <= 0) {
          tMonth += 12
          tYear -= 1
        }

        const { startDate: tStart, endDate: tEnd } = getMonthDateRange(tMonth, tYear)

        const { data: tTxs } = await supabase
          .from('transactions')
          .select('type, amount')
          .gte('date', tStart)
          .lte('date', tEnd)

        const tList = (tTxs as Pick<Transaction, 'type' | 'amount'>[]) || []
        const tIncome = tList
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const tExpenses = tList
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        monthlyTrend.push({
          month: `${tYear}-${String(tMonth).padStart(2, '0')}`,
          label: MONTHS_PT[tMonth - 1],
          income: tIncome,
          expenses: tExpenses,
          balance: tIncome - tExpenses,
        })
      }

      setData({
        totalIncome,
        totalExpenses,
        totalCards,
        totalFixedBills,
        balance,
        cardBreakdown,
        cardsPercentage,
        fixedBillsPercentage,
        totalPercentage,
        monthlyTrend,
      })
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, fetchDashboard }
}
