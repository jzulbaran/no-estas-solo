'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'

export default function NuevaPeticionPage() {
  const router = useRouter()
  const [contenido, setContenido] = useState('')
  const [categoria, setCategoria] = useState('otro')
  const [ciudad, setCiudad] = useState('')
  const [esAnonima, setEsAnonima] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const caracteresRestantes = 500 - contenido.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (contenido.trim().length < 10) {
      toast.error('Tu petición debe tener al menos 10 caracteres')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Necesitas iniciar sesión para compartir una petición', {
        action: {
          label: 'Iniciar Sesión',
          onClick: () => router.push('/auth'),
        },
      })
      return
    }

    setEnviando(true)
    try {
      const { error } = await supabase.from('peticiones').insert({
        autor_id: user.id,
        contenido: contenido.trim(),
        categoria,
        ciudad: ciudad || null,
        es_anonima: esAnonima,
        expira_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })

      if (error) throw error

      toast.success('¡Tu petición fue compartida! La comunidad orará por ti 🙏')
      router.push('/')
    } catch {
      toast.error('No se pudo enviar tu petición. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">✉️</p>
        <h1 className="text-2xl font-bold text-slate-800">Compartir Petición</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tu comunidad hispana en Ontario orará por ti
        </p>
      </div>

      {/* Formulario */}
      <Card className="border border-indigo-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-700">¿Por qué necesitas oración?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Texto de la petición */}
            <div>
              <Textarea
                placeholder="Cuéntanos tu necesidad... Por ejemplo: 'Estoy pasando por un momento muy difícil con mi familia y necesito paz y sabiduría.'"
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
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Categoría
              </label>
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
                Ciudad en Ontario (opcional)
              </label>
              <Select value={ciudad} onValueChange={(v) => setCiudad(v ?? '')}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Selecciona tu ciudad..." />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES_ONTARIO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anonimato */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEsAnonima(!esAnonima)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
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
                    {esAnonima ? '🔒 Publicar de forma anónima' : '👤 Publicar con mi nombre'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {esAnonima
                      ? 'Nadie verá quién eres, solo tu petición'
                      : 'Tu nombre aparecerá junto a la petición'}
                  </p>
                </div>
              </label>
            </div>

            {/* Preview */}
            {contenido.length >= 10 && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 mb-2">Vista previa:</p>
                <p className="text-slate-700 text-sm italic">"{contenido}"</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge className="text-xs bg-indigo-100 text-indigo-700">
                    {CATEGORIAS.find((c) => c.valor === categoria)?.emoji}{' '}
                    {CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta}
                  </Badge>
                  {ciudad && <Badge variant="outline" className="text-xs">📍 {ciudad}</Badge>}
                  <Badge variant="outline" className="text-xs">
                    {esAnonima ? '🔒 Anónimo' : '👤 Con nombre'}
                  </Badge>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={enviando || contenido.trim().length < 10}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-base"
            >
              {enviando ? 'Enviando...' : '🙏 Compartir mi petición'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Tu petición estará activa por 7 días y será visible para la comunidad hispana de Ontario
      </p>
    </div>
  )
}
