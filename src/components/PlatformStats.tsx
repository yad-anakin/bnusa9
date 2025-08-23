'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/utils/themeContext';
import { useInView } from 'react-intersection-observer';
import api from '@/utils/api';

type PlatformStatsProps = {
  bookCount?: number; // kept for backward-compat; not used in display
};

// Stats interface
interface PlatformStatsData {
  staff: number;
  articles: number;
  reviews: number;
  ktebs: number;
}

const PlatformStats = ({ bookCount = 0 }: PlatformStatsProps) => {
  const { reduceMotion } = useTheme();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  // State for real statistics
  const [statsData, setStatsData] = useState<PlatformStatsData>({
    staff: 0,
    articles: 0,
    reviews: 0,
    ktebs: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Use centralized API client hitting backend /api/stats
        const data = await api.get('/api/stats');
        
        if (data.success && data.stats) {
          setStatsData({
            staff: data.stats.staff ?? 0,
            articles: data.stats.articles ?? 0,
            reviews: data.stats.reviews ?? 0,
            ktebs: data.stats.ktebs ?? 0,
          });
        }
      } catch (error) {
        console.error('Error fetching platform statistics:', error);
        // Use default values in case of error
        setStatsData({
          staff: 0,
          articles: 0,
          reviews: 0,
          ktebs: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Stats to display
  const stats = [
    {
      id: 'staff',
      value: statsData.staff || 0,
      label: 'ستاف',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V10H2v10h5m10 0V8a5 5 0 10-10 0v12m10 0H7" />
        </svg>
      )
    },
    {
      id: 'articles',
      value: statsData.articles || 0,
      label: 'بڵاوکراوە',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'reviews',
      value: statsData.reviews || 0,
      label: 'هەڵسەنگاندن',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-4-4m0 0l4-4m-4 4h14" />
        </svg>
      )
    },
    {
      id: 'ktebs',
      value: statsData.ktebs || 0,
      label: 'کتێبنوس',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ];

  // Custom hook for animated counter
  const useCounter = (end: number, start = 0, duration = 2000) => {
    const [count, setCount] = useState(start);
    const countRef = useRef(start);
    const timeRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (inView && !reduceMotion) {
        const startTime = Date.now();
        const endValue = end;
        
        if (timeRef.current) clearInterval(timeRef.current);
        
        timeRef.current = setInterval(() => {
          const now = Date.now();
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          countRef.current = Math.floor(progress * (endValue - start) + start);
          setCount(countRef.current);
          
          if (progress === 1) {
            if (timeRef.current) clearInterval(timeRef.current);
          }
        }, 16);
        
        return () => {
          if (timeRef.current) clearInterval(timeRef.current);
        };
      } else {
        // If reduceMotion is true, just set the end value
        setCount(end);
      }
    }, [end, start, duration, inView, reduceMotion]);

    return count;
  };

  // Pre-calculate all counter values
  const staffCounter = useCounter(stats[0].value);
  const articleCounter = useCounter(stats[1].value);
  const reviewCounter = useCounter(stats[2].value);
  const ktebCounter = useCounter(stats[3].value);
  
  // Array of counter values to match stats array
  const counterValues = [staffCounter, articleCounter, reviewCounter, ktebCounter];

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-light)]/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-[var(--secondary-light)]/10 rounded-full filter blur-2xl"></div>
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-[var(--primary)]/5 rounded-full filter blur-xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">ئامارەکانی بنووسە</h2>
          <p className="text-lg text-[var(--grey-dark)] max-w-3xl mx-auto">
            بنووسە یەکەم و گەورەترین پلاتفۆرمی نووسینی کوردییە، بە بەشداری نووسەران و خوێنەران
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
        ) : (
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              return (
                <div 
                  key={stat.id}
                  className="bg-white rounded-lg p-8 text-center transition-all border-t-4 border-[var(--primary)]"
                  style={{ 
                    animation: !reduceMotion && inView ? `fadeInScale 0.5s ease-out ${index * 0.15}s forwards` : 'none',
                    opacity: (!reduceMotion && inView) ? 0 : 1,
                    transform: (!reduceMotion && inView) ? 'scale(0.9)' : 'scale(1)'
                  }}
                >
                  <div className="inline-flex items-center justify-center mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-[var(--primary)]">
                    {formatNumber(counterValues[index])}+
                  </div>
                  <p className="mt-2 text-[var(--grey-dark)] text-lg">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
};

export default PlatformStats; 