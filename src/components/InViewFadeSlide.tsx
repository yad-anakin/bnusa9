'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/utils/themeContext';
import useScrollDirection from '@/utils/useScrollDirection';

interface InViewFadeSlideProps {
  children: React.ReactNode;
  delay?: number; // seconds
  distance?: number; // px
  once?: boolean; // if true, animate only the first time it enters
  className?: string;
}

const InViewFadeSlide: React.FC<InViewFadeSlideProps> = ({
  children,
  delay = 0,
  distance = 20,
  once = false,
  className = '',
}) => {
  const { reduceMotion } = useTheme();
  const direction = useScrollDirection();
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    if (reduceMotion) {
      setInView(true);
      setHasAnimated(true);
      return;
    }

    // Hysteresis thresholds to avoid flicker
    const ENTER_RATIO = 0.2; // show when >= 20% visible
    const EXIT_RATIO = 0.05; // hide only when <= 5% visible

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          if (ratio >= ENTER_RATIO) {
            if (!inView) setInView(true);
            if (!hasAnimated) setHasAnimated(true);
          } else if (ratio <= EXIT_RATIO) {
            if (!once) setInView(false);
          }
        });
      },
      {
        // Trigger slightly before fully entering the viewport to smooth in
        rootMargin: '0px 0px -10% 0px',
        threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1],
      }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [once, reduceMotion, inView, hasAnimated]);

  // Compute transform origin based on scroll direction
  const initialTranslate = direction === 'down' ? distance : -distance;

  const style: React.CSSProperties = reduceMotion
    ? { opacity: 1, transform: 'none' }
    : {
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : `translateY(${initialTranslate}px)`,
        transition: `opacity 380ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 380ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: 'opacity, transform',
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default InViewFadeSlide;
