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
  testimonio: string | null
  perfiles?: Perfil | null
}

export type MensajeAliento = {
  id: string
  peticion_id: string
  intercesor_id: string
  mensaje: string
  created_at: string
  perfiles?: {
    nombre_display: string | null
    ciudad: string | null
  } | null
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

export type Grupo = {
  id: string
  creador_id: string | null
  nombre: string
  descripcion: string | null
  emoji_portada: string
  es_privado: boolean
  codigo_invitacion: string
  total_miembros: number
  created_at: string
}

export type GrupoMiembro = {
  id: string
  grupo_id: string
  perfil_id: string
  rol: 'admin' | 'miembro'
  joined_at: string
  perfiles?: {
    nombre_display: string | null
    ciudad: string | null
  } | null
}

export type CategoriaDevocional = 'reflexion' | 'oracion' | 'alabanza' | 'promesa' | 'otro'

export type Devocional = {
  id: string
  autor_id: string | null
  titulo: string
  contenido: string
  versiculo_ref: string
  versiculo_texto: string
  categoria: CategoriaDevocional
  grupo_id: string | null
  total_amenes: number
  created_at: string
  perfiles?: {
    nombre_display: string | null
    ciudad: string | null
  } | null
}

export const CATEGORIAS_DEVOCIONAL: { valor: CategoriaDevocional; etiqueta: string; emoji: string }[] = [
  { valor: 'reflexion', etiqueta: 'Reflexión', emoji: '📖' },
  { valor: 'oracion',   etiqueta: 'Oración',   emoji: '🙏' },
  { valor: 'alabanza',  etiqueta: 'Alabanza',   emoji: '🎶' },
  { valor: 'promesa',   etiqueta: 'Promesa',    emoji: '✝️' },
  { valor: 'otro',      etiqueta: 'Otro',       emoji: '🕊️' },
]

export const CATEGORIAS = [
  { valor: 'salud', etiqueta: 'Salud', emoji: '🏥' },
  { valor: 'familia', etiqueta: 'Familia', emoji: '👨‍👩‍👧‍👦' },
  { valor: 'trabajo', etiqueta: 'Trabajo', emoji: '💼' },
  { valor: 'fe', etiqueta: 'Fe', emoji: '✝️' },
  { valor: 'otro', etiqueta: 'Otro', emoji: '🙏' },
]
