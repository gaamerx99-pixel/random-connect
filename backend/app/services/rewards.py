from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from fastapi import HTTPException, status
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.config import ENVIRONMENT, REWARDED_ADS_TEST_MODE
from app.db import (
    reward_logs_collection,
    rewarded_ads_collection,
    users_collection,
)
from app.services.ad_providers import get_reward_provider

ADS_REQUIRED_FOR_FEMALE_UNLOCK = 1
FEMALE_CREDITS_PER_UNLOCK = 1


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def empty_reward_state() -> dict:
    provider = get_reward_provider()
    return {
        "ads_completed": 0,
        "ads_required": ADS_REQUIRED_FOR_FEMALE_UNLOCK,
        "female_match_credits": 0,
        "female_match_unlocked": False,
        "female_match_credits_max": FEMALE_CREDITS_PER_UNLOCK,
        "female_reward_unlocks": 0,
        "female_match_credits_consumed": 0,
        "test_mode": ENVIRONMENT != "production" and REWARDED_ADS_TEST_MODE,
        "provider_configured": provider.is_configured(),
    }


def serialize_reward_state(user: dict | None) -> dict:
    state = empty_reward_state()

    if not user:
        return state

    credits = min(
        int(user.get("female_match_credits") or 0),
        FEMALE_CREDITS_PER_UNLOCK,
    )

    state.update(
        {
            "ads_completed": int(
                user.get("female_reward_ads_completed") or 0
            ),
            "female_match_credits": credits,
            "female_match_unlocked": credits > 0,
            "female_reward_unlocks": int(
                user.get("female_reward_unlocks") or 0
            ),
            "female_match_credits_consumed": int(
                user.get("female_match_credits_consumed") or 0
            ),
        }
    )

    return state


def apply_ad_completion_to_state(state: dict) -> dict:
    ads_completed = int(state.get("female_reward_ads_completed") or 0) + 1
    unlocks = ads_completed // ADS_REQUIRED_FOR_FEMALE_UNLOCK
    remaining_ads = ads_completed % ADS_REQUIRED_FOR_FEMALE_UNLOCK
    credits_to_add = unlocks * FEMALE_CREDITS_PER_UNLOCK

    return {
        **state,
        "female_reward_ads_completed": remaining_ads,
        "female_match_credits": min(
            int(state.get("female_match_credits") or 0) + credits_to_add,
            FEMALE_CREDITS_PER_UNLOCK,
        ),
        "female_reward_unlocks": int(state.get("female_reward_unlocks") or 0)
        + unlocks,
    }


def requires_female_credit(user: dict, peer: dict) -> bool:
    return (
        str(user.get("gender") or "").lower() == "male"
        and str(user.get("looking_for") or "").lower() == "female"
        and str(peer.get("gender") or "").lower() == "female"
    )


async def get_female_reward_state(clerk_id: str) -> dict:
    try:
        user = await users_collection.find_one(
            {"clerk_id": clerk_id},
            {
                "_id": 0,
                "female_reward_ads_completed": 1,
                "female_match_credits": 1,
                "female_reward_unlocks": 1,
                "female_match_credits_consumed": 1,
            },
        )
    except Exception as e:
        print(f"[Reward State DB Error]: {e}")
        return empty_reward_state()

    if not user:
        return empty_reward_state()

    return serialize_reward_state(user)


async def verify_reward_completion(
    clerk_id: str,
    provider: Optional[str] = None,
    reward_event_id: Optional[str] = None,
    payload: Optional[dict[str, Any]] = None,
) -> dict:
    now = utc_now_iso()
    ad_provider = get_reward_provider(provider)
    event_id = reward_event_id or f"dev-{clerk_id}-{uuid4()}"

    # Ensure user profile exists in database
    try:
        user = await users_collection.find_one({"clerk_id": clerk_id})
        if not user:
            await users_collection.insert_one(
                {
                    "clerk_id": clerk_id,
                    "name": "User",
                    "gender": "male",
                    "looking_for": "female",
                    "female_reward_ads_completed": 0,
                    "female_match_credits": 0,
                    "female_reward_unlocks": 0,
                    "female_match_credits_consumed": 0,
                    "created_at": now,
                }
            )
    except Exception as db_err:
        print(f"[Reward User Init DB Warning]: {db_err}")

    # Verify with ad provider
    try:
        is_valid, error_msg = ad_provider.verify_reward(
            clerk_id, event_id, payload
        )
    except HTTPException as http_exc:
        # Log failure before re-raising
        try:
            await reward_logs_collection.insert_one(
                {
                    "clerk_id": clerk_id,
                    "provider": ad_provider.name,
                    "reward_event_id": event_id,
                    "status": "failed",
                    "reason": http_exc.detail,
                    "created_at": now,
                }
            )
        except Exception:
            pass
        raise http_exc

    if not is_valid:
        try:
            await reward_logs_collection.insert_one(
                {
                    "clerk_id": clerk_id,
                    "provider": ad_provider.name,
                    "reward_event_id": event_id,
                    "status": "failed",
                    "reason": error_msg or "Reward verification failed.",
                    "created_at": now,
                }
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Reward verification failed.",
        )

    # Record verified ad or detect duplicate
    try:
        await rewarded_ads_collection.insert_one(
            {
                "clerk_id": clerk_id,
                "provider": ad_provider.name,
                "reward_event_id": event_id,
                "verified": True,
                "created_at": now,
            }
        )
    except DuplicateKeyError:
        # Record duplicate attempt in reward logs
        try:
            await reward_logs_collection.insert_one(
                {
                    "clerk_id": clerk_id,
                    "provider": ad_provider.name,
                    "reward_event_id": event_id,
                    "status": "duplicate",
                    "created_at": now,
                }
            )
        except Exception:
            pass

        return {
            "duplicate": True,
            "reward_state": await get_female_reward_state(clerk_id),
        }
    except Exception as db_err:
        print(f"[Rewarded Ads Insert DB Warning]: {db_err}")

    # Record successful verified event in audit logs
    try:
        await reward_logs_collection.insert_one(
            {
                "clerk_id": clerk_id,
                "provider": ad_provider.name,
                "reward_event_id": event_id,
                "status": "verified",
                "created_at": now,
            }
        )
    except Exception:
        pass

    try:
        updated_user = await users_collection.find_one_and_update(
            {"clerk_id": clerk_id},
            [
                {
                    "$set": {
                        "female_reward_ads_completed": {
                            "$ifNull": ["$female_reward_ads_completed", 0]
                        },
                        "female_match_credits": {
                            "$ifNull": ["$female_match_credits", 0]
                        },
                        "female_reward_unlocks": {
                            "$ifNull": ["$female_reward_unlocks", 0]
                        },
                        "female_match_credits_consumed": {
                            "$ifNull": ["$female_match_credits_consumed", 0]
                        },
                    }
                },
                {
                    "$set": {
                        "_reward_total_ads": {
                            "$add": ["$female_reward_ads_completed", 1]
                        }
                    }
                },
                {
                    "$set": {
                        "_reward_unlocks": {
                            "$floor": {
                                "$divide": [
                                    "$_reward_total_ads",
                                    ADS_REQUIRED_FOR_FEMALE_UNLOCK,
                                ]
                            }
                        },
                        "female_reward_ads_completed": {
                            "$mod": [
                                "$_reward_total_ads",
                                ADS_REQUIRED_FOR_FEMALE_UNLOCK,
                            ]
                        },
                    }
                },
                {
                    "$set": {
                        "female_match_credits": {
                            "$min": [
                                FEMALE_CREDITS_PER_UNLOCK,
                                {
                                    "$add": [
                                        "$female_match_credits",
                                        {
                                            "$multiply": [
                                                "$_reward_unlocks",
                                                FEMALE_CREDITS_PER_UNLOCK,
                                            ]
                                        },
                                    ]
                                },
                            ]
                        },
                        "female_reward_unlocks": {
                            "$add": [
                                "$female_reward_unlocks",
                                "$_reward_unlocks",
                            ]
                        },
                        "last_rewarded_ad_at": now,
                    }
                },
                {"$unset": ["_reward_total_ads", "_reward_unlocks"]},
            ],
            return_document=ReturnDocument.AFTER,
        )
    except Exception as db_err:
        print(f"[Reward Update DB Warning]: {db_err}")
        if ENVIRONMENT != "production":
            return {
                "duplicate": False,
                "reward_state": {
                    "ads_completed": 0,
                    "ads_required": ADS_REQUIRED_FOR_FEMALE_UNLOCK,
                    "female_match_credits": FEMALE_CREDITS_PER_UNLOCK,
                    "female_match_unlocked": True,
                    "female_match_credits_max": FEMALE_CREDITS_PER_UNLOCK,
                    "female_reward_unlocks": 1,
                    "female_match_credits_consumed": 0,
                    "test_mode": True,
                    "provider_configured": True,
                },
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while recording reward.",
        )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    return {
        "duplicate": False,
        "reward_state": serialize_reward_state(updated_user),
    }


async def has_required_female_credit(clerk_id: str) -> bool:
    try:
        user = await users_collection.find_one(
            {
                "clerk_id": clerk_id,
                "female_match_credits": {"$gt": 0},
            },
            {"_id": 0, "clerk_id": 1},
        )
        return bool(user)
    except Exception as e:
        print(f"[Reward Credit Check DB Warning]: {e}")
        return False


async def consume_female_match_credit(clerk_id: str) -> bool:
    try:
        updated_user = await users_collection.find_one_and_update(
            {
                "clerk_id": clerk_id,
                "female_match_credits": {"$gt": 0},
            },
            [
                {
                    "$set": {
                        "female_match_credits": {
                            "$max": [
                                {
                                    "$subtract": [
                                        {
                                            "$min": [
                                                {
                                                    "$ifNull": [
                                                        "$female_match_credits",
                                                        0,
                                                    ]
                                                },
                                                FEMALE_CREDITS_PER_UNLOCK,
                                            ]
                                        },
                                        1,
                                    ]
                                },
                                0,
                            ]
                        },
                        "female_match_credits_consumed": {
                            "$add": [
                                {
                                    "$ifNull": [
                                        "$female_match_credits_consumed",
                                        0,
                                    ]
                                },
                                1,
                            ]
                        },
                        "last_female_credit_consumed_at": utc_now_iso(),
                    }
                }
            ],
            return_document=ReturnDocument.AFTER,
        )
        return bool(updated_user)
    except Exception as e:
        print(f"[Reward Credit Consume DB Warning]: {e}")
        return False
