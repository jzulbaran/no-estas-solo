'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ModalUnirseGrupoProps {
  grupoId: string
  esPrivado: boolean
  onExito: () => void
  onCancelar: () => void
}

export function ModalUnirseGrupo({ grupoId, esPrivado, onExito, onCancelar }: ModalUnirseGrupoProps) {
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(false)

  async function unirse() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Necesitas iniciar sesión', {
        action: { label: 'Iniciar Sesión', onClick: () => window.location.href = '/auth' },
      })
      return
    }

    setCargando(true)
    const { data, error } = await supabase.rpc('unirse_a_grupo', {
      p_grupo_id: grupoId,
      p_codigo: esPrivado ? codigo.trim() : null,
    })

    if (error || !data?.success) {
      const msg =
        data?.error === 'codigo_invalido' ? 'Código de invitación incorrecto' :
        data?.error === 'ya_es_miembro'   ? 'Ya eres miembro de este grupo' :
        'No se pudo unirse al grupo'
      toast.error(msg)
      setCargando(false)
      return
    }

    toast.success('¡Bienvenido al grupo! 🙌')
    onExito()
    setCargando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl mb-2">👥</p>
          <h2 className="text-xl font-bold text-slate-800">Unirse al grupo</h2>
          {esPrivado && (
            <p className="text-slate-500 text-sm mt-1">
              Este grupo es privado. Necesitas un código de invitación.
            </p>
          )}
        </div>

        {esPrivado && (
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="CÓDIGO DE INVITACIÓN"
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center tracking-widest uppercase"
            maxLength={8}
          />
        )}

        <div className="flex gap-3">
          <Button onClick={onCancelar} variant="outline" className="flex-1" disabled={cargando}>
            Cancelar
          </Button>
          <Button
            onClick={unirse}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={cargando || (esPrivado && !codigo.trim())}
          >
            {cargando ? 'Uniéndose...' : 'Unirse'}
          </Button>
        </div>
      </div>
    </div>
  )
}
