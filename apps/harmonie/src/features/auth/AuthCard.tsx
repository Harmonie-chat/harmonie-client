import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'

interface AuthCardProps {
  title: string
  children: ReactNode
}

export const AuthCard = ({ title, children }: AuthCardProps) => {
  const { t } = useTranslation()
  const { currentLang, toggleLang } = useLanguage()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative bg-surface-1 rounded-lg shadow-[0_4px_32px_rgba(61,53,48,0.10)] p-8 w-full max-w-107.5">
        {/* Language switcher */}
        <button
          onClick={toggleLang}
          className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border-2 font-body text-sm font-medium text-text-2 bg-surface-1 hover:bg-surface-hover active:scale-95 transition-all cursor-pointer select-none"
        >
          {currentLang}
        </button>

        {/* Branding */}
        <div className="mb-6">
          <h1 className="font-display italic text-[2rem] leading-tight text-primary">
            {t('app.name')}
          </h1>
          <p className="font-body text-sm text-text-2 mt-2 text-justify">
            <Trans
              i18nKey="auth.tagline"
              components={{ host: <a href="#" className="underline" target="_blank" rel="noopener noreferrer" /> }}
            />
          </p>
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-semibold text-text-1 text-center mb-6">
          {title}
        </h2>

        {children}
      </div>
    </div>
  )
}
