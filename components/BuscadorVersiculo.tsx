'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

type Resultado = { ref: string; texto: string }

interface Props {
  // "pagina" = búsqueda standalone en /biblia
  // "form" = selector que rellena campos del formulario de devocionales
  modo: 'pagina' | 'form'
  onSeleccionar?: (resultado: Resultado) => void
}

export function BuscadorVersiculo({ modo, onSeleccionar }: Props) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault()
    if (query.trim().length < 2) return
    setBuscando(true)
    setBuscado(false)
    try {
      const res = await fetch(`/api/biblia/buscar?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResultados(data.verses || [])
    } catch {
      setResultados([])
    } finally {
      setBuscando(false)
      setBuscado(true)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={buscar} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Buscar versículo (ej: "paz", "Juan 3:16", "fe")'
          className="flex-1 border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <Button
          type="submit"
          disabled={buscando || query.trim().length < 2}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          {buscando ? '...' : '🔍 Buscar'}
        </Button>
      </form>

      {buscado && resultados.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          No se encontraron versículos para "{query}"
        </p>
      )}

      {resultados.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {resultados.map((r, i) => (
            <div
              key={i}
              className={`bg-amber-50 border border-amber-100 rounded-xl p-3 ${
                modo === 'form' ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''
              }`}
              onClick={() => modo === 'form' && onSeleccionar?.(r)}
            >
              <p className="text-xs font-bold text-amber-800 mb-1">{r.ref}</p>
              <p className="text-sm text-slate-600 italic">{r.texto}</p>
              {modo === 'form' && (
                <p className="text-xs text-indigo-500 mt-1.5 font-medium">
                  Toca para usar este versículo
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
