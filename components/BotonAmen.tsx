'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BotonAmenProps {
  devocionalId: string
  totalInicial: number
  onAmen?: (devocionalId: string, nuevoTotal: number) => void
}

export function BotonAmen({ devocionalId, totalInicial, onAmen }: BotonAmenProps) {
  const [total, setTotal] = useState(totalInicial)
  const [yaDijoAmen, setYaDijoAmen] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleAmen() {
    if (yaDijoAmen || cargando) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Necesitas iniciar sesión', {
        action: { label: 'Iniciar Sesión', onClick: () => window.location.href = '/auth' },
      })
      return
    }

    setCargando(true)
    try {
      const { data, error } = await supabase.rpc('registrar_amen', {
        p_devocional_id: devocionalId,
        p_perfil_id: user.id,
      })

      if (error) throw error

      if (data?.success) {
        setTotal(data.total_amenes)
        setYaDijoAmen(true)
        onAmen?.(devocionalId, data.total_amenes)
        toast.success('¡Amén! 🙌')
      } else if (data?.error === 'ya_dijo_amen') {
        setYaDijoAmen(true)
      }
    } catch {
      toast.error('No se pudo registrar tu Amén. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      onClick={handleAmen}
      disabled={yaDijoAmen || cargando}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        yaDijoAmen
          ? 'bg-amber-100 text-amber-700 cursor-default'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 border border-amber-200'
      }`}
    >
      <span>🙌</span>
      <span>{cargando ? '...' : yaDijoAmen ? 'Amén dicho' : 'Amén'}</span>
      <span className="font-bold">{total.toLocaleString('es-MX')}</span>
    </button>
  )
}
