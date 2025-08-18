'use client';

import Image from 'next/image';

interface ReviewCardProps {
  poster: string;
  title: string;
  genre: string;
  rating: number;
  year: number;
  description: string;
  recommended: boolean;
  author: {
    name: string;
    profileImage?: string;
  };
}

const isBackblazeUrl = (url: string | undefined) => {
  if (!url) return false;
  return url.startsWith('https://') && !url.includes('/images/');
};

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const ReviewCard = ({ poster, title, genre, rating, year, description, recommended, author }: ReviewCardProps) => {
  return (
    <div className="flex bg-white rounded-2xl max-w-xl w-full mx-auto border border-gray-100 relative overflow-visible min-w-[390px] max-[400px]:min-w-0 flex-row-reverse min-h-[260px] max-[400px]:min-h-0">
      {/* Poster + Author */}
      <div className="flex flex-col items-end absolute -top-4 right-4 z-10 w-32 max-[400px]:w-20 max-[400px]:top-2 max-[400px]:right-2" style={{ marginBottom: '-1rem' }}>
        <div className="relative w-full h-48 max-[400px]:h-28">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover rounded-2xl shadow-lg"
            sizes="(max-width: 400px) 80vw, 20vw"
          />
        </div>
        <div className="mt-6 flex flex-row-reverse items-center w-full gap-2 justify-end">
          <span 
            className="text-gray-700 text-xs min-[401px]:text-[13px] font-medium truncate block max-w-[70px] min-[401px]:max-w-[90px] text-left ltr" 
            dir="ltr"
            title={author?.name}
          >
            {truncateText(author?.name || '', 12)}
          </span>
          <div className="w-8 h-8 min-[401px]:w-9 min-[401px]:h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 relative mr-[11px]">
            {author?.profileImage && isBackblazeUrl(author.profileImage) ? (
              <Image
                src={author.profileImage}
                alt={author.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : author?.profileImage ? (
              <img src={author.profileImage} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">{author?.name?.substring(0, 1) || '?'}</span>
            )}
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="flex flex-col justify-between p-6 flex-1 min-w-0 pr-40 max-[400px]:pr-24">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-xl font-bold text-gray-900 truncate text-left ltr max-[400px]:text-base" 
              dir="ltr"
              title={title}
            >
              {truncateText(title, 30)}
            </h3>
            <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-lg ml-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
              </svg>
              {rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <span 
              className="text-[var(--primary)] text-sm font-medium max-[400px]:text-xs truncate"
              title={genre}
            >
              {truncateText(genre, 15)}
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-700 text-sm font-bold max-[400px]:text-xs">{year}</span>
          </div>
          <p 
            className="text-gray-600 text-sm mt-2 line-clamp-2 max-[400px]:text-xs"
            title={description}
          >
            {description}
          </p>
          {recommended ? (
            <span className="block mt-2 bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full text-xs w-fit">پێشنیارکراوە</span>
          ) : (
            <span className="block mt-2 bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full text-xs w-fit">پێشنیار ناکرێت</span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between flex-row-reverse gap-3">
          <span className="text-[var(--primary)] text-xs min-[401px]:text-[13px] font-semibold px-3 min-[401px]:px-[14px] py-1 min-[401px]:py-[6px] rounded bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 transition-colors cursor-pointer" style={{ minWidth: 60 }}>
            زیاتر بخوێنەوە
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard; 