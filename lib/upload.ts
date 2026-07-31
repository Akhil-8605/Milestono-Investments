export const convertToWebP = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // Check if we are running on the server (e.g. during SSR) or if it's already a webp
    if (typeof window === 'undefined' || file.type === 'image/webp') {
      return resolve(file)
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      
      // Calculate new dimensions (optional, can be used for resizing)
      const MAX_WIDTH = 1920
      const MAX_HEIGHT = 1920
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return resolve(file) // Fallback to original if canvas fails

      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^/.]+$/, '.webp')
            const newFile = new File([blob], newName, { type: 'image/webp' })
            resolve(newFile)
          } else {
            resolve(file) // Fallback
          }
        },
        'image/webp',
        0.85 // High quality WebP compression
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // Fallback if image loading fails
    }
    
    img.src = url
  })
}

export async function uploadImage(file: File): Promise<string | null> {
  if (!file) return null

  try {
    // Compress and convert to WebP to drastically reduce bandwidth
    const optimizedFile = await convertToWebP(file)

    const formData = new FormData()
    formData.append('image', optimizedFile)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const json = await res.json()
    
    if (!json.success) {
      console.error('Upload failed:', json.error)
      return null
    }

    return json.url
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}
