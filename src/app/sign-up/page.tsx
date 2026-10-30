'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept our terms of service to proceed.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const emailRedirectTo = `${origin}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
          },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Check if user already exists (Supabase returns empty identities array when email confirmation & enumeration protection are on)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email address already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // If email confirmation is disabled in Supabase, a session is created immediately
      if (data.session) {
        router.push('/account');
        router.refresh();
        return;
      }

      // Email confirmation required flow
      setSuccessMessage(
        'Your royal account has been created! Please check your email inbox to verify your account before signing in.'
      );
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeTerms(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-[22px] sm:rounded-[24px] p-6 sm:p-8 border border-[#D4E5E3] shadow-card space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-xs uppercase tracking-wider font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#128F92]" />
            <span>Join the Circle</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#0B4145] font-bold">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-[#687F8D]">
            Enjoy personalized shade consultations, order tracking, and 10% off your initial order.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-[#DDF3F2] border border-[#128F92]/30 text-xs sm:text-sm text-[#0B4145] font-semibold flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#128F92] shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#687F8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Princess Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#687F8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
              Password (8+ characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#687F8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#687F8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F0F9F8] border border-[#DDF3F2] rounded-xl text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-0.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-[#DDF3F2] text-[#128F92] focus:ring-[#128F92]"
            />
            <label htmlFor="terms" className="text-xs text-[#687F8D] leading-relaxed">
              I agree to the Majisa Cosmetics Privacy Policy, client terms, and consent to receive curated product updates.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[46px] sm:h-[48px] rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs sm:text-sm uppercase tracking-widest font-bold transition-all shadow-cta flex items-center justify-center gap-2 group disabled:opacity-60"
          >
            {isLoading ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Create Royal Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#DDF3F2] flex items-center justify-center gap-1.5 text-xs text-[#687F8D]">
          <ShieldCheck className="w-4 h-4 text-[#128F92]" />
          <span>Your personal information is encrypted & safeguarded.</span>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs sm:text-sm text-[#687F8D]">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-bold text-[#128F92] underline hover:text-[#0B4145]">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
