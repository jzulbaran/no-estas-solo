'use client'

import { useEffect, useState } from 'react'
import { supabase, Peticion, CATEGORIAS } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { ModalTestimonio } from '@/components/ModalTestimonio'
import { MensajesAliento } from '@/components/MensajesAliento'
import { BotonCompartir } from '@/components/BotonCompartir'

interface PeticionConCiudades extends Peticion {
  ciudadesIntercesores?: string[]
}

export default function MisPeticionesPage() {
  const [peticiones, setPeticiones] = useState<PeticionConCiudades[]>([])
  const [cargando, setCargando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)
  const [peticionParaCerrar, setPeticionParaCerrar] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAutenticado(false)
        setCargando(false)
        return
      }
      setAutenticado(true)

      const { data: misP, error } = await supabase
        .from('peticiones')
        .select('*, perfiles(nombre_display, ciudad)')
        .eq('autor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Error cargando tus peticiones')
        setCargando(false)
        return
      }

      // Para cada petición, obtener ciudades de intercesores
      const peticionesConCiudades = await Promise.all(
        (misP || []).map(async (p) => {
          const { data: oraciones } = await supabase
            .from('oraciones')
            .select('perfiles(ciudad)')
            .eq('peticion_id', p.id)
            .limit(10)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ciudades = (oraciones || [])
            .map((o: any) => (Array.isArray(o.perfiles) ? o.perfiles[0]?.ciudad : o.perfiles?.ciudad) as string | null)
            .filter((c): c is string => !!c)
            .filter((v, i, a) => a.indexOf(v) === i) // unique

          return { ...p, ciudadesIntercesores: ciudades } as PeticionConCiudades
        })
      )

      setPeticiones(peticionesConCiudades)
      setCargando(false)
    }
    cargar()
  }, [])

  function onConfirmarTestimonio(id: string, testimonio: string | null) {
    setPeticiones((prev) =>
      prev.map((p) => p.id === id ? { ...p, activa: false, testimonio } : p)
    )
    setPeticionParaCerrar(null)
  }

  if (cargando) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Cargando tus peticiones...</p>
      </div>
    )
  }

  if (!autenticado) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">🔐</p>
        <h1 className="text-2xl font-bold text-slate-800">Inicia Sesión</h1>
        <p className="text-slate-500">Para ver tus peticiones necesitas iniciar sesión</p>
        <Link href="/auth">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    )
  }

  const peticionesActivas = peticiones.filter((p) => p.activa)
  const peticionesCerradas = peticiones.filter((p) => !p.activa)
  const totalOracionesRecibidas = peticiones.reduce((sum, p) => sum + p.total_oraciones, 0)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Modal testimonio */}
      {peticionParaCerrar && (
        <ModalTestimonio
          peticionId={peticionParaCerrar}
          onConfirmar={onConfirmarTestimonio}
          onCancelar={() => setPeticionParaCerrar(null)}
        />
      )}

      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">📖</p>
        <h1 className="text-2xl font-bold text-slate-800">Mis Peticiones</h1>
        <p className="text-slate-500 text-sm mt-1">Tu historial de oración</p>
      </div>

      {/* Mensaje emocional */}
      {totalOracionesRecibidas > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-indigo-700 mb-1">
            {totalOracionesRecibidas.toLocaleString('es-MX')}
          </p>
          <p className="text-slate-700 font-medium">personas han orado por ti 🙏</p>
          <p className="text-slate-500 text-sm mt-1">No estás solo/a</p>
        </div>
      )}

      {/* Nueva petición */}
      <Link href="/nueva-peticion">
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          ✉️ Compartir nueva petición
        </Button>
      </Link>

      {/* Peticiones activas */}
      {peticionesActivas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Activas ({peticionesActivas.length})
          </h2>
          <div className="space-y-3">
            {peticionesActivas.map((p) => (
              <PeticionMia
                key={p.id}
                peticion={p}
                onCerrar={(id) => setPeticionParaCerrar(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Peticiones respondidas */}
      {peticionesCerradas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Respondidas / Cerradas ({peticionesCerradas.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {peticionesCerradas.map((p) => (
              <PeticionMia
                key={p.id}
                peticion={p}
                onCerrar={(id) => setPeticionParaCerrar(id)}
              />
            ))}
          </div>
        </section>
      )}

      {peticiones.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🕊️</p>
          <p>Aún no has compartido ninguna petición</p>
          <p className="text-sm mt-1">¡La comunidad está lista para orar por ti!</p>
        </div>
      )}
    </div>
  )
}

function PeticionMia({
  peticion,
  onCerrar,
}: {
  peticion: PeticionConCiudades
  onCerrar: (id: string) => void
}) {
  const categoria = CATEGORIAS.find((c) => c.valor === peticion.categoria)
  const tiempoRelativo = formatDistanceToNow(new Date(peticion.created_at), {
    addSuffix: true,
    locale: es,
  })
  const expira = new Date(peticion.expira_at || '')
  const diasRestantes = Math.max(0, Math.ceil((expira.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <Card className="border border-indigo-100">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex gap-1.5 flex-wrap">
            {categoria && (
              <Badge className="text-xs bg-indigo-50 text-indigo-700">
                {categoria.emoji} {categoria.etiqueta}
              </Badge>
            )}
            {peticion.activa ? (
              <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
                Activa · {diasRestantes}d
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Cerrada
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400">{tiempoRelativo}</span>
        </div>

        {/* Contenido */}
        <p className="text-slate-700 text-sm mb-3">&ldquo;{peticion.contenido}&rdquo;</p>

        {/* Testimonio si existe */}
        {peticion.testimonio && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">✨ Tu testimonio</p>
            <p className="text-xs text-slate-600 italic">&ldquo;{peticion.testimonio}&rdquo;</p>
          </div>
        )}

        {/* Mensajes de aliento */}
        <MensajesAliento peticionId={peticion.id} />

        {/* Oraciones + acciones */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🙏</span>
              <span className="font-bold text-indigo-700">{peticion.total_oraciones}</span>
              <span className="text-xs text-slate-500">oraciones recibidas</span>
            </div>
            {(peticion.ciudadesIntercesores?.length ?? 0) > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Desde: {peticion.ciudadesIntercesores!.slice(0, 3).join(', ')}
                {(peticion.ciudadesIntercesores?.length ?? 0) > 3 && ' y más...'}
              </p>
            )}
          </div>

          {peticion.activa && (
            <Button
              onClick={() => onCerrar(peticion.id)}
              size="sm"
              variant="outline"
              className="text-xs border-green-300 text-green-700 hover:bg-green-50"
            >
              ✅ Respondida
            </Button>
          )}
        </div>

        {/* Compartir */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <BotonCompartir peticionId={peticion.id} />
        </div>
      </CardContent>
    </Card>
  )
}
