from collections import deque
from uuid import uuid4
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt
from app.db import users_collection
from app.config import CLERK_PEM_PUBLIC_KEY, JWT_ALGORITHM

router = APIRouter()

CLIENTS: dict[str, WebSocket] = {}
CLIENT_METADATA: dict[str, dict] = {}
WAITING_CLIENTS: deque[str] = deque()
PEERS: dict[str, str] = {}


async def send_json(client_id: str, payload: dict) -> None:
    websocket = CLIENTS.get(client_id)
    if websocket:
        try:
            await websocket.send_json(payload)
        except Exception:
            pass


def remove_from_waiting(client_id: str) -> None:
    try:
        WAITING_CLIENTS.remove(client_id)
    except ValueError:
        pass


def is_eligible_pair(user_a: dict, user_b: dict) -> bool:
    """Evaluate gender & block rules for a candidate pair."""
    clerk_a = user_a.get("clerk_id", "")
    clerk_b = user_b.get("clerk_id", "")

    # Block list check
    if clerk_b in user_a.get("blocked_users", []) or clerk_a in user_b.get("blocked_users", []):
        return False

    gender_a = user_a.get("gender", "male")
    looking_a = user_a.get("looking_for", "female")

    gender_b = user_b.get("gender", "female")
    looking_b = user_b.get("looking_for", "male")

    a_accepts_b = (looking_a == "anyone") or (looking_a == gender_b)
    b_accepts_a = (looking_b == "anyone") or (looking_b == gender_a)

    return a_accepts_b and b_accepts_a


async def match_waiting_clients() -> None:
    """Smart Queue Matchmaking Engine with Gender & Block Rules."""
    if len(WAITING_CLIENTS) < 2:
        return

    waiting_list = list(WAITING_CLIENTS)
    matched_pairs = []

    i = 0
    while i < len(waiting_list):
        client_a = waiting_list[i]
        if client_a not in CLIENTS:
            remove_from_waiting(client_a)
            waiting_list.pop(i)
            continue

        meta_a = CLIENT_METADATA.get(client_a, {})
        match_found = False

        j = i + 1
        while j < len(waiting_list):
            client_b = waiting_list[j]
            if client_b not in CLIENTS:
                remove_from_waiting(client_b)
                waiting_list.pop(j)
                continue

            meta_b = CLIENT_METADATA.get(client_b, {})

            if is_eligible_pair(meta_a, meta_b):
                matched_pairs.append((client_a, client_b))
                waiting_list.pop(j)
                waiting_list.pop(i)
                match_found = True
                break
            j += 1

        if not match_found:
            i += 1

    for client_a, client_b in matched_pairs:
        remove_from_waiting(client_a)
        remove_from_waiting(client_b)

        room_id = str(uuid4())
        PEERS[client_a] = client_b
        PEERS[client_b] = client_a

        meta_a = CLIENT_METADATA.get(client_a, {})
        meta_b = CLIENT_METADATA.get(client_b, {})

        await send_json(
            client_a,
            {
                "type": "matched",
                "client_id": client_a,
                "peer_id": client_b,
                "room_id": room_id,
                "should_create_offer": True,
                "peer_profile": {
                    "clerk_id": meta_b.get("clerk_id", ""),
                    "name": meta_b.get("name", "Stranger"),
                    "gender": meta_b.get("gender", ""),
                    "age": meta_b.get("age", 18),
                    "country": meta_b.get("country", ""),
                    "image": meta_b.get("image", ""),
                },
            },
        )
        await send_json(
            client_b,
            {
                "type": "matched",
                "client_id": client_b,
                "peer_id": client_a,
                "room_id": room_id,
                "should_create_offer": False,
                "peer_profile": {
                    "clerk_id": meta_a.get("clerk_id", ""),
                    "name": meta_a.get("name", "Stranger"),
                    "gender": meta_a.get("gender", ""),
                    "age": meta_a.get("age", 18),
                    "country": meta_a.get("country", ""),
                    "image": meta_a.get("image", ""),
                },
            },
        )


async def enqueue_client(client_id: str) -> None:
    if client_id in PEERS or client_id in WAITING_CLIENTS:
        return

    WAITING_CLIENTS.append(client_id)
    await send_json(
        client_id,
        {
            "type": "waiting",
            "client_id": client_id,
        },
    )
    await match_waiting_clients()


async def disconnect_peer(client_id: str, *, requeue_client: bool) -> None:
    remove_from_waiting(client_id)
    peer_id = PEERS.pop(client_id, None)

    if peer_id:
        PEERS.pop(peer_id, None)
        await send_json(
            peer_id,
            {
                "type": "peer-disconnected",
                "peer_id": client_id,
            },
        )
        await enqueue_client(peer_id)

    if requeue_client and client_id in CLIENTS:
        await enqueue_client(client_id)


async def relay_to_peer(client_id: str, message: dict) -> None:
    peer_id = PEERS.get(client_id)
    if not peer_id:
        await send_json(
            client_id,
            {
                "type": "error",
                "message": "No active peer is available for signaling.",
            },
        )
        return

    await send_json(
        peer_id,
        {
            **message,
            "from": client_id,
        },
    )


@router.websocket("/ws")
async def handle_signaling_websocket(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid4())
    CLIENTS[client_id] = websocket

    # Default fallback metadata
    user_meta = {
        "clerk_id": client_id,
        "name": "Anonymous",
        "gender": "male",
        "looking_for": "anyone",
        "age": 18,
        "country": "India",
        "blocked_users": [],
    }
    CLIENT_METADATA[client_id] = user_meta

    await send_json(
        client_id,
        {
            "type": "connected",
            "client_id": client_id,
        },
    )

    try:
        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")

            if message_type == "auth-sync":
                # Client sends authenticated Clerk profile info to WebSocket
                clerk_id = message.get("clerk_id")
                if clerk_id:
                    user_doc = await users_collection.find_one({"clerk_id": clerk_id}, {"_id": 0})
                    if user_doc:
                        CLIENT_METADATA[client_id] = user_doc

            elif message_type == "find-stranger":
                await enqueue_client(client_id)
            elif message_type == "skip":
                await disconnect_peer(client_id, requeue_client=True)
                await match_waiting_clients()
            elif message_type in {"offer", "answer", "ice-candidate", "chat-message"}:
                await relay_to_peer(client_id, message)
            elif message_type == "leave":
                await disconnect_peer(client_id, requeue_client=False)
            else:
                await send_json(
                    client_id,
                    {
                        "type": "error",
                        "message": f"Unsupported signaling message: {message_type}",
                    },
                )
    except WebSocketDisconnect:
        CLIENTS.pop(client_id, None)
        CLIENT_METADATA.pop(client_id, None)
        await disconnect_peer(client_id, requeue_client=False)
