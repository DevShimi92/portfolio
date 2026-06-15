import { NextResponse } from 'next/server'

export async function GET() {
  const imgUrl = process.env.PROFILE_IMG_URL ?? ''
  const token  = process.env.BLOB_READ_WRITE_TOKEN ?? ''

  const res = await fetch(imgUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer   = await res.arrayBuffer()
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'private, max-age=3600'
    }
  })
}
