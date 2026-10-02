import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type BaseSelectProps = {
  value: string
  onValueChange: (value: string) => void
  ariaLabel: string
  className?: string
  options: Array<{ value: string; label: string }>
}

export function BaseSelect({ value, onValueChange, ariaLabel, className, options }: BaseSelectProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => {
      if (nextValue !== null) onValueChange(nextValue)
    }}>
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}