'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CreditCard } from '@/lib/types'

interface UseCardsReturn {
  cards: CreditCard[]
  loading: boolean
  fetchCards: () => Promise<void>
  addCard: (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>
  updateCard: (id: string, data: Partial<CreditCard>) => Promise<{ error: string | null }>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
}

export function useCreditCards(): UseCardsReturn {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('name')

      if (error) throw error
      setCards((data as CreditCard[]) || [])
    } catch (err) {
      console.error('Erro ao buscar cartões:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addCard = useCallback(
    async (
      data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>
    ): Promise<{ error: string | null }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'Usuário não autenticado' }

      const { error } = await supabase.from('credit_cards').insert({
        user_id: user.id,
        ...data,
      })

      if (error) return { error: error.message }

      await fetchCards()
      return { error: null }
    },
    [fetchCards]
  )

  const updateCard = useCallback(
    async (
      id: string,
      data: Partial<CreditCard>
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('credit_cards')
        .update(data)
        .eq('id', id)

      if (error) return { error: error.message }

      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      )
      return { error: null }
    },
    []
  )

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    await supabase
      .from('credit_cards')
      .update({ is_active: isActive })
      .eq('id', id)

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c))
    )
  }, [])

  return { cards, loading, fetchCards, addCard, updateCard, toggleActive }
}
