import { NavLink } from 'react-router-dom'
import { Bike, WalletCards, BarChart3, Bell, CalendarClock, CircleDollarSign } from 'lucide-react'
import { cn } from '../../lib/utils'

const ITEMS = [
  { to: '/', icono: Bike, etiqueta: 'Trabajo' },
  { to: '/finanzas', icono: WalletCards, etiqueta: 'Casa/deudas' },
  { to: '/balance', icono: BarChart3, etiqueta: 'Balance' },
  { to: '/avisos', icono: Bell, etiqueta: 'Avisos' },
  { to: '/rutina', icono: CalendarClock, etiqueta: 'Rutina' },
  { to: '/tipsters', icono: CircleDollarSign, etiqueta: 'Tipsters' },
]

export function NavInferior() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/94 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-6 items-stretch">
        {ITEMS.map(({ to, icono: Icono, etiqueta }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center gap-0.5 px-0.5 pt-2 pb-1.5 text-[9px] leading-none font-medium tracking-[0.01em] whitespace-nowrap',
                isActive ? 'text-acento-alto' : 'text-mute'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icono size={19} strokeWidth={isActive ? 2.1 : 1.7} />
                <span className="max-w-full overflow-hidden text-center text-ellipsis uppercase">{etiqueta}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
