from collections import deque
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db import users_collection
from app.middleware.auth import verify_clerk_token_string

router = APIRouter()


# ============================================================
# CONNECTION STATE
# ============================================================

CLIENTS: dict[str, WebSocket] = {}
CLIENT_METADATA: dict[str, dict] = {}

WAITING_CLIENTS: deque[str] = deque()

# client_id -> peer_id
PEERS: dict[str, str] = {}


# ============================================================
# HELPERS
# ============================================================

async def send_json(client_id: str, payload: dict) -> bool:
    """
    Safely send JSON to a connected client.

    Returns:
        True  -> message sent
        False -> client is unavailable / send failed
    """

    websocket = CLIENTS.get(client_id)

    if websocket is None:
        return False

    try:
        await websocket.send_json(payload)
        return True
    except Exception:
        return False


def remove_from_waiting(client_id: str) -> None:
    """
    Remove client from matchmaking queue if present.
    """

    try:
        WAITING_CLIENTS.remove(client_id)
    except ValueError:
        pass


def normalize_gender(value: object, default: str = "male") -> str:
    """
    Normalize gender values coming from database/profile.
    """

    if not isinstance(value, str):
        return default

    value = value.strip().lower()

    aliases = {
        "m": "male",
        "man": "male",
        "boy": "male",

        "f": "female",
        "woman": "female",
        "girl": "female",

        "any": "anyone",
        "all": "anyone",
    }

    return aliases.get(value, value)


def normalize_looking_for(
    value: object,
    default: str = "anyone",
) -> str:
    """
    Normalize looking_for values.
    """

    if not isinstance(value, str):
        return default

    value = value.strip().lower()

    aliases = {
        "any": "anyone",
        "all": "anyone",
        "both": "anyone",

        "m": "male",
        "man": "male",

        "f": "female",
        "woman": "female",
    }

    return aliases.get(value, value)


def requires_female_search_credit(user: dict) -> bool:
    return (
        normalize_gender(user.get("gender"), "male") == "male"
        and normalize_looking_for(user.get("looking_for"), "anyone") == "female"
    )


def sanitize_metadata(
    metadata: dict,
    fallback_client_id: str,
) -> dict:
    """
    Create safe, predictable metadata for matchmaking.
    """

    return {
        "clerk_id": str(
            metadata.get("clerk_id")
            or fallback_client_id
        ),

        "name": str(
            metadata.get("name")
            or "Stranger"
        ),

        "gender": normalize_gender(
            metadata.get("gender"),
            "male",
        ),

        "looking_for": normalize_looking_for(
            metadata.get("looking_for"),
            "anyone",
        ),

        "age": (
            metadata.get("age")
            if isinstance(metadata.get("age"), int)
            else 18
        ),

        "country": str(
            metadata.get("country")
            or "India"
        ),

        "image": str(
            metadata.get("image")
            or ""
        ),

        "blocked_users": (
            metadata.get("blocked_users")
            if isinstance(
                metadata.get("blocked_users"),
                list,
            )
            else []
        ),
    }


def is_eligible_pair(
    user_a: dict,
    user_b: dict,
) -> bool:
    """
    Check whether two users are allowed to match.

    Both users must accept each other.
    """

    clerk_a = str(
        user_a.get("clerk_id")
        or ""
    )

    clerk_b = str(
        user_b.get("clerk_id")
        or ""
    )

    # --------------------------------------------------------
    # Never match a client with itself.
    # --------------------------------------------------------

    if clerk_a and clerk_b and clerk_a == clerk_b:
        return False

    # --------------------------------------------------------
    # Block list
    # --------------------------------------------------------

    blocked_a = user_a.get(
        "blocked_users",
        [],
    )

    blocked_b = user_b.get(
        "blocked_users",
        [],
    )

    if not isinstance(blocked_a, list):
        blocked_a = []

    if not isinstance(blocked_b, list):
        blocked_b = []

    if clerk_b in blocked_a:
        return False

    if clerk_a in blocked_b:
        return False

    # --------------------------------------------------------
    # Normalize preferences
    # --------------------------------------------------------

    gender_a = normalize_gender(
        user_a.get("gender"),
        "male",
    )

    looking_a = normalize_looking_for(
        user_a.get("looking_for"),
        "anyone",
    )

    gender_b = normalize_gender(
        user_b.get("gender"),
        "female",
    )

    looking_b = normalize_looking_for(
        user_b.get("looking_for"),
        "anyone",
    )

    # --------------------------------------------------------
    # Check A -> B
    # --------------------------------------------------------

    a_accepts_b = (
        looking_a == "anyone"
        or looking_a == gender_b
    )

    # --------------------------------------------------------
    # Check B -> A
    # --------------------------------------------------------

    b_accepts_a = (
        looking_b == "anyone"
        or looking_b == gender_a
    )

    return a_accepts_b and b_accepts_a


def build_peer_profile(metadata: dict) -> dict:
    """
    Build the profile object sent to the stranger.
    """

    return {
        "clerk_id": str(
            metadata.get("clerk_id")
            or ""
        ),

        "name": str(
            metadata.get("name")
            or "Stranger"
        ),

        "gender": str(
            metadata.get("gender")
            or ""
        ),

        "age": (
            metadata.get("age")
            if isinstance(metadata.get("age"), int)
            else 18
        ),

        "country": str(
            metadata.get("country")
            or ""
        ),

        "image": str(
            metadata.get("image")
            or ""
        ),
    }


# ============================================================
# MATCHMAKING
# ============================================================

async def match_waiting_clients() -> None:
    """
    Match compatible clients from the waiting queue.
    """

    if len(WAITING_CLIENTS) < 2:
        return

    waiting_list = list(WAITING_CLIENTS)

    matched_pairs: list[tuple[str, str]] = []

    i = 0

    while i < len(waiting_list):

        client_a = waiting_list[i]

        # ----------------------------------------------------
        # Remove stale client
        # ----------------------------------------------------

        if client_a not in CLIENTS:
            remove_from_waiting(client_a)
            waiting_list.pop(i)
            continue

        meta_a = CLIENT_METADATA.get(
            client_a,
            {},
        )

        match_found = False

        j = i + 1

        while j < len(waiting_list):

            client_b = waiting_list[j]

            # ------------------------------------------------
            # Remove stale client
            # ------------------------------------------------

            if client_b not in CLIENTS:
                remove_from_waiting(client_b)
                waiting_list.pop(j)
                continue

            # ------------------------------------------------
            # Never match same client
            # ------------------------------------------------

            if client_a == client_b:
                waiting_list.pop(j)
                continue

            meta_b = CLIENT_METADATA.get(
                client_b,
                {},
            )

            # ------------------------------------------------
            # Check compatibility
            # ------------------------------------------------

            if is_eligible_pair(
                meta_a,
                meta_b,
            ):
                matched_pairs.append(
                    (
                        client_a,
                        client_b,
                    )
                )

                waiting_list.pop(j)
                waiting_list.pop(i)

                match_found = True

                break

            j += 1

        if not match_found:
            i += 1

    # --------------------------------------------------------
    # Create matches
    # --------------------------------------------------------

    for client_a, client_b in matched_pairs:

        remove_from_waiting(client_a)
        remove_from_waiting(client_b)

        # Don't match clients already connected.
        if (
            client_a in PEERS
            or client_b in PEERS
        ):
            continue

        room_id = str(uuid4())

        PEERS[client_a] = client_b
        PEERS[client_b] = client_a

        meta_a = CLIENT_METADATA.get(
            client_a,
            {},
        )

        meta_b = CLIENT_METADATA.get(
            client_b,
            {},
        )

        # ----------------------------------------------------
        # Client A creates offer
        # ----------------------------------------------------

        await send_json(
            client_a,
            {
                "type": "matched",

                "client_id": client_a,

                "peer_id": client_b,

                "room_id": room_id,

                "should_create_offer": True,

                "peer_profile": build_peer_profile(
                    meta_b
                ),
            },
        )

        # ----------------------------------------------------
        # Client B receives offer
        # ----------------------------------------------------

        await send_json(
            client_b,
            {
                "type": "matched",

                "client_id": client_b,

                "peer_id": client_a,

                "room_id": room_id,

                "should_create_offer": False,

                "peer_profile": build_peer_profile(
                    meta_a
                ),
            },
        )


# ============================================================
# QUEUE MANAGEMENT
# ============================================================

async def enqueue_client(
    client_id: str,
) -> None:

    # Client no longer exists.
    if client_id not in CLIENTS:
        return

    # Already connected to someone.
    if client_id in PEERS:
        return

    # Already waiting.
    if client_id in WAITING_CLIENTS:
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


async def disconnect_peer(
    client_id: str,
    *,
    requeue_client: bool,
) -> None:

    remove_from_waiting(client_id)

    peer_id = PEERS.pop(
        client_id,
        None,
    )

    # --------------------------------------------------------
    # Notify peer
    # --------------------------------------------------------

    if peer_id:

        PEERS.pop(
            peer_id,
            None,
        )

        await send_json(
            peer_id,
            {
                "type": "peer-disconnected",
                "peer_id": client_id,
            },
        )

        # Requeue the remaining user.
        if peer_id in CLIENTS:
            await enqueue_client(peer_id)

    # --------------------------------------------------------
    # Requeue current client if requested
    # --------------------------------------------------------

    if (
        requeue_client
        and client_id in CLIENTS
    ):
        await enqueue_client(client_id)


# ============================================================
# WEBRTC SIGNAL RELAY
# ============================================================

async def relay_to_peer(
    client_id: str,
    message: dict,
) -> None:

    peer_id = PEERS.get(client_id)

    if not peer_id:
        await send_json(
            client_id,
            {
                "type": "error",
                "message": (
                    "No active peer is available "
                    "for signaling."
                ),
            },
        )
        return

    if peer_id not in CLIENTS:
        PEERS.pop(
            client_id,
            None,
        )

        await send_json(
            client_id,
            {
                "type": "error",
                "message": (
                    "Your peer disconnected."
                ),
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


# ============================================================
# WEBSOCKET
# ============================================================

@router.websocket("/ws")
async def handle_signaling_websocket(
    websocket: WebSocket,
):
    await websocket.accept()

    client_id = str(uuid4())

    CLIENTS[client_id] = websocket

    # --------------------------------------------------------
    # Default metadata
    # --------------------------------------------------------

    user_meta = sanitize_metadata(
        {
            "clerk_id": client_id,
            "name": "Anonymous",
            "gender": "male",
            "looking_for": "anyone",
            "age": 18,
            "country": "India",
            "blocked_users": [],
        },
        client_id,
    )

    CLIENT_METADATA[client_id] = user_meta

    # --------------------------------------------------------
    # Confirm websocket connection
    # --------------------------------------------------------

    print(f"[Signaling] WebSocket client connected: {client_id}")

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

            message_type = message.get(
                "type"
            )

            # =================================================
            # AUTH SYNC
            # =================================================

            if message_type == "auth-sync":

                token = message.get(
                    "token"
                )

                clerk_id = message.get(
                    "clerk_id"
                )

                if token:
                    try:
                        payload = await verify_clerk_token_string(
                            str(token)
                        )
                        token_sub = payload.get("sub")
                        if token_sub:
                            clerk_id = token_sub
                    except Exception as auth_err:
                        print(f"[Signaling] Token verification notice for {client_id}: {auth_err}")

                if not clerk_id:
                    print(f"[Signaling] Missing Clerk user ID for {client_id}")
                    await send_json(
                        client_id,
                        {
                            "type": "error",
                            "message": (
                                "Missing Clerk user ID."
                            ),
                        },
                    )

                    continue

                user_doc = None
                try:
                    user_doc = await users_collection.find_one(
                        {
                            "clerk_id": clerk_id
                        },
                        {
                            "_id": 0
                        },
                    )
                except Exception as db_err:
                    print(f"[Signaling Auth Sync DB Warning for {client_id}]: {db_err}")

                # ---------------------------------------------
                # User exists in MongoDB
                # ---------------------------------------------

                if user_doc:

                    CLIENT_METADATA[
                        client_id
                    ] = sanitize_metadata(
                        user_doc,
                        client_id,
                    )

                # ---------------------------------------------
                # User doesn't exist in MongoDB
                # ---------------------------------------------

                else:

                    current_meta = CLIENT_METADATA.get(
                        client_id,
                        {},
                    )

                    current_meta[
                        "clerk_id"
                    ] = clerk_id

                    CLIENT_METADATA[
                        client_id
                    ] = sanitize_metadata(
                        current_meta,
                        client_id,
                    )

                # ---------------------------------------------
                # Confirm auth sync
                # ---------------------------------------------

                print(f"[Signaling] Authentication SUCCESS: client_id={client_id}, clerk_id={clerk_id}")

                await send_json(
                    client_id,
                    {
                        "type": "auth-synced",
                        "clerk_id": clerk_id,
                    },
                )

            # =================================================
            # FIND STRANGER
            # =================================================

            elif message_type == "find-stranger":

                # If already connected, don't enqueue again.
                if client_id in PEERS:
                    await send_json(
                        client_id,
                        {
                            "type": "error",
                            "message": (
                                "You are already connected "
                                "to a stranger."
                            ),
                        },
                    )

                    continue

                await enqueue_client(
                    client_id
                )

            # =================================================
            # SKIP
            # =================================================

            elif message_type == "skip":

                await disconnect_peer(
                    client_id,
                    requeue_client=True,
                )

                await match_waiting_clients()

            # =================================================
            # WEBRTC SIGNALING
            # =================================================

            elif message_type in {
                "offer",
                "answer",
                "ice-candidate",
                "chat-message",
            }:

                await relay_to_peer(
                    client_id,
                    message,
                )

            # =================================================
            # LEAVE
            # =================================================

            elif message_type == "leave":

                await disconnect_peer(
                    client_id,
                    requeue_client=False,
                )

                break

            # =================================================
            # UNKNOWN MESSAGE
            # =================================================

            else:

                await send_json(
                    client_id,
                    {
                        "type": "error",
                        "message": (
                            "Unsupported signaling "
                            f"message: {message_type}"
                        ),
                    },
                )

    except WebSocketDisconnect:

        # ----------------------------------------------------
        # Remove websocket
        # ----------------------------------------------------

        print(f"[Signaling] WebSocket client disconnected: client_id={client_id}")

        CLIENTS.pop(
            client_id,
            None,
        )

        CLIENT_METADATA.pop(
            client_id,
            None,
        )

        # ----------------------------------------------------
        # Clean peer / queue state
        # ----------------------------------------------------

        await disconnect_peer(
            client_id,
            requeue_client=False,
        )

    except Exception as exc:

        # ----------------------------------------------------
        # Unexpected websocket error
        # ----------------------------------------------------

        print(f"[Signaling] WebSocket unexpected error for client_id={client_id}: {exc}")

        CLIENTS.pop(
            client_id,
            None,
        )

        CLIENT_METADATA.pop(
            client_id,
            None,
        )

        await disconnect_peer(
            client_id,
            requeue_client=False,
        )