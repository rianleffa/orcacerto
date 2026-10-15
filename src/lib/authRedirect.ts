/** Keep authentication callbacks on the same host that started the flow. */
export const getAuthRedirectUrl = (currentOrigin: string): string => {
  const currentUrl = new URL(currentOrigin);
  const isHttpProtocol = (protocol: string) => protocol === 'http:' || protocol === 'https:';

  if (!isHttpProtocol(currentUrl.protocol)) {
    throw new Error('A origem atual não é compatível com autenticação web.');
  }

  return new URL('/auth/callback', currentUrl.origin).toString();
};
