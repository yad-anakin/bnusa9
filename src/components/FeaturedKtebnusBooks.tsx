'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';

interface KtebnusBook {
  _id: string;
  title: string;
  writer: string;
  genre: string;
  image: string;
  slug: string;
  views?: number;
}

interface FeaturedKtebnusBooksProps {
  books: KtebnusBook[];
  loading: boolean;
  total?: number;
}

const tGenre = (g: string | undefined) => {
  if (!g) return '';
  const key = g.toLowerCase();
  const map: Record<string, string> = {
    'fiction': 'ئەفسانەیی',
    'adventure': 'سەرکێشی',
    'romance': 'ڕۆمانسی',
    'mystery': 'نهێنی',
    'fantasy': 'خەیاڵی',
    'sci-fi': 'زانستی خەیاڵی',
    'science fiction': 'زانستی خەیاڵی',
    'horror': 'ترسناک',
    'thriller': 'هەستبزوێن',
    'historical': 'مێژوویی',
    'historical fiction': 'مێژوویی خەیاڵی',
    'biography': 'ژیاننامە',
    'poetry': 'ئەدەب/شیعر',
    'drama': 'دراما',
    'comedy': 'کۆمیدی',
    'non-fiction': 'واقیعی',
    'nonfiction': 'واقیعی',
    'contemporary': 'ئاینی',
    'self-help': 'خۆهاریکاری',
    'education': 'پەروەردە',
    'children': 'منداڵانه',
    'young adult': 'گەنجان',
    'new adult': 'نوێ-گەنجان',
    'crime': 'تاوان',
    'spiritual': 'روحانی',
    'philosophy': 'فەلسەفە',
    'technology': 'تەکنەلۆژی',
    'business': 'بازرگانی',
    'health': 'تەندروستی',
    'travel': 'گەشتوگوزار',
    'art': 'هونەری',
    'music': 'مۆسیقا',
    'sports': 'وەرزش',
    'cooking': 'خواردن',
    'politics': 'سیاسەت',
    'science': 'زانست',
    'religion': 'ئایین',
    'classic': 'کلاسیک',
    'history': 'مێژوو',
    'essay': 'وتار',
    'short story': 'چیرۆکی کورت',
    'short stories': 'چیرۆکی کورت',
    'action': 'ئاکشن',
    'literary fiction': 'ئەدەبی ئەفسانەیی',
    'other': 'ئەوانەی تر',
    'anthology': 'کۆبەند',
  };
  return map[key] || g;
};

const FeaturedKtebnusBooks: React.FC<FeaturedKtebnusBooksProps> = ({ books, loading }) => {
  const { reduceMotion } = useTheme();
  const booksToShow = 6;
  const displayed = books.slice(0, booksToShow);
  const animationClass = reduceMotion ? '' : 'transition-all duration-500 ease-out';

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">کتێبی نووسەرەکانمان</h2>
          <div className="flex justify-center items-center h-40">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (displayed.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">کتێبی نووسەرەکانمان</h2>
            <Link href="/ktebnus" className="text-[var(--primary)] hover:underline">هەمووی ببینە</Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-[var(--grey-dark)]">هیچ کتێبی نووسەرەکانمان نەدۆزرایەوە.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">کتێبی نووسەرەکانمان</h2>
          <Link href="/ktebnus" className="text-[var(--primary)] hover:underline flex items-center">
            هەمووی ببینە
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {displayed.map((book, index) => (
            <div
              key={book._id}
              className={`${animationClass} ${reduceMotion ? '' : 'opacity-0 translate-y-4'}`}
              style={{ animation: reduceMotion ? 'none' : `fadeInUp 0.5s ease-out ${index * 0.1 + 0.2}s forwards` }}
            >
              <Link href={`/ktebnus/${book.slug}`}>
                <div className="group relative bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-[var(--primary)]/50 transition-colors duration-300">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={book.image}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--primary)]">{tGenre(book.genre)}</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-xs text-gray-700 font-medium">{book.views ?? 0}</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium mb-1 truncate whitespace-nowrap overflow-hidden text-ellipsis rtl-ellipsis-end group-hover:text-[var(--primary)] transition-colors" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-700 line-clamp-1">
                      {book.writer}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default FeaturedKtebnusBooks;
