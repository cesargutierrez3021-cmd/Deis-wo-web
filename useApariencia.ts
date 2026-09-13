import { useContext } from 'react'
import { Ctx, type Apariencia } from './apariencia-context'

export function useApariencia(): Apariencia {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApariencia debe usarse dentro de ProveedorApariencia')
  return ctx
}
