'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, Circle, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCreditCards } from '@/hooks/useCreditCards'
import type {
  CreditCard,
  FixedBill,
  FixedBillPayment,
  CardBillPayment,
  Transaction,
} from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const fmtDate = (day: number) => `Dia ${day}`

// For a card with fechamento_dia=X, the bill for month M includes
// transactions from (X+1) of month M-1 to X of month M.
function getBillingPeriod(card: CreditCard, month: number, year: number) {
  const fechamento = card.fechamento_dia
  // Start: fechamento+1 of previous month
  let startMonth = month - 1
  let startYear = year
  if (startMonth === 0) {
    startMonth = 12
    startYear = year - 1
  }
  const startDay = fechamento + 1
  const lastDayOfStartMonth = new Date(startYear, startMonth, 0).getDate()
  const actualStartDay = Math.min(startDay, lastDayOfStartMonth)

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(actualStartDay).padStart(2, '0')}`

  // End: fechamento of current month
  const lastDayOfCurrentMonth = new Date(year, month, 0).getDate()
  const actualEndDay = Math.min(fechamento, lastDayOfCurrentMonth)
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(actualEndDay).padStart(2, '0')}`

  return { startDate, endDate }
}

interface MonthlyPanelProps {
  month: number
  year: number
}

export default function MonthlyPanel({ month, year }: MonthlyPanelProps) {
  const { cards, loading: cardsLoading, fetchCards } = useCreditCards()
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([])
  const [cardTotals, setCardTotals] = useState<Record<string, number>>({})
  const [cardPayments, setCardPayments] = useState<CardBillPayment[]>([])
  const [fixedPayments, setFixedPayments] = useState<FixedBillPayment[]>([])
  const [incomeTransactions, setIncomeTransactions] = useState<Transaction[]>([])
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch fixed bills
      const { data: fb } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('due_day')
      setFixedBills((fb as FixedBill[]) || [])

      // Fetch card payments for month/year
      const { data: cp } = await supabase
        .from('card_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
      setCardPayments((cp as CardBillPayment[]) || [])

      // Fetch fixed bill payments for month/year
      const { data: fp } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year)
      setFixedPayments((fp as FixedBillPayment[]) || [])

      // Fetch income transactions
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const { data: txAll } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const allTx = (txAll as Transaction[]) || []
      setIncomeTransactions(allTx.filter((t) => t.type === 'income'))
      const expTotal = allTx
        .filter((t) => t.type === 'expense' && !t.credit_card_id)
        .reduce((sum, t) => sum + t.amount, 0)
      setExpenseTotal(expTotal)
    } catch (err) {
      console.error('Erro ao carregar painel:', err)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  // Compute card totals using billing period
  const computeCardTotals = useCallback(async () => {
    if (cards.length === 0) return
    const totals: Record<string, number> = {}

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    for (const card of cards) {
      const { startDate, endDate } = getBillingPeriod(card, month, year)
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('credit_card_id', card.id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)

      totals[card.id] = ((txs as { amount: number }[]) || []).reduce(
        (sum, t) => sum + t.amount,
        0
      )
    }
    setCardTotals(totals)
  }, [cards, month, year])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (cards.length > 0) computeCardTotals()
  }, [computeCardTotals, cards])

  const toggleCardPaid = async (cardId: string, currentlyPaid: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const existing = cardPayments.find((p) => p.credit_card_id === cardId)
    if (existing) {
      await supabase
        .from('card_bill_payments')
        .update({ is_paid: !currentlyPaid, paid_at: !currentlyPaid ? new Date().toISOString() : null })
        .eq('id', existing.id)
    } else {
      await supabase.from('card_bill_payments').insert({
        user_id: user.id,
        credit_card_id: cardId,
        month,
        year,
        is_paid: true,
        paid_at: new Date().toISOString(),
      })
    }
    await loadData()
  }

  const toggleFixedBillPaid = async (billId: string, currentlyPaid: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const existing = fixedPayments.find((p) => p.fixed_bill_id === billId)
    if (existing) {
      await supabase
        .from('fixed_bill_payments')
        .update({ is_paid: !currentlyPaid, paid_at: !currentlyPaid ? new Date().toISOString() : null })
        .eq('id', existing.id)
    } else {
      await supabase.from('fixed_bill_payments').insert({
        user_id: user.id,
        fixed_bill_id: billId,
        month,
        year,
        is_paid: true,
        paid_at: new Date().toISOString(),
      })
    }
    await loadData()
  }

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCards = Object.values(cardTotals).reduce((sum, v) => sum + v, 0)
  const totalFixed = fixedBills.reduce((sum, b) => sum + b.amount, 0)
  const totalSaida = totalCards + totalFixed + expenseTotal
  const saldo = totalIncome - totalSaida

  if (loading || cardsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-200 rounded-2xl h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="flex justify-center mb-1">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <p className="text-xs text-green-700 font-medium mb-1">ENTRADA</p>
          <p className="font-bold text-green-700 text-sm">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <div className="flex justify-center mb-1">
            <TrendingDown size={18} className="text-red-600" />
          </div>
          <p className="text-xs text-red-700 font-medium mb-1">SAÍDA</p>
          <p className="font-bold text-red-700 text-sm">{fmt(totalSaida)}</p>
        </div>
        <div
          className={`rounded-2xl p-4 text-center border ${
            saldo >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex justify-center mb-1">
            <Wallet size={18} className={saldo >= 0 ? 'text-blue-600' : 'text-red-600'} />
          </div>
          <p className={`text-xs font-medium mb-1 ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            SALDO
          </p>
          <p className={`font-bold text-sm ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            {fmt(saldo)}
          </p>
        </div>
      </div>

      {/* Cartões de Crédito */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">💳 Cartões de Crédito</h3>
          <span className="text-sm font-semibold text-red-600">{fmt(totalCards)}</span>
        </div>
        {cards.filter((c) => c.is_active).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhum cartão ativo</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {cards
              .filter((c) => c.is_active)
              .map((card) => {
                const payment = cardPayments.find((p) => p.credit_card_id === card.id)
                const isPaid = payment?.is_paid ?? false
                const total = cardTotals[card.id] ?? 0
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: card.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">
                          {card.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Fecha {fmtDate(card.fechamento_dia)} · Vence{' '}
                          {fmtDate(card.vencimento_dia)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-semibold text-sm text-slate-800">
                        {fmt(total)}
                      </span>
                      <button
                        onClick={() => toggleCardPaid(card.id, isPaid)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          isPaid
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Circle size={12} />
                        )}
                        {isPaid ? 'Pago' : 'Pendente'}
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Contas Fixas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">📋 Contas Fixas</h3>
          <span className="text-sm font-semibold text-orange-600">{fmt(totalFixed)}</span>
        </div>
        {fixedBills.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            Nenhuma conta fixa cadastrada
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {fixedBills.map((bill) => {
              const payment = fixedPayments.find((p) => p.fixed_bill_id === bill.id)
              const isPaid = payment?.is_paid ?? false
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">
                      {bill.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Vence dia {bill.due_day}
                      {bill.is_installment &&
                        bill.installment_current &&
                        bill.installment_total && (
                          <span className="ml-2 text-blue-500">
                            {bill.installment_current}/{bill.installment_total}x
                          </span>
                        )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-semibold text-sm text-slate-800">
                      {fmt(bill.amount)}
                    </span>
                    <button
                      onClick={() => toggleFixedBillPaid(bill.id, isPaid)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        isPaid
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Circle size={12} />
                      )}
                      {isPaid ? 'Pago' : 'Pendente'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Receitas do Mês */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">💚 Receitas do Mês</h3>
          <span className="text-sm font-semibold text-green-600">{fmt(totalIncome)}</span>
        </div>
        {incomeTransactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            Nenhuma receita lançada
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {incomeTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {tx.categories && (
                      <span className="ml-2">{tx.categories.name}</span>
                    )}
                  </p>
                </div>
                <span className="font-semibold text-sm text-green-600 flex-shrink-0">
                  {fmt(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
