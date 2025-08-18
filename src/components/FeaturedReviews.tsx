'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/utils/themeContext';
import ReviewCard from './ReviewCard';

interface Author {
  name: string;
  username?: string;
  profileImage?: string;
  isWriter?: boolean;
}

interface Review {
  _id: string;
  id?: number;
  title: string;
  description: string;
  author: Author;
  slug: string;
  categories: string[];
  status?: string;
  coverImage?: string;
  rating?: number;
  year?: number;
  recommended?: boolean;
  genre?: string;
}

interface FeaturedReviewsProps {
  reviews: Review[];
  loading: boolean;
}

const FeaturedReviews: React.FC<FeaturedReviewsProps> = ({ reviews, loading }) => {
  const { reduceMotion } = useTheme();
  const reviewsToShow = 3;
  const displayedReviews = reviews.slice(0, reviewsToShow);
  const animationClass = reduceMotion ? '' : 'transition-all duration-500 ease-out';

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">نوێترین هەڵسەنگاندنەکان</h2>
          <div className="flex justify-center items-center h-40">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (displayedReviews.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">نوێترین هەڵسەنگاندنەکان</h2>
            <Link href="/reviews" className="text-[var(--primary)] hover:underline">
              هەمووی ببینە
            </Link>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-[var(--grey-dark)]">هیچ هەڵسەنگاندنێک نەدۆزرایەوە.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">نوێترین هەڵسەنگاندنەکان</h2>
          <Link href="/reviews" className="text-[var(--primary)] hover:underline flex items-center">
            هەمووی ببینە
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="w-full flex justify-center">
          <div
            className="grid justify-center gap-4 sm:gap-6 reviews-responsive-grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', maxWidth: '1200px', width: '100%' }}
          >
            {displayedReviews.map((review, index) => (
              <div
                key={review._id}
                className={`${animationClass} ${reduceMotion ? '' : 'opacity-0 translate-y-4'} flex justify-center`}
                style={{ animation: reduceMotion ? 'none' : `fadeInUp 0.5s ease-out ${index * 0.1 + 0.2}s forwards` }}
              >
                <Link href={`/reviews/${review.id}`} className="block w-full group" style={{ textDecoration: 'none' }}>
                  <div className="transition-transform duration-200 group-hover:scale-105">
                    <ReviewCard
                      poster={review.coverImage || '/images/placeholders/article-primary.png'}
                      title={review.title}
                      genre={review.genre || (review.categories && review.categories[0]) || ''}
                      rating={typeof review.rating === 'number' ? review.rating : 0}
                      year={typeof review.year === 'number' ? review.year : 0}
                      description={review.description}
                      recommended={typeof review.recommended === 'boolean' ? review.recommended : false}
                      author={review.author}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 380px) {
          .reviews-responsive-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedReviews;
