const BIBLE_ID = '592420522e16049f-01' // Reina Valera 1909
const BASE = 'https://rest.api.bible/v1'

async function apiFetch(path: string, revalidate = 3600) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'api-key': process.env.BIBLE_API_KEY! },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`API.Bible ${res.status}`)
  const json = await res.json()
  return json.data
}

export async function getLibros() {
  return apiFetch(`/bibles/${BIBLE_ID}/books`)
}

export async function getCapitulos(libroId: string) {
  return apiFetch(`/bibles/${BIBLE_ID}/books/${libroId}/chapters`)
}

export async function getCapitulo(capituloId: string) {
  return apiFetch(
    `/bibles/${BIBLE_ID}/chapters/${capituloId}?content-type=text&include-verse-numbers=true&include-titles=false&include-chapter-numbers=false`
  )
}

export async function buscarVersiculos(query: string) {
  return apiFetch(
    `/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(query)}&limit=12`,
    0 // no cachear búsquedas
  )
}
