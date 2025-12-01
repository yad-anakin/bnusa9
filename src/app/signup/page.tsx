'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignUpForm from '../../components/auth/SignUpForm';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import Iridescence from '@/components/Iridescence';

export default function SignUpPage() {
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
      <section className="relative h-screen w-full overflow-hidden bg-[#04070b] ">
         <Iridescence className="absolute inset-0  pointer-events-none" color={[1, 1, 1]} speed={1.2} amplitude={0.1} mouseReact={true} />
        {/* Soft overlay to improve contrast */}
        <div className="pointer-events-none absolute inset-0 bg-white/5" />

        {/* Foreground content */}
        <div className="relative z-10 h-full w-full flex items-center justify-center px-4 sm:px-8 pt-24">
          <div className="w-full max-w-md mx-auto bg-white/80 rounded-xl backdrop-blur-md p-6 sm:p-8 ">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-[var(--primary)] flex items-center justify-center gap-2">
                <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                بەشداربە لە بنووسە
              </h1>
              <p className="text-[var(--grey-dark)] text-base">هەژمارێک دروست بکە بۆ دەستپێکردن</p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </section>

      {/* Footer is provided by the global layout */}
    </div>
  );
}