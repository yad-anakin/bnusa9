'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadBookCoverImage } from '@/utils/imageUpload';
import api from '@/utils/api';
import Link from 'next/link';
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/solid';

export default function NewBookPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    status: 'ongoing',
    coverImage: ''
  });

  // Genre options (match edit page)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload to Backblaze
      const imageUrl = await uploadBookCoverImage(file);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        coverImage: imageUrl
      }));

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      setImagePreview(imageUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'بارکردنی وێنە شکستی هێنا');
      // Clean up preview on error
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.warning('تکایە بچۆ ژوورەوە بۆ دروستکردنی پەرتووک');
      return;
    }

    if (!formData.title || !formData.description || !formData.genre) {
      toast.warning('تکایە هەموو خانە پێویستەکان پڕ بکەوە');
      return;
    }

    setLoading(true);

    try {
      // Derive a robust username: prefer currentUser.username, then email local-part
      let derivedUsername = '';
      const authUsername = (currentUser as any)?.username;
      if (typeof authUsername === 'string' && authUsername.trim() !== '') {
        derivedUsername = authUsername.trim();
      } else if (currentUser?.email) {
        derivedUsername = currentUser.email.split('@')[0];
      }

      const payload = {
        ...formData,
        author: {
          userId: (currentUser as any)?.id || '',
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          profileImage: (currentUser as any)?.profileImage || '',
          username: derivedUsername
        }
      };
      console.log('[CREATE BOOK] payload.author:', payload.author);

      const data = await api.post('/api/ktebnus/me/books', payload);

      // Debug returned authorUsername
      console.log('[CREATE BOOK] response.book.authorUsername:', data?.book?.authorUsername);
      // Redirect to book dashboard
      router.push(`/kteb-nus/my-books/${data.book.slug}`);
    } catch (error: any) {
      console.error('Error creating book:', error);
      toast.error(error.message || 'دروستکردنی پەرتووک شکستی هێنا');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-16 relative overflow-hidden">
        {/* Subtle background elements - blue only */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <span className="inline-block text-sm font-semibold py-1 px-3 rounded-full bg-blue-50 text-blue-600 mb-3">چوونە ژوورەوە</span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">
              بەشداری لە بنووسە بکە
            </h1>
            <p className="text-lg mb-8 text-gray-600 max-w-xl mx-auto">
              بۆ نووسین و ناردنی وتار، هەڵسەنگاندن، کتێب و بینینی تەواوی کتێبەکانت، پێویستە سەرەتا چوونە ژوورەوە بکەیت یان هەژمارێک درووست بکەیت. <span className="text-blue-600">بنووسە پلاتفۆرمی نووسەرانی کوردە</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href="/signin" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              چوونە ژوورەوە
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <UserPlusIcon className="h-5 w-5" />
              خۆت تۆمار بکە
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="bg-white w-full min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-600">دروستکردنی پەرتووک</h1>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              هەڵوەشاندنەوە
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Book Cover Upload */}
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
                disabled={loading || uploadingImage}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'دروست دەکرێت...' : 'دروستکردنی پەرتووک'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
