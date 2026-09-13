import { useState } from 'react'
import { Home, FileStack, PiggyBank, Trash2 } from 'lucide-react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, Boton, Campo, Entrada, EntradaPesos, TituloSeccion } from '../../components/ui/primitives'
import { HogarScreen } from '../hogar/HogarScreen'
import { DeudasScreen } from '../deudas/DeudasScreen'
import { useTienda } from '../../lib/store'
import { formatearPesos } from '../../lib/format'

type Pestaña = 'hogar' | 'deudas' | 'ahorro'

function AhorroScreen() {
  const ahorros = useTienda((s) => s.ahorros)
  const agregar = useTienda((s) => s.agregarAhorro)
  const eliminar = useTienda((s) => s.eliminarAhorro)
  const meta = useTienda((s) => s.ajustes.ahorroMeta ?? 0)
  const actualizar = useTienda((s) => s.actualizarAjustes)
  const [valor, setValor] = useState(0)
  const [lugar, setLugar] = useState('')
  const [nota, setNota] = useState('')
  const total = ahorros.reduce((n, a) => n + a.valor, 0)
  return <div className="space-y-4"><Card className="p-4"><p className="text-[10px] uppercase tracking-[.12em] text-mute">Ahorro acumulado</p><strong className="mt-1 block text-[28px] text-win">{formatearPesos(total)}</strong><p className="mt-1 text-[11px] text-mute">Meta: {formatearPesos(meta)} · faltan {formatearPesos(Math.max(0, meta - total))}</p><div className="mt-3"><EntradaPesos valor={meta} onCambio={(v) => actualizar({ ahorroMeta: Math.max(0, v) })} /></div></Card><Card className="space-y-3 p-4"><TituloSeccion>Registrar ahorro</TituloSeccion><Campo etiqueta="Valor en pesos"><EntradaPesos valor={valor} onCambio={setValor} /></Campo><Campo etiqueta="Dónde lo estás ahorrando"><Entrada value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Cuenta, efectivo, fondo…" /></Campo><Campo etiqueta="Nota"><Entrada value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Objetivo o detalle opcional" /></Campo><Boton disabled={valor <= 0 || !lugar.trim()} onClick={() => { agregar({ valor, lugar: lugar.trim(), nota: nota.trim() || undefined, fechaISO: new Date().toISOString() }); setValor(0); setLugar(''); setNota('') }}>Guardar ahorro</Boton></Card><TituloSeccion>Movimientos de ahorro</TituloSeccion>{ahorros.length === 0 ? <p className="text-[13px] text-mute">Aún no hay ahorros registrados.</p> : <div className="space-y-2">{ahorros.map((a) => <Card key={a.id} className="flex items-center justify-between gap-3 p-3"><div><strong className="block text-[13px] text-fg">{formatearPesos(a.valor)} · {a.lugar}</strong><small className="text-[10px] text-mute">{new Date(a.fechaISO).toLocaleDateString('es-CO')}{a.nota ? ` · ${a.nota}` : ''}</small></div><button type="button" onClick={() => eliminar(a.id)} className="text-loss" aria-label="Eliminar ahorro"><Trash2 size={16} /></button></Card>)}</div>}</div>
}

export function FinanzasScreen() {
  const [pestaña, setPestaña] = useState<Pestaña>('hogar')
  return <Pantalla><TituloPantalla kicker="Casa y obligaciones" titulo="Hogar, deudas y ahorro" bajada="Tres espacios para organizar lo que sale, lo que debes y lo que estás construyendo." /><div className="mt-4 grid grid-cols-3 gap-1 rounded-[var(--radius-card)] border border-line bg-surface p-1.5"><button type="button" onClick={() => setPestaña('hogar')} className={`flex items-center justify-center gap-1 rounded-[var(--radius-btn)] px-2 py-2.5 text-[11px] font-semibold ${pestaña === 'hogar' ? 'text-acento-alto' : 'text-mute'}`}><Home size={14} /> Hogar</button><button type="button" onClick={() => setPestaña('deudas')} className={`flex items-center justify-center gap-1 rounded-[var(--radius-btn)] px-2 py-2.5 text-[11px] font-semibold ${pestaña === 'deudas' ? 'text-acento-alto' : 'text-mute'}`}><FileStack size={14} /> Deudas</button><button type="button" onClick={() => setPestaña('ahorro')} className={`flex items-center justify-center gap-1 rounded-[var(--radius-btn)] px-2 py-2.5 text-[11px] font-semibold ${pestaña === 'ahorro' ? 'text-acento-alto' : 'text-mute'}`}><PiggyBank size={14} /> Ahorro</button></div><div className="mt-2">{pestaña === 'hogar' ? <HogarScreen /> : pestaña === 'deudas' ? <DeudasScreen /> : <AhorroScreen />}</div></Pantalla>
}
