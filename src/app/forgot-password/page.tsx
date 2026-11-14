'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [error, setError] = useState(urlError ? decodeURIComponent(urlError) : '');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (resetError) {
        // Provide friendly message if rate limited or invalid
        if (resetError.message.includes('rate limit') || resetError.status === 429) {
          setError('Too many requests. Please wait a few minutes before trying again.');
        } else {
          setError(resetError.message || 'Failed to send password reset email.');
        }
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        `Password reset instructions have been sent to ${email.trim()}. Please check your email inbox (and spam folder) and click the link to reset your password.`
      );
      setEmail('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while sending the reset link.';
      setError(message);
    } finally {
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
            <span>Account Recovery</span>
          </span>
          <h1 className="font-serif text-xl sm:text-2xl text-[#0B4145] font-bold">
            Reset Your Password
          </h1>
          <p className="text-xs text-[#687F8D]">
            Enter your registered email address and we will send you a secure link to reset your password.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-[#DDF3F2] border border-[#128F92]/30 text-xs text-[#0B4145] font-semibold flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#128F92] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        {!successMessage ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#102F32] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#687F8D] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F0F9F8] border border-[#DDF3F2] rounded-lg text-xs sm:text-sm text-[#102F32] placeholder-[#687F8D]/60 focus:outline-none focus:border-[#128F92] transition-colors font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[40px] sm:h-[42px] rounded-full bg-[#128F92] hover:bg-[#0B4145] text-white text-xs uppercase tracking-widest font-bold transition-all shadow-cta flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Sending Reset Link...</span>
              ) : (
                <>
                  <span>Send Recovery Link</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setSuccessMessage('');
                setError('');
              }}
              className="text-xs text-[#128F92] hover:text-[#0B4145] font-semibold underline"
            >
              Did not receive the email? Try again
            </button>
          </div>
        )}

        {/* Footer Link */}
        <div className="pt-2 border-t border-[#DDF3F2] text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128F92] hover:text-[#0B4145] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#128F92] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

