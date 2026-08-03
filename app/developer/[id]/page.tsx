'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DeveloperAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/developers/${resolvedParams.id}`)
    }
  }, [resolvedParams.id, router])

  return null
}
