'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, CreditCard } from '@/lib/types'

const MONTHS_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface InstallmentRow {
  groupId: string
  description: string
  cardName: string
  cardColor: string
  months: Record<number, number> // month index (1-12) -> amount
  total: number
}

interface InstallmentProjectionProps {
  year: number
}

export default function InstallmentProjection({ year }: InstallmentProjectionProps) {
  const [rows, setRows] = useState<InstallmentRow[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<Record<number, number>>({})
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all cards
      const { data: cardsData } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
      setCards((cardsData as CreditCard[]) || [])

      const cardMap: Record<string, CreditCard> = {}
      ;((cardsData as CreditCard[]) || []).forEach((c) => {
        cardMap[c.id] = c
      })

      // Fetch all installment transactions in the year
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_installment', true)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

      const txList = (txs as Transaction[]) || []

      // Group by installment_group_id
      const groups: Record<string, Transaction[]> = {}
      txList.forEach((tx) => {
        const gid = tx.installment_group_id || tx.id
        if (!groups[gid]) groups[gid] = []
        groups[gid].push(tx)
      })

      const rowsData: InstallmentRow[] = []
      const totals: Record<number, number> = {}

      for (const [groupId, groupTxs] of Object.entries(groups)) {
        const firstTx = groupTxs[0]
        const card = firstTx.credit_card_id ? cardMap[firstTx.credit_card_id] : null
        const monthAmounts: Record<number, number> = {}
        let rowTotal = 0

        groupTxs.forEach((tx) => {
          const m = parseInt(tx.date.split('-')[1])
          monthAmounts[m] = (monthAmounts[m] || 0) + tx.amount
          rowTotal += tx.amount
          totals[m] = (totals[m] || 0) + tx.amount
        })

        rowsData.push({
          groupId,
          description: firstTx.description,
          cardName: card?.name ?? firstTx.payment_method,
          cardColor: card?.color ?? '#64748b',
          months: monthAmounts,
          total: rowTotal,
        })
      }

      setRows(rowsData)
      setMonthlyTotals(totals)
    } catch (err) {
      console.error('Erro ao buscar projeção:', err)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-slate-200 rounded-2xl h-48" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-slate-400">Nenhuma parcela encontrada para {year}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Projeção de Parcelas — {year}</h3>
        <p className="text-xs text-slate-500 mt-1">{rows.length} grupo(s) de parcelas</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 min-w-[160px]">
                Descrição
              </th>
              <th className="text-left px-3 py-3 font-semibold text-slate-600 min-w-[90px]">
                Cartão
              </th>
              {MONTHS_PT.map((m, i) => (
                <th
                  key={m}
                  className="text-right px-2 py-3 font-semibold text-slate-600 min-w-[70px]"
                >
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-semibold text-slate-600 min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.groupId} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700 font-medium truncate max-w-[160px]">
                  {row.description}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: row.cardColor }}
                    />
                    <span className="text-slate-500 truncate">{row.cardName}</span>
                  </div>
                </td>
                {MONTHS_PT.map((_, i) => {
                  const m = i + 1
                  const val = row.months[m]
                  return (
                    <td key={m} className="text-right px-2 py-2.5">
                      {val ? (
                        <span className="text-red-600 font-medium">{fmt(val)}</span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  )
                })}
                <td className="text-right px-4 py-2.5 font-semibold text-slate-800">
                  {fmt(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-700" colSpan={2}>
                Total Mensal
              </td>
              {MONTHS_PT.map((_, i) => {
                const m = i + 1
                const val = monthlyTotals[m] || 0
                return (
                  <td key={m} className="text-right px-2 py-3 font-bold text-red-600">
                    {val > 0 ? fmt(val) : <span className="text-slate-300">—</span>}
                  </td>
                )
              })}
              <td className="text-right px-4 py-3 font-bold text-slate-800">
                {fmt(Object.values(monthlyTotals).reduce((a, b) => a + b, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
