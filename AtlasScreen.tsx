import { useEffect, useMemo, useState } from 'react'
import { Activity, AlarmClock, ArrowDownLeft, BookOpen, CircleDollarSign, CloudSun, Droplets, Home, Landmark, ListChecks, MapPin, Moon, Pause, Play, Route, ShieldAlert, Timer, Waves, Wrench as WrenchIcon, Wallet as WalletIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Pantalla } from '../../components/shell/Pantalla'
import { useTienda } from '../../lib/store'
import { useViaje } from '../trabajo/useViaje'
import { calcularResumen, duracionViajeMs, type Periodo } from '../../lib/selectors'
import { formatearDuracion, formatearKm, formatearMiles, formatearPesos, formatearPesosCompacto } from '../../lib/format'
import { useAtlasTheme } from './atlasTheme.context'
import { OperacionesCompactas } from '../trabajo/TrabajoScreen'
import { Burbuja, esNativo } from '../../lib/nativo'

function today(iso: string) { return new Date(iso).toDateString() === new Date().toDateString() }

export function AtlasScreen() {
  const estado = useTienda()
  const viaje = useViaje()
  const { theme, color } = useAtlasTheme()
  const [vistaLectura, setVistaLectura] = useState<'orb' | 'cut' | 'summary'>('orb')
  const [jornadaPausada, setJornadaPausada] = useState(false)
  const [pausaInicio, setPausaInicio] = useState<number | null>(null)
  const [tiempoPausado, setTiempoPausado] = useState(0)
  const [now, setNow] = useState(Date.now)
  const jornada = estado.jornadaAbierta()
  const resumen = useMemo(() => calcularResumen(estado, 'hoy'), [estado])
  const viajes = estado.viajes.filter((v) => today(v.inicioISO))
  const totalJourney = jornada ? Math.max(0, now - new Date(jornada.inicioISO).getTime() - tiempoPausado - (pausaInicio ? now - pausaInicio : 0)) : 0
  const realTime = viajes.reduce((sum, v) => sum + duracionViajeMs(v, now), 0) + (viaje.activo ? viaje.msTranscurridos : 0)
  const deadTime = Math.max(0, totalJourney - realTime)
  const paidTime = viajes.filter((v) => (v.pago ?? 0) > 0).reduce((sum, v) => sum + duracionViajeMs(v, now), 0) + (viaje.activo && resumen.ingresoViajes > 0 ? viaje.msTranscurridos : 0)
  const paidIncome = viajes.reduce((sum, v) => sum + (v.pago ?? 0), 0)
  const hourly = paidTime > 0 ? paidIncome / (paidTime / 3600000) : 0
  const deadValue = deadTime / 3600000 * hourly
  const gasoline = resumen.gastosMoto.filter((g) => g.tipo === 'Gasolina').reduce((sum, g) => sum + g.valor, 0)
  const maintenance = resumen.gastosMoto.filter((g) => g.tipo === 'Mantenimiento').reduce((sum, g) => sum + g.valor, 0)
  const oil = resumen.gastosMoto.filter((g) => g.tipo === 'Aceite').reduce((sum, g) => sum + g.valor, 0)
  const food = resumen.gastosMoto.filter((g) => g.tipo === 'Comida').reduce((sum, g) => sum + g.valor, 0)
  const house = estado.gastosHogar.filter((g) => !g.pagado).reduce((sum, g) => sum + g.valor, 0)
  const debt = estado.deudas.filter((d) => !d.archivada).reduce((sum, d) => sum + Math.max(0, d.saldoTotal - d.abonado), 0)
  const nextSignal = estado.recordatorios.find((r) => !r.disparado)
  const nextRoutine = estado.rutina[0]

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id) }, [])

  const iniciarPausar = async () => {
    if (!jornada) {
      estado.iniciarJornada(); setJornadaPausada(false); setPausaInicio(null); setTiempoPausado(0)
      if (esNativo()) {
        const permiso = await Burbuja.tienePermiso().catch(() => ({ concedido: false }))
        if (!permiso.concedido) { await Burbuja.solicitarPermiso().catch(() => {}); return }
        const estilos = getComputedStyle(document.documentElement)
        await Burbuja.mostrar({ km: '0', tiempo: '0m', enViaje: false, estilo: theme, colorAcento: estilos.getPropertyValue('--c-acento').trim(), colorFg: estilos.getPropertyValue('--c-fg').trim(), colorSurface: estilos.getPropertyValue('--c-surface').trim(), tarjetaActiva: estado.ajustes.tarjetaBurbujaActiva !== false }).catch(() => {})
      }
    } else if (jornadaPausada) { setTiempoPausado((t) => t + (pausaInicio ? now - pausaInicio : 0)); setPausaInicio(null); setJornadaPausada(false) } else { setPausaInicio(now); setJornadaPausada(true) }
  }
  const terminar = () => { estado.terminarJornada(); setJornadaPausada(false); setPausaInicio(null); setTiempoPausado(0) }
  const metrics = [
    { icon: Timer, emoji: '⏱️', label: 'Tiempo de jornada', value: formatearDuracion(totalJourney), tone: 'lime' },
    { icon: Route, emoji: '🏍️', label: 'Tiempo real trabajado', value: formatearDuracion(realTime), tone: 'cyan' },
    { icon: Moon, emoji: '🌙', label: 'Tiempo muerto', value: formatearDuracion(deadTime), tone: 'orange' },
    { icon: CircleDollarSign, emoji: '💰', label: 'Dinero / hora real', value: hourly ? formatearMiles(hourly) : '—', tone: 'violet' },
    { icon: Droplets, emoji: '⛽', label: 'Gasolina / km', value: resumen.km ? formatearPesosCompacto(gasoline / resumen.km) : '—', tone: 'blue' },
    { icon: ArrowDownLeft, emoji: '🛠️', label: 'Dinero que se va en espera', value: deadValue ? formatearPesosCompacto(deadValue) : '—', tone: 'red' },
    { icon: Route, emoji: '📍', label: 'Kilómetros del día', value: formatearKm(resumen.km), tone: 'cyan' },
    { icon: WrenchIcon, emoji: '🔧', label: 'Mantenimiento del día', value: maintenance ? formatearPesos(maintenance) : '—', tone: 'orange' },
    { icon: Droplets, emoji: '🛢️', label: 'Aceite del día', value: oil ? formatearPesos(oil) : '—', tone: 'violet' },
    { icon: WalletIcon, emoji: '🍽️', label: 'Comida del día', value: food ? formatearPesos(food) : '—', tone: 'red' },
  ]

  return <Pantalla><div className={`atlas atlas-${theme} atlas-color-${color}`}><header className="atlas-header"><div><span className="atlas-kicker">NOAH / CUADERNO PERSONAL</span><h1>{theme === 'editorial' ? 'Tu día, en una sola página.' : theme === 'marea' ? 'Tu día, visto completo.' : theme === 'taller' ? 'Control de operación.' : 'El pulso de tu dinero.'}</h1><p>{jornada ? 'Jornada abierta · cada minuto tiene contexto.' : 'Abre la jornada para empezar a medir.'}</p></div><div className="atlas-date"><CloudSun size={18} /><span>{new Date(now).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div></header>{theme === 'editorial' && <section className="editorial-hero"><div className="editorial-hero-copy"><span>LA EDICIÓN DE HOY · {new Date(now).toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}</span><strong>{formatearPesosCompacto(resumen.neto)}</strong><small>neto registrado en la jornada</small></div><div className="editorial-hero-mark"><BookOpen size={28} /><span>{viaje.activo ? 'EN RUTA' : jornada ? 'EN TURNO' : 'EN PAUSA'}</span></div></section>}{theme === 'marea' && <section className="marea-hero"><div className="marea-water"><span>NETO DE HOY</span><strong>{formatearPesosCompacto(resumen.neto)}</strong><small>{formatearKm(resumen.km)} de recorrido</small></div><div className="marea-wave"><Waves size={40} /><span>{viaje.activo ? 'EN RECORRIDO' : jornada ? 'EN ESPERA' : 'PAUSADO'}</span></div></section>}{theme === 'taller' && <section className="taller-hero"><div><span>HOJA DE TURNO</span><strong>{formatearPesosCompacto(resumen.neto)}</strong></div><div className="taller-stamp"><ShieldAlert size={19} /><span>{viaje.activo ? 'MOTOR ACTIVO' : 'MOTOR LISTO'}</span></div></section>}{theme === 'pulso' && <section className="pulso-hero"><div className="pulse-ring"><Activity size={32} /><strong>{formatearPesosCompacto(resumen.neto)}</strong><small>NETO / HOY</small></div><div><span>ESTADO DEL SISTEMA</span><strong>{viaje.activo ? 'VIAJE' : jornada ? 'JORNADA' : 'PAUSA'}</strong><small>{formatearKm(resumen.km)} · {viajes.length} viajes</small></div></section>}<section className="atlas-command"><button className="atlas-start" onClick={iniciarPausar}><span>{!jornada ? <Play size={21} fill="currentColor" /> : jornadaPausada ? <Play size={21} fill="currentColor" /> : <Pause size={21} />}</span>{!jornada ? 'Iniciar jornada' : jornadaPausada ? 'Reanudar jornada' : 'Pausar jornada'}</button>{jornada && <button className="atlas-shift" onClick={terminar}>Terminar jornada</button>}</section><section className="atlas-metrics"><div className="atlas-section-title"><span>LECTURA DEL DÍA</span><div className="pulse-shape-picker"><button type="button" className={vistaLectura === 'orb' ? 'selected' : ''} onClick={() => setVistaLectura('orb')}>◉ Redondas</button><button type="button" className={vistaLectura === 'cut' ? 'selected' : ''} onClick={() => setVistaLectura('cut')}>◈ Recortadas</button><button type="button" className={vistaLectura === 'summary' ? 'selected' : ''} onClick={() => setVistaLectura('summary')}>▦ Resumen</button></div></div>{vistaLectura === 'summary' ? <ResumenPeriodos estado={estado} /> : <div className={`metric-grid pulse-metrics-${vistaLectura}`}>{metrics.map(({ icon: Icon, emoji, label, value, tone }) => <div key={label} className={`atlas-metric tone-${tone}`}><span className="metric-emoji" aria-hidden="true">{emoji}</span><Icon size={17} /><span>{label}</span><strong>{value}</strong></div>)}</div>}</section><OperacionesCompactas /><section className="atlas-life"><div className="atlas-section-title"><span>VIDA ALREDEDOR DEL TURNO</span><small>lo que también importa</small></div><div className="life-grid"><Link to="/finanzas" className="life-card debt"><Landmark size={20} /><span>Deudas</span><strong>{formatearPesosCompacto(debt)}</strong><small>saldo pendiente</small></Link><Link to="/finanzas" className="life-card home"><Home size={20} /><span>Hogar</span><strong>{formatearPesosCompacto(house)}</strong><small>gastos sin pagar</small></Link><Link to="/avisos" className="life-card signal"><AlarmClock size={20} /><span>Señal</span><strong>{nextSignal ? 'Pendiente' : 'Limpio'}</strong><small>{nextSignal?.titulo || 'sin alertas próximas'}</small></Link><Link to="/rutina" className="life-card routine"><ListChecks size={20} /><span>Rutina</span><strong>{nextRoutine ? 'Programada' : 'Vacía'}</strong><small>{nextRoutine?.titulo || 'crea tu ritual'}</small></Link></div></section><div className="atlas-footer"><MapPin size={13} /> {estado.ajustes.appPreferida} · {viaje.errorGps || 'GPS preparado'}</div></div></Pantalla>
}

function ResumenPeriodos({ estado }: { estado: Parameters<typeof calcularResumen>[0] }) {
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const resumen = useMemo(() => calcularResumen(estado, periodo), [estado, periodo])
  const fila = (nombre: string, total: number, porKm: number) => <div className="summary-period-row"><span>{nombre}</span><strong>{formatearPesos(total)}</strong><small>{resumen.km > 0 ? `${formatearPesos(porKm)} / km` : 'sin kilómetros en este período'}</small></div>
  return <div className="atlas-period-summary"><div className="summary-tabs">{([['hoy', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes']] as const).map(([id, label]) => <button type="button" key={id} className={periodo === id ? 'selected' : ''} onClick={() => setPeriodo(id)}>{label}</button>)}</div><div className="summary-period-head"><span>NETO DEL PERÍODO</span><strong>{formatearPesos(resumen.neto)}</strong><small>{resumen.viajes.length} viajes · {formatearKm(resumen.km)} recorridos</small></div><div className="summary-period-list">{fila('Gasolina', resumen.gastoGasolina, resumen.gasolinaPorKm)}{fila('Mantenimiento', resumen.gastoMantenimiento, resumen.mantenimientoPorKm)}{fila('Aceite', resumen.gastoAceite, resumen.km > 0 ? resumen.gastoAceite / resumen.km : 0)}{fila('Gastos totales de moto', resumen.gastoMoto, resumen.gastoMotoPorKm)}</div></div>
}
