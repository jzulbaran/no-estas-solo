'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIAS, Peticion } from '@/lib/supabase'
import { BotonOrar } from './BotonOrar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PeticionCardProps {
  peticion: Peticion
  mostrarBotonOrar?: boolean
  onOro?: (peticionId: string, nuevoTotal: number) => void
}

export function PeticionCard({ peticion, mostrarBotonOrar = true, onOro }: PeticionCardProps) {
  const categoria = CATEGORIAS.find((c) => c.valor === peticion.categoria)
  const tiempoRelativo = formatDistanceToNow(new Date(peticion.created_at), {
    addSuffix: true,
    locale: es,
  })

  const nombreAutor = peticion.es_anonima
    ? 'Anónimo'
    : peticion.perfiles?.nombre_display || 'Anónimo'

  return (
    <Card className="border border-indigo-100 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {categoria && (
              <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                {categoria.emoji} {categoria.etiqueta}
              </Badge>
            )}
            {peticion.ciudad && (
              <Badge variant="outline" className="text-xs text-slate-500">
                📍 {peticion.ciudad}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{tiempoRelativo}</span>
        </div>

        {/* Contenido */}
        <p className="text-slate-700 text-base leading-relaxed mb-4">
          "{peticion.contenido}"
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="font-medium">{nombreAutor}</span>
          </div>

          {mostrarBotonOrar ? (
            <BotonOrar
              peticionId={peticion.id}
              totalInicial={peticion.total_oraciones}
              onOro={onOro}
            />
          ) : (
            <div className="flex items-center gap-1.5 text-indigo-600">
              <span className="text-lg">🙏</span>
              <span className="font-bold text-lg">{peticion.total_oraciones}</span>
              <span className="text-xs text-slate-500">oraciones</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
