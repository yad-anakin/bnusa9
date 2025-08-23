'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignInForm from '../../components/auth/SignInForm';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import FaultyTerminal from '@/components/FaultyTerminal';

export default function SignInPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  // Track viewport >= 600px for responsive FaultyTerminal props
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 600px)');
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Don't render anything if still checking auth or if user is logged in
  if (loading || currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="font-rabar">
      {/* Hero section (100vh) */}
      <section className="relative h-screen w-full overflow-hidden bg-[#04070b] -mt-24">
        <FaultyTerminal
          scale={isLarge ? 1.5 : 1}
          gridMul={isLarge ? [2, 1] : [1, 2]}
          digitSize={1.2}
          timeScale={isLarge ? 1 : 0.2}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#ffffff"
          mouseReact={true}
          mouseStrength={0.5}
          pageLoadAnimation={false}
          brightness={1}
        />
        {/* Soft overlay to improve contrast */}
        <div className="pointer-events-none absolute inset-0 bg-white/5" />

        {/* Foreground content */}
        <div className="relative z-10 h-full w-full flex items-center justify-center px-4 sm:px-8 pt-24">
          <div className="w-full max-w-md mx-auto bg-white/80 rounded-xl backdrop-blur-md p-6 sm:p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-[var(--primary)] flex items-center justify-center gap-2">
                <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                بەخێربێیتەوە
              </h1>
              <p className="text-[var(--grey-dark)] text-base">بۆ چوونە ژوورەوەی هەژمارەکەت، زانیارییەکانت بنووسە</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </section>

      {/* Footer is provided by the global layout */}
    </div>
  );
}