'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Trash2, Plus, X, Loader2 } from 'lucide-react'
import { useReceivables } from '@/hooks/useReceivables'
import type { Receivable } from '@/lib/types'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function AddReceivableModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { addReceivable } = useReceivables()
  const [description, setDescription] = useState('')
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentCurrent, setInstallmentCurrent] = useState(1)
  const [installmentTotal, setInstallmentTotal] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount.replace(',', '.'))
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Informe um valor válido')
      return
    }
    if (!description.trim()) {
      setError('Informe uma descrição')
      return
    }
    if (!person.trim()) {
      setError('Informe o nome da pessoa')
      return
    }

    setSubmitting(true)
    const result = await addReceivable({
      description: description.trim(),
      person: person.trim(),
      amount: amountNum,
      due_date: dueDate || null,
      is_received: false,
      installment_current: isInstallment ? installmentCurrent : null,
      installment_total: isInstallment ? installmentTotal : null,
      notes: notes.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800">Novo A Receber</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Empréstimo João"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Pessoa *
            </label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Nome da pessoa"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Valor (R$) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))}
                placeholder="0,00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isInstallment ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              onClick={() => setIsInstallment(!isInstallment)}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isInstallment ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">Parcelado</span>
          </label>

          {isInstallment && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Parcela Atual
                </label>
                <input
                  type="number"
                  min={1}
                  value={installmentCurrent}
                  onChange={(e) => setInstallmentCurrent(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Total Parcelas
                </label>
                <input
                  type="number"
                  min={2}
                  value={installmentTotal}
                  onChange={(e) => setInstallmentTotal(parseInt(e.target.value) || 2)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opcional..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Salvar
          </button>
        </form>
      </div>
    </div>
  )
}

interface ReceivablesListProps {
  showAll?: boolean
}

export default function ReceivablesList({ showAll = true }: ReceivablesListProps) {
  const { receivables, loading, fetchReceivables, toggleReceived, deleteReceivable } =
    useReceivables()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchReceivables()
  }, [fetchReceivables])

  const pending = receivables.filter((r) => !r.is_received)
  const received = receivables.filter((r) => r.is_received)
  const totalPending = pending.reduce((sum, r) => sum + r.amount, 0)

  const display = showAll ? receivables : pending.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Total a Receber
          </p>
          <p className="font-bold text-blue-800 text-xl">{fmt(totalPending)}</p>
          <p className="text-xs text-blue-500 mt-0.5">
            {pending.length} pendente{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Novo
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 rounded-xl h-16" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-slate-400">Nenhum valor a receber</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending */}
          {pending.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Pendentes
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {pending.map((r) => (
                  <ReceivableRow
                    key={r.id}
                    receivable={r}
                    onToggle={() => toggleReceived(r.id, !r.is_received)}
                    onDelete={() => deleteReceivable(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Received (only if showAll) */}
          {showAll && received.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Recebidos
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {received.map((r) => (
                  <ReceivableRow
                    key={r.id}
                    receivable={r}
                    onToggle={() => toggleReceived(r.id, !r.is_received)}
                    onDelete={() => deleteReceivable(r.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <AddReceivableModal
          onClose={() => setModalOpen(false)}
          onSuccess={fetchReceivables}
        />
      )}
    </div>
  )
}

function ReceivableRow({
  receivable: r,
  onToggle,
  onDelete,
}: {
  receivable: Receivable
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors ${
        r.is_received ? 'opacity-60' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm text-slate-800 truncate ${
            r.is_received ? 'line-through' : ''
          }`}
        >
          {r.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-blue-600 font-medium">{r.person}</span>
          {r.due_date && (
            <span className="text-xs text-slate-400">
              Vence: {new Date(r.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
          {r.installment_current && r.installment_total && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
              {r.installment_current}/{r.installment_total}x
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`font-semibold text-sm ${
            r.is_received ? 'text-green-600' : 'text-blue-600'
          }`}
        >
          {fmt(r.amount)}
        </span>
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-green-600 transition-colors"
          title={r.is_received ? 'Marcar como pendente' : 'Marcar como recebido'}
        >
          {r.is_received ? (
            <CheckCircle2 size={18} className="text-green-600" />
          ) : (
            <Circle size={18} />
          )}
        </button>
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
