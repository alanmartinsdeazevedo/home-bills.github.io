'use client'

import { useEffect, useState } from 'react'
import { Trash2, CheckCircle2, Circle, Plus, AlertTriangle, Layers } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import TransactionForm from '@/components/TransactionForm'
import type { Transaction } from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const PAYMENT_LABELS: Record<string, string> = {
  carrefour: 'Carrefour',
  assai: 'Assaí',
  nubank: 'Nubank',
  hiper: 'Hiper',
  santander: 'Santander',
  sams: 'Sams Club',
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  debito: 'Débito',
  outro: 'Outro',
}

interface DeleteConfirmProps {
  tx: Transaction
  onConfirm: () => void
  onConfirmGroup: () => void
  onCancel: () => void
}

function DeleteConfirm({ tx, onConfirm, onConfirmGroup, onCancel }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Excluir lançamento?</p>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{tx.description}</p>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Excluir apenas este
          </button>
          {tx.installment_group_id && (
            <button
              onClick={onConfirmGroup}
              className="w-full py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
            >
              <Layers size={14} />
              Excluir todas as parcelas
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

interface TransactionListProps {
  month: number
  year: number
}

export default function TransactionList({ month, year }: TransactionListProps) {
  const { transactions, loading, fetchTransactions, deleteTransaction, deleteInstallmentGroup, togglePaid } =
    useTransactions()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  useEffect(() => {
    fetchTransactions(month, year)
  }, [fetchTransactions, month, year])

  const handleDelete = async (tx: Transaction) => {
    setDeleteTarget(null)
    await deleteTransaction(tx.id)
  }

  const handleDeleteGroup = async (tx: Transaction) => {
    setDeleteTarget(null)
    if (tx.installment_group_id) {
      await deleteInstallmentGroup(tx.installment_group_id)
    }
  }

  const filtered = transactions.filter((t) => {
    if (filter === 'all') return true
    return t.type === filter
  })

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
          <p className="text-xs text-green-600 font-medium">Receitas</p>
          <p className="font-bold text-green-700 text-sm">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
          <p className="text-xs text-red-600 font-medium">Despesas</p>
          <p className="font-bold text-red-700 text-sm">{fmt(totalExpense)}</p>
        </div>
        <div
          className={`rounded-xl px-3 py-2 text-center border ${
            totalIncome - totalExpense >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={`text-xs font-medium ${
              totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            Saldo
          </p>
          <p
            className={`font-bold text-sm ${
              totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            {fmt(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Lançamento</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-200 rounded-xl h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-400">Nenhum lançamento encontrado</p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-3 text-blue-600 text-sm font-medium hover:underline"
          >
            Adicionar lançamento
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Forma Pgto</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Parcela</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Valor</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${
                      tx.type === 'income' ? 'bg-green-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-[180px] truncate">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {tx.categories ? (
                        <span className="flex items-center gap-1">
                          <span>{tx.categories.icon}</span>
                          {tx.categories.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {PAYMENT_LABELS[tx.payment_method] || tx.payment_method}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400">
                      {tx.is_installment && tx.installment_current && tx.installment_total
                        ? `${tx.installment_current}/${tx.installment_total}`
                        : '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePaid(tx.id, !tx.is_paid)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          tx.is_paid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tx.is_paid ? 'Pago' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDeleteTarget(tx)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className={`bg-white rounded-xl border shadow-sm p-4 ${
                  tx.type === 'income' ? 'border-green-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {tx.categories && (
                        <span className="text-xs text-slate-500">
                          {tx.categories.icon} {tx.categories.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {PAYMENT_LABELS[tx.payment_method]}
                      </span>
                      {tx.is_installment && tx.installment_current && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                          {tx.installment_current}/{tx.installment_total}x
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {fmt(tx.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePaid(tx.id, !tx.is_paid)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                      >
                        {tx.is_paid ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tx)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Floating add button (mobile) */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 right-5 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Plus size={24} />
      </button>

      {/* Forms + dialogs */}
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => fetchTransactions(month, year)}
      />

      {deleteTarget && (
        <DeleteConfirm
          tx={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onConfirmGroup={() => handleDeleteGroup(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
