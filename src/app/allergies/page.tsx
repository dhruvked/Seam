'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AllergiesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard?tab=allergies')
  }, [router])

  return null
}
