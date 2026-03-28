'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const { login, signup } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const result = await login(email, password)
      if (result.error) {
        setError(translateError(result.error))
        setLoading(false)
      } else {
        router.push('/dashboard/')
      }
    } else {
      const result = await signup(email, password)
      if (result.error) {
        setError(translateError(result.error))
        setLoading(false)
      } else {
        setSuccessMsg(
          'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
        )
        setLoading(false)
      }
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setSuccessMsg('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💰</div>
          <h1 className="text-3xl font-bold text-white">Home Bills</h1>
          <p className="text-slate-400 mt-1 text-sm">Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                {successMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-500">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
              <button
                onClick={toggleMode}
                className="ml-1.5 text-blue-600 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Seus dados são seguros e privados
        </p>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar'
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado'
  if (msg.includes('Password should be')) return 'Senha muito fraca. Use pelo menos 6 caracteres'
  return msg
}
