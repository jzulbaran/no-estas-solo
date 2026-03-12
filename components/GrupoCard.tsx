'use client'

import { Grupo } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface GrupoCardProps {
  grupo: Grupo
  esMiembro?: boolean
  onUnirse?: () => void
}

export function GrupoCard({ grupo, esMiembro = false, onUnirse }: GrupoCardProps) {
  return (
    <Card className="border border-indigo-100 hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{grupo.emoji_portada}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-800 truncate">{grupo.nombre}</h3>
              <Badge
                className={`text-xs ${
                  grupo.es_privado
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {grupo.es_privado ? '🔒 Privado' : '🌎 Público'}
              </Badge>
            </div>

            {grupo.descripcion && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-2">{grupo.descripcion}</p>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                👥 {grupo.total_miembros}{' '}
                {grupo.total_miembros === 1 ? 'miembro' : 'miembros'}
              </span>

              {esMiembro ? (
                <Link href={`/grupos/${grupo.id}`}>
                  <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                    Ver grupo
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onClick={onUnirse}
                >
                  {grupo.es_privado ? '🔒 Unirse' : '+ Unirse'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
