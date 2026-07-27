import { useCallback, useEffect, useMemo, useState } from 'react'

type PermissionStatus = 'checking' | 'granted' | 'denied' | 'unsupported'

type LocalMediaState = {
  cameraStatus: PermissionStatus
  microphoneStatus: PermissionStatus
  connectionStatus: 'checking devices' | 'ready' | 'blocked' | 'unsupported'
  errorMessage: string | null
  isRequesting: boolean
  requestMedia: () => Promise<void>
  stream: MediaStream | null
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
    isRequesting,
    requestMedia,
    stream,
  }
}
