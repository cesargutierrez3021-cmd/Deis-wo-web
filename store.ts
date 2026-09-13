import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from './utils'
import type {
  Ajustes,
  BloqueRutina,
  Bono,
  Deuda,
  Ejercicio,
  EstadoNoah,
  GastoHogar,
  GastoHogarFijo,
  GastoMoto,
  Jornada,
  RecordatorioManual,
  Viaje,
  Apuesta,
  Ahorro,
} from './types'

const AJUSTES_POR_DEFECTO: Ajustes = {
  metaDiaria: 90000,
  ahorroMeta: 2000000,
  moneda: 'COP',
  appPreferida: 'Uber',
  horaAvisoDiario: '19:00',
  vozAsistente: 'confirmar',
  tarjetaBurbujaActiva: true,
  capitalTipsters: 100000,
}

interface Acciones {
  // jornada
  iniciarJornada: () => void
  reiniciarTurno: () => void
  terminarJornada: () => void
  jornadaAbierta: () => Jornada | undefined

  // viajes
  registrarViajeGPS: (v: Omit<Viaje, 'id' | 'fuente'>) => string
  registrarViajeManual: (v: Omit<Viaje, 'id' | 'fuente'>) => void
  fijarPagoViaje: (id: string, pago: number) => void
  actualizarKmViaje: (id: string, km: number) => void
  eliminarViaje: (id: string) => void
  eliminarDiaPruebas: (fechaClave: string) => void

  agregarBono: (b: Omit<Bono, 'id'>) => void
  agregarGastoMoto: (g: Omit<GastoMoto, 'id'>) => void
  eliminarGastoMoto: (id: string) => void

  agregarGastoHogar: (g: Omit<GastoHogar, 'id' | 'pagado'>) => void
  marcarGastoHogarPagado: (id: string, pagado: boolean) => void
  eliminarGastoHogar: (id: string) => void
  agregarGastoHogarFijo: (g: Omit<GastoHogarFijo, 'id' | 'activo'>) => void
  eliminarGastoHogarFijo: (id: string) => void

  agregarDeuda: (d: Omit<Deuda, 'id' | 'abonado' | 'pagos' | 'archivada'>) => void
  abonarDeuda: (id: string, monto: number) => void
  eliminarDeuda: (id: string) => void
  agregarAhorro: (a: Omit<Ahorro, 'id'>) => void
  eliminarAhorro: (id: string) => void

  agregarRecordatorio: (r: Omit<RecordatorioManual, 'id' | 'disparado'>) => void
  marcarRecordatorioDisparado: (id: string) => void
  eliminarRecordatorio: (id: string) => void

  agregarBloqueRutina: (b: Omit<BloqueRutina, 'id'>) => void
  actualizarBloqueRutina: (id: string, cambios: Partial<BloqueRutina>) => void
  eliminarBloqueRutina: (id: string) => void
  agregarEjercicio: (bloqueId: string, e: Omit<Ejercicio, 'id'>) => void
  eliminarEjercicio: (bloqueId: string, ejercicioId: string) => void
  agregarTipster: (nombre: string) => void
  agregarApuesta: (a: Omit<Apuesta, 'id'>) => void
  actualizarResultadoApuesta: (id: string, resultado: Apuesta['resultado']) => void

  actualizarAjustes: (cambios: Partial<Ajustes>) => void

  /** corre al abrir la app: genera los gastos fijos del mes que falten */
  generarGastosFijosDelMes: () => void
}

type Tienda = EstadoNoah & Acciones

function esHoyLocal(iso: string): boolean {
  const fecha = new Date(iso)
  const hoy = new Date()
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate()
}

export const useTienda = create<Tienda>()(
  persist(
    (set, get) => ({
      version: 1,
      jornadas: [],
      viajes: [],
      bonos: [],
      gastosMoto: [],
      gastosHogar: [],
      gastosHogarFijos: [],
      deudas: [],
      ahorros: [],
      recordatorios: [],
      rutina: [],
      tipsters: [{ id: 'cesar', nombre: 'Cesar', activo: true }, { id: 'apostador-2', nombre: 'Apostador 2', activo: true }, { id: 'apostador-3', nombre: 'Apostador 3', activo: true }],
      apuestas: [],
      ajustes: AJUSTES_POR_DEFECTO,

      jornadaAbierta: () => get().jornadas.find((j) => j.finISO === null && esHoyLocal(j.inicioISO)),

      iniciarJornada: () =>
        set((s) => {
          if (s.jornadas.some((j) => j.finISO === null && esHoyLocal(j.inicioISO))) return s
          return { jornadas: [...s.jornadas, { id: uid(), inicioISO: new Date().toISOString(), finISO: null, viajesIds: [] }] }
        }),

      reiniciarTurno: () =>
        set((s) => {
          const ahora = new Date().toISOString()
          const jornadas = s.jornadas.map((j) => (j.finISO === null && esHoyLocal(j.inicioISO) ? { ...j, finISO: ahora } : j))
          return { jornadas: [...jornadas, { id: uid(), inicioISO: ahora, finISO: null, viajesIds: [] }] }
        }),

      terminarJornada: () =>
        set((s) => ({
          jornadas: s.jornadas.map((j) => (j.finISO === null && esHoyLocal(j.inicioISO) ? { ...j, finISO: new Date().toISOString() } : j)),
        })),

      registrarViajeGPS: (v) => {
        const id = uid()
        set((s) => {
          const viaje: Viaje = { ...v, id, fuente: 'gps' }
          const abierta = s.jornadas.find((j) => j.finISO === null && esHoyLocal(j.inicioISO))
          const jornadas = abierta
            ? s.jornadas.map((j) => (j.id === abierta.id ? { ...j, viajesIds: [...j.viajesIds, id] } : j))
            : s.jornadas
          return { viajes: [...s.viajes, viaje], jornadas }
        })
        return id
      },

      registrarViajeManual: (v) =>
        set((s) => {
          const id = uid()
          const viaje: Viaje = { ...v, id, fuente: 'manual' }
          const abierta = s.jornadas.find((j) => j.finISO === null && esHoyLocal(j.inicioISO))
          const jornadas = abierta
            ? s.jornadas.map((j) => (j.id === abierta.id ? { ...j, viajesIds: [...j.viajesIds, id] } : j))
            : s.jornadas
          return { viajes: [...s.viajes, viaje], jornadas }
        }),

      fijarPagoViaje: (id, pago) => set((s) => ({ viajes: s.viajes.map((v) => (v.id === id ? { ...v, pago } : v)) })),
      actualizarKmViaje: (id, km) => set((s) => ({ viajes: s.viajes.map((v) => (v.id === id ? { ...v, km: Math.max(0, km) } : v)) })),
      eliminarViaje: (id) => set((s) => ({
        viajes: s.viajes.filter((v) => v.id !== id),
        jornadas: s.jornadas.map((j) => ({ ...j, viajesIds: j.viajesIds.filter((viajeId) => viajeId !== id) })),
      })),
      eliminarDiaPruebas: (fechaClave) => set((s) => {
        const clave = (iso: string) => {
          const d = new Date(iso)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
        const ids = new Set(s.viajes.filter((v) => clave(v.finISO) === fechaClave).map((v) => v.id))
        return {
          viajes: s.viajes.filter((v) => !ids.has(v.id)),
          jornadas: s.jornadas
            .filter((j) => clave(j.inicioISO) !== fechaClave)
            .map((j) => ({ ...j, viajesIds: j.viajesIds.filter((id) => !ids.has(id)) })),
        }
      }),

      agregarBono: (b) => set((s) => ({ bonos: [{ ...b, id: uid() }, ...s.bonos] })),

      agregarGastoMoto: (g) => set((s) => ({ gastosMoto: [{ ...g, id: uid() }, ...s.gastosMoto] })),
      eliminarGastoMoto: (id) => set((s) => ({ gastosMoto: s.gastosMoto.filter((g) => g.id !== id) })),

      agregarGastoHogar: (g) => set((s) => ({ gastosHogar: [{ ...g, id: uid(), pagado: false }, ...s.gastosHogar] })),
      marcarGastoHogarPagado: (id, pagado) =>
        set((s) => ({ gastosHogar: s.gastosHogar.map((g) => (g.id === id ? { ...g, pagado } : g)) })),
      eliminarGastoHogar: (id) => set((s) => ({ gastosHogar: s.gastosHogar.filter((g) => g.id !== id) })),
      agregarGastoHogarFijo: (g) => set((s) => ({ gastosHogarFijos: [{ ...g, id: uid(), activo: true }, ...s.gastosHogarFijos] })),
      eliminarGastoHogarFijo: (id) => set((s) => ({ gastosHogarFijos: s.gastosHogarFijos.filter((g) => g.id !== id) })),

      agregarDeuda: (d) => set((s) => ({ deudas: [{ ...d, id: uid(), abonado: 0, pagos: [], archivada: false }, ...s.deudas] })),
      abonarDeuda: (id, monto) =>
        set((s) => ({
          deudas: s.deudas.map((d) => {
            if (d.id !== id || !Number.isFinite(monto) || monto <= 0) return d
            const restante = Math.max(0, d.saldoTotal - d.abonado)
            const aplicado = Math.min(restante, monto)
            if (aplicado <= 0) return { ...d, archivada: true }
            const abonado = d.abonado + aplicado
            return { ...d, abonado, archivada: abonado >= d.saldoTotal, pagos: [...d.pagos, { id: uid(), monto: aplicado, fechaISO: new Date().toISOString() }] }
          }),
        })),
      eliminarDeuda: (id) => set((s) => ({ deudas: s.deudas.filter((d) => d.id !== id) })),

      agregarAhorro: (a) => set((s) => ({ ahorros: [{ ...a, id: uid() }, ...s.ahorros] })),
      eliminarAhorro: (id) => set((s) => ({ ahorros: s.ahorros.filter((a) => a.id !== id) })),

      agregarRecordatorio: (r) => set((s) => ({ recordatorios: [{ ...r, id: uid(), disparado: false }, ...s.recordatorios] })),
      marcarRecordatorioDisparado: (id) =>
        set((s) => ({ recordatorios: s.recordatorios.map((r) => (r.id === id ? { ...r, disparado: true } : r)) })),
      eliminarRecordatorio: (id) => set((s) => ({ recordatorios: s.recordatorios.filter((r) => r.id !== id) })),

      agregarBloqueRutina: (b) => set((s) => ({ rutina: [...s.rutina, { ...b, id: uid() }] })),
      actualizarBloqueRutina: (id, cambios) =>
        set((s) => ({ rutina: s.rutina.map((b) => (b.id === id ? { ...b, ...cambios } : b)) })),
      eliminarBloqueRutina: (id) => set((s) => ({ rutina: s.rutina.filter((b) => b.id !== id) })),
      agregarEjercicio: (bloqueId, e) =>
        set((s) => ({
          rutina: s.rutina.map((b) => (b.id === bloqueId ? { ...b, ejercicios: [...(b.ejercicios ?? []), { ...e, id: uid() }] } : b)),
        })),
      eliminarEjercicio: (bloqueId, ejercicioId) =>
        set((s) => ({
          rutina: s.rutina.map((b) =>
            b.id === bloqueId ? { ...b, ejercicios: (b.ejercicios ?? []).filter((e) => e.id !== ejercicioId) } : b
          ),
        })),

      agregarTipster: (nombre) => set((s) => ({ tipsters: [...s.tipsters, { id: uid(), nombre, activo: true }] })),
      agregarApuesta: (a) => set((s) => ({ apuestas: [{ ...a, id: uid() }, ...s.apuestas] })),
      actualizarResultadoApuesta: (id, resultado) => set((s) => ({ apuestas: s.apuestas.map((a) => a.id === id ? { ...a, resultado } : a) })),

      actualizarAjustes: (cambios) => set((s) => ({ ajustes: { ...s.ajustes, ...cambios } })),

      generarGastosFijosDelMes: () =>
        set((s) => {
          const hoy = new Date()
          const nuevos: GastoHogar[] = []
          for (const f of s.gastosHogarFijos) {
            if (!f.activo) continue
            const yaExiste = s.gastosHogar.some((g) => {
              if (g.plantillaId !== f.id) return false
              const fg = new Date(g.fechaISO)
              return fg.getFullYear() === hoy.getFullYear() && fg.getMonth() === hoy.getMonth()
            })
            if (yaExiste) continue
            if (hoy.getDate() < f.diaDelMes) continue
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), f.diaDelMes)
            nuevos.push({
              id: uid(),
              categoria: f.categoria,
              valor: f.valor,
              detalle: f.detalle,
              fechaISO: fecha.toISOString(),
              plantillaId: f.id,
              pagado: false,
            })
          }
          if (nuevos.length === 0) return s
          return { gastosHogar: [...nuevos, ...s.gastosHogar] }
        }),
    }),
    {
      name: 'noah-conductor',
      version: 2,
      merge: (persistido, actual) => {
        const guardado = (persistido ?? {}) as Partial<Tienda>
        return {
          ...actual,
          ...guardado,
          ajustes: { ...actual.ajustes, ...(guardado.ajustes ?? {}) },
          jornadas: Array.isArray(guardado.jornadas) ? guardado.jornadas : actual.jornadas,
          viajes: Array.isArray(guardado.viajes) ? guardado.viajes : actual.viajes,
          ahorros: Array.isArray(guardado.ahorros) ? guardado.ahorros : actual.ahorros,
          recordatorios: Array.isArray(guardado.recordatorios) ? guardado.recordatorios : actual.recordatorios,
          rutina: Array.isArray(guardado.rutina) ? guardado.rutina : actual.rutina,
          apuestas: Array.isArray(guardado.apuestas) ? guardado.apuestas : actual.apuestas,
        }
      },
    }
  )
)
