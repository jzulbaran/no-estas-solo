import { getCapitulo, getCapitulos } from '@/lib/bible-api'
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

  // Limpiar el texto del contenido
  const texto = capitulo.content
    .replace(/\[\d+\]/g, (match) => `\n${match} `) // salto antes de cada número de versículo
    .replace(/\s+/g, ' ')
    .trim()

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
      <h1 className="text-xl font-bold text-slate-800">{capitulo.reference}</h1>

      {/* Contenido */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{texto}</p>
      </div>

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
