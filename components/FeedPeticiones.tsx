'use client'

import { useEffect, useState } from 'react'
import { supabase, Peticion } from '@/lib/supabase'
import { PeticionCard } from './PeticionCard'

interface FeedPeticionesProps {
  initialPeticiones: Peticion[]
}

export function FeedPeticiones({ initialPeticiones }: FeedPeticionesProps) {
  const [peticiones, setPeticiones] = useState<Peticion[]>(initialPeticiones)

  useEffect(() => {
    // Suscripción en tiempo real a nuevas peticiones
    const channel = supabase
      .channel('peticiones-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peticiones',
        },
        async (payload) => {
          // Obtener petición completa con perfil
          const { data } = await supabase
            .from('peticiones')
            .select('*, perfiles(nombre_display, ciudad)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setPeticiones((prev) => [data as Peticion, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'peticiones',
        },
        (payload) => {
          setPeticiones((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, total_oraciones: payload.new.total_oraciones } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function handleOro(peticionId: string, nuevoTotal: number) {
    setPeticiones((prev) =>
      prev.map((p) => (p.id === peticionId ? { ...p, total_oraciones: nuevoTotal } : p))
    )
  }

  if (peticiones.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">🙏</p>
        <p className="text-lg font-medium">Aún no hay peticiones activas</p>
        <p className="text-sm mt-1">¡Sé el primero en compartir una petición de oración!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {peticiones.map((peticion) => (
        <PeticionCard
          key={peticion.id}
          peticion={peticion}
          mostrarBotonOrar={true}
          onOro={handleOro}
        />
      ))}
    </div>
  )
}
