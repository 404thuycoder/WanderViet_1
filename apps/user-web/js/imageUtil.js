/**
 * Centralised image helper for the app.
 * Returns a safe image URL – if `src` is falsy, fallback is used.
 */
export function getSafeImage(src, fallback) {
  if (!src || src === 'undefined' || src === 'null' || (typeof src === 'string' && src.indexOf('uploads/undefined') !== -1)) {
    return fallback;
  }
  return src;
}

/**
 * Remove duplicate image URLs from an array.
 */
export function uniqueImages(arr) {
  const seen = new Set();
  return arr.filter(i => i && !seen.has(i) && seen.add(i));
}
