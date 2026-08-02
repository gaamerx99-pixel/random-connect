import { useCallback, useEffect, useMemo, useState } from 'react'

type PermissionStatus = 'checking' | 'granted' | 'denied' | 'unsupported'

type LocalMediaState = {
  cameraStatus: PermissionStatus
  microphoneStatus: PermissionStatus
  connectionStatus: 'checking devices' | 'ready' | 'blocked' | 'unsupported'
  errorMessage: string | null
  isAudioMuted: boolean
  isVideoMuted: boolean
  isRequesting: boolean
  requestMedia: () => Promise<void>
  stream: MediaStream | null
  toggleAudio: () => void
  toggleVideo: () => void
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function useLocalMedia(): LocalMediaState {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('checking')
  const [microphoneStatus, setMicrophoneStatus] = useState<PermissionStatus>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)

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
      // Turning camera OFF -> stop hardware tracks so physical laptop camera LED turns OFF
      const videoTracks = stream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.stop()
        stream.removeTrack(track)
      })
      setIsVideoMuted(true)
    } else {
      // Turning camera ON -> re-acquire webcam hardware cleanly
      try {
        const nextMedia = await navigator.mediaDevices.getUserMedia({ video: true })
        const newTrack = nextMedia.getVideoTracks()[0]
        if (newTrack) {
          stream.addTrack(newTrack)
          setIsVideoMuted(false)
        }
      } catch (err) {
        console.error('Failed to re-enable camera device:', err)
      }
    }
  }, [stream, isVideoMuted])

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

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })

      setStream((currentStream) => {
        stopStream(currentStream)
        return nextStream
      })
      setIsAudioMuted(false)
      setIsVideoMuted(false)
      setCameraStatus(nextStream.getVideoTracks().length > 0 ? 'granted' : 'denied')
      setMicrophoneStatus(nextStream.getAudioTracks().length > 0 ? 'granted' : 'denied')
    } catch (error) {
      setStream((currentStream) => {
        stopStream(currentStream)
        return null
      })
      setCameraStatus('denied')
      setMicrophoneStatus('denied')
      setErrorMessage(error instanceof Error ? error.message : 'Camera or microphone access was blocked.')
    } finally {
      setIsRequesting(false)
    }
  }, [])

  useEffect(() => {
    void requestMedia()

    return () => {
      setStream((currentStream) => {
        stopStream(currentStream)
        return null
      })
    }
  }, [requestMedia])

  const connectionStatus = useMemo(() => {
    if (cameraStatus === 'unsupported' || microphoneStatus === 'unsupported') {
      return 'unsupported'
    }

    if (cameraStatus === 'granted' && microphoneStatus === 'granted') {
      return 'ready'
    }

    if (cameraStatus === 'denied' || microphoneStatus === 'denied') {
      return 'blocked'
    }

    return 'checking devices'
  }, [cameraStatus, microphoneStatus])

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
  }
}
