import { getCapitulos, getLibros } from '@/lib/bible-api'
import Link from 'next/link'

interface Props {
  params: Promise<{ libroId: string }>
}

export default async function CapitulosPage({ params }: Props) {
  const { libroId } = await params

  let capitulos: { id: string; number: string }[] = []
  let nombreLibro = libroId

  try {
    const [caps, libros] = await Promise.all([getCapitulos(libroId), getLibros()])
    capitulos = caps
    const libro = libros.find((l: { id: string; name: string }) => l.id === libroId)
    if (libro) nombreLibro = libro.name
  } catch {
    capitulos = []
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/biblia" className="text-sm text-indigo-600 hover:underline">
          ← Libros
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">{nombreLibro}</h1>
        <p className="text-slate-500 text-sm">{capitulos.length} capítulos</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {capitulos
          .filter((cap) => cap.number !== 'intro')
          .map((cap) => (
            <Link
              key={cap.id}
              href={`/biblia/${libroId}/${cap.id}`}
              className="bg-white border border-indigo-100 rounded-xl py-3 text-center text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
            >
              {cap.number}
            </Link>
          ))}
      </div>
    </div>
  )
}
