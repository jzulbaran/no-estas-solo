'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, CATEGORIAS_DEVOCIONAL, CategoriaDevocional, Grupo } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BuscadorVersiculo } from '@/components/BuscadorVersiculo'
import { toast } from 'sonner'

export default function NuevoDevocionalPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [versiculoRef, setVersiculoRef] = useState('')
  const [versiculoTexto, setVersiculoTexto] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDevocional>('reflexion')
  const [grupoId, setGrupoId] = useState<string>('ninguno')
  const [misGrupos, setMisGrupos] = useState<Grupo[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function cargarGrupos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('grupo_miembros')
        .select('grupos(id, nombre, emoji_portada)')
        .eq('perfil_id', user.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grupos = (data || []).map((m: any) => m.grupos).filter(Boolean) as Grupo[]
      setMisGrupos(grupos)
    }
    cargarGrupos()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (titulo.trim().length < 5) {
      toast.error('El título debe tener al menos 5 caracteres')
      return
    }
    if (contenido.trim().length < 50) {
      toast.error('El contenido debe tener al menos 50 caracteres')
      return
    }
    if (!versiculoRef.trim() || !versiculoTexto.trim()) {
      toast.error('El versículo bíblico es requerido')
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
      const { data, error } = await supabase
        .from('devocionales')
        .insert({
          autor_id: user.id,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          versiculo_ref: versiculoRef.trim(),
          versiculo_texto: versiculoTexto.trim(),
          categoria,
          grupo_id: grupoId !== 'ninguno' ? grupoId : null,
        })
        .select('id')
        .single()

      if (error) throw error

      toast.success('¡Devocional publicado! 📖')
      router.push(`/devocionales/${data.id}`)
    } catch {
      toast.error('No se pudo publicar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">✍️</p>
        <h1 className="text-2xl font-bold text-slate-800">Nuevo Devocional</h1>
        <p className="text-slate-500 text-sm mt-1">
          Comparte una reflexión que haya tocado tu corazón
        </p>
      </div>

      <Card className="border border-amber-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">Escribe tu devocional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Categoría */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS_DEVOCIONAL.map((cat) => (
                  <button
                    key={cat.valor}
                    type="button"
                    onClick={() => setCategoria(cat.valor)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      categoria === cat.valor
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-amber-400'
                    }`}
                  >
                    {cat.emoji} {cat.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: La paz que sobrepasa todo entendimiento"
                maxLength={120}
                required
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">{titulo.length}/120</p>
            </div>

            {/* Versículo */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-3">
              <label className="text-sm font-medium text-amber-800 block">
                📖 Versículo bíblico *
              </label>

              {/* Buscador */}
              <BuscadorVersiculo
                modo="form"
                onSeleccionar={(r) => {
                  setVersiculoRef(r.ref)
                  setVersiculoTexto(r.texto)
                }}
              />

              {/* Campos manuales */}
              <input
                type="text"
                value={versiculoRef}
                onChange={(e) => setVersiculoRef(e.target.value)}
                placeholder="Referencia (ej: Filipenses 4:7)"
                maxLength={100}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              />
              <textarea
                value={versiculoTexto}
                onChange={(e) => setVersiculoTexto(e.target.value)}
                placeholder="Texto del versículo..."
                maxLength={500}
                rows={3}
                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white italic"
              />
            </div>

            {/* Contenido */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reflexión *
              </label>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe tu reflexión, meditación u oración..."
                maxLength={3000}
                rows={6}
                required
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <p className={`text-xs mt-0.5 text-right ${contenido.length > 2800 ? 'text-orange-500' : 'text-slate-400'}`}>
                {contenido.length}/3000
              </p>
            </div>

            {/* Grupo (opcional) */}
            {misGrupos.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Publicar en grupo (opcional)
                </label>
                <Select value={grupoId} onValueChange={(v) => setGrupoId(v ?? 'ninguno')}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue placeholder="Solo en el feed público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Solo en el feed público</SelectItem>
                    {misGrupos.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.emoji_portada} {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                enviando ||
                titulo.trim().length < 5 ||
                contenido.trim().length < 50 ||
                !versiculoRef.trim() ||
                !versiculoTexto.trim()
              }
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3"
            >
              {enviando ? 'Publicando...' : '📖 Publicar devocional'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
