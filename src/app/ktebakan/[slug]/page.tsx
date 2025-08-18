'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import sanitizeHtml from '@/utils/sanitizeHtml';

interface Book {
  _id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  coverImage: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
}

export default function PublicBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    fetchPublishedBook();
  }, [slug]);

  const fetchPublishedBook = async () => {
    try {
      const response = await fetch(`/api/ktebakan/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setBook(null);
        } else {
          throw new Error('Failed to fetch book');
        }
        return;
      }

      const data = await response.json();
      setBook(data.book);
      setChapters(data.chapters);
      
      // Select first chapter by default
      if (data.chapters.length > 0) {
        setSelectedChapter(data.chapters[0]);
      }
    } catch (error) {
      console.error('Error fetching published book:', error);
      setBook(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <p className="text-gray-600 mb-6">
            The book you're looking for doesn't exist or hasn't been published yet.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-6">
            {book.coverImage && (
              <img 
                src={book.coverImage} 
                alt={book.title}
                className="w-32 h-44 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{book.description}</p>
              <div className="flex gap-6 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {book.genre}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {book.status}
                </span>
                <span>
                  Published: {new Date(book.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Chapters Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Chapters ({chapters.length})
            </h2>
            
            {chapters.length === 0 ? (
              <p className="text-gray-500">No chapters available</p>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter._id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedChapter?._id === chapter._id
                        ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">
                      Chapter {index + 1}
                    </div>
                    <div className="text-sm opacity-75 line-clamp-1">
                      {chapter.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter Content */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-8">
            {selectedChapter ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedChapter.title}
                  </h2>
                  <div className="text-sm text-gray-500">
                    Chapter {chapters.findIndex(ch => ch._id === selectedChapter._id) + 1} of {chapters.length}
                  </div>
                </div>
                
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedChapter.content) }}
                />

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      const currentIndex = chapters.findIndex(ch => ch._id === selectedChapter._id);
                      if (currentIndex > 0) {
                        setSelectedChapter(chapters[currentIndex - 1]);
                      }
                    }}
                    disabled={chapters.findIndex(ch => ch._id === selectedChapter._id) === 0}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous Chapter
                  </button>
                  
                  <span className="text-gray-500">
                    {chapters.findIndex(ch => ch._id === selectedChapter._id) + 1} / {chapters.length}
                  </span>
                  
                  <button
                    onClick={() => {
                      const currentIndex = chapters.findIndex(ch => ch._id === selectedChapter._id);
                      if (currentIndex < chapters.length - 1) {
                        setSelectedChapter(chapters[currentIndex + 1]);
                      }
                    }}
                    disabled={chapters.findIndex(ch => ch._id === selectedChapter._id) === chapters.length - 1}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Chapter →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Chapter
                </h3>
                <p className="text-gray-600">
                  Choose a chapter from the sidebar to start reading.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
