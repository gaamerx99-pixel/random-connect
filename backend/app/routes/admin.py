from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

from app.db import (
    client,
    users_collection,
    reports_collection,
    blocks_collection,
    friends_collection,
    rewarded_ads_collection,
    reward_logs_collection,
)
from app.middleware.auth import verify_clerk_token


router = APIRouter()

USER_PROJECTION = {
    "_id": 0,
    "clerk_id": 1,
    "email": 1,
    "name": 1,
    "gender": 1,
    "looking_for": 1,
    "age": 1,
    "country": 1,
    "city": 1,
    "languages": 1,
    "interests": 1,
    "image": 1,
    "bio": 1,
    "is_online": 1,
    "is_profile_completed": 1,
    "blocked_users": 1,
    "friends": 1,
    "created_at": 1,
    "last_seen": 1,
    "role": 1,
    "female_reward_ads_completed": 1,
    "female_match_credits": 1,
    "female_reward_unlocks": 1,
    "female_match_credits_consumed": 1,
}

SAFE_USER_FIELDS = {
    "clerk_id",
    "email",
    "name",
    "gender",
    "looking_for",
    "age",
    "country",
    "city",
    "languages",
    "interests",
    "image",
    "bio",
    "is_online",
    "is_profile_completed",
    "blocked_users",
    "friends",
    "created_at",
    "last_seen",
    "role",
    "female_reward_ads_completed",
    "female_match_credits",
    "female_reward_unlocks",
    "female_match_credits_consumed",
}

REPORT_STATUS_VALUES = {"pending", "reviewed", "resolved"}


async def verify_admin(
    payload: dict = Depends(verify_clerk_token),
):
    """Allow access only to users with role=admin."""

    clerk_id = payload.get("sub")

    user = await users_collection.find_one(
        {"clerk_id": clerk_id},
        {"_id": 0, "role": 1, "clerk_id": 1},
    )

    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return payload


def database_error(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database connection failed. Please check MongoDB Atlas connectivity "
            f"and server logs. ({exc.__class__.__name__})"
        ),
    )


def clean_user(user: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not user:
        return None

    return {key: user.get(key) for key in SAFE_USER_FIELDS if key in user}


def serialize_id(value: Any) -> str:
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def with_report_status(report: dict[str, Any]) -> dict[str, Any]:
    report["id"] = serialize_id(report.pop("_id"))
    report["status"] = report.get("status") or "pending"
    return report


def page_response(
    items: list[dict[str, Any]],
    total: int,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max((total + page_size - 1) // page_size, 1),
    }


def search_regex(search: Optional[str]) -> Optional[dict[str, Any]]:
    if not search:
        return None
    return {"$regex": search.strip(), "$options": "i"}


async def user_lookup(clerk_ids: set[str]) -> dict[str, dict[str, Any]]:
    if not clerk_ids:
        return {}

    users = (
        await users_collection.find(
            {"clerk_id": {"$in": list(clerk_ids)}},
            {
                "_id": 0,
                "clerk_id": 1,
                "name": 1,
                "email": 1,
                "image": 1,
            },
        )
        .to_list(length=len(clerk_ids))
    )

    return {user["clerk_id"]: user for user in users if user.get("clerk_id")}


@router.get("/stats")
async def admin_stats(
    _: dict = Depends(verify_admin),
):
    """Basic statistics for the admin dashboard."""

    try:
        users_count = await users_collection.count_documents({})
        reports_count = await reports_collection.count_documents({})
        blocks_count = await blocks_collection.count_documents({})

        online_count = await users_collection.count_documents(
            {"is_online": True}
        )
        pending_reports = await reports_collection.count_documents(
            {
                "$or": [
                    {"status": {"$exists": False}},
                    {"status": "pending"},
                    {"status": None},
                ]
            }
        )
        verified_rewarded_ads = await rewarded_ads_collection.count_documents(
            {"verified": True}
        )
        duplicate_reward_attempts = await reward_logs_collection.count_documents(
            {"status": "duplicate"}
        )
        reward_verification_failures = await reward_logs_collection.count_documents(
            {"status": "failed"}
        )
        reward_totals = (
            await users_collection.aggregate(
                [
                    {
                        "$group": {
                            "_id": None,
                            "female_ad_unlocks": {
                                "$sum": {
                                    "$ifNull": [
                                        "$female_reward_unlocks",
                                        0,
                                    ]
                                }
                            },
                            "female_connection_credits_consumed": {
                                "$sum": {
                                    "$ifNull": [
                                        "$female_match_credits_consumed",
                                        0,
                                    ]
                                }
                            },
                            "remaining_female_connection_credits": {
                                "$sum": {
                                    "$ifNull": [
                                        "$female_match_credits",
                                        0,
                                    ]
                                }
                            },
                        }
                    }
                ]
            )
            .to_list(length=1)
        )

        recent_reports = (
            await reports_collection.find({})
            .sort("created_at", -1)
            .limit(5)
            .to_list(length=5)
        )
        recent_users = (
            await users_collection.find({}, USER_PROJECTION)
            .sort("created_at", -1)
            .limit(5)
            .to_list(length=5)
        )
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    offline_count = max(users_count - online_count, 0)

    report_user_ids = {
        value
        for report in recent_reports
        for value in [
            report.get("reporter_clerk_id"),
            report.get("reported_clerk_id"),
        ]
        if value
    }
    users_by_id = await user_lookup(report_user_ids)

    enriched_reports = []
    for report in recent_reports:
        serialized = with_report_status(report)
        serialized["reporter"] = users_by_id.get(
            serialized.get("reporter_clerk_id")
        )
        serialized["reported_user"] = users_by_id.get(
            serialized.get("reported_clerk_id")
        )
        enriched_reports.append(serialized)

    return {
        "users": users_count,
        "online_users": online_count,
        "offline_users": offline_count,
        "reports": reports_count,
        "pending_reports": pending_reports,
        "blocks": blocks_count,
        "online_percentage": round(
            (online_count / users_count) * 100,
            1,
        )
        if users_count
        else 0,
        "recent_reports": enriched_reports,
        "recent_users": [clean_user(user) for user in recent_users],
        "female_ad_unlocks": (
            reward_totals[0].get("female_ad_unlocks", 0)
            if reward_totals
            else 0
        ),
        "verified_rewarded_ads": verified_rewarded_ads,
        "female_connection_credits_consumed": (
            reward_totals[0].get(
                "female_connection_credits_consumed",
                0,
            )
            if reward_totals
            else 0
        ),
        "remaining_female_connection_credits": (
            reward_totals[0].get(
                "remaining_female_connection_credits",
                0,
            )
            if reward_totals
            else 0
        ),
        "reward_verification_failures": reward_verification_failures,
        "duplicate_reward_attempts": duplicate_reward_attempts,
    }


@router.get("/health")
async def admin_health(
    _: dict = Depends(verify_admin),
):
    try:
        await client.admin.command("ping")
        mongo_status = "connected"
    except Exception as exc:
        return {
            "api": "ok",
            "mongodb": "unavailable",
            "services": {
                "admin_api": "ok",
                "authentication": "protected",
                "database": "degraded",
            },
            "checked_at": datetime.utcnow().isoformat(),
            "database_error": exc.__class__.__name__,
        }

    return {
        "api": "ok",
        "mongodb": mongo_status,
        "services": {
            "admin_api": "ok",
            "authentication": "protected",
            "database": "ok",
        },
        "checked_at": datetime.utcnow().isoformat(),
    }


@router.get("/users")
async def admin_users(
    _: dict = Depends(verify_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    gender: Optional[str] = None,
    online: Optional[bool] = None,
    role: Optional[str] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    query: dict[str, Any] = {}

    regex = search_regex(search)
    if regex:
        query["$or"] = [
            {"name": regex},
            {"email": regex},
            {"clerk_id": regex},
            {"country": regex},
            {"city": regex},
        ]

    if gender and gender != "all":
        query["gender"] = gender

    if online is not None:
        query["is_online"] = online

    if role and role != "all":
        query["role"] = role

    sort_map = {
        "created_at": "created_at",
        "last_seen": "last_seen",
        "name": "name",
        "email": "email",
        "role": "role",
    }
    sort_field = sort_map.get(sort_by, "created_at")
    sort_direction = -1 if sort_order != "asc" else 1
    skip = (page - 1) * page_size

    try:
        total = await users_collection.count_documents(query)
        users = (
            await users_collection.find(query, USER_PROJECTION)
            .sort(sort_field, sort_direction)
            .skip(skip)
            .limit(page_size)
            .to_list(length=page_size)
        )
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    return page_response(
        [clean_user(user) for user in users],
        total,
        page,
        page_size,
    )


@router.get("/users/{clerk_id}")
async def admin_user_details(
    clerk_id: str,
    _: dict = Depends(verify_admin),
):
    try:
        user = await users_collection.find_one(
            {"clerk_id": clerk_id},
            USER_PROJECTION,
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        report_query = {
            "$or": [
                {"reporter_clerk_id": clerk_id},
                {"reported_clerk_id": clerk_id},
            ]
        }
        reports = (
            await reports_collection.find(report_query)
            .sort("created_at", -1)
            .limit(25)
            .to_list(length=25)
        )
        blocked_count = await blocks_collection.count_documents(
            {"blocked_id": clerk_id}
        )
        friends_count = len(user.get("friends") or [])
        if friends_count == 0:
            friends_count = await friends_collection.count_documents(
                {
                    "$or": [
                        {"user_a": clerk_id},
                        {"user_b": clerk_id},
                        {"clerk_id": clerk_id},
                    ]
                }
            )
    except HTTPException:
        raise
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    return {
        "user": clean_user(user),
        "friends_count": friends_count,
        "blocked_users_count": len(user.get("blocked_users") or []),
        "blocked_by_count": blocked_count,
        "reports": [with_report_status(report) for report in reports],
    }


@router.get("/reports")
async def admin_reports(
    _: dict = Depends(verify_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    reported_user: Optional[str] = None,
):
    query: dict[str, Any] = {}

    if status_filter and status_filter != "all":
        if status_filter == "pending":
            query["$or"] = [
                {"status": {"$exists": False}},
                {"status": "pending"},
                {"status": None},
            ]
        else:
            query["status"] = status_filter

    if reported_user:
        query["reported_clerk_id"] = reported_user

    regex = search_regex(search)
    if regex:
        search_clause = {
            "$or": [
                {"reporter_clerk_id": regex},
                {"reported_clerk_id": regex},
                {"reason": regex},
                {"details": regex},
            ]
        }
        if "$or" in query:
            query = {"$and": [query, search_clause]}
        else:
            query.update(search_clause)

    skip = (page - 1) * page_size

    try:
        total = await reports_collection.count_documents(query)
        reports = (
            await reports_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(page_size)
            .to_list(length=page_size)
        )
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    user_ids = {
        value
        for report in reports
        for value in [
            report.get("reporter_clerk_id"),
            report.get("reported_clerk_id"),
        ]
        if value
    }
    users_by_id = await user_lookup(user_ids)

    items = []
    for report in reports:
        serialized = with_report_status(report)
        serialized["reporter"] = users_by_id.get(
            serialized.get("reporter_clerk_id")
        )
        serialized["reported_user"] = users_by_id.get(
            serialized.get("reported_clerk_id")
        )
        items.append(serialized)

    return page_response(items, total, page, page_size)


@router.patch("/reports/{report_id}/status")
async def update_report_status(
    report_id: str,
    report_status: dict[str, str],
    admin_payload: dict = Depends(verify_admin),
):
    new_status = report_status.get("status")
    if new_status not in REPORT_STATUS_VALUES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report status must be pending, reviewed, or resolved.",
        )

    try:
        object_id = ObjectId(report_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report id.",
        ) from exc

    try:
        result = await reports_collection.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "status": new_status,
                    "reviewed_by": admin_payload.get("sub"),
                    "reviewed_at": datetime.utcnow().isoformat(),
                }
            },
        )
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    return {"message": "Report status updated.", "status": new_status}


@router.get("/blocks")
async def admin_blocks(
    _: dict = Depends(verify_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    query: dict[str, Any] = {}
    regex = search_regex(search)
    if regex:
        query["$or"] = [
            {"blocker_id": regex},
            {"blocked_id": regex},
            {"blocker_clerk_id": regex},
            {"blocked_clerk_id": regex},
        ]

    skip = (page - 1) * page_size

    try:
        total = await blocks_collection.count_documents(query)
        blocks = (
            await blocks_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(page_size)
            .to_list(length=page_size)
        )
    except (PyMongoError, ServerSelectionTimeoutError) as exc:
        raise database_error(exc) from exc

    user_ids = {
        value
        for block in blocks
        for value in [
            block.get("blocker_id") or block.get("blocker_clerk_id"),
            block.get("blocked_id") or block.get("blocked_clerk_id"),
        ]
        if value
    }
    users_by_id = await user_lookup(user_ids)

    items = []
    for block in blocks:
        block["id"] = serialize_id(block.pop("_id"))
        blocker_id = block.get("blocker_id") or block.get("blocker_clerk_id")
        blocked_id = block.get("blocked_id") or block.get("blocked_clerk_id")
        block["blocker"] = users_by_id.get(blocker_id)
        block["blocked_user"] = users_by_id.get(blocked_id)
        items.append(block)

    return page_response(items, total, page, page_size)
