'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LabsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard?tab=labs')
  }, [router])

  return null
}
