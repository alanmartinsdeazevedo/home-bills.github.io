'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface MonthYearSelectorProps {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export default function MonthYearSelector({
  month,
  year,
  onChange,
}: MonthYearSelectorProps) {
  const handlePrev = () => {
    if (month === 1) {
      onChange(12, year - 1)
    } else {
      onChange(month - 1, year)
    }
  }

  const handleNext = () => {
    if (month === 12) {
      onChange(1, year + 1)
    } else {
      onChange(month + 1, year)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200">
      <button
        onClick={handlePrev}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-[160px] text-center">
        <span className="font-semibold text-slate-800">
          {MONTHS[month - 1]}
        </span>
        <span className="text-slate-500 ml-2 text-sm">{year}</span>
      </div>
      <button
        onClick={handleNext}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
