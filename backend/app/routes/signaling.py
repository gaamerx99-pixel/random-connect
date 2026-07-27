from collections import deque
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

CLIENTS: dict[str, WebSocket] = {}
WAITING_CLIENTS: deque[str] = deque()
PEERS: dict[str, str] = {}


async def send_json(client_id: str, payload: dict) -> None:
    websocket = CLIENTS.get(client_id)
    if websocket:
        await websocket.send_json(payload)


def remove_from_waiting(client_id: str) -> None:
    try:
        WAITING_CLIENTS.remove(client_id)
    except ValueError:
        pass


async def match_waiting_clients() -> None:
    while len(WAITING_CLIENTS) >= 2:
        first_client_id = WAITING_CLIENTS.popleft()
        second_client_id = WAITING_CLIENTS.popleft()

        if first_client_id not in CLIENTS or second_client_id not in CLIENTS:
            continue

        room_id = str(uuid4())
        PEERS[first_client_id] = second_client_id
        PEERS[second_client_id] = first_client_id

        await send_json(
            first_client_id,
            {
                "type": "matched",
                "client_id": first_client_id,
                "peer_id": second_client_id,
                "room_id": room_id,
                "should_create_offer": True,
            },
        )
        await send_json(
            second_client_id,
            {
                "type": "matched",
                "client_id": second_client_id,
                "peer_id": first_client_id,
                "room_id": room_id,
                "should_create_offer": False,
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


async def handle_signaling_websocket(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid4())
    CLIENTS[client_id] = websocket

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

            if message_type == "find-stranger":
                await enqueue_client(client_id)
            elif message_type == "skip":
                await disconnect_peer(client_id, requeue_client=True)
                await match_waiting_clients()
            elif message_type in {"offer", "answer", "ice-candidate"}:
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
        await disconnect_peer(client_id, requeue_client=False)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await handle_signaling_websocket(websocket)
