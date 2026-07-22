export async function uploadImage(file: File): Promise<string | null> {
  if (!file) return null

  const formData = new FormData()
  formData.append('image', file)

  try {
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
