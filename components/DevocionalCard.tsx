import { Devocional, CATEGORIAS_DEVOCIONAL } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface DevocionalCardProps {
  devocional: Devocional
}

export function DevocionalCard({ devocional }: DevocionalCardProps) {
  const categoria = CATEGORIAS_DEVOCIONAL.find((c) => c.valor === devocional.categoria)
  const tiempoRelativo = formatDistanceToNow(new Date(devocional.created_at), {
    addSuffix: true,
    locale: es,
  })
  const autorNombre =
    (Array.isArray(devocional.perfiles)
      ? devocional.perfiles[0]?.nombre_display
      : devocional.perfiles?.nombre_display) ?? 'Anónimo'

  return (
    <Link href={`/devocionales/${devocional.id}`}>
      <Card className="border border-amber-100 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge className="text-xs bg-amber-50 text-amber-700">
              {categoria?.emoji} {categoria?.etiqueta}
            </Badge>
            <span className="text-xs text-slate-400">{tiempoRelativo}</span>
          </div>

          {/* Título */}
          <h3 className="font-bold text-slate-800 mb-2">{devocional.titulo}</h3>

          {/* Versículo */}
          <div className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-100">
            <p className="text-xs text-amber-700 font-semibold mb-1">{devocional.versiculo_ref}</p>
            <p className="text-xs text-slate-600 italic line-clamp-2">{devocional.versiculo_texto}</p>
          </div>

          {/* Contenido */}
          <p className="text-sm text-slate-600 line-clamp-3 mb-3">{devocional.contenido}</p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">— {autorNombre}</span>
            <span className="text-xs text-amber-600">
              🙌 {devocional.total_amenes.toLocaleString('es-MX')} Amén
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
