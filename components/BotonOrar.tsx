'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ContadorOraciones } from './ContadorOraciones'

interface BotonOrarProps {
  peticionId: string
  totalInicial: number
  onOro?: (peticionId: string, nuevoTotal: number) => void
  size?: 'default' | 'large'
}

export function BotonOrar({ peticionId, totalInicial, onOro, size = 'default' }: BotonOrarProps) {
  const [total, setTotal] = useState(totalInicial)
  const [yaOro, setYaOro] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [animando, setAnimando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function handleOrar() {
    if (yaOro || cargando) return

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Necesitas iniciar sesión para orar por esta petición', {
        action: {
          label: 'Iniciar Sesión',
          onClick: () => window.location.href = '/auth',
        },
      })
      return
    }

    setCargando(true)
    try {
      const { data, error } = await supabase.rpc('incrementar_oracion', {
        p_peticion_id: peticionId,
        p_intercesor_id: user.id,
        p_mensaje: size === 'large' && mensaje.trim() ? mensaje.trim() : null,
      })

      if (error) throw error

      if (data?.success) {
        const nuevoTotal = data.total_oraciones
        setTotal(nuevoTotal)
        setYaOro(true)
        setAnimando(true)
        setTimeout(() => setAnimando(false), 600)
        onOro?.(peticionId, nuevoTotal)
        toast.success('¡Gracias por orar! Tu oración fue registrada 🙏')
      } else if (data?.error === 'ya_oro') {
        setYaOro(true)
        toast.info('Ya oraste por esta petición anteriormente')
      }
    } catch {
      toast.error('No se pudo registrar tu oración. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (size === 'large') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <ContadorOraciones total={total} animando={animando} size="large" />

        {!yaOro && (
          <div className="w-full">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Opcional: deja un mensaje de aliento para quien oró..."
              maxLength={200}
              rows={2}
              className="w-full border border-indigo-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-indigo-50/50"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{mensaje.length}/200</p>
          </div>
        )}

        {yaOro && mensaje.trim() && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center w-full">
            <p className="text-xs text-green-700">💌 Tu mensaje de aliento fue enviado</p>
          </div>
        )}

        <Button
          onClick={handleOrar}
          disabled={yaOro || cargando}
          size="lg"
          className={`text-xl py-8 px-12 rounded-2xl font-bold shadow-lg transition-all ${
            yaOro
              ? 'bg-green-500 hover:bg-green-500 text-white cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
          }`}
        >
          {cargando ? (
            <span className="animate-pulse">Orando...</span>
          ) : yaOro ? (
            '✅ Oré por esto'
          ) : (
            '🙏 Oré por esto'
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <ContadorOraciones total={total} animando={animando} />
      <Button
        onClick={handleOrar}
        disabled={yaOro || cargando}
        size="sm"
        variant={yaOro ? 'secondary' : 'default'}
        className={`text-sm transition-all ${
          yaOro
            ? 'bg-green-100 text-green-700 hover:bg-green-100 cursor-default'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
        }`}
      >
        {cargando ? '...' : yaOro ? '✅ Oré' : '🙏 Orar'}
      </Button>
    </div>
  )
}
