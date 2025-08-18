"use client";

import Link from 'next/link';
import { UserPlusIcon, PencilSquareIcon, StarIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Silk from '@/components/Silk';

export default function WriteHereLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Silk animated background */}
      <Silk className="absolute inset-0 -z-20 pointer-events-none" speed={4} scale={1.0} color="#FFFFFF" noiseIntensity={1.2} rotation={0.0} />
      {/* Custom overlay color over Silk */}
      <div className="absolute inset-0 -z-10 bg-[#ffffffd6] pointer-events-none" />

      <main className="w-full max-w-4xl rounded-none p-12 flex flex-col items-center gap-8 justify-center flex-shrink-0">

        <h1 className="text-5xl font-bold text-center mt-4 mb-2 text-black">
          لێرە <span className="text-[var(--primary)]">بنووسە</span>
        </h1>
        <p className="text-black text-center mb-4">
          بۆ بەشداریکردن لە بنووسە، تکایە هەژمارێک دروست بکە. دواتر دەتوانیت بڵاوکراوەیەک، هەڵسەنگاندنێک یان کتێبێک بنووسی.
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Link href="/write-here" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50/90 backdrop-blur-sm text-blue-900 font-semibold border border-black/10 hover:border-black/20 transition-colors duration-200 text-lg">
            <PencilSquareIcon className="h-6 w-6" />
            بڵاوکراوەیەک بنووسە
          </Link>
          <Link href="/write-review" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-50/90 backdrop-blur-sm text-yellow-900 font-semibold border border-black/10 hover:border-black/20 transition-colors duration-200 text-lg">
            <StarIcon className="h-6 w-6" />
            هەڵسەنگاندنێک بنووسە
          </Link>
          <Link href="/kteb-nus/new" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-50/90 backdrop-blur-sm text-green-900 font-semibold border border-black/10 hover:border-black/20 transition-colors duration-200 text-lg">
            <BookOpenIcon className="h-6 w-6" />
            کتێبێک بنووسە
          </Link>
        </div>
      </main>
    </div>
  );
}
