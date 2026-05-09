/**
 * Full-viewport loading state while match RPC / edge work runs.
 */
export function FindingMatchesLoader() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-10 bg-background px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative size-24" aria-hidden>
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary/70 border-r-primary/25"
          style={{ animationDuration: '1.1s' }}
        />
        <div className="absolute inset-[10px] rounded-full border border-primary/15" />
        <div
          className="absolute inset-[10px] animate-spin rounded-full border border-transparent border-b-primary/40"
          style={{ animationDuration: '1.8s', animationDirection: 'reverse' }}
        />
      </div>

      <div className="max-w-md space-y-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both delay-150">
        <p className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
          Finding your matches
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We&apos;re searching the network for people and opportunities that fit
          what you shared. This usually takes a few seconds.
        </p>
      </div>
    </div>
  )
}
