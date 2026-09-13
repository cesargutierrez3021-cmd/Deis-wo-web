export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(' ')
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
