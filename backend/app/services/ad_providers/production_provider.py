import hashlib
import hmac
from typing import Any, Optional
from fastapi import HTTPException, status

from app.config import (
    REWARDED_AD_PROVIDER,
)
import os
from app.services.ad_providers.base import RewardedAdProvider


class WebRewardedAdProvider(RewardedAdProvider):
    """
    Real Web Rewarded Ad Provider Adapter (e.g. Google Publisher Tag / AdSense
    Rewarded Web Ads, Adinplay, Monetag, etc.).

    Browser Compatibility:
    Web applications in standard desktop/mobile browsers cannot use native
    Android/iOS mobile-only SDKs directly. Web rewarded ads use web JavaScript
    SDKs (e.g. GPT out-of-page rewarded slots) with backend Server-Side Verification
    (SSV) callbacks or cryptographic token verification.

    Configuration:
    Configured via environment variables:
    - REWARDED_AD_PROVIDER (e.g. 'google_web', 'adinplay')
    - REWARDED_AD_CLIENT_ID (Publisher / Ad Unit ID)
    - REWARDED_AD_SECRET_KEY (Secret for verifying SSV signatures)

    If credentials are not set, this provider is explicitly marked as NOT CONFIGURED
    and rejects verification with 503 "Rewarded ad is currently unavailable. Please try again."
    """

    def __init__(self):
        self._provider_name = (REWARDED_AD_PROVIDER or "google_web").strip().lower()
        self._client_id = os.getenv("REWARDED_AD_CLIENT_ID", "").strip()
        self._secret_key = os.getenv("REWARDED_AD_SECRET_KEY", "").strip()

    @property
    def name(self) -> str:
        return self._provider_name

    def is_configured(self) -> bool:
        # A real provider is only configured when the provider name is set
        # (and not "dev") and required credentials (client_id / secret_key) are provided.
        return bool(
            self._provider_name
            and self._provider_name != "dev"
            and self._client_id
            and self._secret_key
        )

    def verify_reward(
        self,
        clerk_id: str,
        reward_event_id: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> tuple[bool, Optional[str]]:
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rewarded ad is currently unavailable. Please try again.",
            )

        if not reward_event_id or not reward_event_id.strip():
            return False, "Invalid or missing reward event ID from provider."

        # If provider payload includes a signature, verify it against secret_key
        if payload and "signature" in payload:
            raw_data = f"{clerk_id}:{reward_event_id}"
            expected_sig = hmac.new(
                self._secret_key.encode("utf-8"),
                raw_data.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(payload["signature"], expected_sig):
                return False, "Provider signature verification failed."

        return True, None

    def handle_callback(
        self,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rewarded ad provider is not configured.",
            )

        # Handle provider SSV webhook callback
        event_id = payload.get("reward_event_id") or payload.get("trans_id")
        user_id = payload.get("user_id") or payload.get("custom_data")
        sig = payload.get("signature") or headers.get("x-ad-signature", "")

        if not event_id or not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed provider callback payload.",
            )

        if self._secret_key:
            raw_data = f"{user_id}:{event_id}"
            expected_sig = hmac.new(
                self._secret_key.encode("utf-8"),
                raw_data.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid callback signature.",
                )

        return {
            "status": "verified",
            "provider": self.name,
            "reward_event_id": event_id,
            "clerk_id": user_id,
        }
