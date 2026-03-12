'use client'

import { useEffect, useRef } from 'react'

interface ContadorOracionesProps {
  total: number
  animando?: boolean
  size?: 'default' | 'large'
}

export function ContadorOraciones({ total, animando = false, size = 'default' }: ContadorOracionesProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (animando && ref.current) {
      ref.current.classList.add('scale-125', 'text-indigo-500')
      const t = setTimeout(() => {
        ref.current?.classList.remove('scale-125', 'text-indigo-500')
      }, 400)
      return () => clearTimeout(t)
    }
  }, [animando, total])

  if (size === 'large') {
    return (
      <div className="text-center">
        <span
          ref={ref}
          className="text-6xl font-bold text-indigo-700 transition-all duration-300 inline-block"
        >
          {total.toLocaleString('es-MX')}
        </span>
        <p className="text-slate-500 text-sm mt-1">personas han orado</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-base">🙏</span>
      <span
        ref={ref}
        className="font-bold text-indigo-700 transition-all duration-300 inline-block"
      >
        {total.toLocaleString('es-MX')}
      </span>
    </div>
  )
}
