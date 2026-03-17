export type VersiculoDia = {
  ref: string
  texto: string
}

// Referencias por día del año (formato API.Bible)
const REFERENCIAS = [
  'JHN.3.16', 'PSA.23.1', 'PHP.4.13', 'ISA.41.10', 'ROM.8.28',
  'PRO.3.5',  'PSA.46.1', 'MAT.11.28','ROM.8.38',  'PSA.119.105',
  'JER.29.11','PHP.4.7',  'PSA.27.1', 'ISA.40.31', 'MAT.6.33',
  'ROM.15.13','PSA.34.18','2CO.12.9', 'GAL.5.22',  'EPH.6.10',
  'PSA.91.1', 'HEB.11.1', 'JAS.1.17', '1CO.13.4',  'JHN.14.6',
  'PSA.37.4', 'MAT.5.9',  'LUK.1.37', 'ROM.12.2',  'PHP.4.6',
  'ISA.43.2', 'PSA.16.8', 'MAT.28.20','JHN.16.33', 'ROM.5.8',
  'DEU.31.6', 'PSA.121.2','JHN.10.10','EPH.2.10',  'COL.3.23',
  '1JN.4.19', 'PSA.139.14','MAT.6.34','ROM.8.1',   'HEB.13.8',
  'PSA.1.1',  'PRO.16.3', 'MAT.5.16', 'GAL.2.20',  'JHN.15.13',
]

export async function getVersiculoDelDia(): Promise<VersiculoDia> {
  const BIBLE_ID = '826f63861180e056-01' // Nueva Traducción Viviente

  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 0)
  const diaDelAnio = Math.floor((hoy.getTime() - inicio.getTime()) / 86400000)
  const refId = REFERENCIAS[diaDelAnio % REFERENCIAS.length]

  try {
    const res = await fetch(
      `https://rest.api.bible/v1/bibles/${BIBLE_ID}/verses/${refId}?content-type=text&include-verse-numbers=false`,
      {
        headers: { 'api-key': process.env.BIBLE_API_KEY! },
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) throw new Error('API error')

    const json = await res.json()
    const v = json.data

    const texto = v.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    return { ref: v.reference, texto }
  } catch {
    return {
      ref: 'Filipenses 4:13',
      texto: 'Todo lo puedo en Cristo que me fortalece.',
    }
  }
}
