import { useCallback, useEffect, useRef, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import { useTienda } from '../../lib/store'
import { RastreadorViaje } from '../../lib/geo'
import { formatearDuracion } from '../../lib/format'
import { Burbuja, esNativo } from '../../lib/nativo'
import { useAtlasTheme } from '../atlas/atlasTheme.context'
import type { App } from '../../lib/types'

/*
 * El reloj del viaje se mide exclusivamente entre los dos toques del usuario.
 * El GPS solo aporta kilómetros y nunca puede pausar o alterar el tiempo.
 */

export interface EstadoViaje {
  activo: boolean
  km: number
  msTranscurridos: number
  app: App
  iniciarViaje: () => void
  terminarViaje: (guardar: boolean) => void
  cambiarApp: (a: App) => void
  errorGps: string | null
}

function kmCorto(km: number): string { return Math.round(km).toLocaleString('es-CO') }

export function useViaje(): EstadoViaje {
  const registrarViajeGPS = useTienda((s) => s.registrarViajeGPS)
  const appPreferida = useTienda((s) => s.ajustes.appPreferida)
  const jornadaAbierta = useTienda((s) => s.jornadaAbierta)
  const { theme } = useAtlasTheme()

  const [activo, setActivo] = useState(false)
  const [km, setKm] = useState(0)
  const [ms, setMs] = useState(0)
  const [app, setApp] = useState<App>(appPreferida)
  const [errorGps, setErrorGps] = useState<string | null>(null)

  const activoRef = useRef(false)
  const iniciandoRef = useRef(false)
  const rastreador = useRef<RastreadorViaje | null>(null)
  const watchId = useRef<string | null>(null)
  const inicioISO = useRef<string>('')
  const inicioMs = useRef(0)
  const tickRef = useRef<number | null>(null)

  const detenerGps = useCallback(async () => {
    if (watchId.current) {
      await Geolocation.clearWatch({ id: watchId.current }).catch(() => {})
      watchId.current = null
    }
  }, [])

  const terminarViaje = useCallback(
    (guardar: boolean, datosNativos?: { km?: number; inicioMs?: number; finMs?: number; tiempoMs?: number }) => {
      if (!activoRef.current) return
      const finISO = datosNativos?.finMs ? new Date(datosNativos.finMs).toISOString() : new Date().toISOString()
      const inicioISOFinal = datosNativos?.inicioMs ? new Date(datosNativos.inicioMs).toISOString() : inicioISO.current
      if (guardar && rastreador.current && inicioISO.current) {
        registrarViajeGPS({
          app,
          km: Math.round((datosNativos?.km ?? rastreador.current.km) * 10) / 10,
          pago: null,
          inicioISO: inicioISOFinal,
          finISO,
        })
      }
      activoRef.current = false
      iniciandoRef.current = false
      setActivo(false)
      setKm(0)
      setMs(0)
      rastreador.current = null
      void detenerGps()
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current)
        tickRef.current = null
      }
      if (esNativo()) {
        const estilos = getComputedStyle(document.documentElement)
        Burbuja.actualizar({ km: '0', tiempo: '0m', enViaje: false, estilo: theme, colorAcento: estilos.getPropertyValue('--c-acento').trim(), colorFg: estilos.getPropertyValue('--c-fg').trim(), colorSurface: estilos.getPropertyValue('--c-surface').trim() }).catch(() => {})
      }
    },
    [app, detenerGps, registrarViajeGPS, theme]
  )

  const iniciarViaje = useCallback(() => {
    if (activoRef.current || iniciandoRef.current || !jornadaAbierta()) return

    // El viaje queda iniciado con este toque; permisos/GPS se solicitan en paralelo.
    iniciandoRef.current = true
    activoRef.current = true
    const ahora = Date.now()
    inicioMs.current = ahora
    inicioISO.current = new Date(ahora).toISOString()
    rastreador.current = new RastreadorViaje()
    setErrorGps(null)
    setActivo(true)
    setKm(0)
    setMs(0)

    tickRef.current = window.setInterval(() => {
      setMs(Date.now() - inicioMs.current)
    }, 1000)
    iniciandoRef.current = false

    void (async () => {
      try {
        const permiso = await Geolocation.requestPermissions()
        if (permiso.location !== 'granted' && permiso.coarseLocation !== 'granted') {
          setErrorGps('Sin permiso de ubicación: el viaje corre por tiempo, sin kilómetros.')
          return
        }
      } catch {
        setErrorGps('No se pudo pedir el permiso de ubicación. El viaje sigue contando tiempo.')
        return
      }

      if (!activoRef.current) return
      try {
        watchId.current = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
          (pos, err) => {
            if (err || !pos || !activoRef.current) return
            const r = rastreador.current
            if (!r) return
            r.procesar({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              precisionM: pos.coords.accuracy ?? 50,
              timestampMs: pos.timestamp,
            })
            setKm(r.km)
          }
        )
      } catch {
        setErrorGps('El GPS no respondió: el viaje sigue contando tiempo, sin kilómetros.')
      }
    })()
  }, [jornadaAbierta])

  useEffect(() => {
    if (!esNativo() || !activo) return
    const estilos = getComputedStyle(document.documentElement)
    Burbuja.actualizar({
      km: kmCorto(km),
      tiempo: formatearDuracion(ms),
      enViaje: true,
      estilo: theme,
      colorAcento: estilos.getPropertyValue('--c-acento').trim(),
      colorFg: estilos.getPropertyValue('--c-fg').trim(),
      colorSurface: estilos.getPropertyValue('--c-surface').trim(),
    }).catch(() => {})
  }, [activo, km, ms, theme])

  useEffect(() => {
    if (!esNativo()) return
    let handle: { remove: () => void } | undefined
    Burbuja.addListener('accion', (d) => {
          if (d.accion === 'terminar') {
            terminarViaje(true, d)
            Burbuja.limpiarViajePendiente().catch(() => {})
          }
      if (d.accion === 'iniciar') iniciarViaje()
    }).then((h) => {
      handle = h
    })
    return () => handle?.remove()
  }, [iniciarViaje, terminarViaje])

  useEffect(() => {
    if (!esNativo()) return
    Burbuja.viajePendiente().then((d) => {
      if (!d.inicioMs || !d.finMs || activoRef.current) return
      registrarViajeGPS({
        app,
        km: Math.round((d.km ?? 0) * 10) / 10,
        pago: null,
        inicioISO: new Date(d.inicioMs).toISOString(),
        finISO: new Date(d.finMs).toISOString(),
      })
      Burbuja.limpiarViajePendiente().catch(() => {})
    }).catch(() => {})
  }, [app, registrarViajeGPS])

  useEffect(() => {
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
      void detenerGps()
    }
  }, [detenerGps])

  return { activo, km, msTranscurridos: ms, app, iniciarViaje, terminarViaje, cambiarApp: setApp, errorGps }
}
