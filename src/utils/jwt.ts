export function getTokenExpiry(token: string): number | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as unknown
    if (
      payload &&
      typeof payload === 'object' &&
      'exp' in payload &&
      typeof (payload as { exp: unknown }).exp === 'number'
    ) {
      return (payload as { exp: number }).exp
    }
    return null
  } catch {
    return null
  }
}

// Returns false when the token is not a JWT or lacks `exp` — unknown is
// treated as not-expired so we never log users out based on tokens we cannot
// inspect. Backend 401 remains the safety net.
// Proaktiv: behandelt Tokens bereits `clockSkewSeconds` vor Ablauf als
// expired, damit kein toter Token aufs Backend geschickt wird.
export function isTokenExpired(token: string, clockSkewSeconds = 30): boolean {
  const exp = getTokenExpiry(token)
  if (exp === null) return false
  return exp <= Date.now() / 1000 + clockSkewSeconds
}

function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + padding)
  try {
    return decodeURIComponent(
      Array.from(
        binary,
        (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')
      ).join('')
    )
  } catch {
    return binary
  }
}
