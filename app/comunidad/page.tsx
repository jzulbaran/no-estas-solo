import { createClient } from '@/lib/supabase'
import { EstadisticasVivas } from '@/components/EstadisticasVivas'

interface EstadisticasCiudad {
  ciudad: string
  oraciones: number
}

async function getEstadisticasCiudades(): Promise<EstadisticasCiudad[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('peticiones')
    .select('ciudad, total_oraciones')
    .eq('activa', true)
    .not('ciudad', 'is', null)

  if (!data) return []

  const ciudadMap = new Map<string, number>()
  data.forEach((p) => {
    if (p.ciudad) {
      ciudadMap.set(p.ciudad, (ciudadMap.get(p.ciudad) || 0) + p.total_oraciones)
    }
  })

  return Array.from(ciudadMap.entries())
    .map(([ciudad, oraciones]) => ({ ciudad, oraciones }))
    .sort((a, b) => b.oraciones - a.oraciones)
    .slice(0, 10)
}

async function getEstadisticas() {
  const supabase = createClient()
  const { data } = await supabase.rpc('estadisticas_ontario')
  return data || { oraciones_hoy: 0, peticiones_activas: 0, intercesores_hoy: 0 }
}

async function getOracionesSemana(): Promise<number> {
  const supabase = createClient()
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)

  const { count } = await supabase
    .from('oraciones')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hace7dias.toISOString())

  return count || 0
}

async function getIntercesoresSemana(): Promise<number> {
  const supabase = createClient()
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)

  const { data } = await supabase
    .from('oraciones')
    .select('intercesor_id')
    .gte('created_at', hace7dias.toISOString())

  const unicos = new Set(data?.map((o) => o.intercesor_id) || [])
  return unicos.size
}

export default async function ComunidadPage() {
  const [estadisticas, ciudades, oracionesSemana, intercesoresSemana] = await Promise.all([
    getEstadisticas(),
    getEstadisticasCiudades(),
    getOracionesSemana(),
    getIntercesoresSemana(),
  ])

  const maxOraciones = ciudades.length > 0 ? ciudades[0].oraciones : 1

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">🌎</p>
        <h1 className="text-2xl font-bold text-slate-800">Comunidad</h1>
        <p className="text-slate-500 text-sm mt-1">
          Hispanos en Ontario intercediendo juntos
        </p>
      </div>

      {/* Estadísticas de hoy */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Hoy en Ontario
        </h2>
        <EstadisticasVivas inicial={estadisticas} />
      </section>

      {/* Estadísticas de la semana */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Esta semana
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white text-center shadow">
            <p className="text-4xl font-bold">{oracionesSemana.toLocaleString('es-MX')}</p>
            <p className="text-indigo-200 text-sm mt-1">oraciones esta semana</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white text-center shadow">
            <p className="text-4xl font-bold">{intercesoresSemana.toLocaleString('es-MX')}</p>
            <p className="text-purple-200 text-sm mt-1">intercesores únicos</p>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-3">
          Esta semana {intercesoresSemana} hispanos se intercedieron entre sí en Ontario 🙏
        </p>
      </section>

      {/* Ciudades más activas */}
      {ciudades.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Ciudades más activas
          </h2>
          <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
            {ciudades.map((ciudad, i) => {
              const porcentaje = Math.round((ciudad.oraciones / maxOraciones) * 100)
              return (
                <div
                  key={ciudad.ciudad}
                  className={`flex items-center gap-3 p-3 ${
                    i < ciudades.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <span className="text-sm font-bold text-slate-400 w-5 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        📍 {ciudad.ciudad}
                      </span>
                      <span className="text-xs text-indigo-600 font-bold">
                        🙏 {ciudad.oraciones.toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Versículo */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-3">✝️</p>
        <p className="text-amber-800 italic text-sm leading-relaxed">
          "Confesaos vuestras ofensas unos a otros, y orad unos por otros, para que seáis sanados. La oración eficaz del justo puede mucho."
        </p>
        <p className="text-amber-600 text-xs mt-2 font-semibold">— Santiago 5:16</p>
      </div>

      {/* Acerca de */}
      <div className="bg-slate-100 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-700 mb-2">¿Qué es No Estás Solo?</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Una red de oración anónima para la comunidad hispanohablante en Ontario, Canadá.
          Aquí hispanos de todas las ciudades de Ontario se interceden mutuamente en oración,
          creando comunidad genuina entre personas que comparten la misma fe.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Cuando compartes tu petición, personas reales en Ontario oran por ti. No estás solo/a.
        </p>
      </div>
    </div>
  )
}
