export const SIGNALING_PATH = '/api/v1/signaling/ws'

export function getSignalingUrl() {
  const configuredUrl = import.meta.env.VITE_SIGNALING_WS_URL

  if (configuredUrl) {
    return configuredUrl
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const isLocalVite = window.location.hostname === 'localhost' && window.location.port === '5173'

  if (isLocalVite) {
    return `${protocol}//localhost:8000${SIGNALING_PATH}`
  }

  return `${protocol}//${window.location.host}${SIGNALING_PATH}`
}
