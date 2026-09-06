export const SIGNALING_PATH = '/api/v1/signaling/ws'

export const PRODUCTION_DEFAULT_WS_URL = 'wss://65.2.150.177.sslip.io/api/v1/signaling/ws'

export function getSignalingUrl() {
  let configuredUrl = import.meta.env.VITE_SIGNALING_WS_URL as string | undefined

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

  if (configuredUrl) {
    if (isHttps && configuredUrl.startsWith('ws://')) {
      configuredUrl = configuredUrl
        .replace('ws://65.2.150.177/', 'wss://65.2.150.177.sslip.io/')
        .replace('ws://65.2.150.177:', 'wss://65.2.150.177.sslip.io:')
        .replace(/^ws:\/\//, 'wss://')
    }
    return configuredUrl
  }

  const hostname = window.location.hostname
  const port = window.location.port

  const isLocalVite =
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    (port === '5173' || port === '3000')

  if (isLocalVite) {
    const protocol = isHttps ? 'wss:' : 'ws:'
    const backendHost = hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'
    return `${protocol}//${backendHost}:8000${SIGNALING_PATH}`
  }

  return PRODUCTION_DEFAULT_WS_URL
}
