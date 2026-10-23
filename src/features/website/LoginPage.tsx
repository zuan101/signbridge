import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';

interface LoginPageProps {
  onNavigateToApp: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToApp,
  onNavigateToSignUp,
  onNavigateToHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address (e.g., student@college.edu).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Demo access: Do NOT save credentials to localStorage, sessionStorage, or logs
    // Directly navigate to the sign language recognition model workspace
    onNavigateToApp();
  };

  return (
    <div className="auth-container">
      {/* Back to Home Button */}
      <button
        type="button"
        className="auth-back-btn"
        onClick={onNavigateToHome}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <BrandLogo size={42} />
          <h1 className="auth-title">Welcome back to SignText</h1>
          <p className="auth-subtitle">
            Log in to launch the Indian Sign Language recognition communication desk.
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div className="demo-notice-box">
          <ShieldCheck size={18} color="var(--terracotta)" />
          <div>
            <strong>Demo Access Mode</strong>
            <p>
              Enter any valid email and password. No database is used and no credentials are ever stored.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-alert" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@institution.edu"
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="show-pwd-btn"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            <span>Log In (Demo Access)</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Switch to Sign Up */}
        <div className="auth-footer-prompt">
          <span>Don't have an account? </span>
          <button
            type="button"
            className="auth-link-btn"
            onClick={onNavigateToSignUp}
          >
            Create one for free
          </button>
        </div>
      </div>
    </div>
  );
};
