import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  id: string
  label?: string
  description?: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function FreeResponseInput({
  id,
  label,
  description,
  value,
  placeholder,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id} className="text-foreground">
          {label}
        </Label>
      ) : null}
      {description ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={description ? `${id}-hint` : undefined}
        className="min-h-24"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
