'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import DashboardCards from '@/components/DashboardCards'
import CashFlowChart from '@/components/CashFlowChart'
import MonthYearSelector from '@/components/MonthYearSelector'
import BottomNav, { TopNav } from '@/components/BottomNav'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'

function DashboardContent() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const { data, loading, fetchDashboard } = useDashboard()
  const { logout } = useAuth()

  useEffect(() => {
    fetchDashboard(month, year)
  }, [fetchDashboard, month, year])

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m)
    setYear(y)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm">Visão geral das finanças</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthYearSelector
              month={month}
              year={year}
              onChange={handleMonthChange}
            />
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <DashboardCards data={data} loading={loading} />

        {/* Chart */}
        <div className="mt-6">
          <CashFlowChart
            data={data?.monthlyTrend ?? []}
            loading={loading}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
