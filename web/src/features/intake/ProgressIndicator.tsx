const PHASES = ['Welcome', 'You', 'Goal', 'Questions', 'Recommendations'] as const

type Props = {
  /** 1–5 */
  current: number
}

export function ProgressIndicator({ current }: Props) {
  const active = Math.min(Math.max(current, 1), 5)

  return (
    <div className="-mx-1 flex w-full max-w-full flex-nowrap items-center justify-center gap-x-0 overflow-x-auto overscroll-x-contain px-1 pb-0.5 text-[0.65rem] text-muted-foreground sm:gap-x-0.5 sm:text-xs">
      {PHASES.map((label, i) => {
        const step = i + 1
        const done = active > step
        const on = active === step
        return (
          <div key={label} className="flex shrink-0 items-center">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6rem] font-bold sm:size-6 sm:text-[0.65rem] ${
                on
                  ? 'border-foreground/35 bg-foreground text-background'
                  : done
                    ? 'border-[var(--nucleus-blue-soft)] bg-accent text-[var(--nucleus-blue)]'
                    : 'border-border bg-card text-muted-foreground'
              }`}
              aria-current={on ? 'step' : undefined}
            >
              {step}
            </span>
            <span
              className={`ml-1 whitespace-nowrap sm:ml-1.5 ${on ? 'font-bold text-foreground' : ''}`}
            >
              {label}
            </span>
            {step < 5 ? (
              <span
                aria-hidden
                className="mx-1 hidden h-px w-4 shrink-0 bg-border sm:mx-2 sm:block sm:w-6 md:w-8"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
