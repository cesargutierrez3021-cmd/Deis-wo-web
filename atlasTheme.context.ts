import { createContext, useContext } from 'react'
import type { AtlasColor, AtlasTheme } from './atlasTheme.constants'

type AtlasThemeContext = {
  theme: AtlasTheme
  setTheme: (theme: AtlasTheme) => void
  color: AtlasColor
  setColor: (color: AtlasColor) => void
}

export const AtlasThemeContext = createContext<AtlasThemeContext>({
  theme: 'editorial',
  setTheme: () => {},
  color: 'a',
  setColor: () => {},
})

export function useAtlasTheme() {
  return useContext(AtlasThemeContext)
}
