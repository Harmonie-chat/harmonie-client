export interface SeparatorProps {
  label?: string
}

export const Separator = ({ label }: SeparatorProps) => {
  if (!label) {
    return <div className="h-px w-full bg-border-2" />
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border-2" />
      <span className="font-body text-xs text-text-3">{label}</span>
      <div className="flex-1 h-px bg-border-2" />
    </div>
  )
}
