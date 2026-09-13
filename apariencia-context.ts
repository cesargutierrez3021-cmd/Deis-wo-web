import { createContext } from 'react'

export type Tema = 'dorado' | 'mando' | 'ejecutivo' | 'aurora' | 'plata' | 'terminal' | 'editorial' | 'neon'
export type Modo = 'claro' | 'oscuro' | 'tercero' | 'cuarto' | 'quinto'

export interface Apariencia {
  tema: Tema
  modo: Modo
  yaEligio: boolean
  fijarTema: (t: Tema) => void
  fijarModo: (m: Modo) => void
  alternar: () => void
  confirmarEleccion: () => void
}

export const Ctx = createContext<Apariencia | null>(null)
