'use client';

import React, { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturedArticles from '@/components/FeaturedArticles';
import FeaturedBooks from '@/components/FeaturedBooks';
import Testimonials from '@/components/Testimonials';
import api from '@/utils/api';
import FeaturedReviews from '@/components/FeaturedReviews';
import FeaturedKtebnusBooks from '@/components/FeaturedKtebnusBooks';

type Article = {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  categories: string[];
  views: number;
  readTime: number;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
  };
  likes: string[];
  comments: any[];
  slug: string;
  status?: string;
};

type Book = {
  _id: string;
  id?: string;
  title: string;
  writer: string;
  language: string;
  genre: string;
  year: number;
  image: string;
  rating: number;
  downloads: number;
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [ktebnusBooks, setKtebnusBooks] = useState<any[]>([]);
  const [loadingKtebnus, setLoadingKtebnus] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetch only the number of articles to display (3)
        const data = await api.get('/api/articles?limit=3');
        if (data.success) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };

    const fetchBooks = async () => {
      try {
        // Fetch latest books using the secure API utility
        const data = await api.get('/api/books?limit=6&sort=newest');
        
        if (data.success) {
          setBooks(data.books || []);
          setTotalBooks(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const data = await api.get('/api/reviews?limit=3');
        if (data.success) {
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    const fetchKtebnusBooks = async () => {
      try {
        const data = await api.get('/api/ktebnus/books?limit=6', {}, { useCache: true });
        if (data.success) {
          setKtebnusBooks(data.books || []);
        }
      } catch (error) {
        console.error('Error fetching Ktebnus books:', error);
      } finally {
        setLoadingKtebnus(false);
      }
    };

    fetchArticles();
    fetchReviews();
    fetchKtebnusBooks();
    fetchBooks();
  }, []);

  return (
    <main className="min-h-screen" style={{ fontFamily: "'Rabar 021', sans-serif" }}>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Featured Articles section */}
      <FeaturedArticles articles={articles} loading={loadingArticles} />

      {/* Featured Reviews section */}
      <FeaturedReviews reviews={reviews} loading={loadingReviews} />

      {/* Featured Ktebnus Books section */}
      <FeaturedKtebnusBooks books={ktebnusBooks} loading={loadingKtebnus} />
      
      {/* Featured Books section */}
      <FeaturedBooks books={books} loading={loadingBooks} totalBooks={totalBooks} />
      {/* Moved Platform Statistics and subsequent sections to /bnusa-stats */}
    </main>
  );
}
