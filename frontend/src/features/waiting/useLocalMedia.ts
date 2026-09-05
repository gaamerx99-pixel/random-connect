import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type DevicePermissionStatus =
  | 'checking'
  | 'granted'
  | 'denied'
  | 'not_found'
  | 'in_use'
  | 'unsupported'

export type LocalMediaState = {
  cameraStatus: DevicePermissionStatus
  microphoneStatus: DevicePermissionStatus
  connectionStatus: 'checking devices' | 'ready' | 'blocked' | 'unsupported'
  errorMessage: string | null
  isAudioMuted: boolean
  isVideoMuted: boolean
  isRequesting: boolean
  requestMedia: () => Promise<void>
  stream: MediaStream | null
  toggleAudio: () => void
  toggleVideo: () => void
  videoDevices: MediaDeviceInfo[]
  audioDevices: MediaDeviceInfo[]
  selectedVideoDeviceId: string
  selectedAudioDeviceId: string
  selectVideoDevice: (deviceId: string) => Promise<void>
  selectAudioDevice: (deviceId: string) => Promise<void>
  isAvatarVideoActive: boolean
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop()
    } catch {
      // Ignore already stopped tracks
    }
  })
}

// Generate an animated synthetic video track when physical webcam is missing/unavailable
function createAvatarVideoTrack(name: string = 'You'): MediaStreamTrack {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')

  let frame = 0
  let isRunning = true

  function draw() {
    if (!isRunning || !ctx) return
    frame++

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 640, 480)
    gradient.addColorStop(0, '#07080d')
    gradient.addColorStop(0.5, '#121422')
    gradient.addColorStop(1, '#07080d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 640, 480)

    // Animated glow ring
    const radius = 80 + Math.sin(frame * 0.05) * 6
    ctx.save()
    ctx.beginPath()
    ctx.arc(320, 210, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)'
    ctx.stroke()
    ctx.restore()

    // Avatar Circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(320, 210, 70, 0, Math.PI * 2)
    ctx.fillStyle = '#4f46e5'
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((name.charAt(0) || 'U').toUpperCase(), 320, 210)
    ctx.restore()

    // Display Name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(name, 320, 320)

    // Hardware status badge
    ctx.fillStyle = '#f59e0b'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📷 No Camera Detected (Avatar Mode Active)', 320, 350)

    requestAnimationFrame(draw)
  }

  draw()
  const canvasStream = canvas.captureStream(24)
  const track = canvasStream.getVideoTracks()[0]

  const originalStop = track.stop.bind(track)
  track.stop = () => {
    isRunning = false
    originalStop()
  }

  return track
}

export function useLocalMedia(): LocalMediaState {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<DevicePermissionStatus>('checking')
  const [microphoneStatus, setMicrophoneStatus] = useState<DevicePermissionStatus>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isAvatarVideoActive, setIsAvatarVideoActive] = useState(false)

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])

  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem('rc_selected_video_device') || ''
    } catch {
      return ''
    }
  })

  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem('rc_selected_audio_device') || ''
    } catch {
      return ''
    }
  })

  const streamRef = useRef<MediaStream | null>(null)
  streamRef.current = stream

  // Refresh hardware device enumeration
  const enumerateAndVerifyDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoList = devices.filter((d) => d.kind === 'videoinput')
      const audioList = devices.filter((d) => d.kind === 'audioinput')

      setVideoDevices(videoList)
      setAudioDevices(audioList)

      // Validate selectedVideoDeviceId: if stale/unplugged, gracefully reset to default
      if (selectedVideoDeviceId && !videoList.some((d) => d.deviceId === selectedVideoDeviceId)) {
        console.warn('[Media] Stale video deviceId detected, clearing constraint:', selectedVideoDeviceId)
        setSelectedVideoDeviceId('')
        try {
          localStorage.removeItem('rc_selected_video_device')
        } catch {
          // Ignore
        }
      }

      // Validate selectedAudioDeviceId: if stale/unplugged, gracefully reset to default
      if (selectedAudioDeviceId && !audioList.some((d) => d.deviceId === selectedAudioDeviceId)) {
        console.warn('[Media] Stale audio deviceId detected, clearing constraint:', selectedAudioDeviceId)
        setSelectedAudioDeviceId('')
        try {
          localStorage.removeItem('rc_selected_audio_device')
        } catch {
          // Ignore
        }
      }

      return { videoList, audioList }
    } catch (err) {
      console.warn('[Media] Failed to enumerate devices:', err)
      return { videoList: [], audioList: [] }
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId])

  const toggleAudio = useCallback(() => {
    if (!stream) return
    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled
    })
    setIsAudioMuted((prev) => !prev)
  }, [stream])

  const toggleVideo = useCallback(async () => {
    if (!stream) return

    if (!isVideoMuted) {
      // Mute local video
      const videoTracks = stream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = false
      })
      setIsVideoMuted(true)
    } else {
      // Unmute local video
      const videoTracks = stream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = true
      })
      setIsVideoMuted(false)
    }
  }, [stream, isVideoMuted])

  // Request media with granular error detection and graceful fallbacks
  const requestMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setMicrophoneStatus('unsupported')
      setErrorMessage('This browser does not support camera and microphone permissions.')
      return
    }

    setIsRequesting(true)
    setErrorMessage(null)
    setCameraStatus('checking')
    setMicrophoneStatus('checking')

    const { videoList = [], audioList = [] } = (await enumerateAndVerifyDevices()) || {}
    const hasPhysicalWebcam = videoList.length > 0
    const hasPhysicalMicrophone = audioList.length > 0

    // Build constraints respecting verified device IDs
    const buildConstraints = (useVideo: boolean, useAudio: boolean) => {
      const videoConstraint: MediaTrackConstraints | boolean = useVideo
        ? selectedVideoDeviceId
          ? { deviceId: { exact: selectedVideoDeviceId } }
          : true
        : false

      const audioConstraint: MediaTrackConstraints | boolean = useAudio
        ? selectedAudioDeviceId
          ? { deviceId: { exact: selectedAudioDeviceId } }
          : true
        : false

      return { video: videoConstraint, audio: audioConstraint }
    }

    let acquiredAudioStream: MediaStream | null = null
    let acquiredVideoStream: MediaStream | null = null
    let mediaError: Error | null = null

    // Attempt 1: Full video + audio
    try {
      const fullStream = await navigator.mediaDevices.getUserMedia(
        buildConstraints(hasPhysicalWebcam, hasPhysicalMicrophone || true),
      )

      if (fullStream.getVideoTracks().length > 0) {
        acquiredVideoStream = fullStream
        setCameraStatus('granted')
        setIsAvatarVideoActive(false)
      }

      if (fullStream.getAudioTracks().length > 0) {
        acquiredAudioStream = fullStream
        setMicrophoneStatus('granted')
      }
    } catch (err: any) {
      mediaError = err
      console.warn('[Media] Combined audio/video acquisition failed:', err.name, err.message)

      // If failed due to stale deviceId constraint (OverconstrainedError/NotFoundError), clear stored constraints
      if (err.name === 'OverconstrainedError' || err.name === 'NotFoundError') {
        setSelectedVideoDeviceId('')
        setSelectedAudioDeviceId('')
        try {
          localStorage.removeItem('rc_selected_video_device')
          localStorage.removeItem('rc_selected_audio_device')
        } catch {
          // Ignore
        }
      }

      // If user explicitly denied permissions, record it truthfully
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied')
        setMicrophoneStatus('denied')
        setErrorMessage('Camera or microphone permission was denied. Please allow access in your browser settings.')
        setIsRequesting(false)
        return
      }
    }

    // Attempt 2: If combined failed, probe Audio and Video separately so one missing hardware doesn't fail both
    if (!acquiredAudioStream && !acquiredVideoStream) {
      // Probe Microphone independently
      try {
        acquiredAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicrophoneStatus('granted')
      } catch (audioErr: any) {
        if (audioErr.name === 'NotAllowedError' || audioErr.name === 'PermissionDeniedError') {
          setMicrophoneStatus('denied')
        } else if (audioErr.name === 'NotFoundError' || audioErr.name === 'DevicesNotFoundError') {
          setMicrophoneStatus('not_found')
        } else if (audioErr.name === 'NotReadableError' || audioErr.name === 'TrackStartError') {
          setMicrophoneStatus('in_use')
        } else {
          setMicrophoneStatus('denied')
        }
      }

      // Probe Camera independently
      try {
        acquiredVideoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraStatus('granted')
        setIsAvatarVideoActive(false)
      } catch (videoErr: any) {
        if (videoErr.name === 'NotAllowedError' || videoErr.name === 'PermissionDeniedError') {
          setCameraStatus('denied')
        } else if (videoErr.name === 'NotFoundError' || videoErr.name === 'DevicesNotFoundError') {
          setCameraStatus('not_found')
        } else if (videoErr.name === 'NotReadableError' || videoErr.name === 'TrackStartError') {
          setCameraStatus('in_use')
        } else {
          setCameraStatus('denied')
        }
      }
    }

    // Assemble final stream
    const finalStream = new MediaStream()

    // Add audio track if acquired
    if (acquiredAudioStream) {
      const audioTrack = acquiredAudioStream.getAudioTracks()[0]
      if (audioTrack) {
        finalStream.addTrack(audioTrack)
      }
    }

    // Add video track (real webcam or synthetic avatar track if no physical camera)
    if (acquiredVideoStream && acquiredVideoStream.getVideoTracks().length > 0) {
      const videoTrack = acquiredVideoStream.getVideoTracks()[0]
      finalStream.addTrack(videoTrack)
      setCameraStatus('granted')
      setIsAvatarVideoActive(false)
    } else {
      // No physical webcam: create synthetic avatar video track so WebRTC call can function seamlessly
      const avatarTrack = createAvatarVideoTrack('You')
      finalStream.addTrack(avatarTrack)
      setIsAvatarVideoActive(true)

      if (!hasPhysicalWebcam) {
        setCameraStatus('not_found')
        setErrorMessage('No physical webcam detected on this device. Audio-only with avatar mode active.')
      }
    }

    setStream((prev) => {
      stopStream(prev)
      return finalStream
    })

    setIsAudioMuted(false)
    setIsVideoMuted(false)
    setIsRequesting(false)

    // Re-enumerate to capture permission-labeled device names
    void enumerateAndVerifyDevices()
  }, [enumerateAndVerifyDevices, selectedVideoDeviceId, selectedAudioDeviceId])

  // Initial media acquisition
  useEffect(() => {
    void requestMedia()

    return () => {
      setStream((currentStream) => {
        stopStream(currentStream)
        return null
      })
    }
  }, [requestMedia])

  // Listen for hardware plug/unplug (devicechange event)
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return

    const handleDeviceChange = async () => {
      console.log('[Media] Hardware devicechange detected, re-verifying...')
      await enumerateAndVerifyDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [enumerateAndVerifyDevices])

  // Switch video device
  const selectVideoDevice = useCallback(
    async (deviceId: string) => {
      setSelectedVideoDeviceId(deviceId)
      try {
        if (deviceId) {
          localStorage.setItem('rc_selected_video_device', deviceId)
        } else {
          localStorage.removeItem('rc_selected_video_device')
        }
      } catch {
        // Ignore
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        })
        const newTrack = newStream.getVideoTracks()[0]
        if (newTrack && streamRef.current) {
          const oldTrack = streamRef.current.getVideoTracks()[0]
          if (oldTrack) {
            oldTrack.stop()
            streamRef.current.removeTrack(oldTrack)
          }
          streamRef.current.addTrack(newTrack)
          setCameraStatus('granted')
          setIsAvatarVideoActive(false)
        }
      } catch (err) {
        console.warn('[Media] Failed to switch video device:', err)
      }
    },
    [],
  )

  // Switch audio device
  const selectAudioDevice = useCallback(
    async (deviceId: string) => {
      setSelectedAudioDeviceId(deviceId)
      try {
        if (deviceId) {
          localStorage.setItem('rc_selected_audio_device', deviceId)
        } else {
          localStorage.removeItem('rc_selected_audio_device')
        }
      } catch {
        // Ignore
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        })
        const newTrack = newStream.getAudioTracks()[0]
        if (newTrack && streamRef.current) {
          const oldTrack = streamRef.current.getAudioTracks()[0]
          if (oldTrack) {
            oldTrack.stop()
            streamRef.current.removeTrack(oldTrack)
          }
          streamRef.current.addTrack(newTrack)
          setMicrophoneStatus('granted')
        }
      } catch (err) {
        console.warn('[Media] Failed to switch audio device:', err)
      }
    },
    [],
  )

  // Connection status reflects whether local media is ready for matchmaking
  const connectionStatus = useMemo(() => {
    if (cameraStatus === 'unsupported' && microphoneStatus === 'unsupported') {
      return 'unsupported'
    }

    // If permissions explicitly blocked
    if (cameraStatus === 'denied' && microphoneStatus === 'denied') {
      return 'blocked'
    }

    // If stream is acquired (either real audio/video or synthetic avatar track)
    if (stream && (stream.getVideoTracks().length > 0 || stream.getAudioTracks().length > 0)) {
      return 'ready'
    }

    if (cameraStatus === 'checking' || microphoneStatus === 'checking') {
      return 'checking devices'
    }

    return 'ready'
  }, [cameraStatus, microphoneStatus, stream])

  return {
    cameraStatus,
    microphoneStatus,
    connectionStatus,
    errorMessage,
    isAudioMuted,
    isVideoMuted,
    isRequesting,
    requestMedia,
    stream,
    toggleAudio,
    toggleVideo,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    selectVideoDevice,
    selectAudioDevice,
    isAvatarVideoActive,
  }
}
