import { AtlasThemePicker } from '../atlas/atlasTheme'
import { useAtlasTheme } from '../atlas/atlasTheme.context'
import { useApariencia } from '../../lib/useApariencia'
import { Boton } from '../../components/ui/primitives'

export function EleccionApariencia() {
  const { confirmarEleccion } = useApariencia()
  const { theme } = useAtlasTheme()
  return <div className={`atlas-onboarding atlas-onboarding-${theme}`}><div className="onboarding-editorial"><span className="atlas-kicker">NOAH / ATLAS</span><h1>Elige la forma de tu día.</h1><p>Selecciona un tema para toda la aplicación. La vista cambia mientras eliges para que sepas exactamente cómo se verá.</p><div className="editorial-rule" /></div><VistaPreviaTema tema={theme} /><AtlasThemePicker /><Boton className="onboarding-continue" onClick={confirmarEleccion}>Entrar a {theme[0].toUpperCase() + theme.slice(1)}</Boton></div>
}

function VistaPreviaTema({ tema }: { tema: string }) {
  const datos = {
    editorial: { kicker: 'EDICIÓN DEL DÍA', titulo: 'Tu día, en una sola página.', cifra: '$90.000', detalle: 'Lectura pausada · balance completo', icono: '▤' },
    marea: { kicker: 'NETO DE HOY', titulo: 'Tu día, visto completo.', cifra: '$90.000', detalle: '2,4 km de recorrido · en espera', icono: '≈' },
    pulso: { kicker: 'ESTADO DEL SISTEMA', titulo: 'El pulso de tu dinero.', cifra: '$90.000', detalle: 'VIAJE · 4 servicios activos', icono: '◉' },
    taller: { kicker: 'HOJA DE TURNO', titulo: 'Control de operación.', cifra: '$90.000', detalle: 'MOTOR LISTO · jornada abierta', icono: '▣' },
  }[tema as 'editorial' | 'marea' | 'pulso' | 'taller']
  return <div className={`onboarding-live-preview preview-${tema}`}><div className="preview-top"><span>{datos.kicker}</span><b>{datos.icono}</b></div><strong>{datos.titulo}</strong><em>{datos.cifra}</em><small>{datos.detalle}</small><div className="preview-cards"><i /><i /><i /></div></div>
}
