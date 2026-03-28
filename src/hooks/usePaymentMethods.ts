'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PaymentMethodRecord } from '@/lib/types'

export const DEFAULT_PAYMENT_METHODS = [
  { id: 'pix', name: 'PIX' },
  { id: 'dinheiro', name: 'Dinheiro' },
  { id: 'boleto', name: 'Boleto' },
  { id: 'debito', name: 'Débito' },
  { id: 'outro', name: 'Outro' },
]

interface UsePaymentMethodsReturn {
  customMethods: PaymentMethodRecord[]
  loading: boolean
  fetchPaymentMethods: () => Promise<void>
  addPaymentMethod: (name: string) => Promise<{ error: string | null }>
  deletePaymentMethod: (id: string) => Promise<void>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
}

export function usePaymentMethods(): UsePaymentMethodsReturn {
  const [customMethods, setCustomMethods] = useState<PaymentMethodRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setCustomMethods((data as PaymentMethodRecord[]) || [])
    } catch (err) {
      console.error('Erro ao buscar formas de pagamento:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addPaymentMethod = useCallback(
    async (name: string): Promise<{ error: string | null }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'Usuário não autenticado' }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert({ user_id: user.id, name: name.trim(), is_active: true })
        .select()
        .single()

      if (error) return { error: error.message }

      setCustomMethods((prev) => [...prev, data as PaymentMethodRecord])
      return { error: null }
    },
    []
  )

  const deletePaymentMethod = useCallback(async (id: string) => {
    await supabase.from('payment_methods').delete().eq('id', id)
    setCustomMethods((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    await supabase
      .from('payment_methods')
      .update({ is_active: isActive })
      .eq('id', id)

    setCustomMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: isActive } : m))
    )
  }, [])

  return {
    customMethods,
    loading,
    fetchPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    toggleActive,
  }
}
