import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, Check, ShieldAlert, X } from 'lucide-react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, Boton, Campo, Entrada, TituloSeccion } from '../../components/ui/primitives'
import { useTienda } from '../../lib/store'
import { calcularResumen, proximosVencimientos } from '../../lib/selectors'
import { formatearPesos } from '../../lib/format'
import { AlarmaPantalla, esNativo } from '../../lib/nativo'
import { reprogramarVencimientos } from './programador'
import { LocalNotifications } from '@capacitor/local-notifications'

export function AvisosScreen() {
  const estado = useTienda()
  const actualizarAjustes = useTienda((s) => s.actualizarAjustes)
  const agregarRecordatorio = useTienda((s) => s.agregarRecordatorio)
  const eliminarRecordatorio = useTienda((s) => s.eliminarRecordatorio)

  const hoy = useMemo(() => calcularResumen(estado, 'hoy'), [estado])
  const pendientes = useMemo(() => proximosVencimientos(estado), [estado])
  const leFalta = Math.max(0, estado.ajustes.metaDiaria - hoy.neto)

  const [permisoAlarmas, setPermisoAlarmas] = useState(true)
  const [permisoPantallaCompleta, setPermisoPantallaCompleta] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [vozId, setVozId] = useState<'voz_1'|'voz_2'|'voz_3'|'voz_4'|'voz_5'|'sin_voz'>('voz_1')

  useEffect(() => {
    void reprogramarVencimientos(pendientes)
    if (esNativo()) {
      AlarmaPantalla.tienePermisoAlarmasExactas().then((r) => setPermisoAlarmas(r.concedido))
      AlarmaPantalla.tienePermisoPantallaCompleta().then((r) => setPermisoPantallaCompleta(r.concedido))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendientes.length])

  function programarRecordatorio() {
    if (!titulo || !fechaHora) return
    const fechaISO = new Date(fechaHora).toISOString()
    agregarRecordatorio({ titulo, detalle: detalle || undefined, fechaHoraISO: fechaISO, vozId })
    if (esNativo()) {
      AlarmaPantalla.programar({ id: `manual-${Date.now()}`, fechaHoraMs: new Date(fechaISO).getTime(), titulo, detalle, vozId, tipo: 'recordatorio' }).catch(() => {})
    }
    setTitulo('')
    setDetalle('')
    setFechaHora('')
  }

  function escucharVoz() {
    if (vozId === 'sin_voz') return
    void new Audio(`/voices/${vozId}.mp3`).play().catch(() => {})
  }

  function probarAvisoTresDias() {
    if (!esNativo()) return
    void LocalNotifications.schedule({ notifications: [{ id: Date.now() % 1000000, title: '🏠💰 Prueba: vence en 3 días', body: 'Esta es la notificación normal de vencimiento.', smallIcon: 'ic_notif_home', schedule: { at: new Date(Date.now() + 5000) } }] }).catch(() => {})
  }

  function probarPantallaUnDia() {
    if (!esNativo()) return
    void AlarmaPantalla.programar({ id: `prueba-1d-${Date.now()}`, fechaHoraMs: Date.now() + 5000, titulo: '🏠💰 Prueba: vence mañana', detalle: 'Esta es la pantalla completa.', tipo: 'recordatorio', vozId }).catch(() => {})
  }

  return (
    <Pantalla>
      <TituloPantalla kicker="Avisos" titulo="Lo que no te puedes perder" />

      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.12em] text-mute uppercase">Hora del aviso</p>
        </div>
        <input
          type="time"
          value={estado.ajustes.horaAvisoDiario}
          onChange={(e) => actualizarAjustes({ horaAvisoDiario: e.target.value })}
          className="tabular mt-1 min-h-11 w-full rounded-[var(--radius-btn)] border border-line bg-surface-2 px-3 text-[15px] text-fg"
        />
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <p className="text-[13px] text-fg">Necesita al día</p>
          <p className="tabular text-[15px] font-semibold text-fg">{formatearPesos(estado.ajustes.metaDiaria)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[13px] text-fg">Lleva hoy</p>
          <p className={`tabular text-[15px] font-semibold ${hoy.neto >= 0 ? 'text-win' : 'text-loss'}`}>{formatearPesos(hoy.neto)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[13px] text-fg">Le falta</p>
          <p className="tabular text-[15px] font-semibold text-loss">{formatearPesos(leFalta)}</p>
        </div>
      </Card>

      <TituloSeccion>Nuevo recordatorio</TituloSeccion>
      <Card className="space-y-3 p-4">
        <Campo etiqueta="Título">
          <Entrada value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué debo recordarte?" />
        </Campo>
        <Campo etiqueta="Detalle (opcional)">
          <Entrada value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </Campo>
        <Campo etiqueta="Fecha y hora">
          <Entrada type="datetime-local" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
        </Campo>
        <Campo etiqueta="Voz del recordatorio"><div className="flex gap-2"><select value={vozId} onChange={(e) => setVozId(e.target.value as typeof vozId)} className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-btn)] border border-line bg-surface-2 px-3 text-[14px] text-fg"><option value="voz_1">Voz 1</option><option value="voz_2">Voz 2</option><option value="voz_3">Voz 3</option><option value="voz_4">Voz 4</option><option value="voz_5">Voz 5</option><option value="sin_voz">Sin voz</option></select><button type="button" onClick={escucharVoz} className="rounded-[var(--radius-btn)] border border-acento-linea px-3 text-[11px] font-semibold text-acento-alto">▶ Probar</button></div></Campo>
        <Boton disabled={!titulo || !fechaHora} onClick={programarRecordatorio}>
          <span className="flex items-center justify-center gap-2">
            <AlarmClock size={15} /> Programar alarma
          </span>
        </Boton>
      </Card>

      {estado.recordatorios.filter((r) => !r.disparado).length > 0 && (
        <>
          <TituloSeccion>Recordatorios activos</TituloSeccion>
          <div className="space-y-2">
            {estado.recordatorios
              .filter((r) => !r.disparado)
              .map((r) => (
                <Card key={r.id} className="flex items-center justify-between p-3.5">
                  <div>
                    <p className="text-[13.5px] font-medium text-fg">{r.titulo}</p>
                    <p className="text-[11px] text-mute">{new Date(r.fechaHoraISO).toLocaleString('es-CO')}</p>
                  </div>
                  <button onClick={() => eliminarRecordatorio(r.id)} aria-label="Eliminar" className="text-mute">
                    <X size={15} />
                  </button>
                </Card>
              ))}
          </div>
        </>
      )}

      {pendientes.length > 0 && (
        <>
          <TituloSeccion>Vencimientos próximos</TituloSeccion>
          <p className="-mt-2 mb-2 text-[11.5px] text-mute">
            Avisan solos: a las 12 del día que vencen, y una notificación 3 y 1 día antes.
          </p>
          <div className="space-y-2">
            {pendientes.map((p) => (
              <Card key={`${p.tipo}-${p.id}`} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-[13.5px] font-medium text-fg">{p.nombre}</p>
                  <p className="text-[11px] text-mute">
                    {p.diasParaVencer === 0 ? 'vence hoy' : p.diasParaVencer < 0 ? 'vencido' : `en ${p.diasParaVencer} días`}
                  </p>
                </div>
                <p className="tabular text-[14px] font-semibold text-fg">{formatearPesos(p.valor)}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <TituloSeccion>Pruebas de notificación</TituloSeccion>
      <Card className="space-y-2 p-4">
        <p className="text-[11.5px] text-mute">Cada prueba se dispara en aproximadamente cinco segundos.</p>
        <div className="grid grid-cols-2 gap-2"><Boton variante="contorno" onClick={probarAvisoTresDias}>Probar 3 días</Boton><Boton variante="contorno" onClick={probarPantallaUnDia}>Probar 1 día</Boton></div>
      </Card>

      <TituloSeccion>Permisos de alarma</TituloSeccion>
      <Card className="space-y-3 p-4">
        <p className="text-[12px] leading-relaxed text-mute">
          Falta darle permiso a lo que aparezca en rojo abajo. Sin esto, Android retrasa las alarmas o no las muestra sobre la pantalla bloqueada.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => esNativo() && AlarmaPantalla.solicitarPermisoAlarmasExactas()}
            className={`flex items-center justify-center gap-1.5 rounded-[var(--radius-btn)] border py-3 text-[12.5px] font-medium ${permisoAlarmas ? 'border-line text-dim' : 'border-loss/45 text-loss'}`}
          >
            Alarmas exactas {permisoAlarmas && <Check size={14} />}
          </button>
          <button
            onClick={async () => {
              if (!esNativo()) return
              await AlarmaPantalla.solicitarPermisoPantallaCompleta()
              setTimeout(() => AlarmaPantalla.tienePermisoPantallaCompleta().then((r) => setPermisoPantallaCompleta(r.concedido)), 500)
            }}
            className={`display flex items-center justify-center gap-1.5 rounded-[var(--radius-btn)] py-3 text-[12.5px] font-semibold uppercase tracking-[0.03em] ${permisoPantallaCompleta ? 'text-[var(--btn-fg)]' : 'border border-loss/45 text-loss'}`}
            style={{ background: 'var(--grad-acento)' }}
          >
            <ShieldAlert size={14} /> Pantalla completa {permisoPantallaCompleta && <Check size={14} />}
          </button>
        </div>
        <Boton
          variante="contorno"
          onClick={() =>
            esNativo() &&
            AlarmaPantalla.programar({ id: 'prueba', fechaHoraMs: Date.now() + 5000, titulo: 'Alarma de prueba', detalle: 'Así se va a ver' })
          }
        >
          Probar la alarma ahora
        </Boton>
      </Card>
    </Pantalla>
  )
}
