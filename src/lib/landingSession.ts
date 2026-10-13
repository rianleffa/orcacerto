export interface CachedLandingUser {
  id?: string;
  email?: string;
}

export const readCachedLandingUser = (): CachedLandingUser | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem('orcacerto_user');
    if (!saved) return null;
    const user: unknown = JSON.parse(saved);
    return user && typeof user === 'object' ? (user as CachedLandingUser) : null;
  } catch {
    return null;
  }
};
