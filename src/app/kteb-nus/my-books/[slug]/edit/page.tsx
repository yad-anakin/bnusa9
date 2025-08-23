'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadBookCoverImage } from '@/utils/imageUpload';
import api from '@/utils/api';

interface Book {
  _id: string;
  title: string;
  description: string;
  genre: string;
  genres?: string[];
  status: string;
  coverImage: string;
  slug: string;
  isDraft: boolean;
  isPendingReview: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [book, setBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    status: 'ongoing',
    coverImage: ''
  });

  useEffect(() => {
    if (currentUser && slug) {
      fetchBook();
    }
  }, [currentUser, slug]);

  const getAuthToken = async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchBook = async () => {
    try {
      const data = await api.get(`/api/ktebnus/me/books/${slug}`);
      setBook(data.book);
      setFormData({
        title: data.book.title,
        description: data.book.description,
        genre: data.book.genre || '',
        status: data.book.status,
        coverImage: data.book.coverImage
      });
      setImagePreview(data.book.coverImage);
    } catch (error) {
      console.error('هەڵە لە هێنانی پەرتووک:', error);
      toast.error('بارکردنی زانیاری پەرتووک شکستی هێنا');
      router.push('/kteb-nus/drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Genre options (single select)
  const genreOptions: { value: string; label: string }[] = [
    { value: 'Fiction', label: 'ئەفسانەیی' },
    { value: 'Romance', label: 'ڕۆمانسی' },
    { value: 'Mystery', label: 'نهێنی' },
    { value: 'Thriller', label: 'هەستبزوێن' },
    { value: 'Fantasy', label: 'خەیاڵی' },
    { value: 'Science Fiction', label: 'زانستی خەیاڵی' },
    { value: 'Horror', label: 'ترسناک' },
    { value: 'Adventure', label: 'سەرکێشی' },
    { value: 'Historical Fiction', label: 'مێژوویی خەیاڵی' },
    { value: 'Contemporary', label: 'ئاینی' },
    { value: 'Young Adult', label: 'گەنجان' },
    { value: 'New Adult', label: 'نوێ-گەنجان' },
    { value: 'Literary Fiction', label: 'ئەدەبی ئەفسانەیی' },
    { value: 'Drama', label: 'دراما' },
    { value: 'Comedy', label: 'کۆمیدی' },
    { value: 'Action', label: 'ئاکشن' },
    { value: 'Biography', label: 'ژیاننامە' },
    { value: 'Non-Fiction', label: 'واقیعی' },
    { value: 'Poetry', label: 'ئەدەب/شیعر' },
    { value: 'Short Stories', label: 'چیرۆکی کورت' },
    { value: 'Other', label: 'ئەوانەی تر' }
  ];
  // Removed multi-genre logic for simpler UX per request

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('پەسندکردن پێویستە');
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload to Backblaze
      const imageUrl = await uploadBookCoverImage(file, token);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        coverImage: imageUrl
      }));

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      setImagePreview(imageUrl);
    } catch (error: any) {
      console.error('هەڵە لە بارکردنی وێنە:', error);
      toast.error(error.message || 'بارکردنی وێنە شکستی هێنا');
      // Clean up preview on error
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(book?.coverImage || '');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const primaryGenre = formData.genre;
    if (!formData.title.trim() || !formData.description.trim() || !primaryGenre) {
      toast.warning('تکایە هەموو خانە پێویستەکان پڕ بکەوە');
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('پەسندکردن پێویستە');
      }

      const payload = {
        ...formData,
        genre: primaryGenre
      };

      const data = await api.put(`/api/ktebnus/me/books/${slug}`, payload);
      toast.success('پەرتووک بە سەرکەوتوویی نوێکرایەوە!');
      
      // Redirect back to book dashboard
      router.push(`/kteb-nus/my-books/${data.book.slug}`);
    } catch (error: any) {
      console.error('هەڵە لە نوێکردنەوەی پەرتووک:', error);
      toast.error(error.message || 'نوێکردنەوەی پەرتووک شکستی هێنا');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەسندکردن پێویستە</h1>
          <p className="text-gray-600">تکایە بچۆ ژوورەوە بۆ دەستکاریکردنی پەرتووکان.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەرتووک نەدۆزرایەوە</h1>
          <p className="text-gray-600">ئەو پەرتووەی دەگەڕێیت بوونی نییە یان مۆڵەتت نییە بۆ دەستکاریکردنی.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="bg-white w-full min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-600">دەستکاریکردنی پەرتووک</h1>
            <button
              onClick={() => router.push(`/kteb-nus/my-books/${slug}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              هەڵوەشاندنەوە
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Book Cover Upload (match creation page style) */}
            <div className="flex flex-col items-center mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">وێنەی لاپەڕەی پێشەیی پەرتووک</label>
              <div className="w-56 h-80 rounded-lg flex items-center justify-center bg-gray-50 relative overflow-hidden mb-4">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="پێشبینی لاپەڕەی پێشەیی پەرتووک" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-base text-gray-500 mt-2">لاپەڕەی پێشەیی پەرتووک</p>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="relative w-56">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? 'بارکردن...' : imagePreview ? 'گۆڕینی لاپەڕەی پێشەیی' : 'بارکردنی وێنە'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                پێشنیارکراو: 400x533px (ڕێژەی 3:4). زۆرترین قەبارە 5MB.<br />وێنەکە دەبێت خۆکارانە گونجا بکرێت بۆ قەبارەی لاپەڕەی پێشەیی.
              </p>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, coverImage: '' }));
                  }}
                  className="text-red-600 hover:text-red-800 text-xs mt-1"
                >
                  سڕینەوەی وێنە
                </button>
              )}
            </div>

            {/* Order and styles: Title, Genre, Description, Status; blue labels; no input shadow */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-blue-600 mb-2">
                ناونیشانی پەرتووک *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ناونیشانی پەرتووکت بنووسە"
              />
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-blue-600 mb-2">
                ژانەر *
              </label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— هەڵبژاردن —</option>
                {genreOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-blue-600 mb-2">
                وەسف *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="پەرتووکت وەسف بکە"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-blue-600 mb-2">
                دۆخ
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ongoing">بەردەوامە</option>
                <option value="finished">تەواوبووە</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                هەڵوەشاندنەوە
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتکردنی گۆڕانکارییەکان'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
