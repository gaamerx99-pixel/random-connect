from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================
# PROFILE CREATE / UPDATE
# ============================================================

class ProfileCreateUpdate(BaseModel):
    """
    Used for partial profile updates.

    IMPORTANT:
    All fields are None by default so that an update request
    only changes the fields actually sent by the frontend.
    """

    name: Optional[str] = None

    gender: Optional[str] = None

    looking_for: Optional[str] = None

    age: Optional[int] = None

    country: Optional[str] = None

    city: Optional[str] = None

    languages: Optional[List[str]] = None

    interests: Optional[List[str]] = None

    image: Optional[str] = None

    bio: Optional[str] = None


# ============================================================
# USER SCHEMA
# ============================================================

class UserSchema(BaseModel):
    clerk_id: str

    email: str

    name: str = ""

    gender: str = "male"

    looking_for: str = "anyone"

    age: int = 18

    country: str = "India"

    city: str = ""

    languages: List[str] = Field(
        default_factory=lambda: [
            "English",
            "Hindi",
        ]
    )

    interests: List[str] = Field(
        default_factory=list
    )

    image: str = ""

    bio: str = ""

    is_online: bool = True

    is_profile_completed: bool = False

    blocked_users: List[str] = Field(
        default_factory=list
    )

    friends: List[str] = Field(
        default_factory=list
    )

    created_at: str = Field(
        default_factory=lambda:
            datetime.utcnow().isoformat()
    )

    last_seen: str = Field(
        default_factory=lambda:
            datetime.utcnow().isoformat()
    )


# ============================================================
# REPORT
# ============================================================

class UserReportCreate(BaseModel):
    reported_clerk_id: str

    reason: str

    details: Optional[str] = ""


# ============================================================
# BLOCK
# ============================================================

class UserBlockCreate(BaseModel):
    blocked_clerk_id: str


# ============================================================
# REWARDED ADS
# ============================================================

class RewardedAdCompletionCreate(BaseModel):
    provider: Optional[str] = None

    reward_event_id: Optional[str] = None
