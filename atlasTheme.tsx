import { useEffect, useState, type ReactNode } from 'react'
import { ATLAS_COLORS, ATLAS_THEMES, type AtlasColor, type AtlasTheme } from './atlasTheme.constants'
import { AtlasThemeContext, useAtlasTheme } from './atlasTheme.context'

function temaGuardado(value: string | null): value is AtlasTheme {
  return value === 'editorial' || value === 'marea' || value === 'taller' || value === 'pulso'
}

export function AtlasThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AtlasTheme>(() => {
    const saved = localStorage.getItem('noah-atlas-theme')
    return temaGuardado(saved) ? saved : 'editorial'
  })
  const [color, setColor] = useState<AtlasColor>(() => {
    const saved = localStorage.getItem('noah-atlas-color')
    return saved === 'b' || saved === 'c' || saved === 'd' || saved === 'e' || saved === 'f' || saved === 'g' || saved === 'h' || saved === 'i' || saved === 'j' ? saved : 'a'
  })

  useEffect(() => { localStorage.setItem('noah-atlas-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('noah-atlas-color', color) }, [color])
  useEffect(() => {
    document.documentElement.setAttribute('data-atlas-theme', theme)
    document.documentElement.setAttribute('data-atlas-color', color)
  }, [theme, color])

  return <AtlasThemeContext.Provider value={{ theme, setTheme, color, setColor }}>{children}</AtlasThemeContext.Provider>
}

/** Selector global: se muestra únicamente en bienvenida y Ajustes. */
export function AtlasThemePicker() {
  const { theme, setTheme, color, setColor } = useAtlasTheme()
  return (
    <div className="atlas-global-theme">
      <span>APARIENCIA DE TODA LA APP</span>
      <div className="atlas-theme-options">
        {ATLAS_THEMES.map((item) => (
          <button key={item.id} type="button" className={theme === item.id ? 'selected' : ''} onClick={() => setTheme(item.id)}>
            {item.name}<small>{item.hint}</small>
          </button>
        ))}
      </div>
      <div className="atlas-color-picker">
        <small>PALETA DE {theme.toUpperCase()}</small>
        {ATLAS_COLORS.map((item) => (
          <button key={item.id} type="button" title={item.name} aria-label={`Paleta ${item.name}`} className={`color-${item.id} ${color === item.id ? 'selected' : ''}`} onClick={() => setColor(item.id)} />
        ))}
      </div>
    </div>
  )
}

export function AtlasModuleFrame({ module, children }: { module: string; children: ReactNode }) {
  const { theme, color } = useAtlasTheme()
  const slug = module.toLowerCase().replaceAll(' ', '-')
  return (
    <div className={`atlas atlas-${theme} atlas-color-${color} atlas-module-frame atlas-module-${slug}`}>
      <div className="atlas-module-banner">
        <div><span className="atlas-kicker">NOAH / ESTACIÓN</span><h1>{module}</h1><p>Un espacio de NOAH para operar con claridad.</p></div>
        <span className="atlas-module-code">{theme.toUpperCase()}</span>
      </div>
      {children}
    </div>
  )
}
