import { useEffect, useState } from 'react'
import { Pantalla, TituloPantalla } from '../../components/shell/Pantalla'
import { Card, Boton, Chip, Campo, EntradaPesos, TituloSeccion } from '../../components/ui/primitives'
import { useApariencia } from '../../lib/useApariencia'
import { useTienda } from '../../lib/store'
import { APPS } from '../../lib/types'
import { Burbuja, esNativo } from '../../lib/nativo'
import { AtlasThemePicker } from '../atlas/atlasTheme'
import { useAtlasTheme } from '../atlas/atlasTheme.context'

const AJUSTES_SEGUROS = { metaDiaria: 90000, capitalTipsters: 100000, tarjetaBurbujaActiva: true, appPreferida: APPS[0], vozAsistente: 'confirmar' as const }

export function AjustesScreen() {
  const { tema, modo } = useApariencia()
  const { theme } = useAtlasTheme()
  const ajustesGuardados = useTienda((s) => s.ajustes)
  const ajustes = { ...AJUSTES_SEGUROS, ...(ajustesGuardados ?? {}) }
  const actualizar = useTienda((s) => s.actualizarAjustes)
  const [metaDiaria, setMetaDiaria] = useState(ajustes.metaDiaria)
  const [permisoBurbuja, setPermisoBurbuja] = useState<'desconocido' | 'si' | 'no'>('desconocido')

  useEffect(() => {
    if (!esNativo()) return
    const estilos = getComputedStyle(document.documentElement)
    try {
      void Burbuja.actualizarApariencia({
        colorAcento: estilos.getPropertyValue('--c-acento').trim(),
        colorFg: estilos.getPropertyValue('--c-fg').trim(),
        colorSurface: estilos.getPropertyValue('--c-surface').trim(),
      }).catch(() => {})
    } catch { /* el plugin puede no estar disponible durante el arranque */ }
  }, [tema, modo, theme])

  async function pedirPermisoBurbuja() {
    if (!esNativo()) return
    const r = await Burbuja.solicitarPermiso()
    setPermisoBurbuja(r.concedido ? 'si' : 'no')
  }

  async function activarBurbuja() {
    if (!esNativo()) return
    const permiso = await Burbuja.tienePermiso().catch(() => ({ concedido: false }))
    if (!permiso.concedido) { await pedirPermisoBurbuja(); return }
    const estilos = getComputedStyle(document.documentElement)
    try {
      await Burbuja.mostrar({
        km: '0.0', tiempo: '0m', enViaje: false,
        tarjetaActiva: ajustes.tarjetaBurbujaActiva !== false,
        colorAcento: estilos.getPropertyValue('--c-acento').trim(),
        colorFg: estilos.getPropertyValue('--c-fg').trim(),
        colorSurface: estilos.getPropertyValue('--c-surface').trim(),
        estilo: theme,
      })
      setPermisoBurbuja('si')
    } catch {
      setPermisoBurbuja('no')
    }
  }

  return (
    <Pantalla>
      <TituloPantalla kicker="Ajustes" titulo="Tu app, a tu manera" />

      <TituloSeccion>Apariencia global</TituloSeccion>
      <p className="-mt-2 mb-2 text-[11.5px] text-mute">El tema y su paleta cambian toda la aplicación. No se cambian desde los módulos.</p>
      <AtlasThemePicker />

      <TituloSeccion>Capital para Tipsters</TituloSeccion>
      <Card className="p-4">
        <Campo etiqueta="Capital base en pesos">
          <EntradaPesos valor={ajustes.capitalTipsters ?? 100000} onCambio={(valor) => actualizar({ capitalTipsters: valor })} />
        </Campo>
        <p className="mt-2 text-[11px] text-mute">Cada unidad equivale a 1 % de este capital.</p>
      </Card>

      <TituloSeccion>Meta diaria neta</TituloSeccion>
      <Card className="p-4">
        <Campo etiqueta="Cuánto quieres llevarte limpio cada día">
          <EntradaPesos valor={metaDiaria} onCambio={setMetaDiaria} />
        </Campo>
        <Boton className="mt-3" onClick={() => actualizar({ metaDiaria })}>
          Guardar meta
        </Boton>
      </Card>

      <TituloSeccion>App preferida</TituloSeccion>
      <p className="-mt-2 mb-2 text-[11.5px] text-mute">La que se selecciona sola al registrar un viaje. Se puede cambiar viaje a viaje.</p>
      <div className="flex flex-wrap gap-2">
        {APPS.map((a) => (
          <Chip key={a} activo={ajustes.appPreferida === a} onClick={() => actualizar({ appPreferida: a })}>
            {a}
          </Chip>
        ))}
      </div>

      <TituloSeccion>Voz del asistente</TituloSeccion>
      <div className="flex gap-2">
        <Chip activo={ajustes.vozAsistente === 'confirmar'} onClick={() => actualizar({ vozAsistente: 'confirmar' })}>
          Confirmar en voz alta
        </Chip>
        <Chip activo={ajustes.vozAsistente === 'silencio'} onClick={() => actualizar({ vozAsistente: 'silencio' })}>
          En silencio
        </Chip>
      </div>

      <TituloSeccion>Burbuja flotante</TituloSeccion>
      <Card className="space-y-3 p-4">
        <p className="text-[12px] leading-relaxed text-mute">
          El globito aparece solo cuando abres la jornada. Un toque abre o cierra el viaje. Mantenerlo presionado abre esta app.
          Arrastrarlo lo deja donde lo sueltes.
        </p>
        <Boton onClick={pedirPermisoBurbuja}>
          {permisoBurbuja === 'si' ? 'Permiso concedido' : 'Activar globito'}
        </Boton>
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-line bg-surface-2 p-3">
          <div>
            <p className="text-[12.5px] font-semibold text-fg">Tarjeta de resumen</p>
            <p className="text-[11px] text-mute">Desliza la burbuja para ver hoy, semana y mes.</p>
          </div>
          <button type="button" onClick={() => actualizar({ tarjetaBurbujaActiva: ajustes.tarjetaBurbujaActiva === false })} className="rounded-[var(--radius-pill)] border border-line px-3 py-2 text-[11px] font-semibold text-fg">
            {ajustes.tarjetaBurbujaActiva === false ? 'Desactivada' : 'Activada'}
          </button>
        </div>
        <Boton variante="contorno" onClick={activarBurbuja}>Mostrar burbuja ahora</Boton>
        <p className="text-center text-[11px] text-mute">
          {esNativo() ? 'Se pide el permiso "Mostrar sobre otras apps" del sistema.' : 'Disponible solo en la app instalada, no en el navegador.'}
        </p>
      </Card>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-mute">
        Todo se guarda solo en este teléfono. Exporta de vez en cuando si vas a formatear o cambiar de equipo.
      </p>
    </Pantalla>
  )
}
