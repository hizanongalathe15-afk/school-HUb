import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, Sparkles, User, Zap } from 'lucide-react';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getDashboardPathForRole } from '../../utils/roleRoutes';
import { getErrorMessage, notifyError } from '../../utils/feedback';
import AuthPageChrome from './AuthPageChrome';

interface AuthFlipProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthFlip({ initialMode = 'login' }: AuthFlipProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const demoAccounts = [
    { label: 'Admin', email: 'admin@schoolhub.ac.ke', password: 'admin123' },
    { label: 'Principal', email: 'principal@schoolhub.ac.ke', password: 'principal123' },
    { label: 'Teacher', email: 'teacher@schoolhub.ac.ke', password: 'teacher123' },
    { label: 'Parent', email: 'parent@schoolhub.ac.ke', password: 'parent123' },
    { label: 'Bursar', email: 'bursar@schoolhub.ac.ke', password: 'bursar123' },
    { label: 'Store', email: 'store@schoolhub.ac.ke', password: 'store123' }
  ];
  const authHighlights = [
    { icon: ShieldCheck, title: 'Secure access', desc: 'Role based school portals' },
    { icon: Zap, title: 'Fast workflows', desc: 'Attendance, fees, classes, and messages' },
    { icon: Sparkles, title: 'Smart school tools', desc: 'Clean dashboards for every team' }
  ];

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await authService.login(loginForm);
      login(response.user, response.token, response.refreshToken);
      navigate(getDashboardPathForRole(response.user.role), { replace: true });
    } catch (error: any) {
      setMessage(getErrorMessage(error) || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    if (signupForm.password.length < 6) {
      setMessage(t('auth.passwordTooShort'));
      notifyError(new Error(t('auth.passwordTooShort')));
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setMessage(t('auth.passwordsDoNotMatch'));
      notifyError(new Error(t('auth.passwordsDoNotMatch')));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
        role: 'PARENT'
      });
      login(response.user, response.token, response.refreshToken);
      navigate(getDashboardPathForRole(response.user.role), { replace: true });
    } catch (error: any) {
      setMessage(getErrorMessage(error) || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  }

  function flip(nextMode: 'login' | 'signup') {
    setMessage('');
    setMode(nextMode);
  }

  return (
    <AuthPageChrome>
      {(content) => {
        const logoSrc = content.school.logo || '/assets/logo/favicon_io/android-chrome-512x512.png';
        const schoolName = content.school.name || 'School Hub';

        return (
      <section className="auth-stage auth-stage--split" aria-label={t('auth.authentication')}>
        <aside className="auth-info-panel" aria-hidden="true">
          <div className="auth-info-panel__brand">
            <span>
              <img src={logoSrc} alt="" aria-hidden="true" />
            </span>
            <strong>{schoolName}</strong>
          </div>
          <div className="auth-info-panel__copy">
            <p className="eyebrow">Connected learning</p>
            <h2>Welcome to {schoolName}</h2>
            <p>Connect staff, parents, learners, finance, and operations through one polished portal.</p>
          </div>
          <div className="auth-info-panel__features">
            {authHighlights.map((item) => (
              <div className="auth-info-feature" key={item.title}>
                <span>
                  <item.icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
                <CheckCircle2 size={18} aria-hidden="true" />
              </div>
            ))}
          </div>
        </aside>
        <div className={`auth-flip ${mode === 'signup' ? 'auth-flip--signup' : ''}`}>
          <form className="auth-card auth-card--front" onSubmit={submitLogin}>
            <div className="auth-card__brand">
              <img className="auth-card__logo" src={logoSrc} alt="" aria-hidden="true" />
              <div>
                <p className="eyebrow">{t('auth.secureAccess')}</p>
                <h1>{t('auth.signInTitle')}</h1>
              </div>
            </div>

            <div className="auth-mode-switch" aria-label={t('auth.authentication')}>
              <button type="button" className="active" onClick={() => flip('login')}>{t('auth.signIn')}</button>
              <button type="button" onClick={() => flip('signup')}>{t('auth.createAccount')}</button>
            </div>

            <label className="auth-field">
              <span>{t('auth.emailAddress')}</span>
              <Mail size={18} aria-hidden="true" />
              <input type="email" autoComplete="username" required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
            </label>
            <label className="auth-field">
              <span>{t('auth.password')}</span>
              <Lock size={18} aria-hidden="true" />
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </label>

            {message && mode === 'login' && <div className="form-alert form-alert--error">{message}</div>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signIn')}</button>
            <div className="auth-row">
              <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
              <button type="button" onClick={() => flip('signup')}>{t('auth.createAccount')}</button>
            </div>
            <div className="auth-demo-grid">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => setLoginForm({ email: account.email, password: account.password })}
                >
                  {t(`auth.demo.${account.label.toLowerCase()}`, { defaultValue: account.label })}
                </button>
              ))}
            </div>
          </form>

          <form className="auth-card auth-card--back" onSubmit={submitSignup}>
            <div className="auth-card__brand">
              <img className="auth-card__logo" src={logoSrc} alt="" aria-hidden="true" />
              <div>
                <p className="eyebrow">{t('auth.parentRegistration')}</p>
                <h1>{t('auth.createAccount')}</h1>
              </div>
            </div>
            <div className="auth-mode-switch" aria-label={t('auth.authentication')}>
              <button type="button" onClick={() => flip('login')}>{t('auth.signIn')}</button>
              <button type="button" className="active" onClick={() => flip('signup')}>{t('auth.createAccount')}</button>
            </div>
            <div className="auth-two">
              <label className="auth-field"><span>{t('auth.firstName')}</span><User size={18} aria-hidden="true" /><input autoComplete="given-name" required value={signupForm.firstName} onChange={(event) => setSignupForm({ ...signupForm, firstName: event.target.value })} /></label>
              <label className="auth-field"><span>{t('auth.lastName')}</span><User size={18} aria-hidden="true" /><input autoComplete="family-name" required value={signupForm.lastName} onChange={(event) => setSignupForm({ ...signupForm, lastName: event.target.value })} /></label>
            </div>
            <label className="auth-field"><span>{t('auth.emailAddress')}</span><Mail size={18} aria-hidden="true" /><input type="email" autoComplete="email" required value={signupForm.email} onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })} /></label>
            <label className="auth-field"><span>{t('auth.phoneNumber')}</span><Phone size={18} aria-hidden="true" /><input autoComplete="tel" required value={signupForm.phone} onChange={(event) => setSignupForm({ ...signupForm, phone: event.target.value })} /></label>
            <div className="auth-two">
              <label className="auth-field"><span>{t('auth.password')}</span><Lock size={18} aria-hidden="true" /><input type="password" autoComplete="new-password" required value={signupForm.password} onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })} /></label>
              <label className="auth-field"><span>{t('auth.confirmPassword')}</span><Lock size={18} aria-hidden="true" /><input type="password" autoComplete="new-password" required value={signupForm.confirmPassword} onChange={(event) => setSignupForm({ ...signupForm, confirmPassword: event.target.value })} /></label>
            </div>
            {message && mode === 'signup' && <div className="form-alert form-alert--error">{message}</div>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? t('auth.creatingAccount') : t('auth.createAccount')}</button>
            <div className="auth-row">
              <span>{t('auth.alreadyRegistered')}</span>
              <button type="button" onClick={() => flip('login')}>{t('auth.signIn')}</button>
            </div>
          </form>
        </div>
      </section>
        );
      }}
    </AuthPageChrome>
  );
}
