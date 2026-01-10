import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle, Briefcase, UserCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword, validateFullName, getPasswordStrengthPercentage, getPasswordStrengthColor } from '../utils/validation';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>(initialMode);
  const [step, setStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hasAccount = localStorage.getItem('skilxpress_has_account');
      if (hasAccount && initialMode === 'signin') {
        setMode('signin');
      } else {
        setMode(initialMode);
      }
      setStep(1);
      setShowOnboarding(false);
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
  const [categories, setCategories] = useState<Database['public']['Tables']['skill_categories']['Row'][]>([]);
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (isOpen && step === 3) {
      loadCategories();
    }
  }, [isOpen, step]);

  const loadCategories = async () => {
    const { data } = await supabase.from('skill_categories').select('*').order('name');
    setCategories(data || []);
  };

  const handleOnboardingComplete = async (skip: boolean = false) => {
    if (!skip && (specialty || bio || location)) {
      setOnboardingLoading(true);
      await updateProfile({
        specialty: specialty || null,
        bio: bio || null,
        location: location || null,
        phone: phone || null,
        status: 'pending' // For providers, maybe they need approval
      });
      setOnboardingLoading(false);
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const { signIn, signUp, signInWithGoogle, resetPassword, updateProfile } = useAuth();
  const emailInputRef = useRef<HTMLInputElement>(null);

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
      // Persist userType so that AuthContext can use it after redirect
      if (mode === 'signup') {
        localStorage.setItem('skilxpress_pending_user_type', userType);
        console.log('AuthModal: Persisting userType for Google Sign Up:', userType);
      }
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
        console.log('AuthModal: Signing up as', userType);
        const { error } = await signUp(email, password, fullName, userType);
        if (error) throw error;

        localStorage.setItem('skilxpress_has_account', 'true');

        if (userType === 'provider') {
          setStep(3); // Go to provider onboarding
        } else {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2000);
        }
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
          {mode === 'signup' && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'bg-secondary-orange w-8' : 'bg-gray-200 w-4'
                    } ${userType !== 'provider' && i === 3 ? 'hidden' : ''}`}
                />
              ))}
            </div>
          )}

          {mode !== 'forgot-password' && step < 3 ? (
            <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-6 relative">
              <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] h-[calc(100%-12px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-spring ${mode === 'signup' ? 'translate-x-[100%] ml-1.5' : 'translate-x-0 left-1.5'}`} />
              <button
                onClick={() => {
                  setMode('signin');
                  setStep(1);
                }}
                className={`relative z-10 flex-1 py-3 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${mode === 'signin' ? 'text-secondary-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setStep(1);
                }}
                className={`relative z-10 flex-1 py-3 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${mode === 'signup' ? 'text-secondary-black' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Create Account
              </button>
            </div>
          ) : (
            mode !== 'signup' && (
              <div className="mb-6">
                <button
                  onClick={() => setMode('signin')}
                  className="text-sm font-bold text-gray-500 hover:text-secondary-black flex items-center gap-1 mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            )
          )}

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-orange/10 mb-4">
              {step === 1 && mode === 'signup' ? <UserCircle className="w-6 h-6 text-secondary-orange" /> :
                step === 2 ? <Mail className="w-6 h-6 text-secondary-orange" /> :
                  step === 3 ? <Briefcase className="w-6 h-6 text-secondary-orange" /> :
                    <UserCircle className="w-6 h-6 text-secondary-orange" />}
            </div>
            <h2 className="text-2xl font-black text-secondary-black mb-1 tracking-tight">
              {mode === 'forgot-password' ? 'Reset Password' :
                mode === 'signin' ? 'Welcome Back!' :
                  step === 1 ? 'Choose Your Journey' :
                    step === 2 ? 'Create Account' :
                      'One Last Step!'}
            </h2>
            <p className="text-gray-500 font-medium text-sm">
              {mode === 'forgot-password' ? 'Enter your email to receive reset instructions' :
                mode === 'signin' ? 'Enter your details to access your account' :
                  step === 1 ? 'Are you here to find experts or offer your skills?' :
                    step === 2 ? `Setting up your ${userType} account` :
                      'Tell us a bit more about what you do'}
            </p>
          </div>
        </div>

        {mode === 'signup' && step === 1 && (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => {
                setUserType('client');
                localStorage.setItem('skilxpress_pending_user_type', 'client');
                setStep(2);
              }}
              className="flex items-center gap-4 p-6 rounded-3xl border-2 border-gray-100 hover:border-secondary-black hover:bg-gray-50 transition-all group text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary-black text-white flex items-center justify-center shrink-0">
                <UserCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-secondary-black">I want to find services</h3>
                <p className="text-sm text-gray-500 font-medium">Book appointments and find top pros in your area.</p>
              </div>
            </button>
            <button
              onClick={() => {
                setUserType('provider');
                localStorage.setItem('skilxpress_pending_user_type', 'provider');
                setStep(2);
              }}
              className="flex items-center gap-4 p-6 rounded-3xl border-2 border-gray-100 hover:border-secondary-orange hover:bg-orange-50/50 transition-all group text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary-orange text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-secondary-black">I want to offer services</h3>
                <p className="text-sm text-gray-500 font-medium">Showcase your skills and grow your business today.</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'signup' && step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-secondary-orange focus:outline-none transition-all font-medium appearance-none"
              >
                <option value="">What is your main skill?</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Short Bio</label>
              <textarea
                rows={3}
                placeholder="Tell clients what makes you special..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-secondary-orange focus:outline-none transition-all font-medium resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Location</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g. Lagos, Nigeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-secondary-orange focus:outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative group">
                <input
                  type="tel"
                  placeholder="e.g. +234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-secondary-orange focus:outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                disabled={onboardingLoading}
                onClick={() => handleOnboardingComplete(true)}
                className="py-4 rounded-xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                type="button"
                disabled={onboardingLoading}
                onClick={() => handleOnboardingComplete(false)}
                className="py-4 rounded-xl font-bold bg-secondary-orange text-white hover:bg-secondary-orange/90 transition-all shadow-lg shadow-secondary-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {onboardingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete!'}
              </button>
            </div>
          </div>
        )}

        {(mode === 'signin' || mode === 'forgot-password' || (mode === 'signup' && step === 2)) && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-secondary-black">Create {userType === 'provider' ? 'Provider' : 'Client'} Account</h2>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
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
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.fullName ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-secondary-black'}`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {fieldErrors.fullName && <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.fullName}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
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
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-secondary-black'}`}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {fieldErrors.email && <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.email}</p>}
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                    className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.password ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-secondary-black'}`}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.password}</p>}

                {mode === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password strength</span>
                      <span className={`text-xs font-medium ${passwordValidation.strength === 'weak' ? 'text-red-600' : passwordValidation.strength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordValidation.strength)}`} style={{ width: `${passwordStrengthPercentage}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
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
                      className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-xl focus:bg-white focus:outline-none focus:ring-0 transition-all font-medium ${fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-transparent focus:border-secondary-black'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <p className="mt-1.5 text-sm text-red-500 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span>{fieldErrors.confirmPassword}</p>}
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-4 h-4 text-secondary-orange border-gray-300 rounded focus:ring-secondary-orange" />
                  <label htmlFor="terms" className="text-sm text-gray-600">I agree to the <a href="#" className="text-secondary-orange hover:underline font-bold">Terms</a> and <a href="#" className="text-secondary-orange hover:underline font-bold">Privacy Policy</a></label>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary-black text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary-black/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : mode === 'forgot-password' ? 'Send Reset Link' : 'Continue'}
            </button>

            {mode !== 'forgot-password' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 font-medium">Or continue with</span></div>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-secondary-black active:scale-[0.98]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-center">
                <button type="button" onClick={() => setMode('forgot-password')} className="text-sm font-bold text-gray-400 hover:text-secondary-orange transition-colors">Forgot password?</button>
              </div>
            )}
          </form>
        )}

        {/* Toggle Mode */}

        {mode !== 'forgot-password' && (
          null
        )}
      </div>
    </div >
  );
}

