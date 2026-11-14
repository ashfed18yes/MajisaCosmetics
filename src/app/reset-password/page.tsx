'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Check for existing session (e.g. established by /auth/callback)
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!isMounted) return;
      if (session && !sessionError) {
        setHasValidSession(true);
        setIsVerifyingSession(false);
      }
    });

    // 2. Listen to auth state changes (handles hash fragments like #access_token=...&type=recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION'))) {
        setHasValidSession(true);
        setIsVerifyingSession(false);
      }
    });

    // Timeout fallback: if no session detected after 3.5 seconds
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsVerifyingSession(false);
      }
    }, 3500);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Your password has been successfully updated! Redirecting...');

      // Redirect user to account or sign-in with verified state
      setTimeout(() => {
        window.location.href = '/account';
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while resetting your password.';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-md bg-white rounded-[18px] sm:rounded-[20px] p-5 sm:p-6 border border-[#D4E5E3] shadow-card space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDF3F2] text-[#128F92] text-[11px] uppercase tracking-wider font-bold">
            <Sparkles className="w-3 h-3 text-[#128F92]" />
            <span>Secure Password Reset</span>
          </span>
          <h1 className="font-serif text-xl sm:text-2xl text-[#0B4145] font-bold">
            Create New Password
          </h1>
          <p className="text-xs text-[#687F8D]">
            Please enter and confirm your new secure password.
          </p>
        </div>

        {/* Loading state while checking session token */}
        {isVerifyingSession && (
          <div className="py-8 text-center space-y-2">
            <div className="w-7 h-7 mx-auto rounded-full border-2 border-[#128F92] border-t-transparent animate-spin" />
            <p className="text-xs text-[#687F8D]">Verifying your password reset authorization...</p>
          </div>
        )}

        {/* Invalid or expired session alert */}
        {!isVerifyingSession && !hasValidSession && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Reset Link Invalid or Expired</span>
            </div>
            <p className="leading-relaxed">
              This password recovery link has either expired, already been used, or is invalid. Please request a new password recovery link.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#128F92] hover:bg-[#0B4145] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <span>Request New Reset Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-[#DDF3F2] border border-[#128F92]/30 text-xs text-[#0B4145] font-semibold flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#128F92] shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form (Only shown when session is verified) */}
        {!isVerifyingSession && hasValidSession && !successMessage && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
                New Password (8+ characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#687F8D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-[#F0F9F8] border border-[#DDF3F2] rounded-lg text-xs sm:text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687F8D] hover:text-[#0B4145]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#687F8D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-[#F0F9F8] border border-[#DDF3F2] rounded-lg text-xs sm:text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[40px] sm:h-[42px] rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-widest font-bold transition-all shadow-cta flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-2 border-t border-[#DDF3F2] text-center">
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-[#128F92] hover:text-[#0B4145] transition-colors"
          >
            Remember your credentials? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#128F92] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

