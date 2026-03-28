'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Receivable } from '@/lib/types'

interface UseReceivablesReturn {
  receivables: Receivable[]
  loading: boolean
  fetchReceivables: () => Promise<void>
  addReceivable: (
    data: Omit<Receivable, 'id' | 'user_id' | 'created_at'>
  ) => Promise<{ error: string | null }>
  updateReceivable: (
    id: string,
    data: Partial<Receivable>
  ) => Promise<{ error: string | null }>
  toggleReceived: (id: string, isReceived: boolean) => Promise<void>
  deleteReceivable: (id: string) => Promise<void>
}

export function useReceivables(): UseReceivablesReturn {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReceivables = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('receivables')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReceivables((data as Receivable[]) || [])
    } catch (err) {
      console.error('Erro ao buscar recebíveis:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addReceivable = useCallback(
    async (
      data: Omit<Receivable, 'id' | 'user_id' | 'created_at'>
    ): Promise<{ error: string | null }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'Usuário não autenticado' }

      const { error } = await supabase.from('receivables').insert({
        user_id: user.id,
        ...data,
      })

      if (error) return { error: error.message }
      await fetchReceivables()
      return { error: null }
    },
    [fetchReceivables]
  )

  const updateReceivable = useCallback(
    async (
      id: string,
      data: Partial<Receivable>
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('receivables')
        .update(data)
        .eq('id', id)

      if (error) return { error: error.message }
      setReceivables((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      )
      return { error: null }
    },
    []
  )

  const toggleReceived = useCallback(
    async (id: string, isReceived: boolean) => {
      await supabase
        .from('receivables')
        .update({ is_received: isReceived })
        .eq('id', id)

      setReceivables((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_received: isReceived } : r))
      )
    },
    []
  )

  const deleteReceivable = useCallback(async (id: string) => {
    await supabase.from('receivables').delete().eq('id', id)
    setReceivables((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return {
    receivables,
    loading,
    fetchReceivables,
    addReceivable,
    updateReceivable,
    toggleReceived,
    deleteReceivable,
  }
}
