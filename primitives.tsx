import type React from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({
  className,
  children,
  style,
}: {
  className?: string
  children: ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('rounded-[var(--radius-card)] border border-line bg-surface', className)}
      style={{ boxShadow: 'var(--shadow-card)', ...style }}
    >
      {children}
    </div>
  )
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'dorado' | 'contorno' | 'fantasma'
}

export function Boton({ variante = 'dorado', className, children, ...props }: BotonProps) {
  return (
    <button
      className={cn(
        'display min-h-12 w-full rounded-[var(--radius-btn)] px-5 text-[15px] font-semibold tracking-[0.05em] uppercase transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        variante === 'dorado' && 'text-[var(--btn-fg)]',
        variante === 'contorno' && 'border border-acento-linea text-acento-alto',
        variante === 'fantasma' && 'text-dim',
        className
      )}
      style={variante === 'dorado' ? { background: 'var(--grad-acento)', boxShadow: 'var(--glow-acento)' } : undefined}
      {...props}
    >
      {children}
    </button>
  )
}

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">{etiqueta}</span>
      {children}
    </label>
  )
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'min-h-11 w-full rounded-[var(--radius-btn)] border border-line bg-surface-2 px-3 text-[15px] text-fg placeholder:text-mute focus-within:border-acento-linea outline-none',
        props.className
      )}
    />
  )
}

export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-[var(--radius-btn)] border border-line bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-mute focus-within:border-acento-linea outline-none',
        props.className
      )}
    />
  )
}

/** Campo de dinero: siempre en pesos colombianos, con separador de miles mientras se escribe. */
export function EntradaPesos({
  valor,
  onCambio,
  placeholder = '$0',
}: {
  valor: number
  onCambio: (v: number) => void
  placeholder?: string
}) {
  const texto = valor ? valor.toLocaleString('es-CO') : ''
  return (
    <div className="relative">
      <span className="tabular pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] text-mute">$</span>
      <input
        inputMode="numeric"
        placeholder={placeholder.replace('$', '')}
        value={texto}
        onChange={(e) => {
          const limpio = e.target.value.replace(/[^\d]/g, '')
          onCambio(limpio ? parseInt(limpio, 10) : 0)
        }}
        className="tabular min-h-11 w-full rounded-[var(--radius-btn)] border border-line bg-surface-2 py-2 pr-3 pl-6 text-[15px] text-fg outline-none focus-within:border-acento-linea"
      />
    </div>
  )
}

export function Chip({
  activo,
  onClick,
  children,
}: {
  activo?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-[var(--radius-pill)] border px-3.5 py-2 text-[12.5px] font-medium transition-colors',
        activo ? 'border-acento-linea text-acento-alto' : 'border-line text-dim'
      )}
      style={activo ? { background: 'var(--grad-acento-suave)' } : undefined}
    >
      {children}
    </button>
  )
}

export function Insignia({ tono = 'neutro', children }: { tono?: 'win' | 'loss' | 'neutro'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
        tono === 'win' && 'border-win/35 bg-win/10 text-win',
        tono === 'loss' && 'border-loss/35 bg-loss/10 text-loss',
        tono === 'neutro' && 'border-line text-mute'
      )}
    >
      {children}
    </span>
  )
}

export function TituloSeccion({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mt-8 mb-3 flex items-center justify-between border-b border-line pb-2">
      <h2 className="display text-[15px] font-semibold tracking-[0.02em] text-fg">{children}</h2>
      {accion}
    </div>
  )
}

export function BarraProgreso({ fraccion, alto = 6 }: { fraccion: number; alto?: number }) {
  const f = Math.max(0, Math.min(1, fraccion))
  return (
    <div className="w-full overflow-hidden rounded-full bg-surface-3" style={{ height: alto }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${f * 100}%`, background: 'var(--grad-acento)' }}
      />
    </div>
  )
}
