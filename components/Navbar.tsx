'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Inicio', emoji: '🏠' },
  { href: '/orar', label: 'Orar', emoji: '🙏' },
  { href: '/nueva-peticion', label: 'Pedir Oración', emoji: '✉️' },
  { href: '/mis-peticiones', label: 'Mis Peticiones', emoji: '📖' },
  { href: '/comunidad', label: 'Comunidad', emoji: '🌎' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🕊️</span>
            <div>
              <p className="font-bold text-base leading-tight">No Estás Solo</p>
              <p className="text-indigo-300 text-xs leading-tight">Red de Oración · Ontario</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto pb-2 gap-1 scrollbar-hide">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              <span className="text-base">{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
