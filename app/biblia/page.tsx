import { getLibros } from '@/lib/bible-api'
import Link from 'next/link'
import { BuscadorVersiculo } from '@/components/BuscadorVersiculo'

export default async function BibliaPage() {
  let libros: { id: string; name: string; nameLong: string }[] = []

  try {
    libros = await getLibros()
  } catch {
    libros = []
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl mb-2">📖</p>
        <h1 className="text-2xl font-bold text-slate-800">Biblia RVR1960</h1>
        <p className="text-slate-500 text-sm mt-1">Reina-Valera 1960</p>
      </div>

      {/* Buscador */}
      <BuscadorVersiculo modo="pagina" />

      {/* Lista de libros */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Libros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {libros.map((libro) => (
            <Link
              key={libro.id}
              href={`/biblia/${libro.id}`}
              className="bg-white border border-indigo-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
            >
              {libro.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
