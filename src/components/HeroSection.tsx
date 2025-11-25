'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';
import { useEffect, useState, useMemo } from 'react';
import Iridescence from './LiquidChrome';
import RotatingText from './RotatingText';
import api from '@/utils/api';

const HeroSection = () => {
  const { reduceMotion } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  type Slide = { type: 'image' | 'video'; url: string; title?: string; link?: string };
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isTouching, setIsTouching] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const swipeThreshold = 40;
  const [isDragging, setIsDragging] = useState(false);
  

  const goTo = (nextIndex: number) => {
    if (nextIndex === currentSlide) return;
    setCurrentSlide(nextIndex);
  };
  
  useEffect(() => {
    // Trigger the animation after component mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load slides from backend (public endpoint)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/slider', {}, { useCache: true });
        if (!cancelled && res?.success && Array.isArray(res.items)) {
          const arr: Slide[] = res.items.map((it: any) => ({
            type: it.type === 'video' ? 'video' : 'image',
            url: String(it.url || ''),
            title: typeof it.title === 'string' ? it.title : '',
            link: typeof it.link === 'string' ? it.link : ''
          }));
          setSlides(arr);
          setCurrentSlide(0);
        }
      } catch (_) {
        // keep silent; fallback to no slides
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  
  useEffect(() => {
    if (isTouching || isDragging) return;
    const len = slides.length || 0;
    if (len <= 1) return; // no autoplay if 0 or 1 slide
    const id = setInterval(() => {
      // reverse direction autoplay (go to previous)
      goTo((currentSlide - 1 + len) % len);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length, isTouching, isDragging, currentSlide]);

  
  
  const animationClass = reduceMotion ? '' : 'transition-all duration-700 ease-out';
  const memoizedBackground = useMemo(() => (
    <>
      {/* Iridescence Background */}
      <Iridescence
        color={[1, 1, 1]}
        speed={1.3}
        amplitude={0.1}
        mouseReact={true}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
      />
      
      {/* White Overlay */}
      <div 
        className="absolute inset-0"
        style={{ zIndex: 0, background: 'rgba(255,255,255,0.47)' }}
      />
    </>
  ), []);
  
  return (
    <section className="relative py-28 overflow-hidden hero-rabar21">
      <style>{`
        html[dir="rtl"] .hero-rabar21, .hero-rabar21 {
          font-family: 'Rabar 021', sans-serif !important;
        }
      `}</style>
      {memoizedBackground}
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`flex flex-col space-y-6 ${animationClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-relaxed text-gray-800">
                 یەکەمین پلاتفۆرمی   
               <span className="whitespace-nowrap inline-flex items-baseline gap-2 align-baseline ms-3">
                 <RotatingText
                  texts={[" نووسینەوەی"," خوێندنەوەی"," نووسەرانی"," بڵاوکەرەوەی"]}
                  mainClassName="inline-block rounded-md bg-[var(--primary)] text-white px-1.5 py-0 align-baseline text-[0.8em]"
                  rotationInterval={2200}
                  staggerDuration={0.015}
                  splitBy="characters"
                 />
                 <span>کوردی</span>
               </span>
            </h1>
            <p className="text-lg text-gray-700 max-w-lg">
              <span className="text-[var(--primary)]">بنووسە</span>، دەنگی ژیری کوردییە. لێرەدا وتار، هەڵسەنگاندن و کتێبەکانت بە زمانی کوردی بڵاو بکەوە و بخوێنەوە، <span className="text-[var(--primary)]"> لێرەدا نووسەران و خوێنەران بەیەکتری دەگەن</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/publishes" className="btn btn-primary px-8 py-3 text-center">
                بڵاوکراوەکان
              </Link>
              <Link href="/write-here-landing" className="btn btn-outline px-8 py-3 text-center">
                دەستبکە بە نووسین
              </Link>
            </div>
           
          </div>
          <div className={`flex flex-col items-center ${animationClass} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '250ms' }}>
            <div 
              className={`relative w-full max-w-[500px] aspect-[10/9] rounded-lg overflow-hidden mx-auto select-none`}
              onTouchStart={(e) => {
                if (e.touches && e.touches.length > 0) {
                  setIsTouching(true);
                  setStartX(e.touches[0].clientX);
                }
              }}
              onTouchMove={(e) => {
                if (!isTouching || startX === null) return;
                // Prevent default to reduce scroll while swiping
                if (e.cancelable) e.preventDefault();
              }}
              onTouchEnd={(e) => {
                if (!isTouching || startX === null) {
                  setIsTouching(false);
                  setStartX(null);
                  return;
                }
                const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : startX;
                const deltaX = endX - startX;
                if (Math.abs(deltaX) > swipeThreshold) {
                  const len = slides.length || 0;
                  if (len === 0) return;
                  if (deltaX < 0) {
                    // reversed: swipe left goes to previous
                    goTo((currentSlide - 1 + len) % len);
                  } else {
                    // reversed: swipe right goes to next
                    goTo((currentSlide + 1) % len);
                  }
                }
                setIsTouching(false);
                setStartX(null);
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setStartX(e.clientX);
              }}
              onMouseMove={(e) => {
                if (!isDragging || startX === null) return;
                e.preventDefault();
              }}
              onMouseUp={(e) => {
                if (!isDragging || startX === null) {
                  setIsDragging(false);
                  setStartX(null);
                  return;
                }
                const endX = e.clientX;
                const deltaX = endX - startX;
                if (Math.abs(deltaX) > swipeThreshold) {
                  const len = slides.length || 0;
                  if (len === 0) return;
                  if (deltaX < 0) {
                    // reversed: drag left goes to previous
                    goTo((currentSlide - 1 + len) % len);
                  } else {
                    // reversed: drag right goes to next
                    goTo((currentSlide + 1) % len);
                  }
                }
                setIsDragging(false);
                setStartX(null);
              }}
              onMouseLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setStartX(null);
                }
              }}
            >
              {/* Slide content */}
              {slides.length > 0 ? (
                slides[currentSlide]?.type === 'video' ? (
                  <iframe
                    src={slides[currentSlide]?.url}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <Image
                    src={slides[currentSlide]?.url || '/images/img/banner.png'}
                    alt={slides[currentSlide]?.title || 'slide'}
                    fill
                    draggable={false}
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                    sizes="(max-width: 768px) 90vw, 500px"
                    priority
                    quality={100}
                  />
                )
              ) : (
                <Image
                  src={'/images/img/banner.png'}
                  alt="slide"
                  fill
                  draggable={false}
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  sizes="(max-width: 768px) 90vw, 500px"
                  priority
                  quality={100}
                />
              )}

              {/* Top-right minimal link */}
              {slides.length > 0 && slides[currentSlide]?.link ? (
                <a
                  href={slides[currentSlide]!.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200 hover:bg-white"
                >
                  <span className="truncate max-w-[180px]">{new URL(slides[currentSlide]!.link!).hostname.replace('www.','')}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6h8M18 6v8"/></svg>
                </a>
              ) : null}
            </div>
            <div className="flex items-center justify-between mt-2 w-full max-w-[500px] px-1">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => { const len = slides.length || 0; if (len>0) goTo((currentSlide - 1 + len) % len); }}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => { const len = slides.length || 0; if (len>0) goTo((currentSlide + 1) % len); }}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>
            <div className={`flex items-center justify-center gap-2 mt-3`}>
              {(slides.length>0 ? slides : new Array(1).fill(null)).map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className={`h-2 w-2 rounded-full transition-all duration-500 ease-out ${currentSlide === idx ? 'bg-[var(--primary)] w-5 scale-125 shadow-[0_0_0_3px_rgba(0,0,0,0.08)]' : 'bg-gray-300 opacity-70'}`}
                />
              ))}
            </div>
            {/* Title under the slide */}
            {slides.length > 0 && (slides[currentSlide]?.title || '').trim() !== '' && (
              <div className="mt-4 text-base font-semibold text-gray-800 text-center max-w-[500px] whitespace-normal break-words px-2">
                {slides[currentSlide]!.title}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Bottom Gradient to Gray-50 (restored/stronger) */}
      <div
        className="absolute left-0 right-0 bottom-0 h-32 pointer-events-none z-20"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, var(--color-gray-50) 70%, var(--color-gray-50) 100%)'
        }}
      />
    </section>
  );
};

export default HeroSection;
 