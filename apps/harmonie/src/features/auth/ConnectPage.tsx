import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Separator } from '@harmonie/ui';
import { Eye, EyeOff } from 'lucide-react';
import { isValidEmail } from '@/shared/utils/user';
import { login } from '@/api/auth';
import { storeTokens } from '@/api/authStorage';
import type { ApiError } from '@/types/error';
import { AuthCard } from './AuthCard';
import { useAuth } from './AuthContext';

interface ConnectState {
  username: string;
  email: string;
  emailErrorKey?: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  globalErrorKey?: string;
}

type ConnectAction =
  | { type: 'patch'; patch: Partial<ConnectState> }
  | { type: 'togglePasswordVisibility' };

const connectInitialState: ConnectState = {
  username: '',
  email: '',
  password: '',
  showPassword: false,
  isLoading: false,
};

const connectReducer = (state: ConnectState, action: ConnectAction): ConnectState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'togglePasswordVisibility':
      return { ...state, showPassword: !state.showPassword };
  }
};

export const ConnectPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const [state, dispatch] = useReducer(connectReducer, connectInitialState);
  const { username, email, emailErrorKey, password, showPassword, isLoading, globalErrorKey } =
    state;

  const isSubmittable =
    (username.trim().length > 0 || (email.trim().length > 0 && isValidEmail(email))) &&
    password.trim().length > 0;

  const handleEmailBlur = () =>
    email && !isValidEmail(email)
      ? dispatch({ type: 'patch', patch: { emailErrorKey: 'auth.errors.emailInvalid' } })
      : dispatch({ type: 'patch', patch: { emailErrorKey: undefined } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;

    dispatch({ type: 'patch', patch: { isLoading: true, globalErrorKey: undefined } });

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
        dispatch({ type: 'patch', patch: { globalErrorKey: 'auth.errors.invalidCredentials' } });
      } else if (apiError.code === 'AUTH_USER_INACTIVE') {
        dispatch({ type: 'patch', patch: { globalErrorKey: 'auth.errors.userInactive' } });
      } else {
        dispatch({ type: 'patch', patch: { globalErrorKey: 'auth.errors.genericError' } });
      }
    }
    dispatch({ type: 'patch', patch: { isLoading: false } });
  };

  return (
    <AuthCard title={t('auth.signIn')}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 rounded-sm border border-border-2 p-3">
          <Input
            label={t('auth.username')}
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => dispatch({ type: 'patch', patch: { username: e.target.value } })}
          />
          <Separator label={t('auth.or')} />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => dispatch({ type: 'patch', patch: { email: e.target.value } })}
            onBlur={handleEmailBlur}
            error={emailErrorKey ? t(emailErrorKey) : undefined}
          />
        </div>
        <Input
          label={t('auth.password')}
          placeholder="••••••••••"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => dispatch({ type: 'patch', patch: { password: e.target.value } })}
          rightElement={
            <button
              type="button"
              onClick={() => dispatch({ type: 'togglePasswordVisibility' })}
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
