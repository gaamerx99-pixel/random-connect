export type SignalingConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'matched'
  | 'connected'
  | 'disconnected'
  | 'failed'

export type SignalingMessage =
  | {
      type: 'connected'
      client_id: string
    }
  | {
      type: 'waiting'
      client_id: string
    }
  | {
      type: 'matched'
      client_id: string
      peer_id: string
      room_id: string
      should_create_offer: boolean
    }
  | {
      type: 'offer'
      sdp: RTCSessionDescriptionInit
      from?: string
    }
  | {
      type: 'answer'
      sdp: RTCSessionDescriptionInit
      from?: string
    }
  | {
      type: 'ice-candidate'
      candidate: RTCIceCandidateInit
      from?: string
    }
  | {
      type: 'peer-disconnected'
      peer_id: string
    }
  | {
      type: 'chat-message'
      text: string
      from?: string
      timestamp?: string
    }
  | {
      type: 'error'
      message: string
    }

export type ChatMessageItem = {
  id: string
  sender: 'me' | 'stranger'
  text: string
  timestamp: string
}
