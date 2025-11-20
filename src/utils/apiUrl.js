export function apiUrl(path) {
  const base = import.meta.env.VITE_API_URL || '';
  if (!path) return base;
  // If an absolute URL is passed, return it unchanged
  if (/^https?:\/\//i.test(path)) return path;
  // Ensure path starts with a slash
  const p = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash from base if present
  const b = base.replace(/\/$/, '');
  return b + p;
}
