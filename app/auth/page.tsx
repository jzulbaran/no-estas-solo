'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AuthPage() {
  const router = useRouter()
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)

    try {
      if (modo === 'registro') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: nombre || 'Anónimo' },
          },
        })
        if (error) throw error
        setEmailEnviado(true)
        toast.success('¡Revisa tu email para confirmar tu cuenta!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('¡Bienvenido/a de vuelta! 🙏')
        router.push('/')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos')
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Confirma tu email antes de iniciar sesión')
      } else {
        toast.error(msg)
      }
    } finally {
      setCargando(false)
    }
  }

  if (emailEnviado) {
    return (
      <div className="max-w-sm mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">📬</p>
        <h1 className="text-2xl font-bold text-slate-800">Revisa tu email</h1>
        <p className="text-slate-600">
          Enviamos un link de confirmación a <strong>{email}</strong>
        </p>
        <p className="text-slate-500 text-sm">
          Confirma tu cuenta y luego inicia sesión
        </p>
        <Button onClick={() => setModo('login')} variant="outline" className="mt-4">
          Ir a Iniciar Sesión
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">🕊️</p>
        <h1 className="text-2xl font-bold text-slate-800">
          {modo === 'login' ? 'Iniciar Sesión' : 'Unirse a la Comunidad'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {modo === 'login'
            ? 'Bienvenido/a de vuelta'
            : 'Únete a la red de oración hispana en Ontario'}
        </p>
      </div>

      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">
            {modo === 'login' ? 'Acceder a tu cuenta' : 'Crear cuenta gratuita'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'registro' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  ¿Cómo quieres que te llamen? (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre o apodo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Si lo dejas vacío, aparecerás como "Anónimo"
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={cargando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5"
            >
              {cargando
                ? 'Cargando...'
                : modo === 'login'
                ? '🔓 Iniciar Sesión'
                : '🙏 Unirme a la comunidad'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <button
          onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
          className="text-sm text-indigo-600 hover:text-indigo-800 underline"
        >
          {modo === 'login'
            ? '¿No tienes cuenta? Regístrate aquí'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Tu privacidad es importante. Nunca compartimos tu información personal.
      </p>
    </div>
  )
}
