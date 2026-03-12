import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { CATEGORIAS } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Testimonios — No Estás Solo',
  description: 'Peticiones de oración que fueron respondidas. ¡Gloria a Dios!',
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function TestimoniosPage() {
  const { data: testimonios } = await getSupabase()
    .from('peticiones')
    .select('id, contenido, ciudad, categoria, total_oraciones, testimonio, created_at')
    .eq('activa', false)
    .not('testimonio', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-lg mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">✨</p>
        <h1 className="text-2xl font-bold text-slate-800">Testimonios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Peticiones que fueron respondidas por Dios
        </p>
      </div>

      {(!testimonios || testimonios.length === 0) && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🌱</p>
          <p>Los testimonios aparecerán aquí</p>
          <p className="text-sm mt-1">
            Cuando alguien marque una petición como respondida y comparta su testimonio
          </p>
        </div>
      )}

      {testimonios?.map((t) => {
        const categoria = CATEGORIAS.find((c) => c.valor === t.categoria)
        return (
          <Link key={t.id} href={`/peticion/${t.id}`} className="block">
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 border-b border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{categoria?.emoji || '🙏'}</span>
                  <span className="text-xs font-medium text-amber-700">
                    {categoria?.etiqueta || 'Otro'}
                  </span>
                  {t.ciudad && (
                    <span className="text-xs text-slate-400">· 📍 {t.ciudad}</span>
                  )}
                </div>
                <p className="text-slate-600 text-sm italic">&ldquo;{t.contenido}&rdquo;</p>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  ✨ Testimonio
                </p>
                <p className="text-slate-700 text-sm">&ldquo;{t.testimonio}&rdquo;</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-indigo-600">
                    🙏 {t.total_oraciones} oraciones
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(t.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
