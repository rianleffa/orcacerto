import { getSupabaseClient } from './supabase';

interface VisitIds {
  visitorId: string;
  visitId: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return '';
};

const getStoredId = (storage: Storage, key: string) => {
  try {
    const existing = storage.getItem(key);
    if (existing && UUID_PATTERN.test(existing)) return existing;
    const created = makeId();
    if (created) storage.setItem(key, created);
    return created;
  } catch {
    return makeId();
  }
};

export const getVisitIds = (): VisitIds | null => {
  if (typeof window === 'undefined') return null;
  try {
    const visitorId = getStoredId(window.localStorage, 'orcacerto_analytics_visitor_id');
    const visitId = getStoredId(window.sessionStorage, 'orcacerto_analytics_visit_id');
    return visitorId && visitId ? { visitorId, visitId } : null;
  } catch {
    return null;
  }
};

export const recordSiteVisit = async () => {
  const ids = getVisitIds();
  if (!ids) return;

  try {
    const { error } = await getSupabaseClient().rpc('record_site_visit', {
      p_visitor_id: ids.visitorId,
      p_visit_id: ids.visitId,
    });
    if (error) return;
  } catch {
    // Analytics must not block sign-in or normal navigation.
  }
};
