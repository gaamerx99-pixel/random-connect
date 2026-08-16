import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { getSignalingUrl } from '../../services/signaling/signalingClient'
import type {
  ChatMessageItem,
  SignalingConnectionStatus,
} from '../../types/signaling'

export interface PeerProfile {
  clerk_id: string
  name: string
  gender: string
  age: number
  country: string
  image?: string
  city?: string
  interests?: string[]
}

export type WebRtcSignalingState = {
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
  searchSeconds: number
  timeoutLimit: number
  setTimeoutLimit: (seconds: number) => void
  isTimedOut: boolean
  startTestMatch: () => void
  isTestMode: boolean
}

// Generate a unique session identifier for guest / multi-tab matching
function getGuestSessionId(): string {
  try {
    let id = sessionStorage.getItem('rc_guest_session_id')
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10)
      sessionStorage.setItem('rc_guest_session_id', id)
    }
    return id
  } catch {
    return 'guest_' + Math.random().toString(36).substring(2, 10)
  }
}

// Create a synthetic animated video stream for simulated bot testing
function createSimulatedMediaStream(profileName: string, avatarUrl?: string): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')

  let frame = 0
  let imgLoaded = false
  const img = new Image()
  img.crossOrigin = 'anonymous'
  if (avatarUrl) {
    img.src = avatarUrl
    img.onload = () => { imgLoaded = true }
  }

  function draw() {
    if (!ctx) return
    frame++

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 640, 480)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e1b4b')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 640, 480)

    // Animated glow circle
    const radius = 90 + Math.sin(frame * 0.05) * 8
    ctx.save()
    ctx.beginPath()
    ctx.arc(320, 200, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.8)'
    ctx.stroke()
    ctx.restore()

    // Avatar image or initials
    if (imgLoaded) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(320, 200, 80, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, 240, 120, 160, 160)
      ctx.restore()
    } else {
      ctx.save()
      ctx.fillStyle = '#4f46e5'
      ctx.beginPath()
      ctx.arc(320, 200, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(profileName.charAt(0).toUpperCase() || 'S', 320, 200)
      ctx.restore()
    }

    // Name text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(profileName, 320, 320)

    // Live Badge
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(280, 360, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Live Simulated Stranger (Test Mode)', 295, 365)

    requestAnimationFrame(draw)
  }

  draw()

  const canvasStream = canvas.captureStream(30)

  // Add dummy silent audio track
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    gain.gain.value = 0 // silent
    osc.connect(gain)
    const dst = audioCtx.createMediaStreamDestination()
    gain.connect(dst)
    osc.start()
    const audioTrack = dst.stream.getAudioTracks()[0]
    if (audioTrack) {
      canvasStream.addTrack(audioTrack)
    }
  } catch (e) {
    console.warn('AudioContext not supported for test stream', e)
  }

  return canvasStream
}


const peerConnectionConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

export function useWebRtcSignaling(
  localStream: MediaStream | null,
): WebRtcSignalingState {
  const { user } = useUser()

  // ============================================================
  // REFS
  // ============================================================

  const localStreamRef = useRef<MediaStream | null>(
    localStream,
  )

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(null)

  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>([])

  const websocketRef =
    useRef<WebSocket | null>(null)

  const handleMessageRef =
    useRef<(message: any) => Promise<void>>(
      async () => {},
    )

  const websocketGenerationRef =
    useRef(0)

  // ============================================================
  // STATE
  // ============================================================

  const [chatMessages, setChatMessages] = useState<
    ChatMessageItem[]
  >([])

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [isSearching, setIsSearching] =
    useState(false)

  const [peerProfile, setPeerProfile] =
    useState<PeerProfile | null>(null)

  const [remoteStream, setRemoteStream] =
    useState<MediaStream | null>(null)

  const [signalingStatus, setSignalingStatus] =
    useState<SignalingConnectionStatus>('idle')

  const [searchSeconds, setSearchSeconds] = useState(0)
  const [timeoutLimit, setTimeoutLimit] = useState(30) // default 30s
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)
  const botReplyTimerRef = useRef<any>(null)

  // ============================================================
  // SEARCH TIMER (30s / 1m auto timeout)
  // ============================================================

  useEffect(() => {
    let interval: any = null

    if (isSearching && !isTestMode && (signalingStatus === 'waiting' || signalingStatus === 'connecting')) {
      interval = setInterval(() => {
        setSearchSeconds((prev) => {
          const next = prev + 1
          if (next >= timeoutLimit) {
            setIsTimedOut(true)
          }
          return next
        })
      }, 1000)
    } else {
      setSearchSeconds(0)
      if (signalingStatus === 'connected' || signalingStatus === 'matched') {
        setIsTimedOut(false)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSearching, isTestMode, signalingStatus, timeoutLimit])


  // ============================================================
  // LOCAL MEDIA
  // ============================================================

  useEffect(() => {
    localStreamRef.current = localStream

    const peerConnection =
      peerConnectionRef.current

    if (!peerConnection || !localStream) {
      return
    }

    const videoTrack =
      localStream.getVideoTracks()[0] ?? null

    const audioTrack =
      localStream.getAudioTracks()[0] ?? null

    const senders =
      peerConnection.getSenders()

    // ------------------------------
    // Video
    // ------------------------------

    const videoSender = senders.find(
      (sender) =>
        sender.track?.kind === 'video',
    )

    if (videoSender) {
      void videoSender.replaceTrack(
        videoTrack,
      )
    } else if (videoTrack) {
      peerConnection.addTrack(
        videoTrack,
        localStream,
      )
    }

    // ------------------------------
    // Audio
    // ------------------------------

    const audioSender = senders.find(
      (sender) =>
        sender.track?.kind === 'audio',
    )

    if (audioSender) {
      void audioSender.replaceTrack(
        audioTrack,
      )
    } else if (audioTrack) {
      peerConnection.addTrack(
        audioTrack,
        localStream,
      )
    }
  }, [localStream])

  // ============================================================
  // STOP LOCAL MEDIA
  // ============================================================

  const stopLocalMedia =
    useCallback(() => {
      const stream =
        localStreamRef.current

      if (!stream) {
        return
      }

      console.log(
        '[Media] Stopping local camera and microphone...',
      )

      stream.getTracks().forEach(
        (track) => {
          try {
            track.stop()
          } catch {
            // Ignore already stopped tracks.
          }
        },
      )

      localStreamRef.current = null
    }, [])

  // ============================================================
  // SEND WEBSOCKET MESSAGE
  // ============================================================

  const sendMessage = useCallback(
    (message: object) => {
      const websocket =
        websocketRef.current

      if (
        websocket &&
        websocket.readyState ===
          WebSocket.OPEN
      ) {
        websocket.send(
          JSON.stringify(message),
        )

        return true
      }

      return false
    },
    [],
  )

  // ============================================================
  // CLOSE PEER CONNECTION
  // ============================================================

  const closePeerConnection =
    useCallback(() => {
      const peerConnection =
        peerConnectionRef.current

      if (peerConnection) {
        peerConnection.onicecandidate =
          null

        peerConnection.ontrack =
          null

        peerConnection.onconnectionstatechange =
          null

        peerConnection.oniceconnectionstatechange =
          null

        try {
          peerConnection.close()
        } catch {
          // Ignore already closed peer connection.
        }
      }

      peerConnectionRef.current =
        null

      pendingIceCandidatesRef.current =
        []

      setRemoteStream(null)
      setPeerProfile(null)
    }, [])

  // ============================================================
  // APPLY PENDING ICE CANDIDATES
  // ============================================================

  const applyPendingIceCandidates =
    useCallback(
      async (
        peerConnection: RTCPeerConnection,
      ) => {
        if (
          !peerConnection.remoteDescription
        ) {
          return
        }

        const pendingCandidates =
          pendingIceCandidatesRef.current

        pendingIceCandidatesRef.current =
          []

        for (
          const candidate of pendingCandidates
        ) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            )
          } catch (error) {
            console.warn(
              'Failed to apply ICE candidate:',
              error,
            )
          }
        }
      },
      [],
    )

  // ============================================================
  // CREATE / GET PEER CONNECTION
  // ============================================================

  const createPeerConnection =
    useCallback(() => {
      const existing =
        peerConnectionRef.current

      if (existing) {
        return existing
      }

      const peerConnection =
        new RTCPeerConnection(
          peerConnectionConfig,
        )

      peerConnectionRef.current =
        peerConnection

      // --------------------------------------------------------
      // Add local tracks
      // --------------------------------------------------------

      const stream =
        localStreamRef.current

      if (stream) {
        stream
          .getTracks()
          .forEach((track) => {
            peerConnection.addTrack(
              track,
              stream,
            )
          })
      }

      // --------------------------------------------------------
      // ICE candidate
      // --------------------------------------------------------

      peerConnection.onicecandidate = (
        event,
      ) => {
        if (!event.candidate) {
          return
        }

        sendMessage({
          type: 'ice-candidate',
          candidate:
            event.candidate.toJSON(),
        })
      }

      // --------------------------------------------------------
      // Remote track
      // --------------------------------------------------------

      peerConnection.ontrack = (
        event,
      ) => {
        const streamFromEvent =
          event.streams[0]

        if (streamFromEvent) {
          setRemoteStream(
            streamFromEvent,
          )

          return
        }

        setRemoteStream((current) => {
          const stream =
            current ??
            new MediaStream()

          if (
            !stream
              .getTracks()
              .some(
                (track) =>
                  track.id ===
                  event.track.id,
              )
          ) {
            stream.addTrack(
              event.track,
            )
          }

          return stream
        })
      }

      // --------------------------------------------------------
      // Connection state
      // --------------------------------------------------------

      peerConnection.onconnectionstatechange =
        () => {
          const state =
            peerConnection.connectionState

          console.log(
            '[WebRTC] connectionState:',
            state,
          )

          if (
            state === 'connected'
          ) {
            setSignalingStatus(
              'connected',
            )

            setErrorMessage(null)
            setIsSearching(false)
          } else if (
            state === 'connecting' ||
            state === 'new'
          ) {
            setSignalingStatus(
              'connecting',
            )
          } else if (
            state === 'disconnected'
          ) {
            setSignalingStatus(
              'disconnected',
            )
          } else if (
            state === 'failed'
          ) {
            setSignalingStatus(
              'failed',
            )

            setErrorMessage(
              'WebRTC connection failed. Please try another stranger.',
            )
          } else if (
            state === 'closed'
          ) {
            setSignalingStatus(
              'disconnected',
            )
          }
        }

      // --------------------------------------------------------
      // ICE connection state
      // --------------------------------------------------------

      peerConnection.oniceconnectionstatechange =
        () => {
          console.log(
            '[WebRTC] iceConnectionState:',
            peerConnection.iceConnectionState,
          )

          if (
            peerConnection.iceConnectionState ===
            'failed'
          ) {
            console.warn(
              '[WebRTC] ICE connection failed.',
            )

            setSignalingStatus(
              'failed',
            )
          }
        }

      return peerConnection
    }, [sendMessage])

  // ============================================================
  // MATCHED
  // ============================================================

  const handleMatched =
    useCallback(
      async (message: any) => {
        console.log(
          '[Signaling] Matched:',
          message,
        )

        setSignalingStatus('matched')
        setIsSearching(false)
        setErrorMessage(null)
        setChatMessages([])

        if (message.peer_profile) {
          setPeerProfile(
            message.peer_profile,
          )
        }

        const peerConnection =
          createPeerConnection()

        if (
          message.should_create_offer
        ) {
          try {
            console.log(
              '[WebRTC] Creating offer...',
            )

            const offer =
              await peerConnection.createOffer(
                {
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true,
                },
              )

            await peerConnection.setLocalDescription(
              offer,
            )

            console.log(
              '[WebRTC] Sending offer...',
            )

            sendMessage({
              type: 'offer',
              sdp: offer,
            })
          } catch (error) {
            console.error(
              '[WebRTC] Offer creation failed:',
              error,
            )

            setErrorMessage(
              error instanceof Error
                ? error.message
                : 'Failed to create video offer.',
            )

            setSignalingStatus(
              'failed',
            )
          }
        }
      },
      [
        createPeerConnection,
        sendMessage,
      ],
    )

  // ============================================================
  // OFFER
  // ============================================================

  const handleOffer =
    useCallback(
      async (message: any) => {
        console.log(
          '[WebRTC] Offer received.',
        )

        try {
          const peerConnection =
            createPeerConnection()

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              message.sdp,
            ),
          )

          await applyPendingIceCandidates(
            peerConnection,
          )

          const answer =
            await peerConnection.createAnswer(
              {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              },
            )

          await peerConnection.setLocalDescription(
            answer,
          )

          console.log(
            '[WebRTC] Sending answer...',
          )

          sendMessage({
            type: 'answer',
            sdp: answer,
          })
        } catch (error) {
          console.error(
            '[WebRTC] Offer handling failed:',
            error,
          )

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Failed to process video offer.',
          )

          setSignalingStatus(
            'failed',
          )
        }
      },
      [
        applyPendingIceCandidates,
        createPeerConnection,
        sendMessage,
      ],
    )

  // ============================================================
  // ANSWER
  // ============================================================

  const handleAnswer =
    useCallback(
      async (message: any) => {
        console.log(
          '[WebRTC] Answer received.',
        )

        try {
          const peerConnection =
            peerConnectionRef.current

          if (!peerConnection) {
            console.warn(
              '[WebRTC] No peer connection for answer.',
            )

            return
          }

          if (
            peerConnection.currentRemoteDescription
          ) {
            return
          }

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              message.sdp,
            ),
          )

          await applyPendingIceCandidates(
            peerConnection,
          )
        } catch (error) {
          console.error(
            '[WebRTC] Answer handling failed:',
            error,
          )

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Failed to process video answer.',
          )

          setSignalingStatus(
            'failed',
          )
        }
      },
      [applyPendingIceCandidates],
    )

  // ============================================================
  // ICE CANDIDATE
  // ============================================================

  const handleIceCandidate =
    useCallback(
      async (message: any) => {
        if (
          !message.candidate
        ) {
          return
        }

        const peerConnection =
          peerConnectionRef.current

        if (
          !peerConnection ||
          !peerConnection.remoteDescription
        ) {
          pendingIceCandidatesRef.current.push(
            message.candidate,
          )

          return
        }

        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(
              message.candidate,
            ),
          )
        } catch (error) {
          console.warn(
            '[WebRTC] Failed to add ICE candidate:',
            error,
          )
        }
      },
      [],
    )

  // ============================================================
  // INCOMING MESSAGE HANDLER
  // ============================================================

  const handleMessage =
    useCallback(
      async (message: any) => {
        try {
          console.log(
            '[Signaling] Received:',
            message,
          )

          // ----------------------------------------------------
          // Connected
          // ----------------------------------------------------

          if (
            message.type ===
            'connected'
          ) {
            console.log(
              '[Signaling] WebSocket connected:',
              message.client_id,
            )

            return
          }

          // ----------------------------------------------------
          // Auth synced
          // ----------------------------------------------------

          if (
            message.type ===
            'auth-synced'
          ) {
            console.log(
              '[Signaling] Auth synced:',
              message.clerk_id,
            )

            return
          }

          // ----------------------------------------------------
          // Waiting
          // ----------------------------------------------------

          if (
            message.type ===
            'waiting'
          ) {
            setSignalingStatus(
              'waiting',
            )

            setIsSearching(true)

            return
          }

          // ----------------------------------------------------
          // Matched
          // ----------------------------------------------------

          if (
            message.type ===
            'matched'
          ) {
            await handleMatched(
              message,
            )

            return
          }

          // ----------------------------------------------------
          // Offer
          // ----------------------------------------------------

          if (
            message.type ===
            'offer'
          ) {
            await handleOffer(
              message,
            )

            return
          }

          // ----------------------------------------------------
          // Answer
          // ----------------------------------------------------

          if (
            message.type ===
            'answer'
          ) {
            await handleAnswer(
              message,
            )

            return
          }

          // ----------------------------------------------------
          // ICE
          // ----------------------------------------------------

          if (
            message.type ===
            'ice-candidate'
          ) {
            await handleIceCandidate(
              message,
            )

            return
          }

          // ----------------------------------------------------
          // Chat
          // ----------------------------------------------------

          if (
            message.type ===
            'chat-message'
          ) {
            const newItem: ChatMessageItem =
              {
                id: String(
                  Date.now() +
                    Math.random(),
                ),

                sender:
                  'stranger',

                text:
                  message.text,

                timestamp:
                  new Date().toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  ),
              }

            setChatMessages(
              (previous) => [
                ...previous,
                newItem,
              ],
            )

            return
          }

          // ----------------------------------------------------
          // Peer disconnected
          // ----------------------------------------------------

          if (
            message.type ===
            'peer-disconnected'
          ) {
            console.log(
              '[Signaling] Peer disconnected.',
            )

            closePeerConnection()

            setSignalingStatus(
              'disconnected',
            )

            setIsSearching(false)

            setChatMessages(
              (previous) => [
                ...previous,
                {
                  id: String(
                    Date.now(),
                  ),

                  sender:
                    'stranger',

                  text:
                    '— Stranger disconnected —',

                  timestamp:
                    new Date().toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    ),
                },
              ],
            )

            return
          }

          // ----------------------------------------------------
          // Backend error
          // ----------------------------------------------------

          if (
            message.type ===
            'error'
          ) {
            console.error(
              '[Signaling] Server error:',
              message.message,
            )

            setErrorMessage(
              message.message ||
                'Signaling server error.',
            )

            setIsSearching(false)

            setSignalingStatus(
              'failed',
            )

            return
          }
        } catch (error) {
          console.error(
            '[Signaling] Message handling failed:',
            error,
          )

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'WebRTC signaling failed.',
          )

          setSignalingStatus(
            'failed',
          )
        }
      },
      [
        closePeerConnection,
        handleAnswer,
        handleIceCandidate,
        handleMatched,
        handleOffer,
      ],
    )

  // ============================================================
  // KEEP LATEST MESSAGE HANDLER
  // ============================================================

  useEffect(() => {
    handleMessageRef.current =
      handleMessage
  }, [handleMessage])

  // ============================================================
  // SIMULATED TEST MATCH (SOLO TESTING MODE)
  // ============================================================

  const SIMULATED_PROFILES: PeerProfile[] = [
    {
      clerk_id: 'mock_sim_1',
      name: 'Riya Sharma',
      gender: 'female',
      age: 22,
      country: 'India',
      city: 'Mumbai',
      interests: ['Music', 'Travel', 'Photography'],
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerk_id: 'mock_sim_2',
      name: 'Aarav Patel',
      gender: 'male',
      age: 24,
      country: 'India',
      city: 'Ahmedabad',
      interests: ['Tech', 'Gaming', 'Coding'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerk_id: 'mock_sim_3',
      name: 'Sneha Verma',
      gender: 'female',
      age: 21,
      country: 'India',
      city: 'Delhi',
      interests: ['Dancing', 'Art', 'Movies'],
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerk_id: 'mock_sim_4',
      name: 'Rohit Mehta',
      gender: 'male',
      age: 25,
      country: 'India',
      city: 'Bengaluru',
      interests: ['Fitness', 'Startups', 'Cricket'],
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
  ]

  const BOT_REPLIES = [
    'Hey! How are you doing today?',
    'Nice to connect with you on RandomConnect!',
    'Your audio and video look crisp and smooth!',
    'Where are you connecting from?',
    'Haha, that sounds awesome! 😄',
    'Nice talking to you! The WebRTC test connection is working perfectly.',
  ]

  const startTestMatch = useCallback(() => {
    console.log('[Signaling] Starting simulated test match...')
    closePeerConnection()

    // Pick random simulated profile
    const randomProfile = SIMULATED_PROFILES[Math.floor(Math.random() * SIMULATED_PROFILES.length)]
    const mockStream = createSimulatedMediaStream(randomProfile.name, randomProfile.image)

    setIsTestMode(true)
    setIsSearching(false)
    setIsTimedOut(false)
    setErrorMessage(null)
    setPeerProfile(randomProfile)
    setRemoteStream(mockStream)
    setSignalingStatus('connected')

    // Initial greeting in chat
    const initialGreeting: ChatMessageItem = {
      id: String(Date.now()),
      sender: 'stranger',
      text: `Hello! I'm ${randomProfile.name} from ${randomProfile.city}, ${randomProfile.country}. Nice to meet you! 👋`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages([initialGreeting])
  }, [closePeerConnection])

  // ============================================================
  // CHAT
  // ============================================================

  const sendChatMessage =
    useCallback(
      (text: string) => {
        const trimmed =
          text.trim()

        if (!trimmed) {
          return
        }

        const newItem: ChatMessageItem =
          {
            id: String(
              Date.now() +
                Math.random(),
            ),

            sender: 'me',

            text: trimmed,

            timestamp:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              ),
          }

        setChatMessages(
          (previous) => [
            ...previous,
            newItem,
          ],
        )

        // Handle Test Mode Bot Reply
        if (isTestMode) {
          if (botReplyTimerRef.current) clearTimeout(botReplyTimerRef.current)
          botReplyTimerRef.current = setTimeout(() => {
            const randomReply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]
            const botItem: ChatMessageItem = {
              id: String(Date.now() + Math.random()),
              sender: 'stranger',
              text: randomReply,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
            setChatMessages((prev) => [...prev, botItem])
          }, 1200)
          return
        }

        const sent =
          sendMessage({
            type: 'chat-message',
            text: trimmed,
          })

        if (!sent) {
          setErrorMessage(
            'Chat connection is not available.',
          )
        }
      },
      [isTestMode, sendMessage],
    )

  // ============================================================
  // SKIP STRANGER
  // ============================================================

  const skipStranger =
    useCallback(() => {
      console.log(
        '[Signaling] Skipping stranger...',
      )

      if (botReplyTimerRef.current) {
        clearTimeout(botReplyTimerRef.current)
      }

      closePeerConnection()
      setChatMessages([])
      setPeerProfile(null)

      if (isTestMode) {
        // In test mode, switch to another test profile seamlessly
        const randomProfile = SIMULATED_PROFILES[Math.floor(Math.random() * SIMULATED_PROFILES.length)]
        const mockStream = createSimulatedMediaStream(randomProfile.name, randomProfile.image)
        setPeerProfile(randomProfile)
        setRemoteStream(mockStream)
        setChatMessages([
          {
            id: String(Date.now()),
            sender: 'stranger',
            text: `Hey! I am ${randomProfile.name} from ${randomProfile.city}. How's it going? ✨`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
        return
      }

      setIsSearching(true)
      setIsTimedOut(false)
      setSearchSeconds(0)

      setSignalingStatus(
        'waiting',
      )

      sendMessage({
        type: 'skip',
      })
    }, [
      closePeerConnection,
      isTestMode,
      sendMessage,
    ])

  // ============================================================
  // LEAVE ROOM
  // ============================================================

  const leaveRoom =
    useCallback(() => {
      console.log(
        '[Signaling] Leaving room...',
      )

      if (botReplyTimerRef.current) {
        clearTimeout(botReplyTimerRef.current)
      }

      sendMessage({
        type: 'leave',
      })

      closePeerConnection()

      // IMPORTANT:
      // End call = stop camera + microphone.
      stopLocalMedia()

      setChatMessages([])
      setIsSearching(false)
      setIsTestMode(false)
      setIsTimedOut(false)
      setSearchSeconds(0)

      setSignalingStatus(
        'idle',
      )

      const websocket =
        websocketRef.current

      websocketRef.current =
        null

      if (websocket) {
        try {
          websocket.close()
        } catch {
          // Ignore close errors.
        }
      }
    }, [
      closePeerConnection,
      sendMessage,
      stopLocalMedia,
    ])

  // ============================================================
  // FIND STRANGER
  // ============================================================

  const findStranger =
    useCallback(() => {
      const stream =
        localStreamRef.current

      if (!stream) {
        setErrorMessage(
          'Camera and microphone access are required before searching.',
        )

        return
      }

      console.log(
        '[Signaling] Starting matchmaking...',
      )

      if (botReplyTimerRef.current) {
        clearTimeout(botReplyTimerRef.current)
      }

      // --------------------------------------------------------
      // Reset current state
      // --------------------------------------------------------

      setErrorMessage(null)
      setChatMessages([])
      setPeerProfile(null)
      setRemoteStream(null)
      setIsTestMode(false)
      setIsTimedOut(false)
      setSearchSeconds(0)
      setIsSearching(true)

      setSignalingStatus(
        'connecting',
      )

      closePeerConnection()

      // --------------------------------------------------------
      // Close old WebSocket
      // --------------------------------------------------------

      const oldWebsocket =
        websocketRef.current

      if (oldWebsocket) {
        try {
          oldWebsocket.close()
        } catch {
          // Ignore.
        }
      }

      websocketRef.current =
        null

      // --------------------------------------------------------
      // Create new WebSocket generation
      // --------------------------------------------------------

      websocketGenerationRef.current += 1

      const generation =
        websocketGenerationRef.current

      const websocket =
        new WebSocket(
          getSignalingUrl(),
        )

      websocketRef.current =
        websocket

      console.log(
        '[Signaling] Connecting to:',
        getSignalingUrl(),
      )

      // --------------------------------------------------------
      // OPEN
      // --------------------------------------------------------

      websocket.onopen = () => {
        if (
          websocketRef.current !==
          websocket
        ) {
          return
        }

        console.log(
          '[Signaling] WebSocket OPEN',
        )

        setSignalingStatus(
          'connecting',
        )

        const effectiveUserId = user?.id || getGuestSessionId()

        console.log(
          '[Signaling] Sending auth-sync:',
          effectiveUserId,
        )

        websocket.send(
          JSON.stringify({
            type: 'auth-sync',
            clerk_id: effectiveUserId,
          }),
        )

        console.log(
          '[Signaling] Sending find-stranger...',
        )

        websocket.send(
          JSON.stringify({
            type: 'find-stranger',
          }),
        )
      }

      // --------------------------------------------------------
      // MESSAGE
      // --------------------------------------------------------

      websocket.onmessage = (
        event,
      ) => {
        if (
          websocketRef.current !==
          websocket
        ) {
          return
        }

        try {
          const message =
            JSON.parse(
              event.data,
            )

          void handleMessageRef.current(
            message,
          )
        } catch (error) {
          console.error(
            '[Signaling] Invalid WebSocket message:',
            error,
            event.data,
          )
        }
      }

      // --------------------------------------------------------
      // ERROR
      // --------------------------------------------------------

      websocket.onerror = (
        event,
      ) => {
        if (
          websocketRef.current !==
            websocket ||
          generation !==
            websocketGenerationRef.current
        ) {
          return
        }

        console.error(
          '[Signaling] WebSocket ERROR:',
          event,
        )

        setErrorMessage(
          'Unable to connect to the signaling server.',
        )

        setIsSearching(false)

        setSignalingStatus(
          'failed',
        )
      }

      // --------------------------------------------------------
      // CLOSE
      // --------------------------------------------------------

      websocket.onclose = (
        event,
      ) => {
        if (
          websocketRef.current !==
            websocket ||
          generation !==
            websocketGenerationRef.current
        ) {
          return
        }

        console.log(
          '[Signaling] WebSocket CLOSED:',
          event.code,
          event.reason,
        )

        websocketRef.current =
          null

        setIsSearching(
          (current) =>
            current &&
            event.code !==
              1000
              ? false
              : current,
        )

        setSignalingStatus(
          (currentStatus) => {
            if (
              currentStatus ===
              'connected'
            ) {
              return 'disconnected'
            }

            if (
              currentStatus ===
              'idle'
            ) {
              return 'idle'
            }

            if (
              event.code ===
              1000
            ) {
              return 'idle'
            }

            return 'disconnected'
          },
        )
      }
    }, [
      closePeerConnection,
      user?.id,
    ])

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      console.log(
        '[Media] Cleaning up camera and microphone...',
      )

      if (botReplyTimerRef.current) {
        clearTimeout(botReplyTimerRef.current)
      }

      websocketGenerationRef.current += 1

      const websocket =
        websocketRef.current

      websocketRef.current =
        null

      if (websocket) {
        try {
          websocket.close()
        } catch {
          // Ignore.
        }
      }

      const peerConnection =
        peerConnectionRef.current

      peerConnectionRef.current =
        null

      if (peerConnection) {
        try {
          peerConnection.close()
        } catch {
          // Ignore.
        }
      }

      pendingIceCandidatesRef.current =
        []

      // Stop camera and microphone when
      // the hook/page is unmounted.
      const stream =
        localStreamRef.current

      if (stream) {
        stream.getTracks().forEach(
          (track) => {
            try {
              track.stop()
            } catch {
              // Ignore already stopped tracks.
            }
          },
        )
      }

      localStreamRef.current =
        null
    }
  }, [])

  // ============================================================
  // RETURN
  // ============================================================

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
    searchSeconds,
    timeoutLimit,
    setTimeoutLimit,
    isTimedOut,
    startTestMatch,
    isTestMode,
  }
}