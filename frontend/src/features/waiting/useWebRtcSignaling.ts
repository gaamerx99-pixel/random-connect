import { useCallback, useEffect, useRef, useState } from 'react'

import { getSignalingUrl } from '../../services/signaling/signalingClient'
import type { SignalingConnectionStatus, SignalingMessage } from '../../types/signaling'

type WebRtcSignalingState = {
  errorMessage: string | null
  findStranger: () => void
  isSearching: boolean
  remoteStream: MediaStream | null
  signalingStatus: SignalingConnectionStatus
}

const peerConnectionConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function useWebRtcSignaling(localStream: MediaStream | null): WebRtcSignalingState {
  const localStreamRef = useRef<MediaStream | null>(localStream)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const websocketRef = useRef<WebSocket | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [signalingStatus, setSignalingStatus] = useState<SignalingConnectionStatus>('idle')

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  const sendMessage = useCallback((message: object) => {
    const websocket = websocketRef.current

    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(message))
    }
  }, [])

  const closePeerConnection = useCallback(() => {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    pendingIceCandidatesRef.current = []
    setRemoteStream(null)
  }, [])

  const applyPendingIceCandidates = useCallback(async (peerConnection: RTCPeerConnection) => {
    // Step 9a: Apply ICE candidates that arrived before the remote SDP was ready.
    const pendingCandidates = pendingIceCandidatesRef.current
    pendingIceCandidatesRef.current = []

    await Promise.all(
      pendingCandidates.map((candidate) => peerConnection.addIceCandidate(new RTCIceCandidate(candidate))),
    )
  }, [])

  const createPeerConnection = useCallback(() => {
    closePeerConnection()

    // Step 1: Create a native RTCPeerConnection for the matched stranger.
    const peerConnection = new RTCPeerConnection(peerConnectionConfig)
    peerConnectionRef.current = peerConnection

    // Step 2: Add already-granted local camera and microphone tracks to the peer connection.
    localStreamRef.current?.getTracks().forEach((track) => {
      const stream = localStreamRef.current

      if (stream) {
        peerConnection.addTrack(track, stream)
      }
    })

    // Step 3: Send ICE candidates to the matched peer through FastAPI WebSocket signaling.
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    // Step 4: Render the remote media stream when the peer's tracks arrive.
    peerConnection.ontrack = (event) => {
      const [nextRemoteStream] = event.streams

      if (nextRemoteStream) {
        setRemoteStream(nextRemoteStream)
      }
    }

    // Step 5: Reflect native WebRTC connection state in the waiting room UI.
    peerConnection.onconnectionstatechange = () => {
      const nextState = peerConnection.connectionState

      if (nextState === 'connected') {
        setSignalingStatus('connected')
      } else if (nextState === 'connecting' || nextState === 'new') {
        setSignalingStatus('connecting')
      } else if (nextState === 'disconnected' || nextState === 'closed') {
        setSignalingStatus('disconnected')
      } else if (nextState === 'failed') {
        setSignalingStatus('failed')
      }
    }

    return peerConnection
  }, [closePeerConnection, sendMessage])

  const handleMatched = useCallback(
    async (message: Extract<SignalingMessage, { type: 'matched' }>) => {
      setSignalingStatus('matched')
      setIsSearching(false)
      setErrorMessage(null)

      const peerConnection = createPeerConnection()

      // Step 6: The backend chooses one peer to create the SDP offer to avoid glare.
      if (message.should_create_offer) {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        sendMessage({
          type: 'offer',
          sdp: offer,
        })
      }
    },
    [createPeerConnection, sendMessage],
  )

  const handleOffer = useCallback(
    async (message: Extract<SignalingMessage, { type: 'offer' }>) => {
      const peerConnection = peerConnectionRef.current ?? createPeerConnection()

      // Step 7: Accept the remote SDP offer and respond with a native SDP answer.
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
      await applyPendingIceCandidates(peerConnection)

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      sendMessage({
        type: 'answer',
        sdp: answer,
      })
    },
    [applyPendingIceCandidates, createPeerConnection, sendMessage],
  )

  const handleAnswer = useCallback(
    async (message: Extract<SignalingMessage, { type: 'answer' }>) => {
      const peerConnection = peerConnectionRef.current

      // Step 8: Complete offer negotiation by applying the remote SDP answer.
      if (peerConnection && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
        await applyPendingIceCandidates(peerConnection)
      }
    },
    [applyPendingIceCandidates],
  )

  const handleIceCandidate = useCallback(
    async (message: Extract<SignalingMessage, { type: 'ice-candidate' }>) => {
      const peerConnection = peerConnectionRef.current

      // Step 9: Add ICE candidates received from the peer through the signaling server.
      if (peerConnection?.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
      } else {
        pendingIceCandidatesRef.current.push(message.candidate)
      }
    },
    [],
  )

  const handleMessage = useCallback(
    async (message: SignalingMessage) => {
      try {
        if (message.type === 'waiting') {
          setSignalingStatus('waiting')
          return
        }

        if (message.type === 'matched') {
          await handleMatched(message)
          return
        }

        if (message.type === 'offer') {
          await handleOffer(message)
          return
        }

        if (message.type === 'answer') {
          await handleAnswer(message)
          return
        }

        if (message.type === 'ice-candidate') {
          await handleIceCandidate(message)
          return
        }

        if (message.type === 'peer-disconnected') {
          closePeerConnection()
          setSignalingStatus('disconnected')
          setIsSearching(false)
          return
        }

        if (message.type === 'error') {
          setErrorMessage(message.message)
          setSignalingStatus('failed')
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'WebRTC signaling failed.')
        setSignalingStatus('failed')
      }
    },
    [closePeerConnection, handleAnswer, handleIceCandidate, handleMatched, handleOffer],
  )

  const findStranger = useCallback(() => {
    if (!localStreamRef.current) {
      setErrorMessage('Camera and microphone access are required before searching.')
      return
    }

    setErrorMessage(null)
    setIsSearching(true)
    setSignalingStatus('connecting')
    closePeerConnection()

    // Step 10: Connect to the existing FastAPI WebSocket signaling endpoint.
    const websocket = new WebSocket(getSignalingUrl())
    websocketRef.current?.close()
    websocketRef.current = websocket

    websocket.onopen = () => {
      sendMessage({ type: 'find-stranger' })
    }

    websocket.onmessage = (event) => {
      void handleMessage(JSON.parse(event.data) as SignalingMessage)
    }

    websocket.onerror = () => {
      setErrorMessage('Unable to connect to the signaling server.')
      setIsSearching(false)
      setSignalingStatus('failed')
    }

    websocket.onclose = () => {
      setIsSearching(false)
      setSignalingStatus((currentStatus) => (currentStatus === 'connected' ? 'disconnected' : currentStatus))
    }
  }, [closePeerConnection, handleMessage, sendMessage])

  useEffect(() => {
    return () => {
      websocketRef.current?.close()
      closePeerConnection()
    }
  }, [closePeerConnection])

  return {
    errorMessage,
    findStranger,
    isSearching,
    remoteStream,
    signalingStatus,
  }
}
