import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url parameter', { status: 400 })

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
