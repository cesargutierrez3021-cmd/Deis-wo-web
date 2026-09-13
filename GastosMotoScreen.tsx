import { useMemo, useState } from 'react'
import { Fuel, Wrench, Trash2 } from 'lucide-react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, TituloSeccion } from '../../components/ui/primitives'
import { useTienda } from '../../lib/store'
import { formatearPesos } from '../../lib/format'
import { FormularioGastoMoto } from '../trabajo/TrabajoScreen'

export function GastosMotoScreen() {
  const gastos = useTienda((s) => s.gastosMoto)
  const agregar = useTienda((s) => s.agregarGastoMoto)
  const eliminar = useTienda((s) => s.eliminarGastoMoto)
  const [mostrar, setMostrar] = useState(false)
  const total = useMemo(() => gastos.reduce((n, g) => n + g.valor, 0), [gastos])
  const categorias = ['Gasolina', 'Mantenimiento', 'Aceite', 'Comida', 'Lavado', 'Peaje', 'Multa', 'Otro'] as const
  return <Pantalla><TituloPantalla kicker="Moto" titulo="Gastos totales de la moto" bajada="Gasolina, mantenimiento, aceite y otros gastos en un solo registro." /><Card className="mt-4 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-mute">Total registrado</p><strong className="mt-1 block text-[30px] text-loss">{formatearPesos(total)}</strong><div className="mt-3 flex flex-wrap gap-2">{categorias.map((tipo) => <span key={tipo} className="rounded-full border border-line px-2.5 py-1 text-[10px] text-mute">{tipo}: {formatearPesos(gastos.filter((g) => g.tipo === tipo).reduce((n, g) => n + g.valor, 0))}</span>)}</div></Card><TituloSeccion accion={<button type="button" onClick={() => setMostrar((v) => !v)} className="text-[11px] font-semibold text-acento-alto">{mostrar ? 'Cerrar' : 'Registrar gasto'}</button>}>Nuevo gasto</TituloSeccion>{mostrar && <FormularioGastoMoto onGuardar={(g) => { agregar(g); setMostrar(false) }} />}<TituloSeccion>Historial de gastos</TituloSeccion>{gastos.length === 0 ? <p className="text-[13px] text-mute">Todavía no hay gastos registrados.</p> : <div className="space-y-2">{gastos.map((g) => <Card key={g.id} className="flex items-center justify-between gap-3 p-3"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-loss/10 text-loss">{g.tipo === 'Gasolina' ? <Fuel size={16} /> : <Wrench size={16} />}</span><div><strong className="block text-[12px] text-fg">{g.tipo} · {formatearPesos(g.valor)}</strong><small className="text-[10px] text-mute">{new Date(g.fechaISO).toLocaleDateString('es-CO')}{g.nota ? ` · ${g.nota}` : ''}</small></div></div><button type="button" aria-label="Eliminar gasto" onClick={() => eliminar(g.id)} className="text-loss"><Trash2 size={16} /></button></Card>)}</div>}</Pantalla>
}
