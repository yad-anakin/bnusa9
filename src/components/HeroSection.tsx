'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const HeroSection = () => {
  // Minimal slider state
  const slides = [
    '/images/banner.png.jpg',
    '/images/banner.png.jpg',
    '/images/banner.png.jpg',
    '/images/banner.png.jpg',
    '/images/banner.png.jpg'
  ];
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % slides.length);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  // Optional: simple auto-play (10s). Comment out if not desired.
  useEffect(() => {
    const t = setInterval(next, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" aria-label="Hero Slider">
      {/* 1280x720 design: max width 1280px, maintain 16:9, fully responsive without upscaling */}
      <div className="flex w-full justify-center">
        <div className="relative w-full max-w-[1280px] h-[46vh] sm:h-[44vh] md:h-[42vh] lg:max-h-[500px] xl:max-h-[500px] 2xl:max-h-[500px]">
          {slides.map((src, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={src}
                alt={`slide-${idx + 1}`}
                fill
                priority={idx === 0}
                sizes="(max-width: 1280px) 100vw, 1280px"
                quality={90}
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
          {/* Arrow Controls - only visible on large screens */}
          <button
            type="button"
            onClick={prev}
            className="hidden min-[925px]:block absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 text-white p-2 hover:bg-black/60 focus:outline-none"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="hidden min-[925px]:block absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 text-white p-2 hover:bg-black/60 focus:outline-none"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${idx === current ? 'bg-white' : 'bg-white/50 hover:bg-white/70'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;