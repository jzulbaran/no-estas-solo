'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    // Supabase redirige aquí con el token en el hash de la URL
    // El SDK lo procesa automáticamente al inicializar
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error('El enlace de recuperación ha expirado')
        router.push('/auth')
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setListo(true)
      toast.success('¡Contraseña actualizada!')
      setTimeout(() => router.push('/'), 2000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setCargando(false)
    }
  }

  if (listo) {
    return (
      <div className="max-w-sm mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">✅</p>
        <h1 className="text-2xl font-bold text-slate-800">¡Contraseña actualizada!</h1>
        <p className="text-slate-500 text-sm">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 py-8">
      <div className="text-center">
        <p className="text-4xl mb-2">🔑</p>
        <h1 className="text-2xl font-bold text-slate-800">Nueva Contraseña</h1>
        <p className="text-slate-500 text-sm mt-1">Elige una nueva contraseña para tu cuenta</p>
      </div>

      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">Actualizar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nueva contraseña</label>
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
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Confirmar contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
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
              {cargando ? 'Guardando...' : '🔒 Guardar nueva contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
