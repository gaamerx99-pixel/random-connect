import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { getSignalingUrl } from '../../services/signaling/signalingClient'
import type { ChatMessageItem, SignalingConnectionStatus } from '../../types/signaling'

export interface PeerProfile {
  clerk_id: string
  name: string
  gender: string
  age: number
  country: string
  image?: string
}

type WebRtcSignalingState = {
  chatMessages: ChatMessageItem[]
  errorMessage: string | null
  findStranger: () => void
  isSearching: boolean
  leaveRoom: () => void
  peerProfile: PeerProfile | null
  remoteStream: MediaStream | null
  sendChatMessage: (text: string) => void
  signalingStatus: SignalingConnectionStatus
  skipStranger: () => void
}

const peerConnectionConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function useWebRtcSignaling(localStream: MediaStream | null): WebRtcSignalingState {
  const { user } = useUser()
  const localStreamRef = useRef<MediaStream | null>(localStream)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const websocketRef = useRef<WebSocket | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [peerProfile, setPeerProfile] = useState<PeerProfile | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [signalingStatus, setSignalingStatus] = useState<SignalingConnectionStatus>('idle')

  useEffect(() => {
    localStreamRef.current = localStream
    const peerConnection = peerConnectionRef.current
    if (peerConnection && localStream) {
      const videoTrack = localStream.getVideoTracks()[0] ?? null
      const senders = peerConnection.getSenders()
      const videoSender = senders.find((s) => s.track?.kind === 'video' || (s.track === null && s.kind === 'video'))
      if (videoSender) {
        void videoSender.replaceTrack(videoTrack)
      } else if (videoTrack) {
        peerConnection.addTrack(videoTrack, localStream)
      }
    }
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
    setPeerProfile(null)
  }, [])

  const applyPendingIceCandidates = useCallback(async (peerConnection: RTCPeerConnection) => {
    const pendingCandidates = pendingIceCandidatesRef.current
    pendingIceCandidatesRef.current = []

    await Promise.all(
      pendingCandidates.map((candidate) => peerConnection.addIceCandidate(new RTCIceCandidate(candidate))),
    )
  }, [])

  const createPeerConnection = useCallback(() => {
    closePeerConnection()

    const peerConnection = new RTCPeerConnection(peerConnectionConfig)
    peerConnectionRef.current = peerConnection

    localStreamRef.current?.getTracks().forEach((track) => {
      const stream = localStreamRef.current
      if (stream) {
        peerConnection.addTrack(track, stream)
      }
    })

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    peerConnection.ontrack = (event) => {
      const [nextRemoteStream] = event.streams
      if (nextRemoteStream) {
        setRemoteStream(nextRemoteStream)
      }
    }

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
    async (message: any) => {
      setSignalingStatus('matched')
      setIsSearching(false)
      setErrorMessage(null)
      setChatMessages([])

      if (message.peer_profile) {
        setPeerProfile(message.peer_profile)
      }

      const peerConnection = createPeerConnection()

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
    async (message: any) => {
      const peerConnection = peerConnectionRef.current ?? createPeerConnection()

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
    async (message: any) => {
      const peerConnection = peerConnectionRef.current

      if (peerConnection && !peerConnection.currentRemoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp))
        await applyPendingIceCandidates(peerConnection)
      }
    },
    [applyPendingIceCandidates],
  )

  const handleIceCandidate = useCallback(
    async (message: any) => {
      const peerConnection = peerConnectionRef.current
      if (peerConnection?.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
      } else {
        pendingIceCandidatesRef.current.push(message.candidate)
      }
    },
    [],
  )

  const handleMessage = useCallback(
    async (message: any) => {
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

        if (message.type === 'chat-message') {
          const newItem: ChatMessageItem = {
            id: String(Date.now() + Math.random()),
            sender: 'stranger',
            text: message.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setChatMessages((prev) => [...prev, newItem])
          return
        }

        if (message.type === 'peer-disconnected') {
          closePeerConnection()
          setSignalingStatus('disconnected')
          setIsSearching(false)
          setChatMessages((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              sender: 'stranger',
              text: '— Stranger disconnected —',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
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

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return
      const trimmed = text.trim()
      sendMessage({
        type: 'chat-message',
        text: trimmed,
      })

      const newItem: ChatMessageItem = {
        id: String(Date.now() + Math.random()),
        sender: 'me',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChatMessages((prev) => [...prev, newItem])
    },
    [sendMessage],
  )

  const skipStranger = useCallback(() => {
    closePeerConnection()
    setChatMessages([])
    setIsSearching(true)
    setSignalingStatus('waiting')
    sendMessage({ type: 'skip' })
  }, [closePeerConnection, sendMessage])

  const leaveRoom = useCallback(() => {
    closePeerConnection()
    setChatMessages([])
    setIsSearching(false)
    setSignalingStatus('idle')
    sendMessage({ type: 'leave' })
    websocketRef.current?.close()
  }, [closePeerConnection, sendMessage])

  const handleMessageRef = useRef(handleMessage)
  useEffect(() => {
    handleMessageRef.current = handleMessage
  }, [handleMessage])

  const findStranger = useCallback(() => {
    if (!localStreamRef.current) {
      setErrorMessage('Camera and microphone access are required before searching.')
      return
    }

    setErrorMessage(null)
    setIsSearching(true)
    setSignalingStatus('connecting')
    setChatMessages([])
    closePeerConnection()

    const websocket = new WebSocket(getSignalingUrl())
    websocketRef.current?.close()
    websocketRef.current = websocket

    websocket.onopen = () => {
      if (user?.id) {
        sendMessage({ type: 'auth-sync', clerk_id: user.id })
      }
      sendMessage({ type: 'find-stranger' })
    }

    websocket.onmessage = (event) => {
      void handleMessageRef.current(JSON.parse(event.data))
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
  }, [closePeerConnection, sendMessage, user])

  useEffect(() => {
    return () => {
      websocketRef.current?.close()
      closePeerConnection()
    }
  }, [closePeerConnection])

  return {
    chatMessages,
    errorMessage,
    findStranger,
    isSearching,
    leaveRoom,
    peerProfile,
    remoteStream,
    sendChatMessage,
    signalingStatus,
    skipStranger,
  }
}
