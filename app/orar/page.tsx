'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Peticion, CATEGORIAS } from '@/lib/supabase'
import { BotonOrar } from '@/components/BotonOrar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { getVersiculoIntercesion } from '@/lib/versiculos-intercesion'

export default function OrarPage() {
  const [peticion, setPeticion] = useState<Peticion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [oracionesHoy, setOracionesHoy] = useState(0)
  const [yaOro, setYaOro] = useState(false)
  const [versiculoIntercesion, setVersiculoIntercesion] = useState<{ ref: string; texto: string } | null>(null)

  const cargarPeticion = useCallback(async () => {
    setCargando(true)
    setYaOro(false)

    const { data: { user } } = await supabase.auth.getUser()

    // Obtener peticiones activas que el usuario no ha orado
    let query = supabase
      .from('peticiones')
      .select('*, perfiles(nombre_display, ciudad)')
      .eq('activa', true)
      .gt('expira_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: peticiones } = await query

    if (!peticiones || peticiones.length === 0) {
      setPeticion(null)
      setCargando(false)
      return
    }

    // Si hay usuario autenticado, filtrar las que ya oró
    if (user) {
      const { data: oraciones } = await supabase
        .from('oraciones')
        .select('peticion_id')
        .eq('intercesor_id', user.id)

      const yaOradas = new Set(oraciones?.map((o) => o.peticion_id) || [])
      const disponibles = peticiones.filter((p: Peticion) => !yaOradas.has(p.id) && p.autor_id !== user.id)

      if (disponibles.length > 0) {
        const aleatoria = disponibles[Math.floor(Math.random() * disponibles.length)]
        setPeticion(aleatoria as Peticion)
      } else {
        // Si ya oró por todas, mostrar cualquiera
        const aleatoria = peticiones[Math.floor(Math.random() * peticiones.length)]
        setPeticion(aleatoria as Peticion)
      }
    } else {
      const aleatoria = peticiones[Math.floor(Math.random() * peticiones.length)]
      setPeticion(aleatoria as Peticion)
    }

    setCargando(false)
  }, [])

  // Cargar versículo de intercesión cuando cambia la petición
  useEffect(() => {
    if (!peticion) return
    setVersiculoIntercesion(null)
    const refId = getVersiculoIntercesion(peticion.categoria)
    fetch(`/api/biblia/versiculo?id=${refId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setVersiculoIntercesion(data) })
      .catch(() => {})
  }, [peticion])

  useEffect(() => {
    cargarPeticion()

    // Contar oraciones del día
    async function contarOracionesHoy() {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('oraciones')
        .select('*', { count: 'exact', head: true })
        .eq('intercesor_id', user.id)
        .gte('created_at', hoy.toISOString())

      setOracionesHoy(count || 0)
    }
    contarOracionesHoy()
  }, [cargarPeticion])

  function handleOro(_: string, __: number) {
    setYaOro(true)
    setOracionesHoy((prev) => prev + 1)
  }

  const categoria = peticion ? CATEGORIAS.find((c) => c.valor === peticion.categoria) : null
  const tiempoRelativo = peticion
    ? formatDistanceToNow(new Date(peticion.created_at), { addSuffix: true, locale: es })
    : ''

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">🙏</p>
        <h1 className="text-2xl font-bold text-slate-800">Orar por Otros</h1>
        <p className="text-slate-500 text-sm mt-1">
          Sé el intercesor que alguien necesita hoy
        </p>
        {oracionesHoy > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200">
            <span>✅</span>
            <span>Has orado {oracionesHoy} {oracionesHoy === 1 ? 'vez' : 'veces'} hoy</span>
          </div>
        )}
      </div>

      {/* Petición */}
      {cargando ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando petición...</p>
        </div>
      ) : !peticion ? (
        <Card className="border border-indigo-100">
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-semibold text-slate-700">¡No hay peticiones pendientes!</p>
            <p className="text-slate-500 text-sm mt-1">
              Has orado por todas las peticiones activas. ¡Gracias por tu intercesión!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-2 border-indigo-200 shadow-md bg-white">
            <CardContent className="pt-5 pb-5">
              {/* Etiquetas */}
              <div className="flex gap-2 flex-wrap mb-4">
                {categoria && (
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {categoria.emoji} {categoria.etiqueta}
                  </Badge>
                )}
                {peticion.ciudad && (
                  <Badge variant="outline" className="text-slate-500">
                    📍 {peticion.ciudad}
                  </Badge>
                )}
                <Badge variant="outline" className="text-slate-400 text-xs">
                  {tiempoRelativo}
                </Badge>
              </div>

              {/* Petición */}
              <blockquote className="text-lg text-slate-700 leading-relaxed text-center py-4 px-2">
                "{peticion.contenido}"
              </blockquote>

              {/* Autor */}
              <p className="text-center text-sm text-slate-400 mt-2">
                — {peticion.es_anonima ? 'Anónimo' : peticion.perfiles?.nombre_display || 'Anónimo'}
              </p>
            </CardContent>
          </Card>

          {/* Versículo de intercesión */}
          {versiculoIntercesion && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                📖 Ora según la Palabra
              </p>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "{versiculoIntercesion.texto}"
              </p>
              <p className="text-xs font-bold text-indigo-700 mt-2">
                — {versiculoIntercesion.ref}
              </p>
            </div>
          )}

          {/* Botón de orar grande */}
          <div className="text-center py-4">
            <BotonOrar
              peticionId={peticion.id}
              totalInicial={peticion.total_oraciones}
              onOro={handleOro}
              size="large"
            />
          </div>

          {/* Siguiente */}
          {yaOro && (
            <div className="text-center space-y-3">
              <p className="text-green-600 font-medium text-sm">
                ✨ ¡Gracias! Tu oración llegó al cielo y al corazón de quien la necesita.
              </p>
              <Button
                onClick={cargarPeticion}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                Orar por otra persona →
              </Button>
            </div>
          )}

          {!yaOro && (
            <Button
              onClick={cargarPeticion}
              variant="ghost"
              className="w-full text-slate-400 hover:text-slate-600 text-sm"
            >
              Saltar esta petición →
            </Button>
          )}
        </div>
      )}

    </div>
  )
}
