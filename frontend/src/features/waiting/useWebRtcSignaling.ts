import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
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

export interface InCallReaction {
  id: string
  emoji: string
  sender: 'me' | 'peer'
  x: number
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
  rewardRequired: boolean
  rewardRequiredMessage: string | null
  clearRewardRequired: () => void
  reactions: InCallReaction[]
  sendReaction: (emoji: string) => void
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
  const { getToken } = useAuth()

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
  const [rewardRequired, setRewardRequired] = useState(false)
  const [rewardRequiredMessage, setRewardRequiredMessage] = useState<string | null>(null)
  const [reactions, setReactions] = useState<InCallReaction[]>([])

  const clearRewardRequired = useCallback(() => {
    setRewardRequired(false)
    setRewardRequiredMessage(null)
  }, [])

  // ============================================================
  // SEARCH TIMER (30s / 1m auto timeout)
  // ============================================================

  useEffect(() => {
    let interval: any = null

    if (isSearching && (signalingStatus === 'waiting' || signalingStatus === 'connecting')) {
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
  }, [isSearching, signalingStatus, timeoutLimit])


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
  // IN-CALL EMOJI REACTIONS
  // ============================================================

  const sendReaction = useCallback(
    (emoji: string) => {
      const reactionItem: InCallReaction = {
        id: String(Date.now() + Math.random()),
        emoji,
        sender: 'me',
        x: Math.floor(Math.random() * 60) + 20,
      }
      setReactions((prev) => [...prev.slice(-15), reactionItem])

      sendMessage({
        type: 'reaction',
        emoji,
      })
    },
    [sendMessage],
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
              '[Signaling] Authentication SUCCESS: synced clerk_id =',
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
          // Live In-Call Reaction
          // ----------------------------------------------------

          if (
            message.type === 'reaction'
          ) {
            const reactionItem: InCallReaction = {
              id: String(Date.now() + Math.random()),
              emoji: message.emoji || '❤️',
              sender: 'peer',
              x: Math.floor(Math.random() * 60) + 20,
            }
            setReactions((prev) => [...prev.slice(-15), reactionItem])
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
            'reward-required'
          ) {
            const rewardMsg =
              message.message ||
              'Watch 1 ad to connect with 1 female user.'

            setErrorMessage(rewardMsg)
            setRewardRequired(true)
            setRewardRequiredMessage(rewardMsg)

            setIsSearching(false)

            setSignalingStatus(
              'failed',
            )

            return
          }

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
      [sendMessage],
    )

  // ============================================================
  // SKIP STRANGER
  // ============================================================

  const skipStranger =
    useCallback(() => {
      console.log(
        '[Signaling] Skipping stranger...',
      )

      closePeerConnection()
      setChatMessages([])
      setPeerProfile(null)

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

      sendMessage({
        type: 'leave',
      })

      closePeerConnection()

      // IMPORTANT:
      // End call = stop camera + microphone.
      stopLocalMedia()

      setChatMessages([])
      setIsSearching(false)
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

      // --------------------------------------------------------
      // Reset current state
      // --------------------------------------------------------

      setErrorMessage(null)
      setChatMessages([])
      setPeerProfile(null)
      setRemoteStream(null)
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

      const wsUrl = getSignalingUrl()
      console.log(
        '[Signaling] Connecting to WebSocket URL:',
        wsUrl,
      )

      const websocket =
        new WebSocket(
          wsUrl,
        )

      websocketRef.current =
        websocket

      // --------------------------------------------------------
      // OPEN
      // --------------------------------------------------------

      websocket.onopen = async () => {
        if (
          websocketRef.current !==
          websocket
        ) {
          return
        }

        console.log(
          '[Signaling] WebSocket connection OPENED successfully to:',
          wsUrl,
        )

        setSignalingStatus(
          'connecting',
        )

        const effectiveUserId = user?.id || getGuestSessionId()
        const authToken = user?.id ? await getToken() : null

        console.log(
          '[Signaling] Sending auth-sync: user_id =',
          effectiveUserId,
          'hasAuthToken =',
          Boolean(authToken),
        )

        websocket.send(
          JSON.stringify({
            type: 'auth-sync',
            clerk_id: effectiveUserId,
            token: authToken,
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
          '[Signaling] WebSocket ERROR event triggered:',
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
          `[Signaling] WebSocket CLOSED: code = ${event.code}, reason = "${event.reason || 'none'}", clean = ${event.wasClean}`,
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
      getToken,
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
  // LEGACY / TEST MODE SHIM (REDIRECTS TO REAL MATCHMAKING)
  // ============================================================

  const findStrangerRef = useRef<() => void>(findStranger)
  useEffect(() => {
    findStrangerRef.current = findStranger
  }, [findStranger])

  const startTestMatch = useCallback(() => {
    console.log('[Signaling] Bot simulation disabled. Matching with real users...')
    if (findStrangerRef.current) {
      findStrangerRef.current()
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
    isTestMode: false,
    rewardRequired,
    rewardRequiredMessage,
    clearRewardRequired,
    reactions,
    sendReaction,
  }
}

