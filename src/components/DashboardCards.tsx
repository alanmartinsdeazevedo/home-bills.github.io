'use client'

import type { DashboardData } from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function ProgressBar({ value, color }: { value: number; color: string }) {
  const capped = Math.min(value, 100)
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${capped}%`, backgroundColor: color }}
      />
    </div>
  )
}

interface DashboardCardsProps {
  data: DashboardData | null
  loading: boolean
}

export default function DashboardCards({ data, loading }: DashboardCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-200 rounded-2xl h-28" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const summaryCards = [
    {
      label: 'Receita Total',
      value: data.totalIncome,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      icon: '↑',
    },
    {
      label: 'Total Cartões',
      value: data.totalCards,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      icon: '💳',
    },
    {
      label: 'Contas Fixas',
      value: data.totalFixedBills,
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa',
      icon: '📋',
    },
    {
      label: 'Saldo Disponível',
      value: data.balance,
      color: data.balance >= 0 ? '#16a34a' : '#dc2626',
      bg: data.balance >= 0 ? '#f0fdf4' : '#fef2f2',
      border: data.balance >= 0 ? '#bbf7d0' : '#fecaca',
      icon: '💰',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 border shadow-sm transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: card.bg,
              borderColor: card.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.label}
              </span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <p
              className="text-xl font-bold"
              style={{ color: card.color }}
            >
              {fmt(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Card Breakdown */}
      {data.cardBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Faturas dos Cartões</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {data.cardBreakdown.map(({ card, total, isPaid }) => (
              <div
                key={card.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: card.color }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {card.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    vence dia {card.vencimento_dia}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">{fmt(total)}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Comprometimento da Renda</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Cartões de Crédito</span>
              <span className="font-semibold text-red-600">
                {data.cardsPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={data.cardsPercentage} color="#dc2626" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Contas Fixas</span>
              <span className="font-semibold text-orange-600">
                {data.fixedBillsPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={data.fixedBillsPercentage} color="#ea580c" />
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">Total Comprometido</span>
              <span
                className={`font-bold ${
                  data.totalPercentage > 80
                    ? 'text-red-600'
                    : data.totalPercentage > 60
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              >
                {data.totalPercentage.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={data.totalPercentage}
              color={
                data.totalPercentage > 80
                  ? '#dc2626'
                  : data.totalPercentage > 60
                  ? '#ea580c'
                  : '#16a34a'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
