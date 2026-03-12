'use client'

import { useState } from 'react'
import { Peticion } from '@/lib/supabase'
import { PeticionCard } from './PeticionCard'

interface FeedGrupoPeticionesProps {
  grupoId: string
  initialPeticiones: Peticion[]
}

export function FeedGrupoPeticiones({ initialPeticiones }: FeedGrupoPeticionesProps) {
  const [peticiones, setPeticiones] = useState<Peticion[]>(initialPeticiones)

  function handleOro(peticionId: string, nuevoTotal: number) {
    setPeticiones((prev) =>
      prev.map((p) => (p.id === peticionId ? { ...p, total_oraciones: nuevoTotal } : p))
    )
  }

  if (peticiones.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-3">🙏</p>
        <p>Aún no hay peticiones en este grupo</p>
        <p className="text-sm mt-1">¡Sé el primero en compartir una!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {peticiones.map((p) => (
        <PeticionCard key={p.id} peticion={p} mostrarBotonOrar={true} onOro={handleOro} />
      ))}
    </div>
  )
}
