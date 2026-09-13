import { esEsteMes, esEstaSemana, esHoy } from './format'
import type { Deuda, EstadoNoah, GastoHogar, GastoMoto, Viaje } from './types'

export type Periodo = 'hoy' | 'semana' | 'mes' | 'todo'

function enPeriodo(iso: string, p: Periodo): boolean {
  if (p === 'todo') return true
  if (p === 'hoy') return esHoy(iso)
  if (p === 'semana') return esEstaSemana(iso)
  return esEsteMes(iso)
}

export function viajesEnPeriodo(viajes: Viaje[], p: Periodo): Viaje[] {
  return viajes.filter((v) => enPeriodo(v.finISO, p))
}

export function duracionViajeMs(v: Viaje, ahora = Date.now()): number {
  const inicio = new Date(v.inicioISO).getTime()
  const fin = v.finISO ? new Date(v.finISO).getTime() : ahora
  return Math.max(0, Math.min(fin, ahora) - inicio)
}

export function tiempoViajesMs(viajes: Viaje[], ahora = Date.now()): number {
  return viajes.reduce((total, v) => total + duracionViajeMs(v, ahora), 0)
}

export function ingresoViajes(viajes: Viaje[]): number {
  return viajes.reduce((a, v) => a + (v.pago ?? 0), 0)
}

export function kmTotales(viajes: Viaje[]): number {
  return viajes.reduce((a, v) => a + v.km, 0)
}

export function gastoMotoEnPeriodo(gastos: GastoMoto[], p: Periodo): number {
  return gastos.filter((g) => enPeriodo(g.fechaISO, p)).reduce((a, g) => a + g.valor, 0)
}

export function gastoHogarEnPeriodo(gastos: GastoHogar[], p: Periodo): number {
  return gastos.filter((g) => enPeriodo(g.fechaISO, p)).reduce((a, g) => a + g.valor, 0)
}

export function cuotasDeudaMensuales(deudas: Deuda[]): number {
  return deudas.filter((d) => !d.archivada).reduce((a, d) => a + d.cuota, 0)
}

/** Neto del día: lo que entró en viajes y bonos, menos lo que salió en la moto. */
export function calcularResumen(estado: EstadoNoah, p: Periodo) {
  const viajes = viajesEnPeriodo(estado.viajes, p)
  const bonos = estado.bonos.filter((b) => enPeriodo(b.fechaISO, p))
  const gastosMoto = estado.gastosMoto.filter((g) => enPeriodo(g.fechaISO, p))
  const gastosHogar = estado.gastosHogar.filter((g) => enPeriodo(g.fechaISO, p))

  const ingresoV = ingresoViajes(viajes)
  const ingresoB = bonos.reduce((a, b) => a + b.monto, 0)
  const gastoM = gastosMoto.reduce((a, g) => a + g.valor, 0)
  const gasolina = gastosMoto.filter((g) => g.tipo === 'Gasolina').reduce((a, g) => a + g.valor, 0)
  const mantenimiento = gastosMoto.filter((g) => g.tipo === 'Mantenimiento').reduce((a, g) => a + g.valor, 0)
  const aceite = gastosMoto.filter((g) => g.tipo === 'Aceite').reduce((a, g) => a + g.valor, 0)
  const otrosMoto = gastosMoto.filter((g) => g.tipo !== 'Gasolina' && g.tipo !== 'Mantenimiento' && g.tipo !== 'Aceite').reduce((a, g) => a + g.valor, 0)
  const gastoH = gastosHogar.reduce((a, g) => a + g.valor, 0)
  const cuotas = cuotasDeudaMensuales(estado.deudas)

  const km = kmTotales(viajes)
  const bruto = ingresoV + ingresoB
  const neto = bruto - gastoM

  return {
    viajes,
    bonos,
    gastosMoto,
    gastosHogar,
    km,
    ingresoViajes: ingresoV,
    ingresoBonos: ingresoB,
    gastoMoto: gastoM,
    gastoGasolina: gasolina,
    gastoMantenimiento: mantenimiento,
    gastoAceite: aceite,
    gastoMotoOtros: otrosMoto,
    gastoHogar: gastoH,
    cuotasDeuda: cuotas,
    bruto,
    neto,
    entro: bruto,
    salio: gastoM + gastoH + cuotas,
    quedaLibre: bruto - gastoM - gastoH - cuotas,
    porKmBruto: km > 0 ? bruto / km : 0,
    gasolinaPorKm: km > 0 ? gasolina / km : 0,
    mantenimientoPorKm: km > 0 ? mantenimiento / km : 0,
    gastoMotoPorKm: km > 0 ? gastoM / km : 0,
    porKmNeto: km > 0 ? neto / km : 0,
    porViaje: viajes.length > 0 ? neto / viajes.length : 0,
  }
}

/** Meta diaria sugerida para no quedar corto con lo fijo del mes. */
export function metaDiariaSugerida(estado: EstadoNoah): number {
  const cuotas = cuotasDeudaMensuales(estado.deudas)
  const fijosHogar = estado.gastosHogarFijos.filter((f) => f.activo).reduce((a, f) => a + f.valor, 0)
  return Math.round((cuotas + fijosHogar) / 30)
}

export interface Pendiente {
  tipo: 'deuda' | 'hogar'
  id: string
  nombre: string
  valor: number
  fechaVenceISO: string
  diasParaVencer: number
}

function proximaFechaMensual(diaDelMes: number, hoy: Date): Date {
  const candidata = new Date(hoy.getFullYear(), hoy.getMonth(), diaDelMes)
  if (candidata < hoy) candidata.setMonth(candidata.getMonth() + 1)
  return candidata
}

export function proximosVencimientos(estado: Pick<EstadoNoah, 'deudas' | 'gastosHogarFijos' | 'gastosHogar'>): Pendiente[] {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const salida: Pendiente[] = []

  for (const d of estado.deudas) {
    if (d.archivada) continue
    if (d.saldoTotal > 0 && d.abonado >= d.saldoTotal) continue
    let fecha: Date
    if (d.vencimiento === 'mensual' && d.diaDelMes) fecha = proximaFechaMensual(d.diaDelMes, hoy)
    else if (d.fechaUnicaISO) fecha = new Date(d.fechaUnicaISO)
    else continue
    const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000)
    salida.push({ tipo: 'deuda', id: d.id, nombre: d.nombre, valor: d.cuota, fechaVenceISO: fecha.toISOString(), diasParaVencer: dias })
  }

  for (const f of estado.gastosHogarFijos) {
    if (!f.activo) continue
    const yaPagado = estado.gastosHogar.some(
      (g) => g.plantillaId === f.id && g.pagado && esEsteMes(g.fechaISO)
    )
    if (yaPagado) continue
    const fecha = proximaFechaMensual(f.diaDelMes, hoy)
    const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000)
    salida.push({ tipo: 'hogar', id: f.id, nombre: f.detalle || f.categoria, valor: f.valor, fechaVenceISO: fecha.toISOString(), diasParaVencer: dias })
  }

  return salida.sort((a, b) => a.diasParaVencer - b.diasParaVencer)
}
