export const CONFIRMATION_RESEND_COOLDOWN_SECONDS = 60;

const RESEND_COOLDOWN_KEY = 'orcacerto_confirmation_resend_available_at';

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const getCooldownSecondsRemaining = (
  availableAt: number,
  now = Date.now()
): number => {
  if (!Number.isFinite(availableAt)) return 0;
  return Math.max(0, Math.ceil((availableAt - now) / 1000));
};

export const getConfirmationResendCooldown = (now = Date.now()): number => {
  const storage = getSessionStorage();
  if (!storage) return 0;

  try {
    const availableAt = Number(storage.getItem(RESEND_COOLDOWN_KEY));
    const remaining = getCooldownSecondsRemaining(availableAt, now);
    if (remaining === 0) storage.removeItem(RESEND_COOLDOWN_KEY);
    return remaining;
  } catch {
    return 0;
  }
};

export const startConfirmationResendCooldown = (now = Date.now()): void => {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      RESEND_COOLDOWN_KEY,
      String(now + CONFIRMATION_RESEND_COOLDOWN_SECONDS * 1000)
    );
  } catch {
    // Supabase keeps the authoritative server-side email rate limit.
  }
};
