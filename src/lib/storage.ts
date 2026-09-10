import { supabase } from './supabase';

/**
 * Optimizes an image file locally in the browser before upload.
 * Reduces large mobile phone camera images (often 5MB - 20MB) down to 100-300KB
 * while maintaining crisp resolution for retina displays.
 */
export async function optimizeImage(file: File, maxDimension = 1200, quality = 0.85): Promise<Blob> {
  // If SVG or GIF, preserve raw format without canvas recompression
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback to original file if canvas context unavailable
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp or jpeg
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file (e.g. from local device / file input) to Supabase Storage.
 * Returns the public CDN URL to save into database records (products or business_settings).
 */
export async function uploadImageFile(
  file: File,
  folder: 'logos' | 'products' = 'products'
): Promise<string> {
  // 1. Optimize image in-memory
  const optimizedBlob = await optimizeImage(file);

  // 2. Generate unique filename
  const rawExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const extension = rawExtension === 'jpeg' ? 'jpg' : rawExtension;
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 24);
  const fileName = `${folder}/${Date.now()}_${sanitizedName}.${extension}`;

  // 3. Upload to Supabase Storage bucket 'water-app-assets'
  const { data, error } = await supabase.storage
    .from('water-app-assets')
    .upload(fileName, optimizedBlob, {
      cacheControl: '31536000', // 1 year cache
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(error.message || 'Failed to upload image to cloud storage.');
  }

  // 4. Retrieve public URL
  const { data: publicData } = supabase.storage
    .from('water-app-assets')
    .getPublicUrl(data.path);

  if (!publicData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded image.');
  }

  return publicData.publicUrl;
}
