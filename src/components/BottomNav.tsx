'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart2, PlusCircle, Menu } from 'lucide-react'

const navItems = [
  { href: '/painel/', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/', label: 'Dashboard', icon: BarChart2 },
  { href: '/lancamentos/', label: 'Lançamentos', icon: PlusCircle },
  { href: '/mais/', label: 'Mais', icon: Menu },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg md:hidden">
      <div className="flex items-stretch h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href.slice(0, -1))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-blue-600' : 'text-slate-400'}
              />
              <span className={`font-medium ${isActive ? 'text-blue-600' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Desktop top nav (for md+ screens)
export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="hidden md:flex items-center h-14 px-6 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-2 mr-8">
        <span className="text-xl">💰</span>
        <span className="font-bold text-slate-800 text-lg">Home Bills</span>
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href.slice(0, -1))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
