'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

// ─── Conteúdo da página de convite ───────────────────────────
// Separado em componente próprio pois useSearchParams requer Suspense

function ConviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { acceptInvite } = useHousehold()

  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Se o usuário não estiver autenticado, salva o token no localStorage
  // e redireciona para o login para que possa aceitar após o login
  const handleLoginRedirect = () => {
    if (token) {
      localStorage.setItem('pendingInviteToken', token)
    }
    router.push('/login/')
  }

  const handleAccept = async () => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Token de convite inválido.')
      return
    }
    setStatus('loading')
    const { error } = await acceptInvite(token)
    if (error) {
      setStatus('error')
      setErrorMsg(error)
    } else {
      // Limpa qualquer token pendente do localStorage
      localStorage.removeItem('pendingInviteToken')
      setStatus('success')
      // Redireciona ao dashboard após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/')
      }, 2000)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Users size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Convite Familiar</h1>
          <p className="text-slate-500 text-sm mt-1">Home Bills</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {!token ? (
            // Token ausente
            <div className="text-center space-y-3">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <p className="font-semibold text-slate-700">Link inválido</p>
              <p className="text-slate-500 text-sm">
                O link de convite é inválido ou está incompleto.
              </p>
            </div>
          ) : !user ? (
            // Usuário não autenticado
            <div className="text-center space-y-4">
              <p className="text-slate-700 font-semibold text-lg">
                Você foi convidado para compartilhar um grupo familiar
              </p>
              <p className="text-slate-500 text-sm">
                Para aceitar o convite, você precisa criar uma conta ou fazer login primeiro.
                O convite será aceito automaticamente após o login.
              </p>
              <button
                onClick={handleLoginRedirect}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Criar conta / Fazer login
              </button>
            </div>
          ) : status === 'success' ? (
            // Convite aceito com sucesso
            <div className="text-center space-y-3">
              <CheckCircle size={48} className="text-green-500 mx-auto" />
              <p className="font-bold text-slate-800 text-lg">
                Bem-vindo ao grupo familiar!
              </p>
              <p className="text-slate-500 text-sm">
                Você agora tem acesso a todos os dados financeiros compartilhados.
                Redirecionando para o painel...
              </p>
              <Loader2 size={20} className="animate-spin text-blue-600 mx-auto" />
            </div>
          ) : status === 'error' ? (
            // Erro ao aceitar convite
            <div className="text-center space-y-4">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <p className="font-semibold text-slate-700">{errorMsg}</p>
              <button
                onClick={() => router.push('/dashboard/')}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Ir para o painel
              </button>
            </div>
          ) : (
            // Estado inicial: mostrar botão de aceitar
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-slate-700 font-semibold text-lg">
                  Você foi convidado para compartilhar um grupo familiar
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Ao aceitar, você terá acesso completo a todos os dados
                  financeiros do grupo: transações, cartões, contas fixas e mais.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-blue-800 text-sm font-medium">
                  Logado como: {user.email}
                </p>
              </div>

              <button
                onClick={handleAccept}
                disabled={status === 'loading'}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {status === 'loading' && <Loader2 size={18} className="animate-spin" />}
                Aceitar convite
              </button>

              <button
                onClick={() => router.push('/dashboard/')}
                className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                Recusar e ir para o painel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página exportada com Suspense boundary ───────────────────
// Necessário para useSearchParams em exportação estática (Next.js)

export default function ConvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      }
    >
      <ConviteContent />
    </Suspense>
  )
}
