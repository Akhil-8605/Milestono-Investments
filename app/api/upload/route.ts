import { NextRequest, NextResponse } from 'next/server'
import ImageKit from 'imagekit'

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
      !process.env.IMAGEKIT_PRIVATE_KEY ||
      !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    ) {
      console.warn('ImageKit credentials missing.')
      return NextResponse.json({ success: false, error: 'Upload configuration missing' }, { status: 500 })
    }

    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    })

    const formData = await req.formData()
    const image = formData.get('image') as File | null
    const folder = (formData.get('folder') as string) || '/milestono_profiles'

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name || `img_${Date.now()}`,
      folder,
      useUniqueFileName: true
    })

    return NextResponse.json({ success: true, url: response.url })
  } catch (error: any) {
    console.error('[ImageKit Upload Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload service unavailable' },
      { status: 500 }
    )
  }
}
