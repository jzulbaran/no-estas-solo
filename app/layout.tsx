import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'No Estás Solo — Red de Oración Hispana · Ontario',
  description:
    'Red de oración anónima para la comunidad hispanohablante en Ontario, Canadá. Comparte tu petición y recibe oración de tu comunidad.',
  keywords: 'oración, hispanos, Ontario, Canadá, comunidad, fe, intercesión',
  openGraph: {
    title: 'No Estás Solo — Red de Oración Hispana · Ontario',
    description: 'Hispanos en Ontario orando los unos por los otros',
    locale: 'es_CA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  )
}
