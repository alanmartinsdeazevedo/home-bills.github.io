'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Household, HouseholdMember, HouseholdInvite } from '@/lib/types'

interface UseHouseholdReturn {
  household: Household | null
  members: HouseholdMember[]
  invites: HouseholdInvite[]
  loading: boolean
  fetchHousehold: () => Promise<void>
  createInvite: () => Promise<string | null>
  acceptInvite: (token: string) => Promise<{ error: string | null }>
  removeMember: (userId: string) => Promise<void>
  getInviteUrl: (token: string) => string
}

export function useHousehold(): UseHouseholdReturn {
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [loading, setLoading] = useState(false)

  // Busca o grupo familiar do usuário autenticado.
  // Se o usuário for membro de múltiplos grupos (ex: tem seu próprio grupo
  // e entrou no grupo do cônjuge), prefere o grupo onde role='member'
  // (ou seja, onde foi convidado). Caso contrário, usa o primeiro encontrado.
  const fetchHousehold = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Busca todos os grupos do usuário ordenados por joined_at
      const { data: memberRows } = await supabase
        .from('household_members')
        .select('household_id, role, joined_at')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })

      if (!memberRows || memberRows.length === 0) {
        setHousehold(null)
        setMembers([])
        setInvites([])
        return
      }

      // Prefere o grupo onde entrou como membro convidado (role='member').
      // Se não houver, usa o primeiro (o próprio grupo criado no signup).
      const preferredRow =
        memberRows.find((r) => r.role === 'member') ?? memberRows[0]

      const householdId = preferredRow.household_id

      // Busca os dados do grupo
      const { data: hh } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single()

      setHousehold(hh as Household)

      // Busca os membros do grupo
      const { data: allMembers } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId)
        .order('joined_at', { ascending: true })

      setMembers((allMembers as HouseholdMember[]) ?? [])

      // Busca convites pendentes (ainda não aceitos e não expirados)
      const { data: pendingInvites } = await supabase
        .from('household_invites')
        .select('*')
        .eq('household_id', householdId)
        .is('accepted_by', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      setInvites((pendingInvites as HouseholdInvite[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  // Cria um novo convite para o grupo familiar.
  // Retorna o token do convite gerado ou null em caso de erro.
  const createInvite = useCallback(async (): Promise<string | null> => {
    if (!household) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('household_invites')
      .insert({
        household_id: household.id,
        invited_by: user.id,
      })
      .select('token')
      .single()

    if (error || !data) {
      console.error('Erro ao criar convite:', error)
      return null
    }

    // Atualiza a lista de convites localmente
    await fetchHousehold()

    return data.token as string
  }, [household, fetchHousehold])

  // Retorna a URL completa de convite a partir de um token
  const getInviteUrl = useCallback((token: string): string => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost:3000'
    return `${origin}/convite/?token=${token}`
  }, [])

  // Aceita um convite via token.
  // Adiciona o usuário ao grupo familiar e marca o convite como aceito.
  // Se o usuário tiver um grupo próprio com apenas ele mesmo, remove esse grupo.
  const acceptInvite = useCallback(
    async (token: string): Promise<{ error: string | null }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'Você precisa estar autenticado.' }

      // Busca o convite pelo token
      const { data: invite, error: inviteError } = await supabase
        .from('household_invites')
        .select('*')
        .eq('token', token)
        .single()

      if (inviteError || !invite) {
        return { error: 'Convite não encontrado ou inválido.' }
      }

      // Verifica se o convite já foi aceito
      if (invite.accepted_by) {
        return { error: 'Este convite já foi utilizado.' }
      }

      // Verifica se o convite expirou
      if (new Date(invite.expires_at) < new Date()) {
        return { error: 'Este convite expirou.' }
      }

      // Verifica se o usuário já é membro deste grupo
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', invite.household_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        return { error: 'Você já faz parte deste grupo familiar.' }
      }

      // Tenta remover o grupo próprio do usuário se estiver vazio
      // (criado automaticamente no cadastro, com apenas ele mesmo)
      const { data: ownMembership } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .eq('role', 'owner')

      if (ownMembership && ownMembership.length > 0) {
        for (const row of ownMembership) {
          // Conta quantos membros tem nesse grupo
          const { count } = await supabase
            .from('household_members')
            .select('user_id', { count: 'exact', head: true })
            .eq('household_id', row.household_id)

          // Se só tem o próprio usuário, remove o grupo vazio
          if (count === 1) {
            await supabase
              .from('households')
              .delete()
              .eq('id', row.household_id)
              .eq('owner_id', user.id)
          }
        }
      }

      // Adiciona o usuário como membro do grupo familiar convidado
      const { error: insertError } = await supabase
        .from('household_members')
        .insert({
          household_id: invite.household_id,
          user_id: user.id,
          role: 'member',
        })

      if (insertError) {
        console.error('Erro ao entrar no grupo:', insertError)
        return { error: 'Erro ao entrar no grupo familiar. Tente novamente.' }
      }

      // Marca o convite como aceito
      await supabase
        .from('household_invites')
        .update({
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('token', token)

      return { error: null }
    },
    []
  )

  // Remove um membro do grupo familiar (apenas o dono pode fazer isso)
  const removeMember = useCallback(
    async (userId: string): Promise<void> => {
      if (!household) return

      await supabase
        .from('household_members')
        .delete()
        .eq('household_id', household.id)
        .eq('user_id', userId)

      await fetchHousehold()
    },
    [household, fetchHousehold]
  )

  return {
    household,
    members,
    invites,
    loading,
    fetchHousehold,
    createInvite,
    acceptInvite,
    removeMember,
    getInviteUrl,
  }
}
