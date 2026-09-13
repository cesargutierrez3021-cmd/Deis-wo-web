import { registerPlugin } from '@capacitor/core'

/*
 * Dos capacidades que Capacitor no trae de fábrica y que esta app necesita
 * de verdad, no como adorno: la burbuja flotante que sigue el viaje fuera de
 * la app, y la alarma que se abre a pantalla completa incluso con el celular
 * bloqueado. Ambas están implementadas en Kotlin dentro de android/ — ver
 * BurbujaPlugin.kt y AlarmaPantallaPlugin.kt.
 */

export interface BurbujaPlugin {
  /** Pide el permiso "Mostrar sobre otras apps". En Android abre el ajuste del sistema. */
  solicitarPermiso(): Promise<{ concedido: boolean }>
  tienePermiso(): Promise<{ concedido: boolean }>
  /** Muestra la burbuja y arranca el servicio en primer plano que la mantiene viva. */
  mostrar(datos: { km: string; tiempo: string; enViaje: boolean; totalViajes?: number; resumenHoy?: string; resumenSemana?: string; resumenMes?: string; colorAcento?: string; colorFg?: string; colorSurface?: string; tarjetaActiva?: boolean; estilo?: 'editorial' | 'marea' | 'taller' | 'pulso' }): Promise<void>
  actualizar(datos: { km: string; tiempo: string; enViaje: boolean; totalViajes?: number; resumenHoy?: string; resumenSemana?: string; resumenMes?: string; colorAcento?: string; colorFg?: string; colorSurface?: string; tarjetaActiva?: boolean; estilo?: 'editorial' | 'marea' | 'taller' | 'pulso' }): Promise<void>
  ocultar(): Promise<void>
  actualizarApariencia(datos: { colorAcento?: string; colorFg?: string; colorSurface?: string }): Promise<void>
  viajePendiente(): Promise<{ km?: number; inicioMs?: number; finMs?: number; tiempoMs?: number }>
  limpiarViajePendiente(): Promise<void>
  addListener(
    eventName: 'accion',
    listenerFunc: (data: { accion: 'iniciar' | 'terminar' | 'abrir' | 'cerrar'; km?: number; inicioMs?: number; finMs?: number; tiempoMs?: number }) => void
  ): Promise<{ remove: () => void }>
}

export interface AlarmaPantallaPlugin {
  tienePermisoAlarmasExactas(): Promise<{ concedido: boolean }>
  solicitarPermisoAlarmasExactas(): Promise<void>
  tienePermisoPantallaCompleta(): Promise<{ concedido: boolean }>
  solicitarPermisoPantallaCompleta(): Promise<void>
  programar(datos: { id: string; fechaHoraMs: number; titulo: string; detalle?: string; vozId?: string; tipo?: 'rutina' | 'recordatorio' }): Promise<void>
  cancelar(datos: { id: string }): Promise<void>
}

export const Burbuja = registerPlugin<BurbujaPlugin>('Burbuja')
export const AlarmaPantalla = registerPlugin<AlarmaPantallaPlugin>('AlarmaPantalla')

export function esNativo(): boolean {
  return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    ?.isNativePlatform === 'function'
    ? Boolean((window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform())
    : false
}
