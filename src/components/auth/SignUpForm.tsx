"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogleAndSetCookie } from '@/lib/firebase';

const SignUpForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      await signInWithGoogleAndSetCookie();
      // Hard redirect to ensure cookie is present on first load of dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Google sign-up failed:', err);
      setErrorMessage(err?.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-right" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className={`w-full py-3 px-4 border border-[var(--grey-light)] rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-5 h-5" aria-hidden>
          <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.5-37.9-4.7-56H272v106h146.9c-6.3 34.4-25.7 63.5-54.6 83v68h88.3c51.7-47.6 81-117.8 81-201z"/>
          <path fill="#34A853" d="M272 544.3c73.8 0 135.6-24.5 180.7-66.5l-88.3-68c-24.5 16.5-56 26.2-92.4 26.2-71 0-131.2-47.9-152.8-112.1h-91v70.5C72.9 486 166.1 544.3 272 544.3z"/>
          <path fill="#FBBC05" d="M119.2 323.9c-10.1-30.1-10.1-62.6 0-92.7v-70.5h-91C-7.1 227.1-7.1 317.2 28.2 386.2l91-70.5z"/>
          <path fill="#EA4335" d="M272 107.7c39.9-.6 78.4 14.4 107.7 42.4l80.3-80.3C409.4 24.7 342.7-.3 272 0 166.1 0 72.9 58.3 28.2 158.4l91 70.5C140.8 143.7 201 95.7 272 95.7z"/>
        </svg>
        <span>{loading ? 'چاوەڕوانبە...' : 'دروستکردن/چوونەژوورەوە بە گووگڵ'}</span>
      </button>
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--grey-dark)]">
          هەژمارت هەیە؟{' '}
          <Link href="/signin" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium">
            چوونە ژوورەوە
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
 