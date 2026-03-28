'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import InstallmentProjection from '@/components/InstallmentProjection'
import ReceivablesList from '@/components/ReceivablesList'
import BottomNav, { TopNav } from '@/components/BottomNav'
import { useCreditCards } from '@/hooks/useCreditCards'
import { supabase } from '@/lib/supabase'
import type { CreditCard, FixedBill } from '@/lib/types'
import { Plus, X, Loader2, Pencil, Power } from 'lucide-react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

// ─── Credit Cards Tab ────────────────────────────────────────────────────────

function CardForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreditCard>
  onSave: (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [fechamento, setFechamento] = useState(initial?.fechamento_dia ?? 1)
  const [vencimento, setVencimento] = useState(initial?.vencimento_dia ?? 10)
  const [color, setColor] = useState(initial?.color ?? '#2563eb')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      fechamento_dia: fechamento,
      vencimento_dia: vencimento,
      color,
      is_active: initial?.is_active ?? true,
    })
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Nubank"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Fechamento (dia)
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={fechamento}
            onChange={(e) => setFechamento(parseInt(e.target.value) || 1)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Vencimento (dia)
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={vencimento}
            onChange={(e) => setVencimento(parseInt(e.target.value) || 10)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Cor
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 border border-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {initial?.name ? 'Salvar' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function CartoesTab() {
  const { cards, loading, fetchCards, addCard, updateCard, toggleActive } =
    useCreditCards()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const handleAdd = async (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
    await addCard(data)
    setShowForm(false)
  }

  const handleEdit = async (
    id: string,
    data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>
  ) => {
    await updateCard(id, data)
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-200 rounded-xl h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Novo Cartão'}
        </button>
      </div>

      {showForm && (
        <CardForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400">Nenhum cartão cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
          {cards.map((card) => (
            <div key={card.id}>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: card.color }}
                  />
                  <div>
                    <p
                      className={`font-medium text-sm ${
                        card.is_active ? 'text-slate-800' : 'text-slate-400 line-through'
                      }`}
                    >
                      {card.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Fecha dia {card.fechamento_dia} · Vence dia {card.vencimento_dia}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(editingId === card.id ? null : card.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(card.id, !card.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      card.is_active
                        ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                        : 'hover:bg-green-50 text-slate-300 hover:text-green-500'
                    }`}
                    title={card.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </div>
              {editingId === card.id && (
                <div className="px-4 pb-4">
                  <CardForm
                    initial={card}
                    onSave={(data) => handleEdit(card.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fixed Bills Tab ──────────────────────────────────────────────────────────

interface FixedBillFormData {
  name: string
  amount: number
  due_day: number
  is_installment: boolean
  installment_current: number | null
  installment_total: number | null
  is_active: boolean
}

function FixedBillForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<FixedBill>
  onSave: (data: FixedBillFormData) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [dueDay, setDueDay] = useState(initial?.due_day ?? 10)
  const [isInstallment, setIsInstallment] = useState(initial?.is_installment ?? false)
  const [installCurrent, setInstallCurrent] = useState(initial?.installment_current ?? 1)
  const [installTotal, setInstallTotal] = useState(initial?.installment_total ?? 12)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      amount: parseFloat(amount.replace(',', '.')) || 0,
      due_day: dueDay,
      is_installment: isInstallment,
      installment_current: isInstallment ? installCurrent : null,
      installment_total: isInstallment ? installTotal : null,
      is_active: initial?.is_active ?? true,
    })
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Água CAERN"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Valor (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))}
            placeholder="0,00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
            Vencimento (dia)
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(parseInt(e.target.value) || 10)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
              Parcela Atual
            </label>
            <input
              type="number"
              min={1}
              value={installCurrent}
              onChange={(e) => setInstallCurrent(parseInt(e.target.value) || 1)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
              Total
            </label>
            <input
              type="number"
              min={2}
              value={installTotal}
              onChange={(e) => setInstallTotal(parseInt(e.target.value) || 12)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {initial?.name ? 'Salvar' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function ContasFixasTab() {
  const [bills, setBills] = useState<FixedBill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchBills = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('fixed_bills')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day')
    setBills((data as FixedBill[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const handleAdd = async (data: FixedBillFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('fixed_bills').insert({ user_id: user.id, category_id: null, ...data })
    setShowForm(false)
    fetchBills()
  }

  const handleEdit = async (id: string, data: FixedBillFormData) => {
    await supabase.from('fixed_bills').update(data).eq('id', id)
    setEditingId(null)
    fetchBills()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('fixed_bills').update({ is_active: isActive }).eq('id', id)
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: isActive } : b))
    )
  }

  const totalActive = bills
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + b.amount, 0)

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-200 rounded-xl h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
          <p className="text-xs text-orange-600 font-medium">Total Mensal</p>
          <p className="font-bold text-orange-700">{fmt(totalActive)}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nova Conta'}
        </button>
      </div>

      {showForm && (
        <FixedBillForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400">Nenhuma conta fixa cadastrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
          {bills.map((bill) => (
            <div key={bill.id}>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      bill.is_active ? 'text-slate-800' : 'text-slate-400 line-through'
                    }`}
                  >
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
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold text-sm ${
                      bill.is_active ? 'text-orange-600' : 'text-slate-400'
                    }`}
                  >
                    {fmt(bill.amount)}
                  </span>
                  <button
                    onClick={() =>
                      setEditingId(editingId === bill.id ? null : bill.id)
                    }
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(bill.id, !bill.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      bill.is_active
                        ? 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                        : 'hover:bg-green-50 text-slate-300 hover:text-green-500'
                    }`}
                  >
                    <Power size={14} />
                  </button>
                </div>
              </div>
              {editingId === bill.id && (
                <div className="px-4 pb-4">
                  <FixedBillForm
                    initial={bill}
                    onSave={(data) => handleEdit(bill.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'parcelas' | 'receber' | 'cartoes' | 'contas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'parcelas', label: 'Parcelas' },
  { id: 'receber', label: 'A Receber' },
  { id: 'cartoes', label: 'Cartões' },
  { id: 'contas', label: 'Contas Fixas' },
]

function MaisContent() {
  const [activeTab, setActiveTab] = useState<Tab>('parcelas')
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Mais</h1>
          <p className="text-slate-500 text-sm">Parcelas, recebíveis, cartões e contas</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'parcelas' && <InstallmentProjection year={year} />}
        {activeTab === 'receber' && <ReceivablesList showAll />}
        {activeTab === 'cartoes' && <CartoesTab />}
        {activeTab === 'contas' && <ContasFixasTab />}
      </main>
      <BottomNav />
    </div>
  )
}

export default function MaisPage() {
  return (
    <AuthGuard>
      <MaisContent />
    </AuthGuard>
  )
}
