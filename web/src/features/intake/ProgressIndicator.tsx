const PHASES = ['Welcome', 'You', 'Goal', 'Questions', 'Recommendations'] as const

type Props = {
  /** 1–5 */
  current: number
}

export function ProgressIndicator({ current }: Props) {
  const active = Math.min(Math.max(current, 1), 5)

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {PHASES.map((label, i) => {
        const step = i + 1
        const done = active > step
        const on = active === step
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${
                on
                  ? 'border-foreground/35 bg-foreground text-background'
                  : done
                    ? 'border-foreground/25 bg-muted text-foreground'
                    : 'border-border bg-card text-muted-foreground'
              }`}
              aria-current={on ? 'step' : undefined}
            >
              {step}
            </span>
            <span className={on ? 'font-medium text-foreground' : ''}>
              {label}
            </span>
            {step < 5 ? (
              <span className="mx-1 hidden h-px w-8 bg-border text-[0] sm:block">
                {' '}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
