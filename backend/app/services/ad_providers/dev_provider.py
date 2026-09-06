from typing import Any, Optional
from fastapi import HTTPException, status

from app.config import ENVIRONMENT, REWARDED_ADS_TEST_MODE
from app.services.ad_providers.base import RewardedAdProvider


class DevRewardedAdProvider(RewardedAdProvider):
    """
    Development test mode provider.
    Allows complete testing of verified 5-ad / 2-credit flow before
    connecting a real ad network provider.

    Strict security safeguards:
    - Never allowed in production.
    - Production rejects dev provider requests with 403 Forbidden.
    - Requires REWARDED_ADS_TEST_MODE=true in environment.
    """

    @property
    def name(self) -> str:
        return "dev"

    def is_configured(self) -> bool:
        # Development provider is only configured if we are NOT in production
        # and test mode is explicitly enabled.
        return ENVIRONMENT != "production" and REWARDED_ADS_TEST_MODE

    def verify_reward(
        self,
        clerk_id: str,
        reward_event_id: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> tuple[bool, Optional[str]]:
        # Hard check: Must reject in production or when test mode is disabled
        if ENVIRONMENT == "production" or not REWARDED_ADS_TEST_MODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Test reward mode is disabled in production.",
            )

        if not clerk_id:
            return False, "Missing user identifier."

        if not reward_event_id or not reward_event_id.strip():
            return False, "Missing reward event ID."

        # Valid dev reward event
        return True, None

    def handle_callback(
        self,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        if ENVIRONMENT == "production" or not REWARDED_ADS_TEST_MODE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Test reward mode is disabled in production.",
            )

        return {
            "status": "success",
            "provider": "dev",
            "verified": True,
        }
