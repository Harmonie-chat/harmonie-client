import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@harmonie/ui';
import { Eye, EyeOff } from 'lucide-react';
import { isValidEmail, isValidPassword } from '@/utils/user';
import { register } from '@/api/auth';
import { storeTokens } from '@/api/authStorage';
import type { ApiError } from '@/api/errors';
import { AuthCard } from './AuthCard';
import { useAuth } from './AuthContext';

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [usernameErrorKey, setUsernameErrorKey] = useState<string | undefined>();
  const [email, setEmail] = useState('');
  const [emailErrorKey, setEmailErrorKey] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [passwordErrorKey, setPasswordErrorKey] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalErrorKey, setGlobalErrorKey] = useState<string | undefined>();

  const isSubmittable =
    username.trim().length > 0 && isValidEmail(email) && isValidPassword(password);

  const handleEmailBlur = () =>
    email && !isValidEmail(email)
      ? setEmailErrorKey('auth.errors.emailInvalid')
      : setEmailErrorKey(undefined);

  const handlePasswordBlur = () =>
    password && !isValidPassword(password)
      ? setPasswordErrorKey('auth.errors.passwordInvalid')
      : setPasswordErrorKey(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;

    setIsLoading(true);
    setGlobalErrorKey(undefined);
    setEmailErrorKey(undefined);
    setUsernameErrorKey(undefined);

    try {
      const response = await register({ email, username, password });
      storeTokens(response);
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'AUTH_DUPLICATE_EMAIL') {
        setEmailErrorKey('auth.errors.duplicateEmail');
      } else if (apiError.code === 'AUTH_DUPLICATE_USERNAME') {
        setUsernameErrorKey('auth.errors.duplicateUsername');
      } else {
        setGlobalErrorKey('auth.errors.genericError');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title={t('auth.registerTitle')}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label={t('auth.username')}
          placeholder={t('auth.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={usernameErrorKey ? t(usernameErrorKey) : undefined}
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
        {globalErrorKey && <p className="text-sm text-error-fg text-center">{t(globalErrorKey)}</p>}
        <Button
          variant="primary"
          className="w-full mt-2"
          type="submit"
          disabled={!isSubmittable}
          isLoading={isLoading}
        >
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
  );
};
