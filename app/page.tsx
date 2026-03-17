import { createClient } from '@/lib/supabase'
import { FeedPeticiones } from '@/components/FeedPeticiones'
import { EstadisticasVivas } from '@/components/EstadisticasVivas'
import { VersiculoDelDia } from '@/components/VersiculoDelDia'
import { getVersiculoDelDia } from '@/lib/versiculo-del-dia'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Peticion, CATEGORIAS } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

async function getPeticionesActivas(): Promise<Peticion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('peticiones')
    .select('*, perfiles(nombre_display, ciudad)')
    .eq('activa', true)
    .gt('expira_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error cargando peticiones:', error)
    return []
  }
  return (data as Peticion[]) || []
}

async function getTestimoniosRecientes() {
  const supabase = createClient()
  const { data } = await supabase
    .from('peticiones')
    .select('id, contenido, categoria, ciudad, total_oraciones, testimonio, created_at')
    .eq('activa', false)
    .not('testimonio', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)
  return data || []
}

async function getEstadisticas() {
  const supabase = createClient()
  const { data } = await supabase.rpc('estadisticas_ontario')
  return data || { oraciones_hoy: 0, peticiones_activas: 0, intercesores_hoy: 0 }
}

export default async function HomePage() {
  const [peticiones, estadisticas, versiculo, testimonios] = await Promise.all([
    getPeticionesActivas(),
    getEstadisticas(),
    getVersiculoDelDia(),
    getTestimoniosRecientes(),
  ])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white rounded-2xl p-6 shadow-lg">
        <div className="text-center">
          <p className="text-4xl mb-2">🕊️</p>
          <h1 className="text-2xl font-bold mb-1">No Estás Solo</h1>
          <p className="text-indigo-200 text-sm mb-4">
            Red de oración anónima · Hispanos en Ontario, Canadá
          </p>
          <p className="text-white/90 text-sm max-w-sm mx-auto mb-5">
            Comparte tu petición y recibe oración de tu comunidad. Personas reales orando por ti ahora mismo.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/nueva-peticion">
              <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                ✉️ Pedir Oración
              </Button>
            </Link>
            <Link href="/orar">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                🙏 Orar por Otros
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Versículo del Día */}
      <VersiculoDelDia versiculo={versiculo} />

      {/* Estadísticas en vivo */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Ontario en oración hoy
        </h2>
        <EstadisticasVivas inicial={estadisticas} />
      </section>

      {/* Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Peticiones Activas
          </h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {peticiones.length} peticiones
          </span>
        </div>
        <FeedPeticiones initialPeticiones={peticiones} />
      </section>

      {/* Testimonios recientes */}
      {testimonios.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              ✨ Oraciones Respondidas
            </h2>
            <Link href="/testimonios" className="text-xs text-indigo-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {testimonios.map((t) => {
              const categoria = CATEGORIAS.find((c) => c.valor === t.categoria)
              return (
                <Link key={t.id} href={`/peticion/${t.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 border-b border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{categoria?.emoji || '🙏'}</span>
                        <span className="text-xs font-medium text-amber-700">{categoria?.etiqueta || 'Otro'}</span>
                        {t.ciudad && <span className="text-xs text-slate-400">· 📍 {t.ciudad}</span>}
                      </div>
                      <p className="text-slate-500 text-xs italic line-clamp-1">&ldquo;{t.contenido}&rdquo;</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">✨ Testimonio</p>
                      <p className="text-slate-700 text-sm line-clamp-2">&ldquo;{t.testimonio}&rdquo;</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-indigo-600">🙏 {t.total_oraciones} oraciones</span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
