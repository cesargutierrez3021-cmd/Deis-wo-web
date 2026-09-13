import { LocalNotifications } from '@capacitor/local-notifications'
import { AlarmaPantalla, esNativo } from '../../lib/nativo'
import type { Pendiente } from '../../lib/selectors'

function idsDePendiente(p: Pendiente) { const base = `${p.tipo}-${p.id}`; return { hoy: `${base}-hoy`, dias3: `${base}-3d`, dia1: `${base}-1d` } }
function aLasDoce(iso: string): number { const d = new Date(iso); d.setHours(12, 0, 0, 0); return d.getTime() }
function icono(p: Pendiente): string { if (p.tipo === 'deuda') return '🔫💰'; const t = `${p.nombre}`.toLowerCase(); return t.includes('moto') || t.includes('gasolina') || t.includes('transporte') ? '🏍️💰' : '🏠💰' }
function iconoAndroid(p: Pendiente): string { if (p.tipo === 'deuda') return 'ic_notif_debt'; const t = `${p.nombre}`.toLowerCase(); return t.includes('moto') || t.includes('gasolina') || t.includes('transporte') ? 'ic_notif_moto' : 'ic_notif_home' }

export async function reprogramarVencimientos(pendientes: Pendiente[]) {
  if (!esNativo()) return
  for (const p of pendientes) {
    const { hoy, dias3, dia1 } = idsDePendiente(p)
    const vence = new Date(p.fechaVenceISO)
    const emoji = icono(p)
    if (p.diasParaVencer === 0) await AlarmaPantalla.programar({ id: hoy, fechaHoraMs: aLasDoce(p.fechaVenceISO), titulo: `${emoji} ${p.nombre} vence hoy`, detalle: `Cuota de ${p.valor.toLocaleString('es-CO')} pesos.`, tipo: 'recordatorio', vozId: 'voz_1' }).catch(() => {})
    const fecha3 = new Date(vence); fecha3.setDate(fecha3.getDate() - 3); fecha3.setHours(9, 0, 0, 0)
    if (fecha3.getTime() > Date.now()) await LocalNotifications.schedule({ notifications: [{ id: crearIdNumerico(dias3), title: `${emoji} Vence en 3 días`, body: `${p.nombre} · ${p.valor.toLocaleString('es-CO')} pesos`, smallIcon: iconoAndroid(p), schedule: { at: fecha3 } }] }).catch(() => {})
    const fecha1 = new Date(vence); fecha1.setDate(fecha1.getDate() - 1); fecha1.setHours(9, 0, 0, 0)
    if (fecha1.getTime() > Date.now()) await AlarmaPantalla.programar({ id: dia1, fechaHoraMs: fecha1.getTime(), titulo: `${emoji} Vence mañana: ${p.nombre}`, detalle: `${p.valor.toLocaleString('es-CO')} pesos.`, tipo: 'recordatorio', vozId: 'voz_1' }).catch(() => {})
  }
}

export function crearIdNumerico(texto: string): number { let h = 0; for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0; return h % 1_000_000 }
