'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCreditCards } from '@/hooks/useCreditCards'
import type { TransactionType, PaymentMethod } from '@/lib/types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'carrefour', label: 'Cartão Carrefour' },
  { value: 'assai', label: 'Cartão Assaí' },
  { value: 'nubank', label: 'Cartão Nubank' },
  { value: 'hiper', label: 'Cartão Hiper' },
  { value: 'santander', label: 'Cartão Santander' },
  { value: 'sams', label: 'Cartão Sams Club' },
  { value: 'outro', label: 'Outro' },
]

const CARD_METHODS: PaymentMethod[] = ['carrefour', 'assai', 'nubank', 'hiper', 'santander', 'sams']

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialType?: TransactionType
}

export default function TransactionForm({
  open,
  onClose,
  onSuccess,
  initialType = 'expense',
}: TransactionFormProps) {
  const { categories, addTransaction } = useTransactions()
  const { cards, fetchCards } = useCreditCards()

  const [type, setType] = useState<TransactionType>(initialType)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [creditCardId, setCreditCardId] = useState('')
  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentTotal, setInstallmentTotal] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchCards()
      setError('')
    }
  }, [open, fetchCards])

  useEffect(() => {
    setType(initialType)
  }, [initialType])

  // Reset credit card when payment method changes
  const isCardMethod = CARD_METHODS.includes(paymentMethod)
  useEffect(() => {
    if (!isCardMethod) {
      setCreditCardId('')
      setIsInstallment(false)
    }
    // Auto-select credit card by payment method
    if (isCardMethod && cards.length > 0) {
      const methodToCardName: Record<string, string> = {
        carrefour: 'Carrefour',
        assai: 'Assaí',
        nubank: 'Nubank',
        hiper: 'Hiper',
        santander: 'Santander',
        sams: 'Sams Club',
      }
      const targetName = methodToCardName[paymentMethod]
      const found = cards.find((c) =>
        c.name.toLowerCase().includes(targetName?.toLowerCase() ?? '')
      )
      if (found) setCreditCardId(found.id)
    }
  }, [paymentMethod, isCardMethod, cards])

  const filteredCategories = categories.filter((c) => c.type === type)

  const handleAmountChange = (val: string) => {
    // Allow only numbers and comma/dot
    const cleaned = val.replace(/[^\d,]/g, '').replace(',', '.')
    setAmount(cleaned)
  }

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

    setSubmitting(true)
    const result = await addTransaction({
      type,
      amount: amountNum,
      category_id: categoryId || null,
      description: description.trim(),
      date,
      payment_method: paymentMethod,
      credit_card_id: creditCardId || null,
      is_installment: isInstallment && isCardMethod && !!creditCardId,
      installment_total:
        isInstallment && isCardMethod && !!creditCardId ? installmentTotal : null,
      notes: notes.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      // Reset form
      setAmount('')
      setDescription('')
      setNotes('')
      setCategoryId('')
      setPaymentMethod('pix')
      setCreditCardId('')
      setIsInstallment(false)
      setInstallmentTotal(2)
      onSuccess()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800 text-lg">Novo Lançamento</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              ↑ Receita
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-l border-slate-200 ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              ↓ Despesa
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Valor (R$) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Date + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecionar...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Descrição *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado Extra"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Payment method (expense only) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Credit card select */}
          {type === 'expense' && isCardMethod && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Cartão de Crédito
              </label>
              <select
                value={creditCardId}
                onChange={(e) => setCreditCardId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecionar cartão...</option>
                {cards
                  .filter((c) => c.is_active)
                  .map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Installment toggle */}
          {type === 'expense' && isCardMethod && creditCardId && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
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
                <span className="text-sm font-medium text-slate-700">
                  Parcelado
                </span>
              </label>
              {isInstallment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={48}
                    value={installmentTotal}
                    onChange={(e) =>
                      setInstallmentTotal(parseInt(e.target.value) || 2)
                    }
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 ml-2">
                    × {amount ? fmt(parseFloat(amount.replace(',', '.')) || 0) : 'R$ 0,00'} ={' '}
                    {amount
                      ? fmt(
                          (parseFloat(amount.replace(',', '.')) || 0) *
                            installmentTotal
                        )
                      : 'R$ 0,00'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              type === 'income'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              `Salvar ${type === 'income' ? 'Receita' : 'Despesa'}`
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
