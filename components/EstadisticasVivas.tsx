'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Estadisticas {
  oraciones_hoy: number
  peticiones_activas: number
  intercesores_hoy: number
}

interface EstadisticasVivasProps {
  inicial: Estadisticas
}

export function EstadisticasVivas({ inicial }: EstadisticasVivasProps) {
  const [stats, setStats] = useState<Estadisticas>(inicial)

  useEffect(() => {
    // Actualizar stats cuando haya nuevas oraciones
    const channel = supabase
      .channel('stats-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'oraciones' },
        async () => {
          const { data } = await supabase.rpc('estadisticas_ontario')
          if (data) setStats(data)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
        <p className="text-2xl font-bold text-indigo-700">
          {stats.oraciones_hoy.toLocaleString('es-MX')}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">oraciones hoy</p>
      </div>
      <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
        <p className="text-2xl font-bold text-purple-700">
          {stats.peticiones_activas.toLocaleString('es-MX')}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">peticiones activas</p>
      </div>
      <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
        <p className="text-2xl font-bold text-green-700">
          {stats.intercesores_hoy.toLocaleString('es-MX')}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">intercesores hoy</p>
      </div>
    </div>
  )
}
