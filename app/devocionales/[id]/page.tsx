import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATEGORIAS_DEVOCIONAL } from '@/lib/supabase'
import { BotonAmen } from '@/components/BotonAmen'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

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
    .from('devocionales')
    .select('titulo, contenido')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Devocional — No Estás Solo' }

  return {
    title: `${data.titulo} — No Estás Solo`,
    description: data.contenido.slice(0, 160),
  }
}

export default async function DevocionalPage({ params }: Props) {
  const { id } = await params

  const { data: devocional } = await getSupabase()
    .from('devocionales')
    .select('*, perfiles(nombre_display, ciudad)')
    .eq('id', id)
    .is('grupo_id', null)
    .single()

  if (!devocional) notFound()

  const categoria = CATEGORIAS_DEVOCIONAL.find((c) => c.valor === devocional.categoria)
  const tiempoRelativo = formatDistanceToNow(new Date(devocional.created_at), {
    addSuffix: true,
    locale: es,
  })
  const autorNombre =
    (Array.isArray(devocional.perfiles)
      ? devocional.perfiles[0]?.nombre_display
      : devocional.perfiles?.nombre_display) ?? 'Anónimo'
  const autorCiudad =
    (Array.isArray(devocional.perfiles)
      ? devocional.perfiles[0]?.ciudad
      : devocional.perfiles?.ciudad) ?? null

  return (
    <div className="max-w-lg mx-auto space-y-6 px-4 py-4">
      {/* Categoría + tiempo */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          {categoria?.emoji} {categoria?.etiqueta}
        </span>
        <span className="text-xs text-slate-400">{tiempoRelativo}</span>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold text-slate-800 leading-tight">{devocional.titulo}</h1>

      {/* Versículo */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
          📖 {devocional.versiculo_ref}
        </p>
        <p className="text-slate-700 italic leading-relaxed">
          &ldquo;{devocional.versiculo_texto}&rdquo;
        </p>
      </div>

      {/* Contenido */}
      <div className="prose prose-slate prose-sm max-w-none">
        {devocional.contenido.split('\n').map((parrafo: string, i: number) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-3">
            {parrafo}
          </p>
        ))}
      </div>

      {/* Autor */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-slate-500 text-sm">
          — {autorNombre}
          {autorCiudad ? `, ${autorCiudad}` : ''}
        </span>
      </div>

      {/* Amén */}
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="text-sm text-slate-500">¿Esta reflexión te bendijo?</p>
        <BotonAmen devocionalId={devocional.id} totalInicial={devocional.total_amenes} />
      </div>

      {/* CTA */}
      <div className="bg-indigo-900 rounded-2xl p-6 text-center text-white">
        <p className="font-bold text-lg mb-1">¿Tienes algo que compartir?</p>
        <p className="text-indigo-200 text-sm mb-4">
          Publica tu propio devocional para la comunidad
        </p>
        <Link
          href="/devocionales/nuevo"
          className="inline-block bg-white text-indigo-900 font-semibold px-6 py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors"
        >
          Escribir devocional
        </Link>
      </div>
    </div>
  )
}
