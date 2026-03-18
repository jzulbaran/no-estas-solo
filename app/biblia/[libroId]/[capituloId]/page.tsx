import { getCapitulo, getCapitulos } from '@/lib/bible-api'
import { createClient } from '@/lib/supabase'
import { CATEGORIAS_DEVOCIONAL } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  params: Promise<{ libroId: string; capituloId: string }>
}

export default async function CapituloPage({ params }: Props) {
  const { libroId, capituloId } = await params

  let capitulo: { reference: string; content: string; next?: { id: string }; previous?: { id: string } } | null = null
  let capitulos: { id: string; number: string }[] = []

  try {
    const [cap, caps] = await Promise.all([getCapitulo(capituloId), getCapitulos(libroId)])
    capitulo = cap
    capitulos = caps.filter((c: { number: string }) => c.number !== 'intro')
  } catch {
    capitulo = null
  }

  // Buscar devocionales de la comunidad sobre este capítulo
  const supabase = createClient()
  const refBase = capitulo?.reference ?? '' // ej: "Juan 3"
  const { data: devocionales } = refBase
    ? await supabase
        .from('devocionales')
        .select('id, titulo, versiculo_ref, contenido, total_amenes, categoria, perfiles(nombre_display)')
        .ilike('versiculo_ref', `${refBase}%`)
        .order('total_amenes', { ascending: false })
        .limit(5)
    : { data: [] }

  if (!capitulo) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">No se pudo cargar el capítulo.</p>
        <Link href={`/biblia/${libroId}`} className="text-indigo-600 hover:underline text-sm mt-2 block">
          Volver
        </Link>
      </div>
    )
  }

  // Parsear versículos individuales
  // split con grupo capturador produce: ['texto_antes', 'num1', 'texto1', 'num2', 'texto2', ...]
  type Versiculo = { numero: number; texto: string }
  const versiculos: Versiculo[] = []
  const partes = capitulo.content
    .replace(/<[^>]+>/g, '')
    .split(/\[(\d+)\]/)

  for (let i = 1; i < partes.length; i += 2) {
    const num = parseInt(partes[i])
    const txt = (partes[i + 1] || '').replace(/\s+/g, ' ').trim()
    if (!isNaN(num) && txt) versiculos.push({ numero: num, texto: txt })
  }

  const capActualNum = capituloId.split('.').pop()
  const capActualIdx = capitulos.findIndex((c) => c.id === capituloId)
  const capAnterior = capActualIdx > 0 ? capitulos[capActualIdx - 1] : null
  const capSiguiente = capActualIdx < capitulos.length - 1 ? capitulos[capActualIdx + 1] : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/biblia" className="hover:text-indigo-600">Biblia</Link>
        <span>/</span>
        <Link href={`/biblia/${libroId}`} className="hover:text-indigo-600">
          {capituloId.split('.')[0]}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Capítulo {capActualNum}</span>
      </div>

      {/* Título */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-slate-800">{capitulo.reference}</h1>
        <p className="text-xs text-slate-400 mt-1">Nueva Traducción Viviente</p>
      </div>

      {/* Contenido */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <div className="space-y-3">
          {versiculos.map((v) => (
            <div key={v.numero} className="flex gap-3 group">
              <span className="flex-shrink-0 w-6 text-right text-xs font-bold text-indigo-400 mt-1 select-none">
                {v.numero}
              </span>
              <p className="text-slate-700 leading-7 text-base flex-1 group-hover:text-slate-900 transition-colors">
                {v.texto}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Devocionales de la comunidad */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            📜 Devocionales sobre este capítulo
          </h2>
          <Link
            href={`/devocionales/nuevo`}
            className="text-xs text-amber-600 hover:underline font-medium"
          >
            + Escribir uno
          </Link>
        </div>

        {devocionales && devocionales.length > 0 ? (
          devocionales.map((d) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const autor = (Array.isArray(d.perfiles) ? (d.perfiles[0] as any)?.nombre_display : (d.perfiles as any)?.nombre_display) ?? 'Anónimo'
            const categoria = CATEGORIAS_DEVOCIONAL.find((c) => c.valor === d.categoria)
            return (
              <Link key={d.id} href={`/devocionales/${d.id}`} className="block">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{categoria?.emoji}</span>
                    <span className="text-xs font-bold text-amber-700">{d.versiculo_ref}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{d.titulo}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{d.contenido}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">— {autor}</span>
                    <span className="text-xs text-amber-600">🙌 {d.total_amenes} Amén</span>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-500">Nadie ha escrito sobre este capítulo aún.</p>
            <Link href="/devocionales/nuevo" className="text-xs text-amber-600 hover:underline mt-1 block font-medium">
              ¡Sé el primero! →
            </Link>
          </div>
        )}
      </section>

      {/* Navegación entre capítulos */}
      <div className="flex justify-between gap-4">
        {capAnterior ? (
          <Link
            href={`/biblia/${libroId}/${capAnterior.id}`}
            className="flex-1 text-center bg-white border border-indigo-200 rounded-xl py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            ← Capítulo {capAnterior.number}
          </Link>
        ) : <div className="flex-1" />}

        {capSiguiente ? (
          <Link
            href={`/biblia/${libroId}/${capSiguiente.id}`}
            className="flex-1 text-center bg-indigo-600 rounded-xl py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Capítulo {capSiguiente.number} →
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}
