import { foldLatinDiacritics } from './fold-latin-diacritics';

/** Latin letters that NFD cannot decompose into base + combining mark. */
const NON_DECOMPOSABLE: Record<string, string> = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ð: 'd', þ: 'th', ł: 'l' };

export const generateValidSlug = (str: string, options?: { preserveTrailingHyphen?: boolean }): string => {
  if (!str) return '';

  let result = foldLatinDiacritics(str)
    .toLowerCase()
    .replace(/[ßæœøđðþł]/g, (ch) => NON_DECOMPOSABLE[ch] ?? ch)
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  
  // Remove leading hyphens
  result = result.replace(/^-+/, '');
  
  // Only remove trailing hyphens if not preserving them (for live typing)
  if (!options?.preserveTrailingHyphen) {
    result = result.replace(/-+$/, '');
  }
  
  return result;
};


export const isAValidSlugFormat = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;
  
  // Check if slug is empty or only whitespace
  if (!slug.trim()) return false;
  
  // Check minimum length (at least 3 characters)
  if (slug.trim().length < 3) return false;
  
  // Check if slug contains only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  
  // Check if slug starts or ends with a hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) return false;
  
  // Check if slug has multiple consecutive hyphens
  if (slug.includes('--')) return false;
  
  return true;
};