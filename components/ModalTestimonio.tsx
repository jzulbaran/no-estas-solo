'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ModalTestimonioProps {
  peticionId: string
  onConfirmar: (id: string, testimonio: string | null) => void
  onCancelar: () => void
}

export function ModalTestimonio({ peticionId, onConfirmar, onCancelar }: ModalTestimonioProps) {
  const [testimonio, setTestimonio] = useState('')
  const [cargando, setCargando] = useState(false)

  async function confirmar() {
    setCargando(true)
    const testimonioFinal = testimonio.trim() || null

    const updates: { activa: boolean; testimonio?: string } = { activa: false }
    if (testimonioFinal) updates.testimonio = testimonioFinal

    const { error } = await supabase
      .from('peticiones')
      .update(updates)
      .eq('id', peticionId)

    if (error) {
      toast.error('No se pudo cerrar la petición')
      setCargando(false)
      return
    }

    onConfirmar(peticionId, testimonioFinal)
    toast.success('¡Gloria a Dios! Petición marcada como respondida 🙌')
    setCargando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="text-center">
          <p className="text-4xl mb-2">🙌</p>
          <h2 className="text-xl font-bold text-slate-800">¡Dios respondió!</h2>
          <p className="text-slate-500 text-sm mt-1">
            ¿Quieres compartir cómo fue respondida esta petición?
          </p>
        </div>

        <div>
          <textarea
            value={testimonio}
            onChange={(e) => setTestimonio(e.target.value)}
            placeholder="Escribe tu testimonio aquí (opcional)... ¿Cómo actuó Dios en esta situación?"
            maxLength={1000}
            rows={4}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-slate-400 text-right mt-0.5">{testimonio.length}/1000</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onCancelar}
            variant="outline"
            className="flex-1"
            disabled={cargando}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Marcar como respondida'}
          </Button>
        </div>

        <p className="text-xs text-center text-slate-400">
          El testimonio es opcional. Si lo compartes, será visible en la sección de Testimonios.
        </p>
      </div>
    </div>
  )
}
