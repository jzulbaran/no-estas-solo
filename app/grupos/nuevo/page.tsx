'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const EMOJIS_GRUPOS = ['🙏', '✝️', '💒', '🕊️', '📖', '🌟', '❤️', '🔥', '🌿', '🤝', '⛪', '👨‍👩‍👧‍👦']

export default function NuevoGrupoPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [emoji, setEmoji] = useState('🙏')
  const [esPrivado, setEsPrivado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (nombre.trim().length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Necesitas iniciar sesión', {
        action: { label: 'Iniciar Sesión', onClick: () => router.push('/auth') },
      })
      return
    }

    setEnviando(true)
    try {
      const { data, error } = await supabase.rpc('crear_grupo', {
        p_nombre: nombre.trim(),
        p_descripcion: descripcion.trim() || null,
        p_emoji: emoji,
        p_es_privado: esPrivado,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error)

      toast.success('¡Grupo creado! 🙌')
      router.push(`/grupos/${data.grupo_id}`)
    } catch {
      toast.error('No se pudo crear el grupo. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">👥</p>
        <h1 className="text-2xl font-bold text-slate-800">Crear Grupo</h1>
        <p className="text-slate-500 text-sm mt-1">
          Un espacio para orar juntos en comunidad
        </p>
      </div>

      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">Información del grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Emoji */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Elige un ícono
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS_GRUPOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      emoji === e
                        ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Nombre del grupo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Intercesores de Toronto, Familia García..."
                maxLength={80}
                required
                className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">{nombre.length}/80</p>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Descripción (opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="¿De qué trata este grupo? ¿A quién va dirigido?"
                maxLength={300}
                rows={3}
                className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">{descripcion.length}/300</p>
            </div>

            {/* Privacidad */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEsPrivado(!esPrivado)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    esPrivado ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      esPrivado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {esPrivado ? '🔒 Grupo privado' : '🌎 Grupo público'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {esPrivado
                      ? 'Solo se puede unir con código de invitación'
                      : 'Cualquier persona puede unirse'}
                  </p>
                </div>
              </label>
            </div>

            {/* Preview */}
            {nombre.length >= 3 && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 mb-2">Vista previa:</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{nombre}</p>
                    {descripcion && (
                      <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando || nombre.trim().length < 3}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
            >
              {enviando ? 'Creando...' : '👥 Crear grupo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
