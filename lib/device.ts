/**
 * Generates a simple, deterministic browser fingerprint for device binding.
 * Uses navigator.userAgent, screen dimensions, timezone, and other stable properties.
 * This is a lightweight fingerprint — not cryptographically strong, but sufficient
 * for soft device binding in the Eternia anonymous auth flow.
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'ssr-no-fingerprint'
  }

  const components: string[] = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    (screen.pixelDepth ?? '').toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    (navigator.hardwareConcurrency ?? '').toString(),
    (navigator.maxTouchPoints ?? '').toString(),
    new Date().getTimezoneOffset().toString(),
  ]

  const raw = components.join('||')

  // djb2-style hash — fast and deterministic, good enough for a device token
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash * 33) ^ char
    // Keep as unsigned 32-bit integer
    hash = hash >>> 0
  }

  return hash.toString(36)
}
