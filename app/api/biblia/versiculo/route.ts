import { NextRequest, NextResponse } from 'next/server'

const BIBLE_ID = '826f63861180e056-01' // Nueva Traducción Viviente

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const res = await fetch(
      `https://rest.api.bible/v1/bibles/${BIBLE_ID}/verses/${id}?content-type=text&include-verse-numbers=false`,
      { headers: { 'api-key': process.env.BIBLE_API_KEY! } }
    )
    if (!res.ok) throw new Error('API error')

    const json = await res.json()
    const v = json.data
    const texto = v.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    return NextResponse.json({ ref: v.reference, texto })
  } catch {
    return NextResponse.json({ error: 'Error fetching verse' }, { status: 500 })
  }
}
