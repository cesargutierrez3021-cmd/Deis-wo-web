export type AtlasTheme = 'editorial' | 'marea' | 'taller' | 'pulso'
export type AtlasColor = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j'

export const ATLAS_COLORS: { id: AtlasColor; name: string }[] = [
  { id: 'a', name: 'Original' },
  { id: 'b', name: 'Blanco dorado' },
  { id: 'c', name: 'Azul plata' },
  { id: 'd', name: 'Bosque cobre' },
  { id: 'e', name: 'Carbón rubí' },
  { id: 'f', name: 'Noche lavanda' },
  { id: 'g', name: 'Terracota marfil' },
  { id: 'h', name: 'Oro océano' },
  { id: 'i', name: 'Jardín nocturno' },
  { id: 'j', name: 'Lima grafito' },
]

export const ATLAS_THEMES: { id: AtlasTheme; name: string; hint: string }[] = [
  { id: 'editorial', name: 'Editorial', hint: 'lectura con carácter' },
  { id: 'marea', name: 'Marea', hint: 'flujo abierto' },
  { id: 'pulso', name: 'Pulso', hint: 'modo intenso' },
  { id: 'taller', name: 'Taller', hint: 'control técnico' },
]
