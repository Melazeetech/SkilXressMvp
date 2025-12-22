import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle, Briefcase, UserCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validateFullName, getPasswordStrengthPercentage, getPasswordStrengthColor } from '../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
  }>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  // Auto-focus email field when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when switching modes
  useEffect(() => {
    setError('');
    setFieldErrors({});
    setShowSuccess(false);
  }, [mode]);

  if (!isOpen) return null;

  const passwordValidation = validatePassword(password);
  const passwordStrengthPercentage = getPasswordStrengthPercentage(password);

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };

    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'fullName':
        if (value && !validateFullName(value)) {
          errors.fullName = 'Name must be at least 2 characters';
        } else {
          delete errors.fullName;
        }
        break;
      case 'password':
        if (mode === 'signup' && value && !passwordValidation.isValid) {
          errors.password = passwordValidation.issues[0];
        } else {
          delete errors.password;
        }
        break;
      case 'confirmPassword':
        if (value && value !== password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }

    setFieldErrors(errors);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // No need to close modal here as redirect will happen
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred with Google Sign In');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate email for all modes except signup checks
    if (!validateEmail(email)) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }

    // Validate fields based on mode
    if (mode === 'signup') {
      if (!validateFullName(fullName)) {
        setFieldErrors({ fullName: 'Please enter your full name' });
        return;
      }
      if (!passwordValidation.isValid) {
        setFieldErrors({ password: passwordValidation.issues.join(', ') });
        return;
      }
      if (password !== confirmPassword) {
        setFieldErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }
      if (!agreedToTerms) {
        setError('Please agree to the Terms and Conditions');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) throw error;

        setError(''); // Clear any previous errors
        setMode('signin');
        // Show success distinct from login success, maybe just a toast or error field for info
        alert('Password reset link sent to your email!'); // Ideally use a toast here
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose();
      } else {
        const { error } = await signUp(email, password, fullName, userType);
        if (error) throw error;

        // Show success state
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SkilXpress!</h3>
            <p className="text-gray-600">Your account has been created successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-secondary-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 md:p-10 relative shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          {mode !== 'forgot-password' ? (
            <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-6 relative">
              <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] h-[calc(100%-12px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-spring ${mode === 'signup' ? 'translate-x-[100%] ml-1.5' : 'translate-x-0 left-1.5'}`} />
              <button
                onClick={() => setMode('signin')}
                className={`relative z-10 flex-1 py-3 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${mode === 'signin' ? 'text-secondary-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`relative z-10 flex-1 py-3 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${mode === 'signup' ? 'text-secondary-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={() => setMode('signin')}
                className="text-sm font-bold text-gray-500 hover:text-secondary-black flex items-center gap-1 mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          )}

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-orange/10 mb-4">
              <UserCircle className="w-6 h-6 text-secondary-orange" />
            </div>
            <h2 className="text-2xl font-black text-secondary-black mb-1 tracking-tight">
              {mode === 'forgot-password' ? 'Reset Password' : (mode === 'signin' ? 'Welcome Back!' : 'Join SkilXpress')}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {mode === 'forgot-password'
                ? 'Enter your email to receive reset instructions'
                : (mode === 'signin'
                  ? 'Enter your details to access your account'
                  : 'Connect with top professionals instantly')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-secondary-black transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      validateField('fullName', e.target.value);
                    }}
                    onBlur={() => validateField('fullName', fullName)}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.fullName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-transparent focus:border-secondary-black'
                      }`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  I want to...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType('client')}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${userType === 'client'
                      ? 'border-secondary-black bg-gray-50 ring-1 ring-secondary-black/5'
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${userType === 'client' ? 'bg-secondary-black text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-gray-900">Find Services</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">Book pros</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('provider')}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${userType === 'provider'
                      ? 'border-secondary-orange bg-orange-50/50 ring-1 ring-secondary-orange/20'
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${userType === 'provider' ? 'bg-secondary-orange text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-gray-900">Offer Services</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">Earn money</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-secondary-black transition-colors" />
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField('email', e.target.value);
                }}
                onBlur={() => validateField('email', email)}
                className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.email
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-transparent focus:border-secondary-black'
                  }`}
                placeholder="you@example.com"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.email}</p>
            )}
          </div>

          {/* Password - Hide in forgot-password mode */}
          {mode !== 'forgot-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-secondary-black transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (mode === 'signup') validateField('password', e.target.value);
                  }}
                  onBlur={() => mode === 'signup' && validateField('password', password)}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.password
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-transparent focus:border-secondary-black'
                    }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {mode === 'signup' && password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength</span>
                    <span className={`text-xs font-medium ${passwordValidation.strength === 'weak' ? 'text-red-600' :
                      passwordValidation.strength === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                      {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordValidation.strength)}`}
                      style={{ width: `${passwordStrengthPercentage}%` }}
                    />
                  </div>
                  {passwordValidation.issues.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {passwordValidation.issues.map((issue, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirm Password */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-secondary-black transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    validateField('confirmPassword', e.target.value);
                  }}
                  onBlur={() => validateField('confirmPassword', confirmPassword)}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.confirmPassword
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-transparent focus:border-secondary-black'
                    }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Terms & Conditions */}
          {mode === 'signup' && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary-black text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'forgot-password' ? (
              'Send Reset Link'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Social Login Placeholders - Hide in forgot-password mode */}
        {mode !== 'forgot-password' && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* Toggle Mode */}
        {mode === 'signin' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode('forgot-password')}
              className="text-sm font-bold text-gray-400 hover:text-secondary-orange transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {mode !== 'forgot-password' && (
          null
        )}
      </div>
    </div>
  );
}
