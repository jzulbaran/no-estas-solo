import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIAS } from '@/lib/supabase'
import { BotonOrar } from '@/components/BotonOrar'
import { BotonCompartir } from '@/components/BotonCompartir'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getSupabase()
    .from('peticiones')
    .select('contenido, ciudad, categoria')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Petición no encontrada — No Estás Solo' }

  const titulo = `🙏 Petición de oración${data.ciudad ? ` desde ${data.ciudad}` : ''} — No Estás Solo`
  const descripcion = data.contenido.slice(0, 160)

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://no-estas-solo.vercel.app'}/peticion/${id}`,
      siteName: 'No Estás Solo — Red de Oración Ontario',
    },
  }
}

export default async function PeticionPublicaPage({ params }: Props) {
  const { id } = await params

  const { data: peticion } = await getSupabase()
    .from('peticiones')
    .select('*, perfiles(nombre_display, ciudad)')
    .eq('id', id)
    .single()

  if (!peticion || (!peticion.activa && !peticion.testimonio)) {
    notFound()
  }

  const categoria = CATEGORIAS.find((c) => c.valor === peticion.categoria)
  const tiempoRelativo = formatDistanceToNow(new Date(peticion.created_at), {
    addSuffix: true,
    locale: es,
  })

  // Privacy: never expose autor_id or perfiles data for anonymous petitions
  const autorNombre = peticion.es_anonima
    ? null
    : (Array.isArray(peticion.perfiles) ? peticion.perfiles[0]?.nombre_display : peticion.perfiles?.nombre_display) ?? null

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">{categoria?.emoji || '🙏'}</p>
        <h1 className="text-xl font-bold text-slate-800">Petición de Oración</h1>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-slate-400">
          {peticion.ciudad && <span>📍 {peticion.ciudad}, Ontario</span>}
          <span>·</span>
          <span>{tiempoRelativo}</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
        <p className="text-slate-700 text-base leading-relaxed">&ldquo;{peticion.contenido}&rdquo;</p>
        {autorNombre && (
          <p className="text-sm text-slate-400 mt-3">— {autorNombre}</p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-indigo-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-indigo-700">{peticion.total_oraciones}</p>
        <p className="text-sm text-slate-600">personas ya oraron por esto 🙏</p>
      </div>

      {/* Testimonio si existe */}
      {peticion.testimonio && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">✨ Testimonio</p>
          <p className="text-slate-700 text-sm italic">&ldquo;{peticion.testimonio}&rdquo;</p>
        </div>
      )}

      {/* Orar */}
      {peticion.activa && (
        <div className="flex flex-col items-center">
          <BotonOrar
            peticionId={peticion.id}
            totalInicial={peticion.total_oraciones}
            size="large"
          />
        </div>
      )}

      {/* Compartir */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-slate-500">Invita a otros a orar por esto:</p>
        <BotonCompartir peticionId={peticion.id} />
      </div>

      {/* CTA */}
      <div className="bg-indigo-900 rounded-2xl p-6 text-center text-white">
        <p className="font-bold text-lg mb-1">¿Tú también necesitas oración?</p>
        <p className="text-indigo-200 text-sm mb-4">
          La comunidad está lista para interceder por ti
        </p>
        <a
          href="/nueva-peticion"
          className="inline-block bg-white text-indigo-900 font-semibold px-6 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
        >
          Compartir mi petición
        </a>
      </div>
    </div>
  )
}
