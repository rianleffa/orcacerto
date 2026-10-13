const isLoopbackHost = (hostname: string): boolean => {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '::1' ||
    normalized === '0.0.0.0' ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized)
  );
};

/** Resolve the OAuth callback against the current app host, ignoring a localhost override on deployed devices. */
export const getAuthRedirectUrl = (currentOrigin: string, configuredSiteUrl?: string): string => {
  const currentUrl = new URL(currentOrigin);
  const isHttpProtocol = (protocol: string) => protocol === 'http:' || protocol === 'https:';

  if (!isHttpProtocol(currentUrl.protocol)) {
    throw new Error('A origem atual não é compatível com autenticação web.');
  }

  let redirectOrigin = currentUrl.origin;
  const configuredValue = configuredSiteUrl?.trim();

  if (configuredValue) {
    try {
      const configuredUrl = new URL(configuredValue);
      const configuredIsLocal = isLoopbackHost(configuredUrl.hostname);
      const currentIsLocal = isLoopbackHost(currentUrl.hostname);

      if (
        isHttpProtocol(configuredUrl.protocol) &&
        !configuredUrl.username &&
        !configuredUrl.password &&
        (!configuredIsLocal || currentIsLocal)
      ) {
        redirectOrigin = configuredUrl.origin;
      }
    } catch {
      // Ignore invalid optional overrides and keep the origin currently serving the app.
    }
  }

  return new URL('/auth/callback', redirectOrigin).toString();
};
