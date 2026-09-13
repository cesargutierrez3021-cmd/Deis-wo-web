const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const COP_K = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

export function formatearPesos(v: number): string {
  return COP.format(Math.round(v))
}

/** Versión compacta para tarjetas chicas: 153.200 → $153k, 1.500.000 → $1,5M */
export function formatearPesosCompacto(v: number): string {
  const abs = Math.abs(v)
  const signo = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${signo}$${(abs / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (abs >= 1000) return `${signo}$${Math.round(abs / 1000)}k`
  return `${signo}$${COP_K.format(abs)}`
}

export function formatearKm(km: number): string {
  const valor = Number.isInteger(km) ? km.toLocaleString('es-CO') : km.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  return valor + ' km'
}

export function formatearDuracion(ms: number): string {
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

export function formatearFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function esHoy(iso: string): boolean {
  const d = new Date(iso)
  const h = new Date()
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate()
}

export function esEstaSemana(iso: string): boolean {
  const d = new Date(iso)
  const h = new Date()
  const inicio = new Date(h)
  const diaSemana = (h.getDay() + 6) % 7 // lunes = 0
  inicio.setDate(h.getDate() - diaSemana)
  inicio.setHours(0, 0, 0, 0)
  return d >= inicio
}

export function esEsteMes(iso: string): boolean {
  const d = new Date(iso)
  const h = new Date()
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth()
}

export function formatearMiles(v: number): string {
  const abs = Math.abs(v)
  const signo = v < 0 ? '-' : ''
  if (abs >= 1000) {
    const miles = abs / 1000
    const texto = miles >= 100 ? Math.round(miles).toString() : miles.toFixed(1).replace(/\.0$/, '')
    return `${signo}$${texto}K`
  }
  return `${signo}$${Math.round(abs).toLocaleString('es-CO')}`
}
