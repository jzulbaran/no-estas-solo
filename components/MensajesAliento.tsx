'use client'

import { useEffect, useState } from 'react'
import { supabase, MensajeAliento } from '@/lib/supabase'

interface MensajesAlientoProps {
  peticionId: string
}

export function MensajesAliento({ peticionId }: MensajesAlientoProps) {
  const [mensajes, setMensajes] = useState<MensajeAliento[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('mensajes_aliento')
        .select('*, perfiles(nombre_display, ciudad)')
        .eq('peticion_id', peticionId)
        .order('created_at', { ascending: false })

      setMensajes((data as MensajeAliento[]) || [])
      setCargando(false)
    }
    cargar()
  }, [peticionId])

  if (cargando || mensajes.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
        💌 Mensajes de aliento ({mensajes.length})
      </p>
      {mensajes.map((m) => (
        <div key={m.id} className="bg-indigo-50 rounded-lg p-3">
          <p className="text-sm text-slate-700 italic">&ldquo;{m.mensaje}&rdquo;</p>
          <p className="text-xs text-slate-400 mt-1">
            — {m.perfiles?.nombre_display || 'Anónimo'}
            {m.perfiles?.ciudad ? `, ${m.perfiles.ciudad}` : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
