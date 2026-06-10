import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@harmonie/ui';
import { Eye, EyeOff } from 'lucide-react';
import { isValidEmail, isValidPassword } from '@/shared/utils/user';
import { resolveColor } from '@/shared/utils/colors';
import { BG_COLORS, ICON_COLORS } from '@/shared/components/iconAppearanceOptions';
import { register } from '@/api/auth';
import { storeTokens } from '@/api/authStorage';
import type { ApiError } from '@/types/error';
import { AuthCard } from './AuthCard';
import { useAuth } from './AuthContext';

interface RegisterState {
  username: string;
  usernameErrorKey?: string;
  email: string;
  emailErrorKey?: string;
  password: string;
  passwordErrorKey?: string;
  showPassword: boolean;
  isLoading: boolean;
  globalErrorKey?: string;
}

type RegisterAction =
  | { type: 'patch'; patch: Partial<RegisterState> }
  | { type: 'togglePasswordVisibility' };

const registerInitialState: RegisterState = {
  username: '',
  email: '',
  password: '',
  showPassword: false,
  isLoading: false,
};

const registerReducer = (state: RegisterState, action: RegisterAction): RegisterState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'togglePasswordVisibility':
      return { ...state, showPassword: !state.showPassword };
  }
};

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const [state, dispatch] = useReducer(registerReducer, registerInitialState);
  const {
    username,
    usernameErrorKey,
    email,
    emailErrorKey,
    password,
    passwordErrorKey,
    showPassword,
    isLoading,
    globalErrorKey,
  } = state;

  const isSubmittable =
    username.trim().length > 0 && isValidEmail(email) && isValidPassword(password);

  const handleEmailBlur = () =>
    email && !isValidEmail(email)
      ? dispatch({ type: 'patch', patch: { emailErrorKey: 'auth.errors.emailInvalid' } })
      : dispatch({ type: 'patch', patch: { emailErrorKey: undefined } });

  const handlePasswordBlur = () =>
    password && !isValidPassword(password)
      ? dispatch({ type: 'patch', patch: { passwordErrorKey: 'auth.errors.passwordInvalid' } })
      : dispatch({ type: 'patch', patch: { passwordErrorKey: undefined } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;

    dispatch({
      type: 'patch',
      patch: {
        isLoading: true,
        globalErrorKey: undefined,
        emailErrorKey: undefined,
        usernameErrorKey: undefined,
      },
    });

    try {
      const response = await register({
        email,
        username,
        password,
        avatar: {
          icon: 'PawPrint',
          color: resolveColor(ICON_COLORS[0] ?? ''),
          bg: resolveColor(BG_COLORS[0] ?? ''),
        },
        theme: 'default',
      });
      storeTokens(response);
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'AUTH_DUPLICATE_EMAIL') {
        dispatch({ type: 'patch', patch: { emailErrorKey: 'auth.errors.duplicateEmail' } });
      } else if (apiError.code === 'AUTH_DUPLICATE_USERNAME') {
        dispatch({ type: 'patch', patch: { usernameErrorKey: 'auth.errors.duplicateUsername' } });
      } else {
        dispatch({ type: 'patch', patch: { globalErrorKey: 'auth.errors.genericError' } });
      }
    }
    dispatch({ type: 'patch', patch: { isLoading: false } });
  };

  return (
    <AuthCard title={t('auth.registerTitle')}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label={t('auth.username')}
          placeholder={t('auth.username')}
          value={username}
          onChange={(e) => dispatch({ type: 'patch', patch: { username: e.target.value } })}
          error={usernameErrorKey ? t(usernameErrorKey) : undefined}
        />
        <Input
          label={t('auth.email')}
          placeholder={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => dispatch({ type: 'patch', patch: { email: e.target.value } })}
          onBlur={handleEmailBlur}
          error={emailErrorKey ? t(emailErrorKey) : undefined}
        />
        <Input
          label={t('auth.password')}
          placeholder="••••••••••"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => dispatch({ type: 'patch', patch: { password: e.target.value } })}
          onBlur={handlePasswordBlur}
          error={passwordErrorKey ? t(passwordErrorKey) : undefined}
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
