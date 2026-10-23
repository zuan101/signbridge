import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';

interface SignUpPageProps {
  onNavigateToApp: () => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateToApp,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      setErrorMessage('Please provide an email address.');
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please provide a valid email address (e.g., student@college.edu).');
      return;
    }

    if (!password) {
      setErrorMessage('Please create a password.');
      return;
    }

    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    // Demo access: No credentials are persisted to disk, localStorage, or remote server
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
          <h1 className="auth-title">Create your SignText Account</h1>
          <p className="auth-subtitle">
            Get instant access to real-time Indian Sign Language recognition.
          </p>
        </div>

        {/* Demo Notice Banner */}
        <div className="demo-notice-box">
          <ShieldCheck size={18} color="var(--terracotta)" />
          <div>
            <strong>Instant Demo Access</strong>
            <p>
              No confirmation email required. Submit any valid details to launch the workspace immediately.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-alert" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="signup-name">Full Name <span className="optional-tag">(Optional)</span></label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                className="auth-input"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="aarav@campus.ac.in"
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="signup-password">Password</label>
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
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            <span>Sign Up (Demo Access)</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Switch to Log In */}
        <div className="auth-footer-prompt">
          <span>Already have an account? </span>
          <button
            type="button"
            className="auth-link-btn"
            onClick={onNavigateToLogin}
          >
            Log in here
          </button>
        </div>
      </div>
    </div>
  );
};
