"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirección de /mesas a /salon
 * 
 * Esta ruta ha sido consolidada en /salon para unificar
 * la gestión de mesas y el layout del salón.
 */
export default function MesasPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/salon')
  }, [router])

  return null
}
