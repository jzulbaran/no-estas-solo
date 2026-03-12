import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()

// Tipos TypeScript para la base de datos
export type Perfil = {
  id: string
  nombre_display: string | null
  ciudad: string | null
  created_at: string
}

export type Peticion = {
  id: string
  autor_id: string | null
  contenido: string
  es_anonima: boolean
  ciudad: string | null
  categoria: string | null
  activa: boolean
  total_oraciones: number
  created_at: string
  expira_at: string | null
  perfiles?: Perfil | null
}

export type Oracion = {
  id: string
  peticion_id: string
  intercesor_id: string
  created_at: string
}

export const CIUDADES_ONTARIO = [
  'Toronto',
  'Ottawa',
  'Mississauga',
  'Brampton',
  'Hamilton',
  'London',
  'Markham',
  'Vaughan',
  'Kitchener',
  'Windsor',
  'Burlington',
  'Oakville',
  'Richmond Hill',
  'Oshawa',
  'Barrie',
  'St. Catharines',
  'Cambridge',
  'Kingston',
  'Guelph',
  'Sudbury',
  'Thunder Bay',
  'Otra ciudad',
]

export const CATEGORIAS = [
  { valor: 'salud', etiqueta: 'Salud', emoji: '🏥' },
  { valor: 'familia', etiqueta: 'Familia', emoji: '👨‍👩‍👧‍👦' },
  { valor: 'trabajo', etiqueta: 'Trabajo', emoji: '💼' },
  { valor: 'fe', etiqueta: 'Fe', emoji: '✝️' },
  { valor: 'otro', etiqueta: 'Otro', emoji: '🙏' },
]
