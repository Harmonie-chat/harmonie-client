import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, Input } from '@harmonie/ui'
import { Eye, EyeOff } from 'lucide-react'
import { isValidEmail, isValidPassword } from '@/utils/user'
import { AuthCard } from './AuthCard'

export const RegisterPage = () => {
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [emailErrorKey, setEmailErrorKey] = useState<string | undefined>()
  const [password, setPassword] = useState('')
  const [passwordErrorKey, setPasswordErrorKey] = useState<string | undefined>()
  const [showPassword, setShowPassword] = useState(false)

  const isSubmittable =
    username.trim().length > 0 && isValidEmail(email) && isValidPassword(password)

  const handleEmailBlur = () =>
    email && !isValidEmail(email)
      ? setEmailErrorKey('auth.errors.emailInvalid')
      : setEmailErrorKey(undefined)

  const handlePasswordBlur = () =>
    password && !isValidPassword(password)
      ? setPasswordErrorKey('auth.errors.passwordInvalid')
      : setPasswordErrorKey(undefined)

  return (
    <AuthCard title={t('auth.registerTitle')}>
      <form className="flex flex-col gap-4">
        <Input
          label={t('auth.username')}
          placeholder={t('auth.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label={t('auth.email')}
          placeholder={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          error={emailErrorKey ? t(emailErrorKey) : undefined}
        />
        <Input
          label={t('auth.password')}
          placeholder="••••••••••"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          error={passwordErrorKey ? t(passwordErrorKey) : undefined}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              className="cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Button variant="primary" className="w-full mt-2" type="submit" disabled={!isSubmittable}>
          {t('auth.joinButton')}
        </Button>
      </form>

      <p className="font-body text-sm text-text-3 text-center mt-4">
        {t('auth.alreadyAccount')}{' '}
        <Link to="/auth/connect" className="text-primary underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthCard>
  )
}
