from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ProfileCreateUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = "male"  # male, female, other
    looking_for: Optional[str] = "female"  # male, female, anyone
    age: Optional[int] = 18
    country: Optional[str] = "India"
    city: Optional[str] = ""
    languages: Optional[List[str]] = Field(default_factory=lambda: ["English", "Hindi"])
    interests: Optional[List[str]] = Field(default_factory=list)
    image: Optional[str] = ""
    bio: Optional[str] = ""


class UserSchema(BaseModel):
    clerk_id: str
    email: str
    name: str = ""
    gender: str = "male"
    looking_for: str = "female"
    age: int = 18
    country: str = "India"
    city: str = ""
    languages: List[str] = Field(default_factory=lambda: ["English", "Hindi"])
    interests: List[str] = Field(default_factory=list)
    image: str = ""
    bio: str = ""
    is_online: bool = True
    is_profile_completed: bool = False
    blocked_users: List[str] = Field(default_factory=list)
    friends: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    last_seen: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class UserReportCreate(BaseModel):
    reported_clerk_id: str
    reason: str
    details: Optional[str] = ""


class UserBlockCreate(BaseModel):
    blocked_clerk_id: str
