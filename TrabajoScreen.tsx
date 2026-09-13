import { useEffect, useMemo, useState } from 'react'
import { Gift, Fuel, ChevronDown } from 'lucide-react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, Boton, Chip, Campo, Entrada, EntradaPesos, TituloSeccion } from '../../components/ui/primitives'
import { useTienda } from '../../lib/store'
import { useViaje } from './useViaje'
import { APPS, type App, type TipoGastoMoto } from '../../lib/types'
import { formatearDuracion, formatearKm, formatearPesos, formatearPesosCompacto, formatearMiles, formatearHora, formatearFechaCorta, esHoy, esEstaSemana, esEsteMes } from '../../lib/format'
import { calcularResumen, duracionViajeMs, type Periodo } from '../../lib/selectors'
import { Burbuja, esNativo } from '../../lib/nativo'
import { useApariencia } from '../../lib/useApariencia'
import { useAtlasTheme } from '../atlas/atlasTheme.context'

const TIPOS_GASTO: TipoGastoMoto[] = ['Gasolina', 'Mantenimiento', 'Otro mantenimiento', 'Aceite', 'Comida', 'Mercado', 'Multa', 'Otro']
const ETIQUETAS_GASTO: Record<TipoGastoMoto, string> = { Gasolina: 'Gasolina', Mantenimiento: 'Manten.', 'Otro mantenimiento': 'Otro manten.', Aceite: 'Aceite', Comida: 'Comida', Mercado: 'Mercado', Lavado: 'Lavado', Peaje: 'Peaje', Multa: 'Multa', Otro: 'Otro' }
const PERIODOS: { v: Periodo; l: string }[] = [
  { v: 'hoy', l: 'Hoy' },
  { v: 'semana', l: 'Semana' },
  { v: 'mes', l: 'Mes' },
  { v: 'todo', l: 'Todo' },
]

const CORTES = [
  { id: 'madrugada', nombre: 'Corte 1 · 4:00 a. m. – 11:00 a. m.', inicio: 4, fin: 11 },
  { id: 'mediodia', nombre: 'Corte 2 · 11:00 a. m. – 2:00 p. m.', inicio: 11, fin: 14 },
  { id: 'tarde', nombre: 'Corte 3 · 2:00 p. m. – 6:00 p. m.', inicio: 14, fin: 18 },
  { id: 'noche', nombre: 'Corte 4 · 6:00 p. m. – 4:00 a. m.', inicio: 18, fin: 4 },
] as const

function corteDeFecha(iso: string) {
  const hora = new Date(iso).getHours()
  return CORTES.find((c) => c.inicio < c.fin ? hora >= c.inicio && hora < c.fin : hora >= c.inicio || hora < c.fin) ?? CORTES[0]
}

function fechaEnPeriodo(iso: string, periodo: Periodo) {
  return periodo === 'todo' || periodo === 'hoy' && esHoy(iso) || periodo === 'semana' && esEstaSemana(iso) || periodo === 'mes' && esEsteMes(iso)
}

function coloresBurbuja() {
  const estilos = getComputedStyle(document.documentElement)
  return {
    colorAcento: estilos.getPropertyValue('--c-acento').trim() || '#D4AF37',
    colorFg: estilos.getPropertyValue('--c-fg').trim() || '#F3EDDD',
    colorSurface: estilos.getPropertyValue('--c-surface').trim() || '#14100A',
  }
}

function claveFechaLocal(iso: string) {
  const fecha = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

function milisegundosEnHoy(inicioISO: string, finISO: string | null, ahora: number): number {
  const hoy = new Date(ahora)
  hoy.setHours(0, 0, 0, 0)
  const desde = Math.max(new Date(inicioISO).getTime(), hoy.getTime())
  const hasta = Math.min(finISO ? new Date(finISO).getTime() : ahora, ahora)
  return Math.max(0, hasta - desde)
}

function kmBurbuja(km: number): string { return Math.round(km).toLocaleString('es-CO') }

export function TrabajoScreen() {
  const { tema, modo } = useApariencia()
  const { theme } = useAtlasTheme()
  const estado = useTienda()
  const jornadaAbierta = estado.jornadaAbierta()
  const iniciarJornada = useTienda((s) => s.iniciarJornada)
  const reiniciarTurno = useTienda((s) => s.reiniciarTurno)
  const terminarJornada = useTienda((s) => s.terminarJornada)
  const fijarPagoViaje = useTienda((s) => s.fijarPagoViaje)
  const actualizarKmViaje = useTienda((s) => s.actualizarKmViaje)
  const registrarViajeManual = useTienda((s) => s.registrarViajeManual)
  const agregarBono = useTienda((s) => s.agregarBono)
  const agregarGastoMoto = useTienda((s) => s.agregarGastoMoto)
  const eliminarGastoMoto = useTienda((s) => s.eliminarGastoMoto)

  const viaje = useViaje()
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [mostrarManual, setMostrarManual] = useState(false)
  const [mostrarBono, setMostrarBono] = useState(false)
  const [mostrarGasto, setMostrarGasto] = useState(false)
  const [mostrarPanelJornada, setMostrarPanelJornada] = useState(true)
  const [mostrarCortes, setMostrarCortes] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (!jornadaAbierta && !viaje.activo) return
    const id = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [jornadaAbierta, viaje.activo])

  const resumen = useMemo(() => calcularResumen(estado, periodo), [estado, periodo])
  const pendientes = useMemo(() => estado.viajes.filter((v) => v.pago === null), [estado.viajes])
  const msJornadaPeriodo = periodo === 'hoy'
    ? estado.jornadas.filter((j) => esHoy(j.inicioISO)).reduce((total, j) => total + milisegundosEnHoy(j.inicioISO, j.finISO, ahora), 0)
    : estado.jornadas.filter((j) => fechaEnPeriodo(j.inicioISO, periodo)).reduce((total, j) => total + (j.finISO ? new Date(j.finISO).getTime() : ahora) - new Date(j.inicioISO).getTime(), 0)
  const msViajesPeriodo = periodo === 'hoy'
    ? estado.viajes.filter((v) => esHoy(v.inicioISO)).reduce((total, v) => total + milisegundosEnHoy(v.inicioISO, v.finISO, ahora), 0) + (viaje.activo ? viaje.msTranscurridos : 0)
    : resumen.viajes.reduce((total, v) => total + new Date(v.finISO).getTime() - new Date(v.inicioISO).getTime(), 0)
  const gasolinaPeriodo = resumen.gastosMoto.filter((g) => g.tipo === 'Gasolina').reduce((total, g) => total + g.valor, 0)
  const gastoMantenimiento = resumen.gastosMoto.filter((g) => g.tipo === 'Mantenimiento').reduce((total, g) => total + g.valor, 0)
  const gastoAceite = resumen.gastosMoto.filter((g) => g.tipo === 'Aceite').reduce((total, g) => total + g.valor, 0)
  const gastosMotoOtros = resumen.gastosMoto.filter((g) => g.tipo !== 'Gasolina' && g.tipo !== 'Mantenimiento' && g.tipo !== 'Aceite').reduce((total, g) => total + g.valor, 0)
  const gastoMotoTotal = resumen.gastosMoto.reduce((total, g) => total + g.valor, 0)
  const costoGasolinaPorKm = resumen.km > 0 ? gasolinaPeriodo / resumen.km : 0
  const msTiempoMuerto = Math.max(0, msJornadaPeriodo - msViajesPeriodo)
  const ingresosConDuracion = resumen.viajes.filter((v) => (v.pago ?? 0) > 0 && duracionViajeMs(v, ahora) > 0).reduce((total, v) => total + (v.pago ?? 0), 0)
  const msConIngreso = resumen.viajes.filter((v) => (v.pago ?? 0) > 0).reduce((total, v) => total + duracionViajeMs(v, ahora), 0) + (viaje.activo && periodo === 'hoy' ? viaje.msTranscurridos : 0)
  const dineroPorHoraReal = msConIngreso > 0 ? ingresosConDuracion / (msConIngreso / 3600000) : 0
  const dineroPorHoraConTiempoMuerto = msJornadaPeriodo > 0 ? resumen.ingresoViajes / (msJornadaPeriodo / 3600000) : 0
  const valorTiempoMuerto = msTiempoMuerto / 3600000 * dineroPorHoraReal
  const conteoViajes = resumen.viajes.length + (viaje.activo && periodo === 'hoy' ? 1 : 0)
  const resumenBurbuja = useMemo(() => {
    const crear = (filtro: (iso: string) => boolean) => {
      const viajes = estado.viajes.filter((v) => filtro(v.finISO))
      const dinero = viajes.reduce((total, v) => total + (v.pago ?? 0), 0)
      const km = viajes.reduce((total, v) => total + v.km, 0)
      return `${viajes.length} viajes · ${formatearPesosCompacto(dinero)} · ${kmBurbuja(km)} km`
    }
    return {
      hoy: crear(esHoy),
      semana: crear(esEstaSemana),
      mes: crear(esEsteMes),
    }
  }, [estado.viajes])

  useEffect(() => {
    if (!esNativo() || !jornadaAbierta) return
    Burbuja.actualizar({
      km: kmBurbuja(viaje.km),
      tiempo: formatearDuracion(viaje.msTranscurridos),
      enViaje: viaje.activo,
      totalViajes: conteoViajes,
      resumenHoy: resumenBurbuja.hoy,
      resumenSemana: resumenBurbuja.semana,
      resumenMes: resumenBurbuja.mes,
      ...coloresBurbuja(),
      tarjetaActiva: estado.ajustes.tarjetaBurbujaActiva !== false,
    }).catch(() => {})
  }, [estado.ajustes.tarjetaBurbujaActiva, jornadaAbierta, resumenBurbuja, tema, modo, conteoViajes, viaje.activo, viaje.km, viaje.msTranscurridos])

  const cortes = useMemo(() => {
    const datos = new Map(CORTES.map((c) => [c.id, { ...c, viajes: 0, km: 0, dinero: 0, gasolina: 0 }]))
    for (const v of resumen.viajes) {
      const dato = datos.get(corteDeFecha(v.inicioISO).id)
      if (dato) {
        dato.viajes += 1
        dato.km += v.km
        dato.dinero += v.pago ?? 0
      }
    }
    for (const g of resumen.gastosMoto) {
      if (g.tipo === 'Gasolina') {
        const dato = datos.get(corteDeFecha(g.fechaISO).id)
        if (dato) dato.gasolina += g.valor
      }
    }
    return CORTES.map((c) => {
      const dato = datos.get(c.id)!
      return { ...dato, promedioViaje: dato.viajes ? dato.dinero / dato.viajes : 0, dineroKm: dato.km ? dato.dinero / dato.km : 0 }
    })
  }, [resumen.viajes, resumen.gastosMoto])

  async function alIniciarJornada() {
    iniciarJornada()
    if (esNativo()) {
      const permiso = await Burbuja.tienePermiso()
      if (!permiso.concedido) {
        await Burbuja.solicitarPermiso().catch(() => {})
        return
      }
      await Burbuja.mostrar({ km: '0', tiempo: '0m', enViaje: false, estilo: theme, totalViajes: conteoViajes, resumenHoy: resumenBurbuja.hoy, resumenSemana: resumenBurbuja.semana, resumenMes: resumenBurbuja.mes, ...coloresBurbuja(), tarjetaActiva: estado.ajustes.tarjetaBurbujaActiva !== false }).catch(() => {})
    }
  }

  function alTerminarJornada() {
    if (viaje.activo) viaje.terminarViaje(true)
    terminarJornada()
    if (esNativo()) Burbuja.ocultar().catch(() => {})
  }

  async function alReiniciarTurno() {
    if (viaje.activo) viaje.terminarViaje(true)
    reiniciarTurno()
    if (esNativo()) Burbuja.mostrar({ km: '0', tiempo: '0m', enViaje: false, estilo: theme, totalViajes: conteoViajes, resumenHoy: resumenBurbuja.hoy, resumenSemana: resumenBurbuja.semana, resumenMes: resumenBurbuja.mes, ...coloresBurbuja(), tarjetaActiva: estado.ajustes.tarjetaBurbujaActiva !== false }).catch(() => {})
  }

  return (
    <Pantalla>
      <TituloPantalla
        kicker={jornadaAbierta ? 'Jornada abierta' : 'Sin jornada'}
        titulo="Tu turno"
        bajada={jornadaAbierta ? `Desde las ${formatearHora(jornadaAbierta.inicioISO)}.` : 'Inicia la jornada para empezar a registrar viajes.'}
      />

      {viaje.errorGps && (
        <p className="mt-3 rounded-[var(--radius-btn)] border border-loss/35 bg-loss/10 px-3 py-2 text-[12px] text-loss">
          {viaje.errorGps}
        </p>
      )}

      <Card className="turno-resumen mt-4 grid grid-cols-2 gap-3 p-3">
          <div>
            <p className="tabular text-[19px] font-semibold text-fg">{formatearDuracion(msJornadaPeriodo)}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">tiempo total jornada</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-acento-alto">{formatearDuracion(msViajesPeriodo)}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">tiempo real viajes</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-fg">{formatearKm(resumen.km)}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">kilómetros acumulados</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-win">{resumen.km > 0 ? formatearPesosCompacto(resumen.porKmBruto) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">ingreso / kilómetro</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-win">{costoGasolinaPorKm > 0 ? formatearPesosCompacto(costoGasolinaPorKm) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">gasolina / km</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-fg">{formatearDuracion(msTiempoMuerto)}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">tiempo muerto</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-loss">{valorTiempoMuerto > 0 ? formatearPesosCompacto(valorTiempoMuerto) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">valor tiempo muerto</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-acento-alto">{conteoViajes}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">viajes marcador</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-win">{dineroPorHoraReal > 0 ? formatearMiles(dineroPorHoraReal) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">dinero / hora real</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-fg">{dineroPorHoraConTiempoMuerto > 0 ? formatearPesosCompacto(dineroPorHoraConTiempoMuerto) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">dinero / hora total</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-loss">{resumen.km > 0 ? formatearPesosCompacto(gastoMantenimiento / resumen.km) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">mantenimiento / km</p>
          </div>
          <div>
            <p className="tabular text-[19px] font-semibold text-loss">{resumen.km > 0 ? formatearPesosCompacto(gastoMotoTotal / resumen.km) : '—'}</p>
            <p className="text-[9px] leading-tight text-mute uppercase">gastos moto / km</p>
          </div>
      </Card>

      {/* Viaje en curso */}
      {viaje.activo && (
        <Card className="mt-4 p-4" style={{ borderColor: 'var(--c-acento-linea)' }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-acento-alto uppercase">
              <span className="size-1.5 rounded-full bg-acento breathe" /> Viaje en curso · {viaje.app}
            </span>
          </div>
          <div className="tabular mt-2 flex items-end gap-4">
            <div>
              <p className="text-[30px] font-semibold text-fg">{formatearDuracion(viaje.msTranscurridos)}</p>
              <p className="text-[10px] text-mute uppercase">tiempo</p>
            </div>
            <div>
              <p className="text-[30px] font-semibold text-fg">{viaje.km.toFixed(1)}</p>
              <p className="text-[10px] text-mute uppercase">km</p>
            </div>
          </div>
        </Card>
      )}

      {/* Control de jornada */}
      {!jornadaAbierta ? (
        <Boton className="mt-5" onClick={alIniciarJornada}>
          Iniciar jornada
        </Boton>
      ) : (
        <div className="mt-5 space-y-2.5">
          <div className="flex gap-2">
            <Boton variante="fantasma" className="min-h-9 text-[12px] normal-case" onClick={alTerminarJornada}>Terminar jornada</Boton>
            <Boton variante="fantasma" className="min-h-9 text-[12px] normal-case" onClick={alReiniciarTurno}>Reset turno</Boton>
          </div>
        </div>
      )}

      {/* Pendientes de pago */}
      {pendientes.length > 0 && (
        <>
          <TituloSeccion>Pendientes de pago · {pendientes.length}</TituloSeccion>
          <div className="space-y-2.5">
            {pendientes.map((v) => (
              <PendientePago key={v.id} viaje={v} onGuardar={(pago) => fijarPagoViaje(v.id, pago)} />
            ))}
          </div>
        </>
      )}

      {/* Jornada y registros */}
      <section className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setMostrarPanelJornada((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
          <span><span className="block text-[13px] font-semibold text-fg">Jornada y registros</span><span className="block text-[10px] text-mute">Viaje manual, bonos, gastos e historial</span></span>
          <ChevronDown size={18} className={mostrarPanelJornada ? 'rotate-180 text-acento-alto transition-transform' : 'text-mute transition-transform'} />
        </button>
        {mostrarPanelJornada && <div className="space-y-4 border-t border-line p-3">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setMostrarManual((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface-2 px-2 py-3 text-[11px] text-fg">{mostrarManual ? 'Cerrar' : 'Agregar viaje manual'}</button>
            <button type="button" onClick={() => setMostrarBono((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface-2 px-2 py-3 text-[11px] text-fg">{mostrarBono ? 'Cerrar' : 'Agregar bono'}</button>
            <button type="button" onClick={() => setMostrarGasto((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface-2 px-2 py-3 text-[11px] text-fg">{mostrarGasto ? 'Cerrar' : 'Agregar gasto'}</button>
          </div>
          {mostrarManual && <FormularioManual onGuardar={(v) => { registrarViajeManual(v); setMostrarManual(false) }} />}
          {mostrarBono && <FormularioBono onGuardar={(b) => { agregarBono(b); setMostrarBono(false) }} />}
          {mostrarGasto && <FormularioGastoMoto onGuardar={(g) => { agregarGastoMoto(g); setMostrarGasto(false) }} />}
          {estado.gastosMoto.length > 0 && <div className="space-y-2">
            <p className="px-1 text-[10px] font-semibold tracking-[0.12em] text-mute uppercase">Gastos recientes</p>
            {estado.gastosMoto.slice(0, 20).map((g) => <Card key={g.id} className="flex items-center justify-between gap-3 p-3"><div><p className="text-[12.5px] font-medium text-fg">{g.tipo} · {formatearPesos(g.valor)}</p><p className="text-[10.5px] text-mute">{new Date(g.fechaISO).toLocaleDateString('es-CO')}{g.nota ? ` · ${g.nota}` : ''}</p></div><button type="button" onClick={() => eliminarGastoMoto(g.id)} className="rounded-full border border-loss/40 px-2.5 py-1.5 text-[10px] font-semibold text-loss">Quitar</button></Card>)}
          </div>}
          <details className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
            <summary className="cursor-pointer px-3 py-3 text-[12px] font-semibold text-fg">Historial · últimos cinco días</summary>
            <div className="px-2 pb-2"><UltimosDias onActualizarKm={actualizarKmViaje} /></div>
          </details>
        </div>}
      </section>

      {/* Resumen */}
      <TituloSeccion>Resumen</TituloSeccion>
      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <Chip key={p.v} activo={periodo === p.v} onClick={() => setPeriodo(p.v)}>
            {p.l}
          </Chip>
        ))}
      </div>
      <Card className="resumen-kpi mt-3 p-4">
        <p className="text-[10px] tracking-[0.12em] text-mute uppercase">Neto ({PERIODOS.find((p) => p.v === periodo)?.l.toLowerCase()})</p>
        <p className={`tabular mt-1 text-[26px] font-semibold ${resumen.neto >= 0 ? 'text-fg' : 'text-loss'}`}>{formatearPesos(resumen.neto)}</p>
      </Card>
      <Card className="resumen-detalle mt-3 divide-y divide-[var(--c-line)] p-0">
        <FilaRendimiento etiqueta="Gastos de moto" sub={`${formatearPesos(resumen.gastoMoto)} · todos los tipos`} valor={formatearPesos(resumen.km > 0 ? resumen.gastoMoto / resumen.km : 0) + ' / km'} tono="win" />
        <FilaRendimiento etiqueta="Gasolina" sub={`${formatearPesos(gasolinaPeriodo)} en el período`} valor={formatearPesos(resumen.km > 0 ? gasolinaPeriodo / resumen.km : 0) + ' / km'} />
        <FilaRendimiento etiqueta="Mantenimiento" sub={formatearPesos(gastoMantenimiento)} valor={formatearPesos(resumen.km > 0 ? gastoMantenimiento / resumen.km : 0) + ' / km'} />
        <FilaRendimiento etiqueta="Aceite" sub={formatearPesos(gastoAceite)} valor={formatearPesos(resumen.km > 0 ? gastoAceite / resumen.km : 0) + ' / km'} />
        <FilaRendimiento etiqueta="Otros gastos de moto" sub={formatearPesos(gastosMotoOtros)} valor={formatearPesos(resumen.km > 0 ? gastosMotoOtros / resumen.km : 0) + ' / km'} />
      </Card>

      <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setMostrarCortes((v) => !v)} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
          <span>
            <span className="block text-[13px] font-semibold text-fg">Cortes del día</span>
            <span className="block text-[10px] text-mute">Viajes, km, dinero y promedio por horario</span>
          </span>
          <ChevronDown size={18} className={mostrarCortes ? 'rotate-180 text-acento-alto transition-transform' : 'text-mute transition-transform'} />
        </button>
        {mostrarCortes && (
          <div className="divide-y divide-[var(--c-line)] border-t border-line">
            {cortes.map((c) => (
              <div key={c.id} className="px-4 py-3">
                <p className="text-[12px] font-semibold text-fg">{c.nombre}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-mute">Viajes <b className="text-fg">{c.viajes}</b></span>
                  <span className="text-mute">Kilómetros <b className="text-fg">{formatearKm(c.km)}</b></span>
                  <span className="text-mute">Dinero <b className="text-win">{formatearPesos(c.dinero)}</b></span>
                  <span className="text-mute">Promedio/viaje <b className="text-fg">{formatearPesos(c.promedioViaje)}</b></span>
                  <span className="text-mute">Dinero/km <b className="text-acento-alto">{formatearPesos(c.dineroKm)}</b></span>
                  <span className="text-mute">Gasolina/km <b className="text-loss">{c.km > 0 ? formatearPesos(c.gasolina / c.km) : '—'}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rendimiento */}
      <TituloSeccion>Rendimiento</TituloSeccion>
      <Card className="divide-y divide-[var(--c-line)] p-0">
        <FilaRendimiento etiqueta="Por kilómetro (bruto)" sub={`sobre ${formatearKm(resumen.km)}`} valor={formatearPesos(resumen.porKmBruto)} />
        <FilaRendimiento etiqueta="Por kilómetro (neto)" sub="ya descontando la moto" valor={formatearPesos(resumen.porKmNeto)} tono="win" />
        <FilaRendimiento etiqueta="Por viaje" sub={`${resumen.viajes.length} viajes`} valor={formatearPesos(resumen.porViaje)} />
      </Card>

    </Pantalla>
  )
}

function FilaRendimiento({ etiqueta, sub, valor, tono }: { etiqueta: string; sub: string; valor: string; tono?: 'win' }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-[13.5px] text-fg">{etiqueta}</p>
        <p className="text-[11px] text-mute">{sub}</p>
      </div>
      <p className={`tabular text-[15px] font-semibold ${tono === 'win' ? 'text-win' : 'text-fg'}`}>{valor}</p>
    </div>
  )
}

function PendientePago({ viaje, onGuardar }: { viaje: { id: string; km: number; app: App; finISO: string }; onGuardar: (pago: number) => void }) {
  const [pago, setPago] = useState(0)
  return (
    <Card className="p-3.5">
      <p className="text-[12.5px] text-mute">
        {viaje.app} · {formatearKm(viaje.km)} · {formatearHora(viaje.finISO)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <EntradaPesos valor={pago} onCambio={setPago} placeholder="¿Cuánto le pagó?" />
        <button
          disabled={pago <= 0}
          onClick={() => onGuardar(pago)}
          className="display min-h-11 shrink-0 rounded-[var(--radius-btn)] px-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--btn-fg)] uppercase disabled:opacity-40"
          style={{ background: 'var(--grad-acento)' }}
        >
          Guardar
        </button>
      </div>
    </Card>
  )
}

function valorFechaHoraLocal() {
  const fecha = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
}

function FormularioManual({ onGuardar }: { onGuardar: (v: { app: App; km: number; pago: number | null; inicioISO: string; finISO: string; nota?: string }) => void }) {
  const preferida = useTienda((s) => s.ajustes.appPreferida)
  const [app, setApp] = useState<App>(preferida)
  const [km, setKm] = useState('')
  const [pago, setPago] = useState(0)
  const [nota, setNota] = useState('')
  const [inicio, setInicio] = useState(valorFechaHoraLocal())
  const [fin, setFin] = useState(valorFechaHoraLocal())

  return (
    <Card className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {APPS.map((a) => (
          <Chip key={a} activo={app === a} onClick={() => setApp(a)}>
            {a}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Kilómetros">
          <Entrada inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="0.0" />
        </Campo>
        <Campo etiqueta="Me pagó">
          <EntradaPesos valor={pago} onCambio={setPago} />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Hora de inicio">
          <Entrada type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo etiqueta="Hora final">
          <Entrada type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} />
        </Campo>
      </div>
      <Campo etiqueta="Nota (opcional)">
        <Entrada value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Zona, cliente, detalle…" />
      </Campo>
      <Boton
        disabled={!km}
        onClick={() => {
          const inicioISO = new Date(inicio).toISOString()
          const finISO = new Date(fin).toISOString()
          onGuardar({ app, km: parseFloat(km) || 0, pago: pago || null, inicioISO, finISO, nota: nota || undefined })
        }}
      >
        Guardar viaje
      </Boton>
    </Card>
  )
}

function FormularioBono({ onGuardar }: { onGuardar: (b: { origen: App | 'Otro'; monto: number; concepto: string; fechaISO: string }) => void }) {
  const [origen, setOrigen] = useState<App | 'Otro'>('Uber')
  const [monto, setMonto] = useState(0)
  const [concepto, setConcepto] = useState('')
  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Origen">
          <select value={origen} onChange={(e) => setOrigen(e.target.value as App | 'Otro')} className="min-h-11 w-full rounded-[var(--radius-btn)] border border-line bg-surface-2 px-3 text-[15px] text-fg">
            {[...APPS, 'Otro' as const].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Monto">
          <EntradaPesos valor={monto} onCambio={setMonto} />
        </Campo>
      </div>
      <Campo etiqueta="Concepto">
        <Entrada value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Meta de 15 viajes, hora pico…" />
      </Campo>
      <Boton
        disabled={monto <= 0}
        onClick={() => {
          onGuardar({ origen, monto, concepto, fechaISO: new Date().toISOString() })
          setMonto(0)
          setConcepto('')
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Gift size={15} /> Sumar bono
        </span>
      </Boton>
    </Card>
  )
}

export function FormularioGastoMoto({ onGuardar }: { onGuardar: (g: { tipo: TipoGastoMoto; valor: number; litros?: number; nota?: string; fechaISO: string }) => void }) {
  const [tipo, setTipo] = useState<TipoGastoMoto>('Gasolina')
  const [valor, setValor] = useState(0)
  const [litros, setLitros] = useState('')
  const [nota, setNota] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-4 gap-2">
            {TIPOS_GASTO.map((t) => (
              <Chip key={t} activo={tipo === t} onClick={() => setTipo(t)}>
            {ETIQUETAS_GASTO[t]}
              </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Valor">
          <EntradaPesos valor={valor} onCambio={setValor} />
        </Campo>
        <Campo etiqueta="Litros (si es gasolina)">
          <Entrada inputMode="decimal" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="—" />
        </Campo>
      </div>
      <Campo etiqueta="Nota">
        <Entrada value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Estación, taller, almuerzo…" />
      </Campo>
      <Campo etiqueta="Fecha del gasto (permite días anteriores)">
        <Entrada type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
      <Boton
        variante="contorno"
        disabled={valor <= 0}
        onClick={() => {
          onGuardar({ tipo, valor, litros: litros ? parseFloat(litros) : undefined, nota: nota || undefined, fechaISO: new Date(`${fecha}T12:00:00`).toISOString() })
          setValor(0)
          setLitros('')
          setNota('')
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Fuel size={15} /> Guardar gasto
        </span>
      </Boton>
    </Card>
  )
}

function EditarKmViaje({ id, km, onGuardar }: { id: string; km: number; onGuardar: (id: string, km: number) => void }) {
  const [valor, setValor] = useState(String(km))
  const [editando, setEditando] = useState(km === 0)
  if (!editando) return <button type="button" className="text-acento-alto underline" onClick={() => setEditando(true)}>{formatearKm(km)}</button>
  return <span className="inline-flex items-center gap-1"><Entrada inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="h-7 w-16 px-1 text-center" /><button type="button" className="text-acento-alto" onClick={() => { onGuardar(id, parseFloat(valor) || 0); setEditando(false) }}>Guardar</button></span>
}

export function OperacionesCompactas() {
  const estado = useTienda()
  const fijarPago = useTienda((s) => s.fijarPagoViaje)
  const registrarManual = useTienda((s) => s.registrarViajeManual)
  const agregarBono = useTienda((s) => s.agregarBono)
  const agregarGasto = useTienda((s) => s.agregarGastoMoto)
  const [manual, setManual] = useState(false)
  const [bono, setBono] = useState(false)
  const [gasto, setGasto] = useState(false)
  const pendientes = estado.viajes.filter((v) => v.pago === null).sort((a, b) => b.finISO.localeCompare(a.finISO))
  return <section className="atlas-operations"><TituloSeccion>Operación y registros</TituloSeccion>{pendientes.length > 0 && <div className="mb-3"><p className="mb-2 text-[10px] uppercase tracking-[.12em] text-mute">Viajes pendientes de pago</p><div className="space-y-2">{pendientes.map((v) => <PendientePago key={v.id} viaje={v} onGuardar={(pago) => fijarPago(v.id, pago)} />)}</div></div>}<div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setManual((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface px-2 py-3 text-[11px] text-fg">{manual ? 'Cerrar' : 'Agregar viaje'}</button><button type="button" onClick={() => setBono((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface px-2 py-3 text-[11px] text-fg">{bono ? 'Cerrar' : 'Agregar bono'}</button><button type="button" onClick={() => setGasto((v) => !v)} className="rounded-[var(--radius-btn)] border border-line bg-surface px-2 py-3 text-[11px] text-fg">{gasto ? 'Cerrar' : 'Agregar gasto'}</button></div>{manual && <FormularioManual onGuardar={(v) => { registrarManual(v); setManual(false) }} />}{bono && <FormularioBono onGuardar={(v) => { agregarBono(v); setBono(false) }} />}{gasto && <FormularioGastoMoto onGuardar={(v) => { agregarGasto(v); setGasto(false) }} />}<details className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"><summary className="cursor-pointer px-4 py-3 text-[12px] font-semibold text-fg">Historial · últimos cinco días</summary><div className="px-2 pb-2"><UltimosDias onActualizarKm={estado.actualizarKmViaje} /></div></details></section>
}

function UltimosDias({ onActualizarKm }: { onActualizarKm: (id: string, km: number) => void }) {
  const estado = useTienda()
  const eliminarViaje = useTienda((s) => s.eliminarViaje)
  const eliminarDiaPruebas = useTienda((s) => s.eliminarDiaPruebas)
  const [abierto, setAbierto] = useState<string | null>(null)
  const dias = useMemo(() => {
    const mapa = new Map<string, { fechaISO: string; neto: number; km: number; viajes: number; msJornada: number; viajesDetalle: typeof estado.viajes }>()
    for (const v of estado.viajes) {
      const clave = claveFechaLocal(v.finISO)
      const acc = mapa.get(clave) ?? { fechaISO: v.finISO, neto: 0, km: 0, viajes: 0, msJornada: 0, viajesDetalle: [] }
      acc.neto += v.pago ?? 0
      acc.km += v.km
      acc.viajes += 1
      acc.viajesDetalle.push(v)
      mapa.set(clave, acc)
    }
    for (const g of estado.gastosMoto) {
      const clave = claveFechaLocal(g.fechaISO)
      const acc = mapa.get(clave)
      if (acc) acc.neto -= g.valor
    }
    for (const j of estado.jornadas) {
      if (!j.finISO) continue
      const clave = claveFechaLocal(j.inicioISO)
      const acc = mapa.get(clave)
      if (acc) acc.msJornada += new Date(j.finISO).getTime() - new Date(j.inicioISO).getTime()
    }
    return [...mapa.values()].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO)).slice(0, 5)
  }, [estado.viajes, estado.gastosMoto, estado.jornadas])

  if (dias.length === 0) return <p className="text-[13px] text-mute">Todavía no hay días registrados.</p>

  return (
    <div className="divide-y divide-[var(--c-line)] rounded-[var(--radius-card)] border border-line bg-surface">
      {dias.map((d) => (
        <div key={d.fechaISO} className="border-b border-line last:border-b-0">
          <button type="button" onClick={() => setAbierto((v) => v === d.fechaISO ? null : d.fechaISO)} className="flex w-full items-center justify-between px-4 py-3 text-left">
          <div>
            <p className="text-[13.5px] font-medium text-fg">{formatearFechaCorta(d.fechaISO)}</p>
            <p className="text-[11px] text-mute">
              {d.viajes} viajes · {formatearKm(d.km)} {d.msJornada > 0 && `· ${formatearDuracion(d.msJornada)}`}
            </p>
          </div>
          <div className="text-right">
            <p className={`tabular text-[15px] font-semibold ${d.neto >= 0 ? 'text-fg' : 'text-loss'}`}>{formatearPesos(d.neto)}</p>
            <p className="tabular text-[10.5px] text-mute">{d.km > 0 ? formatearPesosCompacto(d.neto / d.km) + '/km' : ''}</p>
          </div>
          </button>
          {abierto === d.fechaISO && <div className="space-y-2 border-t border-line px-4 py-3">
            <button type="button" onClick={() => { if (window.confirm('¿Eliminar todos los viajes y la jornada de este día?')) { eliminarDiaPruebas(claveFechaLocal(d.fechaISO)); setAbierto(null) } }} className="w-full rounded-[var(--radius-btn)] border border-loss/40 px-3 py-2 text-[11px] font-semibold text-loss">Eliminar día de pruebas</button>
            {d.viajesDetalle.map((v) => <div key={v.id} className="rounded-[var(--radius-btn)] bg-surface-2 p-2.5 text-[11px]"><div className="flex justify-between"><b className="text-fg">{v.app}</b><b className="text-win">{v.pago == null ? 'Pendiente' : formatearPesos(v.pago)}</b></div><div className="mt-1 flex items-center gap-3 text-mute"><span><EditarKmViaje id={v.id} km={v.km} onGuardar={onActualizarKm} /> km</span><span>{formatearDuracion(new Date(v.finISO).getTime() - new Date(v.inicioISO).getTime())}</span><span>{formatearHora(v.inicioISO)}–{formatearHora(v.finISO)}</span><button type="button" onClick={() => eliminarViaje(v.id)} className="ml-auto text-loss underline">Quitar</button></div></div>)}
          </div>}
        </div>
      ))}
    </div>
  )
}
