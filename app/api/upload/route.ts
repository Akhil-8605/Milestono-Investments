require('dns').setDefaultResultOrder('ipv4first');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { NextRequest, NextResponse } from 'next/server'
import https from 'https'

const MILESTONO_API = process.env.BASE_URL || 'https://api.milestono.com:6005'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image')

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    // Forward the formData to the Node.js backend
    // Since native fetch in Next.js doesn't easily accept custom https.Agents for self-signed certs in newer nodes,
    // we fallback to node-fetch or we simply pass it. In Next.js 14+ fetch natively respects NODE_TLS_REJECT_UNAUTHORIZED
    // which is the easiest bypass.
    
    const externalRes = await fetch(`${MILESTONO_API}/api/investors/upload`, {
      method: 'POST',
      body: formData,
      // @ts-ignore - Next.js extended fetch options
      dispatcher: typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' 
        ? new (require('undici').Agent)({ connect: { rejectUnauthorized: false } }) 
        : undefined
    })

    if (!externalRes.ok) {
      const errorData = await externalRes.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to upload image' },
        { status: externalRes.status }
      )
    }

    const data = await externalRes.json()
    
    // Convert relative URL from Node to absolute URL if needed, or keep it relative
    // Node backend returns `/uploads/profiles/...`
    const absoluteUrl = `${MILESTONO_API}${data.url}`

    return NextResponse.json({ success: true, url: absoluteUrl })
  } catch (error) {
    console.error('[Upload Proxy] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload service unavailable' },
      { status: 500 }
    )
  }
}
