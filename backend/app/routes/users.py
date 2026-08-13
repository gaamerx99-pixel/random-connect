from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import verify_clerk_token
from app.models.user import (
    ProfileCreateUpdate,
    UserBlockCreate,
    UserReportCreate,
)
from app.db import (
    users_collection,
    reports_collection,
    blocks_collection,
)


router = APIRouter()


# ============================================================
# HELPERS
# ============================================================

def normalize_gender(value):
    if not isinstance(value, str):
        return value

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


def normalize_looking_for(value):
    if not isinstance(value, str):
        return value

    value = value.strip().lower()

    aliases = {
        "any": "anyone",
        "all": "anyone",
        "both": "anyone",

        "m": "male",
        "man": "male",
        "boy": "male",

        "f": "female",
        "woman": "female",
        "girl": "female",
    }

    return aliases.get(value, value)


def build_user_name(
    email: str,
    first_name: str,
    last_name: str,
) -> str:

    full_name = (
        f"{first_name} {last_name}"
        .strip()
    )

    if full_name:
        return full_name

    if email and "@" in email:
        return email.split("@")[0]

    return "Anonymous"


# ============================================================
# SYNC USER
# ============================================================

@router.post("/sync")
async def sync_user(
    payload: dict = Depends(
        verify_clerk_token
    ),
):
    """
    Sync Clerk user with MongoDB.

    IMPORTANT:
    Existing user's matchmaking preferences
    such as gender / looking_for are NOT reset.
    """

    clerk_id = payload.get("sub")

    if not clerk_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid Clerk token.",
        )

    email = (
        payload.get("email")
        or payload.get("email_address")
        or ""
    )

    first_name = (
        payload.get("first_name")
        or ""
    )

    last_name = (
        payload.get("last_name")
        or ""
    )

    name = build_user_name(
        email,
        first_name,
        last_name,
    )

    image = (
        payload.get("image_url")
        or payload.get("picture")
        or ""
    )

    now = datetime.utcnow().isoformat()

    # ========================================================
    # FIND USER
    # ========================================================

    user = await users_collection.find_one(
        {
            "clerk_id": clerk_id
        }
    )

    # ========================================================
    # CREATE NEW USER
    # ========================================================

    if not user:

        new_user = {
            "clerk_id": clerk_id,

            "email": email,

            "name": name,

            # Default values for a new profile.
            "gender": "male",
            "looking_for": "anyone",

            "age": 18,

            "country": "India",

            "city": "",

            "languages": [
                "English",
                "Hindi",
            ],

            "interests": [],

            "image": image,

            "bio": "",

            "is_online": True,

            "is_profile_completed": False,

            "blocked_users": [],

            "friends": [],

            "created_at": now,

            "last_seen": now,
        }

        await users_collection.insert_one(
            new_user
        )

        new_user.pop(
            "_id",
            None,
        )

        return {
            "message": "User created",
            "user": new_user,
        }

    # ========================================================
    # EXISTING USER
    # ========================================================

    # IMPORTANT:
    # Do NOT update gender / looking_for here.
    #
    # Otherwise every login could reset the user's
    # matchmaking preference.

    sync_update = {
        "last_seen": now,
        "is_online": True,
    }

    # Update Clerk information only if available.
    if email:
        sync_update["email"] = email

    if name:
        sync_update["name"] = name

    if image:
        sync_update["image"] = image

    await users_collection.update_one(
        {
            "clerk_id": clerk_id
        },
        {
            "$set": sync_update
        },
    )

    # Get fresh user after update.
    updated_user = await users_collection.find_one(
        {
            "clerk_id": clerk_id
        },
        {
            "_id": 0
        },
    )

    return {
        "message": "User synced",
        "user": updated_user,
    }


# ============================================================
# GET MY PROFILE
# ============================================================

@router.get("/me")
async def get_my_profile(
    payload: dict = Depends(
        verify_clerk_token
    ),
):
    """
    Get current user's profile.
    """

    clerk_id = payload.get("sub")

    if not clerk_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid Clerk token.",
        )

    user = await users_collection.find_one(
        {
            "clerk_id": clerk_id
        },
        {
            "_id": 0
        },
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail=(
                "User profile not found. "
                "Please sync first."
            ),
        )

    return user


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.put("/profile")
async def update_profile(
    profile_data: ProfileCreateUpdate,
    payload: dict = Depends(
        verify_clerk_token
    ),
):
    """
    Update user's profile and matchmaking preferences.
    """

    clerk_id = payload.get("sub")

    if not clerk_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid Clerk token.",
        )

    # ========================================================
    # Check user exists
    # ========================================================

    existing_user = await users_collection.find_one(
        {
            "clerk_id": clerk_id
        }
    )

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # ========================================================
    # Convert Pydantic model to dict
    # ========================================================

    update_dict = profile_data.model_dump(
        exclude_none=True
    )

    # ========================================================
    # Normalize matchmaking values
    # ========================================================

    if "gender" in update_dict:

        normalized_gender = normalize_gender(
            update_dict["gender"]
        )

        if normalized_gender not in {
            "male",
            "female",
            "anyone",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid gender value."
                ),
            )

        update_dict["gender"] = (
            normalized_gender
        )

    if "looking_for" in update_dict:

        normalized_looking_for = (
            normalize_looking_for(
                update_dict["looking_for"]
            )
        )

        if normalized_looking_for not in {
            "male",
            "female",
            "anyone",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid looking_for value."
                ),
            )

        update_dict[
            "looking_for"
        ] = normalized_looking_for

    # ========================================================
    # Metadata
    # ========================================================

    update_dict[
        "is_profile_completed"
    ] = True

    update_dict[
        "last_seen"
    ] = datetime.utcnow().isoformat()

    # ========================================================
    # SAVE TO MONGODB
    # ========================================================

    result = await users_collection.update_one(
        {
            "clerk_id": clerk_id
        },
        {
            "$set": update_dict
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # ========================================================
    # GET UPDATED PROFILE
    # ========================================================

    updated_user = await users_collection.find_one(
        {
            "clerk_id": clerk_id
        },
        {
            "_id": 0
        },
    )

    return {
        "message": "Profile updated successfully",
        "user": updated_user,
    }


# ============================================================
# REPORT USER
# ============================================================

@router.post("/report")
async def report_user(
    report: UserReportCreate,
    payload: dict = Depends(
        verify_clerk_token
    ),
):
    """
    Report a stranger user.
    """

    reporter_id = payload.get("sub")

    if not reporter_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid Clerk token.",
        )

    doc = {
        "reporter_clerk_id": reporter_id,

        "reported_clerk_id":
            report.reported_clerk_id,

        "reason":
            report.reason,

        "details":
            report.details,

        "created_at":
            datetime.utcnow().isoformat(),
    }

    await reports_collection.insert_one(
        doc
    )

    return {
        "message":
            "Report submitted successfully."
    }


# ============================================================
# BLOCK USER
# ============================================================

@router.post("/block")
async def block_user(
    block: UserBlockCreate,
    payload: dict = Depends(
        verify_clerk_token
    ),
):
    """
    Block a user so they are never matched again.
    """

    blocker_id = payload.get("sub")

    if not blocker_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid Clerk token.",
        )

    target_id = block.blocked_clerk_id

    await users_collection.update_one(
        {
            "clerk_id": blocker_id
        },
        {
            "$addToSet": {
                "blocked_users": target_id
            }
        },
    )

    await blocks_collection.insert_one(
        {
            "blocker_id": blocker_id,

            "blocked_id": target_id,

            "created_at":
                datetime.utcnow().isoformat(),
        }
    )

    return {
        "message":
            "User blocked successfully."
    }