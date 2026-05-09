import { cn } from '@/lib/utils'

type Props = {
  name: string
  options: string[]
  selected: string | null
  onSelect: (v: string | null) => void
  disabled?: boolean
}

export function QuickSelectOptions({
  name,
  options,
  selected,
  onSelect,
  disabled,
}: Props) {
  return (
    <div
      className="grid gap-2"
      role="radiogroup"
      aria-labelledby={`${name}-legend`}
    >
      <span id={`${name}-legend`} className="sr-only">
        Choose one option — you may also add notes below.
      </span>
      {options.map((opt) => {
        const picked = selected === opt
        return (
          <label
            key={opt}
            className={cn(
              'flex cursor-pointer flex-col rounded-md border px-4 py-3 text-left text-sm outline-none ring-ring/15 transition hover:bg-secondary',
              picked
                ? 'border-[var(--nucleus-blue)] bg-accent ring-2'
                : 'border-border bg-card',
              disabled && 'cursor-not-allowed opacity-55',
            )}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                className="mt-1"
                checked={picked}
                name={name}
                value={opt}
                disabled={disabled}
                onChange={() => {
                  onSelect(opt)
                }}
              />
              <span className="leading-snug">{opt}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
