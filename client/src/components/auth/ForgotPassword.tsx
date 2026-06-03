import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { authService } from '../../services/api';
import { getErrorMessage } from '../../utils/feedback';
import AuthPageChrome from './AuthPageChrome';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await authService.forgotPassword(email);
      setMessage('If that email exists, reset instructions have been prepared.');
    } catch (err: any) {
      setError(getErrorMessage(err) || 'Unable to request password reset. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageChrome>
      {(content) => {
        const logoSrc = content.school.logo || '/assets/logo/favicon_io/android-chrome-512x512.png';

        return (
      <section className="auth-stage auth-stage--compact" aria-label="Password recovery">
        <form onSubmit={handleSubmit} className="auth-card auth-card--static">
          <div className="auth-card__brand">
            <img className="auth-card__logo" src={logoSrc} alt="" aria-hidden="true" />
            <div>
              <p className="eyebrow">Account recovery</p>
              <h1>Reset Password</h1>
            </div>
          </div>

          <p className="auth-card__copy">Enter your account email. The server will validate it and prepare reset instructions.</p>

          <label className="auth-field">
            <span>Email address</span>
            <Mail size={18} aria-hidden="true" />
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          {message && <div className="form-alert form-alert--success">{message}</div>}
          {error && <div className="form-alert form-alert--error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            <Send size={17} aria-hidden="true" />
            {loading ? 'Sending instructions' : 'Send reset instructions'}
          </button>
          <Link className="auth-back-link" to="/login">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to login
          </Link>
        </form>
      </section>
        );
      }}
    </AuthPageChrome>
  );
}
