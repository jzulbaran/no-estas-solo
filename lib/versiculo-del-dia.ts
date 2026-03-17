export type VersiculoDia = {
  ref: string
  texto: string
}

export async function getVersiculoDelDia(): Promise<VersiculoDia> {
  const BIBLE_ID = '826f63861180e056-01' // Nueva Traducción Viviente

  try {
    const res = await fetch(
      `https://rest.api.bible/v1/bibles/${BIBLE_ID}/verses/day`,
      {
        headers: { 'api-key': process.env.BIBLE_API_KEY! },
        next: { revalidate: 86400 }, // cachea 24 horas
      }
    )

    if (!res.ok) throw new Error('API error')

    const json = await res.json()
    const versiculo = json.data

    // Limpiar etiquetas HTML que puede traer la API
    const texto = versiculo.content
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      ref: versiculo.reference,
      texto,
    }
  } catch {
    // Fallback si la API falla
    return {
      ref: 'Filipenses 4:13',
      texto: 'Todo lo puedo en Cristo que me fortalece.',
    }
  }
}
