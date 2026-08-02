from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import verify_clerk_token
from app.models.user import ProfileCreateUpdate, UserBlockCreate, UserReportCreate
from app.db import users_collection, reports_collection, blocks_collection

router = APIRouter()


@router.post("/sync")
async def sync_user(payload: dict = Depends(verify_clerk_token)):
    """Sync user with MongoDB after Clerk login."""
    clerk_id = payload.get("sub")
    email = payload.get("email", payload.get("email_address", ""))
    first_name = payload.get("first_name", "")
    last_name = payload.get("last_name", "")
    name = f"{first_name} {last_name}".strip() or email.split("@")[0] if email else "Anonymous"
    image = payload.get("image_url", payload.get("picture", ""))

    user = await users_collection.find_one({"clerk_id": clerk_id})
    if not user:
        new_user = {
            "clerk_id": clerk_id,
            "email": email,
            "name": name,
            "gender": "male",
            "looking_for": "female",
            "age": 18,
            "country": "India",
            "city": "",
            "languages": ["English", "Hindi"],
            "interests": [],
            "image": image,
            "bio": "",
            "is_online": True,
            "is_profile_completed": False,
            "blocked_users": [],
            "friends": [],
            "created_at": datetime.utcnow().isoformat(),
            "last_seen": datetime.utcnow().isoformat(),
        }
        await users_collection.insert_one(new_user)
        new_user.pop("_id", None)
        return {"message": "User created", "user": new_user}

    # Update last_seen
    await users_collection.update_one(
        {"clerk_id": clerk_id},
        {"$set": {"last_seen": datetime.utcnow().isoformat(), "is_online": True}},
    )
    user.pop("_id", None)
    return {"message": "User synced", "user": user}


@router.get("/me")
async def get_my_profile(payload: dict = Depends(verify_clerk_token)):
    """Get current user's profile from MongoDB."""
    clerk_id = payload.get("sub")
    user = await users_collection.find_one({"clerk_id": clerk_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Please sync first.")
    return user


@router.put("/profile")
async def update_profile(profile_data: ProfileCreateUpdate, payload: dict = Depends(verify_clerk_token)):
    """Update user's demographic & matchmaking preferences."""
    clerk_id = payload.get("sub")

    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_dict["is_profile_completed"] = True
    update_dict["last_seen"] = datetime.utcnow().isoformat()

    result = await users_collection.update_one({"clerk_id": clerk_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    updated_user = await users_collection.find_one({"clerk_id": clerk_id}, {"_id": 0})
    return {"message": "Profile updated successfully", "user": updated_user}


@router.post("/report")
async def report_user(report: UserReportCreate, payload: dict = Depends(verify_clerk_token)):
    """Report a stranger user."""
    reporter_id = payload.get("sub")
    doc = {
        "reporter_clerk_id": reporter_id,
        "reported_clerk_id": report.reported_clerk_id,
        "reason": report.reason,
        "details": report.details,
        "created_at": datetime.utcnow().isoformat(),
    }
    await reports_collection.insert_one(doc)
    return {"message": "Report submitted successfully."}


@router.post("/block")
async def block_user(block: UserBlockCreate, payload: dict = Depends(verify_clerk_token)):
    """Block a user so they are never matched again."""
    blocker_id = payload.get("sub")
    target_id = block.blocked_clerk_id

    await users_collection.update_one(
        {"clerk_id": blocker_id},
        {"$addToSet": {"blocked_users": target_id}},
    )
    await blocks_collection.insert_one({
        "blocker_id": blocker_id,
        "blocked_id": target_id,
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"message": "User blocked successfully."}
