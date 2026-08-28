/**
 * Universal Payment Proof URL Resolver
 * Resolves payment screenshots across all storage types:
 * - Base64 Data URIs (in-memory/database direct)
 * - Absolute URLs (Cloudinary, S3, external storage)
 * - REST streaming endpoint (/api/payment/proof/:id)
 * - Legacy relative upload paths (/uploads/payment_xxx.png)
 */

export const resolveProofImageUrl = (booking, apiUrl, serverUrl) => {
  if (!booking) return null;

  const baseApi = apiUrl || (typeof window !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
  const baseServer = serverUrl || (typeof window !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) || 'http://localhost:5000';

  // 1. Direct Base64 Data URI from paymentScreenshotData or paymentScreenshot
  const dataUri = booking.paymentScreenshotData;
  if (dataUri && typeof dataUri === 'string' && dataUri.startsWith('data:image/')) {
    return dataUri;
  }

  const raw = booking.paymentScreenshot;
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    // If no path but we have booking ID, fallback to streaming endpoint
    const id = booking._id || booking.id;
    return id ? `${baseApi}/payment/proof/${id}` : null;
  }

  const cleanRaw = raw.trim();

  // 2. Base64 string in paymentScreenshot field
  if (cleanRaw.startsWith('data:image/')) {
    return cleanRaw;
  }

  // 3. Absolute URL (http:// or https://) - do NOT prepend server/API URL
  if (/^https?:\/\//i.test(cleanRaw)) {
    return cleanRaw;
  }

  // 4. Booking ID streaming endpoint path
  const bookingId = booking._id || booking.id;
  if (cleanRaw.startsWith('/api/payment/proof/') || cleanRaw.startsWith('api/payment/proof/')) {
    const cleanEndpoint = cleanRaw.startsWith('/') ? cleanRaw : `/${cleanRaw}`;
    return `${baseServer}${cleanEndpoint}`;
  }

  // 5. Legacy relative path (/uploads/...)
  const normalizedPath = cleanRaw.replace(/\\/g, '/');
  if (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('uploads/')) {
    const formatted = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${baseServer}${formatted}`;
  }

  // 6. Generic ID fallback
  if (bookingId) {
    return `${baseApi}/payment/proof/${bookingId}`;
  }

  return `${baseServer}/${normalizedPath.replace(/^\//, '')}`;
};
