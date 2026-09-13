import { HashRouter, Route, Routes, Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { ProveedorApariencia } from './lib/theme'
import { useApariencia } from './lib/useApariencia'
import { EleccionApariencia } from './features/apariencia/EleccionApariencia'
import { NavInferior } from './components/shell/BottomNav'
import { FinanzasScreen } from './features/finanzas/FinanzasScreen'
import { BalanceScreen } from './features/balance/BalanceScreen'
import { AvisosScreen } from './features/avisos/AvisosScreen'
import { RutinaScreen } from './features/rutina/RutinaScreen'
import { AjustesScreen } from './features/ajustes/AjustesScreen'
import { AtlasScreen } from './features/atlas/AtlasScreen'
import { AtlasTipstersScreen } from './features/tipsters/AtlasTipstersScreen'
import { AtlasThemeProvider, AtlasModuleFrame } from './features/atlas/atlasTheme'
import { useEffect, useMemo, useState } from 'react'
import { useTienda } from './lib/store'
import { proximosVencimientos } from './lib/selectors'
import { reprogramarVencimientos } from './features/avisos/programador'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Geolocation } from '@capacitor/geolocation'
import { AlarmaPantalla, Burbuja, esNativo } from './lib/nativo'
import './atlas.css'
import './atlas-modules.css'
import './atlas-special.css'
import './atlas-colors.css'
import './atlas-colors-extra.css'
import './atlas-colors-picker-extra.css'
import './atlas-colors-global-overrides.css'
import './atlas-text-overrides.css'
import './atlas-access.css'
import './atlas-onboarding.css'
import './atlas-editorial.css'
import './atlas-editorial-modules.css'
import './atlas-onboarding-themes.css'
import './atlas-onboarding-colors-extra.css'
import './atlas-pulso-reading.css'
import './atlas-tipsters-analytics.css'
import './atlas-tipsters-summary.css'
import './atlas-open-summary.css'
import './atlas-balance-orbits.css'
import './atlas-savings-graph.css'
import './atlas-analytics-motion.css'

function Interior() {
  const { yaEligio } = useApariencia()
  const generar = useTienda((s) => s.generarGastosFijosDelMes)
  const estado = useTienda()
  const vencimientos = useMemo(() => proximosVencimientos({ deudas: estado.deudas, gastosHogarFijos: estado.gastosHogarFijos, gastosHogar: estado.gastosHogar }), [estado.deudas, estado.gastosHogarFijos, estado.gastosHogar])

  useEffect(() => {
    generar()
  }, [generar])

  useEffect(() => {
    void (async () => {
      if (!((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())) return
      await LocalNotifications.requestPermissions().catch(() => {})
      await reprogramarVencimientos(vencimientos)
    })()
  }, [vencimientos])

  if (!yaEligio) return <EleccionApariencia />

  return (
    <HashRouter>
      <div className="min-h-dvh">
        <GuiaPermisosInicial />
        <Link to="/ajustes" className="atlas-settings-access" aria-label="Abrir ajustes"><Settings2 size={18} /><span>Ajustes</span></Link>
        <Routes>
          <Route path="/" element={<AtlasScreen />} />
          <Route path="/atlas" element={<AtlasScreen />} />
          <Route path="/finanzas" element={<AtlasModuleFrame module="Casa y deudas"><FinanzasScreen /></AtlasModuleFrame>} />
          <Route path="/balance" element={<AtlasModuleFrame module="Balance"><BalanceScreen /></AtlasModuleFrame>} />
          <Route path="/avisos" element={<AtlasModuleFrame module="Señales"><AvisosScreen /></AtlasModuleFrame>} />
          <Route path="/rutina" element={<AtlasModuleFrame module="Ritual"><RutinaScreen /></AtlasModuleFrame>} />
          <Route path="/ajustes" element={<AtlasModuleFrame module="Sistema"><AjustesScreen /></AtlasModuleFrame>} />
          <Route path="/tipsters" element={<AtlasModuleFrame module="Laboratorio"><AtlasTipstersScreen /></AtlasModuleFrame>} />
        </Routes>
        <NavInferior />
      </div>
    </HashRouter>
  )
}

function GuiaPermisosInicial() {
  const [visible, setVisible] = useState(() => esNativo() && localStorage.getItem('noah-permisos-iniciales-v2') !== 'ok')
  const [estado, setEstado] = useState('Configura ubicación, alarmas y la burbuja para que NOAH funcione automáticamente.')

  if (!visible) return null

  async function configurar() {
    if (!esNativo()) { localStorage.setItem('noah-permisos-iniciales-v2', 'ok'); setVisible(false); return }
    await LocalNotifications.requestPermissions().catch(() => {})
    await Geolocation.requestPermissions().catch(() => {})
    const alarma = await AlarmaPantalla.tienePermisoPantallaCompleta().catch(() => ({ concedido: false }))
    if (!alarma.concedido) { setEstado('Activa el permiso de pantalla completa para recibir alarmas aunque el teléfono esté bloqueado.'); await AlarmaPantalla.solicitarPermisoPantallaCompleta().catch(() => {}); return }
    const burbuja = await Burbuja.tienePermiso().catch(() => ({ concedido: false }))
    if (!burbuja.concedido) { setEstado('Activa Mostrar sobre otras aplicaciones para que la burbuja se abra al iniciar jornada.'); await Burbuja.solicitarPermiso().catch(() => {}); return }
    localStorage.setItem('noah-permisos-iniciales-v2', 'ok')
    setVisible(false)
  }

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5"><div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl"><p className="text-[10px] tracking-[.14em] text-acento-alto uppercase">Configuración inicial</p><h2 className="mt-2 text-xl font-semibold text-fg">Permisos para que NOAH funcione solo</h2><p className="mt-2 text-[13px] leading-relaxed text-mute">Necesitamos ubicación precisa, notificaciones, alarmas a pantalla completa y permiso para mostrar la burbuja encima de otras aplicaciones.</p><p className="mt-3 rounded-2xl bg-surface-2 p-3 text-[12px] text-fg">{estado}</p><button type="button" onClick={configurar} className="mt-4 min-h-12 w-full rounded-2xl bg-acento px-4 text-sm font-semibold text-[var(--btn-fg)]">Configurar permisos</button></div></div>
}

export default function App() {
  return (
    <ProveedorApariencia>
      <AtlasThemeProvider><Interior /></AtlasThemeProvider>
    </ProveedorApariencia>
  )
}
