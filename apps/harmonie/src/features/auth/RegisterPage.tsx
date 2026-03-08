import { useTranslation } from 'react-i18next'

export const RegisterPage = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-display italic text-2xl text-primary">{t('auth.register')}</p>
    </div>
  )
}
