'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, CIUDADES_ONTARIO, CATEGORIAS } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PeticionGrupoPage() {
  const { id: grupoId } = useParams<{ id: string }>()
  const router = useRouter()

  const [contenido, setContenido] = useState('')
  const [categoria, setCategoria] = useState('otro')
  const [ciudad, setCiudad] = useState('')
  const [esAnonima, setEsAnonima] = useState(true)
  const [esMiembro, setEsMiembro] = useState<boolean | null>(null)
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEsMiembro(false)
        return
      }

      const { data: grupo } = await supabase
        .from('grupos')
        .select('nombre')
        .eq('id', grupoId)
        .maybeSingle()

      const { data: membresia } = await supabase
        .from('grupo_miembros')
        .select('id')
        .eq('grupo_id', grupoId)
        .eq('perfil_id', user.id)
        .maybeSingle()

      setNombreGrupo(grupo?.nombre || '')
      setEsMiembro(!!membresia)
    }
    verificar()
  }, [grupoId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (contenido.trim().length < 10) {
      toast.error('Tu petición debe tener al menos 10 caracteres')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEnviando(true)
    try {
      const { data: peticion, error } = await supabase
        .from('peticiones')
        .insert({
          autor_id: user.id,
          contenido: contenido.trim(),
          categoria,
          ciudad: ciudad || null,
          es_anonima: esAnonima,
          expira_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single()

      if (error) throw error

      await supabase.from('grupo_peticiones').insert({
        grupo_id: grupoId,
        peticion_id: peticion.id,
      })

      toast.success('¡Petición compartida con el grupo! 🙏')
      router.push(`/grupos/${grupoId}`)
    } catch {
      toast.error('No se pudo enviar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (esMiembro === null) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!esMiembro) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">🔒</p>
        <h1 className="text-2xl font-bold text-slate-800">Acceso restringido</h1>
        <p className="text-slate-500">Debes ser miembro del grupo para publicar peticiones.</p>
        <Link href={`/grupos/${grupoId}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Ver grupo</Button>
        </Link>
      </div>
    )
  }

  const caracteresRestantes = 500 - contenido.length

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">🙏</p>
        <h1 className="text-2xl font-bold text-slate-800">Compartir Petición</h1>
        {nombreGrupo && (
          <p className="text-slate-500 text-sm mt-1">en el grupo "{nombreGrupo}"</p>
        )}
      </div>

      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">¿Por qué necesitas oración?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Textarea
                placeholder="Cuéntanos tu necesidad..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                maxLength={500}
                rows={4}
                className="resize-none text-base border-indigo-200 focus:border-indigo-500"
                required
              />
              <p className={`text-xs mt-1 text-right ${caracteresRestantes < 50 ? 'text-orange-500' : 'text-slate-400'}`}>
                {caracteresRestantes} caracteres restantes
              </p>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.valor}
                    type="button"
                    onClick={() => setCategoria(cat.valor)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      categoria === cat.valor
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {cat.emoji} {cat.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Ciudad (opcional)
              </label>
              <Select value={ciudad} onValueChange={(v) => setCiudad(v ?? '')}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Selecciona tu ciudad..." />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES_ONTARIO.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anonimato */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEsAnonima(!esAnonima)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    esAnonima ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      esAnonima ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {esAnonima ? '🔒 Anónimo en el grupo' : '👤 Con mi nombre'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {esAnonima ? 'Los miembros no verán quién eres' : 'Tu nombre será visible'}
                  </p>
                </div>
              </label>
            </div>

            {contenido.length >= 10 && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 mb-2">Vista previa:</p>
                <p className="text-slate-700 text-sm italic">&ldquo;{contenido}&rdquo;</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className="text-xs bg-indigo-100 text-indigo-700">
                    {CATEGORIAS.find((c) => c.valor === categoria)?.emoji}{' '}
                    {CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta}
                  </Badge>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando || contenido.trim().length < 10}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
            >
              {enviando ? 'Enviando...' : '🙏 Compartir en el grupo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
