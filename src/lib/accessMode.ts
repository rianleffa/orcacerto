// Payments are paused by default. Set VITE_FREE_ACCESS_ENABLED=false to
// restore the existing plan checks after enabling the database setting too.
export const FREE_ACCESS_ENABLED =
  import.meta.env.VITE_FREE_ACCESS_ENABLED?.trim().toLowerCase() !== 'false';
