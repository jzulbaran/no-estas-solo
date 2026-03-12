'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Grupo } from '@/lib/supabase'
import { GrupoCard } from '@/components/GrupoCard'
import { ModalUnirseGrupo } from '@/components/ModalUnirseGrupo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [misGruposIds, setMisGruposIds] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalGrupo, setModalGrupo] = useState<Grupo | null>(null)
  const [showCodigoInput, setShowCodigoInput] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [uniendoPorCodigo, setUniendoPorCodigo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function cargar() {
      const { data: gruposData } = await supabase
        .from('grupos')
        .select('*')
        .eq('es_privado', false)
        .order('total_miembros', { ascending: false })

      setGrupos((gruposData as Grupo[]) || [])

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: miembros } = await supabase
          .from('grupo_miembros')
          .select('grupo_id')
          .eq('perfil_id', user.id)
        setMisGruposIds((miembros || []).map((m: { grupo_id: string }) => m.grupo_id))
      }

      setCargando(false)
    }
    cargar()
  }, [])

  async function handleUnirse(grupo: Grupo) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Necesitas iniciar sesión para unirte a un grupo', {
        action: { label: 'Iniciar Sesión', onClick: () => router.push('/auth') },
      })
      return
    }

    if (grupo.es_privado) {
      setModalGrupo(grupo)
      return
    }

    const { data } = await supabase.rpc('unirse_a_grupo', { p_grupo_id: grupo.id })
    if (data?.success) {
      setMisGruposIds((prev) => [...prev, grupo.id])
      setGrupos((prev) =>
        prev.map((g) => (g.id === grupo.id ? { ...g, total_miembros: g.total_miembros + 1 } : g))
      )
      toast.success('¡Te uniste al grupo! 🙌')
      router.push(`/grupos/${grupo.id}`)
    } else if (data?.error === 'ya_es_miembro') {
      setMisGruposIds((prev) => [...prev, grupo.id])
      router.push(`/grupos/${grupo.id}`)
    } else {
      toast.error('No se pudo unirse al grupo')
    }
  }

  function handleUnirseExito() {
    if (!modalGrupo) return
    setMisGruposIds((prev) => [...prev, modalGrupo.id])
    setGrupos((prev) =>
      prev.map((g) =>
        g.id === modalGrupo.id ? { ...g, total_miembros: g.total_miembros + 1 } : g
      )
    )
    const grupoId = modalGrupo.id
    setModalGrupo(null)
    router.push(`/grupos/${grupoId}`)
  }

  async function handleUnirPorCodigo() {
    if (!codigoInput.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Necesitas iniciar sesión', {
        action: { label: 'Iniciar Sesión', onClick: () => router.push('/auth') },
      })
      return
    }

    setUniendoPorCodigo(true)
    const { data, error } = await supabase.rpc('unirse_por_codigo', { p_codigo: codigoInput.trim() })
    setUniendoPorCodigo(false)

    if (error || !data?.success) {
      if (data?.error === 'ya_es_miembro') {
        router.push(`/grupos/${data.grupo_id}`)
        return
      }
      toast.error(data?.error === 'codigo_invalido' ? 'Código incorrecto' : 'No se pudo unirse')
      return
    }

    toast.success(`¡Te uniste a "${data.nombre}"! 🙌`)
    setShowCodigoInput(false)
    setCodigoInput('')
    router.push(`/grupos/${data.grupo_id}`)
  }

  const misGrupos = grupos.filter((g) => misGruposIds.includes(g.id))
  const otrosGrupos = grupos.filter((g) => !misGruposIds.includes(g.id))

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {modalGrupo && (
        <ModalUnirseGrupo
          grupoId={modalGrupo.id}
          esPrivado={modalGrupo.es_privado}
          onExito={handleUnirseExito}
          onCancelar={() => setModalGrupo(null)}
        />
      )}

      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">👥</p>
        <h1 className="text-2xl font-bold text-slate-800">Grupos de Oración</h1>
        <p className="text-slate-500 text-sm mt-1">Únete a una comunidad de intercesión</p>
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <Link href="/grupos/nuevo" className="flex-1">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            + Crear grupo
          </Button>
        </Link>
        <Button
          variant="outline"
          className="border-indigo-200 text-indigo-700"
          onClick={() => setShowCodigoInput(!showCodigoInput)}
        >
          🔒 Tengo un código
        </Button>
      </div>

      {/* Input código de invitación */}
      {showCodigoInput && (
        <div className="flex gap-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <input
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            maxLength={8}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Button
            onClick={handleUnirPorCodigo}
            disabled={uniendoPorCodigo || !codigoInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            {uniendoPorCodigo ? '...' : 'Entrar'}
          </Button>
        </div>
      )}

      {/* Loading */}
      {cargando && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Cargando grupos...</p>
        </div>
      )}

      {/* Mis grupos */}
      {!cargando && misGrupos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Mis grupos ({misGrupos.length})
          </h2>
          <div className="space-y-3">
            {misGrupos.map((g) => (
              <GrupoCard key={g.id} grupo={g} esMiembro />
            ))}
          </div>
        </section>
      )}

      {/* Grupos públicos */}
      {!cargando && otrosGrupos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Grupos públicos ({otrosGrupos.length})
          </h2>
          <div className="space-y-3">
            {otrosGrupos.map((g) => (
              <GrupoCard key={g.id} grupo={g} onUnirse={() => handleUnirse(g)} />
            ))}
          </div>
        </section>
      )}

      {!cargando && grupos.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🌱</p>
          <p>No hay grupos públicos aún</p>
          <p className="text-sm mt-1">¡Sé el primero en crear uno!</p>
        </div>
      )}
    </div>
  )
}
