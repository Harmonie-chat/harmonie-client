import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Separator } from '@harmonie/ui';
import { Eye, EyeOff } from 'lucide-react';
import { isValidEmail } from '@/shared/utils/user';
import { login } from '@/api/auth';
import { storeTokens } from '@/api/authStorage';
import type { ApiError } from '@/api/errors';
import { AuthCard } from './AuthCard';
import { useAuth } from './AuthContext';

export const ConnectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailErrorKey, setEmailErrorKey] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalErrorKey, setGlobalErrorKey] = useState<string | undefined>();

  const isSubmittable =
    (username.trim().length > 0 || (email.trim().length > 0 && isValidEmail(email))) &&
    password.trim().length > 0;

  const handleEmailBlur = () =>
    email && !isValidEmail(email)
      ? setEmailErrorKey('auth.errors.emailInvalid')
      : setEmailErrorKey(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;

    setIsLoading(true);
    setGlobalErrorKey(undefined);

    try {
      const response = await login({
        emailOrUsername: username.trim() || email.trim(),
        password,
      });
      storeTokens(response);
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'AUTH_INVALID_CREDENTIALS') {
        setGlobalErrorKey('auth.errors.invalidCredentials');
      } else if (apiError.code === 'AUTH_USER_INACTIVE') {
        setGlobalErrorKey('auth.errors.userInactive');
      } else {
        setGlobalErrorKey('auth.errors.genericError');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title={t('auth.signIn')}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 rounded-sm border border-border-2 p-3">
          <Input
            label={t('auth.username')}
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Separator label={t('auth.or')} />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            error={emailErrorKey ? t(emailErrorKey) : undefined}
          />
        </div>
        <Input
          label={t('auth.password')}
          placeholder="••••••••••"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {t('auth.signIn')}
        </Button>
      </form>

      <p className="font-body text-sm text-text-3 text-center mt-4">
        {t('auth.noAccount')}{' '}
        <Link to="/auth/register" className="text-primary underline">
          {t('auth.registerTitle')}
        </Link>
      </p>
    </AuthCard>
  );
};
