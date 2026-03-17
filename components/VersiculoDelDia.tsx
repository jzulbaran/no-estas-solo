'use client'

import { VersiculoDia } from '@/lib/versiculo-del-dia'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function VersiculoDelDia({ versiculo }: { versiculo: VersiculoDia }) {
  const fecha = new Date().toLocaleDateString('es-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Toronto',
  })

  function compartir() {
    const texto = encodeURIComponent(
      `"${versiculo.texto}"\n— ${versiculo.ref}\n\n📖 Versículo del día · No Estás Solo\nhttps://no-estas-solo.vercel.app`
    )
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  async function copiar() {
    await navigator.clipboard.writeText(`"${versiculo.texto}" — ${versiculo.ref}`)
    toast.success('Versículo copiado')
  }

  return (
    <section className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
          📖 Versículo del día
        </span>
        <span className="text-xs text-amber-600 capitalize">{fecha}</span>
      </div>

      <blockquote className="text-slate-700 text-base italic leading-relaxed mb-2">
        "{versiculo.texto}"
      </blockquote>

      <p className="text-sm font-bold text-amber-800 mb-4">— {versiculo.ref}</p>

      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={compartir}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white text-xs"
        >
          📲 Compartir en WhatsApp
        </Button>
        <Button
          onClick={copiar}
          size="sm"
          variant="outline"
          className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          🔗 Copiar
        </Button>
      </div>
    </section>
  )
}
