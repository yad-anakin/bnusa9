'use client';

import React from 'react';
import { useTheme } from '@/utils/themeContext';

const categories = [
  { 
    id: 'science', 
    name: 'زانست', 
    icon: '/images/icons/science.svg',
    color: 'bg-blue-100 text-blue-800',
    description: 'وتار لەسەر زانست و تەکنەلۆژیا و داهێنانە نوێیەکان'
  },
  { 
    id: 'history', 
    name: 'مێژوو', 
    icon: '/images/icons/history.svg',
    color: 'bg-amber-100 text-amber-800',
    description: 'گەشتێک بە مێژووی کوردستان و جیهاندا'
  },
  { 
    id: 'art', 
    name: 'هونەر', 
    icon: '/images/icons/art.svg',
    color: 'bg-pink-100 text-pink-800',
    description: 'دەربارەی هونەر و ئەدەب و مۆسیقا'
  },
  { 
    id: 'tech', 
    name: 'تەکنەلۆژیا', 
    icon: '/images/icons/tech.svg',
    color: 'bg-purple-100 text-purple-800',
    description: 'نوێترین گەشەپێدانەکان لە بواری تەکنەلۆژیادا'
  },
  { 
    id: 'literature', 
    name: 'ئەدەب', 
    icon: '/images/icons/literature.svg',
    color: 'bg-green-100 text-green-800',
    description: 'شیعر، چیرۆک و ڕۆمان بە زمانی کوردی'
  },
  { 
    id: 'tourism', 
    name: 'گەشتیاری', 
    icon: '/images/icons/tourism.svg',
    color: 'bg-teal-100 text-teal-800',
    description: 'شوێنە گەشتیارییەکانی کوردستان و جیهان'
  },
];

const CategorySection = () => {
  const { reduceMotion } = useTheme();
  const animationClass = reduceMotion ? '' : 'transition-all duration-500 ease-out';

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">بابەتەکان</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`${category.color} rounded-lg p-6 ${animationClass}`}
              style={{ 
                animation: reduceMotion ? 'none' : `fadeIn 0.5s ease-out ${index * 0.1 + 0.2}s forwards`,
                opacity: reduceMotion ? 1 : 0
              }}
            >
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                <p className="mb-4 opacity-80">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};

export default CategorySection; 