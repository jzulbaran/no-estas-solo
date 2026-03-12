import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { Devocional } from '@/lib/supabase'
import { DevocionalCard } from '@/components/DevocionalCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Devocionales — No Estás Solo',
  description: 'Reflexiones bíblicas y devocionales de la comunidad hispana en Ontario.',
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function DevoccionalesPage() {
  const { data: devocionales } = await getSupabase()
    .from('devocionales')
    .select('*, perfiles(nombre_display, ciudad)')
    .is('grupo_id', null)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-lg mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">📜</p>
        <h1 className="text-2xl font-bold text-slate-800">Devocionales</h1>
        <p className="text-slate-500 text-sm mt-1">
          Reflexiones bíblicas de la comunidad
        </p>
      </div>

      {/* CTA */}
      <Link href="/devocionales/nuevo">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 text-center cursor-pointer hover:shadow-md transition-shadow">
          <p className="font-semibold text-amber-800">✍️ Publicar un devocional</p>
          <p className="text-xs text-amber-600 mt-1">
            Comparte una reflexión que haya tocado tu corazón
          </p>
        </div>
      </Link>

      {/* Feed */}
      {(!devocionales || devocionales.length === 0) && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📖</p>
          <p>Aún no hay devocionales publicados</p>
          <p className="text-sm mt-1">¡Sé el primero en compartir una reflexión!</p>
        </div>
      )}

      {devocionales?.map((d) => (
        <DevocionalCard key={d.id} devocional={d as Devocional} />
      ))}
    </div>
  )
}
