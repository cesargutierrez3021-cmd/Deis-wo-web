import { useMemo, useState, type CSSProperties } from 'react'
import { Activity, BarChart3, Eye, EyeOff, Target } from 'lucide-react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, Chip, TituloSeccion, EntradaPesos } from '../../components/ui/primitives'
import { useTienda } from '../../lib/store'
import { formatearPesos, formatearPesosCompacto } from '../../lib/format'
import { calcularResumen, type Periodo } from '../../lib/selectors'
import { esEsteMes, esEstaSemana } from '../../lib/format'

const PERIODOS: { v: Periodo; l: string }[] = [
  { v: 'semana', l: 'Semana' },
  { v: 'mes', l: 'Mes' },
  { v: 'todo', l: 'Todo' },
]

type PuntoGrafica = { id: string; etiqueta: string; corto: string; valor: number; color: string; detalle: string }

export function BalanceScreen() {
  const estado = useTienda()
  const actualizarAjustes = useTienda((s) => s.actualizarAjustes)
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [seleccionado, setSeleccionado] = useState(0)
  const [visibles, setVisibles] = useState({ general: true, distribucion: true, flujo: true, meta: true })
  const resumen = useMemo(() => calcularResumen(estado, periodo), [estado, periodo])

  const ahorroMeta = estado.ajustes.ahorroMeta ?? 2_000_000
  const deudaPendiente = estado.deudas.filter((d) => !d.archivada).reduce((total, d) => total + Math.max(0, d.saldoTotal - d.abonado), 0)
  const metaTotal = resumen.gastoHogar + resumen.cuotasDeuda + ahorroMeta
  const acumulado = Math.max(0, resumen.bruto - resumen.gastoMoto)
  const ahorroAcumulado = estado.ahorros.filter((a) => periodo === 'todo' || periodo === 'mes' && esEsteMes(a.fechaISO) || periodo === 'semana' && esEstaSemana(a.fechaISO)).reduce((n, a) => n + a.valor, 0)
  const gastoMotoPorKm = resumen.km > 0 ? resumen.gastoMoto / resumen.km : 0
  const puntos: PuntoGrafica[] = [
    { id: 'ingreso', etiqueta: 'Ingreso total', corto: 'Ingreso', valor: resumen.bruto, color: 'var(--chart-1)', detalle: 'Todo el dinero ingresado por viajes y bonos' },
    { id: 'hogar', etiqueta: 'Gasto general del hogar', corto: 'Hogar', valor: resumen.gastoHogar, color: 'var(--chart-2)', detalle: 'Total de gastos del hogar en este período' },
    { id: 'moto', etiqueta: 'Gastos de moto', corto: 'Moto', valor: resumen.gastoMoto, color: 'var(--chart-3)', detalle: `Gasolina, mantenimiento y demás · ${formatearPesos(gastoMotoPorKm)} por km` },
    { id: 'deudas', etiqueta: 'Deudas pendientes', corto: 'Deudas', valor: deudaPendiente, color: 'var(--chart-4)', detalle: 'Saldo total pendiente de las deudas activas' },
    { id: 'acumulado', etiqueta: 'Ahorro acumulado', corto: 'Ahorro', valor: ahorroAcumulado, color: 'var(--chart-5)', detalle: 'Lo que queda después de hogar, deudas y gastos de moto' },
    { id: 'meta', etiqueta: 'Meta para cubrir todo + ahorrar', corto: 'Meta total', valor: metaTotal, color: 'var(--c-acento-alto)', detalle: `Hogar + deudas + ${formatearPesos(ahorroMeta)} de ahorro` },
  ]

  const filas = [
    { etiqueta: 'Viajes', sub: `${resumen.viajes.length} servicios`, valor: resumen.ingresoViajes, tono: 'win' as const },
    { etiqueta: 'Bonos e incentivos', sub: undefined, valor: resumen.ingresoBonos, tono: 'win' as const },
    { etiqueta: 'Gastos de la moto', sub: 'gasolina, mantenimiento y demás', valor: -resumen.gastoMoto, tono: 'loss' as const },
    { etiqueta: 'Gasto del hogar', sub: undefined, valor: -resumen.gastoHogar, tono: 'loss' as const },
    { etiqueta: 'Cuotas de deuda', sub: 'del período', valor: -resumen.cuotasDeuda, tono: 'loss' as const },
    { etiqueta: 'Aceite', sub: 'gasto de moto del período', valor: -resumen.gastoAceite, tono: 'loss' as const },
    { etiqueta: 'Ahorro registrado', sub: 'dinero apartado', valor: ahorroAcumulado, tono: 'win' as const },
  ].filter((f) => f.valor !== 0)

  return (
    <Pantalla>
      <TituloPantalla kicker="Balance" titulo="A dónde se va el dinero" />

      <div className="mt-4 flex gap-2">
        {PERIODOS.map((p) => (
          <Chip key={p.v} activo={periodo === p.v} onClick={() => setPeriodo(p.v)}>
            {p.l}
          </Chip>
        ))}
      </div>

      <Card className="balance-kpi mt-3 p-4">
        <p className="text-[10px] tracking-[0.12em] text-mute uppercase">Meta de ahorro</p>
        <p className="mt-1 text-[12px] text-mute">Cambia cuánto quieres guardar. La gráfica y la meta total se actualizan automáticamente.</p>
        <div className="mt-3 flex items-center gap-3">
          <EntradaPesos valor={ahorroMeta} onCambio={(valor) => actualizarAjustes({ ahorroMeta: Math.max(0, Math.round(valor)) })} />
          <span className="shrink-0 text-[11px] text-mute">ahorro objetivo</span>
        </div>
      </Card>

      <Card className="balance-kpi balance-libre mt-3 p-4">
        <p className="text-[10px] tracking-[0.12em] text-mute uppercase">Queda libre · {PERIODOS.find((p) => p.v === periodo)?.l.toLowerCase()}</p>
        <p className={`tabular mt-1 text-[28px] font-semibold ${resumen.quedaLibre >= 0 ? 'text-fg' : 'text-loss'}`}>
          {formatearPesos(resumen.quedaLibre)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
          <div>
            <p className="tabular text-[15px] font-semibold text-win">{formatearPesosCompacto(resumen.entro)}</p>
            <p className="text-[10px] text-mute uppercase">entró</p>
          </div>
          <div>
            <p className="tabular text-[15px] font-semibold text-loss">{formatearPesosCompacto(resumen.salio)}</p>
            <p className="text-[10px] text-mute uppercase">salió</p>
          </div>
        </div>
      </Card>

      <div className="balance-graph mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setVisibles((v) => ({ ...v, general: !v.general }))} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
          <span className="flex items-center gap-2">
            <BarChart3 size={17} className="text-acento-alto" />
            <span>
              <span className="block text-[13px] font-semibold text-fg">Vista general</span>
              <span className="block text-[10px] text-mute">Toca una barra para ver el valor</span>
            </span>
          </span>
          {visibles.general ? <Eye size={17} className="text-acento-alto" /> : <EyeOff size={17} className="text-mute" />}
        </button>
        {visibles.general && <GraficaInteractiva puntos={puntos} seleccionado={seleccionado} onSeleccionar={setSeleccionado} />}
      </div>

      <div className="balance-graph mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setVisibles((v) => ({ ...v, distribucion: !v.distribucion }))} className="flex w-full items-center justify-between px-4 py-3.5 text-left"><span className="flex items-center gap-2"><BarChart3 size={17} className="text-acento-alto" /><span><span className="block text-[13px] font-semibold text-fg">Distribución del ingreso</span><span className="block text-[10px] text-mute">Hogar, moto, deudas, ahorro y libre</span></span></span>{visibles.distribucion ? <Eye size={17} className="text-acento-alto" /> : <EyeOff size={17} className="text-mute" />}</button>
        {visibles.distribucion && <DistribucionOrbital ingreso={resumen.bruto} hogar={resumen.gastoHogar} moto={resumen.gastoMoto} deudas={deudaPendiente} ahorro={ahorroAcumulado} />}
      </div>

      <div className="balance-graph mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setVisibles((v) => ({ ...v, flujo: !v.flujo }))} className="flex w-full items-center justify-between px-4 py-3.5 text-left"><span className="flex items-center gap-2"><Activity size={17} className="text-acento-alto" /><span><span className="block text-[13px] font-semibold text-fg">Flujo del dinero</span><span className="block text-[10px] text-mute">Entrada, gastos y acumulado</span></span></span>{visibles.flujo ? <Eye size={17} className="text-acento-alto" /> : <EyeOff size={17} className="text-mute" />}</button>
        {visibles.flujo && <GraficaFlujo ingreso={resumen.bruto} gastos={resumen.gastoMoto + resumen.gastoHogar + resumen.cuotasDeuda} ahorro={ahorroAcumulado} acumulado={Math.max(0, acumulado - ahorroAcumulado)} />}
      </div>

      <div className="balance-graph mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <button type="button" onClick={() => setVisibles((v) => ({ ...v, meta: !v.meta }))} className="flex w-full items-center justify-between px-4 py-3.5 text-left"><span className="flex items-center gap-2"><Target size={17} className="text-acento-alto" /><span><span className="block text-[13px] font-semibold text-fg">Ahorro frente a la meta</span><span className="block text-[10px] text-mute">avance, faltante y objetivo en pesos</span></span></span>{visibles.meta ? <Eye size={17} className="text-acento-alto" /> : <EyeOff size={17} className="text-mute" />}</button>
        {visibles.meta && <GraficaMeta ahorro={ahorroAcumulado} meta={ahorroMeta} />}
      </div>

      <TituloSeccion>Detalle</TituloSeccion>
      {filas.length === 0 ? (
        <p className="text-[13px] text-mute">No hay movimientos en este período.</p>
      ) : (
        <div className="divide-y divide-[var(--c-line)] rounded-[var(--radius-card)] border border-line bg-surface">
          {filas.map((f) => (
            <div key={f.etiqueta} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-[13.5px] text-fg">{f.etiqueta}</p>
                {f.sub && <p className="text-[11px] text-mute">{f.sub}</p>}
              </div>
              <p className={`tabular text-[15px] font-semibold ${f.tono === 'win' ? 'text-win' : 'text-loss'}`}>
                {f.valor >= 0 ? '+' : ''}{formatearPesos(f.valor)}
              </p>
            </div>
          ))}
        </div>
      )}

      <TituloSeccion>Rendimiento del período</TituloSeccion>
      <Card className="divide-y divide-[var(--c-line)] p-0">
        <Fila etiqueta="Acumulado actual" sub="viajes y bonos menos moto" valor={formatearPesos(acumulado)} />
        <Fila etiqueta="Meta total" sub={`cubrir hogar, deudas y ahorrar ${formatearPesos(ahorroMeta)}`} valor={formatearPesos(metaTotal)} />
        <Fila etiqueta="Falta para la meta" sub={acumulado >= metaTotal ? 'meta alcanzada' : 'pendiente'} valor={formatearPesos(Math.max(0, metaTotal - acumulado))} />
      </Card>
    </Pantalla>
  )
}

function GraficaInteractiva({ puntos, seleccionado, onSeleccionar }: { puntos: PuntoGrafica[]; seleccionado: number; onSeleccionar: (i: number) => void }) {
  const maximo = Math.max(1, ...puntos.map((p) => p.valor))
  const activo = puntos[seleccionado]
  const ancho = 410
  const alto = 150
  const base = 116
  const barraAncho = 42
  const separacion = 22

  return (
    <div className="border-t border-line px-3 pb-4 pt-3">
      <div className="rounded-[var(--radius-btn)] bg-surface-2 px-3 py-2">
        <p className="text-[10px] text-mute">{activo.etiqueta}</p>
        <p className="tabular text-[22px] font-semibold text-fg">{formatearPesos(activo.valor)}</p>
        <p className="text-[10px] text-mute">{activo.detalle}</p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Gráfica general de balance" className="min-w-[320px] overflow-visible">
          <line x1="8" y1={base} x2="402" y2={base} stroke="currentColor" className="text-line" strokeWidth="1" />
          {puntos.map((p, i) => {
            const x = 10 + i * (barraAncho + separacion)
            const altura = p.valor > 0 ? Math.max(5, (p.valor / maximo) * 88) : 4
            const y = base - altura
            return (
              <g key={p.id} onClick={() => onSeleccionar(i)} onMouseEnter={() => onSeleccionar(i)} className="cursor-pointer">
                <rect x={x - 5} y="18" width={barraAncho + 10} height="102" fill="transparent" />
                <rect x={x} y={y} width={barraAncho} height={altura} rx="5" fill={p.color} opacity={seleccionado === i ? 1 : 0.62} className="animate-pulse" style={{ transformOrigin: `${x + barraAncho / 2}px ${base}px`, animationDelay: `${i * 180}ms` }} />
                <text x={x + barraAncho / 2} y="137" textAnchor="middle" fill="currentColor" className="fill-mute text-[9px]">{p.corto}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-1 flex justify-center gap-1.5">
        {puntos.map((p, i) => <button key={p.id} type="button" aria-label={`Ver ${p.etiqueta}`} onClick={() => onSeleccionar(i)} className={`size-1.5 rounded-full transition-transform ${seleccionado === i ? 'scale-150' : 'opacity-50'}`} style={{ backgroundColor: p.color }} />)}
      </div>
    </div>
  )
}

function DistribucionOrbital({ ingreso, hogar, moto, deudas, ahorro }: { ingreso: number; hogar: number; moto: number; deudas: number; ahorro: number }) {
  const total = Math.max(1, ingreso)
  const libre = Math.max(0, ingreso - hogar - moto - deudas - ahorro)
  const partes = [
    { nombre: 'Ingreso', valor: ingreso, color: 'var(--c-acento-alto)', fijo: true },
    { nombre: 'Hogar', valor: hogar, color: 'var(--chart-2)', fijo: false },
    { nombre: 'Deudas', valor: deudas, color: 'var(--chart-4)', fijo: false },
    { nombre: 'Moto', valor: moto, color: 'var(--chart-3)', fijo: false },
    { nombre: 'Ahorro', valor: Math.min(ahorro, ingreso), color: 'var(--chart-5)', fijo: true },
    { nombre: 'Libre', valor: libre, color: 'var(--chart-1)', fijo: false },
  ]
  return (
    <div className="balance-orbit-panel mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="border-b border-line px-4 py-3.5">
        <p className="text-[13px] font-semibold text-fg">Distribución del dinero ingresado</p>
        <p className="text-[10px] text-mute">Total distribuido: {formatearPesos(ingreso)} · cada órbita conserva su proporción</p>
      </div>
      <div className="balance-orbit-field">
        <div className="balance-orbit-primary">{partes.filter((p) => p.fijo && p.valor > 0).map((p, i) => <OrbitBubble key={p.nombre} p={p} total={total} index={i} primary />)}</div>
        <div className="balance-orbit-secondary">{partes.filter((p) => !p.fijo && p.valor > 0).map((p, i) => <OrbitBubble key={p.nombre} p={p} total={total} index={i} />)}</div>
      </div>
    </div>
  )
}

function OrbitBubble({ p, total, index, primary = false }: { p: { nombre: string; valor: number; color: string; fijo: boolean }; total: number; index: number; primary?: boolean }) {
  const size = primary ? 128 : Math.max(94, Math.min(142, 94 + p.valor / total * 100))
  return <div className="balance-orbit" style={{ '--orbit-color': p.color, '--orbit-size': `${size}px`, '--orbit-delay': `${index * -1.2}s` } as CSSProperties}><span>{p.nombre}</span><b>{formatearPesos(p.valor)}</b><small>{Math.round(p.valor / total * 100)} %</small><i /><em /></div>
}

function GraficaFlujo({ ingreso, gastos, ahorro, acumulado }: { ingreso: number; gastos: number; ahorro: number; acumulado: number }) {
  const max = Math.max(1, ingreso, gastos, ahorro, acumulado)
  const y = (valor: number) => 108 - valor / max * 78
  const puntos = `10,108 68,${y(ingreso)} 126,${y(gastos)} 184,${y(ahorro)} 242,${y(acumulado)}`
  return <div className="border-t border-line px-3 pb-4 pt-3"><div className="rounded-[var(--radius-btn)] bg-surface-2 px-3 py-2 text-[10px] text-mute">Entrada, gastos, ahorro y saldo libre se comparan en pesos.</div><svg viewBox="0 0 264 140" className="mt-3 w-full overflow-visible"><line x1="8" y1="108" x2="256" y2="108" stroke="currentColor" className="text-line" /><polyline points={puntos} fill="none" stroke="var(--c-acento)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="340" strokeDashoffset="340" className="animate-[dibujar_2.4s_ease-out_forwards]" />{[[68, ingreso, 'var(--c-win)'], [126, gastos, 'var(--c-loss)'], [184, ahorro, 'var(--chart-5)'], [242, acumulado, 'var(--c-acento)']].map(([x, value, fill], i) => <circle key={String(x)} cx={Number(x)} cy={y(Number(value))} r="6" fill={String(fill)} className="animate-[latir_1.5s_ease-in-out_infinite]" style={{ animationDelay: `${i * 220}ms` }} />)}<text x="48" y="128" className="fill-mute text-[8px]">Entró</text><text x="106" y="128" className="fill-mute text-[8px]">Salió</text><text x="164" y="128" className="fill-mute text-[8px]">Ahorro</text><text x="218" y="128" className="fill-mute text-[8px]">Libre</text></svg><div className="mt-1 grid grid-cols-4 gap-1 text-center text-[9px] text-mute"><span>{formatearPesos(ingreso)}</span><span>{formatearPesos(gastos)}</span><span>{formatearPesos(ahorro)}</span><span>{formatearPesos(acumulado)}</span></div></div>
}

function GraficaMeta({ ahorro, meta }: { ahorro: number; meta: number }) {
  const avance = meta > 0 ? Math.min(1, ahorro / meta) : 0
  const dash = 282 - avance * 282
  return <div className="savings-visual" style={{ '--savings-dash': dash } as CSSProperties}><svg viewBox="0 0 320 220" role="img" aria-label="Progreso orbital del ahorro frente a la meta"><circle className="savings-target" cx="160" cy="105" r="82" /><circle className="savings-progress" cx="160" cy="105" r="45" transform="rotate(-90 160 105)" style={{ strokeDashoffset: dash }} /><ellipse className="savings-orbit" cx="160" cy="105" rx="118" ry="44" /><ellipse className="savings-orbit two" cx="160" cy="105" rx="92" ry="68" transform="rotate(48 160 105)" /><ellipse className="savings-orbit three" cx="160" cy="105" rx="66" ry="99" transform="rotate(-55 160 105)" /><circle className="savings-node" cx="278" cy="105" r="5" /><circle className="savings-node alt" cx="202" cy="42" r="4" /><circle className="savings-node" cx="110" cy="156" r="4" /><g className="savings-core-group"><circle className="savings-core" cx="160" cy="105" r="32" /><text x="160" y="101" textAnchor="middle" fill="currentColor" className="fill-fg text-[20px] font-semibold">{Math.round(avance * 100)}%</text><text x="160" y="116" textAnchor="middle" fill="currentColor" className="fill-mute text-[8px]">META</text></g></svg><div className="savings-caption"><strong>{formatearPesos(ahorro)} de {formatearPesos(meta)}</strong>Faltan {formatearPesos(Math.max(0, meta - ahorro))}</div></div>
}

function Fila({ etiqueta, sub, valor }: { etiqueta: string; sub: string; valor: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div><p className="text-[13.5px] text-fg">{etiqueta}</p><p className="text-[11px] text-mute">{sub}</p></div>
      <p className="tabular text-[15px] font-semibold text-fg">{valor}</p>
    </div>
  )
}
