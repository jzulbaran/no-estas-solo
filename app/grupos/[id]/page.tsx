'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Grupo, GrupoMiembro, Peticion } from '@/lib/supabase'
import { FeedGrupoPeticiones } from '@/components/FeedGrupoPeticiones'
import { ModalUnirseGrupo } from '@/components/ModalUnirseGrupo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'

export default function GrupoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [miembros, setMiembros] = useState<GrupoMiembro[]>([])
  const [peticiones, setPeticiones] = useState<Peticion[]>([])
  const [miRol, setMiRol] = useState<'admin' | 'miembro' | null>(null)
  const [cargando, setCargando] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch group (null if private and not member)
      const { data: grupoData } = await supabase
        .from('grupos')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!grupoData) {
        setCargando(false)
        return
      }

      setGrupo(grupoData as Grupo)

      // Check membership
      if (user) {
        const { data: membresia } = await supabase
          .from('grupo_miembros')
          .select('rol')
          .eq('grupo_id', id)
          .eq('perfil_id', user.id)
          .maybeSingle()

        if (membresia) {
          setMiRol(membresia.rol as 'admin' | 'miembro')

          // Fetch petitions (only visible to members)
          const { data: gp } = await supabase
            .from('grupo_peticiones')
            .select('peticiones(*, perfiles(nombre_display, ciudad))')
            .eq('grupo_id', id)
            .order('created_at', { ascending: false })
            .limit(30)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pets = (gp || []).map((item: any) => item.peticiones).filter(Boolean) as Peticion[]
          setPeticiones(pets)

          // Fetch members
          const { data: miembrosData } = await supabase
            .from('grupo_miembros')
            .select('*, perfiles(nombre_display, ciudad)')
            .eq('grupo_id', id)
            .limit(20)

          setMiembros((miembrosData as GrupoMiembro[]) || [])
        }
      }

      setCargando(false)
    }
    cargar()
  }, [id])

  async function copiarCodigo() {
    if (!grupo) return
    await navigator.clipboard.writeText(grupo.codigo_invitacion)
    setCodigoCopiado(true)
    setTimeout(() => setCodigoCopiado(false), 2000)
    toast.success('Código copiado 🔗')
  }

  function handleUnirseExito() {
    setShowModal(false)
    router.refresh()
    window.location.reload()
  }

  if (cargando) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Cargando grupo...</p>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">🔒</p>
        <h1 className="text-2xl font-bold text-slate-800">Grupo no encontrado</h1>
        <p className="text-slate-500">
          Este grupo es privado o no existe. Si tienes un código de invitación, úsalo desde la
          página de grupos.
        </p>
        <Link href="/grupos">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Ver grupos</Button>
        </Link>
      </div>
    )
  }

  const esMiembro = miRol !== null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {showModal && (
        <ModalUnirseGrupo
          grupoId={grupo.id}
          esPrivado={grupo.es_privado}
          onExito={handleUnirseExito}
          onCancelar={() => setShowModal(false)}
        />
      )}

      {/* Header del grupo */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{grupo.emoji_portada}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-800">{grupo.nombre}</h1>
              <Badge className={grupo.es_privado ? 'bg-slate-100 text-slate-600 text-xs' : 'bg-green-50 text-green-700 text-xs'}>
                {grupo.es_privado ? '🔒 Privado' : '🌎 Público'}
              </Badge>
            </div>
            {grupo.descripcion && (
              <p className="text-sm text-slate-600 mb-2">{grupo.descripcion}</p>
            )}
            <p className="text-xs text-slate-400">
              👥 {grupo.total_miembros} {grupo.total_miembros === 1 ? 'miembro' : 'miembros'}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {esMiembro ? (
            <>
              <Link href={`/grupos/${grupo.id}/peticion`}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  + Compartir petición
                </Button>
              </Link>
              {miRol === 'admin' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-indigo-200 text-indigo-700"
                  onClick={copiarCodigo}
                >
                  {codigoCopiado ? '✅ Copiado' : `🔑 Código: ${grupo.codigo_invitacion}`}
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              onClick={() => setShowModal(true)}
            >
              {grupo.es_privado ? '🔒 Unirse con código' : '+ Unirse al grupo'}
            </Button>
          )}
        </div>
      </div>

      {/* Contenido: solo miembros */}
      {esMiembro ? (
        <>
          {/* Feed de peticiones */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Peticiones del grupo
            </h2>
            <FeedGrupoPeticiones grupoId={grupo.id} initialPeticiones={peticiones} />
          </section>

          {/* Miembros */}
          {miembros.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Miembros ({grupo.total_miembros})
              </h2>
              <div className="flex flex-wrap gap-2">
                {miembros.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 bg-white border border-indigo-100 rounded-full px-3 py-1"
                  >
                    <span className="text-xs text-slate-600">
                      {m.perfiles?.nombre_display || 'Anónimo'}
                    </span>
                    {m.rol === 'admin' && (
                      <span className="text-xs text-amber-600">⭐</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-3xl mb-3">👁️</p>
          <p className="font-medium text-slate-700">Únete para ver el contenido</p>
          <p className="text-sm mt-1">
            Las peticiones y conversaciones son visibles solo para los miembros
          </p>
        </div>
      )}
    </div>
  )
}
