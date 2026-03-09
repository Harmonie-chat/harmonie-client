import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import { Button } from '../Button/Button'

export interface Language {
  code: string
  label: string
}

export interface LanguageSelectorProps {
  languages: Language[]
  currentLang: string
  onChange: (code: string) => void
}

export const LanguageSelector = ({ languages, currentLang, onChange }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = languages.find((l) => l.code === currentLang)

  return (
    <div ref={ref} className="relative">
      <Button
        variant="tertiary"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5! py-1.5! select-none"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current?.label}
      >
        <Languages size={15} aria-hidden="true" />
        <span>{currentLang.toUpperCase()}</span>
      </Button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 min-w-full bg-surface-1 border border-border-2 rounded-sm shadow-[0_4px_16px_rgba(61,53,48,0.10)] overflow-hidden z-50"
        >
          {languages.map((lang) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLang}
              onClick={() => {
                onChange(lang.code)
                setOpen(false)
              }}
              className={`px-3 py-2 font-body text-sm cursor-pointer select-none transition-colors whitespace-nowrap ${
                lang.code === currentLang
                  ? 'text-text-1 bg-surface-3'
                  : 'text-tertiary-fg hover:bg-surface-3'
              }`}
            >
              {lang.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
