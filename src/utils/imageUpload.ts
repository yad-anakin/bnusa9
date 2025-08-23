/**
 * Frontend utilities for image upload using the Backblaze B2 integration
 */
import api from '@/utils/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}
// Default fallback image URLs based on folder
const FALLBACK_IMAGES = {
  // Prefer local assets to avoid external DNS/optimizer issues
  profiles: '/images/placeholder.png',
  banners: '/images/default-banner.jpg',
  articles: '/images/placeholder.png',
  content: '/images/placeholder.png',
  default: '/images/placeholder.png'
};

/**
 * Generate a signature for file upload requests
 */
const generateFileUploadSignature = async (method: string, path: string, timestamp: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;
  if (!API_KEY) throw new Error('NEXT_PUBLIC_API_KEY is not set');
  // For form data, we'll use an empty string for the signature calculation
  const signatureString = `${method}${path}${timestamp}${API_KEY}`;
  
  // Use crypto API to create hash
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Upload a single image to Backblaze B2
 * @param file - The file to upload
 * @param folder - Optional folder path
 * @returns Promise with the URL of the uploaded image
 */
export const uploadImage = async (
  file: File,
  folder: string = ''
): Promise<string> => {
  try {
    // Check if file is valid
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided for upload');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`);
    }

    // Validate file size (limit to 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
    }

    // Create form data for the file
    const formData = new FormData();
    formData.append('image', file, file.name); // Include filename explicitly
    
    if (folder) {
      formData.append('folder', folder);
    }
    
    const path = '/api/images/upload';
    
    // Make the upload request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Create headers
      const headers: Record<string, string> = {};
      // Read CSRF token cookie set by backend and include for POST per CSRF middleware
      const getCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
        return null;
      };
      
      // Generate API signature for public upload
      const timestamp = Date.now().toString();
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY as string;
      if (!API_KEY) throw new Error('NEXT_PUBLIC_API_KEY is not set');
      const signature = await generateFileUploadSignature('POST', path, timestamp);
      
      // Add required API headers
      headers['x-api-key'] = API_KEY;
      headers['x-timestamp'] = timestamp;
      headers['x-signature'] = signature;
      // Add CSRF header for state-changing request
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      // Make the upload request
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      // Parse as JSON if possible
      let data;
      try {
        data = JSON.parse(await response.text());
      } catch (e) {
        throw new Error(`Invalid JSON response: ${await response.text()}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.message || `Upload failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      if (!data.imageUrl) {
        throw new Error('Response missing image URL');
      }
      
      return data.imageUrl;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if this is a network error or timeout
      if (fetchError.name === 'AbortError') {
        throw new Error('Image upload timed out. Please try again.');
      }
      
      // Let the error propagate to be caught by the outer try/catch
      throw fetchError;
    }
    
  } catch (error: any) {
    // Return a fallback image URL based on the folder
    const fallbackUrl = FALLBACK_IMAGES[folder as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default;
    
    // You can choose to either return the fallback or throw the error
    // Option 1: Return the fallback silently
    return fallbackUrl;
    
    // Option 2: Throw error (uncomment this line instead if you want errors to propagate)
    // throw error;
  }
};

/**
 * Upload multiple images at once
 * @param files - Array of files to upload
 * @param folder - Optional folder path
 * @returns Promise with array of URLs of the uploaded images
 */
export const uploadMultipleImages = async (
  files: File[],
  folder: string = ''
): Promise<string[]> => {
  try {
    // Upload each file sequentially
    const urls: string[] = [];
    
    for (const file of files) {
      const url = await uploadImage(file, folder);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload a profile image
 * @param file - The image file to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadProfileImage = async (
  file: File
): Promise<string> => {
  try {
    // Use the general image upload endpoint with the profiles folder
    const imageUrl = await uploadImage(file, 'profiles');
    
    // Only proceed if we actually received a valid absolute URL from the server
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
      // Now we need to update BOTH the user profile AND the UserImage collection
      
      // 1. Update MongoDB User profile through the profile API
      const userUpdateResult = await api.put('/api/users/profile', { profileImage: imageUrl });
      
      if (!userUpdateResult.success) {
        console.error('Failed to update User profile with new image:', userUpdateResult.message);
      }
      
      // 2. Update UserImage collection directly through its dedicated endpoint
      const userImageUpdateResult = await api.put('/api/user-images', { profileImage: imageUrl });
      
      if (!userImageUpdateResult.success) {
        console.error('Failed to update UserImage record:', userImageUpdateResult.message);
      }
      
      // Perform a force refresh of the user data from the server
      try {
        await api.noCache.get('/api/users/profile');
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
      
      // Clear API cache to force fresh data on the next fetch
      api.clearUserCache();
      
      // Return the image URL regardless of update status
      return imageUrl;
    }
    
    // Do not persist a local placeholder path; surface a clear error instead
    throw new Error('Image upload failed or returned an invalid URL. Please use JPEG, PNG, or WebP and try again.');
  } catch (error: any) {
    console.error('Error in profile image upload:', error);
    throw new Error(`Profile image upload failed: ${error.message}`);
  }
};

/**
 * Upload a banner image
 * @param file - The image file to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadBannerImage = async (
  file: File
): Promise<string> => {
  try {
    // Use the general image upload endpoint with the banners folder
    const imageUrl = await uploadImage(file, 'banners');
    
    // Only proceed if we actually received a valid absolute URL from the server
    if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
      // Now we need to update BOTH the user profile AND the UserImage collection
      
      // 1. Update MongoDB User profile through the profile API
      const userUpdateResult = await api.put('/api/users/profile', { bannerImage: imageUrl });
      
      if (!userUpdateResult.success) {
        console.error('Failed to update User profile with new banner:', userUpdateResult.message);
      }
      
      // 2. Update UserImage collection directly through its dedicated endpoint
      const userImageUpdateResult = await api.put('/api/user-images', { bannerImage: imageUrl });
      
      if (!userImageUpdateResult.success) {
        console.error('Failed to update UserImage record:', userImageUpdateResult.message);
      }
      
      // Perform a force refresh of the user data from the server
      try {
        await api.noCache.get('/api/users/profile');
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
      }
      
      // Clear API cache to force fresh data on the next fetch
      api.clearUserCache();
      
      // Return the image URL regardless of update status
      return imageUrl;
    }
    
    // Do not persist a local placeholder path; surface a clear error instead
    throw new Error('Banner upload failed or returned an invalid URL. Please use JPEG, PNG, or WebP and try again.');
  } catch (error: any) {
    console.error('Error in banner image upload:', error);
    throw new Error(`Banner image upload failed: ${error.message}`);
  }
};

/**
 * Upload an article cover image
 * @param file - The image file to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadArticleImage = async (
  file: File
): Promise<string> => {
  return uploadImage(file, 'articles');
};

/**
 * Upload a rich text editor content image
 * @param file - The image file to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadContentImage = async (
  file: File
): Promise<string> => {
  return uploadImage(file, 'content');
};

/**
 * Upload a book cover image with proper sizing
 * @param file - The image file to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadBookCoverImage = async (
  file: File
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    // Validate file size (limit to 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
    }

    // Create a canvas to resize the image to book cover proportions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create canvas context');
    }

    // Load the image
    const img = new Image();
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    img.src = URL.createObjectURL(file);
    await imageLoadPromise;

    // Book cover dimensions (3:4 aspect ratio)
    const targetWidth = 400;
    const targetHeight = 533; // 4/3 * 400

    // Set canvas size
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate scaling to fit the image while maintaining aspect ratio
    const imgAspect = img.width / img.height;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > targetAspect) {
      // Image is wider than target - fit by height
      drawHeight = targetHeight;
      drawWidth = drawHeight * imgAspect;
      drawX = (targetWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      // Image is taller than target - fit by width
      drawWidth = targetWidth;
      drawHeight = drawWidth / imgAspect;
      drawX = 0;
      drawY = (targetHeight - drawHeight) / 2;
    }

    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Convert canvas to blob
    const resizedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/jpeg', 0.9);
    });

    // Create a new file from the resized blob
    const resizedFile = new File([resizedBlob], `book-cover-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });

    // Clean up
    URL.revokeObjectURL(img.src);

    // Upload the resized image to the 'book-covers' folder
    return uploadImage(resizedFile, 'book-covers');
  } catch (error: any) {
    console.error('Error in book cover upload:', error);
    throw new Error(`Book cover upload failed: ${error.message}`);
  }
};

/**
 * Delete an image from Backblaze B2
 * @param imageUrl - The URL of the image to delete
 * @returns Promise with success status
 */
export const deleteImage = async (
  imageUrl: string
): Promise<boolean> => {
  try {
    // Use the api utility for authenticated request
    const data = await api.post('/api/images/delete', { imageUrl });
    
    if (data.success) {
      return true;
    } else {
      console.error('Failed to delete image:', data.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Check if a URL is a valid image 
 * @param url - URL to check
 * @returns Promise that resolves to boolean
 */
export const isValidImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    return false;
  }
};

/**
 * Get a file object from a URL
 * @param url - URL of the image
 * @param filename - Optional filename
 * @returns Promise with File object
 */
export const getFileFromUrl = async (
  url: string, 
  filename?: string
): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File(
    [blob], 
    filename || url.split('/').pop() || 'image.png',
    { type: blob.type }
  );
};

/**
 * Get the default banner image URL from the backend
 * This ensures we use the Backblaze B2 hosted version if available
 * @returns Promise with the URL of the default banner image
 */
export const getDefaultBannerUrl = async (): Promise<string> => {
  try {
    // Use the api utility for authenticated request
    const data = await api.get('/api/images/default/banner');
    
    if (data.success && data.imageUrl) {
      return data.imageUrl;
    }
    
    return FALLBACK_IMAGES.banners;
  } catch (error) {
    console.error('Error getting default banner:', error);
    return FALLBACK_IMAGES.banners;
  }
};

/**
 * Get the default profile image URL from the backend
 * This ensures we use the Backblaze B2 hosted version if available
 * @returns Promise with the URL of the default profile image
 */
export const getDefaultProfileUrl = async (): Promise<string> => {
  // We're no longer using fallback profile images, just return empty string
  return '';
}; 