'use client'

import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { seedUserData } from '@/lib/seed'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }

  const signup = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setLoading(false)
      return { error: error.message }
    }
    if (data.user) {
      await seedUserData(data.user.id)
    }
    setLoading(false)
    return { error: null }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
  }

  return { user, session, loading, login, signup, logout }
}
