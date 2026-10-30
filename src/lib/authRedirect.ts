/** Keep authentication callbacks on the same host that started the flow. */
const getRedirectUrl = (currentOrigin: string, path: string): string => {
  const currentUrl = new URL(currentOrigin);
  const isHttpProtocol = (protocol: string) => protocol === 'http:' || protocol === 'https:';

  if (!isHttpProtocol(currentUrl.protocol)) {
    throw new Error('A origem atual não é compatível com autenticação web.');
  }

  return new URL(path, currentUrl.origin).toString();
};

export const getAuthRedirectUrl = (currentOrigin: string): string =>
  getRedirectUrl(currentOrigin, '/auth/callback');

export const getEmailConfirmationRedirectUrl = (currentOrigin: string): string =>
  getRedirectUrl(currentOrigin, '/auth/callback?flow=confirmation');

export const getPasswordRecoveryRedirectUrl = (currentOrigin: string): string =>
  getRedirectUrl(currentOrigin, '/redefinir-senha?flow=recovery');
