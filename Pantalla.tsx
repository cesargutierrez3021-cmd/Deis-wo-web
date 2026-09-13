import type { ReactNode } from 'react'

export function Pantalla({ children }: { children: ReactNode }) {
  return <div className="app-screen relative z-10 mx-auto max-w-md px-4 pt-5 pb-32">{children}</div>
}

export function TituloPantalla({ kicker, titulo, bajada }: { kicker?: string; titulo: string; bajada?: string }) {
  return (
    <div className="app-title">
      {kicker && (
        <span
          className="inline-block rounded-[var(--radius-pill)] border border-acento-linea px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-acento-alto uppercase"
          style={{ background: 'var(--grad-acento-suave)' }}
        >
          {kicker}
        </span>
      )}
      <h1 className="display mt-3 text-[26px] leading-tight font-semibold text-fg">{titulo}</h1>
      {bajada && <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{bajada}</p>}
    </div>
  )
}
