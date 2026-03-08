import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import i18n from '../../i18n'
import { Button, Input } from '@harmonie/ui'
import * as React from 'react';

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isValidPassword = (value: string) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value)

export const RegisterPage = () => {
  const { t } = useTranslation()
  const currentLang = i18n.language.startsWith('en') ? 'En' : 'Fr'

  const [email, setEmail] = useState('')
  const [emailErrorKey, setEmailErrorKey] = useState<string | undefined>()
  const [password, setPassword] = useState('')
  const [passwordErrorKey, setPasswordErrorKey] = useState<string | undefined>()

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language.startsWith('en') ? 'fr' : 'en')
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailErrorKey) setEmailErrorKey(undefined)
  }

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) setEmailErrorKey('auth.errors.emailInvalid')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (passwordErrorKey) setPasswordErrorKey(undefined)
  }

  const handlePasswordBlur = () => {
    if (password && !isValidPassword(password)) setPasswordErrorKey('auth.errors.passwordInvalid')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative bg-surface-1 rounded-lg shadow-[0_4px_32px_rgba(61,53,48,0.10)] p-8 w-full max-w-[430px]">
        {/* Language switcher */}
        <button
          onClick={toggleLang}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border-2 font-body text-sm text-text-1 bg-surface-1 hover:bg-surface-hover transition-colors cursor-pointer"
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
              components={{ host: <a href="https://github.com/Harmonie-chat" className="underline" target="_blank" rel="noopener noreferrer" /> }}
            />
          </p>
        </div>

        {/* Form heading */}
        <h2 className="font-display text-xl font-semibold text-text-1 text-center mb-6">
          {t('auth.registerTitle')}
        </h2>

        {/* Form */}
        <form className="flex flex-col gap-4">
          <Input
            label={t('auth.username')}
            placeholder={t('auth.username')}
          />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.email')}
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={emailErrorKey ? t(emailErrorKey) : undefined}
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••••"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={passwordErrorKey ? t(passwordErrorKey) : undefined}
          />
          <Button variant="primary" className="w-full mt-2" type="submit">
            {t('auth.joinButton')}
          </Button>
        </form>

        {/* Footer */}
        <p className="font-body text-sm text-text-3 text-center mt-4">
          {t('auth.alreadyAccount')}{' '}
          <Link to="/auth/connect" className="text-text-2 underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
