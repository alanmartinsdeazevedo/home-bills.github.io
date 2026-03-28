'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import MonthlyPanel from '@/components/MonthlyPanel'
import MonthYearSelector from '@/components/MonthYearSelector'
import BottomNav, { TopNav } from '@/components/BottomNav'

function PainelContent() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel Mensal</h1>
            <p className="text-slate-500 text-sm">Cartões, contas e receitas do mês</p>
          </div>
          <MonthYearSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />
        </div>
        <MonthlyPanel month={month} year={year} />
      </main>
      <BottomNav />
    </div>
  )
}

export default function PainelPage() {
  return (
    <AuthGuard>
      <PainelContent />
    </AuthGuard>
  )
}
