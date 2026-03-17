import { NextRequest, NextResponse } from 'next/server'
import { buscarVersiculos } from '@/lib/bible-api'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ verses: [] })
  }

  try {
    const data = await buscarVersiculos(query)
    const verses = (data?.verses || []).map((v: { reference: string; text: string }) => ({
      ref: v.reference,
      texto: v.text.replace(/\s+/g, ' ').trim(),
    }))
    return NextResponse.json({ verses })
  } catch {
    return NextResponse.json({ verses: [] }, { status: 500 })
  }
}
