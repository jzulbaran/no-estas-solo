'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BotonCompartirProps {
  peticionId: string
}

export function BotonCompartir({ peticionId }: BotonCompartirProps) {
  const url = `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://no-estas-solo.vercel.app')}/peticion/${peticionId}`

  function compartirWhatsApp() {
    const texto = encodeURIComponent(`🙏 Ayúdame a orar por esta intención: ${url}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(url)
    toast.success('¡Link copiado! Compártelo con quien quieras 🔗')
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={compartirWhatsApp}
        size="sm"
        variant="outline"
        className="text-xs border-green-300 text-green-700 hover:bg-green-50"
      >
        📲 WhatsApp
      </Button>
      <Button
        onClick={copiarLink}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        🔗 Copiar link
      </Button>
    </div>
  )
}
